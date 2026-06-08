import { useState } from "react";
import { FlaskConical } from "lucide-react";
import type { Role } from "../../types/domain";
import { useDevSetRole } from "../../hooks/mutations/useDevSetRole";
import { Button } from "../ui/Button";
import { Icon } from "../ui/Icon";
import { Badge } from "../ui/Badge";
import { Field, SelectInput } from "../ui/Field";

const ROLES: readonly Role[] = ["member", "btLeader", "ministryLeader"] as const;

interface DevRoleSwitcherProps {
  currentRole: Role;
}

export function DevRoleSwitcher({ currentRole }: DevRoleSwitcherProps) {
  const [pendingRole, setPendingRole] = useState<Role>(currentRole);
  const { setRole, busy, message } = useDevSetRole();

  function onSwitch() {
    if (pendingRole === currentRole) return;
    void setRole(pendingRole);
  }

  return (
    <section aria-labelledby="dev-heading" className="border border-line bg-surface p-6">
      <header className="mb-5 flex items-start justify-between gap-4 border-b border-line pb-4">
        <div className="space-y-2">
          <p className="eyebrow inline-flex items-center gap-2">
            <Icon icon={FlaskConical} size="xs" />
            Internal
          </p>
          <h2 id="dev-heading" className="display-sm">
            Switch role
          </h2>
          <p className="caption max-w-prose">
            Switches your role via the dev-only{" "}
            <code className="font-mono text-ink">/api/dev/role</code> endpoint (Admin SDK,
            bypasses Firestore rules). Disabled in production builds.
          </p>
        </div>
        <Badge tone="outline">Dev only</Badge>
      </header>

      <div className="flex flex-wrap items-end gap-4">
        <div className="min-w-[160px] flex-1">
          <Field label="Role" id="role-select">
            <SelectInput
              id="role-select"
              value={pendingRole}
              onChange={(e) => setPendingRole(e.target.value as Role)}
              disabled={busy}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>
        <Button
          variant="primary"
          onClick={onSwitch}
          disabled={busy || pendingRole === currentRole}
          aria-busy={busy}
        >
          {busy ? "Switching" : "Switch role"}
        </Button>
      </div>

      {message ? (
        <p
          role={message.kind === "err" ? "alert" : "status"}
          className="mt-4 text-sm text-ink"
        >
          {message.text}
        </p>
      ) : null}
    </section>
  );
}
