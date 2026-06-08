import type { UserDoc } from "../types/domain";
import { ProfileCard } from "../components/settings/ProfileCard";
import { NotificationsCard } from "../components/settings/NotificationsCard";
import { DevRoleSwitcher } from "../components/settings/DevRoleSwitcher";
import { SessionCard } from "../components/settings/SessionCard";
import { PageHeader } from "../components/ui/PageHeader";

interface SettingsProps {
  userDoc: UserDoc;
}

export function Settings({ userDoc }: SettingsProps) {
  return (
    <div className="space-y-section motion-safe:stagger-children">
      <PageHeader
        eyebrow="Preferences"
        title="Settings"
        description="Account, notifications, and developer-only tools."
      />

      <div className="space-y-stack motion-safe:stagger-children">
        <ProfileCard userDoc={userDoc} />
        <NotificationsCard />
        {import.meta.env.DEV ? <DevRoleSwitcher currentRole={userDoc.role} /> : null}
        <SessionCard />
      </div>
    </div>
  );
}
