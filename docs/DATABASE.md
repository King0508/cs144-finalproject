# Database

Firestore is a document store; this file documents the **shape** of each collection (the spec asks "schema for RDBMS, basic description of data format for non-RDBMS" — this is the latter).

## Collections at a glance

```
campuses/{campusId}                           leaf doc — public-read
bibleTalks/{bibleTalkId}                      leaf doc — public-read
users/{uid}                                   leaf doc — self-read (+ leaders)
invitees/{inviteeId}                          leaf doc — role-scoped read
studies/{studyId}                             leaf doc — role-scoped read
messages/{bibleTalkId}/items/{messageId}      subcollection — bible-talk scoped
```

## `campuses/{campusId}`

The umbrella organisation a bible talk belongs to.

| Field | Type   | Notes                       |
| ----- | ------ | --------------------------- |
| name  | string | e.g. "UCLA", "USC", "UCSD"  |

Reads: any signed-in user (needed for onboarding).
Writes: ministry leader only.

## `bibleTalks/{bibleTalkId}`

A bible talk = ~10 members in a single-gender group. Each bible talk has one group chat.

| Field      | Type           | Notes                                                                  |
| ---------- | -------------- | ---------------------------------------------------------------------- |
| campusId   | string         | foreign key → `campuses/{id}`                                          |
| name       | string         | e.g. "Bruin Brothers"                                                  |
| gender     | "M" \| "F"    | the bible talk's gender                                                |
| memberIds  | string[]       | array of user UIDs in this bible talk                                  |

Reads: any signed-in user (needed for onboarding).
Writes: members can add their own uid to `memberIds` (self-onboarding); leaders can fully edit.

## `users/{uid}`

Mirrors the Firebase Auth user with app-specific role + scope.

| Field        | Type                                                | Notes                                                  |
| ------------ | --------------------------------------------------- | ------------------------------------------------------ |
| uid          | string                                              | matches the document id                                |
| email        | string                                              | from Firebase Auth                                     |
| displayName  | string                                              | from Firebase Auth                                     |
| photoURL     | string \| null                                     | from Firebase Auth                                     |
| gender       | "M" \| "F"                                         | set during onboarding                                  |
| role         | "member" \| "btLeader" \| "ministryLeader"     | defaults to "member"; promotions require ministry leader |
| campusId     | string                                              | foreign key → `campuses/{id}`                          |
| bibleTalkId  | string                                              | foreign key → `bibleTalks/{id}`                        |
| fcmTokens    | string[]                                            | FCM Web Push registration tokens (one per browser)     |
| createdAt    | timestamp                                           | server time                                            |

Reads: the user themselves, plus BT leaders and ministry leaders.
Writes: self-edit allowed but **cannot** escalate `role`; ministry leaders can edit anyone.

## `invitees/{inviteeId}`

A person being studied with. Not necessarily an app user — most invitees are not.

| Field               | Type      | Notes                                                                                       |
| ------------------- | --------- | ------------------------------------------------------------------------------------------- |
| name                | string    | e.g. "John Park"                                                                            |
| gender              | "M"\|"F" | for the men/women split when listing studies                                                 |
| bibleTalkId         | string    | which bible talk owns this invitee                                                          |
| campusId            | string    | denormalised for query efficiency (avoids a second read just to apply campus-scope)         |
| currentStudyIndex   | number    | -1 = no studies done; 0..7 = index of the last completed study in the curriculum             |
| linkedUserId        | string \| null | reserved for the future case where an invitee becomes a ministry member with a login |
| createdAt           | number    | epoch ms                                                                                    |

Reads: anyone in scope (member → own BT; BT leader → own campus; ministry leader → all).
Writes: creator must be in the same BT/campus; updates allowed within scope.

## `studies/{studyId}`

A scheduled (or completed) bible-study session.

| Field           | Type                                                         | Notes                                                                              |
| --------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| bibleTalkId     | string                                                       | foreign key                                                                        |
| campusId        | string                                                       | denormalised foreign key                                                           |
| inviteeId       | string                                                       | foreign key → `invitees/{id}`                                                      |
| inviteeName     | string                                                       | denormalised so listing doesn't need a join                                        |
| gender          | "M"\|"F"                                                     | denormalised from the invitee                                                      |
| studyName       | StudyName                                                    | one of `"Seeking God" \| "Word of God" \| "Discipleship" \| "Kingdom" \| "Light and Darkness" \| "Cross" \| "Church" \| "CTC"` |
| studyIndex      | number                                                       | 0..7 (matches `studyName`)                                                         |
| scheduledAt     | number                                                       | epoch ms                                                                           |
| durationMinutes | number                                                       | default 60                                                                         |
| location        | string                                                       | free text                                                                          |
| leadUid         | string                                                       | the bible-talk member leading                                                      |
| leadName        | string                                                       | denormalised                                                                       |
| supportUids     | string[]                                                     | bible-talk members supporting                                                      |
| supportNames    | string[]                                                     | denormalised                                                                       |
| status          | "scheduled" \| "completed" \| "cancelled"               |                                                                                    |
| reminderSent    | boolean                                                      | scheduler sets this when it sends a push                                           |
| createdBy       | string                                                       | UID of the user who created the study                                              |
| createdAt       | number                                                       | epoch ms                                                                           |

Reads: anyone in scope.
Writes: creator must be in the same BT/campus; updates allowed within scope; deletes allowed for the creator, BT leader, or ministry leader.

## `messages/{bibleTalkId}/items/{messageId}`

Chat messages, scoped per bible talk via the parent path so security rules can use it directly.

| Field        | Type      | Notes                          |
| ------------ | --------- | ------------------------------ |
| authorUid    | string    |                                |
| authorName   | string    | denormalised                   |
| text         | string    | plaintext (no HTML)            |
| createdAt    | timestamp | server time                    |

Reads: members of the bible talk, the BT leader of the campus, and ministry leaders.
Writes: members of the bible talk (and the author UID must match the caller). Messages are immutable in v1 — `update` and `delete` are denied.

## Composite indexes

Defined in [`firestore/firestore.indexes.json`](../firestore/firestore.indexes.json):

- `studies` on `(status ASC, scheduledAt ASC)` — used by the reminder scheduler.
- `studies` on `(campusId ASC, scheduledAt ASC)` — used by the BT-leader Studies / Calendar views.
- `studies` on `(bibleTalkId ASC, scheduledAt ASC)` — used by the Member Studies / Calendar views.
- `bibleTalks` on `(campusId ASC, gender ASC)` — used by Onboarding's BT picker.

## Security rules summary

See [`firestore/firestore.rules`](../firestore/firestore.rules) for the canonical version. Briefly:

| Action                                        | Who can do it                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------ |
| Read campuses, bibleTalks                     | Any signed-in user (needed for onboarding)                                     |
| Promote a user's role                         | Ministry leader only                                                           |
| Add self to a bibleTalk's memberIds          | Self-only, and only the `memberIds` field can change                          |
| Read studies / invitees                      | Member → own BT; BT leader → own campus; ministry leader → all                |
| Create study / invitee                        | Caller's BT + campus must match the new document's fields                     |
| Update study / invitee                        | Same role-scope as read                                                       |
| Delete study                                  | Creator, BT leader, or ministry leader                                        |
| Read chat messages                            | Member of the BT, BT leader of the campus, or ministry leader                 |
| Write chat message                            | Member of the BT (only); `authorUid` must equal `request.auth.uid`            |
| Update / delete chat message                  | Denied (chat is immutable in v1)                                              |

The rules suite at [`backend/test/rules/firestore.rules.test.ts`](../backend/test/rules/firestore.rules.test.ts) exercises the member / BT-leader / ministry-leader cases against the Firestore emulator.
