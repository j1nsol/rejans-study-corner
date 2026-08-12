import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listExams } from "../../services/examService";
import { getStudyBuddySettings } from "../../services/studyBuddyService";
import { listAllAttempts } from "../../services/attemptService";
import ExamCard from "../../components/ExamCard/ExamCard";
import StudyBuddy from "../../components/StudyBuddy/StudyBuddy";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Card from "../../components/ui/Card";

export default function Home() {
  const [exams, setExams] = useState(null);
  const [buddy, setBuddy] = useState(null);
  const [progress, setProgress] = useState(null);
  const username = sessionStorage.getItem("rejan-username");

  useEffect(() => {
    let mounted = true;
    (async () => {
      const [examList, buddySettings] = await Promise.all([
        listExams({ publishedOnly: true }),
        getStudyBuddySettings(),
      ]);
      if (!mounted) return;
      setExams(examList);
      setBuddy(buddySettings);

      if (username) {
        try {
          const attempts = (await listAllAttempts()).filter(
            (a) => a.username === username && a.status === "submitted"
          );
          const completed = attempts.length;
          const avg = completed
            ? Math.round(
                attempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / completed
              )
            : 0;
          setProgress({ completed, avg, recent: attempts.slice(0, 3) });
        } catch {
          setProgress(null);
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [username]);

  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-10">
      <header className="mb-8 text-center">
        <h1 className="font-display text-4xl font-semibold text-blossom-500 sm:text-5xl">
          🌸 Rejan's Study Corner 🌸
        </h1>
        <p className="mt-2 text-stone-500">
          {username ? `Welcome back, ${username}! ` : "Welcome to your little study space! "}
          Ready to study a little? 💗
        </p>
      </header>

      <div className="mb-10 flex justify-center">
        <StudyBuddy
          imageUrl={buddy?.images?.default}
          caption={buddy?.caption ?? '"Let\'s study together!" 💗'}
          size="lg"
        />
      </div>

      {progress && progress.completed > 0 && (
        <Card className="mb-8">
          <h2 className="mb-3 font-display text-lg text-stone-600">🌱 Your Progress</h2>
          <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-2">
            <div>
              <p className="font-display text-2xl text-blossom-500">{progress.completed}</p>
              <p className="text-xs text-stone-400">Exams Completed</p>
            </div>
            <div>
              <p className="font-display text-2xl text-blossom-500">{progress.avg}%</p>
              <p className="text-xs text-stone-400">Average Score</p>
            </div>
          </div>
        </Card>
      )}

      <h2 className="mb-4 text-center font-display text-2xl text-stone-600">
        📚 Pick Something to Practice
      </h2>

      {exams === null && <Spinner label="Fetching your exams..." />}

      {exams !== null && exams.length === 0 && (
        <EmptyState
          emoji="📚"
          title="No exams here yet"
          subtitle="Once an exam is published in Creator Mode, it'll show up here, ready to study."
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {exams?.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
      </div>

      <div className="mt-12 text-center">
        <Link
          to="/admin"
          className="focus-cute text-sm text-stone-400 underline decoration-dotted underline-offset-4 hover:text-stone-500"
        >
          ⚙️ Manage Exams
        </Link>
      </div>
    </div>
  );
}
