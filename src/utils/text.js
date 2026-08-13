/**
 * Some data sources (a CSV cell typed with a literal \n instead of an
 * actual embedded line break, text copy-pasted from a JSON export, etc.)
 * end up with the two characters backslash+n in the string rather than a
 * real newline. Real newlines display fine with `whitespace-pre-line`;
 * literal "\n" text does not — this converts the literal escape sequences
 * into actual line breaks so both sources render the same way.
 */
export function normalizeLineBreaks(value) {
  if (typeof value !== "string") return value;
  return value.replace(/\\r\\n|\\n|\\r/g, "\n");
}