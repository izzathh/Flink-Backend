const Common = require("../models/common.model");
const moment = require("moment");

const dateChecker = async (adminId) => {
  console.log('adminId:', adminId)
  const common = await Common.find({ createdAdminId: adminId }).select("-__v");
  console.log('common:', common)

  const startTime = moment(common[0].deliveryHours.deliveryStartTime)
    .utc()
    .format("HH:mm:ss");

  const endTime = moment(common[0].deliveryHours.deliveryEndTime)
    .utc()
    .format("HH:mm:ss");

  const currentTime = moment().utc().format("HH:mm:ss");

  const remodifiedStartTime = moment()
    .utc()
    .subtract("1", "day")
    .hour(endTime.split(":")[0])
    .minute(endTime.split(":")[1])
    .second(endTime.split(":")[2])
    .format();

  const remodifiedNextDayStartTime = moment()
    .utc()
    .add("1", "day")
    .hour(startTime.split(":")[0])
    .minute(startTime.split(":")[1])
    .second(startTime.split(":")[2])
    .format();

  const remodifiedNextDayEndTime = moment()
    .utc()
    .add("1", "day")
    .hour(endTime.split(":")[0])
    .minute(endTime.split(":")[1])
    .second(endTime.split(":")[2])
    .format();

  const remodifiedEndTime = moment()
    .utc()
    .hour(endTime.split(":")[0])
    .minute(endTime.split(":")[1])
    .second(endTime.split(":")[2])
    .format();

  const remodifiedCurrentTime = moment().utc().format();

  const endTimeForArchivedOrders = moment()
    .utc()
    .subtract("1", "day")
    .hour(endTime.split(":")[0])
    .minute(endTime.split(":")[1])
    .second(endTime.split(":")[2])
    .format();

  const timeZone = common[0].deliveryHours.timeZone;
  const autoArchiveTime = common[0].deliveryHours.autoArchiveTime;

  return {
    deliveryStartTime: startTime,
    deliveryEndTime: endTime,
    currentTime,
    startTimeToCheck: remodifiedStartTime,
    endTimeToCheck: remodifiedEndTime,
    nextDayStartTime: remodifiedNextDayStartTime,
    nextDayEndTime: remodifiedNextDayEndTime,
    currentTimeToCheck: remodifiedCurrentTime,
    endTimeForArchivedOrders,
    timeZone,
    autoArchiveTime
  };
};

module.exports = { dateChecker };
