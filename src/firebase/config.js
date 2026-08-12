import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// NOTE: This app intentionally does not use Firebase Authentication or
// Firebase Storage. See README.md "Security Notes" for why, and what
// that means for how Firestore Security Rules must be written.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  // Fail loudly in dev instead of mysterious Firestore errors later.
  console.error(
    `🌸 Missing Firebase env vars: ${missing.join(", ")}. Copy .env.example to .env and fill it in.`
  );
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
