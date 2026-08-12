import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listAllAttempts, deleteAttempt } from "../../services/attemptService";
import { listExams } from "../../services/examService";
import { attemptsToResultsCsv } from "../../services/resultService";
import { downloadCsv } from "../../utils/csv";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Toast from "../../components/ui/Toast";

function fmtDate(ts) {
  const d = ts?.toDate?.();
  return d ? d.toLocaleString() : "—";
}

export default function AdminResults() {
  const [attempts, setAttempts] = useState(null);
  const [exams, setExams] = useState({});
  const [search, setSearch] = useState("");
  const [examFilter, setExamFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");
  const [toast, setToast] = useState("");

  async function refresh() {
    const [a, examList] = await Promise.all([listAllAttempts(), listExams()]);
    setAttempts(a);
    setExams(Object.fromEntries(examList.map((e) => [e.id, e])));
  }

  useEffect(() => {
    refresh();
  }, []);

  const visible = useMemo(() => {
    let list = (attempts ?? []).filter((a) => {
      const matchesSearch = a.username.toLowerCase().includes(search.toLowerCase());
      const matchesExam = examFilter === "all" || a.examId === examFilter;
      return matchesSearch && matchesExam;
    });
    if (sortBy === "recent") list = [...list].sort((a, b) => (b.startedAt?.seconds ?? 0) - (a.startedAt?.seconds ?? 0));
    if (sortBy === "score") list = [...list].sort((a, b) => (b.percentage ?? -1) - (a.percentage ?? -1));
    if (sortBy === "name") list = [...list].sort((a, b) => a.username.localeCompare(b.username));
    return list;
  }, [attempts, search, examFilter, sortBy]);

  async function handleDelete(a) {
    if (!confirm(`Delete ${a.username}'s attempt?`)) return;
    await deleteAttempt(a.id);
    await refresh();
    setToast("Deleted 🗑️");
  }

  function handleExport() {
    const csv = attemptsToResultsCsv(visible, exams);
    downloadCsv("results-export.csv", csv);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl text-stone-700">📊 Results</h2>
        <Button variant="secondary" onClick={handleExport} disabled={!attempts?.length}>
          Export CSV
        </Button>
      </div>

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <Input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="focus-cute rounded-2xl border border-stone-200 px-3 py-2.5 text-sm" value={examFilter} onChange={(e) => setExamFilter(e.target.value)}>
            <option value="all">All exams</option>
            {Object.values(exams).map((e) => (
              <option key={e.id} value={e.id}>{e.title}</option>
            ))}
          </select>
          <select className="focus-cute rounded-2xl border border-stone-200 px-3 py-2.5 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="recent">Most recent</option>
            <option value="score">Highest score</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>
      </Card>

      {attempts === null && <Spinner />}
      {attempts?.length === 0 && <EmptyState emoji="📊" title="No attempts yet" subtitle="Once Rejan takes an exam, results will show up here." />}

      <div className="space-y-2">
        {visible.map((a) => (
          <Card key={a.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-stone-700">
                {a.username} · {exams[a.examId]?.title ?? "Unknown exam"}
              </p>
              <p className="text-xs text-stone-400">
                {a.status === "submitted" ? (
                  <>
                    {a.percentage}% · {a.passed ? "Passed 🏆" : "Did not pass"} · {fmtDate(a.submittedAt)}
                  </>
                ) : (
                  <>In progress · started {fmtDate(a.startedAt)}</>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              {a.status === "submitted" && (
                <Link to={`/admin/results/${a.id}`}>
                  <Button variant="secondary">View</Button>
                </Link>
              )}
              <Button variant="danger" onClick={() => handleDelete(a)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
