// Small dependency-free CSV parser/writer. Good enough for question-bank
// imports and result exports; not meant to handle every RFC 4180 edge case,
// but does handle quoted fields with commas/newlines.

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // skip, handled by \n
    } else {
      field += char;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

export function csvRowsToObjects(rows) {
  if (!rows.length) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = (r[i] ?? "").trim();
    });
    return obj;
  });
}

function escapeCsvCell(value) {
  const str = String(value ?? "");
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function objectsToCsv(rows, headers) {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escapeCsvCell(row[h])).join(","));
  }
  return lines.join("\n");
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const QUESTION_CSV_HEADERS = [
  "id",
  "question",
  "keyword",
  "type",
  "option_a",
  "option_b",
  "option_c",
  "option_d",
  "correct_answer",
  "points",
  "category",
  "explanation",
  "rationale_a",
  "rationale_b",
  "rationale_c",
  "rationale_d",
];

export const QUESTION_CSV_TEMPLATE = [
  QUESTION_CSV_HEADERS.join(","),
  'Q001,What is 2 + 2?,Basic addition,multiple_choice,3,4,5,6,B,1,Math,2 + 2 equals 4.,,,,',
  'Q002,The Earth revolves around the Sun.,Heliocentrism,true_false,True,False,,,A,1,Science,,,,,',
  'Q003,What is the chemical symbol for water?,Chemical formulas,short_answer,,,,,H2O,1,Chemistry,,,,,',
  'Q004,Which are examples of X?,Behaviorism-based inclusive practices,multiple_choice,"I, II and III","I and II","II and III","I and II (again)",A,1,Teaching,"I II and III are all examples of X.","B omits III, which is also valid.","C omits I, the core requirement.","D repeats I and II and omits III."',
].join("\n");