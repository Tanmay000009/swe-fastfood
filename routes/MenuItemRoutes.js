const express = require("express");
const MenuItem = require("../models/MenuItem");
const Restaurant = require("../models/Restaurant");
const validate = require("../utils/validate");

const router = express();

// Get all menu items
router.get("/", async (req, res) => {
  try {
    const menuItems = await MenuItem.find();
    res.json(menuItems);
  } catch (err) {
    console.log("Error in getting menu items", err);
    res.sendStatus(500);
  }
});

// Get a specific menu item
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const menuItem = await MenuItem.findById(id);
    res.json(menuItem);
  } catch (err) {
    console.log("Error in getting menu item", err);
    res.sendStatus(500);
  }
});

// Create a new menu item
router.post("/", validate, async (req, res) => {
  const { name, description, price, image, restaurantId } = req.body;

  const userName = req.decodedToken.userName;

  if (!name || !description || !price || !image || !restaurantId) {
    res.status(400).json({ msg: "Please enter all fields" });
    return;
  }
  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(400).json({ msg: "Restaurant does not exist" });
      return;
    }
    if (restaurant.userName !== userName) {
      res.status(400).json({
        msg: "You are not authorized to create a menu item for this restaurant",
      });
      return;
    }

    const menuItem = await MenuItem.create({
      name,
      description,
      price,
      image,
      restaurantId,
    });
    res.json(menuItem);
  } catch (err) {
    console.log("Error in creating menu item", err);
    res.sendStatus(500);
  }
});

// Update a specific menu item
router.put("/:id", validate, async (req, res) => {
  const { id } = req.params;
  const userName = req.decodedToken.userName;

  if (!userName) {
    res.status(400).json({ msg: "Please enter all fields" });
    return;
  }

  try {
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      res.status(400).json({ msg: "Menu item does not exist" });
      return;
    }
    const restaurant = await Restaurant.findById(menuItem.restaurantId);
    if (!restaurant) {
      res.status(400).json({ msg: "Restaurant does not exist" });
      return;
    }

    if (restaurant.userName !== userName) {
      res.status(400).json({
        msg: "You are not authorized to update this menu item",
      });
      return;
    }

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(id, req.body, {
      new: true,
    });

    res.json(updatedMenuItem);
  } catch (err) {
    console.log("Error in updating menu item", err);
    res.sendStatus(500);
  }
});

// Delete a specific menu item
router.delete("/:id", validate, async (req, res) => {
  const { id } = req.params;
  const userName = req.decodedToken.userName;

  if (!userName) {
    res.status(400).json({ msg: "Please enter all fields" });
    return;
  }

  try {
    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      res.status(400).json({ msg: "Menu item does not exist" });
      return;
    }
    const restaurant = await Restaurant.findById(menuItem.restaurantId);
    if (!restaurant) {
      res.status(400).json({ msg: "Restaurant does not exist" });
      return;
    }

    if (restaurant.userName !== userName) {
      res.status(400).json({
        msg: "You are not authorized to delete this menu item",
      });
      return;
    }

    await MenuItem.findByIdAndDelete(id);

    res.json({ msg: "Menu item deleted" });
  } catch (err) {
    console.log("Error in deleting menu item", err);
    res.sendStatus(500);
  }
});

module.exports = router;
