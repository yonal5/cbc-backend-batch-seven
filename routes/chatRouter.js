import express from "express";
import {
  sendMessage,
  getMessages,
  listCustomers,
  adminGetMessages,
  adminSend,
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/", sendMessage);          // Customer send
router.get("/", getMessages);           // Customer get messages
router.get("/customers", listCustomers);// Admin get customers
router.get("/admin", adminGetMessages); // Admin get messages
router.post("/admin/send", adminSend);  // Admin send

export default router;
