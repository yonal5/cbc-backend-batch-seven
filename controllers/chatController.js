
import Chat from "../models/chatModel.js";


export const deleteMessage = async (req, res) => {
  try {
    await Chat.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Delete failed" });
  }
};

export const getCustomersForAdmin = async (req, res) => {
  try {
    const customers = await Chat.aggregate([
      {
        $group: {
          _id: "$guestId",
          customerName: { $first: "$customerName" },
        },
      },
      {
        $lookup: {
          from: "chats",
          let: { guestId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$guestId", "$$guestId"] },
                    { $eq: ["$sender", "customer"] },
                    { $eq: ["$isRead", false] },
                  ],
                },
              },
            },
            { $count: "count" },
          ],
          as: "unread",
        },
      },
      {
        $addFields: {
          unreadCount: {
            $ifNull: [{ $arrayElemAt: ["$unread.count", 0] }, 0],
          },
        },
      },
      {
        $project: {
          userId: "$_id",
          customerName: 1,
          unreadCount: 1,
        },
      },
    ]);

    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to load customers" });
  }
};
export const getAdminMessages = async (req, res) => {
  const { guestId } = req.query;

  try {

    await Chat.updateMany(
      { guestId, sender: "customer", isRead: false },
      { isRead: true }
    );

    const messages = await Chat.find({ guestId }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to load messages" });
  }
};

export const sendMessage = async (req, res) => {

try {

const {
  guestId,
  customerName,
  message,
  imageUrl,
  type
} = req.body;

const msg = await Chat.create({
  guestId,
  customerName,
  sender: "customer",
  message,
  imageUrl,
  type,
  isRead: false,
});

res.json(msg);

} catch (err) {

console.error(err);
res.status(500).json({ error: "Send failed" });

}

};

export const getMessages = async (req, res) => {

try {

const { guestId } = req.query;

const messages = await Chat.find({ guestId })
  .sort({ createdAt: 1 });

res.json(messages);

} catch {

res.status(500).json({ error: "Load failed" });

}

};



/* ================= ADMIN: LIST USERS ================= */
export const listCustomers = async (req, res) => {

try {

const customers = await Chat.aggregate([

  {
    $group: {
      _id: "$guestId",
      customerName: { $first: "$customerName" },

      unreadCount: {
        $sum: {
          $cond: [
            {
              $and: [
                { $eq: ["$sender", "customer"] },
                { $eq: ["$isRead", false] }
              ]
            },
            1,
            0
          ]
        }
      }

    }
  }

]);

res.json(

  customers.map(c => ({
    userId: c._id,
    customerName: c.customerName || c._id,
    unreadCount: c.unreadCount
  }))

);

} catch {

res.status(500).json([]);

}

};
export const adminGetMessages = async (req, res) => {

try {

const { guestId } = req.query;

await Chat.updateMany(
  {
    guestId,
    sender: "customer",
    isRead: false
  },
  {
    isRead: true
  }
);

const messages = await Chat.find({ guestId })
  .sort({ createdAt: 1 });

res.json(messages);

} catch {

res.status(500).json([]);

}

};

export const adminSend = async (req, res) => {

try {

const {
  guestId,
  message,
  imageUrl,
  type
} = req.body;

const msg = await Chat.create({
  guestId,
  sender: "admin",
  message,
  imageUrl,
  type,
  isRead: true
});

res.json(msg);

} catch {

res.status(500).json({ error: "Admin send failed" });

}

};
