import React, { useState, useEffect, useRef } from 'react';
import { ParallelVerse } from '../types';
import { BIBLE_BOOKS } from '../data/verses';
import { getTeluguVerseText, getEnglishVerseText, parseVerseNumbers } from '../utils/bibleData';
import {
  BookOpen,
  X,
  Loader2,
  AlertTriangle
} from 'lucide-react';

interface VerseSelectorProps {
  currentVerseId?: string;
  onSelectVerse: (verse: ParallelVerse) => void;
  onCustomVerseSubmit: (refTe: string, refEn: string, teluguText: string, englishText: string) => void;
  onClose: () => void;
}

export const VerseSelector: React.FC<VerseSelectorProps> = ({
  currentVerseId,
  onSelectVerse,
  onCustomVerseSubmit,
  onClose,
}) => {
  // Custom Form Inputs — structured Book / Chapter / Verse picker
  const johnIndex = BIBLE_BOOKS.findIndex((b) => b.en === 'John');
  const [customBookIndex, setCustomBookIndex] = useState(johnIndex >= 0 ? johnIndex : 0);
  const [customChapter, setCustomChapter] = useState('3');
  const [customVerseNum, setCustomVerseNum] = useState('16');
  const [customTeText, setCustomTeText] = useState('దేవుడు లోకమును ఎంతో ప్రేమించెను...');
  const [customEnText, setCustomEnText] = useState('For God so loved the world, that he gave his only begotten Son...');

  // Auto-population state: verse text loads from the bundled BSI/KJV
  // datasets whenever book/chapter/verse changes. Once the user edits a
  // text field by hand, that field is left alone on future lookups so we
  // never clobber their wording — until they change the reference again,
  // which resets the "manually edited" flag for both fields.
  const [isLoadingVerseText, setIsLoadingVerseText] = useState(false);
  const [verseLookupNote, setVerseLookupNote] = useState<string | null>(null);
  const teEditedRef = useRef(false);
  const enEditedRef = useRef(false);

  const selectedBook = BIBLE_BOOKS[customBookIndex] || BIBLE_BOOKS[0];
  const displayChapter = customChapter === '' ? '1' : customChapter;
  const customRefTe = `${selectedBook.te} ${displayChapter}:${customVerseNum}`;
  const customRefEn = `${selectedBook.en} ${displayChapter}:${customVerseNum}`;

  // Auto-populate Telugu/English text from the bundled datasets whenever the
  // book, chapter, or verse selection changes (debounced while typing).
  useEffect(() => {
    const chapterNum = Number(customChapter);
    const verseNumbers = parseVerseNumbers(customVerseNum);
    if (!chapterNum || chapterNum < 1 || verseNumbers.length === 0) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoadingVerseText(true);
      setVerseLookupNote(null);
      try {
        const [teResult, enResult] = await Promise.all([
          getTeluguVerseText(customBookIndex, chapterNum, verseNumbers),
          getEnglishVerseText(customBookIndex, chapterNum, verseNumbers),
        ]);
        if (cancelled) return;

        if (!teEditedRef.current && teResult.text) setCustomTeText(teResult.text);
        if (!enEditedRef.current && enResult.text) setCustomEnText(enResult.text);

        if (!teResult.text && !enResult.text) {
          setVerseLookupNote('No verse found at that reference — check chapter/verse.');
        } else if (teResult.partial || enResult.partial) {
          setVerseLookupNote('Some verses in that range were not found.');
        }
      } catch (err) {
        if (!cancelled) setVerseLookupNote('Could not load verse text. You can still type it manually.');
      } finally {
        if (!cancelled) setIsLoadingVerseText(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [customBookIndex, customChapter, customVerseNum]);

  const handleSelectBook = (idx: number) => {
    setCustomBookIndex(idx);
    teEditedRef.current = false;
    enEditedRef.current = false;
    const book = BIBLE_BOOKS[idx];
    if (book && Number(customChapter) > book.chapters) {
      setCustomChapter('1');
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTeText.trim() || customEnText.trim()) {
      onCustomVerseSubmit(customRefTe.trim(), customRefEn.trim(), customTeText.trim(), customEnText.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">
                Add Scripture Verse (తెలుగు BSI & English KJV)
              </h2>
              <p className="text-xs text-zinc-400">
                Input your custom Telugu &amp; English passage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Manual Scripture Input Form */}
        <form onSubmit={handleCustomSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* Book / Chapter / Verse Picker */}
            <div className="rounded-xl border border-zinc-800 bg-black/40 p-3 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Select Bible Book
                </label>
                <select
                  value={customBookIndex}
                  onChange={(e) => handleSelectBook(Number(e.target.value))}
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {BIBLE_BOOKS.map((b, idx) => (
                    <option key={b.en} value={idx}>
                      {b.te} ({b.en})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Chapter
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={selectedBook.chapters}
                    value={customChapter}
                    onChange={(e) => {
                      const raw = e.target.value;
                      teEditedRef.current = false;
                      enEditedRef.current = false;
                      // Allow the field to be cleared while typing; don't force it back to 1.
                      if (raw === '') {
                        setCustomChapter('');
                        return;
                      }
                      const num = Number(raw);
                      if (!Number.isNaN(num)) {
                        setCustomChapter(String(Math.max(1, Math.min(selectedBook.chapters, num))));
                      }
                    }}
                    onBlur={() => {
                      // Only snap back to a valid number once the user leaves the field.
                      if (customChapter === '' || Number(customChapter) < 1) {
                        setCustomChapter('1');
                      }
                    }}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Verse / Range
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 16 or 16-18"
                    value={customVerseNum}
                    onChange={(e) => {
                      teEditedRef.current = false;
                      enEditedRef.current = false;
                      setCustomVerseNum(e.target.value);
                    }}
                    className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Auto-population status */}
              {isLoadingVerseText && (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Loading verse text…</span>
                </div>
              )}
              {!isLoadingVerseText && verseLookupNote && (
                <div className="flex items-center gap-1.5 text-[11px] text-amber-400">
                  <AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>{verseLookupNote}</span>
                </div>
              )}

              {/* Live reference preview */}
              <div className="flex items-center gap-2 text-xs pt-1">
                <span className="text-amber-400 font-bold font-['Noto_Serif_Telugu']">{customRefTe}</span>
                <span className="text-zinc-600">•</span>
                <span className="text-amber-300 font-semibold">{customRefEn}</span>
              </div>
            </div>

            {/* Telugu Verse Text */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Telugu Verse Text (BSI Translation) — auto-filled, editable
              </label>
              <textarea
                rows={3}
                value={customTeText}
                onChange={(e) => {
                  teEditedRef.current = true;
                  setCustomTeText(e.target.value);
                }}
                placeholder="తెలుగు వాక్యమును ఇక్కడ రాయండి లేదా పేస్ట్ చేయండి..."
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-['Noto_Serif_Telugu'] leading-relaxed"
              />
            </div>

            {/* English Verse Text */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                English Verse Text (KJV Translation) — auto-filled, editable
              </label>
              <textarea
                rows={3}
                value={customEnText}
                onChange={(e) => {
                  enEditedRef.current = true;
                  setCustomEnText(e.target.value);
                }}
                placeholder="Type or paste the English King James scripture..."
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-['Cinzel'] leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Apply Custom Verse
              </button>
            </div>
        </form>

      </div>
    </div>
  );
};
