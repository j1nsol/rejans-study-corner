import { Link } from "react-router-dom";
import Card from "../ui/Card";
import Button from "../ui/Button";

export default function ExamCard({ exam, questionCount }) {
  return (
    <Card tape className="flex flex-col gap-3 transition hover:-translate-y-1 hover:shadow-soft">
      <h3 className="font-display text-xl text-stone-700">📚 {exam.title}</h3>
      {exam.description && (
        <p className="text-sm text-stone-500">{exam.description}</p>
      )}
      <div className="flex flex-wrap gap-3 text-sm text-stone-500">
        <span>📝 {questionCount ?? exam.questionIds?.length ?? 0} Questions</span>
        <span>⏰ {exam.durationMinutes} Minutes</span>
      </div>
      <Link to={`/exams/${exam.id}/instructions`} className="mt-2">
        <Button className="w-full">Let's Study! 💗</Button>
      </Link>
    </Card>
  );
}
