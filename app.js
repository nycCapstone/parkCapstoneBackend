const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const credentials = require("./lib/authMiddleware/credentials");
const corsOptions = require("./config/corsOptions");
const authRouter = require("./routers/authRouter");
const userRouter = require("./routers/userRouter");
const renterRouter = require("./routers/renterRouter");
const searchRouter = require("./routers/searchRouter");
const parkingSpotRouter = require("./routers/parkingSpotRouter");
const spotDetailsRouter = require("./routers/spotDetailsRouter");
const pmtRouter = require("./routers/pmtRouter");
const mapsRouter = require("./routers/mapsRouter");
const bookingRouter = require("./routers/bookingRouter");
const verifyJWT = require("./lib/authMiddleware/verifyJWT");
const refreshTokenController = require("./controllers/refreshTokenController");
const logoutController = require("./controllers/logoutController");
const app = express();
app.use(credentials);
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));

app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.send("Welcome to NYC Park App");
});

app.use("/refresh", refreshTokenController);

app.use("/logout", logoutController);

app.use("/auth", authRouter);

app.use("/get-spaces", searchRouter);

app.use("/maps", mapsRouter);

app.use(verifyJWT);

app.use("/spot-details", spotDetailsRouter);

app.use("/parking-spots", parkingSpotRouter);

app.use("/user", userRouter);

app.use("/renters", renterRouter);

app.use("/book", bookingRouter);

app.use("/checkout", pmtRouter);

app.get("*", (req, res) => {
  res.status(404).send("Page not found!");
});

module.exports = app;
