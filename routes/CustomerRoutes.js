const express = require("express");
const Customer = require("../models/Customer");
const router = express.Router();

// Get all customers
router.get("/", async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (err) {
    console.log("Error in getting customers", err);
    res.sendStatus(500);
  }
});

// Get a specific customer
router.get("/:customerId", async (req, res) => {
  try {
    const customer = await Customer.findById(req.params.customerId);
    res.json(customer);
  } catch (err) {
    console.log("Error in getting customer", err);
    res.sendStatus(500);
  }
});

// Create a new customer
router.post("/", async (req, res) => {
  try {
    const customer = new Customer(req.body);
    await customer.save();
    res.json(customer);
  } catch (err) {
    console.log("Error in creating customer", err);
    res.sendStatus(500);
  }
});

// Update a customer
router.put("/:customerId", async (req, res) => {
  try {
    const customer = await Customer.findByIdAndUpdate(
      req.params.customerId,
      req.body,
      { new: true }
    );
    res.json(customer);
  } catch (err) {
    console.log("Error in updating customer", err);
    res.sendStatus(500);
  }
});

// Delete a customer
router.delete("/:customerId", async (req, res) => {
  try {
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
    const customer = await Customer.findOne({ email: req.body.email });
    if (!customer) {
      res.sendStatus(404);
    } else {
      bcrypt.compare(req.body.password, customer.password, (err, result) => {
        if (err) {
          res.sendStatus(500);
        } else if (result) {
          req.session.customer = customer;
          res.json(customer);
        } else {
          res.sendStatus(401);
        }
      });
    }
  } catch (err) {
    console.log("Error in logging in customer", err);
    res.sendStatus(500);
  }
});

module.exports = router;
