import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import type { Study, UserDoc } from "../types/domain";
import { useStudies } from "../hooks/queries/useStudies";
import { useInvitees } from "../hooks/queries/useInvitees";
import { useCompleteStudy } from "../hooks/mutations/useCompleteStudy";
import { useNowTick } from "../hooks/ui/useNowTick";
import { usePersistedState } from "../hooks/ui/usePersistedState";
import { isStudyUpcoming } from "../lib/studies";
import { labelForScope } from "../lib/roles";
import { StudyForm } from "../components/studies/StudyForm";
import { StudyColumn } from "../components/studies/StudyColumn";
import { Modal } from "../components/layout/Modal";
import {
  CurriculumFilter,
  describeCurriculumFilter,
  matchesCurriculumFilter,
  type CurriculumFilter as CurriculumFilterValue,
} from "../components/studies/CurriculumFilter";
import {
  TimePeriodFilter,
  describeTimePeriod,
  periodWindowEnd,
  type TimePeriodDays,
} from "../components/studies/TimePeriodFilter";
import { PageHeader } from "../components/ui/PageHeader";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";

const CURRICULUM_FILTER_STORAGE_KEY = "studies.curriculumFilter";
const TIME_PERIOD_STORAGE_KEY = "studies.timePeriodDays";

interface StudiesProps {
  userDoc: UserDoc;
}

function parseTimePeriod(raw: string): TimePeriodDays | null {
  const n = Number(raw);
  return n >= 1 && n <= 7 ? (n as TimePeriodDays) : null;
}

function parseCurriculumFilter(raw: string): CurriculumFilterValue | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      "selected" in parsed &&
      Array.isArray((parsed as { selected: unknown }).selected)
    ) {
      const arr = (parsed as { selected: unknown[] }).selected;
      const ok = arr.every(
        (n) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n < 8,
      );
      if (ok) {
        const unique = Array.from(new Set(arr as number[])).sort((a, b) => a - b);
        return { selected: unique };
      }
    }
  } catch {
    // fall through
  }
  return null;
}

export function Studies({ userDoc }: StudiesProps) {
  const { studies, loading } = useStudies(userDoc);
  const { invitees } = useInvitees(userDoc);
  const completeStudy = useCompleteStudy(invitees);
  const [editing, setEditing] = useState<Study | null>(null);
  const [creating, setCreating] = useState(false);

  // Ticks every minute so a study disappears from the page shortly after its
  // end time without requiring a manual refresh.
  const now = useNowTick(60_000);

  const [curriculumFilter, setCurriculumFilter] = usePersistedState<CurriculumFilterValue>({
    key: CURRICULUM_FILTER_STORAGE_KEY,
    defaultValue: { selected: [] },
    parse: parseCurriculumFilter,
    removeWhen: (v) => v.selected.length === 0,
  });

  const [periodDays, setPeriodDays] = usePersistedState<TimePeriodDays>({
    key: TIME_PERIOD_STORAGE_KEY,
    defaultValue: 1,
    parse: parseTimePeriod,
    serialize: String,
  });

  const grouped = useMemo(() => {
    const windowEnd = periodWindowEnd(now, periodDays);
    const inWindow = studies.filter(
      (s) =>
        s.scheduledAt <= windowEnd &&
        isStudyUpcoming(s, now) &&
        matchesCurriculumFilter(s, curriculumFilter),
    );
    return {
      men: inWindow.filter((s) => s.gender === "M"),
      women: inWindow.filter((s) => s.gender === "F"),
      total: inWindow.length,
    };
  }, [studies, now, curriculumFilter, periodDays]);

  const filterCaption = describeCurriculumFilter(curriculumFilter);
  const periodCaption = describeTimePeriod(periodDays);

  function closeModal() {
    setCreating(false);
    setEditing(null);
  }

  return (
    <div className="space-y-section motion-safe:stagger-children">
      <PageHeader
        eyebrow="Discipleship"
        title="Bible Studies"
        description={`${labelForScope(userDoc.role)} · ${grouped.total} scheduled ${periodCaption}${
          filterCaption ? ` · ${filterCaption}` : ""
        }.`}
        actions={
          <Button
            variant="primary"
            onClick={() => setCreating(true)}
            leading={<Icon icon={Plus} size="sm" />}
          >
            New study
          </Button>
        }
      />

      <div className="grid gap-stack md:grid-cols-2">
        <TimePeriodFilter value={periodDays} onChange={setPeriodDays} />
        <div className="md:col-span-1">
          <CurriculumFilter value={curriculumFilter} onChange={setCurriculumFilter} />
        </div>
      </div>

      {loading ? (
        <p className="caption" role="status">
          Loading studies…
        </p>
      ) : null}

      <div className="grid gap-section md:grid-cols-2">
        <StudyColumn
          title="Brothers"
          emptyLabel={`None scheduled ${periodCaption}.`}
          studies={grouped.men}
          onEdit={setEditing}
          onComplete={(s) => void completeStudy(s)}
        />
        <StudyColumn
          title="Sisters"
          emptyLabel={`None scheduled ${periodCaption}.`}
          studies={grouped.women}
          onEdit={setEditing}
          onComplete={(s) => void completeStudy(s)}
        />
      </div>

      {(creating || editing) && (
        <Modal title={editing ? "Edit study" : "New bible study"} onClose={closeModal}>
          <StudyForm
            userDoc={userDoc}
            invitees={invitees}
            existing={editing}
            onClose={closeModal}
          />
        </Modal>
      )}
    </div>
  );
}
