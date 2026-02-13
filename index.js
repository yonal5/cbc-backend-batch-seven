import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import jwt from "jsonwebtoken";

// Routes
import userRouter from "./routes/userRouter.js";
import productRouter from "./routes/productRouter.js";
import orderRouter from "./routes/orderRoute.js";
import chatRouter from "./routes/chatRouter.js";
import adminRouter from "./routes/adminRouter.js";

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// JWT AUTH MIDDLEWARE
app.use(
    (req,res,next)=>{

        let token = req.header("Authorization")

        if(token != null){
            token = token.replace("Bearer ","")
            jwt.verify(token, process.env.JWT_SECRET,
                (err, decoded)=>{
                    if(decoded == null){
                        res.json({
                            message: "Invalid token please login again"
                        })
                        return
                    }else{
                        req.user = decoded
                    }
                }
            )

        }
        next()
    }
)

// Database connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => {
  console.log("❌ MongoDB Connection Failed");
  console.error(err);
});

// Routes
app.use("/api/users", userRouter);
app.use("/api/products", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api/chat", chatRouter);
app.use("/api/admin", adminRouter);

// Serve static uploads
app.use("/uploads", express.static("uploads"));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
