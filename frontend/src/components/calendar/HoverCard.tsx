import type { Study } from "../../types/domain";

export interface HoverCardState {
  study: Study;
  x: number;
  y: number;
}

interface HoverCardProps {
  hover: HoverCardState;
  container: HTMLDivElement | null;
}

function formatTimeRange(start: number, durationMinutes: number): string {
  const startDate = new Date(start);
  const endDate = new Date(start + (durationMinutes || 60) * 60_000);
  const day = startDate.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const fmt = (d: Date) =>
    d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return `${day} · ${fmt(startDate)} – ${fmt(endDate)}`;
}

export function HoverCard({ hover, container }: HoverCardProps) {
  const { study } = hover;
  const cardWidth = 280;
  const containerWidth = container?.clientWidth ?? 800;
  // Center horizontally on the chip, clamp inside the container.
  const left = Math.max(8, Math.min(containerWidth - cardWidth - 8, hover.x - cardWidth / 2));
  const top = hover.y + 6;

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 bg-ink p-4 text-onInk"
      style={{ left, top, width: cardWidth }}
    >
      <p className="mb-3 text-[10px] uppercase tracking-[0.22em] text-onInk/60">
        {study.gender === "F" ? "Sister" : "Brother"}
      </p>
      <p className="font-display text-lg leading-tight tracking-tight">
        {study.inviteeName}
      </p>
      <p className="mt-1 text-sm text-onInk/75">{study.studyName}</p>

      <div className="mt-4 space-y-1 border-t border-onInk/15 pt-3 text-xs text-onInk/75">
        <p>{formatTimeRange(study.scheduledAt, study.durationMinutes)}</p>
        {study.location ? <p>{study.location}</p> : null}
        <p>
          Lead: {study.leadName}
          {study.supportNames && study.supportNames.length > 0
            ? ` · Support: ${study.supportNames.join(", ")}`
            : ""}
        </p>
      </div>

      {study.status !== "scheduled" ? (
        <p className="mt-3 inline-flex items-center gap-2 border border-onInk/30 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em]">
          {study.status}
        </p>
      ) : null}
    </div>
  );
}
