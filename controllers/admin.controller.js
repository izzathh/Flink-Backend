const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { default: validator } = require("validator");
const Admin = require("../models/admin.model");
const User = require("../models/user.model");
const Common = require("../models/common.model");
const Counter = require("../models/counter.model");
const { BadRequest, NotFound, ValidationError } = require("../utils/errors");
const {
  verifyEmailAndSentOtp,
  updatePassword,
  fetchUserFromEmailAndOtp,
} = require("../services/auth.service");
const {
  superAdminRoutes,
  salesAdminRoutes,
  printingAdminRoutes,
  ceoRoutes,
} = require("../utils/roleBasedRoutes");

const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.BACBLAZE_ACCESS_KEY,
  secretAccessKey: process.env.BACKBLAZE_SECRET_KEY,
  endpoint: process.env.BACKBLAZE_ENDPOINT,
  region: process.env.BACKBLAZE_REGION,
});

const registerAdmin = async (req, res, next) => {
  const { email, password, branchName, branchCode, adminType } = req.body;
  const adminId = req.headers.adminid || "";
  try {

    if (!email || !password || !adminType) {
      throw new BadRequest("Missing required fields");
    }
    if (!validator.isEmail(email)) {
      throw new BadRequest("Please enter a valid email");
    }

    const isUserAlreadyFound = await Admin.findOne({ email });

    if (adminType === "super") {
      const isBranchCodeAlreadyFound = await Admin.findOne({
        branchCode: { $regex: new RegExp(`^${branchCode}$`, 'i') },
      });
      if (isBranchCodeAlreadyFound) {
        throw new BadRequest("Branch code exists");
      }
    }

    if (isUserAlreadyFound) {
      throw new BadRequest("Admin already exists");
    }

    const newAdmin = new Admin({
      email,
      password,
      adminType,
      createdAdminId: adminId,
    });

    if (adminType === "super") {
      newAdmin.branchCode = branchCode
      newAdmin.branchName = branchName
    }

    const initialStartTime = new Date().setHours(0, 0, 0, 0);
    const initialEndTime = new Date().setHours(23, 59, 59, 999);

    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        throw new Error(err);
      }
      bcrypt.hash(newAdmin.password, salt, async (err, hash) => {
        if (err) {
          throw new Error(err);
        }
        newAdmin.password = hash;
        const savedUser = await newAdmin.save();
        if (adminType === "super") {
          const newCommon = new Common({
            currency: '€',
            createdAdminId: savedUser._id,
            deliveryHours: {
              deliveryStartTime: initialStartTime,
              deliveryEndTime: initialEndTime,
              timeZone: 'Europe/Belgrade',
              timeZoneOffset: '1',
              autoArchiveTime: {
                hours: '00',
                minutes: '00',
                amPm: 'PM',
                runCron: false,
              }
            },
            minOrderAmount: 1,
            contactDetails: null,
            noticeText: null,
            deliveryCharge: 1,
            paymentAccountNumber: ""
          });

          const newCounter = new Counter({
            serialNumber: 0,
            createdAdminId: savedUser._id,
            orderNumber: 0
          })

          await newCounter.save();
          await newCommon.save();
        }

        jwt.sign(
          { id: savedUser._id },
          process.env.JWT_SECRET,
          { expiresIn: "90d" },
          (err, token) => {
            if (err) {
              throw new Error(err);
            }
            savedUser.__v = undefined;
            savedUser.password = undefined;
            res.status(201).json({
              message: "Admin created Successfully",
              token,
              user: savedUser,
            });
          }
        );
      });
    });
  } catch (error) {
    next(error);
  }
};

const adminLogin = async (req, res, next) => {
  const { email, password, isCeo } = req.body;

  try {
    if (!email || !password) {
      throw new BadRequest("Please Enter all fields!");
    }
    if (!validator.isEmail(email)) {
      throw new BadRequest("Please enter a valid email");
    }
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "User does not exist" });
    }
    const commonData = await Common.findOne({ createdAdminId: admin._id })

    let routes = [];

    if (admin.adminType === "ceo") {
      routes = ceoRoutes;
    } else if (admin.adminType === "super") {
      routes = superAdminRoutes;
    } else if (admin.adminType === "printing") {
      routes = printingAdminRoutes;
    } else if (admin.adminType === "sales") {
      routes = salesAdminRoutes;
    } else {
      routes = [];
    }

    const checkPassword = await bcrypt.compare(password, admin.password);
    if (!checkPassword && !isCeo) {
      throw new BadRequest("Invalid Credentials!");
    }
    const JwtSecretKey = process.env.JWT_SECRET;
    jwt.sign(
      { id: admin._id },
      JwtSecretKey,
      { expiresIn: "90d" },
      (err, token) => {
        if (err) {
          throw new Error(err);
        }
        admin.password = undefined;
        res
          .status(200)
          .json({ message: "You are logged in", token, admin, commonData, routes });
      }
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const salesAdminLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      throw new BadRequest("Please Enter all fields!");
    }
    if (!validator.isEmail(email)) {
      throw new BadRequest("Please enter a valid email");
    }
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "User does not exist" });
    }

    if (admin.adminType !== "sales") {
      throw new BadRequest("You are not authorized to use this app.");
    }

    console.log('createdAdminId:', admin.createdAdminId);
    const getBranchCode = await Admin.findById(admin.createdAdminId).select("branchCode")
    const checkPassword = await bcrypt.compare(password, admin.password);
    if (!checkPassword) {
      throw new BadRequest("Invalid Credentials!");
    }
    const JwtSecretKey = process.env.JWT_SECRET;
    jwt.sign(
      { id: admin._id },
      JwtSecretKey,
      { expiresIn: "90d" },
      (err, token) => {
        if (err) {
          throw new Error(err);
        }
        admin.password = undefined;
        res.status(200).json({
          message: "You are logged in",
          token,
          admin,
          branchCode: getBranchCode.branchCode
        });
      }
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const initAdmin = async (req, res, next) => {
  try {

    const admin = await Admin.findById(req.body.id).select("-password -__v");

    if (!admin) {
      return res.status(404).json({ message: "Admin does not exist" });
    }
    const commonData = await Common.findOne({ createdAdminId: req.body.id })

    let routes = [];

    if (admin.adminType === "ceo") {
      routes = ceoRoutes;
    } else if (admin.adminType === "super") {
      routes = superAdminRoutes;
    } else if (admin.adminType === "printing") {
      routes = printingAdminRoutes;
    } else if (admin.adminType === "sales") {
      routes = salesAdminRoutes;
    } else {
      routes = [];
    }

    return res.status(200).json({
      admin,
      commonData,
      routes,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new BadRequest("Please Enter all fields!");
    }
    if (!validator.isEmail(email)) {
      throw new BadRequest("Please enter a valid email");
    }
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(404).json({ message: "User does not exist" });
    }

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          throw new Error(err);
        }
        admin.password = hash;
        const savedUser = await admin.save();
        savedUser.password = undefined;
        return res.status(201).json({
          message: "User Created Successfully!",
          user: savedUser,
        });
      });
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    await verifyEmailAndSentOtp(req.body.email, true);
    res.json({ message: 'Otp sent successfully' });
  } catch (error) {
    next(error);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    let user = await fetchUserFromEmailAndOtp(
      req.body.email,
      req.body.otp,
      true
    );
    await updatePassword(user._id, req.body.password, true);
    res.json({});
  } catch (error) {
    next(error);
  }
};

const getListOfSuperAdmins = async (req, res, next) => {
  try {
    const admins = await Admin.find({ adminType: "super" });
    return res.status(200).json({ message: "Fetched all admins", admins });
  } catch (error) {
    next(error);
  }
};

const getListOfAdminsUnderSuperAdmin = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const admins = await Admin.find({ createdAdminId: adminId });

    if (!admins) {
      throw new BadRequest("Super admin id is not present");
    }

    return res.status(200).json({ message: "Fetched all admins", admins });
  } catch (error) {
    next(error);
  }
};

const editAdminDetails = async (req, res, next) => {
  try {
    const { editAdminId, email, password, adminType } = req.body;
    const admin = await Admin.findById(editAdminId);
    const adminByEmail = await Admin.findOne({ email: email });

    if (!admin) {
      throw new NotFound("Admin not found!");
    }

    if (admin.email !== email && adminByEmail) {
      throw new ValidationError("This email is already taken");
    }

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          throw new Error(err);
        }
        admin.email = email;
        admin.adminType = adminType;
        admin.password = hash;

        const updatedUser = await admin.save();
        return res.status(200).json({
          message: "user details updated sucessfully!",
          user: updatedUser,
        });
      });
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const editSuperAdminDetails = async (req, res, next) => {
  try {
    const { editAdminId, email, password, branchCode, branchName } = req.body;
    const admin = await Admin.findById(editAdminId);
    const adminByEmail = await Admin.findOne({ email: email });

    const adminByBranchCode = await Admin.findOne({
      _id: { $ne: admin._id },
      branchCode: { $regex: new RegExp(`^${branchCode}$`, 'i') },
    });

    if (!admin) {
      throw new NotFound("Admin not found!");
    }

    if (admin.branchCode !== branchCode && adminByBranchCode) {
      throw new ValidationError("This branch code is already taken");
    }

    if (admin.email !== email && adminByEmail) {
      throw new ValidationError("This email is already taken");
    }

    if (admin.branchCode !== branchCode && !adminByBranchCode) {
      const filter = { createdAdminId: editAdminId };
      const update = {
        $set: {
          branchCode: branchCode
        },
      };
      await User.updateMany(filter, update);
    }

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          throw new Error(err);
        }
        // if (admin.branchName !== branchName) {
        //   const objects = await s3.listObjectsV2({
        //     Bucket: process.env.BACKBLAZE_BUCKET_NAME,
        //     Prefix: `${process.env.BACKBLAZE_BUCKET_NAME}/branch-${admin.branchName}/`,
        //   }).promise();
        //   console.log('objects:--->', objects);
        //   await Promise.all(objects.Contents.map(async (object) => {
        //     console.log('object:', object);
        //     await s3.copyObject({
        //       Bucket: process.env.BACKBLAZE_BUCKET_NAME,
        //       CopySource: `${object.Key}`,
        //       Key: `branch-${branchName}${object.Key.substring(`branch-${admin.branchName}/`.length)}`,
        //     }).promise();
        //   }));

        //   await Promise.all(objects.Contents.map(async (object) => {
        //     await s3.deleteObject({
        //       Bucket: process.env.BACKBLAZE_BUCKET_NAME,
        //       Key: object.Key,
        //     }).promise();
        //   }));
        //   console.log('new branch name is updated in the s3 bucket folder');
        // }

        admin.email = email;
        admin.branchName = branchName;
        admin.branchCode = branchCode;
        admin.password = hash;

        const updatedUser = await admin.save();
        return res.status(200).json({
          message: "Admin details updated sucessfully!",
          user: updatedUser,
        });
      });
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const deleteAdmin = async (req, res, next) => {
  const { deleteAdminId } = req.params;
  try {
    const adminNeedsToBeDeleted = await Admin.findByIdAndDelete(deleteAdminId);
    return res.status(200).json({
      message: "Admin Deleted Successfully!",
      result: adminNeedsToBeDeleted,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

module.exports = {
  registerAdmin,
  adminLogin,
  salesAdminLogin,
  initAdmin,
  changePassword,
  forgotPassword,
  // updateCurrentPassword,
  resetPassword,
  getListOfSuperAdmins,
  getListOfAdminsUnderSuperAdmin,
  editAdminDetails,
  editSuperAdminDetails,
  deleteAdmin,
};
