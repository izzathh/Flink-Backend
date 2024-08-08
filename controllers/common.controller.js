const { formatInTimeZone } = require("date-fns-tz");
const CommonModel = require("../models/common.model");
const Admin = require("../models/admin.model");
const Group = require("../models/group.model");
const { checkDeliveryHours } = require("../utils/checkDeliveryHours");
const { ValidationError, BadRequest } = require("../utils/errors");
const moment = require("moment");

const getAllCommonFields = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const commonFields = await CommonModel.findOne({
      createdAdminId: adminId,
    }).select("-__v");

    let getBranchCode = ""
    if (adminId) {
      getBranchCode = await Admin.findById(adminId).select("branchCode")
    }

    if (!commonFields) {
      return res
        .status(200)
        .json({ message: "fetched common fields", commonFields: {} });
    }

    const isDeliveryHours = (await checkDeliveryHours(adminId))
      .isDeliveryHoursCheck;
    // const startTime = (await checkDeliveryHours(adminId)).startTime;
    // const endTime = (await checkDeliveryHours(adminId)).endTime;

    const startTimeConverted = formatInTimeZone(
      commonFields.deliveryHours.deliveryStartTime,
      commonFields.deliveryHours.timeZone,
      "yyyy-MM-dd hh:mm:ss a"
      // "HH:mm:ss zzz"
    );
    const endTimeConverted = formatInTimeZone(
      commonFields.deliveryHours.deliveryEndTime,
      commonFields.deliveryHours.timeZone,
      "yyyy-MM-dd hh:mm:ss a"
      // "HH:mm:ss zzz"
    );

    return res.status(200).json({
      message: "fetched common fields",
      commonFields: commonFields,
      branchCode: !adminId ? "" : getBranchCode.branchCode,
      isDeliveryHours,
      startTimeConverted,
      endTimeConverted,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const modifyCurrency = async (req, res, next) => {
  try {
    const { currency } = req.body;
    if (!currency) {
      throw new ValidationError("Please enter a valid currency");
    }
    const adminId = req.headers.adminid || "";
    const foundCommonFields = await CommonModel.findOne({
      createdAdminId: adminId,
    }).select("-__v");

    if (foundCommonFields && Object.keys(foundCommonFields).length > 0) {
      const query = { _id: foundCommonFields._id };
      const update = {
        $set: {
          currency: currency,
        },
      };
      const options = { new: false, useFindAndModify: false };
      const updatedCommonFields = await CommonModel.findOneAndUpdate(
        query,
        update,
        options
      );
      return res
        .status(200)
        .json({ message: "Updated Currency", updatedCommonFields });
    } else {
      const newCommonFields = new CommonModel({
        currency,
        createdAdminId: adminId,
      });
      const updatedCommonFields = await newCommonFields.save();
      return res
        .status(200)
        .json({ message: "Added currency", updatedCommonFields });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};


const modifyAccountNumber = async (req, res, next) => {
  try {
    const { accountNumber } = req.body;

    const addAccountNumber = accountNumber.length === 0 ? "" : accountNumber

    const adminId = req.headers.adminid || "";
    const foundCommonFields = await CommonModel.findOne({
      createdAdminId: adminId,
    }).select("-__v");

    if (foundCommonFields && Object.keys(foundCommonFields).length > 0) {
      const query = { _id: foundCommonFields._id };
      const update = {
        $set: {
          paymentAccountNumber: addAccountNumber,
        },
      };
      const options = { new: false, useFindAndModify: false };
      const updatedCommonFields = await CommonModel.findOneAndUpdate(
        query,
        update,
        options
      );
      return res
        .status(200)
        .json({ message: "Updated account number", updatedCommonFields });
    } else {
      const newCommonFields = new CommonModel({
        paymentAccountNumber: addAccountNumber,
        createdAdminId: adminId,
      });
      const updatedCommonFields = await newCommonFields.save();
      return res
        .status(200)
        .json({ message: "Added account number", updatedCommonFields });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const modifyDeliveryCharge = async (req, res) => {
  try {
    const { deliveryCharge } = req.body;

    const adminId = req.headers.adminid || "";
    const foundCommonFields = await CommonModel.findOne({
      createdAdminId: adminId,
    }).select("-__v");

    if (foundCommonFields && Object.keys(foundCommonFields).length > 0) {
      const query = { _id: foundCommonFields._id };
      const update = {
        $set: {
          deliveryCharge: deliveryCharge,
        },
      };
      const options = { new: false, useFindAndModify: false };
      const updatedCommonFields = await CommonModel.findOneAndUpdate(
        query,
        update,
        options
      );
      return res
        .status(200)
        .json({ message: "Updated delivery charge", updatedCommonFields });
    }
    return res.status(404).json({ message: "common fields not found" })
  } catch (e) {
    console.log(e);
    next(e)
  }
}

const modifyMinimumOrderAmount = async (req, res, next) => {
  try {
    const { minimumOrderAmount } = req.body;
    if (!minimumOrderAmount) {
      throw new ValidationError("Please enter a valid minimum Order Amount");
    }
    const adminId = req.headers.adminid || "";
    const foundCommonFields = await CommonModel.findOne({
      createdAdminId: adminId,
    }).select("-__v");

    if (foundCommonFields && Object.keys(foundCommonFields).length > 0) {
      const query = { _id: foundCommonFields._id };
      const update = {
        $set: {
          minOrderAmount: minimumOrderAmount,
        },
      };
      const options = { new: false, useFindAndModify: false };
      const updatedCommonFields = await CommonModel.findOneAndUpdate(
        query,
        update,
        options
      );
      return res
        .status(200)
        .json({ message: "Updated minimum order amount", updatedCommonFields });
    } else {
      const newCommonFields = new CommonModel({
        minOrderAmount: minimumOrderAmount,
        createdAdminId: adminId,
      });
      const updatedCommonFields = await newCommonFields.save();
      return res
        .status(200)
        .json({ message: "Added mininum order amount", updatedCommonFields });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const modifyNoticeText = async (req, res, next) => {
  try {
    const { noticeText } = req.body;
    if (!noticeText) {
      throw new ValidationError("Please enter a valid text");
    }
    const adminId = req.headers.adminid || "";
    const foundCommonFields = await CommonModel.findOne({
      createdAdminId: adminId,
    }).select("-__v");

    if (foundCommonFields && Object.keys(foundCommonFields).length > 0) {
      const query = { _id: foundCommonFields._id };
      const update = {
        $set: {
          noticeText: noticeText,
        },
      };
      const options = { new: false, useFindAndModify: false };
      const updatedCommonFields = await CommonModel.findOneAndUpdate(
        query,
        update,
        options
      );
      return res
        .status(200)
        .json({ message: "Updated notice text", updatedCommonFields });
    } else {
      const newCommonFields = new CommonModel({
        noticeText: noticeText,
        createdAdminId: adminId,
      });
      const updatedCommonFields = await newCommonFields.save();
      return res
        .status(200)
        .json({ message: "Added notice text", updatedCommonFields });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const modifyServiceHours = async (req, res, next) => {
  try {
    const { dayStartTime, deliveryStartTime, deliveryEndTime, timeZone } =
      req.body;
    if (!dayStartTime || !deliveryStartTime || !deliveryEndTime || !timeZone) {
      throw new ValidationError("Please enter a valid service hours fields");
    }
    const adminId = req.headers.adminid || "";
    const foundCommonFields = await CommonModel.findOne({
      createdAdminId: adminId,
    }).select("-__v");

    if (foundCommonFields && Object.keys(foundCommonFields).length > 0) {
      const query = { _id: foundCommonFields._id };
      const update = {
        $set: {
          serviceHours: {
            dayStartTime,
            deliveryStartTime,
            deliveryEndTime,
            timeZone,
          },
        },
      };
      const options = { new: false, useFindAndModify: false };
      const updatedCommonFields = await CommonModel.findOneAndUpdate(
        query,
        update,
        options
      );
      return res
        .status(200)
        .json({ message: "Updated service hours", updatedCommonFields });
    } else {
      const newCommonFields = new CommonModel({
        serviceHours: {
          dayStartTime,
          deliveryStartTime,
          deliveryEndTime,
          timeZone,
        },
        createdAdminId: adminId,
      });
      const updatedCommonFields = await newCommonFields.save();
      return res
        .status(200)
        .json({ message: "Added service hours", updatedCommonFields });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const modifyContactDetails = async (req, res, next) => {
  try {
    const { contactDetails } = req.body;
    if (!contactDetails) {
      throw new ValidationError("Please enter a valid contact detail");
    }
    const adminId = req.headers.adminid || "";
    const foundCommonFields = await CommonModel.findOne({
      createdAdminId: adminId,
    }).select("-__v");

    if (foundCommonFields && Object.keys(foundCommonFields).length > 0) {
      const query = { _id: foundCommonFields._id };
      const update = {
        $set: {
          contactDetails: contactDetails,
        },
      };
      const options = { new: false, useFindAndModify: false };
      const updatedCommonFields = await CommonModel.findOneAndUpdate(
        query,
        update,
        options
      );
      return res
        .status(200)
        .json({ message: "Updated Contact Details", updatedCommonFields });
    } else {
      const newCommonFields = new CommonModel({
        contactDetails,
        createdAdminId: adminId,
      });
      const updatedCommonFields = await newCommonFields.save();
      return res
        .status(200)
        .json({ message: "Added Contact Details", updatedCommonFields });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const autoArchiveTime = async (req, res, next) => {
  try {
    const { amPm, runCron } = req.body;
    let { hours, minutes } = req.body;

    hours = hours == 0 ? '00' : hours
    minutes = minutes == 0 ? '00' : minutes

    if (!hours || !minutes || !amPm) {
      throw new ValidationError("Please enter all the mandatory fields");
    }

    hours = Number(hours)
    minutes = Number(minutes)

    const adminId = req.headers.adminid || "";

    const foundCommonFields = await CommonModel.findOne({
      createdAdminId: adminId,
    }).select("-__v");

    const deliveryStartTime = foundCommonFields.deliveryHours.deliveryStartTime;
    const deliveryEndTime = foundCommonFields.deliveryHours.deliveryEndTime;
    const timeZoneOffset = foundCommonFields.deliveryHours.timeZoneOffset;
    const timeZone = foundCommonFields.deliveryHours.timeZone;

    if (foundCommonFields && Object.keys(foundCommonFields).length > 0) {
      const query = { _id: foundCommonFields._id };
      const update = {
        $set: {
          deliveryHours: {
            deliveryStartTime,
            deliveryEndTime,
            timeZone,
            timeZoneOffset,
            autoArchiveTime: { hours, minutes, amPm, runCron },
          },
        },
      };
      const options = { new: false, useFindAndModify: false };
      const updatedCommonFields = await CommonModel.findOneAndUpdate(
        query,
        update,
        options
      );
      return res
        .status(200)
        .json({ message: "Updated Delivery Hours", updatedCommonFields });
    } else {
      const newCommonFields = new CommonModel({
        deliveryHours: {
          deliveryStartTime,
          deliveryEndTime,
          timeZone,
          timeZoneOffset,
          autoArchiveTime: { hours, minutes, amPm, runCron },
        },
        createdAdminId: adminId,
      });
      const updatedCommonFields = await newCommonFields.save();
      return res
        .status(200)
        .json({ message: "Updated Delivery Hours", updatedCommonFields });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const addDeliveryHours = async (req, res, next) => {
  try {
    const { deliveryStartTime, deliveryEndTime, timeZone, timeZoneOffset, autoArchiveTime } = req.body;

    if (!deliveryStartTime || !deliveryEndTime || !timeZone || !autoArchiveTime) {
      throw new ValidationError("Please enter all the mandatory fields");
    }

    const adminId = req.headers.adminid || "";

    const foundCommonFields = await CommonModel.findOne({
      createdAdminId: adminId,
    }).select("-__v");

    if (foundCommonFields && Object.keys(foundCommonFields).length > 0) {
      const query = { _id: foundCommonFields._id };
      const update = {
        $set: {
          deliveryHours: {
            deliveryStartTime,
            deliveryEndTime,
            timeZone,
            timeZoneOffset,
            autoArchiveTime
          },
        },
      };
      const options = { new: false, useFindAndModify: false };
      const updatedCommonFields = await CommonModel.findOneAndUpdate(
        query,
        update,
        options
      );
      return res
        .status(200)
        .json({ message: "Updated Delivery Hours", updatedCommonFields });
    } else {
      const newCommonFields = new CommonModel({
        deliveryHours: {
          deliveryStartTime,
          deliveryEndTime,
          timeZone,
          timeZoneOffset,
          autoArchiveTime
        },
        createdAdminId: adminId,
      });
      const updatedCommonFields = await newCommonFields.save();
      return res
        .status(200)
        .json({ message: "Updated Delivery Hours", updatedCommonFields });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};


async function checkOverlap(newPolygonCoordinates) {
  try {
    const overlappingPolygons = await Group.find({
      geometry: {
        $geoIntersects: {
          $geometry: {
            type: "Polygon",
            coordinates: [newPolygonCoordinates]
          }
        }
      }
    });

    return overlappingPolygons.length > 0;
  } catch (error) {
    console.error("Error checking overlap:", error);
    return false; // Handle the error gracefully in your application
  }
}

const addAreaOfOperation = async (req, res, next) => {
  try {
    const { polygon, update, area } = req.body
    const adminId = req.headers.adminid || "";

    if (update) {
      const getAreaData = await Group.findOne({ areaName: area, createdAdminId: adminId })
      getAreaData.hasGroup = true
      await getAreaData.save();
      return res.status(201).json({ status: '1', message: "Group created successfully" })
    }

    for (const coordinates of polygon) {
      const coordinatesVal = Object.values(coordinates)
        .filter(coord => Array.isArray(coord))
        .map(coord => [coord[0], coord[1]]);
      const isPolygonExist = await checkOverlap(coordinatesVal)
      console.log('isPolygonExist:', isPolygonExist);
      if (isPolygonExist) {
        throw new BadRequest("Marked location is not available");
      }
    }

    for (const polygons of polygon) {
      const coordinates = Object.values(polygons)
        .filter(coord => Array.isArray(coord))
        .map(coord => [coord[0], coord[1]]);
      const city = polygons.properties.city;

      const newArea = new Group({
        areaName: city,
        createdAdminId: adminId,
        geometry: {
          type: "Polygon",
          coordinates: [coordinates]
        },
        hasGroup: false
      });
      await newArea.save();
    }

    console.log("Polygons saved successfully!");

    return res.status(201).json({ status: '1', message: "Areas/Cities added successfully" })

  } catch (e) {
    console.log(e);
    next(e)
  }
}

module.exports = {
  getAllCommonFields,
  modifyCurrency,
  modifyAccountNumber,
  modifyMinimumOrderAmount,
  modifyNoticeText,
  modifyServiceHours,
  modifyContactDetails,
  addDeliveryHours,
  autoArchiveTime,
  modifyDeliveryCharge,
  addAreaOfOperation
};
