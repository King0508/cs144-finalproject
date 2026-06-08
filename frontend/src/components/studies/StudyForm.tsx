import { useState } from "react";
import { CURRICULUM } from "../../lib/curriculum";
import { ONE_DAY_MS, ONE_HOUR_MS, roundTo15, toDatetimeLocalValue } from "../../lib/dates";
import type { Gender, Invitee, Study, UserDoc } from "../../types/domain";
import { useSaveStudy } from "../../hooks/mutations/useSaveStudy";
import { InviteeFields } from "./InviteeFields";
import { DateTimeRangeField } from "./DateTimeRangeField";
import { Field, TextInput } from "../ui/Field";
import { Button } from "../ui/Button";

interface StudyFormProps {
  userDoc: UserDoc;
  invitees: Invitee[];
  existing?: Study | null;
  onClose: () => void;
}

export function StudyForm({ userDoc, invitees, existing, onClose }: StudyFormProps) {
  const [inviteeName, setInviteeName] = useState(existing?.inviteeName ?? "");
  const [inviteeGender, setInviteeGender] = useState<Gender>(existing?.gender ?? "M");
  const [studyName, setStudyName] = useState<string>(existing?.studyName ?? CURRICULUM[0]);

  const initialStart = roundTo15(existing?.scheduledAt ?? Date.now() + ONE_DAY_MS);
  const initialEnd = existing
    ? existing.scheduledAt + (existing.durationMinutes ?? 60) * 60 * 1000
    : initialStart + ONE_HOUR_MS;

  const [startAt, setStartAt] = useState<string>(toDatetimeLocalValue(initialStart));
  const [endAt, setEndAt] = useState<string>(toDatetimeLocalValue(initialEnd));

  const [location, setLocation] = useState(existing?.location ?? "");
  const [leadName, setLeadName] = useState(existing?.leadName ?? userDoc.displayName ?? "");
  const [supportText, setSupportText] = useState(existing?.supportNames?.join(", ") ?? "");

  const { save, busy, error } = useSaveStudy({
    userDoc,
    invitees,
    existing,
    onSuccess: onClose,
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void save({
      inviteeName,
      inviteeGender,
      studyName,
      startMs: new Date(startAt).getTime(),
      endMs: new Date(endAt).getTime(),
      location,
      leadName,
      supportNames: supportText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <InviteeFields
        name={inviteeName}
        gender={inviteeGender}
        onNameChange={setInviteeName}
        onGenderChange={setInviteeGender}
        disabled={busy}
      />

      <Field label="Study" id="study-name">
        <TextInput
          id="study-name"
          list="curriculum-list"
          placeholder="Pick from the list or type a custom name"
          value={studyName}
          onChange={(e) => setStudyName(e.target.value)}
          disabled={busy}
          required
        />
        <datalist id="curriculum-list">
          {CURRICULUM.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
      </Field>

      <DateTimeRangeField
        startAt={startAt}
        endAt={endAt}
        onStartChange={setStartAt}
        onEndChange={setEndAt}
        disabled={busy}
      />

      <Field label="Location" id="location">
        <TextInput
          id="location"
          type="text"
          placeholder="e.g. Powell Library, Room 100"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={busy}
        />
      </Field>

      <Field label="Lead" id="lead-name">
        <TextInput
          id="lead-name"
          type="text"
          placeholder="Lead's name"
          value={leadName}
          onChange={(e) => setLeadName(e.target.value)}
          disabled={busy}
        />
      </Field>

      <Field label="Support" id="support" hint="Optional, comma-separated names.">
        <TextInput
          id="support"
          type="text"
          placeholder="Names separated by commas"
          value={supportText}
          onChange={(e) => setSupportText(e.target.value)}
          disabled={busy}
        />
      </Field>

      {error ? (
        <p role="alert" className="text-sm text-ink">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-3 border-t border-line pt-stack">
        <Button variant="ghost" onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" disabled={busy} aria-busy={busy}>
          {busy ? "Saving" : existing ? "Save changes" : "Create study"}
        </Button>
      </div>
    </form>
  );
}
