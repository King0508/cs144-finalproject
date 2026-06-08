import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { Icon } from "../ui/Icon";
import { Button } from "../ui/Button";

const KEY = "ministry.consent.v1";

/**
 * One-time banner explaining what we store (Firebase Auth session + optional
 * notification permission). Required by spec for an authenticated app.
 */
export function ConsentBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(KEY) === "1");
  }, []);

  if (dismissed) return null;

  return (
    <div
      role="region"
      aria-label="Privacy and consent"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-gutter py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="mt-0.5 text-ink-soft">
            <Icon icon={Shield} size="md" />
          </span>
          <div className="space-y-1">
            <p className="eyebrow">Privacy</p>
            <p className="body-sm max-w-prose">
              Google sign-in (Firebase Auth), session stored in your browser, optional
              study-reminder notifications. No advertising tracking.
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            localStorage.setItem(KEY, "1");
            setDismissed(true);
          }}
        >
          Acknowledged
        </Button>
      </div>
    </div>
  );
}
