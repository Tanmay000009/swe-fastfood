const express = require("express");
const Owner = require("../models/Owner");
const Restaurant = require("../models/Restaurant");
const validate = require("../utils/validate");
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
router.post("/", validate, async (req, res) => {
  const ownerUserName = req.decodedToken.userName;
  console.log("ownerUserName", req.decodedToken);
  // verify owner
  const owner = await Owner.findOne({ userName: ownerUserName });

  if (!owner) {
    res.status(400).json({ msg: "User does not exist" });
    return;
  }

  const {
    email,
    restaurantName,
    restaurantPhone,
    restaurantAddress,
    restaurantZip,
  } = req.body;
  if (
    !email ||
    !restaurantName ||
    !restaurantPhone ||
    !restaurantAddress ||
    !restaurantZip
  ) {
    res.status(400).json({ msg: "Please enter all fields" });
    return;
  }
  if (restaurantPhone.length < 10 || restaurantPhone.length > 10) {
    res.status(400).json({ msg: "Phone number must be 10 characters" });
    return;
  }
  if (restaurantZip.length !== 6) {
    res.status(400).json({ msg: "Zip code must be 6 characters" });
    return;
  }
  // check for existing restaurant
  const existingRestaurant = await Restaurant.findOne({ email });
  if (existingRestaurant) {
    res.status(400).json({ msg: "Restaurant already exists" });
    return;
  }

  req.body.ownerId = owner._id;
  req.body.ownerName = owner.name;

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
router.put("/:restaurantId", validate, async (req, res) => {
  const ownerUserName = req.decodedToken.owner;
  // verify owner
  const owner = await owner.findOne({ userName: ownerUserName });
  if (!owner) {
    res.status(400).json({ msg: "User does not exist" });
    return;
  }
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  if (!restaurant) {
    res.status(404).json({ msg: "Restaurant does not exist" });
    return;
  }
  if (restaurant.ownerId !== owner._id) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const { restaurantPhone } = req.body;

  if (restaurantPhone && restaurantPhone.length === 10) {
    res.status(400).json({ msg: "Phone number must be 10 characters" });
    return;
  }
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
router.delete("/:restaurantId", validate, async (req, res) => {
  const ownerUserName = req.decodedToken.owner;
  // verify owner
  const owner = await owner.findOne({ userName: ownerUserName });
  if (!owner) {
    res.status(400).json({ msg: "User does not exist" });
    return;
  }
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  if (!restaurant) {
    res.status(404).json({ msg: "Restaurant does not exist" });
    return;
  }
  if (restaurant.ownerId !== owner._id) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

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
