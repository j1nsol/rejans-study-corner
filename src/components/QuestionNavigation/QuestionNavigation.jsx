export default function QuestionNavigation({ total, currentIndex, answeredSet, onJump }) {
  return (
    <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="Question navigation">
      {Array.from({ length: total }).map((_, i) => {
        const isAnswered = answeredSet.has(i);
        const isCurrent = i === currentIndex;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={isCurrent}
            aria-label={`Question ${i + 1}${isAnswered ? ", answered" : ", unanswered"}`}
            onClick={() => onJump(i)}
            className={`focus-cute flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition ${
              isCurrent
                ? "bg-blossom-400 text-white shadow-soft"
                : isAnswered
                ? "bg-mint-300 text-emerald-800"
                : "bg-stone-100 text-stone-400 hover:bg-stone-200"
            }`}
          >
            {i + 1}
          </button>
        );
      })}
    </div>
  );
}
