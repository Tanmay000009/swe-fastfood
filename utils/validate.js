const { verify } = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

function validate(req, res, next) {
  let token = req.headers["token"];
  if (!token) {
    token = req.session.token;
    console.log("token from session", token);
  }
  if (!token) {
    res.render("index.ejs", { msg: "Login expired!" });
  }
  verify(token, JWT_SECRET, (err, decodedToken) => {
    if (err) {
      console.log(err);
      return res.status(403).json({
        error: "Invalid token",
      });
    }
    req.decodedToken = decodedToken;
    next();
  });
}

module.exports = validate;
