import express from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";

import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/* CREATE ORDER */
router.post("/", authMiddleware, createOrder);

/* GET ORDERS */
router.get("/", authMiddleware, getOrders);

/* UPDATE ORDER STATUS */
router.put("/:orderID", authMiddleware, updateOrderStatus);

export default router;
