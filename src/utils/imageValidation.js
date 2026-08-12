/**
 * Safe external image/GIF loading helpers.
 *
 * We never upload or store media ourselves (no Firebase Storage). Instead
 * Rejan's boyfriend pastes a direct image/GIF URL, and we verify the browser
 * can actually load it as an image before we let it be saved, and we fall
 * back gracefully any time it stops working later.
 */

export function isValidHttpUrl(value) {
  if (!value || typeof value !== "string") return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Attempts to load a URL as an image in-memory. Resolves true/false —
 * never throws — so callers can always show a friendly result.
 */
export function testImageLoads(url, timeoutMs = 8000) {
  return new Promise((resolve) => {
    if (!isValidHttpUrl(url)) {
      resolve(false);
      return;
    }

    const img = new Image();
    let settled = false;

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      img.onload = null;
      img.onerror = null;
      resolve(ok);
    };

    const timer = setTimeout(() => finish(false), timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      finish(true);
    };
    img.onerror = () => {
      clearTimeout(timer);
      finish(false);
    };

    img.referrerPolicy = "no-referrer";
    img.src = url.trim();
  });
}
