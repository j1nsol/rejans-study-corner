import { useState } from "react";
import { Input } from "../ui/Input";
import Button from "../ui/Button";
import { isValidHttpUrl, testImageLoads } from "../../utils/imageValidation";

/**
 * Lets the creator paste a direct image/GIF URL, preview it, and only
 * confirm it into `value` once it has actually loaded — per spec #22,
 * we never silently save a broken URL.
 */
export default function ImageUrlField({ label, value, onChange }) {
  const [draft, setDraft] = useState(value || "");
  const [status, setStatus] = useState("idle"); // idle | checking | ok | fail
  const [previewUrl, setPreviewUrl] = useState(null);

  async function handlePreview() {
    if (!isValidHttpUrl(draft)) {
      setStatus("fail");
      setPreviewUrl(null);
      return;
    }
    setStatus("checking");
    const ok = await testImageLoads(draft);
    setStatus(ok ? "ok" : "fail");
    setPreviewUrl(ok ? draft : null);
  }

  function handleConfirm() {
    if (status === "ok" && previewUrl) {
      onChange(previewUrl);
    }
  }

  function handleClear() {
    setDraft("");
    setStatus("idle");
    setPreviewUrl(null);
    onChange("");
  }

  return (
    <div className="space-y-2">
      <Input
        label={label}
        placeholder="https://example.com/cute-cat.gif"
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          setStatus("idle");
        }}
        hint="Tip: use the direct link to the image/GIF, not the webpage it's on."
      />
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="secondary"
          onClick={handlePreview}
          disabled={!draft || status === "checking"}
        >
          {status === "checking" ? "Checking..." : "Preview"}
        </Button>
        <Button
          type="button"
          variant="mint"
          onClick={handleConfirm}
          disabled={status !== "ok"}
        >
          Save 🐾
        </Button>
        {value && (
          <Button type="button" variant="ghost" onClick={handleClear}>
            Remove
          </Button>
        )}
        {value && value !== draft && (
          <span className="text-xs text-stone-400">Currently saved ✓</span>
        )}
      </div>

      {status === "fail" && (
        <p className="text-sm text-rose-500">
          🥺 We couldn't load that image. Try copying the direct image URL
          instead (it should end in something like .jpg, .png, or .gif).
        </p>
      )}

      {status === "ok" && previewUrl && (
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-mint-300 bg-mint-100">
          <img
            src={previewUrl}
            alt="Preview"
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
      )}
    </div>
  );
}
