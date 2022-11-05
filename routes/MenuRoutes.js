const express = require("express");
const MenuItem = require("../models/MenuItem");
const router = express.Router();

router.get("/add-new-item", (req, res) => {
  req.session.token = req.session.token;
  res.render("add_menu_item.ejs", { msg: "" });
});

// Get all menuItems
router.get("/", async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (err) {
    console.log("Error in getting menuItems", err);
    res.sendStatus(500);
  }
});

// Get menuItem for a specific restaurant
router.get("/:restaurantId", async (req, res) => {
  try {
    // find many items in the menuItem collection
    const menuItem = await MenuItem.find({
      restaurantId: req.params.restaurantId,
    });
    res.json(menuItem);
  } catch (err) {
    console.log("Error in getting menuItem", err);
    res.sendStatus(500);
  }
});

// Create a new menuItem item
router.post("/", async (req, res) => {
  try {
    const menuItem = new MenuItem(req.body);
    await menuItem.save();
    res.json(menuItem);
  } catch (err) {
    console.log("Error in creating menuItem", err);
    res.sendStatus(500);
  }
});

// Update a menuItem item
router.put("/:menuItemId", async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.menuItemId,
      req.body,
      {
        new: true,
      }
    );
    res.json(menuItem);
  } catch (err) {
    console.log("Error in updating menuItem", err);
    res.sendStatus(500);
  }
});

// Delete a menuItem item
router.delete("/:menuItemId", async (req, res) => {
  try {
    await MenuItem.findByIdAndDelete(req.params.menuItemId);
    res.sendStatus(200);
  } catch (err) {
    console.log("Error in deleting menuItem", err);
    res.sendStatus(500);
  }
});

module.exports = router;
