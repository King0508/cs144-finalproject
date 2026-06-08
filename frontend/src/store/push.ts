import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getFirebase } from "./firebase";
import { api } from "./api";

/**
 * Requests Notification permission, fetches the FCM Web Push registration
 * token, and tells the backend so it can deliver server-initiated pushes.
 *
 * Safe to call multiple times — getToken() is idempotent.
 */
export async function enablePush(): Promise<{ ok: boolean; reason?: string }> {
  if (!("Notification" in window) || !("serviceWorker" in navigator)) {
    return { ok: false, reason: "Notifications not supported in this browser." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, reason: `Notification permission ${permission}.` };
  }

  const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
  if (!vapidKey) {
    return { ok: false, reason: "Missing VITE_FIREBASE_VAPID_KEY." };
  }

  const messaging = getMessaging(getFirebase().app);
  const registration = await navigator.serviceWorker.ready;
  const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: registration });
  if (!token) return { ok: false, reason: "No FCM token returned." };

  await api.registerFcmToken(token);

  // Foreground messages — show a toast or just rely on the OS-level
  // notification when the app is backgrounded.
  onMessage(messaging, (msg) => {
    console.info("[push] foreground message", msg);
  });

  return { ok: true };
}
