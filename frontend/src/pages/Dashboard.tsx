import { useMemo } from "react";
import type { UserDoc } from "../types/domain";
import { useStudies } from "../hooks/queries/useStudies";
import { useInvitees } from "../hooks/queries/useInvitees";
import { useBibleTalks } from "../hooks/queries/useBibleTalks";
import { useDashboardAggregates } from "../hooks/queries/useDashboardAggregates";
import { startOfWeek, ONE_DAY_MS } from "../lib/dates";
import { WeeklyHeatmapCanvas } from "../components/charts/WeeklyHeatmapCanvas";
import { StatCard } from "../components/charts/StatCard";
import { GenderStackedBarCard } from "../components/charts/GenderStackedBarCard";
import { CountCard } from "../components/charts/CountCard";
import { AskBotPanel } from "../components/dashboard/AskBotPanel";
import { FollowUpList } from "../components/dashboard/FollowUpList";
import { MinistryToolsPanel } from "../components/dashboard/MinistryToolsPanel";
import { PageHeader } from "../components/ui/PageHeader";

interface DashboardProps {
  userDoc: UserDoc;
}

export function Dashboard({ userDoc }: DashboardProps) {
  const { studies } = useStudies(userDoc);
  const { invitees } = useInvitees(userDoc);
  const { bibleTalks } = useBibleTalks(userDoc);
  const weekStart = useMemo(() => startOfWeek(new Date()), []);

  const { byCampus, bibleTalkRows, studyRows, needsFollowUp } = useDashboardAggregates({
    studies,
    invitees,
    bibleTalks,
  });

  const weekStartMs = weekStart.getTime();
  const studiesThisWeek = studies.filter(
    (s) => s.scheduledAt >= weekStartMs && s.scheduledAt < weekStartMs + 7 * ONE_DAY_MS,
  ).length;

  return (
    <div className="space-y-section motion-safe:stagger-children">
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description={`${studies.length} studies in scope · ${invitees.length} invitees.`}
      />

      <div className="grid gap-stack sm:grid-cols-3">
        <StatCard label="Studies total" value={studies.length} hint="Across your scope" />
        <StatCard label="This week" value={studiesThisWeek} hint="Scheduled Mon — Sun" />
        <StatCard label="Invitees" value={invitees.length} hint="Active in curriculum" />
      </div>

      <WeeklyHeatmapCanvas studies={studies} weekStart={weekStart} />

      {/*
       * Below-the-fold sections live in a plain wrapper so the top-level
       * stagger animation doesn't cascade past the heatmap. Each section
       * just renders — no per-section reveal animation.
       */}
      <div className="space-y-section">
        <div className="grid gap-stack md:grid-cols-2">
          <GenderStackedBarCard
            title="By bible talk"
            rows={bibleTalkRows}
            emptyHint="No bible-talk activity yet."
            headingId="cc-bt-gender"
          />
          <GenderStackedBarCard
            title="By study"
            rows={studyRows}
            emptyHint="No studies scheduled yet."
            headingId="cc-study-gender"
          />
        </div>

        {userDoc.role === "ministryLeader" ? (
          <CountCard title="By campus" data={byCampus} emptyHint="No campus activity yet." />
        ) : null}

        <AskBotPanel />

        <FollowUpList invitees={needsFollowUp} />

        {userDoc.role === "ministryLeader" ? <MinistryToolsPanel /> : null}
      </div>
    </div>
  );
}
