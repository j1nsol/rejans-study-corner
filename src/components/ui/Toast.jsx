import { useEffect } from "react";

export default function Toast({ message, tone = "success", onClose }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;

  const tones = {
    success: "bg-mint-300 text-emerald-900",
    error: "bg-rose-200 text-rose-800",
    info: "bg-lavender-200 text-lavender-800",
  };

  return (
    <div
      role="status"
      className={`fixed bottom-5 left-1/2 z-50 -translate-x-1/2 animate-pop rounded-full px-5 py-2.5 text-sm font-semibold shadow-soft ${tones[tone]}`}
    >
      {message}
    </div>
  );
}
