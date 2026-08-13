import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getAttemptDetail } from "../../services/resultService";
import Card from "../../components/ui/Card";
import Spinner from "../../components/ui/Spinner";
import AnswerRationale from "../../components/QuestionCard/AnswerRationale";

export default function AdminResultDetail() {
  const { id } = useParams();
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    getAttemptDetail(id).then(setDetail);
  }, [id]);

  if (!detail) return <Spinner />;
  const { attempt, exam, rows } = detail;

  return (
    <div>
      <Link to="/admin/results" className="mb-4 inline-block text-sm text-stone-400 underline">
        ← Back to Results
      </Link>

      <Card tape className="mb-6">
        <p className="font-display text-xl text-stone-700">
          {attempt.username} — {exam?.title}
        </p>
        <p className="text-sm text-stone-500">
          {attempt.percentage}% ({attempt.score}/{attempt.totalPoints}) ·{" "}
          {attempt.passed ? "Passed 🏆" : "Did not pass"}
        </p>
      </Card>

      <div className="space-y-3">
        {rows.map((r, i) => (
          <Card key={i} className={r.isCorrect ? "border-mint-300" : "border-rose-200"}>
            <p className="mb-1 text-xs font-semibold text-stone-400">
              Question {i + 1} {r.isCorrect ? "✅ Correct" : "❌ Incorrect"} · {r.pointsEarned}/{r.points} pts
            </p>
            {r.keyword && (
              <p className="mb-1 font-display text-xs font-semibold uppercase tracking-wide text-lavender-400">
                🔑 {r.keyword}
              </p>
            )}
            <p className="mb-2 whitespace-pre-line font-semibold text-stone-700">{r.question}</p>
            <p className="text-sm text-stone-500">
              {attempt.username}'s answer: <span className="font-medium">{String(r.studentAnswer)}</span>
            </p>
            <p className="text-sm text-stone-500">
              Correct answer: <span className="font-medium">{String(r.correctAnswer)}</span>
            </p>
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
    </div>
  );
}