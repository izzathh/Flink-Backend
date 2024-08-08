const jwt = require("jsonwebtoken");

const checkAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1] || null;

  //Check for token
  if (token === null) {
    return res.status(401).json({ message: "Please login to continue" });
  }

  try {
    //Verify token
    const jwtSecretKey = process.env.JWT_SECRET;
    const decoded = jwt.verify(token, jwtSecretKey);
    console.log("decoded", decoded);
    // Add user from payload
    req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    res
      .status(401)
      .json({ message: "Your session expired! Please sign in again" });
  }
};

module.exports = checkAuth;
