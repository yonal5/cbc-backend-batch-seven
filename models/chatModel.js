import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true }, // customer displayed name
    guestId: { type: String, required: true },       // unique per visitor
    sender: { type: String, enum: ["customer", "admin"], required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
