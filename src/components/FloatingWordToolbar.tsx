import React from 'react';
import { WordStyle } from '../types';
import {
  Italic,
  Layers,
  X,
  Sliders,
  Plus,
  Minus
} from 'lucide-react';

interface FloatingWordToolbarProps {
  selectedWords: WordStyle[];
  language: 'telugu' | 'english';
  onUpdate: (updates: Partial<WordStyle>) => void;
  onOpenFullEditor: () => void;
  onDeselect: () => void;
}

const QUICK_COLORS = ['#FFFFFF', '#FEF3C7', '#FCD34D', '#F59E0B', '#EF4444', '#38BDF8', '#34D399'];

export const FloatingWordToolbar: React.FC<FloatingWordToolbarProps> = ({
  selectedWords,
  language,
  onUpdate,
  onOpenFullEditor,
  onDeselect,
}) => {
  if (selectedWords.length === 0) return null;

  const primary = selectedWords[0];
  const currentSize = primary.fontSizeSp || 20;
  const isBold = primary.fontWeight === '700' || primary.fontWeight === '800' || primary.fontWeight === '900';
  const isHighlighted = (primary.highlightOpacity ?? 0) > 0;

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-wrap items-center gap-1.5 rounded-2xl border border-zinc-700/80 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-150 max-w-[95vw]">
      {/* Active Word / Selection Chip */}
      <div className="flex items-center gap-1.5 border-r border-zinc-800 pr-2 pl-1">
        <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded bg-amber-500 text-[10px] font-black text-zinc-950">
          {selectedWords.length > 1 ? `${selectedWords.length}w` : language === 'telugu' ? 'తె' : 'EN'}
        </span>
        <span className="text-xs font-bold text-zinc-100 max-w-[90px] truncate">
          {selectedWords.length > 1 ? `${selectedWords.length} words` : `"${primary.text}"`}
        </span>
      </div>

      {/* Quick Color Swatches */}
      <div className="flex items-center gap-1 border-r border-zinc-800 pr-2">
        {QUICK_COLORS.map((c) => (
          <button
            key={c}
            onClick={() => onUpdate({ color: c })}
            className={`h-5 w-5 rounded-full border transition-transform cursor-pointer ${
              primary.color?.toLowerCase() === c.toLowerCase()
                ? 'scale-125 border-amber-400 ring-2 ring-amber-400'
                : 'border-zinc-700 hover:scale-110'
            }`}
            style={{ backgroundColor: c }}
            title={c}
          />
        ))}
      </div>

      {/* Font Size Quick Buttons */}
      <div className="flex items-center gap-1 border-r border-zinc-800 pr-2">
        <button
          onClick={() => onUpdate({ fontSizeSp: Math.max(10, currentSize - 2) })}
          className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
          title="Decrease Size"
        >
          <Minus className="h-3 w-3" />
        </button>
        <span className="font-mono text-xs font-bold text-amber-400 min-w-[24px] text-center">
          {currentSize}
        </span>
        <button
          onClick={() => onUpdate({ fontSizeSp: Math.min(72, currentSize + 2) })}
          className="flex h-6 w-6 items-center justify-center rounded bg-zinc-900 text-zinc-300 hover:bg-zinc-800 cursor-pointer"
          title="Increase Size"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {/* Bold Toggle */}
      <button
        onClick={() => onUpdate({ fontWeight: isBold ? '400' : '700' })}
        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-black transition-colors cursor-pointer ${
          isBold ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
        }`}
        title="Toggle Bold"
      >
        B
      </button>

      {/* Italic Toggle */}
      <button
        onClick={() => onUpdate({ isItalic: !primary.isItalic })}
        className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
          primary.isItalic ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
        }`}
        title="Toggle Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </button>

      {/* Highlight Pill Toggle */}
      <button
        onClick={() => onUpdate({
          highlightOpacity: isHighlighted ? 0 : 0.35,
          highlightColor: primary.highlightColor || '#F59E0B'
        })}
        className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors cursor-pointer ${
          isHighlighted ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800'
        }`}
        title="Toggle Highlight Box"
      >
        <Layers className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Highlight</span>
      </button>

      {/* Open full editor panel */}
      <button
        onClick={onOpenFullEditor}
        className="flex items-center gap-1 rounded-lg bg-zinc-800 px-2 py-1 text-xs font-medium text-zinc-200 hover:bg-zinc-700 cursor-pointer"
        title="Open Full Word Styling Panel"
      >
        <Sliders className="h-3.5 w-3.5 text-amber-400" />
        <span className="hidden sm:inline">More Styles</span>
      </button>

      {/* Deselect */}
      <button
        onClick={onDeselect}
        className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-800 hover:text-white cursor-pointer"
        title="Close Selection"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
