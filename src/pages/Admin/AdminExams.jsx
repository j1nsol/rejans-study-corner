import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  listExams,
  deleteExam,
  duplicateExam,
  setExamPublished,
} from "../../services/examService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Toast from "../../components/ui/Toast";

export default function AdminExams() {
  const [exams, setExams] = useState(null);
  const [toast, setToast] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function refresh() {
    setExams(await listExams());
  }

  useEffect(() => {
    refresh();
  }, []);

  async function handleTogglePublish(exam) {
    setBusyId(exam.id);
    await setExamPublished(exam.id, !exam.published);
    await refresh();
    setBusyId(null);
    setToast(exam.published ? "Unpublished 🌙" : "Published! Rejan can see it now 🌸");
  }

  async function handleDuplicate(exam) {
    setBusyId(exam.id);
    await duplicateExam(exam.id);
    await refresh();
    setBusyId(null);
    setToast("Duplicated ✨");
  }

  async function handleDelete(exam) {
    if (!confirm(`Delete "${exam.title}"? This can't be undone.`)) return;
    setBusyId(exam.id);
    await deleteExam(exam.id);
    await refresh();
    setBusyId(null);
    setToast("Deleted 🗑️");
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl text-stone-700">📚 Exams</h2>
        <Link to="/admin/exams/new">
          <Button>+ Create Exam</Button>
        </Link>
      </div>

      {exams === null && <Spinner />}
      {exams?.length === 0 && (
        <EmptyState
          emoji="📚"
          title="No exams yet"
          subtitle="Create your first exam to get started."
          action={
            <Link to="/admin/exams/new">
              <Button>Create Exam</Button>
            </Link>
          }
        />
      )}

      <div className="space-y-3">
        {exams?.map((exam) => (
          <Card key={exam.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg text-stone-700">{exam.title}</p>
              <p className="text-xs text-stone-400">
                {exam.questionIds?.length ?? 0} questions · {exam.durationMinutes} min ·{" "}
                {exam.published ? (
                  <span className="text-mint-500">Published</span>
                ) : (
                  <span className="text-stone-400">Draft</span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to={`/admin/exams/${exam.id}/edit`}>
                <Button variant="secondary">Edit</Button>
              </Link>
              <Button
                variant={exam.published ? "ghost" : "mint"}
                disabled={busyId === exam.id}
                onClick={() => handleTogglePublish(exam)}
              >
                {exam.published ? "Unpublish" : "Publish"}
              </Button>
              <Button variant="ghost" disabled={busyId === exam.id} onClick={() => handleDuplicate(exam)}>
                Duplicate
              </Button>
              <Button variant="danger" disabled={busyId === exam.id} onClick={() => handleDelete(exam)}>
                Delete
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
