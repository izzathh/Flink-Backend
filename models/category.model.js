const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    categoryName: {
      type: String,
      required: true
      // unique: [true, "Category must be unique"],
    },
    serialNumber: { type: Number, index: true },
    itemsWrapper: [{ type: Schema.Types.ObjectId, ref: "ItemWrapper" }],
    createdAdminId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", categorySchema);
