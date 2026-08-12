import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  runTransaction,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { getQuestionsByIds } from "./questionService";
import { gradeAttempt } from "../utils/grading";

const attemptsCol = collection(db, "attempts");

function mapDoc(d) {
  return { id: d.id, ...d.data() };
}

function answersCol(attemptId) {
  return collection(db, "attempts", attemptId, "answers");
}

/**
 * Starts a new attempt. The real deadline (expiresAt) is computed once,
 * server-anchored via a client timestamp at creation, and stored in
 * Firestore — so a page refresh (or closing the tab and coming back)
 * can never grant extra time. We always recompute "time remaining" from
 * expiresAt, never from a running JS timer alone.
 */
export async function startAttempt({ examId, username, durationMinutes }) {
  const now = Date.now();
  const expiresAt = Timestamp.fromMillis(now + durationMinutes * 60 * 1000);

  const ref = doc(attemptsCol);
  await setDoc(ref, {
    username: username.trim(),
    examId,
    startedAt: Timestamp.fromMillis(now),
    expiresAt,
    submittedAt: null,
    status: "in_progress",
    score: null,
    totalPoints: null,
    percentage: null,
    passed: null,
  });
  return ref.id;
}

export async function getAttempt(attemptId) {
  const snap = await getDoc(doc(db, "attempts", attemptId));
  if (!snap.exists()) return null;
  return mapDoc(snap);
}

export async function saveAnswer(attemptId, questionId, value) {
  await setDoc(
    doc(answersCol(attemptId), questionId),
    { value, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

export async function getAnswersMap(attemptId) {
  const snap = await getDocs(answersCol(attemptId));
  const map = {};
  snap.forEach((d) => {
    map[d.id] = d.data().value;
  });
  return map;
}

/**
 * Submits + grades an attempt. Uses a transaction as a lightweight guard
 * against duplicate submissions (e.g. double-click, or the auto-submit
 * timer firing right as the student clicks Submit). Grading always uses
 * the correct answers stored in Firestore, never anything the browser
 * claims the score should be.
 */
export async function submitAttempt(attemptId) {
  const attempt = await getAttempt(attemptId);
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status === "submitted") {
    return attempt; // already graded — avoid duplicate work
  }

  const exam = await (await import("./examService")).getExam(attempt.examId);
  if (!exam) throw new Error("Exam not found");

  const questions = await getQuestionsByIds(exam.questionIds);
  const answers = await getAnswersMap(attemptId);
  const result = gradeAttempt(questions, answers, exam.passingPercentage);

  const attemptRef = doc(db, "attempts", attemptId);

  await runTransaction(db, async (tx) => {
    const fresh = await tx.get(attemptRef);
    if (!fresh.exists()) throw new Error("Attempt not found");
    if (fresh.data().status === "submitted") return; // duplicate guard
    tx.update(attemptRef, {
      status: "submitted",
      submittedAt: serverTimestamp(),
      score: result.earnedPoints,
      totalPoints: result.totalPoints,
      percentage: result.percentage,
      passed: result.passed,
      correctCount: result.correct,
      incorrectCount: result.incorrect,
      unansweredCount: result.unanswered,
    });
  });

  return { ...attempt, status: "submitted", ...result };
}

export async function listAttemptsForExam(examId) {
  const snap = await getDocs(
    query(attemptsCol, where("examId", "==", examId), orderBy("startedAt", "desc"))
  );
  return snap.docs.map(mapDoc);
}

export async function listAllAttempts() {
  const snap = await getDocs(query(attemptsCol, orderBy("startedAt", "desc")));
  return snap.docs.map(mapDoc);
}

export async function deleteAttempt(attemptId) {
  const answerSnap = await getDocs(answersCol(attemptId));
  await Promise.all(answerSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "attempts", attemptId));
}
