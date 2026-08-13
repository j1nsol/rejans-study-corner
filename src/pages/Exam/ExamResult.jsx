import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAttemptDetail } from "../../services/resultService";
import { getStudyBuddySettings } from "../../services/studyBuddyService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import StudyBuddy from "../../components/StudyBuddy/StudyBuddy";
import AnswerRationale from "../../components/QuestionCard/AnswerRationale";

export default function ExamResult() {
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get("attempt");
  const [detail, setDetail] = useState(null);
  const [buddy, setBuddy] = useState(null);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [d, b] = await Promise.all([
        getAttemptDetail(attemptId),
        getStudyBuddySettings(),
      ]);
      if (mounted) {
        setDetail(d);
        setBuddy(b);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [attemptId]);

  if (!detail) return <Spinner label="Tallying up your score..." />;

  const { attempt, rows } = detail;
  const passed = attempt.passed;
  const buddyState = passed ? "passed" : "tryAgain";
  const buddyImage = buddy?.images?.[buddyState] || buddy?.images?.default;

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <Card tape className="text-center">
        <StudyBuddy imageUrl={buddyImage} caption="" size="sm" className="mx-auto -mt-2 mb-3" />

        {passed ? (
          <>
            <p className="font-display text-2xl text-blossom-500">🎉 YOU DID IT! 🎉</p>
            <p className="mt-2 text-stone-600">
              {attempt.username} scored {attempt.percentage}%!
            </p>
          </>
        ) : (
          <>
            <p className="font-display text-2xl text-lavender-500">
              🌱 Keep Going, {attempt.username}!
            </p>
            <p className="mt-2 text-stone-600">You scored {attempt.percentage}%.</p>
          </>
        )}

        <p className="mt-1 font-display text-lg text-stone-500">
          {attempt.score} / {attempt.totalPoints}
        </p>

        <p
          className={`mt-3 inline-block rounded-full px-4 py-1 text-sm font-semibold ${
            passed ? "bg-mint-300 text-emerald-800" : "bg-peach-100 text-peach-600"
          }`}
        >
          {passed ? "🏆 PASSED" : "Not quite yet"}
        </p>

        {passed ? (
          <p className="mt-4 text-stone-500">
            Your study buddy is proud of you! I'm proud of you too! 💗
          </p>
        ) : (
          <p className="mt-4 text-stone-500">
            That's okay! Every mistake is something you can learn from. Let's
            learn from it and try again! 💗 Your study buddy believes in you!
          </p>
        )}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button variant="secondary" onClick={() => setShowReview((s) => !s)}>
            {showReview ? "Hide Review" : "Review Answers"}
          </Button>
          <Link to="/">
            <Button variant="ghost" className="w-full">
              Back to Study Corner
            </Button>
          </Link>
        </div>
      </Card>

      {showReview && (
        <div className="mt-6 space-y-3">
          {rows.map((r, i) => (
            <Card key={i} className={r.isCorrect ? "border-mint-300" : "border-peach-300"}>
              <p className="mb-2 text-xs font-semibold text-stone-400">
                Question {i + 1} {r.isCorrect ? "✅" : "❌"}
              </p>
              {r.keyword && (
                <p className="mb-1 font-display text-xs font-semibold uppercase tracking-wide text-lavender-400">
                  🔑 {r.keyword}
                </p>
              )}
              <p className="mb-2 whitespace-pre-line font-semibold text-stone-700">{r.question}</p>
              <p className="text-sm text-stone-500">
                Your answer: <span className="font-medium">{String(r.studentAnswer)}</span>
              </p>
              {!r.isCorrect && (
                <p className="text-sm text-mint-500">
                  Correct answer: <span className="font-medium">{String(r.correctAnswer)}</span>
                </p>
              )}
              <AnswerRationale
                type={r.type}
                options={r.options}
                correctAnswer={r.correctAnswer}
                explanation={r.explanation}
                optionRationales={r.optionRationales}
              />
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}