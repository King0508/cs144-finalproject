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

  // Web Push (FCM) registration is best-effort. The app delivers
  // server-initiated notifications over BOTH Web Push and a Server-Sent Events
  // channel; the SSE channel only needs the permission granted above to surface
  // foreground notifications. So a Web Push token failure must not block the
  // user or leave the UI stuck — we log it and still report success.
  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (vapidKey) {
      const messaging = getMessaging(getFirebase().app);
      const registration = await navigator.serviceWorker.ready;
      const token = await getToken(messaging, {
        vapidKey,
        serviceWorkerRegistration: registration,
      });
      if (token) {
        await api.registerFcmToken(token);
        // Foreground messages — rely on the OS-level notification when the app
        // is backgrounded.
        onMessage(messaging, (msg) => {
          console.info("[push] foreground message", msg);
        });
      }
    }
  } catch (err) {
    console.warn(
      "[push] Web Push token registration failed; foreground notifications will still arrive over SSE.",
      err,
    );
  }

  return { ok: true };
}
