export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}) {
  const base =
    "focus-cute inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-display font-medium transition-all duration-150 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

  const variants = {
    primary:
      "bg-blossom-400 text-white shadow-soft hover:bg-blossom-500 hover:-translate-y-0.5",
    secondary:
      "bg-lavender-200 text-lavender-700 hover:bg-lavender-300 hover:-translate-y-0.5",
    ghost:
      "bg-white/70 text-stone-600 border border-stone-200 hover:bg-white",
    danger: "bg-rose-100 text-rose-600 hover:bg-rose-200",
    mint: "bg-mint-300 text-emerald-800 hover:bg-mint-500 hover:text-white",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
