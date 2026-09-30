import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import dns from "node:dns";

import userRouter from "./routes/userRouter.js";
import productRouter from "./routes/productRouter.js";
import chatRouter from "./routes/chatRouter.js";
import adminRouter from "./routes/adminRouter.js";
import orderRoute from "./routes/orderRoute.js";
import notificationRouter from "./routes/notificationRouter.js";

import User from "./models/user.js";

dotenv.config();

dns.setServers([
    "1.1.1.1",
    "8.8.8.8",
]);

const app = express();


// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
    cors({
        origin: true,
        credentials: true,
    })
);

app.use(express.json());


// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

app.use(async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");

        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {
            return next();
        }

        const token = authHeader.replace(
            "Bearer ",
            ""
        );

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        if (!decoded?.id) {
            return next();
        }

        const user = await User.findById(
            decoded.id
        ).select("-password");

        if (!user) {
            return next();
        }

        req.user = user;

        next();

    } catch (err) {
        console.log(
            "Auth error:",
            err.message
        );

        next();
    }
});


// =====================================================
// TEST ROUTE
// =====================================================

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "CBC Backend API is running",
    });
});


// =====================================================
// API ROUTES
// =====================================================

app.use(
    "/api/users",
    userRouter
);

app.use(
    "/api/products",
    productRouter
);

app.use(
    "/api/chat",
    chatRouter
);

app.use(
    "/api/orders",
    orderRoute
);

app.use(
    "/api/admin",
    adminRouter
);

app.use(
    "/api/notifications",
    notificationRouter
);


// =====================================================
// UPLOADS
// =====================================================

app.use(
    "/uploads",
    express.static("uploads")
);


// =====================================================
// 404
// =====================================================

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message:
            `Route not found: ${req.method} ${req.originalUrl}`,
    });
});


// =====================================================
// MONGODB + SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

async function startServer() {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error(
                "MONGO_URI is missing"
            );
        }

        if (!process.env.JWT_SECRET) {
            throw new Error(
                "JWT_SECRET is missing"
            );
        }

        await mongoose.connect(
            process.env.MONGO_URI
        );

        console.log(
            "✅ MongoDB connected successfully"
        );

        app.listen(PORT, () => {
            console.log(
                `🚀 Server running on port ${PORT}`
            );
        });

    } catch (err) {
        console.error(
            "❌ Server startup failed:",
            err.message
        );

        process.exit(1);
    }
}

startServer();