const { format } = require("date-fns");
const Common = require("../models/common.model");
const {
  getModifiedDateAndTimeWithoutFormat,
} = require("./modifiedDateAndTime");

const checkDeliveryHours = async (adminId) => {
  const common = await Common.find({ createdAdminId: adminId }).select("-__v");
  if (!common) {
    return {};
  }

  const startTime = format(
    new Date(
      getModifiedDateAndTimeWithoutFormat(
        common[0].deliveryHours.deliveryStartTime,
        common[0].deliveryHours.timeZone
      )
    ),
    "HH:mm"
  );

  const endTime = format(
    new Date(
      getModifiedDateAndTimeWithoutFormat(
        common[0].deliveryHours.deliveryEndTime,
        common[0].deliveryHours.timeZone
      )
    ),
    "HH:mm"
  );

  const currentTime = format(
    new Date(
      getModifiedDateAndTimeWithoutFormat(
        new Date(),
        common[0].deliveryHours.timeZone
      )
    ),
    "HH:mm"
  );

  const isDeliveryHoursCheck =
    currentTime >= startTime && currentTime <= endTime;
  return { isDeliveryHoursCheck, startTime, endTime, currentTime };
};

module.exports = { checkDeliveryHours };
