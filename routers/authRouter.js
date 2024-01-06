const express = require("express");
const router = express.Router();

const validateData = require("../lib/validateData/validateData");
const checkEmpty = require("../lib/checkEmpty/checkEmpty");

const {
  createUserFunc,
  authCreateUser,
  loginFunc,
  preRegister,
} = require("../controllers/authController");

const {
  authUserMiddleware,
  jwtMiddleware,
} = require("../lib/authMiddleware/jwtMiddleware");

router.get("/check-for-email/:email", preRegister);

router.put("/create-user/auth", authUserMiddleware, authCreateUser);

router.post("/create-user", createUserFunc);

router.post("/login", jwtMiddleware, loginFunc);

module.exports = router;
