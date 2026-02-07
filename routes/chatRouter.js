import express from "express";
import {
sendMessage,
getMessages,
listCustomers,
adminGetMessages,
adminSend,
} from "../controllers/chatController.js";

const router = express.Router();

// CUSTOMER
router.post("/chat", sendMessage);
router.get("/chat", getMessages);

// ADMIN
router.get("/customers", listCustomers);
router.get("/admin", adminGetMessages);
router.post("/admin/send", adminSend);

export default router;
