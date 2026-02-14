import express from "express";
import {
  createOrder,
  getOrders,
  updateOrderStatus,
} from "../controllers/orderController.js";


const router = express.Router();

/* CREATE ORDER */
router.post("/", createOrder);

/* GET ORDERS */
router.get("/", getOrders);

/* UPDATE ORDER STATUS */
router.put("/:orderID", updateOrderStatus);

export default router;
