import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { getExam } from "../../services/examService";
import { startAttempt } from "../../services/attemptService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";

export default function ExamInstructions() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(undefined);
  const [error, setError] = useState("");
  const [username, setUsername] = useState(
    () => sessionStorage.getItem("rejan-username") || ""
  );
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    let mounted = true;
    getExam(id).then((e) => mounted && setExam(e));
    return () => {
      mounted = false;
    };
  }, [id]);

  if (exam === undefined) return <Spinner label="Loading exam..." />;
  if (exam === null) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="font-display text-lg text-stone-600">
          🥺 We couldn't find that exam. It may have been unpublished.
        </p>
        <Link to="/" className="mt-4 inline-block text-blossom-500 underline">
          Back to Study Corner
        </Link>
      </div>
    );
  }

  async function handleStart() {
    if (!username.trim()) {
      setError("Please enter a name so we know who's studying! 🌸");
      return;
    }
    if ((exam.questionIds?.length ?? 0) === 0) {
      setError("This exam doesn't have any questions yet — add some in Creator Mode first. 🌱");
      return;
    }
    setStarting(true);
    setError("");
    try {
      sessionStorage.setItem("rejan-username", username.trim());
      const attemptId = await startAttempt({
        examId: exam.id,
        username: username.trim(),
        durationMinutes: exam.durationMinutes,
      });
      navigate(`/exams/${exam.id}/take?attempt=${attemptId}`);
    } catch (e) {
      setError("Oops! Something went wrong starting your exam. Try again? 💗");
      setStarting(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-12">
      <Card tape>
        {!sessionStorage.getItem("rejan-username") ? (
          <div className="space-y-4 text-center">
            <p className="font-display text-xl text-stone-700">🌸 What's your name?</p>
            <Input
              label="Username"
              placeholder="Rejan"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <Button className="w-full" onClick={handleStart} disabled={starting}>
              Let's Study! 💗
            </Button>
          </div>
        ) : (
          <div className="space-y-4 text-center">
            <p className="font-display text-2xl text-blossom-500">🌸 {exam.title} 🌸</p>
            {exam.description && <p className="text-stone-500">{exam.description}</p>}
            <div className="flex justify-center gap-6 text-sm text-stone-500">
              <span>📚 {exam.questionIds?.length ?? 0} Questions</span>
              <span>⏰ {exam.durationMinutes} Minutes</span>
              <span>🏆 Passing: {exam.passingPercentage}%</span>
            </div>
            {exam.instructions && (
              <p className="whitespace-pre-line rounded-2xl bg-skycream-100 p-4 text-left text-sm text-stone-600">
                {exam.instructions}
              </p>
            )}
            <p className="text-stone-500">
              Take your time and read every question carefully.
              <br />
              You've got this, {username}! 💗
            </p>
            {error && <p className="text-sm text-rose-500">{error}</p>}
            {(exam.questionIds?.length ?? 0) === 0 ? (
              <p className="text-sm text-rose-500">
                🌱 This exam doesn't have any questions yet — add some in Creator Mode first.
              </p>
            ) : (
              <Button className="w-full" onClick={handleStart} disabled={starting}>
                {starting ? "Getting ready..." : "I'm Ready! ✨"}
              </Button>
            )}
            <button
              type="button"
              className="focus-cute text-xs text-stone-400 underline"
              onClick={() => {
                sessionStorage.removeItem("rejan-username");
                setUsername("");
              }}
            >
              Not {username}? Change name
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
