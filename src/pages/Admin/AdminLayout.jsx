import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useCreatorMode } from "../../hooks/useCreatorMode";
import Card from "../../components/ui/Card";
import Button from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

export default function AdminLayout() {
  const { unlocked, tryUnlock, lock } = useCreatorMode();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-sm items-center px-4">
        <Card tape className="w-full text-center">
          <p className="font-display text-xl text-stone-700">🌸 Creator Mode</p>
          <p className="mt-1 text-sm text-stone-400">
            This PIN is just a casual-access speed bump for our private
            project — not real security. See the README for details.
          </p>
          <form
            className="mt-4 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const ok = tryUnlock(pin);
              if (!ok) setError("That's not quite it — try again? 🌷");
              else setError("");
            }}
          >
            <Input
              label="Enter PIN"
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              autoFocus
            />
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <Button type="submit" className="w-full">
              Continue ✨
            </Button>
          </form>
          <Link to="/" className="mt-4 inline-block text-xs text-stone-400 underline">
            Back to Study Corner
          </Link>
        </Card>
      </div>
    );
  }

  const navItem = ({ isActive }) =>
    `focus-cute rounded-full px-4 py-1.5 text-sm font-semibold transition ${
      isActive ? "bg-blossom-400 text-white" : "bg-white/70 text-stone-500 hover:bg-blossom-100"
    }`;

  return (
    <div className="mx-auto max-w-4xl px-4 pb-16 pt-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl text-stone-700">🌷 Study Corner Management</h1>
        <div className="flex gap-2">
          <Link to="/" className="focus-cute rounded-full bg-white/70 px-4 py-1.5 text-sm text-stone-500 hover:bg-stone-100">
            ← Exit
          </Link>
          <Button variant="ghost" onClick={lock}>
            Lock 🔒
          </Button>
        </div>
      </div>

      <nav className="mb-8 flex flex-wrap gap-2">
        <NavLink to="/admin" end className={navItem}>
          🌷 Dashboard
        </NavLink>
        <NavLink to="/admin/exams" className={navItem}>
          📚 Exams
        </NavLink>
        <NavLink to="/admin/questions" className={navItem}>
          📝 Questions
        </NavLink>
        <NavLink to="/admin/results" className={navItem}>
          📊 Results
        </NavLink>
        <NavLink to="/admin/study-buddy" className={navItem}>
          🐱 Study Buddy
        </NavLink>
      </nav>

      <Outlet />
    </div>
  );
}
