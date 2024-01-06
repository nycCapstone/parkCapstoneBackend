const {
  getAllUsers,
  createUser,
  login,
  authLogin,
  getByEmail,
} = require("../queries/users");

const { parsedMessage, stc } = require("../lib/helper/helper");

const allGetUsersFunc = async (req, res) => {
  const allUsers = await getAllUsers();

  if (allUsers.length === 0) {
    res.json({ message: "please go create some users" });
  } else {
    res.json(allUsers);
  }
};

const createUserFunc = async (req, res, next) => {
  createUser(req.body)
    .then((response) => {
      res.json(response);
    })
    .catch((e) => {
      res.status(stc(e)).json({ error: e.error, message: e.message });
    });
};
//Endpoint for authenticating user after they click emaillink
const authCreateUser = async (req, res, next) => {
  const { id, is_renter } = req.decodedData;
  authLogin(id, is_renter)
    .then((response) => {
      res.status(201).json(response);
    })
    .catch((e) => {
      if (e.hasOwnProperty("clientUser")) {
        res.status(stc(e)).json(e);
      } else {
        res.status(stc(e)).json({ message: e.message, error: e.error });
      }
    });
};

const loginFunc = async (req, res) => {
  await login(req.body, req.tokenflag)
    .then((response) => {
      res
        .cookie("accessToken", response.accessToken[1], {
          httpOnly: true,
          secure: true,
          maxAge: 170 * 24 * 60 * 60 * 1000,
          sameSite: "None",
        })
        .json({
          ...response,
          accessToken: response.accessToken[0],
        });
    })
    .catch((e) => {
      res.status(stc(e)).json({ error: e.error, message: e.message });
    });
};

const preRegister = async (req, res, next) => {
  await getByEmail(req.params.email)
    .then((response) => {
      res.json(response);
    })
    .catch((e) => {
      res.json({ error: e.error, message: e.message });
    });
};

module.exports = {
  allGetUsersFunc,
  createUserFunc,
  loginFunc,
  authCreateUser,
  preRegister,
};
