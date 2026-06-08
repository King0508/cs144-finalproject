import type { UserDoc } from "../../types/domain";
import { labelForRole } from "../../lib/roles";

interface ProfileCardProps {
  userDoc: UserDoc;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-4 sm:grid-cols-4">
      <dt className="col-span-1 text-[11px] uppercase tracking-[0.18em] text-ink-soft">
        {label}
      </dt>
      <dd className="col-span-2 truncate text-sm text-ink sm:col-span-3">{value}</dd>
    </div>
  );
}

export function ProfileCard({ userDoc }: ProfileCardProps) {
  return (
    <section
      aria-labelledby="profile-heading"
      className="border border-line bg-surface px-6 pb-2 pt-6"
    >
      <header className="mb-2 space-y-1 border-b border-line pb-4">
        <p className="eyebrow">Account</p>
        <h2 id="profile-heading" className="display-sm">
          Profile
        </h2>
      </header>
      <dl className="divide-y divide-line">
        <Row label="Name" value={userDoc.displayName} />
        <Row label="Email" value={userDoc.email} />
        <Row label="Role" value={labelForRole(userDoc.role)} />
        <Row label="Campus" value={userDoc.campusId ?? "—"} />
        <Row label="Bible talk" value={userDoc.bibleTalkId ?? "—"} />
      </dl>
    </section>
  );
}
