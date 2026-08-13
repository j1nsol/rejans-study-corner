import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { getExam } from "../../services/examService";
import { getQuestionsByIds } from "../../services/questionService";
import {
  getAttempt,
  getAnswersFull,
  saveAnswer,
  setAnswerFlag,
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
  const [flagged, setFlagged] = useState(new Set());
  const [index, setIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const submittedRef = useRef(false);
  const pendingAnswerRef = useRef(null);

  /**
   * Answers now save to Firestore when the student leaves a question
   * (Next/Previous/jump/Submit) instead of on every click — a multiple
   * choice question the student clicks through 3 times before settling
   * used to be 3 writes; now it's 1. Local state still updates instantly
   * so the UI never feels laggy. This effect is a safety net for the
   * case where they navigate away without using any of those controls
   * (e.g. closing the tab) — same best-effort semantics as before, it
   * just runs on unmount instead of on every keystroke.
   */
  useEffect(() => {
    return () => {
      flushPendingAnswer();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        const orderedIds = a.questionOrder ?? e.questionIds;
        const qs = await getQuestionsByIds(orderedIds);
        const existingAnswers = await getAnswersFull(attemptId);
        if (!mounted) return;
        const values = {};
        const flaggedIds = new Set();
        for (const [qid, data] of Object.entries(existingAnswers)) {
          values[qid] = data.value;
          if (data.flagged) flaggedIds.add(qid);
        }
        setExam(e);
        setQuestions(qs);
        setAttempt(a);
        setAnswers(values);
        setFlagged(flaggedIds);
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

  const flaggedSet = useMemo(
    () =>
      new Set(
        Array.from(flagged)
          .map((qid) => questions?.findIndex((q) => q.id === qid))
          .filter((i) => i >= 0)
      ),
    [flagged, questions]
  );

  function handleAnswerChange(questionId, value) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    pendingAnswerRef.current = { questionId, value };
  }

  /** Writes whatever answer is pending (if any) and clears it. Safe to
   * call even when there's nothing pending. Used by navigation, Submit,
   * and the unmount safety-net effect above — never called on every
   * keystroke/click. */
  function flushPendingAnswer() {
    const pending = pendingAnswerRef.current;
    if (!pending) return Promise.resolve();
    pendingAnswerRef.current = null;
    return saveAnswer(attemptId, pending.questionId, pending.value).catch(() => {
      /* best-effort autosave; local state already updated */
    });
  }

  /** Use this instead of setIndex directly anywhere the student is
   * leaving the current question — flushes that question's answer
   * first so it's never left un-persisted. */
  function goToIndex(nextIndex) {
    flushPendingAnswer();
    setIndex(nextIndex);
  }

  function handleToggleFlag(questionId) {
    setFlagged((prev) => {
      const next = new Set(prev);
      const isFlagged = next.has(questionId);
      if (isFlagged) next.delete(questionId);
      else next.add(questionId);
      setAnswerFlag(attemptId, questionId, !isFlagged).catch(() => {
        /* best-effort; local state already updated */
      });
      return next;
    });
  }

  async function handleSubmit(auto = false) {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await flushPendingAnswer();
      await submitAttempt(attemptId, questions);
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
          flagged={flagged.has(question.id)}
          onToggleFlag={() => handleToggleFlag(question.id)}
        />
      </Card>

      <div className="mb-6 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => goToIndex(Math.max(0, index - 1))}
          disabled={index === 0}
        >
          ← Previous
        </Button>
        {index < questions.length - 1 ? (
          <Button onClick={() => goToIndex(Math.min(questions.length - 1, index + 1))}>
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
        flaggedSet={flaggedSet}
        onJump={goToIndex}
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
            {flaggedSet.size > 0 && (
              <p className="mb-5 rounded-2xl bg-amber-50 px-4 py-2 text-sm text-amber-600">
                🚩 You still have {flaggedSet.size} question{flaggedSet.size > 1 ? "s" : ""} flagged
                for review.
              </p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Go Back
              </Button>
              {flaggedSet.size > 0 && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setConfirmOpen(false);
                    goToIndex(Math.min(...flaggedSet));
                  }}
                >
                  Review Flagged
                </Button>
              )}
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