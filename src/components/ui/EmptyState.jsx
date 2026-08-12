export default function EmptyState({ emoji = "🌱", title, subtitle, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-cute border-2 border-dashed border-blossom-200 bg-white/50 py-14 text-center">
      <span className="text-4xl">{emoji}</span>
      <p className="font-display text-lg text-stone-600">{title}</p>
      {subtitle && <p className="max-w-sm text-sm text-stone-400">{subtitle}</p>}
      {action}
    </div>
  );
}
