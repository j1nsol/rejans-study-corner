import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/config";

const buddyRef = doc(db, "settings", "studyBuddy");

export const BUDDY_STATES = [
  "default",
  "studying",
  "happy",
  "celebration",
  "sleepy",
  "encouraging",
  "passed",
  "tryAgain",
];

const emptyStates = Object.fromEntries(BUDDY_STATES.map((s) => [s, ""]));

/**
 * This is a single small doc, so caching it isn't about read volume —
 * it's just consistent with the rest of the services and means Home
 * and the Study Buddy tab don't both re-fetch it on every mount.
 * Invalidated on save.
 */
let buddySettingsCache = null;

function invalidateBuddySettingsCache() {
  buddySettingsCache = null;
}

export async function getStudyBuddySettings({ force = false } = {}) {
  if (!force && buddySettingsCache) return buddySettingsCache;
  const snap = await getDoc(buddyRef);
  const settings = !snap.exists()
    ? { images: { ...emptyStates }, caption: "Your little study buddy 🐱" }
    : {
        images: { ...emptyStates, ...(snap.data().images ?? {}) },
        caption: snap.data().caption ?? "Your little study buddy 🐱",
      };
  buddySettingsCache = settings;
  return settings;
}

export async function saveStudyBuddySettings({ images, caption }) {
  await setDoc(
    buddyRef,
    { images, caption: caption ?? "Your little study buddy 🐱" },
    { merge: true }
  );
  invalidateBuddySettingsCache();
}