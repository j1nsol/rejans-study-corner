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

  if (type === QUESTION_TYPES.MULTIPLE_CHOICE) {
    const letters = ["A", "B", "C", "D"];
    const raw = [row.option_a, row.option_b, row.option_c, row.option_d];
    options = raw
      .map((v, i) => ({ letter: letters[i], text: (v || "").trim() }))
      .filter((o) => o.text !== "");
    if (options.length < 2) {
      errors.push("Multiple choice needs at least 2 non-empty options.");
    }
    const letter = correctRaw.toUpperCase();
    if (!letters.slice(0, options.length).includes(letter)) {
      errors.push(
        `correct_answer must be one of the option letters you filled in (A-D).`
      );
    }
    correctAnswer = letter;
    options = options.map((o) => o.text);
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
    question: errors.length
      ? null
      : {
          question,
          type,
          options,
          correctAnswer,
          points,
          category,
          explanation,
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
