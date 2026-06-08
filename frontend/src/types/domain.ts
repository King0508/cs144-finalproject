export type Gender = "M" | "F";

/**
 * Role hierarchy: ministryLeader > btLeader > member.
 * Visibility scope is implemented in Firestore rules and the backend's
 * applyRoleFilters() helper.
 */
export type Role = "member" | "btLeader" | "ministryLeader";

export interface Campus {
  id: string;
  name: string;
}

export interface BibleTalk {
  id: string;
  campusId: string;
  name: string;
  memberIds: string[];
}

export interface UserDoc {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: Role;
  campusId?: string;
  bibleTalkId?: string;
  fcmTokens?: string[];
  createdAt?: number;
}

export interface Invitee {
  id: string;
  name: string;
  gender: Gender;
  bibleTalkId: string;
  campusId: string;
  currentStudyIndex: number; // -1 = no studies completed; 0-7 = last completed study
  linkedUserId?: string | null;
  createdAt?: number;
}

export type StudyStatus = "scheduled" | "completed" | "cancelled";

export interface Study {
  id: string;
  bibleTalkId: string;
  campusId: string;
  inviteeId: string;
  inviteeName: string;
  gender: Gender;
  studyName: string;
  studyIndex: number;
  scheduledAt: number; // epoch ms
  durationMinutes: number;
  location?: string;
  leadUid?: string;
  leadName: string;
  supportUids?: string[];
  supportNames: string[];
  status: StudyStatus;
  reminderSent?: boolean;
  createdBy: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  authorUid: string;
  authorName: string;
  text: string;
  createdAt: number;
}
