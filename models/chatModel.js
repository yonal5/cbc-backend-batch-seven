import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
{
  guestId: String,
  customerName: String,

  sender: {
    type: String,
    enum: ["customer", "admin"],
    required: true,
  },

  type: {
    type: String,
    enum: ["text", "image"],
    default: "text",
  },

  message: String,

  imageUrl: String,

  isRead: {
    type: Boolean,
    default: false,
  }

},
{ timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
