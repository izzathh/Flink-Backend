const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require("validator");

const UserSchema = new Schema(
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
    name: {
      type: String,
      required: [true, "Please enter a valid name"],
    },
    password: { type: String, required: [true, "Please enter a password"] },
    branchCode: {
      type: String
    },
    googleMapLocation: {
      type: String,
      // required: [true, "Google map location cannot be empty"],
    },
    houseNumber: {
      type: String,
      // required: [true, "Please enter a valid flat number"],
    },
    streetAddress: {
      type: String,
      required: [true, "Please enter a street address"],
    },
    phoneNumber: {
      type: String,
      required: [true, "Please enter a valid phone number"],
    },
    max_daily_order: {
      type: String,
    },
    createdAdminId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
