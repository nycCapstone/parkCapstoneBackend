const jwt = require("jsonwebtoken");

function authUserMiddleware(req, res, next) {
  const jwtToken = req.query.k;
  if (!jwtToken) {
    return res
      .status(400)
      .send("JWT Token (k) not provided in the query string");
  }

  try {
    const decoded = jwt.verify(jwtToken, process.env.JWT_TOKEN_SECRET_KEY);
    req.decodedData = decoded;

    next();
  } catch (error) {
    res.status(400).send("Invalid or expired JWT Token");
  }
}

function authRenterMiddleware(req, res, next) {
  const jwtToken = req.headers.authorization;
  if (!jwtToken) {
    return res
      .status(400)
      .send("JWT Token (k) not provided in the query string");
  }

  try {
    const decoded = jwt.verify(jwtToken, process.env.JWT_TOKEN_SECRET_KEY);
    res.locals.decodedToken = decoded;

    next();
  } catch (error) {
    res.status(400).send("Invalid or expired JWT Token");
  }
}

function jwtMiddleware(req, res, next) {
  const email = req.body.email;
  try {
    if (req.cookies && req.cookies.accessToken) {
      let notDecodedToken = req.cookies.accessToken;
      let decodedToken = jwt.decode(notDecodedToken);

      if (email.toLowerCase() != decodedToken.email.toLowerCase()) {
        req.tokenflag = decodedToken.email;
      }
    } else {
      req.tokenflag = null;
    }
    next();
  } catch (e) {
    return res
      .status(500)
      .json({ error: e.error, message: "jwt decode error" });
  }
}

module.exports = { authUserMiddleware, authRenterMiddleware, jwtMiddleware };
