/**
 * Seeds Firestore with example campuses, bible talks, invitees, and studies
 * so the app has plenty to render in dev.
 *
 * Wipes campuses / bibleTalks / invitees / studies before reseeding.
 * Leaves users and messages untouched.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json \
 *   FIREBASE_PROJECT_ID=your-project \
 *   npm -w backend run seed
 */
import "dotenv/config";
import { db } from "../src/firebase.js";
import { CURRICULUM } from "../src/curriculum.js";

type Gender = "M" | "F";

const CAMPUSES = [
  { id: "ucla", name: "UCLA" },
  { id: "smc", name: "SMC" },
];

// Bible talks are co-gender; the M/F distinction lives only on invitees/studies.
const BIBLE_TALKS: { id: string; campusId: string; name: string }[] = [
  { id: "ucla-allegiant", campusId: "ucla", name: "Allegiant" },
  { id: "ucla-triumph", campusId: "ucla", name: "Triumph" },
  { id: "ucla-harp-and-sword", campusId: "ucla", name: "Harp & Sword" },
  { id: "ucla-ignite", campusId: "ucla", name: "Ignite" },
  { id: "smc-zion", campusId: "smc", name: "Zion" },
  { id: "smc-ctc", campusId: "smc", name: "CTC" },
  { id: "smc-holy-pursuit", campusId: "smc", name: "Holy Pursuit" },
  { id: "smc-lydias", campusId: "smc", name: "Lydia's" },
  { id: "smc-refining-faith", campusId: "smc", name: "Refining Faith" },
];

// Early-heavy curriculum distribution. Late studies are rare ("hot studies").
// Sums to 200.
const CURRICULUM_COUNTS = [50, 40, 32, 25, 20, 15, 12, 6];

const MALE_NAMES = [
  "Daniel", "Joshua", "Michael", "Aaron", "Kevin", "Timothy", "David", "Andrew",
  "John", "James", "Matthew", "Mark", "Luke", "Paul", "Peter", "Stephen",
  "Caleb", "Noah", "Samuel", "Joseph", "Jonathan", "Nathan", "Ethan", "Isaac",
  "Jacob", "Benjamin", "Christopher", "Brian", "Eric", "Justin", "Ryan", "Tyler",
  "Brandon", "Alex", "Jason", "Jordan", "Cameron", "Connor", "Dylan", "Evan",
  "Gabriel", "Hunter", "Ian", "Jared", "Kyle", "Logan", "Mason", "Nicholas",
  "Owen", "Patrick", "Quincy", "Robert", "Sean", "Trevor", "Victor", "Wesley",
  "Xavier", "Zachary", "Adrian", "Blake", "Carter", "Derek", "Elliot", "Felix",
  "George", "Henry", "Isaiah", "Jeremy", "Kenneth", "Lawrence", "Marcus", "Nolan",
  "Oscar", "Phillip", "Reuben", "Simon", "Theo", "Uriah", "Vincent", "Warren",
  "Anthony", "Brendan", "Charles", "Dominic", "Edward", "Francis", "Gavin", "Harold",
  "Ivan", "Jeffrey", "Karl", "Leonard", "Martin", "Nelson", "Otis", "Preston",
  "Quentin", "Ronald", "Steven", "Travis", "Ulysses", "Victor", "Walter", "Yosef",
  "Bryce", "Colin", "Damon", "Edgar", "Finn", "Grant", "Hayden", "Jude",
  "Kai", "Liam", "Mateo", "Nicolas", "Omar", "Pablo", "Quinn", "Rafael",
  "Sebastian", "Tristan", "Uri",
];

const FEMALE_NAMES = [
  "Hannah", "Sarah", "Emily", "Grace", "Hope", "Faith", "Joy", "Mary",
  "Esther", "Ruth", "Rachel", "Leah", "Rebecca", "Naomi", "Abigail", "Miriam",
  "Lydia", "Priscilla", "Eunice", "Lois", "Phoebe", "Tabitha", "Dorcas", "Anna",
  "Elizabeth", "Olivia", "Sophia", "Ava", "Mia", "Ella", "Chloe", "Zoe",
  "Lily", "Charlotte", "Amelia", "Harper", "Evelyn", "Aria", "Layla", "Madison",
  "Scarlett", "Victoria", "Aurora", "Penelope", "Riley", "Nora", "Hazel", "Violet",
  "Aubrey", "Savannah", "Brooklyn", "Bella", "Claire", "Skylar", "Lucy", "Paisley",
  "Anna", "Caroline", "Genesis", "Emma", "Isabella", "Avery", "Ellie", "Stella",
  "Natalie", "Zoey", "Leah", "Hailey", "Audrey", "Allison", "Samantha", "Madelyn",
  "Ariana", "Nevaeh", "Serenity", "Camila", "Kennedy", "Maya", "Willow", "Kinsley",
];

function startOfHourSlot(date: Date, hour: number): Date {
  const d = new Date(date);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function pseudoRandom(seed: number): () => number {
  // Mulberry32 — deterministic PRNG so reseeding is reproducible.
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function wipe(coll: string): Promise<number> {
  const snap = await db().collection(coll).get();
  let removed = 0;
  for (let i = 0; i < snap.docs.length; i += 400) {
    const b = db().batch();
    for (const d of snap.docs.slice(i, i + 400)) b.delete(d.ref);
    await b.commit();
    removed += Math.min(400, snap.docs.length - i);
  }
  return removed;
}

async function commitInChunks(
  ops: { ref: FirebaseFirestore.DocumentReference; data: FirebaseFirestore.DocumentData }[],
): Promise<void> {
  for (let i = 0; i < ops.length; i += 400) {
    const b = db().batch();
    for (const op of ops.slice(i, i + 400)) b.set(op.ref, op.data);
    await b.commit();
  }
}

async function main() {
  console.info(`[seed] writing to project ${process.env.FIREBASE_PROJECT_ID}`);

  console.info("[seed] wiping existing studies / invitees / bibleTalks / campuses…");
  const wipedStudies = await wipe("studies");
  const wipedInvitees = await wipe("invitees");
  const wipedBts = await wipe("bibleTalks");
  const wipedCampuses = await wipe("campuses");
  console.info(
    `[seed] wiped: ${wipedCampuses} campuses, ${wipedBts} bibleTalks, ${wipedInvitees} invitees, ${wipedStudies} studies`,
  );

  const ops: { ref: FirebaseFirestore.DocumentReference; data: FirebaseFirestore.DocumentData }[] = [];

  for (const c of CAMPUSES) {
    ops.push({ ref: db().collection("campuses").doc(c.id), data: { name: c.name } });
  }
  for (const bt of BIBLE_TALKS) {
    ops.push({
      ref: db().collection("bibleTalks").doc(bt.id),
      data: {
        campusId: bt.campusId,
        name: bt.name,
        memberIds: [],
      },
    });
  }

  // Build the per-curriculum-index buckets, then assign each entry a BT
  // (round-robin within campus so every BT gets ~22 studies) and a person.
  const rand = pseudoRandom(1144); // CS 144 :)
  const totalStudies = CURRICULUM_COUNTS.reduce((a, b) => a + b, 0);
  const targetTotal = totalStudies; // 200

  // Build a flat list of curriculum indices to assign, shuffled so studies
  // of different curriculum positions are interleaved across BTs and dates.
  const curriculumQueue: number[] = [];
  for (let idx = 0; idx < CURRICULUM_COUNTS.length; idx++) {
    for (let n = 0; n < CURRICULUM_COUNTS[idx]; n++) curriculumQueue.push(idx);
  }
  // Fisher–Yates shuffle.
  for (let i = curriculumQueue.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [curriculumQueue[i], curriculumQueue[j]] = [curriculumQueue[j], curriculumQueue[i]];
  }

  // Round-robin BT assignment so every BT gets roughly the same total.
  const btOrder = BIBLE_TALKS.map((bt) => bt.id);

  // Date window: ~14 days past + ~14 days future, weighted weekday hours.
  const HOURS = [10, 13, 15, 17, 19, 20];
  // Day-of-week weights (Sun=0..Sat=6); favor Tue/Wed/Thu/Sat.
  const DOW_WEIGHTS = [1, 2, 4, 4, 4, 2, 4];

  function pickWeightedDayOffset(): number {
    // Sample uniformly over [-14, +14], then accept by DOW weight.
    // Bounded retry so a misconfigured DOW_WEIGHTS can never spin forever;
    // worst-case acceptance prob is 1/4, so 200 iterations is effectively certain.
    for (let attempts = 0; attempts < 200; attempts++) {
      const offset = Math.floor(rand() * 29) - 14; // -14..+14
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + offset);
      const w = DOW_WEIGHTS[d.getDay()];
      if (rand() * 4 < w) return offset;
    }
    return Math.floor(rand() * 29) - 14;
  }

  const LOCATIONS = [
    "Powell Library", "Ackerman Lounge", "Kerckhoff Coffeehouse", "De Neve Plaza",
    "SMC Cafeteria", "SMC Library", "Santa Monica Pier", "Bruin Plaza",
    "Boelter Hall", "Royce Quad", "John Wooden Center", "Drescher Hall",
  ];

  const now = Date.now();
  const usedInviteeIds = new Set<string>();
  let maleIdx = 0;
  let femaleIdx = 0;
  let maleCount = 0;
  let femaleCount = 0;
  // Aim for ~60% M / 40% F to give a visible split.
  const MALE_TARGET = Math.round(targetTotal * 0.6);

  for (let i = 0; i < curriculumQueue.length; i++) {
    const studyIndex = curriculumQueue[i];
    const btId = btOrder[i % btOrder.length];
    const bt = BIBLE_TALKS.find((b) => b.id === btId)!;

    let gender: Gender;
    if (maleCount < MALE_TARGET && (femaleCount >= targetTotal - MALE_TARGET || rand() < 0.6)) {
      gender = "M";
      maleCount++;
    } else {
      gender = "F";
      femaleCount++;
    }

    const namePool = gender === "M" ? MALE_NAMES : FEMALE_NAMES;
    const firstName = namePool[(gender === "M" ? maleIdx++ : femaleIdx++) % namePool.length];

    let inviteeId = `inv-${slugify(firstName)}-${i.toString(36)}`;
    while (usedInviteeIds.has(inviteeId)) inviteeId += "x";
    usedInviteeIds.add(inviteeId);

    // Schedule date.
    const dayOffset = pickWeightedDayOffset();
    const dt = new Date();
    dt.setHours(0, 0, 0, 0);
    dt.setDate(dt.getDate() + dayOffset);
    const hour = HOURS[Math.floor(rand() * HOURS.length)];
    const scheduledAt = startOfHourSlot(dt, hour).getTime();

    const status: "scheduled" | "completed" = scheduledAt < now ? "completed" : "scheduled";

    // Lead/support — first names from the pool, distinct from the invitee.
    const leadName = MALE_NAMES[Math.floor(rand() * MALE_NAMES.length)];
    const supportPool = gender === "M" ? MALE_NAMES : FEMALE_NAMES;
    const supportName = supportPool[Math.floor(rand() * supportPool.length)];

    // Invitee doc — currentStudyIndex is the *last completed* study, so we
    // set it to studyIndex - 1 so the scheduled study lands on studyIndex.
    ops.push({
      ref: db().collection("invitees").doc(inviteeId),
      data: {
        name: firstName,
        gender,
        bibleTalkId: btId,
        campusId: bt.campusId,
        currentStudyIndex: studyIndex - 1,
        linkedUserId: null,
        createdAt: now - Math.floor(rand() * 60 * 24 * 60 * 60 * 1000),
      },
    });

    const studyId = `study-${inviteeId}-${studyIndex}`;
    ops.push({
      ref: db().collection("studies").doc(studyId),
      data: {
        bibleTalkId: btId,
        campusId: bt.campusId,
        inviteeId,
        inviteeName: firstName,
        gender,
        studyName: CURRICULUM[studyIndex],
        studyIndex,
        scheduledAt,
        durationMinutes: 60,
        location: LOCATIONS[Math.floor(rand() * LOCATIONS.length)],
        leadUid: "seed-lead",
        leadName,
        supportUids: [],
        supportNames: supportName === leadName ? [] : [supportName],
        status,
        reminderSent: true,
        createdBy: "seed",
        createdAt: now,
      },
    });
  }

  console.info(`[seed] committing ${ops.length} writes…`);
  await commitInChunks(ops);

  console.info(
    `[seed] wrote ${CAMPUSES.length} campuses, ${BIBLE_TALKS.length} bibleTalks, ${targetTotal} invitees, ${targetTotal} studies`,
  );
  console.info(`[seed] gender split: ${maleCount}M / ${femaleCount}F`);
  console.info("[seed] curriculum histogram:");
  for (let i = 0; i < CURRICULUM.length; i++) {
    console.info(`  [${i}] ${CURRICULUM[i].padEnd(20)} ${CURRICULUM_COUNTS[i]}`);
  }
}

main().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});
