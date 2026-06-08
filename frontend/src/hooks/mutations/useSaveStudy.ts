import { useCallback, useState } from "react";
import { addDoc, collection, doc, setDoc, updateDoc } from "firebase/firestore";
import { getFirebase } from "../../store/firebase";
import { enqueue } from "../../store/offlineQueue";
import { CURRICULUM, STUDY_INDEX } from "../../lib/curriculum";
import type { Gender, Invitee, Study, UserDoc } from "../../types/domain";

export interface SaveStudyInput {
  inviteeName: string;
  inviteeGender: Gender;
  studyName: string;
  startMs: number;
  endMs: number;
  location: string;
  leadName: string;
  supportNames: string[];
}

export interface UseSaveStudyResult {
  save: (input: SaveStudyInput) => Promise<void>;
  busy: boolean;
  error: string | null;
}

interface UseSaveStudyOptions {
  userDoc: UserDoc;
  invitees: Invitee[];
  existing?: Study | null;
  onSuccess: () => void;
}

/**
 * Persists a new or edited Study. Handles invitee dedup (reuse an existing
 * invitee with the same case-insensitive name in the same bible talk) and
 * falls back to the offline queue for edits when offline.
 */
export function useSaveStudy({
  userDoc,
  invitees,
  existing,
  onSuccess,
}: UseSaveStudyOptions): UseSaveStudyResult {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = useCallback(
    async (input: SaveStudyInput) => {
      setError(null);
      setBusy(true);
      try {
        const { db } = getFirebase();

        const trimmedName = input.inviteeName.trim();
        if (!trimmedName) {
          throw new Error("Please enter the invitee's name.");
        }
        if (!userDoc.bibleTalkId || !userDoc.campusId) {
          throw new Error("Your account isn't fully onboarded.");
        }
        if (Number.isNaN(input.startMs) || Number.isNaN(input.endMs)) {
          throw new Error("Please pick a valid start and end time.");
        }

        const durationMinutes = Math.max(
          15,
          Math.round((input.endMs - input.startMs) / (60 * 1000)),
        );

        // Reuse existing invitee with the same name (case-insensitive) within
        // this bible talk to avoid duplicate records; otherwise create one.
        const lowerName = trimmedName.toLowerCase();
        const existingInvitee = invitees.find(
          (i) =>
            i.bibleTalkId === userDoc.bibleTalkId &&
            i.name.trim().toLowerCase() === lowerName,
        );

        let finalInviteeId: string;
        let finalInviteeGender: Gender;
        if (existingInvitee) {
          finalInviteeId = existingInvitee.id;
          finalInviteeGender = existingInvitee.gender;
        } else {
          const created = await addDoc(collection(db, "invitees"), {
            name: trimmedName,
            gender: input.inviteeGender,
            bibleTalkId: userDoc.bibleTalkId,
            campusId: userDoc.campusId,
            currentStudyIndex: -1,
            linkedUserId: null,
            createdAt: Date.now(),
          });
          finalInviteeId = created.id;
          finalInviteeGender = input.inviteeGender;
        }

        const trimmedStudyName = input.studyName.trim() || CURRICULUM[0];
        const trimmedLeadName = input.leadName.trim() || userDoc.displayName;

        const payload = {
          bibleTalkId: userDoc.bibleTalkId,
          campusId: userDoc.campusId,
          inviteeId: finalInviteeId,
          inviteeName: trimmedName,
          gender: finalInviteeGender,
          studyName: trimmedStudyName,
          studyIndex: STUDY_INDEX[trimmedStudyName as keyof typeof STUDY_INDEX] ?? -1,
          scheduledAt: input.startMs,
          durationMinutes,
          location: input.location.trim(),
          leadName: trimmedLeadName,
          supportNames: input.supportNames,
          status: existing?.status ?? "scheduled",
          reminderSent: existing?.reminderSent ?? false,
          createdBy: existing?.createdBy ?? userDoc.uid,
          createdAt: existing?.createdAt ?? Date.now(),
        };

        if (existing) {
          if (!navigator.onLine) {
            await enqueue("study.update", { studyId: existing.id, patch: payload });
          } else {
            try {
              await updateDoc(doc(db, "studies", existing.id), payload);
            } catch (err) {
              console.warn("[useSaveStudy] update failed, queueing", err);
              await enqueue("study.update", { studyId: existing.id, patch: payload });
            }
          }
        } else {
          const ref = doc(collection(db, "studies"));
          await setDoc(ref, payload);
        }

        onSuccess();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Save failed.");
      } finally {
        setBusy(false);
      }
    },
    [userDoc, invitees, existing, onSuccess],
  );

  return { save, busy, error };
}
