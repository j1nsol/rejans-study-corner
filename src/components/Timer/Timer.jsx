export default function Timer({ label, isLow }) {
  return (
    <div
      role="timer"
      aria-live="polite"
      className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 font-display text-sm font-semibold transition-colors ${
        isLow
          ? "bg-rose-100 text-rose-600 animate-pulse"
          : "bg-lavender-100 text-lavender-600"
      }`}
    >
      ⏰ {label}
    </div>
  );
}
