import { sanitizeDocId, stableHash } from "./id";

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: "multiple_choice",
  TRUE_FALSE: "true_false",
  SHORT_ANSWER: "short_answer",
};

/**
 * Validates a single raw CSV row (already turned into an object by
 * csvRowsToObjects) and returns { valid, question, errors }.
 * Does not touch Firestore — pure validation so it's easy to unit test
 * and easy to extend later.
 */
export function validateCsvQuestionRow(row, index) {
  const errors = [];
  const type = (row.type || "").trim().toLowerCase();
  const question = (row.question || "").trim();
  const keyword = (row.keyword || "").trim();
  const points = Number(row.points || 1);
  const category = (row.category || "").trim() || "General";
  const explanation = (row.explanation || "").trim();
  const correctRaw = (row.correct_answer || "").trim();

  if (!question) errors.push("Question text is required.");
  if (!Object.values(QUESTION_TYPES).includes(type)) {
    errors.push(
      `Type must be one of: ${Object.values(QUESTION_TYPES).join(", ")} (got "${row.type}").`
    );
  }
  if (!Number.isFinite(points) || points <= 0) {
    errors.push("Points must be a positive number.");
  }
  if (!correctRaw) errors.push("correct_answer is required.");

  let options = [];
  let correctAnswer = correctRaw;
  let optionRationales = {};

  if (type === QUESTION_TYPES.MULTIPLE_CHOICE) {
    const letters = ["A", "B", "C", "D"];
    const raw = letters.map((letter) => ({
      letter,
      text: (row[`option_${letter.toLowerCase()}`] || "").trim(),
      rationale: (row[`rationale_${letter.toLowerCase()}`] || "").trim(),
    }));
    const nonEmpty = raw.filter((o) => o.text !== "");
    if (nonEmpty.length < 2) {
      errors.push("Multiple choice needs at least 2 non-empty options.");
    }
    // Re-letter positionally (A/B/C/... for whichever options are actually
    // filled in) so the letter shown to the student always matches the
    // letter used for grading and for looking up its rationale — even if
    // e.g. option_b was left blank and option_c wasn't.
    const originalCorrectLetter = correctRaw.toUpperCase();
    const correctIndex = nonEmpty.findIndex((o) => o.letter === originalCorrectLetter);
    if (correctIndex === -1) {
      errors.push(
        `correct_answer must be one of the option letters you filled in (A-D).`
      );
    }
    options = nonEmpty.map((o) => o.text);
    correctAnswer = correctIndex >= 0 ? letters[correctIndex] : originalCorrectLetter;
    optionRationales = Object.fromEntries(
      nonEmpty
        .map((o, i) => [letters[i], o.rationale])
        .filter(([, text]) => text !== "")
    );
  } else if (type === QUESTION_TYPES.TRUE_FALSE) {
    options = ["True", "False"];
    const letter = correctRaw.toUpperCase();
    if (!["A", "B", "TRUE", "FALSE"].includes(letter)) {
      errors.push('correct_answer must be "True"/"False" or A/B.');
    }
    correctAnswer =
      letter === "A" || letter === "TRUE" ? "True" : "False";
  } else if (type === QUESTION_TYPES.SHORT_ANSWER) {
    options = [];
    correctAnswer = correctRaw;
  }

  return {
    rowNumber: index + 2, // +2: header row + 1-indexing
    valid: errors.length === 0,
    errors,
    // If the CSV gave an explicit id, use it (so re-imports always match
    // the same row). Otherwise derive a stable id from the question's
    // content, so importing the exact same file twice upserts instead of
    // duplicating — but note editing the question text afterward will
    // change this derived id, so an explicit id column is more durable.
    docId: errors.length
      ? null
      : (() => {
          const sanitized = sanitizeDocId(row.id || "");
          return sanitized || `q-${stableHash(`${type}|${question.toLowerCase()}`)}`;
        })(),
    question: errors.length
      ? null
      : {
          question,
          keyword,
          type,
          options,
          correctAnswer,
          points,
          category,
          explanation,
          optionRationales,
        },
  };
}

function normalizeShortAnswer(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Grades one answer against a question's stored correct answer.
 * Never trust a browser-submitted "isCorrect" flag — always recompute here.
 */
export function gradeAnswer(question, studentAnswer) {
  if (studentAnswer === undefined || studentAnswer === null || studentAnswer === "") {
    return { isCorrect: false, pointsEarned: 0, answered: false };
  }

  let isCorrect = false;
  if (question.type === QUESTION_TYPES.SHORT_ANSWER) {
    isCorrect =
      normalizeShortAnswer(studentAnswer) ===
      normalizeShortAnswer(question.correctAnswer);
  } else {
    isCorrect =
      String(studentAnswer).trim().toLowerCase() ===
      String(question.correctAnswer).trim().toLowerCase();
  }

  return {
    isCorrect,
    pointsEarned: isCorrect ? question.points : 0,
    answered: true,
  };
}

/**
 * Grades a full attempt. `questions` is an array of question docs (with id),
 * `answers` is a map of questionId -> studentAnswer.
 */
export function gradeAttempt(questions, answers, passingPercentage) {
  let earnedPoints = 0;
  let totalPoints = 0;
  let correct = 0;
  let incorrect = 0;
  let unanswered = 0;

  const perQuestion = questions.map((q) => {
    totalPoints += q.points;
    const result = gradeAnswer(q, answers[q.id]);
    earnedPoints += result.pointsEarned;
    if (!result.answered) unanswered += 1;
    else if (result.isCorrect) correct += 1;
    else incorrect += 1;

    return {
      questionId: q.id,
      studentAnswer: answers[q.id] ?? null,
      correctAnswer: q.correctAnswer,
      isCorrect: result.isCorrect,
      pointsEarned: result.pointsEarned,
      pointsPossible: q.points,
    };
  });

  const percentage =
    totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 1000) / 10 : 0;

  return {
    correct,
    incorrect,
    unanswered,
    earnedPoints,
    totalPoints,
    percentage,
    passed: percentage >= (passingPercentage ?? 0),
    perQuestion,
  };
}