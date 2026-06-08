import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";
import { Icon } from "../ui/Icon";

export function OfflineBanner() {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-30 flex items-center justify-center gap-3 border-b border-line bg-ink px-5 py-2 text-xs uppercase tracking-[0.18em] text-onInk"
    >
      <Icon icon={CloudOff} size="xs" />
      <span>Offline — edits will queue and sync when you reconnect.</span>
    </div>
  );
}
