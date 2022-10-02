const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    itemName: {
      type: String,
      required: true,
      unique: true,
    },
    itemPrice: {
      type: Number,
      required: true,
    },
    itemDescription: {
      type: String,
    },
    itemCategory: {
      type: String,
      required: true,
    },
    itemImage: {
      type: String,
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurant",
    },
  },
  {
    timestamps: true,
  }
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = MenuItem;
