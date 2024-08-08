const mongoose = require("mongoose");
const Schema = mongoose.Schema;
// const AutoIncrement = require("mongoose-sequence")(mongoose);

const OrderSchema = new Schema(
  {
    orderNumber: {
      type: Number,
    },
    items: [],
    user: { type: Schema.Types.ObjectId, ref: "User" },
    deliveryCharge: { type: Number },
    currency: { type: String },
    grandTotal: { type: Number },
    archive: { type: Boolean },
    archivedAt: { type: String },
    createdAdminId: { type: String, required: true },
    transactionId: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", OrderSchema);
