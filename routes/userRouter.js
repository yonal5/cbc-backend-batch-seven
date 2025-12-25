import express from "express";
import {
  blockOrUnblockUser,
  updateMyPassword,
  createUser,
  getAllUsers,
  getUser,
  googleLogin,
  sendOTP,
  updateUser,
} from "../controllers/userController.js";

import { authenticate } from "../middleware/auth.js";
import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userRouter = express.Router();
// -------------------- PUBLIC ROUTES --------------------
userRouter.post("/", createUser);

userRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const payload = {
      id: user._id, // ⚠️ use "id" for consistency
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isAdmin: user.role === "admin",
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user: payload });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

userRouter.post("/google-login", googleLogin);
userRouter.get("/send-otp/:email", sendOTP);

// -------------------- PROTECTED ROUTES --------------------
userRouter.get("/me", authenticate, getUser);
userRouter.put("/me", authenticate, updateUser);

// ✅ PASSWORD UPDATE (THIS IS THE ONE YOU NEED)
userRouter.put("/me/password", authenticate, updateMyPassword);

userRouter.get("/__debug", (req, res) => {
  res.json({ router: "userRouter loaded" });
});


userRouter.get("/all-users", authenticate, getAllUsers);
userRouter.put("/block/:email", authenticate, blockOrUnblockUser);



export default userRouter;
