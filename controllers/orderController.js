import Order from "../models/order.js";
import Product from "../models/product.js";
import { isAdmin, isCustomer } from "./userController.js";

export async function createOrder(req, res) {
  try {
    let user = req.user || {}; // handle guest users
    let customerName = req.body.customerName || `${user.firstName || "Guest"} ${user.lastName || ""}`.trim();
    let phone = req.body.phone || "Not provided";
    let email = user.email || req.body.email || "guest@example.com";

    // === Generate new Order ID ===
    const lastOrder = await Order.findOne().sort({ date: -1 });
    let newOrderID = "CBC0000001";
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderID.replace("CBC", ""));
      newOrderID = "CBC" + String(lastNumber + 1).padStart(7, "0");
    }

    const items = req.body.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    const itemsToBeAdded = [];
    let total = 0;

    for (const item of items) {
      const product = await Product.findOne({ productID: item.productID });
      if (!product) {
        return res.status(400).json({ message: `Product ${item.productID} not found` });
      }
      if (product.stock < item.quantity) {
        return res.status(400).json({
          message: `Insufficient stock for product ${item.productID}`,
        });
      }

      itemsToBeAdded.push({
        productID: product.productID,
        quantity: item.quantity,
        name: product.name,
        price: product.price,
        image: product.images[0],
      });

      total += product.price * item.quantity;
    }

    const newOrder = new Order({
      orderID: newOrderID,
      items: itemsToBeAdded,
      customerName,
      email,
      phone,
      address: req.body.address || "No address provided",
      total,
      status: "Pending",
      date: new Date(),
    });

    const savedOrder = await newOrder.save();

    res.status(201).json({
      message: "✅ Order created successfully",
      order: savedOrder,
    });
  } catch (err) {
    console.error("❌ Error creating order:", err);
    res.status(500).json({ message: "Internal server error", error: err.message });
  }
}

export async function getOrders(req, res) {
  try {
    if (isAdmin(req)) {
      const orders = await Order.find().sort({ date: -1 });
      return res.json(orders);
    }
    if (isCustomer(req)) {
      const user = req.user;
      const orders = await Order.find({ email: user.email }).sort({ date: -1 });
      return res.json(orders);
    }
    res.status(403).json({ message: "You are not authorized to view orders" });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders" });
  }
}

export async function updateOrderStatus(req, res) {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ message: "You are not authorized to update order status" });
    }

    const orderID = req.params.orderID;
    const newStatus = req.body.status;

    await Order.updateOne({ orderID }, { status: newStatus });
    res.json({ message: "Order status updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update order status" });
  }
}
