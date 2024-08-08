const Order = require("../models/orders.model");
const Counter = require("../models/counter.model");
const Common = require("../models/common.model");
const userModel = require("../models/user.model");
const { ValidationError, BadRequest } = require("../utils/errors");
const { getModifiedDateAndTime } = require("../utils/modifiedDateAndTime");
const moment = require("moment");
const momentTime = require('moment-timezone');
const { dateChecker } = require("../utils/dateChecker");
const commonModel = require("../models/common.model");
const Task = require('../models/cron.model');
const adminModel = require("../models/admin.model");

const placeAnOrder = async (req, res, next) => {
  try {
    const {
      items,
      user,
      currency,
      deliveryCharge,
      grandTotal,
      archive,
      transactionId
    } = req.body;

    if (!items.length === 0 || !user || !grandTotal) {
      throw new ValidationError("Please enter an item to place an order");
    }

    const adminId = req.headers.adminid || "";
    const counter = await Counter.findOne({ createdAdminId: adminId }).select(
      "-__v"
    );
    const common = await Common.findOne({ createdAdminId: adminId }).select(
      "-__v"
    );

    const {
      deliveryStartTime,
      deliveryEndTime,
      currentTime,
      startTimeToCheck,
      endTimeToCheck,
      currentTimeToCheck,
      nextDayEndTime,
      nextDayStartTime
    } = await dateChecker(adminId);

    let addGrandTotal
    let grandTotalOfAllOrders

    if (
      moment(currentTimeToCheck).isAfter(moment(startTimeToCheck)) &&
      moment(currentTimeToCheck).isBefore(moment(endTimeToCheck))
    ) {
      addGrandTotal = await Order.find({
        $and: [
          {
            user: user
          },
          {
            createdAt: { $gte: startTimeToCheck },
          },
          {
            createdAt: { $lte: endTimeToCheck },
          },
          { createdAdminId: adminId },
        ],
      })
        .populate({
          path: "user",
          model: "User",
          select: {
            password: 0,
            updatedAt: 0,
            __v: 0,
          },
        })
        .exec();

      grandTotalOfAllOrders = addGrandTotal.reduce((acc, orders) => acc + orders.grandTotal, 0)
    } else {
      addGrandTotal = await Order.find({
        $and: [
          {
            user: user
          },
          {
            createdAt: { $gte: endTimeToCheck },
          },
          {
            createdAt: { $lte: nextDayStartTime },
          },
          { createdAdminId: adminId },
        ],
      })
        .populate({
          path: "user",
          model: "User",
          select: {
            password: 0,
            updatedAt: 0,
            __v: 0,
          },
        })
        .exec();

      grandTotalOfAllOrders = addGrandTotal.reduce((acc, order) => acc + order.grandTotal, 0)
    }

    const getmaxAmountOfUser = await userModel.findById(user)

    if (getmaxAmountOfUser.max_daily_order != "") {
      if (
        Math.round((parseFloat(grandTotalOfAllOrders) + parseFloat(grandTotal)) * 100) / 100 >
        getmaxAmountOfUser.max_daily_order
      ) {
        throw new BadRequest(
          `Order amount exceeds maximum daily amount (${getmaxAmountOfUser.max_daily_order}) you are allowed to order`
        );
      }
    }

    if (counter) {
      counter.orderNumber = counter.orderNumber + 1
      counter.save();
    }

    console.log('deliveryCharge:', deliveryCharge);
    const newOrderBody = {
      orderNumber: counter.orderNumber,
      items,
      user: user,
      grandTotal: grandTotal,
      currency,
      deliveryCharge: deliveryCharge || 0.00,
      archive,
      createdAdminId: adminId,
      transactionId
    };

    const newOrder = await new Order(newOrderBody).populate([
      {
        path: "user",
        model: "User",
        select: {
          password: 0,
          __v: 0,
        },
      },
    ]);
    const savedOrder = await newOrder.save();
    return res.status(201).json({
      message: "Order placed Successfully",
      order: savedOrder,
      startTime: deliveryStartTime,
      endTime: deliveryEndTime,
      currentTime: currentTime,
      currentTimeToCheck,
      startTimeToCheck,
      endTimeToCheck,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getAllOrders = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const orders = await Order.find({ createdAdminId: adminId }).select("-__v");
    return res.status(200).json({ message: "Fetched all orders", orders });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getMyOrders = async (req, res, next) => {
  const { userId } = req.body;
  try {
    const adminId = req.headers.adminid || "";
    const common = await Common.find({ createdAdminId: adminId }).select(
      "-__v"
    );

    const {
      deliveryStartTime,
      deliveryEndTime,
      currentTime,
      startTimeToCheck,
      endTimeToCheck,
      currentTimeToCheck,
      nextDayStartTime,
    } = await dateChecker(adminId);

    let orders;

    if (
      moment(currentTimeToCheck).isAfter(moment(startTimeToCheck)) &&
      moment(currentTimeToCheck).isBefore(moment(endTimeToCheck))
    ) {
      orders = await Order.find({
        $and: [
          {
            createdAt: { $gte: startTimeToCheck },
          },
          {
            createdAt: { $lte: endTimeToCheck },
          },
          { user: userId },
        ],
      }).select("-__v");
    } else {
      orders = await Order.find({
        user: userId,
        $and: [
          {
            createdAt: { $gte: endTimeToCheck },
          },
          {
            createdAt: { $lte: nextDayStartTime },
          },
        ],
      }).select("-__v");
    }

    const modifiedOrders = orders.map((order) => ({
      ...order.toObject(),
      createdAt: getModifiedDateAndTime(
        order.createdAt,
        common[0].deliveryHours.timeZone,
        false,
        "dd MMM, yyyy, hh:mm a 'GMT' XXX"
      ),
    }));
    return res.status(200).json({
      message: "Fetched all orders",
      orders: modifiedOrders,
      isDeliveryHours:
        currentTime >= deliveryStartTime && currentTime <= deliveryEndTime,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const editOrders = async (req, res, next) => {
  try {
    const { filter, update, autoArcive, isActive } = req.body;
    const adminId = req.headers.adminid || "";

    if (autoArcive) {
      console.log('adminId:', adminId);
      const updatedDocument = await Task.findOneAndUpdate(
        { name: 'autoArchiveCron', createdAdminId: adminId },
        {
          isActive: isActive,
          filter: filter,
          updateVal: update
        },
        { upsert: true }
      );

      return res.json(updatedDocument);

    } else {

      const existingCounter = await Counter.findOne({ createdAdminId: adminId });
      existingCounter.orderNumber = 0
      existingCounter.save()

      const updatedDocument = await Order.updateMany(
        filter,
        { $set: update },
        { new: true }
      );

      if (!updatedDocument) {
        return res.status(404).json({ message: "Data not found" });
      }

      return res.json(updatedDocument);
    }

  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getTodaysOrders = async (req, res, next) => {
  try {
    // const { page = 1, limit = 10 } = req.query;
    const adminId = req.headers.adminid || "";
    const { admintype } = req.query;

    const {
      startTimeToCheck,
      endTimeToCheck,
      currentTimeToCheck,
      nextDayStartTime,
      currentTime,
      deliveryStartTime,
      deliveryEndTime,
    } = await dateChecker(adminId);

    console.log('findAdminType:', admintype);

    let orders;
    let count;

    if (
      moment(currentTimeToCheck).isAfter(moment(startTimeToCheck)) &&
      moment(currentTimeToCheck).isBefore(moment(endTimeToCheck))
    ) {
      orders = await Order.find({
        $and: [
          {
            createdAt: { $gte: startTimeToCheck },
          },
          {
            createdAt: { $lte: endTimeToCheck },
          },
          { createdAdminId: adminId },
        ],
      })
        .sort({ _id: -1 })
        .select("_id createdAt");
      // .limit(limit * 1)
      // .skip((page - 1) * limit)
      // .exec();

      count = await Order.countDocuments({
        $and: [
          {
            createdAt: { $gte: startTimeToCheck },
          },
          {
            createdAt: { $lte: endTimeToCheck },
          },
          { createdAdminId: adminId },
        ],
      });
    } else {
      orders = await Order.find({
        $and: [
          {
            createdAt: { $gte: endTimeToCheck },
          },
          {
            createdAt: { $lte: nextDayStartTime },
          },
          { createdAdminId: adminId },
        ],
      })
        .sort({ _id: -1 })
        .select("_id");
      // .limit(limit * 1)
      // .skip((page - 1) * limit)
      // .exec();

      count = await Order.countDocuments({
        $and: [
          {
            createdAt: { $gte: endTimeToCheck },
          },
          {
            createdAt: { $lte: nextDayStartTime },
          },
          { createdAdminId: adminId },
        ],
      });
    }

    orders = await Order.find({
      $and: [
        // {
        //   createdAt: { $gte: startTimeToCheck },
        // },
        // {
        //   createdAt: { $lte: endTimeToCheck },
        // },
        {
          archive: false
        },
        { createdAdminId: adminId },
      ],
    })
      .sort({ _id: -1 })
      .select("_id createdAt");

    console.log('currentTimeToCheck:', moment(currentTimeToCheck).format('DD/MM/YYYY'));

    if (admintype == 'printing') {
      orders = await Order.find({
        $and: [
          {
            archivedAt: {
              $regex: new RegExp(moment(currentTimeToCheck).format('DD/MM/YYYY'), 'i'),
            },
          },
          {
            archive: true
          },
          { createdAdminId: adminId },
        ],
      })
        .sort({ _id: -1 })
        .select("_id createdAt archivedAt")
        .lean();
    }

    console.log('orders:', orders);

    const mergedData = {};

    orders.forEach(item => {
      const { archivedAt } = item;
      if (!mergedData[archivedAt]) {
        mergedData[archivedAt] = { ...item };
      } else {
        mergedData[archivedAt] = {
          ...mergedData[archivedAt],
          ...item,
        };
      }
    });

    const result = Object.values(mergedData);
    console.log('result:', result);
    const commonData = await Common.findOne({ createdAdminId: adminId }).select(
      "-__v"
    );

    return res.status(200).json({
      message: "fetched ordered items",
      orders: admintype == 'printing' ? result : orders,
      totalPages: count,
      // showDownloadButton:
      // currentTime >= deliveryStartTime && currentTime <= deliveryEndTime,
      showDownloadButton: orders ? true : false,
      archiveCheckbox: commonData.deliveryHours.autoArchiveTime.runCron
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, searchString = "", selectOption, adminType } = req.query;
    const adminId = req.headers.adminid || "";

    const {
      startTimeToCheck,
      endTimeToCheck,
      currentTimeToCheck,
      nextDayStartTime,
      currentTime,
      deliveryStartTime,
      deliveryEndTime,
      timeZone,
      autoArchiveTime
    } = await dateChecker(adminId);
    let orders;
    let count;
    let allGrandTotals;

    let searchFilter = {};
    let searchOption = {};

    const trimmedSearchString = searchString.trim()

    if (trimmedSearchString) {
      if (!isNaN(trimmedSearchString)) {
        searchOption = {
          userName: { "user.name": { $regex: `${trimmedSearchString}`, $options: "i" } },
          email: { "user.email": { $regex: `${trimmedSearchString}`, $options: "i" } },
          phoneNumber: { "user.phoneNumber": { $regex: `${trimmedSearchString}`, $options: "i" } },
          orderNumber: { "orderNumber": parseInt(trimmedSearchString) },
          location: { "user.googleMapLocation": { $regex: `${trimmedSearchString}`, $options: "i" } },
          houseNumber: { "user.houseNumber": { $regex: `${trimmedSearchString}`, $options: "i" } },
          streetAddress: { "user.streetAddress": { $regex: `${trimmedSearchString}`, $options: "i" } },
          itemCategory: { "items.categoryName": { $regex: `${trimmedSearchString}`, $options: "i" } },
          itemName: { "items.itemName": { $regex: `${trimmedSearchString}`, $options: "i" } },
          transactionId: { "transactionId": { $regex: `${trimmedSearchString}`, $options: "i" } },
        };
      } else {
        searchOption = {
          userName: { "user.name": { $regex: `${trimmedSearchString}`, $options: "i" } },
          email: { "user.email": { $regex: `${trimmedSearchString}`, $options: "i" } },
          phoneNumber: { "user.phoneNumber": { $regex: `${trimmedSearchString}`, $options: "i" } },
          orderNumber: { "orderNumber": parseInt(trimmedSearchString) },
          location: { "user.googleMapLocation": { $regex: `${trimmedSearchString}`, $options: "i" } },
          houseNumber: { "user.houseNumber": { $regex: `${trimmedSearchString}`, $options: "i" } },
          streetAddress: { "user.streetAddress": { $regex: `${trimmedSearchString}`, $options: "i" } },
          itemCategory: { "items.categoryName": { $regex: `${trimmedSearchString}`, $options: "i" } },
          itemName: { "items.itemName": { $regex: `${trimmedSearchString}`, $options: "i" } },
          transactionId: { "transactionId": { $regex: `${trimmedSearchString}`, $options: "i" } },
        };
      }
      searchFilter = searchOption[selectOption] || {};
    }
    let archivedAtQuery = {}
    if (adminType === 'printing') {
      archivedAtQuery = {
        archivedAt: {
          $regex: new RegExp(moment(currentTimeToCheck).format('DD/MM/YYYY'), 'i'),
        },
      }
    }

    if (
      moment(currentTimeToCheck).isAfter(moment(startTimeToCheck)) &&
      moment(currentTimeToCheck).isBefore(moment(endTimeToCheck))
    ) {
      console.log('adminId:', adminId);
      const query = [
        {
          $match: {
            $and: [
              archivedAtQuery,
              {
                archive: adminType === 'printing' ? true : false,
              },
              { createdAdminId: adminId },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            as: "user",
            let: { id: "$user" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
              { $project: { password: 0, updatedAt: 0, _v: 0 } },
            ],
          },
        },
        { $unwind: "$user" },
        {
          $match: { ...searchFilter },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit * 1 },
      ];

      orders = await Order.aggregate(query);

      allGrandTotals = await Order.find({
        archive: adminType === 'printing' ? true : false,
        createdAdminId: adminId
      }).select('grandTotal')

      console.log('sumOfNetTotal:', allGrandTotals);

      count = await Order.countDocuments({
        $and: [
          archivedAtQuery,
          { archive: adminType === 'printing' ? true : false },
          { createdAdminId: adminId },
        ],
      });
    } else {
      const query = [
        {
          $match: {
            $and: [
              archivedAtQuery,
              {
                archive: adminType === 'printing' ? true : false,
              },
              { createdAdminId: adminId },
            ],
          },
        },
        {
          $lookup: {
            from: "users",
            as: "user",
            let: { id: "$user" },
            pipeline: [
              { $match: { $expr: { $eq: ["$_id", "$$id"] } } },
              { $project: { password: 0, updatedAt: 0, _v: 0 } },
            ],
          },
        },
        { $unwind: "$user" },
        {
          $match: { ...searchFilter },
        },
        { $skip: (page - 1) * limit },
        { $limit: limit * 1 },
      ];

      orders = await Order.aggregate(query);
      allGrandTotals = await Order.find({
        archive: adminType === 'printing' ? true : false,
        createdAdminId: adminId
      }).select('grandTotal')

      console.log('sumOfNetTotal:', allGrandTotals);

      count = await Order.countDocuments({
        $and: [
          archivedAtQuery,
          { archive: adminType === 'printing' ? true : false },
          { createdAdminId: adminId },
        ],
      });
    }

    const mergedData = {};

    orders.forEach(item => {
      const { archivedAt } = item;
      if (!mergedData[archivedAt]) {
        mergedData[archivedAt] = { ...item };
      } else {
        mergedData[archivedAt] = {
          ...mergedData[archivedAt],
          ...item,
        };
      }
    });

    const result = Object.values(mergedData);

    const currencySymbol = await commonModel.findOne({ createdAdminId: adminId })
      .select('currency')

    const sum = allGrandTotals.reduce(
      (prevVal, currVal) => prevVal + currVal.grandTotal,
      0
    );

    console.log('sumOfNetTotal:', sum);

    return res.status(200).json({
      message: "fetched ordered items",
      orders: adminType === 'printing' ? result : orders,
      sumOfNetTotal: sum,
      totalPages: count,
      autoArchiveTime,
      currency: currencySymbol.currency,
      showDownloadButton: orders ? true : false,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getArchivedOrdersDates = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, searchString = "", timeZone } = req.query;

    console.log("searchString :>> ", searchString);

    const adminId = req.headers.adminid || "";

    const {
      startTimeToCheck,
      endTimeToCheck,
      currentTimeToCheck,
      endTimeForArchivedOrders,
    } = await dateChecker(adminId);

    let orders;
    let filter = {};

    // if (
    //   moment(currentTimeToCheck).isAfter(moment(startTimeToCheck)) &&
    //   moment(currentTimeToCheck).isBefore(moment(endTimeToCheck))
    // ) {
    //   filter = { createdAt: { $lte: new Date(endTimeForArchivedOrders) } };
    // } else {
    //   filter = { createdAt: { $lte: new Date(endTimeToCheck) } };
    // }

    if (searchString) {
      const date = new Date(searchString);
      const start = date.setHours(0, 0, 0, 0);
      const end = date.setHours(23, 59, 59, 999);
      filter = {
        archivedAt: {
          $regex: new RegExp(searchString, 'i'),
        }
      };
    }
    console.log('filter:', filter);

    orders = await Order.aggregate([
      {
        $match: {
          createdAdminId: adminId,
          archive: true,
          ...filter,
        },
      },
      {
        $group: {
          _id: "$archivedAt",
          createdAt: { $max: "$createdAt" },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
      {
        $facet: {
          data: [{ $skip: (page - 1) * limit }, { $limit: limit * 1 }],
          count: [
            {
              $count: "total",
            },
          ],
        },
      },
    ]);

    const parseDate = (dateString) => {
      console.log('dateString:', dateString);
      if (dateString?.includes(' ') !== false) {
        const [datePart, timePart, ampm] = dateString != null
          ? dateString.split(' ')
          : [null, null, null]
        const [day, month, year] = datePart != null ? datePart.split('/') : [null, null, null];
        const [hours, minutes] = timePart != null ? timePart.split(':') : [null, null];
        const isPM = ampm === 'PM';

        let hour = parseInt(hours, 10);

        if (isPM && hour < 12) {
          hour += 12;
        }

        const formattedDateString = `${year}-${month}-${day} ${hour}:${minutes}`;
        return new Date(formattedDateString);
      }
    };

    orders[0]?.data.sort((a, b) => parseDate(b._id) - parseDate(a._id));

    return res.status(200).json({
      message: "fetched archived orders",
      orders: orders[0]?.data || [],
      totalPages: orders[0]?.count[0]?.total || 0,
      showDownloadButton: true,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getTodaysOrderedItems = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const { adminType } = req.query
    const {
      startTimeToCheck,
      endTimeToCheck,
      currentTimeToCheck,
      nextDayStartTime,
      currentTime,
      deliveryStartTime,
      deliveryEndTime,
    } = await dateChecker(adminId);

    let items;

    // if (
    //   moment(currentTimeToCheck).isAfter(moment(startTimeToCheck)) &&
    //   moment(currentTimeToCheck).isBefore(moment(endTimeToCheck))
    // ) {
    //   items = await Order.find({
    //     $and: [
    //       {
    //         createdAt: { $gte: startTimeToCheck },
    //       },
    //       {
    //         createdAt: { $lte: endTimeToCheck },
    //       },
    //       { createdAdminId: adminId },
    //     ],
    //   })
    //     .sort({ _id: -1 })
    //     .select("items user");
    // } else {
    //   items = await Order.find({
    //     $and: [
    //       {
    //         createdAt: { $gte: endTimeToCheck },
    //       },
    //       {
    //         createdAt: { $lte: nextDayStartTime },
    //       },
    //       { createdAdminId: adminId },
    //     ],
    //   })
    //     .sort({ _id: -1 })
    //     .select("items user");
    // }
    let archivedAtQuery = {}
    if (adminType === 'printing') {
      archivedAtQuery = {
        archivedAt: {
          $regex: new RegExp(moment(currentTimeToCheck).format('DD/MM/YYYY'), 'i'),
        },
      }
    }

    items = await Order.find({
      $and: [
        // {
        //   createdAt: { $gte: startTimeToCheck },
        // },
        archivedAtQuery,
        {
          // createdAt: { $lte: endTimeToCheck },
          archive: adminType === 'printing' ? true : false,
        },
        { createdAdminId: adminId },
      ],
    })
      .sort({ _id: -1 })
      .select("items user archivedAt")
      .lean()

    console.log('items:', items);
    const mergedData = {};

    items.forEach(item => {
      const { archivedAt } = item;
      if (!mergedData[archivedAt]) {
        mergedData[archivedAt] = { ...item };
      } else {
        mergedData[archivedAt] = {
          ...mergedData[archivedAt],
          ...item,
        };
      }

    });
    const result = Object.values(mergedData);
    console.log('result:', result);
    const currencySymbol = await commonModel.findOne({ createdAdminId: adminId }).select('currency')
    return res.status(200).json({
      message: "fetched ordered items",
      currency: currencySymbol.currency,
      items: adminType === 'printing' ? result : items,
      showDownloadButton: items ? true : false,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getOrderedItems = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    const { adminType } = req.query

    const {
      startTimeToCheck,
      endTimeToCheck,
      currentTimeToCheck,
      nextDayStartTime,
      currentTime,
      deliveryStartTime,
      deliveryEndTime,
      timeZone,
      autoArchiveTime
    } = await dateChecker(adminId);
    // const thresholdTime = momentTime.tz(`${autoArchiveTime.hours}:${autoArchiveTime.minutes} ${autoArchiveTime.amPm}`, 'h:mm A', timeZone);
    // const currentTimeArchive = moment.tz(timeZone);
    // if (currentTimeArchive.isAfter(thresholdTime)) {
    //   await Order.updateMany(
    //     {
    //       archive: false,
    //       createdAt: {
    //         $lte: thresholdTime.toDate(),
    //       },
    //       createdAdminId: adminId,
    //     },
    //     {
    //       $set: {
    //         archive: true,
    //       },
    //     }
    //   );
    // }

    let items;

    // if (
    //   moment(currentTimeToCheck).isAfter(moment(startTimeToCheck)) &&
    //   moment(currentTimeToCheck).isBefore(moment(endTimeToCheck))
    // ) {
    //   items = await Order.find({
    //     $and: [
    //       {
    //         createdAt: { $gte: startTimeToCheck },
    //       },
    //       {
    //         createdAt: { $lte: endTimeToCheck },
    //       },
    //       { archive: false },
    //       { createdAdminId: adminId },
    //     ],
    //   }).select("items user");
    // } else {
    //   items = await Order.find({
    //     $and: [
    //       {
    //         createdAt: { $gte: endTimeToCheck },
    //       },
    //       {
    //         createdAt: { $lte: nextDayStartTime },
    //       },
    //       { archive: false },
    //       { createdAdminId: adminId },
    //     ],
    //   }).select("items user");
    // }
    let archivedAtQuery = {}
    if (adminType === 'printing') {
      archivedAtQuery = {
        archivedAt: {
          $regex: new RegExp(moment(currentTimeToCheck).format('DD/MM/YYYY'), 'i'),
        },
      }
    }

    items = await Order.find({
      $and: [
        // {
        //   createdAt: { $gte: endTimeToCheck },
        // },
        // {
        //   createdAt: { $lte: nextDayStartTime },
        // },
        archivedAtQuery,
        { archive: adminType === 'printing' ? true : false },
        { createdAdminId: adminId },
      ],
    }).select("items currency user archivedAt")
      .lean();

    console.log('items:', items);
    const mergedData = {};

    items.forEach(item => {
      const { archivedAt } = item;
      if (!mergedData[archivedAt]) {
        mergedData[archivedAt] = { ...item };
      } else {
        mergedData[archivedAt] = {
          ...mergedData[archivedAt],
          ...item,
        };
      }

    });
    const result = Object.values(mergedData);
    console.log('result:', result);

    return res.status(200).json({
      message: "fetched ordered items",
      items: adminType === 'printing' ? result : items,
      autoArchiveTime,
      showDownloadButton: items ? true : false,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const getArchivedOrderedItems = async (req, res, next) => {
  try {
    const adminId = req.headers.adminid || "";
    console.log('getArchivedOrderedItems');

    const { endTimeToCheck } = await dateChecker(adminId);

    const items = await Order.find({
      createdAdminId: adminId,
      createdAt: {
        $lte: endTimeToCheck,
        archive: true,
      },
    }).select("items");

    return res.status(200).json({
      message: "fetched ordered items",
      items,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

const deleteOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const adminId = req.headers.adminid || "";

    const OrderNeedsToBeDeleted = await Order.findByIdAndDelete(orderId);
    const {
      startTimeToCheck,
      endTimeToCheck,
      currentTimeToCheck,
      nextDayStartTime,
    } = await dateChecker(adminId);

    if (!OrderNeedsToBeDeleted) {
      throw new BadRequest("Order not found");
    }

    let orders;

    if (
      moment(currentTimeToCheck).isAfter(moment(startTimeToCheck)) &&
      moment(currentTimeToCheck).isBefore(moment(endTimeToCheck))
    ) {
      orders = await Order.find({
        $and: [
          {
            createdAt: { $gte: startTimeToCheck },
          },
          {
            createdAt: { $lte: endTimeToCheck },
          },
        ],
      });
    } else {
      orders = await Order.find({
        $and: [
          {
            createdAt: { $gte: endTimeToCheck },
          },
          {
            createdAt: { $lte: nextDayStartTime },
          },
        ],
      });
    }

    const counter = await Counter.find({ createdAdminId: adminId }).select(
      "-__v"
    );

    const dataToModify = orders.filter(
      (order) => order.orderNumber > OrderNeedsToBeDeleted.orderNumber
    );

    let ordersUpdated;

    if (dataToModify.length > 0) {
      const bulkUpdateData = dataToModify.map((item, index) => ({
        updateOne: {
          filter: {
            _id: item._id,
          },
          update: {
            orderNumber:
              index === 0 ? item.orderNumber - index - 1 : item.orderNumber - 1,
          },
        },
      }));
      ordersUpdated = await Order.bulkWrite(bulkUpdateData);
    }

    if (counter.length > 0) {
      const query = { _id: counter[0]._id };
      const update = {
        $set: {
          orderNumber: counter[0].orderNumber - 1,
        },
      };
      const options = { new: false, useFindAndModify: false };
      await Counter.findOneAndUpdate(query, update, options);
    }

    return res.status(200).json({
      message: "Order Deleted Successfully!",
      ordersUpdated,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports = {
  placeAnOrder,
  deleteOrder,
  getAllOrders,
  getOrders,
  getMyOrders,
  editOrders,
  getTodaysOrderedItems,
  getOrderedItems,
  getTodaysOrders,
  getArchivedOrdersDates,
  getArchivedOrderedItems,
};
