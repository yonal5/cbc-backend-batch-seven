import express from "express";
import Order from "../models/order.js";

const router = express.Router();

router.post("/create", async (req, res) => {
  const { customerName, cart } = req.body;

  const orderId = "ORD-" + Date.now();

  const order = await Order.create({
    orderId,
    customerName,
    cart,
  });

  res.json(order);
});

export default router;
