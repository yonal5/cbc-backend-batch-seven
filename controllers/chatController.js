import Chat from "../models/chatModel.js";

// ---------------------------------------------
// CUSTOMER SENDS MESSAGE
// ---------------------------------------------
export const sendMessage = async (req, res) => {
  try {
    const { customerName, guestId, message } = req.body;

    if (!customerName || !guestId || !message) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const chat = await Chat.create({
      customerName,
      guestId,
      sender: "customer",
      message,
    });

    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// ---------------------------------------------
// CUSTOMER GETS ONLY THEIR MESSAGES
// ---------------------------------------------
export const getMessages = async (req, res) => {
  try {
    const { guestId } = req.query;

    const messages = await Chat.find({ guestId }).sort({ createdAt: 1 });

    res.json(
      messages.map((m) => ({
        _id: m._id,
        userId: m.guestId,
        customerName: m.customerName,
        sender: m.sender,
        message: m.message,
        time: m.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------
// ADMIN GETS ALL MESSAGES
// ---------------------------------------------
export const adminGetAllMessages = async (req, res) => {
  try {
    const messages = await Chat.find().sort({ createdAt: 1 });

    res.json(
      messages.map((m) => ({
        _id: m._id,
        userId: m.guestId,
        customerName: m.customerName,
        sender: m.sender,
        message: m.message,
        time: m.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------
// ADMIN SEND MESSAGE TO SPECIFIC CUSTOMER
// ---------------------------------------------
export const adminSend = async (req, res) => {
  try {
    const { guestId, message } = req.body;

    if (!guestId || !message)
      return res.status(400).json({ message: "Missing required fields" });

    // find customer name
    const customerChat = await Chat.findOne({ guestId });
    const customerName = customerChat?.customerName || "Unknown User";

    const chat = await Chat.create({
      customerName,
      guestId,
      sender: "admin",
      message,
    });

    res.status(201).json({
      _id: chat._id,
      userId: chat.guestId,
      customerName: chat.customerName,
      sender: chat.sender,
      message: chat.message,
      time: chat.createdAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ---------------------------------------------
// ADMIN LIST OF UNIQUE CUSTOMERS
// ---------------------------------------------
export const listCustomers = async (req, res) => {
  try {
    const customers = await Chat.aggregate([
      {
        $group: {
          _id: "$guestId",
          customerName: { $first: "$customerName" },
          lastMessage: { $last: "$message" },
          lastTime: { $last: "$createdAt" },
        },
      },
      { $sort: { lastTime: -1 } },
    ]);

    res.json(
      customers.map((c) => ({
        userId: c._id,
        customerName: c.customerName || "Unknown User",
        lastMessage: c.lastMessage,
        lastTime: c.lastTime,
      }))
    );
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
