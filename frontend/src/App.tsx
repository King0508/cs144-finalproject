import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "./hooks/auth/useAuth";
import { useUserDoc } from "./hooks/auth/useUserDoc";
import { useOnboardingGate } from "./hooks/auth/useOnboardingGate";
import { Login } from "./pages/Login";
import { Onboarding } from "./pages/Onboarding";
import { BibleTalkChat } from "./pages/BibleTalkChat";
import { Studies } from "./pages/Studies";
import { InviteeProfile } from "./pages/InviteeProfile";
import { Calendar } from "./pages/Calendar";
import { Dashboard } from "./pages/Dashboard";
import { Settings } from "./pages/Settings";
import { AppShell } from "./components/layout/AppShell";
import { ConsentBanner } from "./components/layout/ConsentBanner";
import { OfflineBanner } from "./components/layout/OfflineBanner";
import { LoadingScreen } from "./components/layout/LoadingScreen";
import { UserDocErrorScreen } from "./components/layout/UserDocErrorScreen";
import { installAutoFlush } from "./store/offlineQueue";
import { processQueuedWrite } from "./store/queueProcessor";

export function App() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { userDoc, loading: docLoading, error: docError } = useUserDoc(authUser);
  const { needsOnboarding } = useOnboardingGate(userDoc);
  const location = useLocation();

  useEffect(() => {
    return installAutoFlush(processQueuedWrite);
  }, []);

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
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
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
        </Route>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
