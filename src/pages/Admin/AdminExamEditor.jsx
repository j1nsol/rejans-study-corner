import { useEffect, useRef, useState } from "react";
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
  shuffleQuestions: false,
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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [collapsed, setCollapsed] = useState(() => new Set());
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

  function setQuestionsSelected(qids, selected) {
    setForm((f) => {
      const set = new Set(f.questionIds);
      qids.forEach((qid) => (selected ? set.add(qid) : set.delete(qid)));
      // Preserve existing order, then append any newly-added ids.
      const kept = f.questionIds.filter((id) => set.has(id));
      const added = qids.filter((qid) => selected && !f.questionIds.includes(qid));
      return { ...f, questionIds: [...kept, ...added] };
    });
  }

  function toggleCategoryCollapsed(category) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
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
  function ToggleSwitch({ checked, onChange, label, id }) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-stone-600"
    >
      <span>{label}</span>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`focus-cute relative h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? "bg-blossom-500" : "bg-stone-200"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
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

  const categories = [...new Set(allQuestions.map((q) => q.category))].sort();

  const filtered = allQuestions.filter((q) => {
    const matchesSearch = q.question.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || q.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const grouped = filtered.reduce((acc, q) => {
    (acc[q.category] ??= []).push(q);
    return acc;
  }, {});
  const questionsById = Object.fromEntries(allQuestions.map((q) => [q.id, q]));
  const filteredIds = filtered.map((q) => q.id);
  const allFilteredSelected = filteredIds.length > 0 && filteredIds.every((qid) => form.questionIds.includes(qid));

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

          <ToggleSwitch
            id="shuffle-questions"
            label="Shuffle Questions"
            checked={form.shuffleQuestions}
            onChange={(val) => update("shuffleQuestions", val)}
          />

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
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-stone-700">
            Questions ({form.questionIds.length})
          </h2>
          {form.questionIds.length > 0 && (
            <button
              type="button"
              className="focus-cute text-xs text-rose-400 underline hover:text-rose-500"
              onClick={() => setForm((f) => ({ ...f, questionIds: [] }))}
            >
              Clear all
            </button>
          )}
        </div>

        {form.questionIds.length > 0 && (
          <ol className="mb-4 max-h-48 space-y-1 overflow-y-auto rounded-2xl bg-blossom-50/60 p-2 pr-1">
            {form.questionIds.map((qid, i) => {
              const q = questionsById[qid];
              if (!q) return null;
              return (
                <li
                  key={qid}
                  className="flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-1.5 text-sm shadow-sm"
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

        <div className="mb-3 grid grid-cols-2 gap-2">
          <Input
            placeholder="Search question bank..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="focus-cute rounded-2xl border border-stone-200 px-3 py-2.5 text-sm"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
          <button
            type="button"
            className="focus-cute font-semibold text-blossom-500 underline hover:text-blossom-600"
            onClick={() => setQuestionsSelected(filteredIds, !allFilteredSelected)}
          >
            {allFilteredSelected ? "Deselect" : "Select"} all {filteredIds.length} shown
          </button>
          <span className="text-stone-300">·</span>
          <span className="text-stone-400">
            Tip: narrow with search or a category first, then select-all.
          </span>
        </div>

        <div className="max-h-96 space-y-3 overflow-y-auto pr-1">
          {Object.keys(grouped).sort().map((category) => {
            const categoryQuestions = grouped[category];
            const categoryIds = categoryQuestions.map((q) => q.id);
            const selectedCount = categoryIds.filter((qid) => form.questionIds.includes(qid)).length;
            const allSelected = selectedCount === categoryIds.length;
            const someSelected = selectedCount > 0 && !allSelected;
            const isCollapsed = collapsed.has(category);

            return (
              <div key={category} className="rounded-2xl border border-stone-100">
                <div className="flex items-center gap-2 rounded-t-2xl bg-lavender-50 px-3 py-2">
                  <TriStateCheckbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onChange={() => setQuestionsSelected(categoryIds, !allSelected)}
                  />
                  <button
                    type="button"
                    className="focus-cute flex flex-1 items-center justify-between text-left"
                    onClick={() => toggleCategoryCollapsed(category)}
                  >
                    <span className="text-sm font-semibold text-lavender-600">
                      {category}
                    </span>
                    <span className="text-xs text-stone-400">
                      {selectedCount}/{categoryIds.length} selected {isCollapsed ? "▸" : "▾"}
                    </span>
                  </button>
                </div>
                {!isCollapsed && (
                  <div className="space-y-1 p-2">
                    {categoryQuestions.map((q) => {
                      const checked = form.questionIds.includes(q.id);
                      return (
                        <label
                          key={q.id}
                          className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 text-sm hover:bg-stone-50"
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 shrink-0 accent-blossom-500"
                            checked={checked}
                            onChange={() => toggleQuestion(q.id)}
                          />
                          <span className="truncate text-stone-600">{q.question}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
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