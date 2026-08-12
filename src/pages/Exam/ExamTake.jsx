import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getExam } from "../../services/examService";
import { getQuestionsByIds } from "../../services/questionService";
import {
  getAttempt,
  getAnswersMap,
  saveAnswer,
  submitAttempt,
} from "../../services/attemptService";
import { useCountdown } from "../../hooks/useCountdown";
import QuestionCard from "../../components/QuestionCard/QuestionCard";
import QuestionNavigation from "../../components/QuestionNavigation/QuestionNavigation";
import Timer from "../../components/Timer/Timer";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import Card from "../../components/ui/Card";

export default function ExamTake() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get("attempt");
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [index, setIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!attemptId) {
      navigate(`/exams/${id}/instructions`);
      return;
    }
    let mounted = true;
    (async () => {
      try {
        const a = await getAttempt(attemptId);
        if (!a || a.examId !== id) {
          setLoadError("This study session couldn't be found.");
          return;
        }
        if (a.status === "submitted") {
          navigate(`/exams/${id}/result?attempt=${attemptId}`);
          return;
        }
        const e = await getExam(id);
        const qs = await getQuestionsByIds(e.questionIds);
        const existingAnswers = await getAnswersMap(attemptId);
        if (!mounted) return;
        setExam(e);
        setQuestions(qs);
        setAttempt(a);
        setAnswers(existingAnswers);
      } catch (err) {
        setLoadError("Oops! Something went wrong loading your exam. 🥺");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [attemptId, id, navigate]);

  const expiresAtMs = attempt?.expiresAt?.toMillis
    ? attempt.expiresAt.toMillis()
    : attempt?.expiresAt?.seconds
    ? attempt.expiresAt.seconds * 1000
    : null;

  const handleExpire = useCallback(() => {
    if (submittedRef.current) return;
    handleSubmit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId]);

  const countdown = useCountdown(expiresAtMs ?? Date.now() + 999999, handleExpire);

  const answeredSet = useMemo(
    () => new Set(Object.keys(answers).map((qid) => questions?.findIndex((q) => q.id === qid)).filter((i) => i >= 0)),
    [answers, questions]
  );

  function handleAnswerChange(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    saveAnswer(attemptId, questionId, value).catch(() => {
      /* best-effort autosave; local state already updated */
    });
  }

  async function handleSubmit(auto = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await submitAttempt(attemptId);
      navigate(`/exams/${id}/result?attempt=${attemptId}`);
    } catch (err) {
      submittedRef.current = false;
      setSubmitting(false);
      setLoadError("Oops! We couldn't submit just now. Please try again. 🥺");
    }
  }

  if (loadError) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-lg text-stone-600">{loadError}</p>
        <Button className="mt-4" onClick={() => navigate("/")}>
          Back to Study Corner
        </Button>
      </div>
    );
  }

  if (!exam || !questions || !attempt) return <Spinner label="Setting up your exam..." />;

  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-4xl">🌱</p>
        <p className="mt-3 font-display text-lg text-stone-600">
          This exam doesn't have any questions yet.
        </p>
        <p className="mt-1 text-sm text-stone-400">
          Add some questions to it in Creator Mode, then come back and try again.
        </p>
        <Button className="mt-4" onClick={() => navigate("/")}>
          Back to Study Corner
        </Button>
      </div>
    );
  }

  const question = questions[index];
  const username = attempt.username;

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-xl text-stone-700">🌸 {exam.title}</h1>
        <Timer label={countdown.label} isLow={countdown.isLow} />
      </div>

      <Card className="mb-6">
        <QuestionCard
          question={question}
          index={index}
          total={questions.length}
          value={answers[question.id]}
          onChange={(val) => handleAnswerChange(question.id, val)}
        />
      </Card>

      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
        >
          ← Previous
        </Button>
        {index < questions.length - 1 ? (
          <Button onClick={() => setIndex((i) => Math.min(questions.length - 1, i + 1))}>
            Next →
          </Button>
        ) : (
          <Button variant="mint" onClick={() => setConfirmOpen(true)}>
            Submit ✨
          </Button>
        )}
      </div>

      <QuestionNavigation
        total={questions.length}
        currentIndex={index}
        answeredSet={answeredSet}
        onJump={setIndex}
      />

      <div className="mt-6 text-center">
        <button
          type="button"
          className="focus-cute text-sm text-stone-400 underline"
          onClick={() => setConfirmOpen(true)}
        >
          I'm Done! ✨
        </button>
      </div>

      {confirmOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-stone-900/30 px-4">
          <Card className="max-w-sm text-center">
            <p className="mb-2 font-display text-lg text-stone-700">
              Are you sure you're finished, {username}? 💗
            </p>
            <p className="mb-5 text-sm text-stone-500">
              You won't be able to change your answers after submitting.
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Go Back
              </Button>
              <Button variant="mint" onClick={() => handleSubmit(false)} disabled={submitting}>
                {submitting ? "Submitting..." : "I'm Done! ✨"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
