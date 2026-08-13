/**
 * Renders the "✓ Correct Answer: A / Why: ... " + "✗ Why the other options
 * are wrong" breakdown, matching the rationale format from Rejan's study
 * document. Only shows what's actually filled in — an explanation with no
 * rationale, or vice versa, still renders cleanly.
 */
export default function AnswerRationale({ type, options, correctAnswer, explanation, optionRationales }) {
  const hasExplanation = Boolean(explanation?.trim());
  const wrongEntries =
    type === "multiple_choice" && options
      ? options
          .map((text, i) => ({ letter: String.fromCharCode(65 + i), text }))
          .filter((o) => o.letter !== correctAnswer && optionRationales?.[o.letter]?.trim())
      : [];

  if (!hasExplanation && wrongEntries.length === 0) return null;

  return (
    <div className="mt-2 space-y-2 rounded-xl bg-skycream-100 p-3 text-xs">
      {hasExplanation && (
        <p className="text-stone-600">
          <span className="font-semibold text-mint-500">✓ Correct Answer: {correctAnswer}.</span>{" "}
          <span className="whitespace-pre-line">{explanation}</span>
        </p>
      )}
      {wrongEntries.length > 0 && (
        <div>
          <p className="mb-1 font-semibold text-rose-500">✗ Why the other options are wrong:</p>
          <ul className="space-y-1">
            {wrongEntries.map((o) => (
              <li key={o.letter} className="whitespace-pre-line text-stone-600">
                <span className="font-semibold">{o.letter}.</span> {optionRationales[o.letter]}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}