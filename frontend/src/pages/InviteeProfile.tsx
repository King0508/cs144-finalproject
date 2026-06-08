import { useParams } from "react-router-dom";
import { Clock, Copy, Sparkles } from "lucide-react";
import type { Study, UserDoc } from "../types/domain";
import { useStudies } from "../hooks/queries/useStudies";
import { useInvitee } from "../hooks/queries/useInvitee";
import { useNextStudySuggestion } from "../hooks/mutations/useNextStudySuggestion";
import { CURRICULUM, nextStudyName } from "../lib/curriculum";
import { CurriculumProgress } from "../components/curriculum/CurriculumProgress";
import { PageHeader } from "../components/ui/PageHeader";
import { Section } from "../components/ui/Section";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Badge } from "../components/ui/Badge";

interface InviteeProfileProps {
  userDoc: UserDoc;
}

export function InviteeProfile({ userDoc }: InviteeProfileProps) {
  const { inviteeId } = useParams<{ inviteeId: string }>();
  const invitee = useInvitee(inviteeId);
  const { studies } = useStudies(userDoc);
  const { suggest, busy: aiBusy, result: aiResult, error: aiError } = useNextStudySuggestion();

  if (!invitee) return <p className="caption">Loading invitee…</p>;

  const inviteeStudies: Study[] = studies
    .filter((s) => s.inviteeId === invitee.id)
    .sort((a, b) => a.scheduledAt - b.scheduledAt);

  const nextName = nextStudyName(invitee.currentStudyIndex);
  const tone = invitee.gender === "F" ? "accent" : "neutral";

  return (
    <div className="space-y-section motion-safe:stagger-children">
      <PageHeader
        eyebrow="Invitee"
        title={invitee.name}
        description={
          invitee.currentStudyIndex < 0
            ? "Has not completed any studies yet."
            : `Last completed: ${CURRICULUM[invitee.currentStudyIndex]}.`
        }
        actions={<Badge tone={tone}>{invitee.gender === "M" ? "Brother" : "Sister"}</Badge>}
      />

      <CurriculumProgress currentStudyIndex={invitee.currentStudyIndex} />

      <Section
        eyebrow="AI"
        title="Suggest next study"
        description="Gemini drafts a follow-up message you can paste into chat."
        actions={
          <Button
            variant="primary"
            onClick={() => void suggest(invitee.id)}
            disabled={aiBusy || !nextName}
            aria-busy={aiBusy}
            leading={<Icon icon={Sparkles} size="sm" />}
          >
            {aiBusy
              ? "Asking"
              : nextName
                ? `Draft for "${nextName}"`
                : "All studies complete"}
          </Button>
        }
      >
        {aiError ? (
          <p role="alert" className="text-sm text-ink">
            {aiError}
          </p>
        ) : null}
        {aiResult ? (
          <article className="space-y-3 border border-line bg-surface p-5">
            <p className="eyebrow">Next: {aiResult.nextStudyName ?? "—"}</p>
            <p className="whitespace-pre-wrap body text-ink">{aiResult.suggestedMessage}</p>
            {aiResult.suggestedMessage ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  void navigator.clipboard.writeText(aiResult.suggestedMessage ?? "")
                }
                leading={<Icon icon={Copy} size="xs" />}
              >
                Copy message
              </Button>
            ) : null}
          </article>
        ) : null}
      </Section>

      <Section eyebrow="History" title={`Studies with ${invitee.name}`}>
        {inviteeStudies.length === 0 ? (
          <p className="caption">No studies scheduled yet.</p>
        ) : (
          <ol className="divide-y divide-line border-t border-line">
            {inviteeStudies.map((s) => (
              <li key={s.id} className="flex items-start justify-between gap-4 py-4">
                <div className="space-y-1">
                  <p className="font-display text-base tracking-tight text-ink">{s.studyName}</p>
                  <p className="caption inline-flex items-center gap-2">
                    <Icon icon={Clock} size="xs" />
                    <time dateTime={new Date(s.scheduledAt).toISOString()}>
                      {new Date(s.scheduledAt).toLocaleString()}
                    </time>
                    <span aria-hidden="true">·</span>
                    <span>Lead {s.leadName}</span>
                  </p>
                </div>
                <Badge tone={s.status === "completed" ? "accent" : "outline"}>{s.status}</Badge>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  );
}
