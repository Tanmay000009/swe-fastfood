const express = require("express");
const Menu = require("../models/Menu");
const router = express.Router();

// Get all menus
router.get("/", async (req, res) => {
  try {
    const menus = await Menu.find();
    res.json(menus);
  } catch (err) {
    console.log("Error in getting menus", err);
    res.sendStatus(500);
  }
});

// Get menu for a specific restaurant
router.get("/:restaurantId", async (req, res) => {
  try {
    // find many items in the menu collection
    const menu = await Menu.find({ restaurantId: req.params.restaurantId });
    res.json(menu);
  } catch (err) {
    console.log("Error in getting menu", err);
    res.sendStatus(500);
  }
});

// Create a new menu item
router.post("/", async (req, res) => {
  try {
    const menu = new Menu(req.body);
    await menu.save();
    res.json(menu);
  } catch (err) {
    console.log("Error in creating menu", err);
    res.sendStatus(500);
  }
});

// Update a menu item
router.put("/:menuId", async (req, res) => {
  try {
    const menu = await Menu.findByIdAndUpdate(req.params.menuId, req.body, {
      new: true,
    });
    res.json(menu);
  } catch (err) {
    console.log("Error in updating menu", err);
    res.sendStatus(500);
  }
});

// Delete a menu item
router.delete("/:menuId", async (req, res) => {
  try {
    await Menu.findByIdAndDelete(req.params.menuId);
    res.sendStatus(200);
  } catch (err) {
    console.log("Error in deleting menu", err);
    res.sendStatus(500);
  }
});

module.exports = router;
