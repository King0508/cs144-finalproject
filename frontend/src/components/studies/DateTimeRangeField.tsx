import { ONE_HOUR_MS, toDatetimeLocalValue } from "../../lib/dates";
import { Field, TextInput } from "../ui/Field";

interface DateTimeRangeFieldProps {
  startAt: string;
  endAt: string;
  onStartChange: (next: string) => void;
  onEndChange: (next: string) => void;
  disabled?: boolean;
}

/**
 * Paired start/end `<input type="datetime-local">` control. Changing the
 * start auto-bumps the end to start + 1h so the user doesn't have to keep
 * both in sync manually.
 */
export function DateTimeRangeField({
  startAt,
  endAt,
  onStartChange,
  onEndChange,
  disabled,
}: DateTimeRangeFieldProps) {
  function handleStart(next: string) {
    onStartChange(next);
    const startMs = new Date(next).getTime();
    if (!Number.isNaN(startMs)) {
      onEndChange(toDatetimeLocalValue(startMs + ONE_HOUR_MS));
    }
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      <Field label="Starts" id="start-at">
        <TextInput
          id="start-at"
          type="datetime-local"
          step={900}
          value={startAt}
          onChange={(e) => handleStart(e.target.value)}
          disabled={disabled}
          required
        />
      </Field>
      <Field label="Ends" id="end-at">
        <TextInput
          id="end-at"
          type="datetime-local"
          step={900}
          value={endAt}
          onChange={(e) => onEndChange(e.target.value)}
          disabled={disabled}
          required
        />
      </Field>
    </div>
  );
}
