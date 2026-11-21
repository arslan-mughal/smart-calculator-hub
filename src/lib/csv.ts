// CSV parsing and conversion helpers for the JSON ↔ CSV converters.
// Parsing handles quoted fields (with "" escapes), commas and newlines
// inside quotes, and CRLF line endings. Everything runs in the browser.

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;
  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    pushField();
    rows.push(row);
    row = [];
  };
  while (i < text.length) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i += 1;
        }
      } else {
        field += ch;
        i += 1;
      }
    } else if (ch === '"') {
      // A quote only starts a quoted field at the start of a field.
      if (field === "") inQuotes = true;
      else field += ch;
      i += 1;
    } else if (ch === ",") {
      pushField();
      i += 1;
    } else if (ch === "\r") {
      // CRLF or lone CR ends the row; LF is consumed with it.
      if (text[i + 1] === "\n") i += 1;
      pushRow();
      i += 1;
    } else if (ch === "\n") {
      pushRow();
      i += 1;
    } else {
      field += ch;
      i += 1;
    }
  }
  // Trailing content (or a trailing comma) still forms a final row.
  if (field !== "" || row.length > 0) pushRow();
  // Drop the empty row a trailing newline leaves behind.
  while (rows.length > 0) {
    const last = rows[rows.length - 1]!;
    if (last.length === 1 && last[0] === "") rows.pop();
    else break;
  }
  return rows;
}

function csvField(value: string): string {
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvField).join(",")).join("\n");
}

function stringifyCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Convert a JSON document (array of objects, or one object) to CSV. */
export function jsonToCsv(input: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input);
  } catch {
    throw new Error("Invalid JSON — check for missing commas, quotes or brackets.");
  }
  if (Array.isArray(parsed)) {
    if (parsed.length === 0) throw new Error("The JSON array is empty — there is nothing to convert.");
    const objects = parsed.filter((item) => item !== null && typeof item === "object" && !Array.isArray(item));
    if (objects.length !== parsed.length) {
      throw new Error("Expected an array of objects (rows), e.g. [{\"name\": \"Ana\", \"age\": 30}].");
    }
    const headers: string[] = [];
    for (const obj of objects as Record<string, unknown>[]) {
      for (const key of Object.keys(obj)) if (!headers.includes(key)) headers.push(key);
    }
    const rows: string[][] = [headers];
    for (const obj of objects as Record<string, unknown>[]) {
      rows.push(headers.map((h) => stringifyCell(obj[h])));
    }
    return toCsv(rows);
  }
  if (parsed !== null && typeof parsed === "object") {
    const obj = parsed as Record<string, unknown>;
    const headers = Object.keys(obj);
    return toCsv([headers, headers.map((h) => stringifyCell(obj[h]))]);
  }
  throw new Error("Expected a JSON object or an array of objects.");
}

/** Convert CSV (first row = headers) to pretty-printed JSON. */
export function csvToJson(input: string): string {
  const rows = parseCsv(input).filter((row) => !(row.length === 1 && row[0]?.trim() === ""));
  if (rows.length === 0) throw new Error("The CSV is empty — paste some comma-separated rows first.");
  if (rows.length === 1) {
    throw new Error("Only a header row was found — add at least one data row.");
  }
  const headers = rows[0]!;
  const objects = rows.slice(1).map((row) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return obj;
  });
  return JSON.stringify(objects, null, 2);
}
