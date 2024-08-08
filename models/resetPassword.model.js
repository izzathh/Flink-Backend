const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const resetPasswordSchema = Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User" },
    created: {
      type: Date,
      required: true,
    },
    otp: { type: String, required: true },
    used: { type: Boolean },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResetPassword", resetPasswordSchema);
