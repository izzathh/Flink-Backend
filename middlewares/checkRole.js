const Admin = require("../models/admin.model");
const { BadRequest } = require("../utils/errors");

const checkIsCeo = async (req, res, next) => {
  const adminId = req.headers.adminid || "";
  const admin = await Admin.findById(adminId);

  if (!admin) {
    return BadRequest("You are not authorized to perform this operation!");
  }

  const adminType = admin.adminType;

  if (adminType !== "ceo") {
    return res
      .status(403)
      .json({ message: "You don't have access to perform this action" });
  }
  try {
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred!" });
  }
};

const checkIsCeoOrSuperAdmin = async (req, res, next) => {
  const adminId = req.headers.adminid || "";
  const admin = await Admin.findById(adminId);

  if (!admin) {
    return BadRequest("You are not authorized to perform this operation!");
  }

  const adminType = admin.adminType;

  if (adminType !== "ceo" && adminType !== "super") {
    return res
      .status(403)
      .json({ message: "You don't have access to perform this action" });
  }
  try {
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred!" });
  }
};

const checkIsSuperAdmin = async (req, res, next) => {
  const adminId = req.headers.adminid || "";
  const admin = await Admin.findById(adminId);

  if (!admin) {
    return new BadRequest("You are not authorized to perform this operation!");
  }

  const adminType = admin.adminType;

  //Check for token
  if (adminType !== "super") {
    return res
      .status(403)
      .json({ message: "You don't have access to perform this action" });
  }

  try {
    //Verify token
    // const jwtSecretKey = process.env.JWT_SECRET;
    // const decoded = jwt.verify(token, jwtSecretKey);
    // // Add user from payload
    // req.user = decoded;
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred!" });
  }
};

const checkIsSalesAdmin = async (req, res, next) => {
  const userid = req.headers.userid || "";
  const admin = await Admin.findById(userid);

  if (!admin) {
    throw new BadRequest("You are not authorized to perform this operation!");
  }

  const adminType = admin.adminType;

  if (adminType !== "sales") {
    return res
      .status(403)
      .json({ message: "You don't have access to perform this action" });
  }

  try {
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred!" });
  }
};

const checkIsPrintingAdmin = async (req, res, next) => {
  const adminId = req.headers.adminid || "";
  const admin = await Admin.findById(adminId);

  if (!admin) {
    return BadRequest("You are not authorized to perform this operation!");
  }

  const adminType = admin.adminType;

  if (adminType !== "printing") {
    return res
      .status(403)
      .json({ message: "You don't have access to perform this action" });
  }

  try {
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred!" });
  }
};

const checkIsSuperOrSalesAdmin = async (req, res, next) => {
  const adminId = req.headers.adminid || "";
  const admin = await Admin.findById(adminId);

  if (!admin) {
    throw new BadRequest("You are not authorized to perform this operation!");
  }

  const adminType = admin.adminType;

  //Check for token
  if (adminType !== "super" && adminType !== "sales") {
    return res
      .status(403)
      .json({ message: "You don't have access to perform this action" });
  }

  try {
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred!" });
  }
};

const checkIsSuperOrPrintingAdmin = async (req, res, next) => {
  const adminId = req.headers.adminid || "";
  const admin = await Admin.findById(adminId);

  if (!admin) {
    return BadRequest("You are not authorized to perform this operation!");
  }

  const adminType = admin.adminType;

  console.log("adminType", adminType);

  //Check for token
  if (adminType !== "super" && adminType !== "printing") {
    return res
      .status(403)
      .json({ message: "You don't have access to perform this action" });
  }

  try {
    next();
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "An error occurred!" });
  }
};

module.exports = {
  checkIsCeo,
  checkIsCeoOrSuperAdmin,
  checkIsPrintingAdmin,
  checkIsSalesAdmin,
  checkIsSuperAdmin,
  checkIsSuperOrSalesAdmin,
  checkIsSuperOrPrintingAdmin,
};
