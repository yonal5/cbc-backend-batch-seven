import Order from "../models/order.js";
import Product from "../models/product.js";

/* =========================
   CREATE ORDER
========================= */

export const createOrder = async (req, res) => {
  try {

    console.log("User:", req.user);
    console.log("Body:", req.body);

    if (!req.user) {
      return res.status(401).json({
        message: "Login required",
      });
    }

    const { address, phone, items } = req.body;

    if (!address || !phone) {
      return res.status(400).json({
        message: "Address and phone required",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "Cart empty",
      });
    }

    /* GENERATE ORDER ID */

    const lastOrder = await Order.findOne().sort({ createdAt: -1 });

    let orderID = "CBC0000001";

    if (lastOrder) {
      const lastNumber = parseInt(
        lastOrder.orderID.replace("CBC", "")
      );

      orderID =
        "CBC" +
        (lastNumber + 1)
          .toString()
          .padStart(7, "0");
    }

    /* PROCESS ITEMS */

    let total = 0;
    const orderItems = [];

    for (const item of items) {

      const product = await Product.findOne({
        productID: item.productID,
      });

      if (!product) {
        return res.status(400).json({
          message:
            "Product not found: " +
            item.productID,
        });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({
          message:
            product.name +
            " out of stock",
        });
      }

      product.stock -= item.quantity;

      await product.save();

      orderItems.push({
        productID: product.productID,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image:
          product.images?.[0] || "",
      });

      total +=
        product.price * item.quantity;
    }

    /* CREATE ORDER */

    const order = await Order.create({
      orderID,
      items: orderItems,
      customerName:
        req.user.firstName +
        " " +
        req.user.lastName,
      email: req.user.email,
      phone,
      address,
      total,
    });

    res.status(201).json({
      message: "Order created",
      order,
    });

  } catch (err) {

    console.log(
      "Create order error:",
      err
    );

    res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   GET ORDERS
========================= */

export const getOrders = async (req, res) => {
  try {

    if (!req.user) {
      return res.status(401).json({
        message: "Login required",
      });
    }

    if (req.user.role === "admin") {

      const orders =
        await Order.find().sort({
          createdAt: -1,
        });

      return res.json(orders);
    }

    const orders =
      await Order.find({
        email: req.user.email,
      }).sort({ createdAt: -1 });

    res.json(orders);

  } catch (err) {

    res.status(500).json({
      message: err.message,
    });
  }
};

/* =========================
   UPDATE STATUS
========================= */

export const updateOrderStatus =
  async (req, res) => {

    try {

      if (
        req.user?.role !== "admin"
      ) {
        return res
          .status(403)
          .json({
            message:
              "Admin only",
          });
      }

      await Order.updateOne(
        {
          orderID:
            req.params.orderID,
        },
        {
          status:
            req.body.status,
        }
      );

      res.json({
        message:
          "Status updated",
      });

    } catch (err) {

      res.status(500).json({
        message:
          err.message,
      });
    }
  };
