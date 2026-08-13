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
import { shuffleArray } from "../utils/shuffle";

const attemptsCol = collection(db, "attempts");

function mapDoc(d) {
  return { id: d.id, ...d.data() };
}

function answersCol(attemptId) {
  return collection(db, "attempts", attemptId, "answers");
}

/**
 * In-memory cache for the two full-collection-ish attempt reads: the
 * admin's "all attempts" list and each student's "my attempts" list.
 * Without this, switching to Admin Results (or revisiting Home) re-reads
 * every matching attempt doc each time, even if nothing changed since
 * the last visit. Invalidated by any write that changes what those
 * lists would show (start/submit/delete) — but NOT by advanceFlashQuestion,
 * which only touches currentIndex/questionStartedAt, fields neither list
 * displays, and which fires once per question on a timer, so keeping it
 * cheap matters more than keeping the cache perfectly fresh for those.
 */
let attemptsCache = { all: null, byUser: new Map() };

function invalidateAttemptsCache() {
  attemptsCache = { all: null, byUser: new Map() };
}

/**
 * Starts a new attempt. The real deadline (expiresAt) is computed once,
 * server-anchored via a client timestamp at creation, and stored in
 * Firestore — so a page refresh (or closing the tab and coming back)
 * can never grant extra time. We always recompute "time remaining" from
 * expiresAt, never from a running JS timer alone.
 *
 * If the exam has shuffleQuestions on, we shuffle the question order once
 * here and store it as questionOrder on the attempt — so the order is
 * randomized fresh on every new attempt (every retake), but stays fixed
 * for the lifetime of *this* attempt (a refresh or resumed session won't
 * reshuffle mid-exam).
 *
 * Flash Quiz Mode: the student can opt in on the instructions screen and
 * choose their own per-question time limit (secondsPerQuestion). When
 * mode is "flash" we also stamp currentIndex (0) and questionStartedAt —
 * a Firestore-anchored clock for the *current* question, exactly like
 * expiresAt is for the whole exam, so a refresh mid-question can't buy
 * extra time or let the student sneak back to a previous question. The
 * overall exam expiresAt is still set as a final safety-net auto-submit.
 */
export async function startAttempt({
  examId,
  username,
  durationMinutes,
  questionIds,
  shuffleQuestions,
  mode = "standard",
  secondsPerQuestion,
}) {
  const now = Date.now();
  const expiresAt = Timestamp.fromMillis(now + durationMinutes * 60 * 1000);
  const questionOrder = shuffleQuestions
    ? shuffleArray(questionIds ?? [])
    : questionIds ?? [];

  const isFlash = mode === "flash" && Number(secondsPerQuestion) > 0;

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
    autoSubmitted: null,
    questionOrder,
    mode: isFlash ? "flash" : "standard",
    ...(isFlash
      ? {
          secondsPerQuestion: Math.round(Number(secondsPerQuestion)),
          currentIndex: 0,
          questionStartedAt: Timestamp.fromMillis(now),
        }
      : {}),
  });
  invalidateAttemptsCache();
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
 * Like getAnswersMap, but returns the full answer doc (value + flagged)
 * per question instead of just the value. Used by the exam-taking screen
 * so "flag for review" state survives a refresh or a resumed attempt.
 * Grading (submitAttempt) intentionally keeps using the plain getAnswersMap
 * above, since flags never affect scoring.
 */
export async function getAnswersFull(attemptId) {
  const snap = await getDocs(answersCol(attemptId));
  const map = {};
  snap.forEach((d) => {
    map[d.id] = d.data();
  });
  return map;
}

export async function setAnswerFlag(attemptId, questionId, flagged) {
  await setDoc(
    doc(answersCol(attemptId), questionId),
    { flagged, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Submits + grades an attempt. Uses a transaction as a lightweight guard
 * against duplicate submissions (e.g. double-click, or the auto-submit
 * timer firing right as the student clicks Submit). Grading always uses
 * the correct answers stored in Firestore, never anything the browser
 * claims the *score* should be — but as of this version we trust the
 * question docs (with correctAnswer) already loaded by ExamTake instead
 * of re-fetching them here, since they were already sent to the browser
 * at load time anyway (no real security boundary there — see
 * firestore.rules) and this app has exactly one person taking exams and
 * one person editing the question bank, who can just not do both at once.
 * Pass `questions` (the array ExamTake already has in state) to skip the
 * second full re-fetch; omit it and this falls back to fetching fresh,
 * e.g. for any future caller that doesn't already have them loaded.
 *
 * Grading only ever looks at what's actually saved in the answers
 * subcollection — an unanswered question (nothing saved, e.g. the
 * student never picked a choice before the timer forced a submit) is
 * simply absent from that map and gradeAttempt counts it as unanswered.
 * Nothing here blocks or requires a full set of answers before allowing
 * a submit.
 *
 * `options.auto` records *why* the attempt was submitted — true when
 * the overall exam timer or a Flash Quiz Mode per-question timer forced
 * it, false (default) when the student clicked a submit button
 * themselves. Purely informational (e.g. for showing "time ran out" on
 * the results page); it never affects grading.
 */
export async function submitAttempt(attemptId, questions, { auto = false } = {}) {
  const attempt = await getAttempt(attemptId);
  if (!attempt) throw new Error("Attempt not found");
  if (attempt.status === "submitted") {
    return attempt; // already graded — avoid duplicate work
  }

  const exam = await (await import("./examService")).getExam(attempt.examId);
  if (!exam) throw new Error("Exam not found");

  const orderedIds = attempt.questionOrder ?? exam.questionIds;
  const orderedQuestions = questions ?? (await getQuestionsByIds(orderedIds));
  const answers = await getAnswersMap(attemptId);
  const result = gradeAttempt(orderedQuestions, answers, exam.passingPercentage);

  const attemptRef = doc(db, "attempts", attemptId);

  await runTransaction(db, async (tx) => {
    const fresh = await tx.get(attemptRef);
    if (!fresh.exists()) throw new Error("Attempt not found");
    if (fresh.data().status === "submitted") return; // duplicate guard
    tx.update(attemptRef, {
      status: "submitted",
      submittedAt: serverTimestamp(),
      autoSubmitted: auto,
      score: result.earnedPoints,
      totalPoints: result.totalPoints,
      percentage: result.percentage,
      passed: result.passed,
      correctCount: result.correct,
      incorrectCount: result.incorrect,
      unansweredCount: result.unanswered,
    });
  });

  invalidateAttemptsCache();
  return { ...attempt, status: "submitted", autoSubmitted: auto, ...result };
}

/**
 * Advances a Flash Quiz Mode attempt to the next question. This is a
 * plain merge write, not a transaction — transactions do an extra read
 * (tx.get) and silently retry on any write conflict, and combined with
 * a fast per-question timer that can mean a burst of Firestore requests
 * in a short window (and a 429 rate-limit response). This app has no
 * real auth/security boundary anyway (see firestore.rules), so a plain
 * write is the right trade-off here: cheap, and "no going back" is
 * already enforced client-side (we only ever call this with the next
 * sequential index, guarded against duplicate calls — see ExamTake.jsx)
 * and re-enforced on load (a refresh resumes from whatever currentIndex
 * is stored in Firestore, never an earlier one).
 *
 * Deliberately does NOT invalidate the attempts cache — see the comment
 * on attemptsCache above.
 */
export async function advanceFlashQuestion(attemptId, toIndex) {
  await setDoc(
    doc(db, "attempts", attemptId),
    { currentIndex: toIndex, questionStartedAt: Timestamp.fromMillis(Date.now()) },
    { merge: true }
  );
}

export async function listAttemptsForExam(examId) {
  const snap = await getDocs(
    query(attemptsCol, where("examId", "==", examId), orderBy("startedAt", "desc"))
  );
  return snap.docs.map(mapDoc);
}

export async function listAttemptsForUser(username, { force = false } = {}) {
  if (!force && attemptsCache.byUser.has(username)) {
    return attemptsCache.byUser.get(username);
  }
  const snap = await getDocs(
    query(attemptsCol, where("username", "==", username), orderBy("startedAt", "desc"))
  );
  const list = snap.docs.map(mapDoc);
  attemptsCache.byUser.set(username, list);
  return list;
}

export async function listAllAttempts({ force = false } = {}) {
  if (!force && attemptsCache.all) return attemptsCache.all;
  const snap = await getDocs(query(attemptsCol, orderBy("startedAt", "desc")));
  const list = snap.docs.map(mapDoc);
  attemptsCache.all = list;
  return list;
}

export async function deleteAttempt(attemptId) {
  const answerSnap = await getDocs(answersCol(attemptId));
  await Promise.all(answerSnap.docs.map((d) => deleteDoc(d.ref)));
  await deleteDoc(doc(db, "attempts", attemptId));
  invalidateAttemptsCache();
}