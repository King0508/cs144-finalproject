import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { useAuth } from "./hooks/auth/useAuth";
import { useUserDoc } from "./hooks/auth/useUserDoc";
import { useOnboardingGate } from "./hooks/auth/useOnboardingGate";
import { AppShell } from "./components/layout/AppShell";
import { ConsentBanner } from "./components/layout/ConsentBanner";
import { OfflineBanner } from "./components/layout/OfflineBanner";
import { ServerEventToast } from "./components/layout/ServerEventToast";
import { LoadingScreen } from "./components/layout/LoadingScreen";
import { UserDocErrorScreen } from "./components/layout/UserDocErrorScreen";
import { installAutoFlush } from "./store/offlineQueue";
import { processQueuedWrite } from "./store/queueProcessor";
import { subscribeServerEvents } from "./store/sse";

// Route-level code splitting: each page ships in its own lazily-loaded chunk so
// the initial SPA bundle stays small. These components are named exports, so we
// remap them to the default export shape React.lazy expects.
const Login = lazy(() => import("./pages/Login").then((m) => ({ default: m.Login })));
const Onboarding = lazy(() => import("./pages/Onboarding").then((m) => ({ default: m.Onboarding })));
const BibleTalkChat = lazy(() => import("./pages/BibleTalkChat").then((m) => ({ default: m.BibleTalkChat })));
const Studies = lazy(() => import("./pages/Studies").then((m) => ({ default: m.Studies })));
const InviteeProfile = lazy(() => import("./pages/InviteeProfile").then((m) => ({ default: m.InviteeProfile })));
const Calendar = lazy(() => import("./pages/Calendar").then((m) => ({ default: m.Calendar })));
const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));
const NotFound = lazy(() => import("./pages/NotFound").then((m) => ({ default: m.NotFound })));

export function App() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { userDoc, loading: docLoading, error: docError } = useUserDoc(authUser);
  const { needsOnboarding } = useOnboardingGate(userDoc);
  const location = useLocation();

  useEffect(() => {
    return installAutoFlush(processQueuedWrite);
  }, []);

  // Live server-initiated events over SSE (the foreground complement to Web
  // Push). While the tab is open we surface them as a notification if the user
  // granted permission, otherwise we hand them to any in-app listener.
  useEffect(() => {
    if (!authUser) return;
    return subscribeServerEvents((event) => {
      window.dispatchEvent(new CustomEvent("ministry:server-event", { detail: event }));
      const canNotify =
        "Notification" in window &&
        Notification.permission === "granted" &&
        document.visibilityState === "visible";
      if (canNotify) {
        try {
          new Notification(event.title ?? "Campus Ministry", { body: event.body });
        } catch {
          /* Some browsers require ServiceWorkerRegistration.showNotification. */
        }
      } else {
        console.info("[sse] server event", event);
      }
    });
  }, [authUser]);

  // Focus management: move keyboard focus to <main> when the route changes,
  // so screen-reader users hear the new page.
  useEffect(() => {
    const main = document.getElementById("main-content");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: false });
    }
  }, [location.pathname]);

  if (authLoading || (authUser && docLoading)) {
    return <LoadingScreen />;
  }

  if (authUser && docError) {
    return <UserDocErrorScreen error={docError} />;
  }

  // Belt-and-suspenders: if we somehow have authUser but no userDoc yet and no
  // error, keep showing the loading state instead of crashing downstream.
  if (authUser && !userDoc) {
    return <LoadingScreen />;
  }

  if (!authUser) {
    return (
      <>
        <ConsentBanner />
        <Suspense fallback={<LoadingScreen />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </>
    );
  }

  if (needsOnboarding && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  // Inverse redirect: bounce away from /onboarding once it's no longer needed.
  // Without this, an ML whose scope fields were cleared gets permanently
  // trapped on the form when Firestore's persistent cache hands us a stale
  // `role: "member"` doc on refresh — the live snapshot updates role to
  // ministryLeader a beat later, but App only redirects *to* /onboarding.
  if (!needsOnboarding && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <OfflineBanner />
      <ServerEventToast />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/onboarding" element={<Onboarding userDoc={userDoc!} />} />
          <Route element={<AppShell userDoc={userDoc!} />}>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<BibleTalkChat userDoc={userDoc!} />} />
            <Route path="/studies" element={<Studies userDoc={userDoc!} />} />
            <Route path="/invitees/:inviteeId" element={<InviteeProfile userDoc={userDoc!} />} />
            <Route path="/calendar" element={<Calendar userDoc={userDoc!} />} />
          <Route path="/dashboard" element={<Dashboard userDoc={userDoc!} />} />
          <Route path="/settings" element={<Settings userDoc={userDoc!} />} />
          {/* Real 404 inside the shell so nav stays available. */}
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/login" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  );
}
