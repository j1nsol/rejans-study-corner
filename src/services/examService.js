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

/**
 * In-memory cache for the two shapes listExams is called with — "all"
 * (Admin Exams / Admin Results) and "published only" (Home). Without
 * this, every tab switch back to Admin Exams re-reads the whole exams
 * collection even though exams change rarely. Invalidated by any write
 * below (create/update/delete/duplicate/publish toggle).
 */
let examsCache = { all: null, published: null };

function invalidateExamsCache() {
  examsCache = { all: null, published: null };
}

export async function listExams({ publishedOnly = false, force = false } = {}) {
  const cacheKey = publishedOnly ? "published" : "all";
  if (!force && examsCache[cacheKey]) return examsCache[cacheKey];
  const constraints = publishedOnly
    ? [where("published", "==", true), orderBy("createdAt", "desc")]
    : [orderBy("createdAt", "desc")];
  const snap = await getDocs(query(examsCol, ...constraints));
  const list = snap.docs.map(mapDoc);
  examsCache[cacheKey] = list;
  return list;
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
  invalidateExamsCache();
  return ref.id;
}

export async function updateExam(examId, data) {
  await updateDoc(doc(db, "exams", examId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
  invalidateExamsCache();
}

export async function deleteExam(examId) {
  await deleteDoc(doc(db, "exams", examId));
  invalidateExamsCache();
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