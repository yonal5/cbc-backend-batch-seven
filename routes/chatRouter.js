import express from "express";
import Chat from "../models/chatModel.js";

const router = express.Router();

// Get all chat messages
router.get("/", async (req, res) => {
  try {
    const messages = await Chat.find().sort({ time: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Send a message (customer or admin)
router.post("/", async (req, res) => {
  try {
    const { sender, name, message } = req.body;

    const newMsg = new Chat({ sender, name, message });
    await newMsg.save();

    res.status(201).json(newMsg);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
