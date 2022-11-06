const express = require("express");
const Customer = require("../models/Customer");
const MenuItem = require("../models/MenuItem");
const Order = require("../models/Order");
const Owner = require("../models/Owner");
const Restaurant = require("../models/Restaurant");
const validate = require("../utils/validate");

const router = express.Router();

router.get("/current-orders", validate, async (req, res) => {
  const userName = req.decodedToken.userName;
  const customer = await Customer.findOne({ userName: userName });
  const orders = await Order.find({
    customerId: customer._id,
    status: "Pending",
  });

  const orderMapped = await Promise.all(
    orders.map(async (order) => {
      const orderItemsMapped = order.orderItems.map(async (orderItem) => {
        const menuItem = await MenuItem.findById(orderItem.item);
        return {
          menuItemName: menuItem.name,
          quantity: orderItem.quantity,
        };
      });

      const orderItems = await Promise.all(orderItemsMapped);
      const restaurant = await Restaurant.findById(order.restaurantId);

      return {
        orderId: order._id,
        orderItems,
        canteenName: restaurant.restaurantName,
        restaurantAddress: restaurant.restaurantAddress,
        orderStatus: order.orderStatus,
        totalPrice: order.orderTotal,
        status: order.orderStatus,
        date: order.createdDate.toLocaleDateString(),
        time: order.createdDate.toLocaleTimeString(),
      };
    })
  );

  if (req.session.token) {
    req.session.token = req.session.token;
    res.render("customer_current_order.ejs", {
      msg: "",
      customer,
      orders: orderMapped,
    });
  } else {
    res.render("login.ejs", { user: "Customer", msg: "Login expired!" });
  }
});

router.get("/order-history", validate, async (req, res) => {
  const userName = req.decodedToken.userName;
  console.log(userName);
  const customer = await Customer.findOne({ userName });
  const orders = await Order.find({
    customerId: customer._id,
  });
  console.log("orders", orders);
  const orderMapped = await Promise.all(
    orders.map(async (order) => {
      const orderItemsMapped = order.orderItems.map(async (orderItem) => {
        const menuItem = await MenuItem.findById(orderItem.item);
        return {
          menuItemName: menuItem.name,
          quantity: orderItem.quantity,
        };
      });

      const orderItems = await Promise.all(orderItemsMapped);
      const restaurant = await Restaurant.findById(order.restaurantId);

      return {
        orderId: order._id,
        orderItems,
        canteenName: restaurant.restaurantName,
        restaurantAddress: restaurant.restaurantAddress,
        orderStatus: order.orderStatus,
        totalPrice: order.orderTotal,
        status: order.orderStatus,
        date: order.createdDate.toLocaleDateString(),
        time: order.createdDate.toLocaleTimeString(),
      };
    })
  );

  if (req.session.token) {
    req.session.token = req.session.token;
    res.render("customer_completed_orders.ejs", {
      msg: "",
      customer,
      orders: orderMapped,
    });
  } else {
    res.render("login.ejs", { user: "Customer", msg: "Login expired!" });
  }
});

// Get all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find();
    res.json(orders);
  } catch (err) {
    console.log("Error in getting orders", err);
    res.sendStatus(500);
  }
});

// Get all orders for a customer
router.get("/customer", validate, async (req, res) => {
  const { email, userName } = req.query;
  const tokenUserName = req.decodedToken.userName;
  try {
    if (email) {
      const customer = await Customer.findOne({ email });
      if (!customer) {
        res.status(400).json({ msg: "Customer does not exist" });
        return;
      }

      if (customer.userName !== tokenUserName) {
        res.status(400).json({ msg: "Unauthorized" });
        return;
      }

      const orders = await Order.find({ customerId: customer._id });
      res.json(orders);
    } else if (userName) {
      const customer = await Customer.findOne({ userName });
      if (!customer) {
        res.status(400).json({ msg: "Customer does not exist" });
        return;
      }

      if (customer.userName !== tokenUserName) {
        res.status(400).json({ msg: "Unauthorized" });
        return;
      }
      const orders = await Order.find({ customerId: customer._id });
      res.json(orders);
    } else {
      res.status(400).json({ msg: "Please enter a valid email or username" });
    }
  } catch (err) {
    console.log("Error in getting orders for customer", err);
    res.sendStatus(500);
  }
});

// Get all orders for a restaurant
router.get("/restaurant", validate, async (req, res) => {
  const { email, userName } = req.query;
  const tokenUserName = req.decodedToken.userName;
  try {
    if (email) {
      const restaurant = await Restaurant.findOne({ email });
      if (!restaurant) {
        res.status(400).json({ msg: "Restaurant does not exist" });

        return;
      }
      if (restaurant.userName !== tokenUserName) {
        res.status(400).json({ msg: "Unauthorized" });
        return;
      }
      const orders = await Order.find({ restaurantId: restaurant._id });
      res.json(orders);
    } else if (userName) {
      const restaurant = await Restaurant.findOne({ userName });
      if (!restaurant) {
        res.status(400).json({ msg: "Restaurant does not exist" });
        return;
      }
      if (restaurant.userName !== tokenUserName) {
        res.status(400).json({ msg: "Unauthorized" });
        return;
      }
      const orders = await Order.find({ restaurantId: restaurant._id });
      res.json(orders);
    } else {
      res.status(400).json({ msg: "Please enter a valid email or username" });
    }
  } catch (err) {
    console.log("Error in getting orders for restaurant", err);
    res.sendStatus(500);
  }
});

// Create a new order
router.post("/", validate, async (req, res) => {
  const { orderItems, restaurantId, customerId, orderTotal } = req.body;
  req.session.token = req.session.token;
  if (!orderItems || !restaurantId || !customerId || !orderTotal) {
    res.status(400).json({ msg: "Please enter all fields" });
    return;
  }
  try {
    // verify that the restaurant exists
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(400).json({ msg: "Restaurant does not exist" });
      return;
    }
    // verify that the user exists
    const user = await Customer.findById(customerId);
    if (!user) {
      res.status(400).json({ msg: "Customer does not exist" });
      return;
    }

    const order = new Order(req.body);

    await order.save();
    res.json(order);
  } catch (err) {
    console.log("Error in creating order", err);
    res.sendStatus(500);
  }
});

// Get a specific order
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const order = await Order.findById(id);
    res.json(order);
  } catch (err) {
    console.log("Error in getting order", err);
    res.sendStatus(500);
  }
});

// Accept a specific order (only the order status)
router.post("/accept/:id", validate, async (req, res) => {
  const { id } = req.params;
  const userName = req.decodedToken.userName;
  req.session.token = req.session.token;
  const owner = await Owner.findOne({ userName });
  const restaurant = await Restaurant.findOne({ userName });
  console.log(restaurant);
  let orders = await Order.find({ restaurantId: restaurant._id });
  let orderMapped = await Promise.all(
    orders.map(async (order) => {
      const orderItemsMapped = order.orderItems.map(async (orderItem) => {
        const menuItem = await MenuItem.findById(orderItem.item);
        return {
          menuItemName: menuItem.name,
          quantity: orderItem.quantity,
        };
      });

      const orderItems = await Promise.all(orderItemsMapped);
      const restaurant = await Restaurant.findById(order.restaurantId);

      return {
        orderId: order._id,
        orderItems,
        canteenName: restaurant.restaurantName,
        restaurantAddress: restaurant.restaurantAddress,
        orderStatus: order.orderStatus,
        totalPrice: order.orderTotal,
        status: order.orderStatus,
        date: order.createdDate.toLocaleDateString(),
        time: order.createdDate.toLocaleTimeString(),
      };
    })
  );
  try {
    const order = await Order.findById(id);
    if (!order) {
      res.render("owner_home.ejs", {
        msg: "Order does not exist",
        owner,
        restaurant,
        orders: orderMapped,
      });
    }

    if (order.orderStatus === "Completed") {
      res.render("owner_home.ejs", {
        msg: "Order is already completed",
        owner,
        restaurant,
        orders: orderMapped,
      });
    }
    if (order.orderStatus === "Cancelled") {
      res.render("owner_home.ejs", {
        msg: "Order is already cancelled",
        owner,
        restaurant,
        orders: orderMapped,
      });
    }
    if (order.orderStatus === "Accepted") {
      res.render("owner_home.ejs", {
        msg: "Order status cannot be changed once accepted",
        owner,
        restaurant,
        orders: orderMapped,
      });
    }
    const orderUpdated = await Order.findByIdAndUpdate(id, {
      orderStatus: "Accepted",
    });
    orders = await Order.find({ restaurantId: restaurant._id });
    orderMapped = await Promise.all(
      orders.map(async (order) => {
        const orderItemsMapped = order.orderItems.map(async (orderItem) => {
          const menuItem = await MenuItem.findById(orderItem.item);
          return {
            menuItemName: menuItem.name,
            quantity: orderItem.quantity,
          };
        });

        const orderItems = await Promise.all(orderItemsMapped);
        const restaurant = await Restaurant.findById(order.restaurantId);

        return {
          orderId: order._id,
          orderItems,
          canteenName: restaurant.restaurantName,
          restaurantAddress: restaurant.restaurantAddress,
          orderStatus: order.orderStatus,
          totalPrice: order.orderTotal,
          status: order.orderStatus,
          date: order.createdDate.toLocaleDateString(),
          time: order.createdDate.toLocaleTimeString(),
        };
      })
    );
    res.render("owner_home.ejs", {
      msg: "Order accepted successfully",
      owner,
      restaurant,
      orders: orderMapped,
    });
  } catch (err) {
    console.log("Error in updating order", err);
    res.render("owner_home.ejs", {
      msg: "Error in updating order",
      owner,
      restaurant,
      orders: orderMapped,
    });
  }
});

// Cancel a specific order
router.post("/cancel/:id", validate, async (req, res) => {
  const { id } = req.params;
  const userName = req.decodedToken.userName;
  req.session.token = req.session.token;
  const owner = await Owner.findOne({ userName });
  const restaurant = await Restaurant.findOne({ userName });
  console.log(restaurant);
  let orders = await Order.find({ restaurantId: restaurant._id });
  let orderMapped = await Promise.all(
    orders.map(async (order) => {
      const orderItemsMapped = order.orderItems.map(async (orderItem) => {
        const menuItem = await MenuItem.findById(orderItem.item);
        return {
          menuItemName: menuItem.name,
          quantity: orderItem.quantity,
        };
      });

      const orderItems = await Promise.all(orderItemsMapped);
      const restaurant = await Restaurant.findById(order.restaurantId);

      return {
        orderId: order._id,
        orderItems,
        canteenName: restaurant.restaurantName,
        restaurantAddress: restaurant.restaurantAddress,
        orderStatus: order.orderStatus,
        totalPrice: order.orderTotal,
        status: order.orderStatus,
        date: order.createdDate.toLocaleDateString(),
        time: order.createdDate.toLocaleTimeString(),
      };
    })
  );
  try {
    const order = await Order.findById(id);
    if (!order) {
      res.render("owner_home.ejs", {
        msg: "Order does not exist",
        owner,
        restaurant,
        orders: orderMapped,
      });
    }

    if (order.orderStatus === "Completed") {
      res.render("owner_home.ejs", {
        msg: "Order is already completed",
        owner,
        restaurant,
        orders: orderMapped,
      });
    }
    if (order.orderStatus === "Cancelled") {
      res.render("owner_home.ejs", {
        msg: "Order is already cancelled",
        owner,
        restaurant,
        orders: orderMapped,
      });
    }
    if (order.orderStatus === "Accepted") {
      res.render("owner_home.ejs", {
        msg: "Order status cannot be changed once accepted",
        owner,
        restaurant,
        orders: orderMapped,
      });
    }
    const orderUpdated = await Order.findByIdAndUpdate(id, {
      orderStatus: "Cancelled",
    });
    orders = await Order.find({ restaurantId: restaurant._id });
    orderMapped = await Promise.all(
      orders.map(async (order) => {
        const orderItemsMapped = order.orderItems.map(async (orderItem) => {
          const menuItem = await MenuItem.findById(orderItem.item);
          return {
            menuItemName: menuItem.name,
            quantity: orderItem.quantity,
          };
        });

        const orderItems = await Promise.all(orderItemsMapped);
        const restaurant = await Restaurant.findById(order.restaurantId);

        return {
          orderId: order._id,
          orderItems,
          canteenName: restaurant.restaurantName,
          restaurantAddress: restaurant.restaurantAddress,
          orderStatus: order.orderStatus,
          totalPrice: order.orderTotal,
          status: order.orderStatus,
          date: order.createdDate.toLocaleDateString(),
          time: order.createdDate.toLocaleTimeString(),
        };
      })
    );
    res.render("owner_home.ejs", {
      msg: "Order cancelled successfully",
      owner,
      restaurant,
      orders: orderMapped,
    });
  } catch (err) {
    console.log("Error in updating order", err);
    res.render("owner_home.ejs", {
      msg: "Error in updating order",
      owner,
      restaurant,
      orders: orderMapped,
    });
  }
});

router.post("/completed/:id", validate, async (req, res) => {
  const { id } = req.params;
  const userName = req.decodedToken.userName;
  req.session.token = req.session.token;
  const owner = await Owner.findOne({ userName });
  const restaurant = await Restaurant.findOne({ userName });
  console.log(restaurant);
  let orders = await Order.find({ restaurantId: restaurant._id });
  let orderMapped = await Promise.all(
    orders.map(async (order) => {
      const orderItemsMapped = order.orderItems.map(async (orderItem) => {
        const menuItem = await MenuItem.findById(orderItem.item);
        return {
          menuItemName: menuItem.name,
          quantity: orderItem.quantity,
        };
      });

      const orderItems = await Promise.all(orderItemsMapped);
      const restaurant = await Restaurant.findById(order.restaurantId);

      return {
        orderId: order._id,
        orderItems,
        canteenName: restaurant.restaurantName,
        restaurantAddress: restaurant.restaurantAddress,
        orderStatus: order.orderStatus,
        totalPrice: order.orderTotal,
        status: order.orderStatus,
        date: order.createdDate.toLocaleDateString(),
        time: order.createdDate.toLocaleTimeString(),
      };
    })
  );
  try {
    const order = await Order.findById(id);
    if (!order) {
      res.render("owner_current_orders.ejs", {
        msg: "Order does not exist",
        owner,
        restaurant,
        orders: orderMapped,
      });
    }

    if (order.orderStatus === "Completed") {
      res.render("owner_current_orders.ejs", {
        msg: "Order is already completed",
        owner,
        restaurant,
        orders: orderMapped,
      });
    }
    if (order.orderStatus === "Cancelled") {
      res.render("owner_current_orders.ejs", {
        msg: "Order is already cancelled",
        owner,
        restaurant,
        orders: orderMapped,
      });
    }
    const orderUpdated = await Order.findByIdAndUpdate(id, {
      orderStatus: "Completed",
    });
    orders = await Order.find({ restaurantId: restaurant._id });
    orderMapped = await Promise.all(
      orders.map(async (order) => {
        const orderItemsMapped = order.orderItems.map(async (orderItem) => {
          const menuItem = await MenuItem.findById(orderItem.item);
          return {
            menuItemName: menuItem.name,
            quantity: orderItem.quantity,
          };
        });

        const orderItems = await Promise.all(orderItemsMapped);
        const restaurant = await Restaurant.findById(order.restaurantId);

        return {
          orderId: order._id,
          orderItems,
          canteenName: restaurant.restaurantName,
          restaurantAddress: restaurant.restaurantAddress,
          orderStatus: order.orderStatus,
          totalPrice: order.orderTotal,
          status: order.orderStatus,
          date: order.createdDate.toLocaleDateString(),
          time: order.createdDate.toLocaleTimeString(),
        };
      })
    );
    res.render("owner_current_orders.ejs", {
      msg: "Order marked as completed",
      owner,
      restaurant,
      orders: orderMapped,
    });
  } catch (err) {
    console.log("Error in updating order", err);
    res.render("owner_current_orders.ejs", {
      msg: "Error in updating order",
      owner,
      restaurant,
      orders: orderMapped,
    });
  }
});

// complete a specific order
router.put("/:id", validate, async (req, res) => {
  const { id } = req.params;
  const { orderStatus } = req.body;
  const userName = req.decodedToken.userName;

  if (!orderStatus || userName) {
    res.status(400).json({ msg: "Please enter all fields" });
    return;
  }

  try {
    const order = await Order.findById(id);
    if (!order) {
      res.status(400).json({ msg: "Order does not exist" });
      return;
    }
    const restaurant = await Restaurant.findById(order.userId);
    if (!restaurant) {
      res.status(400).json({ msg: "Restaurant does not exist" });
      return;
    }
    if (restaurant.userName !== userName) {
      res.status(400).json({ msg: "Restaurant does not match" });
      return;
    }
    if (order.orderStatus === "Completed") {
      res.status(400).json({ msg: "Order is already completed" });
      return;
    }
    if (order.orderStatus === "Cancelled") {
      res.status(400).json({ msg: "Order is already cancelled" });
      return;
    }
    order.orderStatus = orderStatus;
    await order.save();
    res.json(order);
  } catch (err) {
    console.log("Error in updating order", err);
    res.sendStatus(500);
  }
});

module.exports = router;
