const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ItemWrapperSchema = new Schema(
  {
    itemName: {
      type: String,
      required: [true, "please enter an item name"],
    },
    items: [{ type: Schema.Types.ObjectId, ref: "Item" }],
    createdAdminId: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ItemWrapper", ItemWrapperSchema);
