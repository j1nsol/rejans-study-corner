/**
 * Deterministic, dependency-free string hash (djb2 variant). Not
 * cryptographic — just needs to be stable across runs so the same input
 * always produces the same id, which is what makes CSV re-imports safe
 * (same question -> same Firestore doc id -> upsert instead of duplicate).
 */
export function stableHash(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert to an unsigned base36 string for a short, doc-id-safe token.
  return (hash >>> 0).toString(36);
}

export function sanitizeDocId(raw) {
  return String(raw)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
