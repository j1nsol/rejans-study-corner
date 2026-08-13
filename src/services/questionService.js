import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  documentId,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { normalizeLineBreaks } from "../utils/text";

const questionsCol = collection(db, "questions");

function mapDoc(d) {
  return { id: d.id, ...d.data() };
}

export async function listQuestions() {
  const snap = await getDocs(questionsCol);
  return snap.docs.map(mapDoc);
}

export async function getQuestion(id) {
  const snap = await getDoc(doc(db, "questions", id));
  if (!snap.exists()) return null;
  return mapDoc(snap);
}

/** Firestore "in" queries are capped at 30 ids, so chunk larger exams. */
export async function getQuestionsByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const chunks = [];
  for (let i = 0; i < ids.length; i += 30) chunks.push(ids.slice(i, i + 30));

  const results = await Promise.all(
    chunks.map(async (chunk) => {
      const snap = await getDocs(
        query(questionsCol, where(documentId(), "in", chunk))
      );
      return snap.docs.map(mapDoc);
    })
  );
  const flat = results.flat();
  // Preserve the exam's intended question order.
  const byId = Object.fromEntries(flat.map((q) => [q.id, q]));
  return ids.map((id) => byId[id]).filter(Boolean);
}

function cleanQuestionText(data) {
  return {
    ...data,
    question: normalizeLineBreaks(data.question),
    explanation: normalizeLineBreaks(data.explanation),
    options: Array.isArray(data.options)
      ? data.options.map((o) => normalizeLineBreaks(o))
      : data.options,
    optionRationales:
      data.optionRationales && typeof data.optionRationales === "object"
        ? Object.fromEntries(
            Object.entries(data.optionRationales).map(([letter, text]) => [
              letter,
              normalizeLineBreaks(text),
            ])
          )
        : data.optionRationales,
  };
}

export async function createQuestion(data) {
  const clean = cleanQuestionText(data);
  const ref = await addDoc(questionsCol, {
    question: clean.question ?? "",
    keyword: clean.keyword ?? "",
    type: clean.type,
    options: clean.options ?? [],
    correctAnswer: clean.correctAnswer ?? "",
    points: Number(clean.points) || 1,
    category: clean.category ?? "General",
    explanation: clean.explanation ?? "",
    optionRationales: clean.optionRationales ?? {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateQuestion(id, data) {
  await updateDoc(doc(db, "questions", id), {
    ...cleanQuestionText(data),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteQuestion(id) {
  await deleteDoc(doc(db, "questions", id));
}

export async function duplicateQuestion(id) {
  const original = await getQuestion(id);
  if (!original) throw new Error("Question not found");
  const { id: _id, createdAt, updatedAt, ...rest } = original;
  return createQuestion({ ...rest, question: `${rest.question} (Copy)` });
}

/**
 * Bulk import from validated CSV rows, upserting by docId.
 * `items` is [{ docId, question }] — docId comes from the CSV's own `id`
 * column when present, or a content-derived hash otherwise (see
 * utils/grading.js validateCsvQuestionRow). Because we use setDoc(docId)
 * instead of addDoc, importing the same row twice always lands on the
 * same document — updating it in place — instead of creating a duplicate.
 * `createdAt` is only set the first time a doc is written; re-imports only
 * touch `updatedAt` so original creation history isn't lost.
 */
export async function bulkUpsertQuestions(items) {
  const ids = items.map((i) => i.docId);
  const existing = await getQuestionsByIds(ids);
  const existingIds = new Set(existing.map((q) => q.id));

  const batch = writeBatch(db);
  const created = [];
  const updated = [];

  for (const { docId, question } of items) {
    const ref = doc(questionsCol, docId);
    const isUpdate = existingIds.has(docId);
    batch.set(
      ref,
      {
        ...cleanQuestionText(question),
        updatedAt: serverTimestamp(),
        ...(isUpdate ? {} : { createdAt: serverTimestamp() }),
      },
      { merge: true }
    );
    (isUpdate ? updated : created).push(docId);
  }

  await batch.commit();
  return { created, updated };
}