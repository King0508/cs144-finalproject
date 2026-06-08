import { Wrench } from "lucide-react";
import { useTestPush } from "../../hooks/mutations/useTestPush";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Badge } from "../ui/Badge";

export function MinistryToolsPanel() {
  const { send, busy, message } = useTestPush();

  return (
    <section aria-labelledby="admin-heading" className="border border-line bg-surface p-6">
      <header className="mb-5 flex items-start justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-2">
          <p className="eyebrow inline-flex items-center gap-2">
            <Icon icon={Wrench} size="xs" />
            Internal
          </p>
          <h2 id="admin-heading" className="display-sm">
            Ministry-leader tools
          </h2>
          <p className="caption max-w-prose">
            Server-initiated FCM Web Push, used in the demo to show notifications arriving when the
            app is closed.
          </p>
        </div>
        <Badge tone="outline">Leaders</Badge>
      </header>

      <Button variant="secondary" onClick={() => void send()} disabled={busy} aria-busy={busy}>
        {busy ? "Sending" : "Send test push to all devices"}
      </Button>
      {message ? (
        <p className="caption mt-3" role="status">
          {message}
        </p>
      ) : null}
    </section>
  );
}
