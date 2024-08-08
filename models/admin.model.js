const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require("validator");

const AdminSchema = new Schema(
  {
    email: {
      type: String,
      trim: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Invalid Email",
        isAsync: false,
      },
      required: [true, "Please enter a valid password"],
      unique: [true, "This email already exists"],
    },
    password: {
      type: String,
      trim: true,
      required: [true, "Please enter a valid password"],
    },
    branchCode: {
      type: String,
    },
    branchName: {
      type: String,
    },
    adminType: {
      type: String,
      trim: true,
      required: [true, "Please select a adminType"],
    },
    createdAdminId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", AdminSchema, "admins");
