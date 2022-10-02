const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
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
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;
