import express from "express";
import User from "../models/user.js";
import Chat from "../models/chatModel.js";

const router = express.Router();

/* ADMIN DASHBOARD STATS */
router.get("/stats", async (req, res) => {
  try {
    const users = await User.countDocuments();
    const chats = await Chat.countDocuments();

    res.json({
      users,
      chats,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
