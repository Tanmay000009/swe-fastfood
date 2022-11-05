const { verify } = require("jsonwebtoken");
require("dotenv").config();
const JWT_SECRET = process.env.JWT_SECRET;

function validate(req, res, next) {
  let token = req.headers["token"];
  if (!token) {
    token = req.session.token;
  }
  if (!token) {
    return res.status(401).json({
      error: "No token provided",
    });
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
