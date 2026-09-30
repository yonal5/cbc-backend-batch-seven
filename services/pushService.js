import webpush from "web-push";
import PushSubscription from "../models/pushSubscription.js";

const configured = Boolean(process.env.VAPID_PUBLIC_KEY) && Boolean(process.env.VAPID_PRIVATE_KEY);

if (configured) {
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:admin@snapsitewebsell.com", process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
}

export const notifyAdmins = async ({ customerName, message }) => {
  if (!configured) {
    console.warn("Push notifications skipped: VAPID keys are not configured.");
    return;
  }

  const subscriptions = await PushSubscription.find({}).lean();
  if (!subscriptions.length) return;

  const cleanMessage = String(message || "").trim();
  const body = cleanMessage ? cleanMessage.slice(0, 120) : "Customer sent an image";
  const payload = JSON.stringify({ title: "New SnapSite message", body: (customerName || "Customer") + ": " + body, url: "/admin/chat", tag: "snapsite-customer-message" });

  await Promise.all(subscriptions.map(async (item) => {
    try {
      await webpush.sendNotification({ endpoint: item.endpoint, expirationTime: item.expirationTime, keys: item.keys }, payload);
    } catch (err) {
      console.error("Push delivery failed:", err.message);
      if (err.statusCode === 404 || err.statusCode === 410) await PushSubscription.deleteOne({ _id: item._id });
    }
  }));
};