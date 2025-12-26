import express from 'express';
import { blockOrUnblockUser, changePasswordViaOTP, createUser, getAllUsers, getUser, googleLogin, loginUser, sendOTP, updatePassword, updateUserData } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/auth.js';

const userRouter = express.Router();

userRouter.post("/",createUser)
userRouter.post("/login",loginUser)
userRouter.post("/google-login",googleLogin)
userRouter.get("/all-users", getAllUsers)
userRouter.put("/block/:email",blockOrUnblockUser)
userRouter.get("/send-otp/:email",sendOTP)
userRouter.post("/change-password/",changePasswordViaOTP)
userRouter.get("/me", authMiddleware, getUser);
userRouter.put("/me", authMiddleware, updateUserData);
userRouter.put("/me/password", authMiddleware, updatePassword);

export default userRouter;