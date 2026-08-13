export default function QuestionNavigation({
  total,
  currentIndex,
  answeredSet,
  flaggedSet = new Set(),
  onJump,
}) {
  const flaggedIndices = Array.from({ length: total })
    .map((_, i) => i)
    .filter((i) => flaggedSet.has(i));

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Question navigation">
        {Array.from({ length: total }).map((_, i) => {
          const isAnswered = answeredSet.has(i);
          const isFlagged = flaggedSet.has(i);
          const isCurrent = i === currentIndex;
          return (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={isCurrent}
              aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ", unanswered"}${
                isFlagged ? ", flagged for review" : ""
              }`}
              onClick={() => onJump(i)}
              className={`focus-cute relative flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
                isCurrent
                  ? "bg-blossom-400 text-white shadow-soft"
                  : isAnswered
                  ? "bg-mint-300 text-emerald-800"
                  : "bg-stone-100 text-stone-400 hover:bg-stone-200"
              }`}
            >
              {i + 1}
              {isFlagged && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[9px] leading-none shadow-soft"
                >
                  🚩
                </span>
              )}
            </button>
          );
        })}
      </div>

      {flaggedIndices.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 rounded-2xl bg-amber-50 px-3 py-2">
          <span className="text-xs font-semibold text-amber-600">
            🚩 Flagged for review ({flaggedIndices.length}):
          </span>
          {flaggedIndices.map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => onJump(i)}
              className="focus-cute rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-amber-600 shadow-soft transition hover:-translate-y-0.5 hover:bg-amber-100"
            >
              Q{i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}