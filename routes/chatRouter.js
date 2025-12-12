import express from "express";
import {
  sendMessage,
  getMessages,
  adminSend,
  adminGetAllMessages,
  listCustomers,
} from "../controllers/chatController.js";

const router = express.Router();

router.post("/", sendMessage);          // Customer sends
router.get("/", getMessages);           // Customer loads
router.get("/admin", adminGetAllMessages); // Admin loads ALL messages
router.get("/customers", listCustomers);   // Admin list customers
router.post("/admin/send", adminSend);     // Admin send to customer

export default router;
