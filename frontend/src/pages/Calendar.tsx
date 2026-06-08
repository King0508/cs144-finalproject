import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Study, UserDoc } from "../types/domain";
import { useStudies } from "../hooks/queries/useStudies";
import { useInvitees } from "../hooks/queries/useInvitees";
import { startOfWeek } from "../lib/dates";
import { WeeklyCalendar } from "../components/calendar/WeeklyCalendar";
import { Modal } from "../components/layout/Modal";
import { StudyForm } from "../components/studies/StudyForm";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";

interface CalendarProps {
  userDoc: UserDoc;
}

export function Calendar({ userDoc }: CalendarProps) {
  const { studies } = useStudies(userDoc);
  const { invitees } = useInvitees(userDoc);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [editing, setEditing] = useState<Study | null>(null);

  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    return d;
  }, [weekStart]);

  function shiftWeek(deltaDays: number) {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + deltaDays);
    setWeekStart(d);
  }

  const rangeLabel = `${weekStart.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })} — ${new Date(weekEnd.getTime() - 1).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;

  return (
    <div className="space-y-section motion-safe:stagger-children">
      <PageHeader
        eyebrow="Schedule"
        title="Weekly Calendar"
        description={rangeLabel}
        actions={
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => shiftWeek(-7)}
              aria-label="Previous week"
            >
              <Icon icon={ChevronLeft} size="sm" />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => shiftWeek(7)}
              aria-label="Next week"
            >
              <Icon icon={ChevronRight} size="sm" />
            </Button>
          </div>
        }
      />

      <WeeklyCalendar
        studies={studies.filter(
          (s) => s.scheduledAt >= weekStart.getTime() && s.scheduledAt < weekEnd.getTime(),
        )}
        weekStart={weekStart}
        onSelectStudy={(s) => setEditing(s)}
      />

      {editing && (
        <Modal title="Edit study" onClose={() => setEditing(null)}>
          <StudyForm
            userDoc={userDoc}
            invitees={invitees}
            existing={editing}
            onClose={() => setEditing(null)}
          />
        </Modal>
      )}
    </div>
  );
}
