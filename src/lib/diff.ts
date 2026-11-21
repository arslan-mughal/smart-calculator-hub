// Line-based text diff (longest common subsequence) for the Diff Checker.
// Small inputs only — the component caps the input — so the O(n·m) table
// is fine. Everything runs in the browser.

export type DiffLine = { type: "same" | "add" | "del"; text: string };

/** Split text into lines, keeping behaviour identical for both sides. */
export function splitLines(text: string): string[] {
  if (text === "") return [];
  const lines = text.split("\n");
  // A trailing newline does not create an extra empty line.
  if (lines.length > 0 && lines[lines.length - 1] === "") lines.pop();
  return lines;
}

export function diffLines(aText: string, bText: string): DiffLine[] {
  const a = splitLines(aText);
  const b = splitLines(bText);
  const n = a.length;
  const m = b.length;
  // LCS lengths: dp[i][j] = LCS length of a[i..] and b[j..].
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i]![j] = a[i] === b[j] ? dp[i + 1]![j + 1]! + 1 : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "same", text: a[i]! });
      i++;
      j++;
    } else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) {
      out.push({ type: "del", text: a[i]! });
      i++;
    } else {
      out.push({ type: "add", text: b[j]! });
      j++;
    }
  }
  while (i < n) out.push({ type: "del", text: a[i++]! });
  while (j < m) out.push({ type: "add", text: b[j++]! });
  return out;
}

/** A plain-text unified diff (for the copyable output), with - / + prefixes. */
export function diffText(aText: string, bText: string): string {
  return diffLines(aText, bText)
    .map((line) => (line.type === "same" ? `  ${line.text}` : line.type === "add" ? `+ ${line.text}` : `- ${line.text}`))
    .join("\n");
}

export function diffSummary(lines: DiffLine[]): { added: number; removed: number; unchanged: number } {
  return {
    added: lines.filter((l) => l.type === "add").length,
    removed: lines.filter((l) => l.type === "del").length,
    unchanged: lines.filter((l) => l.type === "same").length,
  };
}
