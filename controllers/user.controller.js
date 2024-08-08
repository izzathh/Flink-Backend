const { default: validator } = require("validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const Admin = require("../models/admin.model");
const { NotFound, BadRequest, ValidationError } = require("../utils/errors");
const { checkDeliveryHours } = require("../utils/checkDeliveryHours");
const {
  verifyEmailAndSentOtp,
  fetchUserFromEmailAndOtp,
  updatePassword,
} = require("../services/auth.service");
const ordersModel = require("../models/orders.model");
const turf = require('@turf/turf');
const { el } = require("date-fns/locale");
const Group = require("../models/group.model");

const registerUser = async (req, res, next) => {
  try {
    const {
      email,
      password,
      googleMapLocation,
      houseNumber,
      streetAddress,
      branchCode,
      phoneNumber,
      name,
      max_daily_order,
      latitude,
      longitude
    } = req.body;

    const adminId = req.headers.adminid || "";

    // <<--------------- [ User Registration according to map feature ] --------------->>

    // const userCoordinates = [longitude, latitude]
    // const getAdminBoundaries = await Group.find({}).select('geometry createdAdminId areaName')
    // const filterValidPolygons = getAdminBoundaries.filter((polygon) => polygon.geometry.coordinates[0].length >= 4)
    // const isTheUserInside = filterValidPolygons.map(element => {
    //   const polygon = turf.polygon([element.geometry.coordinates[0]]);
    //   const point = turf.point(userCoordinates);
    //   const isInside = turf.booleanPointInPolygon(point, polygon);
    //   if (isInside) {
    //     return {
    //       city: element.areaName,
    //       createdAdminId: element.createdAdminId
    //     }
    //   } else {
    //     return 'none'
    //   }
    // });
    //lat, lng
    //9.901437981647362 78.09528729879537

    // const getValidAdminId = isTheUserInside.filter(key => key !== 'none')
    // console.log('getValidAdminId:', getValidAdminId);
    // return res.send('hi')

    // <<--------------- [ User Registration according to map feature ] --------------->>

    const getAdminId = await Admin.findOne({
      branchCode: { $regex: new RegExp(`^${branchCode}$`, 'i') },
    })

    // let codeValue
    // if (getAdminId) {
    //   codeValue = branchCode
    // } else {
    //   codeValue = ""
    // }

    if (branchCode) {
      if (!getAdminId) {
        throw new NotFound("Branch Not Found!");
      }
    }

    if (
      !email ||
      !password ||
      !streetAddress ||
      !phoneNumber ||
      !name
    ) {
      throw new BadRequest("Please enter all fields");
    }

    const user = await User.findOne({ email: email });

    if (user) {
      throw new ValidationError("This user already exists");
    }
    const newUser = await new User({
      email,
      password,
      googleMapLocation,
      houseNumber,
      streetAddress,
      phoneNumber,
      name,
      max_daily_order: max_daily_order || "",
      createdAdminId: !getAdminId ? adminId : getAdminId._id,
      branchCode: branchCode
    });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, async (err, hash) => {
        if (err) {
          throw new Error(err);
        }
        newUser.password = hash;
        const savedUser = await newUser.save();
        savedUser.password = undefined;
        return res.status(201).json({
          message: "User Created Successfully!",
          user: savedUser,
        });
      });
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const users = await User.find({ createdAdminId: adminId }).select("-__v");
    return res
      .status(200)
      .json({ message: "fetched all users", users: users || [] });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const editUser = async (req, res, next) => {
  const {
    userId,
    email,
    password,
    branchCode,
    googleMapLocation,
    houseNumber,
    streetAddress,
    phoneNumber,
    name,
    max_daily_order
  } = req.body;
  try {
    const user = await User.findById(userId).select("-__v");
    const userByEmail = await User.findOne({ email: email });
    const getBranchCode = await Admin.findOne({
      branchCode: { $regex: new RegExp(`^${branchCode}$`, 'i') },
    })

    const adminId = req.headers.adminid || "";
    // if (!getBranchCode) {
    //   throw new NotFound("Branch Not Found!");
    // }

    if (!user) {
      throw new NotFound("User Not Found!");
    }

    if (user.email !== email && userByEmail) {
      throw new ValidationError("This email is already taken");
    }

    if (user.password === password) {
      user.email = email;
      user.name = name;
      user.password = user.password;
      user.createdAdminId = !getBranchCode ? adminId : getBranchCode._id;
      user.branchCode = branchCode;
      user.googleMapLocation = googleMapLocation;
      user.houseNumber = houseNumber;
      user.streetAddress = streetAddress;
      user.phoneNumber = phoneNumber;
      user.max_daily_order = max_daily_order;

      const updatedUser = await user.save();
      return res.status(200).json({
        message: "user details updated sucessfully!",
        user: updatedUser,
      });
    } else {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, async (err, hash) => {
          if (err) {
            throw new Error(err);
          }
          user.email = email;
          user.name = name;
          user.password = hash;
          user.createdAdminId = !getBranchCode ? adminId : getBranchCode._id;
          user.branchCode = branchCode;
          user.googleMapLocation = googleMapLocation;
          user.houseNumber = houseNumber;
          user.streetAddress = streetAddress;
          user.phoneNumber = phoneNumber;
          user.max_daily_order = max_daily_order;

          const updatedUser = await user.save();
          return res.status(200).json({
            message: "user details updated sucessfully!",
            user: updatedUser,
          });
        });
      });
    }
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const deleteUser = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const UserNeedsToBeDeleted = await User.findByIdAndDelete(userId);
    await ordersModel.deleteMany({ user: userId });
    return res.status(200).json({
      message: "User Deleted Successfully!",
      result: UserNeedsToBeDeleted,
    });
  } catch (error) {
    console.error(error);
    next(error);
  }
};

const userLogin = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      throw new BadRequest("Please Enter all fields!");
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "This user does not exist" });
    }

    const checkPassword = await bcrypt.compare(password, user.password);
    if (!checkPassword) {
      throw new BadRequest("Invalid Credentials!");
    }

    const JwtSecretKey = process.env.JWT_SECRET;
    jwt.sign(
      { id: user._id },
      JwtSecretKey,
      { expiresIn: "90d" },
      (err, token) => {
        if (err) {
          throw new Error(err);
        }
        user.password = undefined;

        res.status(200).json({ message: "You are logged in", token, user });
      }
    );
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const initUser = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid ?? "";
    // const user = await User.findById(req.user.id).select("-password -__v");
    const user = await User.findById(req.body.id).select("-password -__v");

    const isDeliveryHours = (await checkDeliveryHours(adminId))
      .isDeliveryHoursCheck;
    const startTime = (await checkDeliveryHours(adminId)).startTime;
    const endTime = (await checkDeliveryHours(adminId)).endTime;

    return res.status(200).json({
      user,
      isDeliveryHours: isDeliveryHours,
      startTime: startTime,
      endTime: endTime,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const forgotUserPassword = async (req, res, next) => {
  try {
    await verifyEmailAndSentOtp(req.body.email, false);

    res.json({});
  } catch (error) {
    next(error);
  }
};

const resetUserPassword = async (req, res, next) => {
  try {
    let user = await fetchUserFromEmailAndOtp(
      req.body.email,
      req.body.otp,
      false
    );
    await updatePassword(user._id, req.body.password, false);
    res.json({});
  } catch (error) {
    next(error);
  }
};


module.exports = {
  registerUser,
  getAllUsers,
  editUser,
  deleteUser,
  userLogin,
  initUser,
  forgotUserPassword,
  resetUserPassword,
};
