import express from "express";
import mongoose from "mongoose";
import userRouter from "./routes/userRouter.js";
import productRouter from "./routes/productRouter.js";
import chatRouter from "./routes/chatRouter.js";
import adminRouter from "./routes/adminRouter.js";
import orderRoute from "./routes/orderRoute.js";

import jwt from "jsonwebtoken";
import cors from "cors";
import dotenv from "dotenv";
import User from "./models/user.js";

dotenv.config();

const app = express();

/* ======================
   MIDDLEWARE
====================== */

app.use(cors());
app.use(express.json());

/* ======================
   AUTH MIDDLEWARE
====================== */

app.use(async (req, res, next) => {
    try {

        const authHeader = req.header("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return next();
        }

        const token = authHeader.replace("Bearer ", "");

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next();
        }

        // IMPORTANT: Load FULL user from database
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return next();
        }

        req.user = user;

        next();

    } catch (err) {

        console.log("Auth error:", err.message);
        next();

    }
});


/* ======================
   DATABASE
====================== */

mongoose.connect(process.env.MONGO_URI)
.then(() => {
    console.log("Database connected successfully");
})
.catch((err) => {
    console.log("Database connection failed:", err.message);
});


/* ======================
   ROUTES
====================== */

app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/chat", chatRouter);
app.use("/api/orders", orderRoute);
app.use("/api/admin", adminRouter);

app.use("/uploads", express.static("uploads"));


/* ======================
   TEST ROUTE
====================== */

app.get("/", (req, res) => {
    res.send("API is running...");
});


/* ======================
   SERVER
====================== */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
