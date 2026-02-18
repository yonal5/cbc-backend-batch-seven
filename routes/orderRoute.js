import express from "express";
import { createOrder, getOrders, updateOrderStatus, getOrderById } from "../controllers/orderController.js";

const router = express.Router();

// Create a new order
router.post("/", createOrder);

// Get all orders (admin) or user-specific orders
router.get("/", getOrders);

// Get order by ID
router.get("/:orderID", getOrderById);

// Update order status (admin only)
router.put("/status/:orderID", updateOrderStatus);

export default router;
