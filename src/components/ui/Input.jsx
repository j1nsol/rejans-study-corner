export function Input({ label, hint, error, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label && (
        <span className="mb-1 block text-sm font-semibold text-stone-600">
          {label}
        </span>
      )}
      <input
        id={inputId}
        className={`focus-cute w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-2.5 text-stone-700 placeholder:text-stone-400 outline-none transition focus:border-lavender-400 ${className}`}
        {...props}
      />
      {hint && !error && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
    </label>
  );
}

export function Textarea({ label, hint, className = "", id, ...props }) {
  const inputId = id || props.name;
  return (
    <label className="block" htmlFor={inputId}>
      {label && (
        <span className="mb-1 block text-sm font-semibold text-stone-600">
          {label}
        </span>
      )}
      <textarea
        id={inputId}
        className={`focus-cute w-full rounded-2xl border border-stone-200 bg-white/90 px-4 py-2.5 text-stone-700 outline-none transition focus:border-lavender-400 ${className}`}
        {...props}
      />
      {hint && <span className="mt-1 block text-xs text-stone-400">{hint}</span>}
    </label>
  );
}
