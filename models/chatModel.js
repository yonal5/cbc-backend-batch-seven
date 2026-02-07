import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  guestId: String,
  customerName: String,
  sender: { type: String, enum: ["customer", "admin"] },
  message: String,
  imageUrl: String,
  type: { type: String, enum: ["text", "image"] },
  isRead: Boolean
}, { timestamps: true });


export default mongoose.model("Chat", chatSchema);
