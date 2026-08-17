import React from 'react';
import { WallpaperConfig } from '../types';
import { COLOR_PALETTES } from '../data/backgrounds';
import {
  Quote,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  ArrowDown,
  Merge,
  Check,
  Languages,
} from 'lucide-react';

interface ReferenceEditorProps {
  config: WallpaperConfig;
  onUpdateRef: (updates: Partial<WallpaperConfig['referenceStyle']>) => void;
  onUpdateAlignment: (alignment: 'left' | 'center' | 'right') => void;
  onClose: () => void;
}

export const ReferenceEditor: React.FC<ReferenceEditorProps> = ({
  config,
  onUpdateRef,
  onUpdateAlignment,
  onClose,
}) => {
  const ref = config.referenceStyle;

  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-5 animate-in fade-in duration-200">

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm">
            <Quote className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Verse Reference Styling</h3>
            <p className="text-[11px] text-zinc-400">Citation placement, badge & typography</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Reference Format: Bilingual / Telugu-only / English-only */}
      <div className="space-y-2.5">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Languages className="w-3.5 h-3.5" />
          <span>Reference Format</span>
        </h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            onClick={() => onUpdateRef({ showTeluguRef: true, showEnglishRef: true })}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg border font-semibold transition cursor-pointer ${
              ref.showTeluguRef && ref.showEnglishRef
                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <span>Bilingual</span>
            <span className="text-[9px] text-zinc-500 font-normal">తెలుగు • English</span>
          </button>
          <button
            onClick={() => onUpdateRef({ showTeluguRef: true, showEnglishRef: false })}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg border font-semibold transition cursor-pointer ${
              ref.showTeluguRef && !ref.showEnglishRef
                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <span>Telugu Only</span>
            <span className="text-[9px] text-zinc-500 font-normal">తెలుగు</span>
          </button>
          <button
            onClick={() => onUpdateRef({ showTeluguRef: false, showEnglishRef: true })}
            className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-lg border font-semibold transition cursor-pointer ${
              !ref.showTeluguRef && ref.showEnglishRef
                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <span>English Only</span>
            <span className="text-[9px] text-zinc-500 font-normal">English</span>
          </button>
        </div>
      </div>

      {/* Placement: Top / Bottom / Integrated */}
      <div className="space-y-2 pt-3 border-t border-zinc-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Placement</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            onClick={() => onUpdateRef({ placement: 'top' })}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg border font-semibold transition cursor-pointer ${
              ref.placement === 'top'
                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Top</span>
          </button>
          <button
            onClick={() => onUpdateRef({ placement: 'integrated' })}
            title="Woven directly into the text flow, right after the verse — no badge, tight spacing"
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg border font-semibold transition cursor-pointer ${
              ref.placement === 'integrated'
                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <Merge className="w-3.5 h-3.5" />
            <span>Integrated</span>
          </button>
          <button
            onClick={() => onUpdateRef({ placement: 'bottom' })}
            className={`flex flex-col items-center justify-center gap-1 py-2 rounded-lg border font-semibold transition cursor-pointer ${
              ref.placement === 'bottom'
                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
            }`}
          >
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Bottom</span>
          </button>
        </div>
        {ref.placement === 'integrated' && (
          <p className="text-[10px] text-zinc-500 pt-0.5">
            Integrated mode drops the badge and renders the reference immediately after the verse text, like an inline citation.
          </p>
        )}
      </div>

      {/* Alignment */}
      <div className="space-y-2 pt-3 border-t border-zinc-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Alignment</h4>
        <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-800 w-fit">
          <button
            onClick={() => onUpdateAlignment('left')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${config.referenceAlignment === 'left' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
            title="Align Left"
          >
            <AlignLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onUpdateAlignment('center')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${config.referenceAlignment === 'center' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
            title="Align Center"
          >
            <AlignCenter className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onUpdateAlignment('right')}
            className={`p-1.5 rounded-lg transition cursor-pointer ${config.referenceAlignment === 'right' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
            title="Align Right"
          >
            <AlignRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Badge Capsule toggle — not applicable in Integrated mode, which is always plain inline text */}
      {ref.placement !== 'integrated' && (
        <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
          <div>
            <span className="text-xs text-zinc-300 font-semibold">Glass Capsule Badge</span>
            <p className="text-[10px] text-zinc-500">Frosted pill background vs. plain floating text</p>
          </div>
          <button
            onClick={() => onUpdateRef({ showBadge: !ref.showBadge })}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
              ref.showBadge ? 'bg-amber-500 text-zinc-950' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {ref.showBadge ? 'Capsule' : 'Plain Text'}
          </button>
        </div>
      )}

      {/* Badge colors — only relevant when badge is on */}
      {ref.showBadge && ref.placement !== 'integrated' && (
        <div className="space-y-3 pt-1">
          <div>
            <span className="text-[11px] text-zinc-400 block mb-1.5">Badge Background</span>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Frosted Black', hex: 'rgba(0, 0, 0, 0.6)' },
                { name: 'Frosted White', hex: 'rgba(255, 255, 255, 0.12)' },
                { name: 'Warm Amber', hex: 'rgba(245, 158, 11, 0.18)' },
                { name: 'Deep Charcoal', hex: 'rgba(24, 24, 27, 0.75)' },
                { name: 'Transparent', hex: 'rgba(0, 0, 0, 0)' },
              ].map((swatch) => (
                <button
                  key={swatch.name}
                  onClick={() => onUpdateRef({ badgeBg: swatch.hex })}
                  title={swatch.name}
                  className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${
                    ref.badgeBg === swatch.hex ? 'border-amber-400 scale-110' : 'border-zinc-700'
                  }`}
                  style={{ backgroundColor: swatch.hex }}
                >
                  {ref.badgeBg === swatch.hex && <Check className="w-3 h-3 text-amber-300 drop-shadow" />}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-[11px] text-zinc-400 block mb-1.5">Badge Border</span>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'Soft White', hex: 'rgba(255, 255, 255, 0.1)' },
                { name: 'Amber Glow', hex: 'rgba(252, 211, 77, 0.35)' },
                { name: 'None', hex: 'rgba(255, 255, 255, 0)' },
              ].map((swatch) => (
                <button
                  key={swatch.name}
                  onClick={() => onUpdateRef({ badgeBorder: swatch.hex })}
                  title={swatch.name}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border transition cursor-pointer ${
                    ref.badgeBorder === swatch.hex
                      ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                      : 'border-zinc-700 bg-zinc-900 text-zinc-400'
                  }`}
                >
                  {swatch.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Text color */}
      <div className="space-y-2 pt-3 border-t border-zinc-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Reference Text Color</h4>
        <div className="flex flex-wrap gap-2">
          {COLOR_PALETTES.map((swatch) => (
            <button
              key={swatch.hex}
              onClick={() => onUpdateRef({ color: swatch.hex })}
              title={swatch.name}
              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition ${
                ref.color === swatch.hex ? 'border-amber-400 scale-110' : 'border-zinc-700'
              }`}
              style={{ backgroundColor: swatch.hex }}
            >
              {ref.color === swatch.hex && (
                <Check className={`w-3 h-3 drop-shadow ${swatch.hex === '#FFFFFF' || swatch.hex === '#FEF3C7' ? 'text-black' : 'text-white'}`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Font size + letter spacing sliders */}
      <div className="space-y-4 pt-3 border-t border-zinc-800">
        <div>
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span>Reference Font Size</span>
            <span className="font-mono font-bold text-amber-400">{ref.fontSizeSp}px</span>
          </div>
          <input
            type="range"
            min={10}
            max={28}
            step={1}
            value={ref.fontSizeSp}
            onChange={(e) => onUpdateRef({ fontSizeSp: Number(e.target.value) })}
            className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span>Letter Spacing</span>
            <span className="font-mono font-bold text-amber-400">{ref.letterSpacing.toFixed(2)}em</span>
          </div>
          <input
            type="range"
            min={0}
            max={0.3}
            step={0.01}
            value={ref.letterSpacing}
            onChange={(e) => onUpdateRef({ letterSpacing: Number(e.target.value) })}
            className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
