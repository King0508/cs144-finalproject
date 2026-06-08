import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Info } from "lucide-react";
import type { UserDoc } from "../types/domain";
import { useCampuses } from "../hooks/queries/useCampuses";
import { useBibleTalksByCampus } from "../hooks/queries/useBibleTalksByCampus";
import { useCompleteOnboarding } from "../hooks/mutations/useCompleteOnboarding";
import { Button } from "../components/ui/Button";
import { Icon } from "../components/ui/Icon";
import { Logo } from "../components/ui/Logo";
import { Field, SelectInput } from "../components/ui/Field";

interface OnboardingProps {
  userDoc: UserDoc;
}

export function Onboarding({ userDoc }: OnboardingProps) {
  const navigate = useNavigate();
  const { campuses, loading } = useCampuses();
  const [campusId, setCampusId] = useState(userDoc.campusId ?? "");
  const [bibleTalkId, setBibleTalkId] = useState(userDoc.bibleTalkId ?? "");
  const bibleTalks = useBibleTalksByCampus(campusId || null);
  const { complete, busy, error } = useCompleteOnboarding();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await complete({ uid: userDoc.uid, campusId, bibleTalkId });
      navigate("/");
    } catch {
      // surfaced via the hook's `error` state below
    }
  }

  const firstName = userDoc.displayName.split(" ")[0];

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-section sm:px-gutter md:py-section-lg motion-safe:animate-fade-in-up">
        <header className="space-y-6 border-b border-line pb-stack">
          <div className="flex items-center gap-3">
            <Logo size="md" decorative />
            <span className="eyebrow">Restored Church · Welcome, {firstName}</span>
          </div>
          <h1 className="display-lg max-w-[20ch]">A few quiet details before we begin.</h1>
          <p className="body max-w-prose">
            Tell us which bible talk you're part of so you see the right chats and studies.
          </p>
        </header>

        <form onSubmit={onSubmit} className="mt-section grid gap-section md:grid-cols-12">
          <fieldset className="contents" disabled={busy}>
            <div className="space-y-stack md:col-span-7">
              <Field label="Campus" id="campus-select">
                <SelectInput
                  id="campus-select"
                  value={campusId}
                  onChange={(e) => {
                    setCampusId(e.target.value);
                    setBibleTalkId("");
                  }}
                  disabled={loading || campuses.length === 0}
                  required
                >
                  <option value="">Choose your campus…</option>
                  {campuses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Bible talk" id="bt-select">
                <SelectInput
                  id="bt-select"
                  value={bibleTalkId}
                  onChange={(e) => setBibleTalkId(e.target.value)}
                  disabled={!campusId || bibleTalks.length === 0}
                  required
                >
                  <option value="">
                    {campusId
                      ? bibleTalks.length === 0
                        ? "No bible talks at this campus yet — ask a leader."
                        : "Choose your bible talk…"
                      : "Pick a campus first"}
                  </option>
                  {bibleTalks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              {error ? (
                <p role="alert" className="text-sm text-ink">
                  {error}
                </p>
              ) : null}

              <div className="pt-stack">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={busy}
                  aria-busy={busy}
                  trailing={<Icon icon={ArrowRight} size="sm" />}
                >
                  {busy ? "Saving" : "Continue"}
                </Button>
              </div>
            </div>

            <aside className="space-y-4 border-t border-line pt-stack md:col-span-5 md:border-l md:border-t-0 md:pl-section md:pt-0">
              <p className="eyebrow">Why we ask</p>
              <p className="body-sm max-w-prose">
                Your chat thread, study schedule, and analytics scope to the bible talk you
                belong to. You can change this at any time from Settings.
              </p>
              {campuses.length === 0 && !loading ? (
                <div className="flex items-start gap-3 border border-line p-4 text-xs text-ink-soft">
                  <span className="mt-0.5 text-ink-soft">
                    <Icon icon={Info} size="sm" />
                  </span>
                  <p>
                    No campuses found yet. Run the seed script
                    (<code className="font-mono text-ink">npm -w backend run seed</code>) to
                    create example data.
                  </p>
                </div>
              ) : null}
            </aside>
          </fieldset>
        </form>
      </div>
    </main>
  );
}
