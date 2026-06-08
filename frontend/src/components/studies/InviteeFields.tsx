import type { Gender } from "../../types/domain";
import { SelectInput, TextInput } from "../ui/Field";

interface InviteeFieldsProps {
  name: string;
  gender: Gender;
  onNameChange: (next: string) => void;
  onGenderChange: (next: Gender) => void;
  /** Visually disable inputs while the form is saving. */
  disabled?: boolean;
}

export function InviteeFields({
  name,
  gender,
  onNameChange,
  onGenderChange,
  disabled,
}: InviteeFieldsProps) {
  return (
    <fieldset disabled={disabled} className="space-y-2">
      <legend className="mb-2 block text-[11px] font-medium uppercase tracking-[0.22em] text-ink-soft">
        Invitee
      </legend>
      <div className="grid grid-cols-3 gap-4">
        <TextInput
          className="col-span-2"
          placeholder="Invitee's name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
          aria-label="Invitee name"
        />
        <SelectInput
          value={gender}
          onChange={(e) => onGenderChange(e.target.value as Gender)}
          aria-label="Invitee gender"
        >
          <option value="M">Male</option>
          <option value="F">Female</option>
        </SelectInput>
      </div>
    </fieldset>
  );
}
