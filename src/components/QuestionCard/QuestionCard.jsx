export default function QuestionCard({
  question,
  index,
  total,
  value,
  onChange,
  flagged = false,
  onToggleFlag,
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-lavender-400">
          Question {index + 1} of {total}
        </p>
        {onToggleFlag && (
          <button
            type="button"
            onClick={onToggleFlag}
            aria-pressed={flagged}
            title={flagged ? "Unflag this question" : "Flag this question for review"}
            className={`focus-cute flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
              flagged
                ? "bg-amber-100 text-amber-600"
                : "bg-stone-100 text-stone-400 hover:bg-stone-200 hover:text-stone-500"
            }`}
          >
            <span aria-hidden="true">🚩</span>
            {flagged ? "Flagged" : "Flag"}
          </button>
        )}
      </div>
      <h2 className="mb-5 whitespace-pre-line font-body text-lg font-bold leading-relaxed text-stone-700">
        {question.question}
      </h2>

      {question.type === "multiple_choice" && (
        <div className="space-y-2" role="radiogroup" aria-label={question.question}>
          {question.options.map((opt, i) => {
            const letter = String.fromCharCode(65 + i);
            const selected = value === letter;
            return (
              <label
                key={letter}
                className={`focus-cute flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition ${
                  selected
                    ? "border-blossom-400 bg-blossom-50"
                    : "border-stone-200 bg-white hover:border-blossom-200"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${index}`}
                  className="h-4 w-4 accent-blossom-500"
                  checked={selected}
                  onChange={() => onChange(letter)}
                />
                <span className="text-sm font-semibold text-stone-400">{letter}</span>
                <span className="text-stone-700">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === "true_false" && (
        <div className="space-y-2" role="radiogroup" aria-label={question.question}>
          {["True", "False"].map((opt) => {
            const selected = value === opt;
            return (
              <label
                key={opt}
                className={`focus-cute flex cursor-pointer items-center gap-3 rounded-2xl border-2 px-4 py-3 transition ${
                  selected
                    ? "border-blossom-400 bg-blossom-50"
                    : "border-stone-200 bg-white hover:border-blossom-200"
                }`}
              >
                <input
                  type="radio"
                  name={`q-${index}`}
                  className="h-4 w-4 accent-blossom-500"
                  checked={selected}
                  onChange={() => onChange(opt)}
                />
                <span className="text-stone-700">{opt}</span>
              </label>
            );
          })}
        </div>
      )}

      {question.type === "short_answer" && (
        <input
          type="text"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          className="focus-cute w-full rounded-2xl border-2 border-stone-200 px-4 py-3 text-stone-700 outline-none transition focus:border-blossom-400"
        />
      )}
    </div>
  );
}