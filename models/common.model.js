const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CommonSchema = new Schema(
  {
    currency: { type: String, min: 1, max: 3 },
    paymentAccountNumber: { type: String },
    deliveryCharge: { type: Number },
    minOrderAmount: { type: Number, min: 1 },
    noticeText: { type: String },
    deliveryHours: {
      deliveryStartTime: Date,
      deliveryEndTime: Date,
      timeZone: String,
      timeZoneOffset: String,
      autoArchiveTime: Object,
    },
    contactDetails: { type: String },
    createdAdminId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Common", CommonSchema);
