export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-stone-500">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blossom-200 border-t-blossom-500" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
