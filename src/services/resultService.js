import { getAttempt, getAnswersMap } from "./attemptService";
import { getExam } from "./examService";
import { getQuestionsByIds } from "./questionService";
import { objectsToCsv } from "../utils/csv";

/** Full breakdown of one submitted attempt for the detailed admin view. */
export async function getAttemptDetail(attemptId) {
  const attempt = await getAttempt(attemptId);
  if (!attempt) return null;
  const exam = await getExam(attempt.examId);
  const orderedIds = attempt.questionOrder ?? exam?.questionIds;
  const questions = exam ? await getQuestionsByIds(orderedIds) : [];
  const answers = await getAnswersMap(attemptId);

  const rows = questions.map((q) => {
    const studentAnswer = answers[q.id];
    const isCorrect =
      studentAnswer !== undefined &&
      studentAnswer !== null &&
      studentAnswer !== "" &&
      String(studentAnswer).trim().toLowerCase() ===
        String(q.correctAnswer).trim().toLowerCase();
    return {
      question: q.question,
      keyword: q.keyword,
      type: q.type,
      options: q.options,
      studentAnswer: studentAnswer ?? "(no answer)",
      correctAnswer: q.correctAnswer,
      isCorrect,
      points: q.points,
      pointsEarned: isCorrect ? q.points : 0,
      explanation: q.explanation,
      optionRationales: q.optionRationales ?? {},
    };
  });

  return { attempt, exam, rows };
}

export function attemptsToResultsCsv(attempts, examsById) {
  const headers = [
    "username",
    "exam",
    "score",
    "totalPoints",
    "percentage",
    "passed",
    "status",
    "startedAt",
    "submittedAt",
  ];
  const rows = attempts.map((a) => ({
    username: a.username,
    exam: examsById[a.examId]?.title ?? a.examId,
    score: a.score ?? "",
    totalPoints: a.totalPoints ?? "",
    percentage: a.percentage ?? "",
    passed: a.passed === null ? "" : a.passed ? "yes" : "no",
    status: a.status,
    startedAt: a.startedAt?.toDate?.().toISOString?.() ?? "",
    submittedAt: a.submittedAt?.toDate?.().toISOString?.() ?? "",
  }));
  return objectsToCsv(rows, headers);
}