import express from "express";
import { getPublicKey, subscribe, unsubscribe, sendTestNotification } from "../controllers/notificationController.js";
import { adminMiddleware } from "../middleware/auth.js";

const router = express.Router();
router.get("/public-key", getPublicKey);
router.use(adminMiddleware);
router.post("/subscribe", subscribe);
router.delete("/subscribe", unsubscribe);
router.post("/test", sendTestNotification);

export default router;