import webpush from "web-push";
import PushSubscription from "../models/pushSubscription.js";

const vapidConfigured = Boolean(process.env.VAPID_PUBLIC_KEY) && Boolean(process.env.VAPID_PRIVATE_KEY);

if (vapidConfigured) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@snapsitewebsell.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export const getPublicKey = async (req, res) => {
  if (!process.env.VAPID_PUBLIC_KEY) {
    return res.status(503).json({ success: false, message: "Push notifications are not configured on the server" });
  }
  res.json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY });
};

export const subscribe = async (req, res) => {
  try {
    if (!vapidConfigured) return res.status(503).json({ success: false, message: "Push notifications are not configured on the server" });
    const { endpoint, expirationTime, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) return res.status(400).json({ success: false, message: "Invalid push subscription" });
    const subscription = await PushSubscription.findOneAndUpdate(
      { endpoint },
      { userId: req.user._id, endpoint, expirationTime: expirationTime ?? null, keys: { p256dh: keys.p256dh, auth: keys.auth } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.status(201).json({ success: true, message: "Push notifications enabled", subscriptionId: subscription._id });
  } catch (err) {
    console.error("Push subscribe failed:", err);
    res.status(500).json({ success: false, message: "Failed to save push subscription" });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    const { endpoint } = req.body || {};
    if (!endpoint) return res.status(400).json({ success: false, message: "Endpoint missing" });
    await PushSubscription.deleteOne({ endpoint, userId: req.user._id });
    res.json({ success: true, message: "Push notifications disabled" });
  } catch (err) {
    console.error("Push unsubscribe failed:", err);
    res.status(500).json({ success: false, message: "Failed to remove push subscription" });
  }
};

export const sendTestNotification = async (req, res) => {
  try {
    if (!vapidConfigured) return res.status(503).json({ success: false, message: "Push notifications are not configured on the server" });
    const subscriptions = await PushSubscription.find({ userId: req.user._id });
    if (!subscriptions.length) return res.status(404).json({ success: false, message: "No phone/browser notification subscription found" });
    const payload = JSON.stringify({ title: "SnapSite notifications", body: "Test notification received!", url: "/admin/chat", tag: "snapsite-test" });
    const results = await Promise.allSettled(subscriptions.map((item) => webpush.sendNotification({ endpoint: item.endpoint, expirationTime: item.expirationTime, keys: item.keys }, payload)));
    for (let i = 0; i < results.length; i += 1) {
      const result = results[i];
      if (result.status === "rejected" && (result.reason?.statusCode === 404 || result.reason?.statusCode === 410)) await PushSubscription.deleteOne({ _id: subscriptions[i]._id });
    }
    const delivered = results.filter((result) => result.status === "fulfilled").length;
    res.json({ success: delivered > 0, delivered, total: subscriptions.length, message: delivered > 0 ? "Test notification sent" : "Test notification could not be delivered" });
  } catch (err) {
    console.error("Test notification failed:", err);
    res.status(500).json({ success: false, message: "Failed to send test notification" });
  }
};