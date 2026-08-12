import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getExam, createExam, updateExam } from "../../services/examService";
import { listQuestions } from "../../services/questionService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import Toast from "../../components/ui/Toast";

const emptyExam = {
  title: "",
  description: "",
  instructions: "",
  durationMinutes: 30,
  passingPercentage: 75,
  published: false,
  questionIds: [],
};

/** Checkbox that can show a dash (indeterminate) when only some items in a
 * group are selected — React doesn't expose `indeterminate` as a prop, so
 * it has to be set imperatively via a ref. */
function TriStateCheckbox({ checked, indeterminate, onChange, className = "" }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      className={`h-4 w-4 accent-blossom-500 ${className}`}
      checked={checked}
      onChange={onChange}
    />
  );
}

export default function AdminExamEditor() {
  const { id } = useParams();
  const isNew = id === "new" || !id;
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyExam);
  const [allQuestions, setAllQuestions] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      const questions = await listQuestions();
      setAllQuestions(questions);
      if (!isNew) {
        const exam = await getExam(id);
        if (exam) setForm({ ...emptyExam, ...exam });
      }
    })();
  }, [id, isNew]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function toggleQuestion(qid) {
    setForm((f) => {
      const has = f.questionIds.includes(qid);
      return {
        ...f,
        questionIds: has
          ? f.questionIds.filter((x) => x !== qid)
          : [...f.questionIds, qid],
      };
    });
  }

  function moveQuestion(qid, dir) {
    setForm((f) => {
      const ids = [...f.questionIds];
      const i = ids.indexOf(qid);
      const j = i + dir;
      if (j < 0 || j >= ids.length) return f;
      [ids[i], ids[j]] = [ids[j], ids[i]];
      return { ...f, questionIds: ids };
    });
  }

  async function handleSave(publishOverride) {
    if (!form.title.trim()) {
      setToast("Give your exam a title first! 🌷");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      published: publishOverride ?? form.published,
    };
    if (isNew) {
      const newId = await createExam(payload);
      setSaving(false);
      navigate(`/admin/exams/${newId}/edit`);
    } else {
      await updateExam(id, payload);
      setSaving(false);
      setToast("Saved ✨");
    }
  }

  if (allQuestions === null) return <Spinner />;

  const filtered = allQuestions.filter((q) =>
    q.question.toLowerCase().includes(search.toLowerCase())
  );
  const questionsById = Object.fromEntries(allQuestions.map((q) => [q.id, q]));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <h2 className="mb-4 font-display text-lg text-stone-700">
          {isNew ? "Create Exam" : "Edit Exam"}
        </h2>
        <div className="space-y-4">
          <Input
            label="Exam Title"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            placeholder="Biology Chapter 1"
          />
          <Textarea
            label="Description"
            rows={2}
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            placeholder="Practice exam for Chapter 1"
          />
          <Textarea
            label="Instructions"
            rows={3}
            value={form.instructions}
            onChange={(e) => update("instructions", e.target.value)}
            placeholder="Anything Rejan should know before starting."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Duration (minutes)"
              type="number"
              min={1}
              value={form.durationMinutes}
              onChange={(e) => update("durationMinutes", e.target.value)}
            />
            <Input
              label="Passing Score (%)"
              type="number"
              min={0}
              max={100}
              value={form.passingPercentage}
              onChange={(e) => update("passingPercentage", e.target.value)}
            />
          </div>
          <label className="flex items-center gap-2 text-sm font-semibold text-stone-600">
            <input
              type="checkbox"
              className="h-4 w-4 accent-blossom-500"
              checked={form.published}
              onChange={(e) => update("published", e.target.checked)}
            />
            Published
          </label>

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={() => handleSave()} disabled={saving}>
              {saving ? "Saving..." : "Save Exam ✨"}
            </Button>
            {isNew ? null : (
              <Button
                variant="mint"
                onClick={() => handleSave(true)}
                disabled={saving}
              >
                Save & Publish
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="mb-3 font-display text-lg text-stone-700">
          Questions ({form.questionIds.length})
        </h2>

        {form.questionIds.length > 0 && (
          <ol className="mb-4 space-y-1">
            {form.questionIds.map((qid, i) => {
              const q = questionsById[qid];
              if (!q) return null;
              return (
                <li
                  key={qid}
                  className="flex items-center justify-between gap-2 rounded-xl bg-blossom-50 px-3 py-1.5 text-sm"
                >
                  <span className="truncate text-stone-600">
                    {i + 1}. {q.question}
                  </span>
                  <span className="flex shrink-0 gap-1">
                    <button className="focus-cute text-stone-400 hover:text-stone-600" onClick={() => moveQuestion(qid, -1)}>↑</button>
                    <button className="focus-cute text-stone-400 hover:text-stone-600" onClick={() => moveQuestion(qid, 1)}>↓</button>
                    <button className="focus-cute text-rose-400 hover:text-rose-600" onClick={() => toggleQuestion(qid)}>✕</button>
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <Input
          placeholder="Search question bank..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />

        <div className="max-h-80 space-y-1 overflow-y-auto pr-1">
          {filtered.map((q) => {
            const checked = form.questionIds.includes(q.id);
            return (
              <label
                key={q.id}
                className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-stone-50"
              >
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-blossom-500"
                  checked={checked}
                  onChange={() => toggleQuestion(q.id)}
                />
                <span className="truncate text-stone-600">{q.question}</span>
                <span className="ml-auto shrink-0 rounded-full bg-lavender-100 px-2 py-0.5 text-[10px] text-lavender-500">
                  {q.category}
                </span>
              </label>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-4 text-center text-sm text-stone-400">No matching questions.</p>
          )}
        </div>
      </Card>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}