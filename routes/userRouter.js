import express from 'express';
import { 
    blockOrUnblockUser, 
    changePasswordViaOTP, 
    createUser, 
    getAllUsers, 
    getUser, 
    googleLogin, 
    loginUser, 
    sendOTP, 
    updateUser // ✅ import this
} from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js'; // ✅ import authMiddleware

const userRouter = express.Router();

// Public routes
userRouter.post("/", createUser);
userRouter.post("/login", loginUser);
userRouter.post("/google-login", googleLogin);
userRouter.post("/change-password/", changePasswordViaOTP);
userRouter.get("/send-otp/:email", sendOTP);

// Protected routes (require authMiddleware)
userRouter.get("/me", authMiddleware, getUser);
userRouter.put("/me", authMiddleware, updateUser); // ✅ profile update
userRouter.get("/all-users", authMiddleware, getAllUsers);
userRouter.put("/block/:email", authMiddleware, blockOrUnblockUser);

export default userRouter;
