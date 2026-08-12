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

export async function getStudyBuddySettings() {
  const snap = await getDoc(buddyRef);
  if (!snap.exists()) {
    return { images: { ...emptyStates }, caption: "Your little study buddy 🐱" };
  }
  const data = snap.data();
  return {
    images: { ...emptyStates, ...(data.images ?? {}) },
    caption: data.caption ?? "Your little study buddy 🐱",
  };
}

export async function saveStudyBuddySettings({ images, caption }) {
  await setDoc(
    buddyRef,
    { images, caption: caption ?? "Your little study buddy 🐱" },
    { merge: true }
  );
}
