import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    customerName: {
      type: String,
      default: "Guest",
    },

    guestId: {
      type: String,
      required: true,
    },

    sender: {
      type: String,
      enum: ["customer", "admin"],
      required: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Chat", chatSchema);
