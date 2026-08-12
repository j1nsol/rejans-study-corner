import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { parseCsv, csvRowsToObjects, downloadCsv, QUESTION_CSV_TEMPLATE } from "../../utils/csv";
import { validateCsvQuestionRow } from "../../utils/grading";
import { bulkCreateQuestions } from "../../services/questionService";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";

export default function AdminQuestionImport() {
  const navigate = useNavigate();
  const [fileName, setFileName] = useState("");
  const [parsed, setParsed] = useState(null); // { valid: [], invalid: [] }
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const rows = csvRowsToObjects(parseCsv(text));
    const results = rows.map((row, i) => validateCsvQuestionRow(row, i));
    setParsed({
      valid: results.filter((r) => r.valid),
      invalid: results.filter((r) => !r.valid),
    });
  }

  async function handleConfirm() {
    if (!parsed || parsed.valid.length === 0) return;
    setSaving(true);
    try {
      await bulkCreateQuestions(parsed.valid.map((r) => r.question));
      setSaving(false);
      setToast(`Imported ${parsed.valid.length} question(s) 🎉`);
      setTimeout(() => navigate("/admin/questions"), 1000);
    } catch (err) {
      setSaving(false);
      setToast("Oops, something went wrong saving those. 🥺");
    }
  }

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
          Columns: <code className="rounded bg-stone-100 px-1">question, type, option_a, option_b, option_c, option_d, correct_answer, points, category, explanation</code>
        </p>
        <p className="mb-4 text-xs text-stone-400">
          type is one of <code>multiple_choice</code>, <code>true_false</code>, <code>short_answer</code>.
          For multiple choice, correct_answer is the option letter (A-D). For true/false, use True/False or A/B.
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

      {parsed && (
        <Card className="mb-6">
          <p className="mb-3 font-display text-lg text-stone-700">Preview</p>
          <p className="mb-4 text-sm text-stone-500">
            <span className="font-semibold text-mint-500">{parsed.valid.length} valid</span>
            {" · "}
            <span className="font-semibold text-rose-500">{parsed.invalid.length} need fixing</span>
          </p>

          {parsed.valid.length > 0 && (
            <div className="mb-4 max-h-56 space-y-1 overflow-y-auto">
              {parsed.valid.map((r, i) => (
                <div key={i} className="rounded-xl bg-mint-100 px-3 py-1.5 text-sm text-emerald-800">
                  Row {r.rowNumber}: {r.question.question}
                </div>
              ))}
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
