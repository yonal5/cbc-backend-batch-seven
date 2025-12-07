import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  sender: { type: String, required: true },   // "customer" or "admin"
  name: { type: String },                     // customer name
  message: { type: String, required: true },
  time: { type: Date, default: Date.now },
});

export default mongoose.model("Chat", chatSchema);
