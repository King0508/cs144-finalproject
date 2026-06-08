import { Link } from "react-router-dom";
import { Check, MapPin, Pencil, Users } from "lucide-react";
import type { Study } from "../../types/domain";
import { Icon } from "../ui/Icon";
import { Badge } from "../ui/Badge";

interface StudyCardProps {
  study: Study;
  onEdit: (s: Study) => void;
  onComplete: (s: Study) => void;
}

export function StudyCard({ study, onEdit, onComplete }: StudyCardProps) {
  const accentStripe = study.gender === "F" ? "before:bg-accent" : "before:bg-ink";
  return (
    <article
      className={
        "relative border border-line bg-surface px-5 py-4 transition-all duration-200 ease-smooth hover:border-line-strong motion-safe:hover:-translate-y-px " +
        "before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[2px] " +
        accentStripe
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <p className="font-display text-lg leading-tight tracking-tight">
            <Link
              to={`/invitees/${study.inviteeId}`}
              className="text-ink underline-offset-4 transition-colors duration-150 hover:text-accent hover:underline"
            >
              {study.inviteeName}
            </Link>
            <span className="text-ink-faint"> · </span>
            <span className="text-ink-soft">{study.studyName}</span>
          </p>

          <p className="text-sm text-ink-soft">
            <time dateTime={new Date(study.scheduledAt).toISOString()}>
              {new Date(study.scheduledAt).toLocaleString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </time>
            {study.location ? (
              <span className="inline-flex items-center gap-1 pl-2 align-baseline">
                <Icon icon={MapPin} size="xs" />
                {study.location}
              </span>
            ) : null}
          </p>

          <p className="caption inline-flex items-center gap-1">
            <Icon icon={Users} size="xs" />
            Lead {study.leadName}
            {study.supportNames.length > 0
              ? ` · Support ${study.supportNames.join(", ")}`
              : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            type="button"
            className="icon-button -mr-2 -mt-1"
            onClick={() => onEdit(study)}
            aria-label={`Edit study with ${study.inviteeName}`}
          >
            <Icon icon={Pencil} size="sm" />
          </button>
          {study.status === "scheduled" ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 border border-line-strong px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
              onClick={() => onComplete(study)}
            >
              <Icon icon={Check} size="xs" />
              Mark complete
            </button>
          ) : (
            <Badge tone="accent">Done</Badge>
          )}
        </div>
      </div>
    </article>
  );
}
