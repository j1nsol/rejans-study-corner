import { useCallback, useState } from "react";

const SESSION_KEY = "rejan-creator-mode";

/**
 * Extremely lightweight "Creator Mode" gate. This is a UI convenience,
 * not security — see README "Security Notes". Anyone with the PIN (or who
 * inspects the bundled env var, or who just writes to Firestore directly)
 * can access Creator Mode / Firestore. Do not treat this as protecting
 * the data, only as a casual-access speed bump for a private project.
 */
export function useCreatorMode() {
  const [unlocked, setUnlocked] = useState(
    () => sessionStorage.getItem(SESSION_KEY) === "true"
  );

  const tryUnlock = useCallback((pin) => {
    const expected = import.meta.env.VITE_ADMIN_PIN;
    const ok = expected != null && String(pin) === String(expected);
    if (ok) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setUnlocked(true);
    }
    return ok;
  }, []);

  const lock = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
  }, []);

  return { unlocked, tryUnlock, lock };
}
