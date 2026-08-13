import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  listQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
} from "../../services/questionService";
import { QUESTION_TYPES } from "../../utils/grading";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input, Textarea } from "../../components/ui/Input";
import Spinner from "../../components/ui/Spinner";
import EmptyState from "../../components/ui/EmptyState";
import Toast from "../../components/ui/Toast";

const blankQuestion = {
  question: "",
  keyword: "",
  type: QUESTION_TYPES.MULTIPLE_CHOICE,
  options: ["", "", "", ""],
  correctAnswer: "A",
  points: 1,
  category: "General",
  explanation: "",
  optionRationales: {},
};

const LETTERS = ["A", "B", "C", "D"];

function QuestionForm({ initial, onCancel, onSaved }) {
  const [form, setForm] = useState(() => ({
    ...blankQuestion,
    ...initial,
    optionRationales: initial?.optionRationales ?? {},
  }));
  const [saving, setSaving] = useState(false);
  const [showRationale, setShowRationale] = useState(
    () => Object.values(initial?.optionRationales ?? {}).some((v) => v)
  );

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function updateOption(i, value) {
    setForm((f) => {
      const options = [...f.options];
      options[i] = value;
      return { ...f, options };
    });
  }

  function updateRationale(letter, value) {
    setForm((f) => ({
      ...f,
      optionRationales: { ...f.optionRationales, [letter]: value },
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);

    let payload = {
      ...form,
      points: Number(form.points) || 1,
    };

    if (form.type === QUESTION_TYPES.MULTIPLE_CHOICE) {
      // Filter out blank options, but re-letter everything positionally
      // (options, correctAnswer, and rationale keys together) so a gap
      // like an empty option B never causes the letter shown to the
      // student to drift from the letter used for grading/rationale.
      const filled = LETTERS.map((letter, i) => ({
        letter,
        text: form.options[i]?.trim() ?? "",
      })).filter((o) => o.text !== "");

      const oldToNewLetter = Object.fromEntries(
        filled.map((o, i) => [o.letter, LETTERS[i]])
      );

      payload.options = filled.map((o) => o.text);
      payload.correctAnswer = oldToNewLetter[form.correctAnswer] ?? filled[0]?.letter ?? "A";
      payload.optionRationales = Object.fromEntries(
        Object.entries(form.optionRationales)
          .filter(([letter, text]) => oldToNewLetter[letter] && text?.trim())
          .map(([letter, text]) => [oldToNewLetter[letter], text.trim()])
      );
    } else {
      payload.options = form.type === QUESTION_TYPES.TRUE_FALSE ? ["True", "False"] : [];
      payload.optionRationales = {};
    }

    if (form.id) {
      await updateQuestion(form.id, payload);
    } else {
      await createQuestion(payload);
    }
    setSaving(false);
    onSaved();
  }

  return (
    <Card tape className="mb-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Textarea
          label="Question text"
          rows={4}
          required
          value={form.question}
          onChange={(e) => update("question", e.target.value)}
          hint="Press Enter for a new line — line breaks are preserved wherever this question is shown (e.g. numbering I. / II. / III. on their own lines)."
        />

        <Input
          label="Keyword / topic (optional)"
          value={form.keyword}
          onChange={(e) => update("keyword", e.target.value)}
          placeholder="e.g. Behaviorism-based inclusive practices"
          hint="A short label shown in the results review to remind her what the question was testing."
        />

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm font-semibold text-stone-600">
            Type
            <select
              className="focus-cute mt-1 w-full rounded-2xl border border-stone-200 bg-white px-3 py-2.5"
              value={form.type}
              onChange={(e) => {
                const type = e.target.value;
                update("type", type);
                if (type === QUESTION_TYPES.TRUE_FALSE) {
                  update("correctAnswer", "True");
                } else if (type === QUESTION_TYPES.MULTIPLE_CHOICE) {
                  update("correctAnswer", "A");
                } else {
                  update("correctAnswer", "");
                }
              }}
            >
              <option value={QUESTION_TYPES.MULTIPLE_CHOICE}>Multiple Choice</option>
              <option value={QUESTION_TYPES.TRUE_FALSE}>True / False</option>
              <option value={QUESTION_TYPES.SHORT_ANSWER}>Short Answer</option>
            </select>
          </label>
          <Input
            label="Points"
            type="number"
            min={1}
            value={form.points}
            onChange={(e) => update("points", e.target.value)}
          />
        </div>

        {form.type === QUESTION_TYPES.MULTIPLE_CHOICE && (
          <div className="space-y-2">
            <span className="block text-sm font-semibold text-stone-600">Options</span>
            {["A", "B", "C", "D"].map((letter, i) => (
              <div key={letter} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  className="h-4 w-4 accent-blossom-500"
                  checked={form.correctAnswer === letter}
                  onChange={() => update("correctAnswer", letter)}
                />
                <span className="w-4 text-xs text-stone-400">{letter}</span>
                <Input
                  value={form.options[i] ?? ""}
                  onChange={(e) => updateOption(i, e.target.value)}
                  className="flex-1"
                  placeholder={`Option ${letter}`}
                />
              </div>
            ))}
            <p className="text-xs text-stone-400">Select the radio next to the correct option.</p>

            <button
              type="button"
              className="focus-cute text-xs font-semibold text-lavender-500 underline hover:text-lavender-600"
              onClick={() => setShowRationale((s) => !s)}
            >
              {showRationale ? "Hide" : "Add"} rationale for wrong answers (optional)
            </button>

            {showRationale && (
              <div className="space-y-2 rounded-2xl bg-lavender-50 p-3">
                <p className="text-xs text-stone-500">
                  Explain why each wrong option is wrong — shown in the results review, like
                  "B omits explicit/direct instruction, which is also a core behaviorist practice."
                  The correct option already uses the Explanation field below for its "why."
                </p>
                {LETTERS.map((letter, i) => {
                  const optionText = form.options[i]?.trim();
                  if (!optionText || form.correctAnswer === letter) return null;
                  return (
                    <Textarea
                      key={letter}
                      label={`Why ${letter} (“${optionText}”) is wrong`}
                      rows={2}
                      value={form.optionRationales?.[letter] ?? ""}
                      onChange={(e) => updateRationale(letter, e.target.value)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}

        {form.type === QUESTION_TYPES.TRUE_FALSE && (
          <div className="flex gap-4">
            {["True", "False"].map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-stone-600">
                <input
                  type="radio"
                  name="correct-tf"
                  className="h-4 w-4 accent-blossom-500"
                  checked={form.correctAnswer === opt}
                  onChange={() => update("correctAnswer", opt)}
                />
                {opt}
              </label>
            ))}
          </div>
        )}

        {form.type === QUESTION_TYPES.SHORT_ANSWER && (
          <Input
            label="Correct answer"
            value={form.correctAnswer}
            onChange={(e) => update("correctAnswer", e.target.value)}
            hint="Graded with trimmed, case-insensitive matching."
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Category"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
          />
        </div>
        <Textarea
          label="Explanation — why the correct answer is right (optional)"
          rows={2}
          value={form.explanation}
          onChange={(e) => update("explanation", e.target.value)}
        />

        <div className="flex gap-2">
          <Button type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Question ✨"}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  );
}

export default function AdminQuestions() {
  const [questions, setQuestions] = useState(null);
  const [editing, setEditing] = useState(null); // null | {} | question
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [toast, setToast] = useState("");

  async function refresh() {
    setQuestions(await listQuestions());
  }

  useEffect(() => {
    refresh();
  }, []);

  const categories = useMemo(
    () => ["all", ...new Set((questions ?? []).map((q) => q.category))],
    [questions]
  );

  const visible = useMemo(() => {
    let list = (questions ?? []).filter((q) => {
      const matchesSearch = q.question.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === "all" || q.category === categoryFilter;
      const matchesType = typeFilter === "all" || q.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    });
    if (sortBy === "alpha") list = [...list].sort((a, b) => a.question.localeCompare(b.question));
    if (sortBy === "category") list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    if (sortBy === "points") list = [...list].sort((a, b) => b.points - a.points);
    return list;
  }, [questions, search, categoryFilter, typeFilter, sortBy]);

  async function handleDelete(q) {
    if (!confirm("Delete this question from the bank?")) return;
    await deleteQuestion(q.id);
    await refresh();
    setToast("Deleted 🗑️");
  }

  async function handleDuplicate(q) {
    await duplicateQuestion(q.id);
    await refresh();
    setToast("Duplicated ✨");
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-xl text-stone-700">📝 Question Bank</h2>
        <div className="flex gap-2">
          <Link to="/admin/questions/import">
            <Button variant="secondary">Import CSV</Button>
          </Link>
          <Button onClick={() => setEditing({})}>+ New Question</Button>
        </div>
      </div>

      {editing && (
        <QuestionForm
          initial={editing.id ? editing : null}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            refresh();
            setToast("Saved ✨");
          }}
        />
      )}

      <Card className="mb-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <Input placeholder="Search questions..." value={search} onChange={(e) => setSearch(e.target.value)} />
          <select className="focus-cute rounded-2xl border border-stone-200 px-3 py-2.5 text-sm" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
            ))}
          </select>
          <select className="focus-cute rounded-2xl border border-stone-200 px-3 py-2.5 text-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value={QUESTION_TYPES.MULTIPLE_CHOICE}>Multiple Choice</option>
            <option value={QUESTION_TYPES.TRUE_FALSE}>True / False</option>
            <option value={QUESTION_TYPES.SHORT_ANSWER}>Short Answer</option>
          </select>
          <select className="focus-cute rounded-2xl border border-stone-200 px-3 py-2.5 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="newest">Newest first</option>
            <option value="alpha">A - Z</option>
            <option value="category">Category</option>
            <option value="points">Points</option>
          </select>
        </div>
      </Card>

      {questions === null && <Spinner />}
      {questions?.length === 0 && (
        <EmptyState emoji="📝" title="No questions yet" subtitle="Add one, or import a CSV of questions." />
      )}

      <div className="space-y-2">
        {visible.map((q) => (
          <Card key={q.id} className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate font-semibold text-stone-700">{q.question}</p>
              <p className="text-xs text-stone-400">
                {q.type.replace("_", " ")} · {q.points} pt{q.points === 1 ? "" : "s"} · {q.category}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" onClick={() => setEditing(q)}>Edit</Button>
              <Button variant="ghost" onClick={() => handleDuplicate(q)}>Duplicate</Button>
              <Button variant="danger" onClick={() => handleDelete(q)}>Delete</Button>
            </div>
          </Card>
        ))}
      </div>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}