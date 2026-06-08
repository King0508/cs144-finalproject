import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { doc, getDoc, setDoc } from "firebase/firestore";

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: "ministry-rules-test",
    firestore: {
      rules: readFileSync(resolve(__dirname, "../../../firestore/firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });
});

afterAll(async () => {
  await testEnv?.cleanup();
});

beforeEach(async () => {
  await testEnv.clearFirestore();

  // Seed: two campuses, two BTs, three users with different roles.
  await testEnv.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "campuses/ucla"), { name: "UCLA" });
    await setDoc(doc(db, "campuses/usc"), { name: "USC" });
    await setDoc(doc(db, "bibleTalks/bt-ucla-a"), { campusId: "ucla", name: "UCLA A", memberIds: [] });
    await setDoc(doc(db, "bibleTalks/bt-ucla-b"), { campusId: "ucla", name: "UCLA B", memberIds: [] });
    await setDoc(doc(db, "bibleTalks/bt-usc-a"), { campusId: "usc", name: "USC A", memberIds: [] });
    await setDoc(doc(db, "users/member-ucla"), { uid: "member-ucla", role: "member", campusId: "ucla", bibleTalkId: "bt-ucla-a" });
    await setDoc(doc(db, "users/bt-leader-ucla"), { uid: "bt-leader-ucla", role: "btLeader", campusId: "ucla", bibleTalkId: "bt-ucla-a" });
    await setDoc(doc(db, "users/ministry-leader"), { uid: "ministry-leader", role: "ministryLeader" });
    // A study in each BT.
    await setDoc(doc(db, "studies/s-ucla-a"), {
      bibleTalkId: "bt-ucla-a", campusId: "ucla", inviteeId: "inv1", inviteeName: "Inv 1", gender: "M",
      studyName: "Seeking God", studyIndex: 0, scheduledAt: Date.now(), durationMinutes: 60,
      leadUid: "member-ucla", leadName: "Member", supportUids: [], supportNames: [], status: "scheduled",
      createdBy: "member-ucla", createdAt: Date.now(),
    });
    await setDoc(doc(db, "studies/s-ucla-b"), {
      bibleTalkId: "bt-ucla-b", campusId: "ucla", inviteeId: "inv2", inviteeName: "Inv 2", gender: "F",
      studyName: "Seeking God", studyIndex: 0, scheduledAt: Date.now(), durationMinutes: 60,
      leadUid: "someone", leadName: "Someone", supportUids: [], supportNames: [], status: "scheduled",
      createdBy: "someone", createdAt: Date.now(),
    });
    await setDoc(doc(db, "studies/s-usc-a"), {
      bibleTalkId: "bt-usc-a", campusId: "usc", inviteeId: "inv3", inviteeName: "Inv 3", gender: "M",
      studyName: "Seeking God", studyIndex: 0, scheduledAt: Date.now(), durationMinutes: 60,
      leadUid: "someone", leadName: "Someone", supportUids: [], supportNames: [], status: "scheduled",
      createdBy: "someone", createdAt: Date.now(),
    });
  });
});

describe("Firestore rules: members", () => {
  it("can read studies in their own bible talk", async () => {
    const ctx = testEnv.authenticatedContext("member-ucla");
    await assertSucceeds(getDoc(doc(ctx.firestore(), "studies/s-ucla-a")));
  });

  it("CANNOT read studies in another bible talk on the same campus", async () => {
    const ctx = testEnv.authenticatedContext("member-ucla");
    await assertFails(getDoc(doc(ctx.firestore(), "studies/s-ucla-b")));
  });

  it("CANNOT read studies on another campus", async () => {
    const ctx = testEnv.authenticatedContext("member-ucla");
    await assertFails(getDoc(doc(ctx.firestore(), "studies/s-usc-a")));
  });
});

describe("Firestore rules: BT leaders", () => {
  it("can read studies in their own campus across BTs", async () => {
    const ctx = testEnv.authenticatedContext("bt-leader-ucla");
    await assertSucceeds(getDoc(doc(ctx.firestore(), "studies/s-ucla-a")));
    await assertSucceeds(getDoc(doc(ctx.firestore(), "studies/s-ucla-b")));
  });

  it("CANNOT read studies on another campus", async () => {
    const ctx = testEnv.authenticatedContext("bt-leader-ucla");
    await assertFails(getDoc(doc(ctx.firestore(), "studies/s-usc-a")));
  });
});

describe("Firestore rules: ministry leaders", () => {
  it("can read studies across all campuses", async () => {
    const ctx = testEnv.authenticatedContext("ministry-leader");
    await assertSucceeds(getDoc(doc(ctx.firestore(), "studies/s-ucla-a")));
    await assertSucceeds(getDoc(doc(ctx.firestore(), "studies/s-ucla-b")));
    await assertSucceeds(getDoc(doc(ctx.firestore(), "studies/s-usc-a")));
  });
});
