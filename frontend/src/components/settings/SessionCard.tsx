import { LogOut } from "lucide-react";
import { signOutCurrent } from "../../store/firebase";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";

export function SessionCard() {
  return (
    <section aria-labelledby="session-heading" className="border border-line bg-surface p-6">
      <header className="mb-5 space-y-1 border-b border-line pb-4">
        <p className="eyebrow">Session</p>
        <h2 id="session-heading" className="display-sm">
          Sign out
        </h2>
        <p className="caption max-w-prose">End this browser session. You can sign back in any time.</p>
      </header>
      <Button
        variant="secondary"
        onClick={() => void signOutCurrent()}
        leading={<Icon icon={LogOut} size="sm" />}
      >
        Sign out
      </Button>
    </section>
  );
}
