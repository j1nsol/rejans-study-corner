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
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";

const examsCol = collection(db, "exams");

function mapDoc(d) {
  return { id: d.id, ...d.data() };
}

export async function listExams({ publishedOnly = false } = {}) {
  const constraints = publishedOnly
    ? [where("published", "==", true), orderBy("createdAt", "desc")]
    : [orderBy("createdAt", "desc")];
  const snap = await getDocs(query(examsCol, ...constraints));
  return snap.docs.map(mapDoc);
}

export async function getExam(examId) {
  const snap = await getDoc(doc(db, "exams", examId));
  if (!snap.exists()) return null;
  return mapDoc(snap);
}

export async function createExam(data) {
  const ref = await addDoc(examsCol, {
    title: data.title ?? "",
    description: data.description ?? "",
    instructions: data.instructions ?? "",
    durationMinutes: Number(data.durationMinutes) || 30,
    passingPercentage: Number(data.passingPercentage) || 70,
    published: Boolean(data.published) || false,
    shuffleQuestions: Boolean(data.shuffleQuestions) || false,
    questionIds: data.questionIds ?? [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateExam(examId, data) {
  await updateDoc(doc(db, "exams", examId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteExam(examId) {
  await deleteDoc(doc(db, "exams", examId));
}

export async function duplicateExam(examId) {
  const original = await getExam(examId);
  if (!original) throw new Error("Exam not found");
  const { id, createdAt, updatedAt, ...rest } = original;
  return createExam({
    ...rest,
    title: `${rest.title} (Copy)`,
    published: false,
  });
}

export async function setExamPublished(examId, published) {
  await updateExam(examId, { published });
}