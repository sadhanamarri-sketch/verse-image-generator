import React from 'react';
import { WordStyle } from '../types';
import { TELUGU_FONTS, ENGLISH_FONTS } from '../data/verses';
import { COLOR_PALETTES } from '../data/backgrounds';
import {
  Type,
  Palette,
  Sliders,
  Bold,
  Italic,
  CaseSensitive,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Highlighter,
  CheckCircle,
  CopyCheck,
  X,
  ListChecks,
  Trash2,
  Layers
} from 'lucide-react';

interface WordStyleEditorProps {
  selectedWords: WordStyle[];
  language: 'telugu' | 'english';
  onUpdate: (updates: Partial<WordStyle>) => void;
  onApplyToAll: () => void;
  onClose: () => void;
  onRemoveWordFromSelection?: (wordId: string) => void;
  onSelectAllWords?: () => void;
  onPrevWord?: () => void;
  onNextWord?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const WordStyleEditor: React.FC<WordStyleEditorProps> = ({
  selectedWords,
  language,
  onUpdate,
  onApplyToAll,
  onClose,
  onRemoveWordFromSelection,
  onSelectAllWords,
  onPrevWord,
  onNextWord,
  hasPrev,
  hasNext,
}) => {
  if (selectedWords.length === 0) return null;

  const isTelugu = language === 'telugu';
  const fonts = isTelugu ? TELUGU_FONTS : ENGLISH_FONTS;
  const isMulti = selectedWords.length > 1;

  // Primary word representation (first selected)
  const primaryWord = selectedWords[0];

  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-200">
      
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm">
            {isMulti ? <ListChecks className="w-4 h-4" /> : <Type className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase">
                {isMulti ? `Multi-Select (${selectedWords.length} Words)` : 'Selected Word'}
              </span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-amber-300 font-bold border border-zinc-800">
                {isTelugu ? 'తెలుగు' : 'English'}
              </span>
            </div>
            {!isMulti ? (
              <div className="text-base font-bold text-white flex items-center gap-2">
                <span className="text-amber-400">“</span>
                <span>{primaryWord.text}</span>
                <span className="text-amber-400">”</span>
              </div>
            ) : (
              <div className="text-xs font-semibold text-amber-300 mt-0.5">
                Bulk formatting {selectedWords.length} words simultaneously
              </div>
            )}
          </div>
        </div>

        {/* Navigation & Close */}
        <div className="flex items-center gap-1.5">
          {!isMulti && (
            <>
              <button
                onClick={onPrevWord}
                disabled={!hasPrev}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 transition cursor-pointer"
                title="Previous Word"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNextWord}
                disabled={!hasNext}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:pointer-events-none text-zinc-300 transition cursor-pointer"
                title="Next Word"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition ml-1 cursor-pointer"
            title="Close Editor"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selected Words Chips when Multi-Select is active */}
      {isMulti && (
        <div className="space-y-1.5 p-2.5 bg-black/60 rounded-xl border border-zinc-800/80">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span>Selected Words ({selectedWords.length})</span>
            {onSelectAllWords && (
              <button
                onClick={onSelectAllWords}
                className="text-amber-400 hover:underline cursor-pointer"
              >
                Select All {isTelugu ? 'Telugu' : 'English'}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            {selectedWords.map((w) => (
              <span
                key={w.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-zinc-800 text-zinc-200 border border-zinc-700 font-medium"
              >
                <span>{w.text}</span>
                {onRemoveWordFromSelection && selectedWords.length > 1 && (
                  <button
                    onClick={() => onRemoveWordFromSelection(w.id)}
                    className="text-zinc-400 hover:text-rose-400 cursor-pointer ml-0.5"
                    title={`Remove "${w.text}" from selection`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 1. Color Swatches */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>{isMulti ? 'Bulk Text Color' : 'Word Text Color'}</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryWord.color.startsWith('#') && primaryWord.color.length === 7 ? primaryWord.color : '#FFFFFF'}
              onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
              title="Custom Hex Picker"
            />
            <span className="text-xs font-mono text-zinc-400 uppercase">{primaryWord.color}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTES.map((item) => {
            const isSelected = primaryWord.color.toLowerCase() === item.hex.toLowerCase();
            return (
              <button
                key={item.name}
                onClick={() => onUpdate({ color: item.hex })}
                className={`w-7 h-7 rounded-full transition-transform cursor-pointer relative ${
                  isSelected
                    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black scale-110 shadow-md shadow-amber-500/20'
                    : 'hover:scale-105 border border-white/20'
                }`}
                style={{ backgroundColor: item.hex }}
                title={item.name}
              />
            );
          })}
        </div>
      </div>

      {/* 2. Font Size Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-amber-400" />
            <span>Font Size ({primaryWord.fontSizeSp}sp)</span>
          </label>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdate({ fontSizeSp: Math.max(12, primaryWord.fontSizeSp - 2) })}
              className="px-2 py-0.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer"
            >
              -
            </button>
            <button
              onClick={() => onUpdate({ fontSizeSp: Math.min(90, primaryWord.fontSizeSp + 2) })}
              className="px-2 py-0.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer"
            >
              +
            </button>
          </div>
        </div>
        <input
          type="range"
          min="14"
          max="80"
          step="1"
          value={primaryWord.fontSizeSp}
          onChange={(e) => onUpdate({ fontSizeSp: Number(e.target.value) })}
          className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
        />
      </div>

      {/* 3. Font Family Selector */}
      <div>
        <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5 mb-2">
          <Type className="w-3.5 h-3.5 text-amber-400" />
          <span>Google Font ({isTelugu ? 'Telugu Script' : 'English Serif/Sans'})</span>
        </label>
        <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
          {fonts.map((f) => {
            const isSelected = primaryWord.fontFamily === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onUpdate({ fontFamily: f.id })}
                className={`flex items-center justify-between p-2 rounded-xl text-left border text-xs transition cursor-pointer ${
                  isSelected
                    ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-semibold'
                    : 'bg-[#18181b] border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="truncate">
                  <div style={{ fontFamily: `"${f.id}", sans-serif` }} className="text-sm">
                    {f.name}
                  </div>
                  <div className="text-[10px] text-zinc-400 truncate">{f.label.split('(')[1]?.replace(')', '') || f.label}</div>
                </div>
                {isSelected && <CheckCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Weight, Italic & All-Caps Toggles */}
      <div>
        <label className="text-xs font-semibold text-zinc-300 mb-2 block">
          Styling & Emphasis
        </label>
        <div className="grid grid-cols-3 gap-2">
          
          {/* Bold toggle */}
          <button
            onClick={() => {
              const nextWeight = primaryWord.fontWeight === '700' || primaryWord.fontWeight === '800' ? '400' : '700';
              onUpdate({ fontWeight: nextWeight });
            }}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              primaryWord.fontWeight === '700' || primaryWord.fontWeight === '800'
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
            <span>Bold</span>
          </button>

          {/* Italic toggle */}
          <button
            onClick={() => onUpdate({ isItalic: !primaryWord.isItalic })}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              primaryWord.isItalic
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 italic'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
            <span>Italic</span>
          </button>

          {/* All Caps toggle */}
          <button
            onClick={() => onUpdate({ isAllCaps: !primaryWord.isAllCaps })}
            className={`flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              primaryWord.isAllCaps
                ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold uppercase'
                : 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <CaseSensitive className="w-3.5 h-3.5" />
            <span>All Caps</span>
          </button>
        </div>
      </div>

      {/* 5. Highlight / Box Background */}
      <div className="p-3 bg-black/60 rounded-xl border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
            <Highlighter className="w-3.5 h-3.5 text-amber-400" />
            <span>Word Highlight Box</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={primaryWord.highlightColor || '#F59E0B'}
              onChange={(e) => onUpdate({ highlightColor: e.target.value, highlightOpacity: Math.max(0.3, primaryWord.highlightOpacity || 0.4) })}
              className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
              title="Highlight Box Color"
            />
            {primaryWord.highlightOpacity && primaryWord.highlightOpacity > 0 ? (
              <button
                onClick={() => onUpdate({ highlightOpacity: 0 })}
                className="text-[11px] text-amber-400 hover:underline cursor-pointer"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-1">
            <span>Highlight Opacity</span>
            <span>{Math.round((primaryWord.highlightOpacity || 0) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={primaryWord.highlightOpacity || 0}
            onChange={(e) => onUpdate({
              highlightOpacity: Number(e.target.value),
              highlightColor: primaryWord.highlightColor || '#F59E0B'
            })}
            className="w-full accent-amber-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* 6. Batch Actions */}
      <div className="pt-2">
        <button
          onClick={onApplyToAll}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-amber-300 hover:text-amber-200 transition cursor-pointer"
        >
          <CopyCheck className="w-4 h-4" />
          <span>Apply Style to All {isTelugu ? 'Telugu' : 'English'} Words</span>
        </button>
      </div>

    </div>
  );
};
