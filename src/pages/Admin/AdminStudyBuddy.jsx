import { useEffect, useState } from "react";
import {
  getStudyBuddySettings,
  saveStudyBuddySettings,
  BUDDY_STATES,
} from "../../services/studyBuddyService";
import Card from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import ImageUrlField from "../../components/StudyBuddy/ImageUrlField";
import StudyBuddy from "../../components/StudyBuddy/StudyBuddy";
import Spinner from "../../components/ui/Spinner";
import Toast from "../../components/ui/Toast";

const stateLabels = {
  default: "Default 🐱",
  studying: "Studying 📖",
  happy: "Happy 😺",
  celebration: "Celebration 🎉",
  sleepy: "Sleepy 😴",
  encouraging: "Encouraging 💪",
  passed: "Passed an exam 🏆",
  tryAgain: "Try again 🌱",
};

export default function AdminStudyBuddy() {
  const [settings, setSettings] = useState(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    getStudyBuddySettings().then(setSettings);
  }, []);

  async function persist(next) {
    setSettings(next);
    await saveStudyBuddySettings(next);
    setToast("Saved 🐾");
  }

  if (!settings) return <Spinner />;

  return (
    <div>
      <h2 className="mb-5 font-display text-xl text-stone-700">🐱 Our Study Buddy</h2>

      <Card tape className="mb-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <StudyBuddy imageUrl={settings.images.default} caption="" size="md" />
        <div className="flex-1">
          <Input
            label="Caption"
            value={settings.caption}
            onChange={(e) => persist({ ...settings, caption: e.target.value })}
            placeholder="Your little study buddy 🐱"
          />
          <p className="mt-2 text-xs text-stone-400">
            💡 Paste a direct image or GIF link (ending in .jpg, .png, .gif,
            etc) — not a page that merely contains the image. Every URL is
            previewed and only saved once it actually loads.
          </p>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        {BUDDY_STATES.map((state) => (
          <Card key={state}>
            <p className="mb-2 font-display text-sm text-stone-600">{stateLabels[state]}</p>
            <ImageUrlField
              label="Image/GIF URL"
              value={settings.images[state]}
              onChange={(url) =>
                persist({ ...settings, images: { ...settings.images, [state]: url } })
              }
            />
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-stone-400">
        If a state has no image saved, it falls back to the Default image. If
        the Default image also fails to load, a cute placeholder is shown
        instead — the rest of the app keeps working either way.
      </p>

      <Toast message={toast} onClose={() => setToast("")} />
    </div>
  );
}
