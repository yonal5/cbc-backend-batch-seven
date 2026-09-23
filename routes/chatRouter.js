import express from "express";
import {
  sendMessage,
  getMessages,
  listCustomers,
  adminGetMessages,
  adminSend,
} from "../controllers/chatController.js";
import { adminMiddleware } from "../middleware/auth.js";

const router = express.Router();

router.post("/", sendMessage);          // Customer send
router.get("/", getMessages);           // Customer get messages
router.use("/admin", adminMiddleware);
router.get("/customers", adminMiddleware, listCustomers);// Admin get customers
router.get("/admin", adminGetMessages); // Admin get messages
router.post("/admin/send", adminSend);  // Admin send

export default router;
