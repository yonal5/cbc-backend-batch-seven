import Order from "../models/order.js";
import Product from "../models/product.js";

/* =========================
   CREATE ORDER
========================= */
export const createOrder = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Login required" });
    }

    const { address, phone, items } = req.body;

    if (!address || !phone) {
      return res.status(400).json({ message: "Address and phone required" });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Cart empty" });
    }

    // Generate orderID
    const lastOrder = await Order.findOne().sort({ createdAt: -1 });
    let orderID = "CBC0000001";
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderID.replace("CBC", ""));
      orderID = "CBC" + (lastNumber + 1).toString().padStart(7, "0");
    }

    // Process items
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findOne({ productID: item.productID });
      if (!product) {
        return res.status(400).json({ message: `Product not found: ${item.productID}` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ message: `${product.name} out of stock` });
      }

      product.stock -= item.quantity;
      await product.save();

      orderItems.push({
        productID: product.productID,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.images?.[0] || "",
      });

      total += product.price * item.quantity;
    }

    // Create order
    const order = await Order.create({
      orderID,                    // ✅ match schema
      items: orderItems,
      customerName: req.user.firstName + " " + req.user.lastName,
      email: req.user.email,
      phone,
      address,
      total,
    });

    res.status(201).json({ message: "Order created", order });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET ALL ORDERS
========================= */
export const getOrders = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Login required" });

    let orders;
    if (req.user.role === "admin") {
      orders = await Order.find().sort({ createdAt: -1 });
    } else {
      orders = await Order.find({ email: req.user.email }).sort({ createdAt: -1 });
    }

    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   GET ORDER BY ID
========================= */
export const getOrderById = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Login required" });

    const order = await Order.findOne({ orderID: req.params.orderID });
    if (!order) return res.status(404).json({ message: "Order not found" });

    // Admin can see all orders, user can only see their own
    if (req.user.role !== "admin" && order.email !== req.user.email) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* =========================
   UPDATE ORDER STATUS
========================= */
export const updateOrderStatus = async (req, res) => {
  try {
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Admin only" });
    }

    const { status } = req.body;
    if (!status) return res.status(400).json({ message: "Status required" });

    const result = await Order.updateOne(
      { orderID: req.params.orderID },
      { status }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json({ message: "Status updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
