const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const CounterSchema = new Schema(
  {
    orderNumber: { type: Number },
    serialNumber: { type: Number },
    createdAdminId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Counter", CounterSchema);
