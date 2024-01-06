const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db/dbConfig");
const nodemailer = require("nodemailer");
require("dotenv").config();

const {
  UserAlreadyExistsError,
  EmailHostError,
  SQLError,
  PasswordError,
  AuthError,
  MultiStatusError,
  TokenError,
  LoginTokenError,
} = require("../lib/errorHandler/customErrors");
const { getRoles } = require("../lib/helper/helper");

const htmlContent = `
  <html>
    <body>
      <h3>Hello, World!</h3>
      $(firstName) $(lastName)
      <a href="$(url)" target="_blank">Confirm your Account</a>
    </body>
  </html>
`;

const getAllUsers = async () => {
  try {
    const allUsers = await db.any("SELECT * FROM client_user");

    return allUsers;
  } catch (e) {
    throw e;
  }
};

const createUser = async (data) => {
  const { first_name, last_name, address, password, email, is_renter } = data;

  let salt = await bcrypt.genSalt(10);

  let hashedPassword = await bcrypt.hash(password, salt);

  try {
    const checkLogs = await db.any(
      `select * from auth_users where user_email ilike $1`,
      email,
    );
    if (checkLogs[0]) {
      throw new UserAlreadyExistsError(
        `Cannot register with a previously used email: ${email}`,
      );
    }
    const res = await db.any(
      `insert into client_user(first_name, last_name, address, email, password) values ($1, $2, $3, $4, $5) returning *`,
      [first_name, last_name, address, email, hashedPassword],
    );

    if (res[0]) {
      let jwtToken = jwt.sign(
        {
          first_name,
          last_name,
          email,
          is_renter,
          id: res[0]["id"],
        },
        process.env.JWT_TOKEN_SECRET_KEY,
        { expiresIn: "7d" },
      );

      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.EMAIL_ADD,
          pass: process.env.PASS,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_ADD,
        to: email,
        subject: "welcome and confirm",
        html: htmlContent
          .replace(
            "$(url)",
            process.env.NODE_ENV === "development"
              ? `http://localhost:3000/confirmation?k=${jwtToken}`
              : `https://carvalet.netlify.app/confirmation?k=${jwtToken}`,
          )
          .replace("$(firstName)", first_name)
          .replace("$(lastName)", last_name),
      };

      const info = await transporter.sendMail(mailOptions);
      console.log("Email sent:", info.response);
      return { message: `Email sent to ${email} successfully` };
    } else {
      throw new EmailHostError(`Email host server error`);
    }
  } catch (error) {
    if (
      error instanceof UserAlreadyExistsError ||
      error instanceof EmailHostError
    ) {
      throw error;
    } else
      throw new UserAlreadyExistsError(
        `User with email ${email} already exists.`,
      );
  }
};

const login = async (data, tokenflag) => {
  try {
    const { email, password } = data;

    const foundUser = await db.any(
      `select
      c.id,
      c.email,
      c.pmt_verified,
      c.password,
      c.client_background_verified,
      r.renter_address,
      r.background_verified,
      r.r_pmt_verified
    from
      client_user c
    left join renter_user r on
      c.id = r.renter_id
    where
      c.email ilike $1
      and c.is_auth = true`,
      email,
    );

    if (foundUser.length === 0) {
      throw new PasswordError("Invalid email address", "user login error");
    } else {
      let user = foundUser[0];
      if (tokenflag && user.email != tokenflag) {
        throw new LoginTokenError();
      }

      let comparedPassword = await bcrypt.compare(password, user.password);

      if (!comparedPassword) {
        throw new PasswordError(
          "Please check your email and password",
          "login credential error",
        );
      } else {
        let jwtToken = jwt.sign(
          {
            id: user.id,
            email: user.email,
          },
          process.env.JWT_TOKEN_SECRET_KEY,
          { expiresIn: "15m" },
        );

        let jwtTokenRefresh = jwt.sign(
          {
            id: user.id,
            email: user.email,
          },
          process.env.JWT_TOKENREF_SECRET_KEY,
          { expiresIn: 180 * 24 * 60 * 60 },
        );

        await db.any(
          `insert into refresh_tokens(client_id, token) values ($1, $2) returning *`,
          [user.id, jwtTokenRefresh],
        );

        return {
          accessToken: [jwtToken, jwtTokenRefresh],
          roles: getRoles(user),
        };
      }
    }
  } catch (e) {
    if (e instanceof PasswordError) throw e;
    else if (e instanceof LoginTokenError) throw e;
    else throw new SQLError(e);
  }
};
//when a user clicks on email confirmation link
const authLogin = async (id, is_renter) => {
  try {
    const auUser = await db.any(
      //set client_user is_auth to true
      `Update client_user set is_auth = true where id in (select id from client_user where id=$1 and is_auth=false) returning *`,
      id,
    );

    if (auUser.length === 0) {
      throw new AuthError(`Invalid id: ${id}`);
    } else {
      let sqlArr = auUser[0];
      if (is_renter) {
        try {
          const makeRenter = await db.any(
            `insert into renter_user(renter_id, renter_address, renter_email) values ((select id from client_user where id = $1), $2, $3) returning *`,
            [sqlArr.id, sqlArr.address, sqlArr.email],
          );

          sqlArr["renterInfo"] = makeRenter[0];
        } catch (e) {
          throw new MultiStatusError(e, sqlArr);
        }
      }
      return sqlArr;
    }
  } catch (e) {
    if (e instanceof MultiStatusError || e instanceof AuthError) {
      throw e;
    } else throw { message: "server error", error: e.name, status: 500 };
  }
};
//user profile information
const getInfo = async (args) => {
  try {
    const userJoin = await db.any(
      `select
      c.id,
      c.first_name,
      c.last_name,
      c.address,
      c.email,
      c.pmt_verified,
      c.password,
      c.client_background_verified,
      r.renter_address,
      r.renter_email,
      r.background_verified,
      r.r_pmt_verified,
      au.all_is_auth
    from
      (
      select
        *
      from
        client_user
      where
        id = $1) c
    left join renter_user r on
      c.id = r.renter_id
    join auth_users au on
      c.id = au.user_id`,
      args,
    );
    if (userJoin.length === 0) {
      throw new TokenError(
        "Invalid lookup id",
        "refresh token not found in db",
      );
    } else {
      return { ...userJoin[0], roles: getRoles(userJoin[0]) };
    }
  } catch (e) {
    if (e instanceof TokenError) throw e;
    else;
    throw {
      error: e.name,
      message: e.message,
      status: 500,
    };
  }
};

const getByEmail = async (email) => {
  try {
    const result = await db.any(
      `select
      email
    from
      client_user
    where
      email ilike $1
    union
           select
      user_email
    from
      auth_users
    where
      user_email ilike $1`,
      email,
    );
    return result;
  } catch (e) {
    throw e;
  }
};

const updateClientAddress = async (addr, id, role) => {
  try {
    const update = await db.any(
      `update
      client_user
    set
      address = $1,
      client_background_verified = true
    where
      id = $2 returning *`,
      [addr, id],
    );
    if (update.length == 0) throw new SQLError("Invalid client entry");
    if (role == true) {
      await db.any(
        `update auth_users set all_is_auth = true where user_id = $1 returning *`,
        update[0].id,
      );
      return {
        message: `updated client address and all_is_auth`,
        verified: true,
        data: update[0],
      };
    } else
      return {
        message: `updated client address, update renter_address`,
        data: update[0],
      };
  } catch (e) {
    if (e instanceof SQLError) throw e;
    else throw new SQLError("unable to update is_auth");
  }
};

module.exports = {
  getAllUsers,
  createUser,
  login,
  authLogin,
  getInfo,
  updateClientAddress,
  getByEmail,
};
