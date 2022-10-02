const express = require("express");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

// Get all restaurants
router.get("/", async (req, res) => {
  try {
    const restaurants = await Restaurant.find();
    res.json(restaurants);
  } catch (err) {
    console.log("Error in getting restaurants", err);
    res.sendStatus(500);
  }
});

// Get a specific restaurant
router.get("/:restaurantId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    res.json(restaurant);
  } catch (err) {
    console.log("Error in getting restaurant", err);
    res.sendStatus(500);
  }
});

// Create a new restaurant
router.post("/", async (req, res) => {
  const {
    email,
    password,
    restaurantName,
    restaurantPhone,
    ownerName,
    userName,
    restaurantAddress,
    restaurantZip,
  } = req.body;
  if (
    !email ||
    !password ||
    !restaurantName ||
    !restaurantPhone ||
    !ownerName ||
    !userName ||
    !restaurantAddress ||
    !restaurantZip
  ) {
    res.status(400).json({ msg: "Please enter all fields" });
    return;
  }
  try {
    const restaurant = new Restaurant(req.body);
    await restaurant.save();
    res.json(restaurant);
  } catch (err) {
    console.log("Error in creating restaurant", err);
    res.sendStatus(500);
  }
});

// Update a restaurant
router.put("/:restaurantId", async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndUpdate(
      req.params.restaurantId,
      req.body,
      { new: true }
    );
    res.json(restaurant);
  } catch (err) {
    console.log("Error in updating restaurant", err);
    res.sendStatus(500);
  }
});

// Delete a restaurant
router.delete("/:restaurantId", async (req, res) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.restaurantId);
    res.sendStatus(200);
  } catch (err) {
    console.log("Error in deleting restaurant", err);
    res.sendStatus(500);
  }
});

// Login a restaurant-owner
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ msg: "Please enter all fields" });
  }
  try {
    const restaurant = await Restaurant.findOne({ email: req.body.email });
    if (!restaurant) {
      res.sendStatus(404);
    } else {
      bcrypt.compare(req.body.password, restaurant.password, (err, result) => {
        if (err) {
          res.sendStatus(500);
        } else if (result) {
          req.session.restaurant = restaurant;
          res.json(restaurant);
        } else {
          res.sendStatus(401);
        }
      });
    }
  } catch (err) {
    console.log("Error in logging in restaurant", err);
    res.sendStatus(500);
  }
});

module.exports = router;
