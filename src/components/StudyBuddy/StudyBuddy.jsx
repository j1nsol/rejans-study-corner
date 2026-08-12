import { useEffect, useState } from "react";
import { isValidHttpUrl } from "../../utils/imageValidation";

/**
 * <StudyBuddy /> — shows our cat. Always degrades gracefully:
 * loading -> success (image) or error (cute "taking a nap" fallback).
 * A broken cat URL must never break the rest of the app.
 */
export default function StudyBuddy({
  imageUrl,
  caption = "Your little study buddy 🐱",
  size = "md",
  className = "",
}) {
  const [status, setStatus] = useState(imageUrl ? "loading" : "empty");

  useEffect(() => {
    if (!imageUrl || !isValidHttpUrl(imageUrl)) {
      setStatus("empty");
      return;
    }
    setStatus("loading");
    let cancelled = false;
    const img = new Image();
    img.onload = () => !cancelled && setStatus("ready");
    img.onerror = () => !cancelled && setStatus("error");
    img.referrerPolicy = "no-referrer";
    img.src = imageUrl;
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  const sizes = {
    sm: "h-24 w-24",
    md: "h-40 w-40",
    lg: "h-56 w-56",
  };
  const boxSize = sizes[size] ?? sizes.md;

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div
        className={`relative flex ${boxSize} items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gradient-to-br from-blossom-100 via-lavender-100 to-peach-100 shadow-soft`}
      >
        <span className="washi-tape !left-1/2 !-translate-x-1/2" aria-hidden="true" />
        {status === "ready" && (
          <img
            src={imageUrl}
            alt="Our study buddy cat"
            className="h-full w-full object-cover animate-float"
            referrerPolicy="no-referrer"
          />
        )}
        {status === "loading" && (
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blossom-200 border-t-blossom-500" />
        )}
        {status === "error" && (
          <div className="flex flex-col items-center gap-1 px-3 text-center">
            <span className="text-4xl">🐱</span>
            <span className="text-[11px] leading-tight text-stone-500">
              taking a tiny nap...
            </span>
          </div>
        )}
        {status === "empty" && <span className="text-5xl animate-float">🐱</span>}
      </div>
      {caption && (
        <p className="text-center font-display text-sm text-stone-500">{caption}</p>
      )}
    </div>
  );
}
