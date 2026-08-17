// Lazy-loaded, in-memory-cached lookup for the bundled offline Bible datasets.
// Each dataset is a position-indexed array: data[bookIndex][chapterIndex][verseIndex]
// (all 0-based), where bookIndex matches the position of that book in
// BIBLE_BOOKS (see ../data/verses.ts) — not the book name — so mismatched
// English labels between translations (e.g. "Psalms" vs "Psalm") can't cause
// a lookup to silently fail.
type BibleData = string[][][];

let teDataPromise: Promise<BibleData> | null = null;
let enDataPromise: Promise<BibleData> | null = null;

function loadTelugu(): Promise<BibleData> {
  if (!teDataPromise) {
    teDataPromise = fetch('/data/bible-te.json').then((r) => {
      if (!r.ok) throw new Error(`Failed to load Telugu verse data (${r.status})`);
      return r.json();
    });
  }
  return teDataPromise;
}

function loadEnglish(): Promise<BibleData> {
  if (!enDataPromise) {
    enDataPromise = fetch('/data/bible-en.json').then((r) => {
      if (!r.ok) throw new Error(`Failed to load English verse data (${r.status})`);
      return r.json();
    });
  }
  return enDataPromise;
}

/**
 * Parses a verse-number field like "16", "16-18", or "16, 18" into an
 * ordered list of individual verse numbers. Ignores anything that isn't a
 * plain number or number range.
 */
export function parseVerseNumbers(input: string): number[] {
  const nums: number[] = [];
  const parts = input.split(',');
  for (const part of parts) {
    const trimmed = part.trim();
    const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (start <= end) {
        for (let i = start; i <= end; i++) nums.push(i);
      }
    } else if (/^\d+$/.test(trimmed)) {
      nums.push(parseInt(trimmed, 10));
    }
  }
  return nums;
}

export interface VerseLookupResult {
  text: string;
  /** True if some requested verse numbers had no matching text (out of range / missing). */
  partial: boolean;
}

async function lookup(
  data: BibleData,
  bookIndex: number,
  chapter: number,
  verseNumbers: number[]
): Promise<VerseLookupResult> {
  const book = data[bookIndex];
  if (!book) return { text: '', partial: true };
  const chapterVerses = book[chapter - 1];
  if (!chapterVerses) return { text: '', partial: true };

  const found: string[] = [];
  let partial = false;
  for (const vnum of verseNumbers) {
    const text = chapterVerses[vnum - 1];
    if (text) found.push(text);
    else partial = true;
  }
  return { text: found.join(' '), partial };
}

/** Fetches (and caches) Telugu BSI verse text for the given book/chapter/verses. */
export async function getTeluguVerseText(
  bookIndex: number,
  chapter: number,
  verseNumbers: number[]
): Promise<VerseLookupResult> {
  const data = await loadTelugu();
  return lookup(data, bookIndex, chapter, verseNumbers);
}

/** Fetches (and caches) KJV verse text for the given book/chapter/verses. */
export async function getEnglishVerseText(
  bookIndex: number,
  chapter: number,
  verseNumbers: number[]
): Promise<VerseLookupResult> {
  const data = await loadEnglish();
  return lookup(data, bookIndex, chapter, verseNumbers);
}
