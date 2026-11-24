import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Seventeen Syllables of Debugging — one haiku, 5-7-5.
//
//   Breakpoint holds at three   (break-point 2 + holds 1 + at 1 + three 1 = 5)
//   the log scrolls past, still silent
//                               (the 1 + log 1 + scrolls 1 + past 1 + still 1 + si-lent 2 = 7)
//   my print was the bug        (my 1 + print 1 + was 1 + the 1 + bug 1 = 5)
//
// The scene is a frozen 3 a.m. debug session: the breakpoint holds,
// the log offers nothing, and the turn is that the print statement
// added to hunt the bug was itself the bug.
const LINES = [
  "Breakpoint holds at three",
  "the log scrolls past, still silent",
  "my print was the bug",
] as const;

// Hand-counted syllables for every word used above, so validation is
// exact and deterministic rather than a heuristic guess.
const SYLLABLES: Record<string, number> = {
  breakpoint: 2,
  holds: 1,
  at: 1,
  three: 1,
  the: 1,
  log: 1,
  scrolls: 1,
  past: 1,
  still: 1,
  silent: 2,
  my: 1,
  print: 1,
  was: 1,
  bug: 1,
};

const EXPECTED_SHAPE = [5, 7, 5];

function countLine(line: string): number {
  const words = line
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
  let total = 0;
  for (const word of words) {
    const n = SYLLABLES[word];
    if (n === undefined) {
      throw new Error(`no syllable count recorded for word: ${word}`);
    }
    total += n;
  }
  return total;
}

function validate(text: string): void {
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("entry must be non-empty text");
  }
  if (text.length < 1 || text.length > 200) {
    throw new Error(`entry must be 1 to 200 characters, got ${text.length}`);
  }
  if (text !== text.trim()) {
    throw new Error("entry must not carry leading or trailing whitespace");
  }
  const lines = text.split("\n");
  if (lines.length !== 3) {
    throw new Error(`haiku must have exactly 3 lines, got ${lines.length}`);
  }
  for (const line of lines) {
    if (line.length === 0 || line !== line.trim()) {
      throw new Error(`haiku line must be clean and non-empty: ${JSON.stringify(line)}`);
    }
  }
  // The poem must stay about debugging: at least one concrete tool of
  // the trade has to appear on the page, not just in these comments.
  const lowered = text.toLowerCase();
  const anchors = ["breakpoint", "log", "print", "stack", "cursor", "trace"];
  if (!anchors.some((a) => lowered.includes(a))) {
    throw new Error("haiku names no concrete debugging image");
  }
  lines.forEach((line, i) => {
    const n = countLine(line);
    if (n !== EXPECTED_SHAPE[i]) {
      throw new Error(
        `line ${i + 1} must have ${EXPECTED_SHAPE[i]} syllables, got ${n}: ${line}`,
      );
    }
  });
  const total = lines.reduce((sum, line) => sum + countLine(line), 0);
  if (total !== 17) {
    throw new Error(`haiku must total 17 syllables, got ${total}`);
  }
}

function main(): void {
  const text = LINES.join("\n");
  validate(text);
  const out = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "entry.txt"), text, "utf8");
}

main();
