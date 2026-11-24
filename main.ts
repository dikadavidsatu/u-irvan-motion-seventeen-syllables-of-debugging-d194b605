import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// Original haiku about debugging, in strict 5-7-5 form.
// Hand-counted, word by word:
//   Breakpoint(2) holds(1) the(1) thread(1)            = 5
//   Cursor(2) blinks(1) by(1) the(1) stack(1) trace(1) = 7
//   The(1) typo(2) was(1) mine(1)                      = 5
// The scene: a breakpoint freezes the thread while the cursor
// blinks beside a stack trace — and the last line turns it:
// the fault was never in the library, it was a typo of mine.
const LINES: string[] = [
  "Breakpoint holds the thread",
  "Cursor blinks by the stack trace",
  "The typo was mine",
];

const EXPECTED_SYLLABLES: number[] = [5, 7, 5];

// Small vowel-group heuristic: count runs of vowels, treat a
// word-final silent "e" as non-syllabic, and let "y" carry a
// syllable when it does not follow another vowel (as in "by").
export function countWordSyllables(raw: string): number {
  const word = raw.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length === 0) return 0;
  if (word.length <= 3) return 1;
  let groups = 0;
  let prevVowel = false;
  for (const ch of word) {
    const isVowel = "aeiou".includes(ch) || (ch === "y" && !prevVowel);
    if (isVowel && !prevVowel) groups += 1;
    prevVowel = isVowel;
  }
  if (groups === 0) groups = 1;
  if (word.endsWith("e") && !word.endsWith("le") && groups > 1) {
    groups -= 1;
  }
  return Math.max(1, groups);
}

export function countLineSyllables(line: string): number {
  return line
    .split(/\s+/)
    .filter(Boolean)
    .reduce((sum, w) => sum + countWordSyllables(w), 0);
}

function validate(text: string): void {
  if (text.length < 1 || text.length > 200) {
    throw new Error(`entry must be 1-200 characters, got ${text.length}`);
  }
  if (text.trim().length === 0) {
    throw new Error("entry must not be only whitespace");
  }
  const lines = text.split("\n");
  if (lines.length !== 3) {
    throw new Error(`entry must have exactly 3 lines, got ${lines.length}`);
  }
  for (const line of lines) {
    if (line.length === 0) {
      throw new Error("lines must not be empty");
    }
    if (line !== line.trim()) {
      throw new Error("lines must not have leading or trailing spaces");
    }
  }
  let total = 0;
  lines.forEach((line, i) => {
    const n = countLineSyllables(line);
    total += n;
    if (n !== EXPECTED_SYLLABLES[i]) {
      throw new Error(
        `line ${i + 1} must have ${EXPECTED_SYLLABLES[i]} syllables, got ${n}: ${line}`,
      );
    }
  });
  if (total !== 17) {
    throw new Error(`entry must total 17 syllables, got ${total}`);
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
