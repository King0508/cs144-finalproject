import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { Invitee } from "../../types/domain";
import { Icon } from "../ui/Icon";

interface FollowUpListProps {
  invitees: Invitee[];
}

export function FollowUpList({ invitees }: FollowUpListProps) {
  return (
    <section aria-labelledby="followup-heading" className="border border-line bg-surface p-6">
      <header className="mb-5 space-y-1 border-b border-line pb-4">
        <p className="eyebrow">Attention</p>
        <h2 id="followup-heading" className="display-sm">
          Needs follow-up
        </h2>
        <p className="caption">Invitees who recently finished a study with nothing scheduled next.</p>
      </header>
      {invitees.length === 0 ? (
        <p className="caption">Nothing pending — great work.</p>
      ) : (
        <ul className="divide-y divide-line">
          {invitees.map((inv) => (
            <li
              key={inv.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              <span>
                <span className="font-display text-base tracking-tight text-ink">{inv.name}</span>
                <span className="caption mt-0.5 block">
                  Finished study #{Math.max(0, inv.currentStudyIndex + 1)}
                </span>
              </span>
              <Link
                to={`/invitees/${inv.id}`}
                className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ink-soft transition-colors hover:text-ink"
              >
                Suggest next
                <span className="inline-flex transition-transform duration-200 ease-smooth motion-safe:group-hover:translate-x-0.5">
                  <Icon icon={ArrowRight} size="xs" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
