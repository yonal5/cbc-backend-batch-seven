// server.js (replace your current file with this)
import express from "express";
import mongoose from "mongoose";
import userRouter from "./routes/userRouter.js";
import productRouter from "./routes/productRouter.js";
import chatRouter from "./routes/chatRouter.js";
import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

/**
 * Non-blocking JWT middleware
 * - If Authorization header exists, try to verify and set req.user
 * - If missing or invalid, do NOT return 401 here (leave req.user null)
 * Route-level auth (admin-only) should be enforced inside routers.
 */
app.use((req, res, next) => {
  try {
    let token = req.header("Authorization");
    if (!token) {
      req.user = null;
      return next();
    }

    token = token.replace("Bearer ", "");
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        // token invalid -> treat as no user, but do not block the request here
        req.user = null;
      } else {
        req.user = decoded;
      }
      next();
    });
  } catch (err) {
    // in unlikely case of error, don't block the request
    req.user = null;
    next();
  }
});

// Test endpoint - safer for ESM
app.get("/api/test", (req, res) => {
  console.log("🧪 Test endpoint hit");

  try {
    // Check if Order model exists in mongoose.models
    const OrderModelExists = !!mongoose.models && !!mongoose.models.Order;

    res.status(200).json({
      message: "Backend is working!",
      checks: {
        serverRunning: true,
        orderModelExists: OrderModelExists,
        mongooseConnected: mongoose.connection.readyState === 1,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Backend has issues",
      error: error.message,
      stack: error.stack,
    });
  }
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    mongoConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

const connectionString = process.env.MONGO_URI;
mongoose
  .connect(connectionString)
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.log("Database connection failed", err));

// Routers
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/chat", chatRouter);

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
