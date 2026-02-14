import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderID: {
      type: String,
      required: true,
      unique: true,
    },

    items: [
      {
        productID: String,
        quantity: Number,
        name: String,
        price: Number,
        image: String,
      },
    ],

    customerName: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    address: {
      type: String,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      default: "Pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
