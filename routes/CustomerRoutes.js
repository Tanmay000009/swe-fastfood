const express = require("express");
const bcrypt = require("bcrypt");
const Customer = require("../models/Customer");
const getToken = require("../utils/getToken");
const validate = require("../utils/validate");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

router.get("/order-history", validate, async (req, res) => {
  const userName = req.decodedToken.userName;
  const customer = await Customer.findOne({ userName: userName });
  if (req.session.token) {
    req.session.token = req.session.token;
    res.render("customer_completed_orders.ejs", {
      msg: "",
      customer,
    });
  } else {
    res.render("login.ejs", { user: "Customer", msg: "Login expired!" });
  }
});

router.get("/current-orders", validate, async (req, res) => {
  const userName = req.decodedToken.userName;
  const customer = await Customer.findOne({ userName: userName });
  if (req.session.token) {
    req.session.token = req.session.token;
    res.render("customer_current_order.ejs", {
      msg: "",
      customer,
    });
  } else {
    res.render("login.ejs", { user: "Customer", msg: "Login expired!" });
  }
});

router.get("/dashboard", validate, async (req, res) => {
  const userName = req.decodedToken.userName;
  const customer = await Customer.findOne({ userName: userName });
  const restaurants = await Restaurant.find();
  if (req.session.token) {
    req.session.token = req.session.token;
    res.render("customer_home.ejs", {
      msg: "",
      customer,
      restaurants,
    });
  } else {
    res.render("login.ejs", { user: "Customer", msg: "Login expired!" });
  }
});

router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/customer");
  } else {
    res.render("login.ejs", { user: "Customer", msg: "" });
  }
});

router.get("/signup", (req, res) => {
  if (req.session.user) {
    res.redirect("/customer");
  } else {
    res.render("signup.ejs", { user: "Customer", msg: "" });
  }
});

// Get all customers || Get a specific customer
router.get("/", async (req, res) => {
  const { email, username: userName } = req.query;

  try {
    if (email) {
      const customer = await Customer.findOne({ email });
      res.json(customer);
    } else if (userName) {
      const customer = await Customer.findOne({ userName });
      res.json(customer);
    } else {
      const customers = await Customer.find();
      res.json(customers);
    }
  } catch (err) {
    console.log("Error in getting customers", err);
    res.sendStatus(500);
  }
});

// Create a new customer
router.post("/", async (req, res) => {
  const { email, password, name, phone, userName } = req.body;
  if (!email || !password || !name || !phone || !userName) {
    res.render("signup.ejs", {
      user: "Customer",
      msg: "Please enter all fields",
    });
  }
  if (password.length < 6) {
    res.render("signup.ejs", {
      user: "Customer",
      msg: "Password must be at least 6 characters",
    });
    return;
  }
  if (phone.length < 10 || phone.length > 10) {
    res.render("signup.ejs", {
      user: "Customer",
      msg: "Phone number must be 10 characters",
    });
    return;
  }
  if (userName.length < 6) {
    res.render("signup.ejs", {
      user: "Customer",
      msg: "Username must be at least 6 characters",
    });
    return;
  }
  // check for existing user
  const existingCustomer = await Customer.findOne({ email });
  if (existingCustomer) {
    res.render("signup.ejs", {
      user: "Customer",
      msg: "User already exists",
    });
    return;
  }
  const existingUser = await Customer.findOne({ userName });
  if (existingUser) {
    res.render("signup.ejs", {
      user: "Customer",
      msg: "Username already exists",
    });
    return;
  }
  // hash password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  req.body.password = hash;
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.render("index.ejs", {
      msg: "Customer created successfully! Please login",
    });
  } catch (err) {
    console.log("Error in creating customer", err);
    res.render("signup.ejs", {
      user: "Customer",
      msg: "Error in creating customer! Please try again",
    });
  }
});

// Update a customer
router.put("/", validate, async (req, res) => {
  const { email, password, name, phone, userName } = req.body;

  const username = req.decodedToken.userName;

  if (!username) {
    // unauthorized
    res.sendStatus(401);
    return;
  }

  if (email) {
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      res.status(400).json({ msg: `User with email: ${email} already exists` });
      return;
    }
  }
  if (userName) {
    if (userName.length < 6) {
      res.status(400).json({ msg: "Username must be at least 6 characters" });
      return;
    }
    const existingUser = await Customer.findOne({ userName });
    if (existingUser) {
      res.status(400).json({ msg: `Username: ${userName} already exists` });
      return;
    }
  }

  if (password) {
    if (password.length < 6) {
      res.status(400).json({ msg: "Password must be at least 6 characters" });
      return;
    }
    // hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    req.body.password = hash;
  }
  if (phone) {
    if (phone.length < 10 || phone.length > 10) {
      res.status(400).json({ msg: "Phone number must be 10 characters" });
      return;
    }
  }

  try {
    const customer = await Customer.findOneAndUpdate(
      { userName: username },
      req.body,
      {
        new: true,
      }
    );
    if (!customer) {
      res.status(500);
      return;
    }
    res.status(200).json({ msg: "Customer details updated successfully" });
  } catch (err) {
    console.log("Error in updating customer", err);
    res.sendStatus(500);
  }
});

// Delete a customer
router.delete("/:customerId", validate, async (req, res) => {
  const { customerId } = req.params;

  if (!customerId) {
    res.status(400).json({ msg: "Please enter a customer id" });
    return;
  }

  const username = req.decodedToken.userName;
  if (!username) {
    // unauthorized
    res.sendStatus(401);
    return;
  }
  try {
    const customer = await Customer.findById(req.params.customerId);

    if (!customer) {
      res.status(500);
      return;
    }

    if (customer.userName != username) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    await Customer.findByIdAndDelete(req.params.customerId);
    res.sendStatus(200);
  } catch (err) {
    console.log("Error in deleting customer", err);
    res.sendStatus(500);
  }
});

// Login a customer
router.post("/login", async (req, res) => {
  try {
    const customer = await Customer.findOne({ userName: req.body.userName });

    if (!customer) {
      return res.render("login.ejs", {
        user: "User",
        msg: "Incorrect Username/Password",
      });
    } else {
      bcrypt.compare(
        req.body.password,
        customer.password,
        async (err, result) => {
          if (err) {
            console.log(err);
            return res.render("login.ejs", {
              user: "User",
              msg: "Incorrect Username/Password",
            });
          } else if (result) {
            console.log(result);
            const info = {
              userName: customer.userName,
            };
            const token = getToken(info, "2h");
            req.session.token = token;
            const restaurants = await Restaurant.find();
            res.render("customer_home.ejs", {
              msg: "",
              customer,
              token,
              restaurants,
            });
          } else {
            res.status(401).json({ msg: "Incorrect Username or Password" });
            return;
          }
        }
      );
    }
  } catch (err) {
    console.log("Error in logging in customer", err);
    res.render("login.ejs", {
      user: "Customer",
      msg: "Error in logging in customer! Please try again",
    });
  }
});

// Logout a owner
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
