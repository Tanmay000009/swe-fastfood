const express = require("express");
const bcrypt = require("bcrypt");
const Owner = require("../models/Owner");
const getToken = require("../utils/getToken");
const validate = require("../utils/validate");
const Restaurant = require("../models/Restaurant");
const router = express.Router();

router.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/owner");
  } else {
    res.render("login.ejs", { user: "Owner", msg: "" });
  }
});

router.get("/signup", (req, res) => {
  if (req.session.user) {
    res.redirect("/owner");
  } else {
    res.render("signup.ejs", { user: "Owner", msg: "" });
  }
});

router.get("/update-menu", (req, res) => {
  if (req.session.user) {
    res.render("owner_update_menu.ejs", { msg: "", ownerId });
  } else {
    res.render("signup.ejs", { user: "Owner", msg: "" });
  }
});

router.get("/new/restaurant", (req, res) => {
  const token = req.headers.authorization;
  console.log(token);
  res.render("add_new_restaurant.ejs", { user: "Owner", msg: "", token });
});

// Get all owners || Get a specific owner
router.get("/", async (req, res) => {
  const { email, username: userName } = req.query;

  try {
    if (email) {
      const owner = await Owner.findOne({ email });
      res.json(owner);
    } else if (userName) {
      const owner = await Owner.findOne({ userName });
      res.json(owner);
    } else {
      const owners = await Owner.find();
      res.json(owners);
    }
  } catch (err) {
    console.log("Error in getting owners", err);
    res.sendStatus(500);
  }
});

// Create a new owner
router.post("/", async (req, res) => {
  const { email, password, name, phone, userName } = req.body;

  if (!email || !password || !name || !phone || !userName) {
    res.render("signup.ejs", {
      user: "Owner",
      msg: "Please enter all fields",
    });
  }
  if (password.length < 6) {
    res.render("signup.ejs", {
      user: "Owner",
      msg: "Password must be at least 6 characters",
    });
    return;
  }
  if (phone.length < 10 || phone.length > 10) {
    res.render("signup.ejs", {
      user: "Owner",
      msg: "Phone number must be 10 characters",
    });
    return;
  }
  if (userName.length < 6) {
    res.render("signup.ejs", {
      user: "Owner",
      msg: "Username must be at least 6 characters",
    });
    return;
  }
  // check for existing user
  const existingOwner = await Owner.findOne({ email });
  if (existingOwner) {
    res.render("signup.ejs", {
      user: "Owner",
      msg: "User already exists",
    });
    return;
  }
  const existingUser = await Owner.findOne({ userName });
  if (existingUser) {
    res.render("signup.ejs", {
      user: "Owner",
      msg: "Username already exists",
    });
    return;
  }
  // hash password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  req.body.password = hash;
  try {
    const owner = new Owner(req.body);
    await owner.save();
    res.render("index.ejs", {
      msg: "Owner created successfully! Please login",
    });
  } catch (err) {
    console.log("Error in creating owner", err);
    res.sendStatus(500);
  }
});

// Update a owner
router.put("/", validate, async (req, res) => {
  const { email, password, name, phone, userName } = req.body;

  const username = req.decodedToken.userName;

  if (!username) {
    // unauthorized
    res.sendStatus(401);
    return;
  }

  if (email) {
    const existingOwner = await Owner.findOne({ email });
    if (existingOwner) {
      res.status(400).json({ msg: `User with email: ${email} already exists` });
      return;
    }
  }
  if (userName) {
    if (userName.length < 6) {
      res.status(400).json({ msg: "Username must be at least 6 characters" });
      return;
    }
    const existingUser = await Owner.findOne({ userName });
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
    const owner = await Owner.findOneAndUpdate(
      { userName: username },
      req.body,
      {
        new: true,
      }
    );
    if (!owner) {
      res.status(500);
      return;
    }
    res.status(200).json({ msg: "Owner details updated successfully" });
  } catch (err) {
    console.log("Error in updating owner", err);
    res.sendStatus(500);
  }
});

// Delete a owner
router.delete("/:ownerId", async (req, res) => {
  try {
    await Owner.findByIdAndDelete(req.params.ownerId);
    res.sendStatus(200);
  } catch (err) {
    console.log("Error in deleting owner", err);
    res.sendStatus(500);
  }
});

// Login a owner
router.post("/login", async (req, res) => {
  console.log(req.body);
  try {
    const owner = await Owner.findOne({ userName: req.body.userName });

    if (!owner) {
      return res.render("login.ejs", {
        user: "Owner",
        msg: "Incorrect Username/Password",
      });
    } else {
      bcrypt.compare(req.body.password, owner.password, async (err, result) => {
        if (err) {
          return res.render("login.ejs", {
            user: "Owner",
            msg: "Incorrect Username/Password",
          });
        } else if (result) {
          console.log(result);
          req.session.owner = owner;
          const info = {
            userName: owner.userName,
          };
          const token = getToken(info, "2h");
          const restaurant = await Restaurant.findOne({
            ownerId: owner._id,
          });

          if (!restaurant) {
            // store token in session
            req.session.token = token;
            return res.render("add_new_restaurant.ejs", {
              msg: "Please add your restaurant details",
              ownerId: owner._id,
            });
          } else {
            // store token in session
            req.session.token = token;
            res.render("owner_home.ejs", { owner, token, restaurant });
          }
        } else {
          res.status(401).json({ msg: "Incorrect Username or Password" });
          return;
        }
      });
    }
  } catch (err) {
    console.log("Error in logging in customer", err);
    res.sendStatus(500);
  }
});

// Logout a owner
router.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

module.exports = router;
