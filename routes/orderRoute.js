import express from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, createOrder);
router.get("/", authMiddleware, getOrders);
router.put("/:orderID", authMiddleware, updateOrderStatus);

export default router;
