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

export async function createQuestion(data) {
  const ref = await addDoc(questionsCol, {
    question: data.question ?? "",
    type: data.type,
    options: data.options ?? [],
    correctAnswer: data.correctAnswer ?? "",
    points: Number(data.points) || 1,
    category: data.category ?? "General",
    explanation: data.explanation ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateQuestion(id, data) {
  await updateDoc(doc(db, "questions", id), {
    ...data,
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

/** Bulk import from validated CSV rows. Returns the created question ids. */
export async function bulkCreateQuestions(questions) {
  const batch = writeBatch(db);
  const ids = [];
  for (const q of questions) {
    const ref = doc(questionsCol);
    ids.push(ref.id);
    batch.set(ref, {
      ...q,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
  await batch.commit();
  return ids;
}
