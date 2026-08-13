import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { parseCsv, csvRowsToObjects, downloadCsv, QUESTION_CSV_TEMPLATE } from "../../utils/csv";
import { validateCsvQuestionRow } from "../../utils/grading";
import { bulkUpsertQuestions, getQuestionsByIds } from "../../services/questionService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";

export default function AdminQuestionImport() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null); // { valid: [], invalid: [], existingIds: Set }
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setChecking(true);
    const text = await file.text();
    const rows = csvRowsToObjects(parseCsv(text));
    const results = rows.map((row, i) => validateCsvQuestionRow(row, i));
    const valid = results.filter((r) => r.valid);
    const invalid = results.filter((r) => !r.valid);

    // Look up which of these ids already exist so the preview can show
    // "new" vs "will update" before anything is written.
    const existing = await getQuestionsByIds(valid.map((r) => r.docId));
    const existingIds = new Set(existing.map((q) => q.id));

    setParsed({ valid, invalid, existingIds });
    setChecking(false);
  }

  async function handleConfirm() {
    if (!parsed || parsed.valid.length === 0) return;
    setSaving(true);
    try {
      const { created, updated } = await bulkUpsertQuestions(
        parsed.valid.map((r) => ({ docId: r.docId, question: r.question }))
      );
      setSaving(false);
      setToast(`Added ${created.length}, updated ${updated.length} 🎉`);
      setTimeout(() => navigate("/admin/questions"), 1200);
    } catch (err) {
      setSaving(false);
      setToast("Oops, something went wrong saving those. 🥺");
    }
  }

  const newCount = parsed ? parsed.valid.filter((r) => !parsed.existingIds.has(r.docId)).length : 0;
  const updateCount = parsed ? parsed.valid.length - newCount : 0;
  const docIdCounts = parsed
    ? parsed.valid.reduce((acc, r) => {
        acc[r.docId] = (acc[r.docId] ?? 0) + 1;
        return acc;
      }, {})
    : {};
  const duplicateInFileCount = parsed
    ? new Set(parsed.valid.filter((r) => docIdCounts[r.docId] > 1).map((r) => r.docId)).size
    : 0;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="font-display text-xl text-stone-700">Import Questions from CSV</h2>
        <Link to="/admin/questions" className="text-sm text-stone-400 underline">
          Back to Questions
        </Link>
      </div>

      <Card className="mb-6">
        <p className="mb-3 text-sm text-stone-500">
          Columns: <code className="rounded bg-stone-100 px-1">id, question, keyword, type, option_a, option_b, option_c, option_d, correct_answer, points, category, explanation, rationale_a, rationale_b, rationale_c, rationale_d</code>
        </p>
        <p className="mb-2 text-xs text-stone-400">
          type is one of <code>multiple_choice</code>, <code>true_false</code>, <code>short_answer</code>.
          For multiple choice, correct_answer is the option letter (A-D). For true/false, use True/False or A/B.
        </p>
        <p className="mb-2 text-xs text-stone-400">
          💡 <code>keyword</code> is a short topic label (e.g. "Behaviorism-based inclusive practices")
          shown above the question in the results review, to remind her what it was testing.
        </p>
        <p className="mb-2 text-xs text-stone-400">
          💡 <code>explanation</code> is the "why the correct answer is right" text. The optional
          <code> rationale_a</code>–<code>rationale_d</code> columns explain why each specific wrong
          option is wrong (the one matching correct_answer is ignored) — both show up together in
          the results review.
        </p>
        <p className="mb-4 text-xs text-stone-400">
          💡 <code>id</code> is optional but recommended — give each question a short unique key
          (e.g. <code>Q001</code>). Re-importing a file with the same ids updates those questions in
          place instead of creating duplicates. If you leave <code>id</code> blank, one is generated
          from the question text, so identical re-imports still won't duplicate — but editing the
          question text afterward will create a new entry rather than updating the old one.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            onClick={() => downloadCsv("question-template.csv", QUESTION_CSV_TEMPLATE)}
          >
            Download CSV Template
          </Button>
          <label className="focus-cute inline-flex cursor-pointer items-center rounded-full bg-blossom-400 px-5 py-2.5 font-display text-white shadow-soft hover:bg-blossom-500">
            Select CSV
            <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFile} />
          </label>
          {fileName && <span className="self-center text-sm text-stone-400">{fileName}</span>}
        </div>
      </Card>

      {checking && <p className="mb-4 text-sm text-stone-400">Checking for existing questions...</p>}

      {parsed && !checking && (
        <Card className="mb-6">
          <p className="mb-3 font-display text-lg text-stone-700">Preview</p>
          <p className="mb-4 text-sm text-stone-500">
            <span className="font-semibold text-mint-500">{newCount} new</span>
            {" · "}
            <span className="font-semibold text-lavender-500">{updateCount} will update existing</span>
            {" · "}
            <span className="font-semibold text-rose-500">{parsed.invalid.length} need fixing</span>
          </p>
          {duplicateInFileCount > 0 && (
            <p className="mb-4 rounded-xl bg-peach-100 px-3 py-2 text-xs text-peach-600">
              ⚠️ {duplicateInFileCount} id{duplicateInFileCount === 1 ? "" : "s"} appear more than
              once in this file — only the last matching row for each will be saved.
            </p>
          )}

          {parsed.valid.length > 0 && (
            <div className="mb-4 max-h-56 space-y-1 overflow-y-auto">
              {parsed.valid.map((r, i) => {
                const isUpdate = parsed.existingIds.has(r.docId);
                return (
                  <div
                    key={i}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3 py-1.5 text-sm ${
                      isUpdate ? "bg-lavender-100 text-lavender-700" : "bg-mint-100 text-emerald-800"
                    }`}
                  >
                    <span className="truncate">Row {r.rowNumber}: {r.question.question}</span>
                    <span className="shrink-0 text-xs font-semibold">
                      {isUpdate ? "update" : "new"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {parsed.invalid.length > 0 && (
            <div className="mb-4 space-y-1">
              {parsed.invalid.map((r, i) => (
                <div key={i} className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-600">
                  <span className="font-semibold">Row {r.rowNumber}:</span> {r.errors.join(" ")}
                </div>
              ))}
            </div>
          )}

          <Button onClick={handleConfirm} disabled={saving || parsed.valid.length === 0}>
            {saving ? "Saving..." : `Import ${parsed.valid.length} Question(s) ✨`}
          </Button>
        </Card>
      )}

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}