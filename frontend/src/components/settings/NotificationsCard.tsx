import { Bell } from "lucide-react";
import { useEnablePush } from "../../hooks/mutations/useEnablePush";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

export function NotificationsCard() {
  const { enable, busy, message } = useEnablePush();

  return (
    <section aria-labelledby="notif-heading" className="border border-line bg-surface p-6">
      <header className="mb-5 space-y-1 border-b border-line pb-4">
        <p className="eyebrow inline-flex items-center gap-2">
          <Icon icon={Bell} size="xs" />
          Reminders
        </p>
        <h2 id="notif-heading" className="display-sm">
          Notifications
        </h2>
        <p className="caption max-w-prose">
          Get reminded fifteen minutes before each bible study and notified about ministry-wide
          announcements.
        </p>
      </header>
      <Button variant="primary" onClick={() => void enable()} disabled={busy} aria-busy={busy}>
        {busy ? "Requesting" : "Enable notifications"}
      </Button>
      {message ? (
        <p className="caption mt-3" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
