import { useEffect, useRef, useState } from "react";

/**
 * Counts down to a fixed point in time (expiresAtMs). Because the deadline
 * lives in Firestore (attempt.expiresAt) rather than in component state,
 * refreshing the page just re-reads the same deadline — it never resets
 * the clock or grants extra time.
 */
export function useCountdown(expiresAtMs, onExpire) {
  const [remainingMs, setRemainingMs] = useState(() =>
    Math.max(0, expiresAtMs - Date.now())
  );
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    const tick = () => {
      const remaining = Math.max(0, expiresAtMs - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0 && !firedRef.current) {
        firedRef.current = true;
        onExpire?.();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAtMs, onExpire]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    remainingMs,
    minutes,
    seconds,
    label: `${minutes}:${String(seconds).padStart(2, "0")}`,
    isLow: totalSeconds <= 60 && totalSeconds > 0,
    isExpired: remainingMs <= 0,
  };
}
