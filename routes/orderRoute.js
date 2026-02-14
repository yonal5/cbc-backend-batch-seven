import express from "express";

import {
    createOrder,
    getOrders,
    updateOrderStatus
}
from "../controllers/orderController.js";

const router = express.Router();

router.post("/", createOrder);

router.get("/", getOrders);

router.put("/status/:orderID", updateOrderStatus);

router.get("/admin", authMiddleware, async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    const orders = await Order.find().sort({ createdAt: -1 });

    res.json(orders);

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
