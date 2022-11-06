const express = require("express");
const Customer = require("../models/Customer");
const MenuItem = require("../models/MenuItem");
const Owner = require("../models/Owner");
const Restaurant = require("../models/Restaurant");
const validate = require("../utils/validate");
const router = express.Router();

router.get("/update-menu", validate, async (req, res) => {
  const userName = req.decodedToken.userName;
  const owner = await Owner.findOne({ userName: userName });
  const restaurant = await Restaurant.findOne({ ownerId: owner._id });
  const menuItems = await MenuItem.find({ restaurantId: restaurant._id });
  console.log(menuItems);
  if (req.session.owner) {
    req.session.token = req.session.token;
    res.render("owner_update_menu.ejs", {
      msg: "",
      owner,
      restaurant,
      menuItems,
    });
  } else {
    res.render("login.ejs", { user: "Owner", msg: "Login expired!" });
  }
});

router.get("/current-orders", validate, async (req, res) => {
  const userName = req.decodedToken.userName;
  const owner = await Owner.findOne({ userName: userName });
  const restaurant = await Restaurant.findOne({ ownerId: owner._id });
  if (req.session.owner) {
    req.session.token = req.session.token;
    res.render("owner_current_orders.ejs", { msg: "", owner, restaurant });
  } else {
    res.render("login.ejs", { user: "Owner", msg: "Login expired!" });
  }
});

router.get("/completed-orders", validate, async (req, res) => {
  const userName = req.decodedToken.userName;
  const owner = await Owner.findOne({ userName: userName });
  const restaurant = await Restaurant.findOne({ ownerId: owner._id });
  if (req.session.owner) {
    req.session.token = req.session.token;
    res.render("owner_completed_orders.ejs", { msg: "", owner, restaurant });
  } else {
    res.render("login.ejs", { user: "Owner", msg: "Login expired!" });
  }
});

router.get("/dashboard", validate, async (req, res) => {
  const userName = req.decodedToken.userName;
  const owner = await Owner.findOne({ userName: userName });
  const restaurant = await Restaurant.findOne({ ownerId: owner._id });
  if (req.session.owner) {
    req.session.token = req.session.token;
    res.render("owner_home.ejs", { msg: "", restaurant, owner });
  } else {
    res.render("login.ejs", { user: "Owner", msg: "Login expired!" });
  }
});

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
router.get("/:restaurantId", validate, async (req, res) => {
  const userName = req.decodedToken.userName;
  const restaurantId = req.params.restaurantId;
  const customer = await Customer.findOne({ userName: userName });
  const restaurant = await Restaurant.findOne({ _id: restaurantId });
  const menuItems = await MenuItem.find({ restaurantId: restaurantId });
  const restaurants = await Restaurant.find();
  req.session.token = req.session.token;
  try {
    if (req.session.token) {
      res.render("restaurant.ejs", {
        msg: "",
        restaurant,
        customer,
        menuItems,
      });
    } else {
      res.render("login.ejs", { user: "Customer", msg: "Login expired!" });
    }
  } catch (err) {
    res.render("customer_home.ejs", {
      msg: "Restaurant not found!",
      customer,
      restaurants,
    });
  }
});

// Get a specific restaurant with msg
router.get("/:restaurantId/:msg", validate, async (req, res) => {
  console.log("In get restaurant with msg");
  const userName = req.decodedToken.userName;
  const restaurantId = req.params.restaurantId;
  const msg = req.params.msg;
  console.log(restaurantId, msg);
  const customer = await Customer.findOne({ userName: userName });
  const restaurant = await Restaurant.findOne({ _id: restaurantId });
  const menuItems = await MenuItem.find({ restaurantId: restaurantId });
  const restaurants = await Restaurant.find();
  req.session.token = req.session.token;
  try {
    if (req.session.token) {
      res.render("restaurant.ejs", {
        msg,
        restaurant,
        customer,
        menuItems,
      });
    } else {
      res.render("login.ejs", { user: "Customer", msg: "Login expired!" });
    }
  } catch (err) {
    res.render("customer_home.ejs", {
      msg: "Restaurant not found!",
      customer,
      restaurants,
    });
  }
});

// Create a new restaurant
router.post("/", validate, async (req, res) => {
  const ownerId = req.body.ownerId;
  console.log(req.body);
  console.log("ownerId", ownerId);
  // verify owner
  const owner = await Owner.findById(ownerId);

  if (!owner) {
    res.render("add_new_restaurant.ejs", {
      ownerId,
      msg: "Owner not found",
    });
  }

  req.session.token = req.session.token;
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
  const existingRestaurant = await Restaurant.findOne({
    ownerId,
  });
  if (existingRestaurant) {
    res.render("owner_home.ejs", {
      ownerId,
      restaurant: existingRestaurant,
      msg: "Restaurant already exists",
    });
  }

  try {
    const restaurant = new Restaurant({
      email,
      restaurantName,
      restaurantPhone,
      restaurantAddress,
      restaurantZip,
      ownerId,
      ownerName: owner.name,
    });
    console.log("restaurant", restaurant);
    await restaurant.save();
    res.render("owner_home.ejs", {
      ownerId,
      restaurant,
      msg: "Restaurant created successfully",
    });
  } catch (err) {
    console.log("Error in creating restaurant", err);
    res.sendStatus(500);
  }
});

// Update a restaurant
router.put("/:restaurantId", validate, async (req, res) => {
  const ownerUserName = req.decodedToken.userName;
  // verify owner
  const owner = await Owner.findOne({ userName: ownerUserName });
  if (!owner) {
    res.status(400).json({ msg: "User does not exist" });
    return;
  }
  const restaurant = await Restaurant.findById(req.params.restaurantId);
  if (!restaurant) {
    res.status(404).json({ msg: "Restaurant does not exist" });
    return;
  }
  if (restaurant.ownerId == owner._id) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const { restaurantPhone } = req.body;

  if (restaurantPhone && restaurantPhone.length !== 10) {
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
  const owner = await Owner.findOne({ userName: ownerUserName });
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
