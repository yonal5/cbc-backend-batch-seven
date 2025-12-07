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

// ✅ JWT middleware
app.use((req, res, next) => {
  let token = req.header("Authorization");

  if (token != null) {
    token = token.replace("Bearer ", "");
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err || !decoded) {
        return res.status(401).json({
          message: "Invalid token, please login again",
        });
      } else {
        req.user = decoded;
        next();
      }
    });
  } else {
    next();
  }
});
// Add this to your routes file or index.js temporarily

// Test endpoint - add to your routes
app.get("/api/test", (req, res) => {
  console.log("🧪 Test endpoint hit");
  
  try {
    // Check if Order model exists
    const { Order } = require("./models/orderModel.js");
    
    res.status(200).json({
      message: "Backend is working!",
      checks: {
        serverRunning: true,
        orderModelExists: !!Order,
        mongooseConnected: require('mongoose').connection.readyState === 1,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      message: "Backend has issues",
      error: error.message,
      stack: error.stack
    });
  }
});

// Then test by visiting:
// https://cbc-backend-batch-seven-hope.onrender.com/api/test

// ✅ MongoDB connection


app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    mongoConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString()
  });
});

const connectionString = process.env.MONGO_URI;
mongoose
  .connect(connectionString)
  .then(() => console.log("Database connected successfully"))
  .catch(() => console.log("Database connection failed"));

// ✅ Routers
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/chat", chatRouter);


// ✅ Server
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
