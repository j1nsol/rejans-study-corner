import { Link } from "react-router-dom";
import Card from "../../components/ui/Card";

const cards = [
  { to: "/admin/exams", emoji: "📚", title: "Exams", desc: "Create, edit, publish, and organize exams." },
  { to: "/admin/questions", emoji: "📝", title: "Questions", desc: "Manage the reusable question bank & CSV import." },
  { to: "/admin/results", emoji: "📊", title: "Results", desc: "See every attempt, review answers, export CSV." },
  { to: "/admin/study-buddy", emoji: "🐱", title: "Study Buddy", desc: "Set our cat's photo/GIF for each mood." },
];

export default function AdminDashboard() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {cards.map((c) => (
        <Link key={c.to} to={c.to}>
          <Card tape className="h-full transition hover:-translate-y-1 hover:shadow-soft">
            <p className="text-3xl">{c.emoji}</p>
            <p className="mt-2 font-display text-lg text-stone-700">{c.title}</p>
            <p className="text-sm text-stone-500">{c.desc}</p>
          </Card>
        </Link>
      ))}
    </div>
  );
}
