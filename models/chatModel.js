import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    guestId: { type: String, required: true },
    customerName: { type: String, required: true },
    sender: { type: String, enum: ["customer", "admin"], required: true },
    type: { type: String, enum: ["text", "image"], default: "text" },
    message: { type: String },
    imageUrl: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
