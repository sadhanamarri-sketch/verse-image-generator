import React from 'react';
import { WallpaperConfig, DividerStyle } from '../types';
import {
  Layout,
  X,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MoveVertical,
  MoveHorizontal,
  RotateCcw,
  Cross,
  Quote,
  Layers,
} from 'lucide-react';

interface LayoutEditorProps {
  config: WallpaperConfig;
  onChangeConfig: (updates: Partial<WallpaperConfig>) => void;
  onClose: () => void;
}

export const LayoutEditor: React.FC<LayoutEditorProps> = ({
  config,
  onChangeConfig,
  onClose,
}) => {
  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-5 animate-in fade-in duration-200">

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm">
            <Layout className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Layout & Spacing</h3>
            <p className="text-[11px] text-zinc-400">Content width, gaps & fine position offsets</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas Dimensions */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Canvas Aspect Ratio</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {([
            { id: '9:16', label: '9:16' },
            { id: '16:9', label: '16:9' },
            { id: '1:1', label: '1:1' },
            { id: '3:4', label: '3:4' },
            { id: '4:5', label: '4:5' },
            { id: 'custom', label: 'Custom' },
          ] as { id: WallpaperConfig['aspectRatio']; label: string }[]).map((r) => (
            <button
              key={r.id}
              onClick={() => onChangeConfig({ aspectRatio: r.id })}
              className={`py-2 rounded-xl border font-medium transition cursor-pointer ${
                config.aspectRatio === r.id
                  ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {config.aspectRatio === 'custom' && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">Width (px)</span>
              <input
                type="number"
                min={200}
                max={8000}
                value={config.customWidth}
                onChange={(e) => onChangeConfig({ customWidth: Number(e.target.value) || config.customWidth })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">Height (px)</span>
              <input
                type="number"
                min={200}
                max={8000}
                value={config.customHeight}
                onChange={(e) => onChangeConfig({ customHeight: Number(e.target.value) || config.customHeight })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
          </div>
        )}
      </div>

      {/* Horizontal Text Alignment */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Text Alignment</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <button
            onClick={() => onChangeConfig({ layoutAlignment: 'left' })}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border font-medium transition cursor-pointer ${
              config.layoutAlignment === 'left'
                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" /> Left
          </button>
          <button
            onClick={() => onChangeConfig({ layoutAlignment: 'center' })}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border font-medium transition cursor-pointer ${
              config.layoutAlignment === 'center'
                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <AlignCenter className="w-3.5 h-3.5" /> Center
          </button>
          <button
            onClick={() => onChangeConfig({ layoutAlignment: 'right' })}
            className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border font-medium transition cursor-pointer ${
              config.layoutAlignment === 'right'
                ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <AlignRight className="w-3.5 h-3.5" /> Right
          </button>
        </div>
      </div>

      {/* Vertical Alignment */}
      <div className="space-y-2 pt-3 border-t border-zinc-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Vertical Alignment</h4>
        <div className="grid grid-cols-3 gap-2 text-xs">
          {(['top', 'center', 'bottom'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onChangeConfig({ verticalAlignment: v })}
              className={`py-2 rounded-xl border font-medium capitalize transition cursor-pointer ${
                config.verticalAlignment === v
                  ? 'border-amber-400 bg-amber-500/10 text-amber-300'
                  : 'border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Container Max Width */}
      <div className="space-y-2 pt-3 border-t border-zinc-800">
        <div className="flex justify-between text-xs text-zinc-300 mb-1">
          <span>Content Max Width</span>
          <span className="text-amber-400 font-semibold">{config.containerMaxWidth}%</span>
        </div>
        <input
          type="range"
          min="50"
          max="100"
          step="2"
          value={config.containerMaxWidth}
          onChange={(e) => onChangeConfig({ containerMaxWidth: Number(e.target.value) })}
          className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
        />
        <p className="text-[10px] text-zinc-500">Narrows the text column so lines wrap sooner, useful for tighter poster-style layouts.</p>
      </div>

      {/* Section Gap (between Telugu & English blocks) */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-300 mb-1">
          <span>Gap Between Telugu &amp; English</span>
          <span className="text-amber-400 font-semibold">{config.sectionGap}px</span>
        </div>
        <input
          type="range"
          min="0"
          max="60"
          step="2"
          value={config.sectionGap}
          onChange={(e) => onChangeConfig({ sectionGap: Number(e.target.value) })}
          className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
        />
      </div>

      {/* Padding */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-zinc-300 mb-1">
          <span>Canvas Padding</span>
          <span className="text-amber-400 font-semibold">{config.padding}px</span>
        </div>
        <input
          type="range"
          min="8"
          max="64"
          step="2"
          value={config.padding}
          onChange={(e) => onChangeConfig({ padding: Number(e.target.value) })}
          className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
        />
      </div>

      {/* Fine Position Offsets */}
      <div className="space-y-3 pt-3 border-t border-zinc-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          Fine Position Offsets
        </h4>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span className="flex items-center gap-1.5"><MoveVertical className="w-3.5 h-3.5 text-zinc-500" /> Vertical Offset</span>
            <span className="text-amber-400 font-semibold">{config.verticalOffset > 0 ? `+${config.verticalOffset}` : config.verticalOffset}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={config.verticalOffset}
            onChange={(e) => onChangeConfig({ verticalOffset: Number(e.target.value) })}
            className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span className="flex items-center gap-1.5"><MoveHorizontal className="w-3.5 h-3.5 text-zinc-500" /> Horizontal Offset</span>
            <span className="text-amber-400 font-semibold">{config.horizontalOffset > 0 ? `+${config.horizontalOffset}` : config.horizontalOffset}</span>
          </div>
          <input
            type="range"
            min="-50"
            max="50"
            step="1"
            value={config.horizontalOffset}
            onChange={(e) => onChangeConfig({ horizontalOffset: Number(e.target.value) })}
            className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        <button
          onClick={() => onChangeConfig({ verticalOffset: 0, horizontalOffset: 0 })}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Offsets
        </button>
      </div>

      {/* Glass Backdrop Card */}
      <div className="space-y-3.5 pt-3 border-t border-zinc-800">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            Glass Backdrop Card
          </h4>
          <button
            onClick={() => onChangeConfig({
              cardBackdrop: { ...config.cardBackdrop, enabled: !config.cardBackdrop.enabled }
            })}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              config.cardBackdrop.enabled ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {config.cardBackdrop.enabled ? 'ON' : 'OFF'}
          </button>
        </div>

        {config.cardBackdrop.enabled && (
          <div className="space-y-3 pt-1">
            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Card Color</span>
              </div>
              <input
                type="color"
                value={config.cardBackdrop.color}
                onChange={(e) => onChangeConfig({
                  cardBackdrop: { ...config.cardBackdrop, color: e.target.value }
                })}
                className="h-8 w-full rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Card Opacity</span>
                <span className="text-amber-400 font-semibold">{config.cardBackdrop.opacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="95"
                step="5"
                value={config.cardBackdrop.opacity}
                onChange={(e) => onChangeConfig({
                  cardBackdrop: { ...config.cardBackdrop, opacity: Number(e.target.value) }
                })}
                className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Glass Blur</span>
                <span className="text-amber-400 font-semibold">{config.cardBackdrop.blur}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="1"
                value={config.cardBackdrop.blur}
                onChange={(e) => onChangeConfig({
                  cardBackdrop: { ...config.cardBackdrop, blur: Number(e.target.value) }
                })}
                className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs text-zinc-300 mb-1">
                <span>Corner Radius</span>
                <span className="text-amber-400 font-semibold">{config.cardBackdrop.borderRadius}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="2"
                value={config.cardBackdrop.borderRadius}
                onChange={(e) => onChangeConfig({
                  cardBackdrop: { ...config.cardBackdrop, borderRadius: Number(e.target.value) }
                })}
                className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>Show Border</span>
              <input
                type="checkbox"
                checked={config.cardBackdrop.border}
                onChange={(e) => onChangeConfig({
                  cardBackdrop: { ...config.cardBackdrop, border: e.target.checked }
                })}
                className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
              />
            </div>

            {config.cardBackdrop.border && (
              <div>
                <span className="text-[10px] text-zinc-400 block mb-1">Border Color</span>
                <input
                  type="color"
                  value={/^#/.test(config.cardBackdrop.borderColor) ? config.cardBackdrop.borderColor : '#ffffff'}
                  onChange={(e) => onChangeConfig({
                    cardBackdrop: { ...config.cardBackdrop, borderColor: e.target.value }
                  })}
                  className="h-8 w-full rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
                />
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-zinc-300">
              <span>Drop Shadow</span>
              <input
                type="checkbox"
                checked={config.cardBackdrop.shadow}
                onChange={(e) => onChangeConfig({
                  cardBackdrop: { ...config.cardBackdrop, shadow: e.target.checked }
                })}
                className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <div className="space-y-3.5 pt-3 border-t border-zinc-800">
        <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
          <Cross className="w-3.5 h-3.5" />
          Decorative Elements
        </h4>

        {/* Cross Icon Toggle */}
        <div className="flex items-center justify-between text-xs text-zinc-300">
          <span>Display Cross Icon</span>
          <button
            onClick={() => onChangeConfig({ showCross: !config.showCross })}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
              config.showCross ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {config.showCross ? 'ON' : 'OFF'}
          </button>
        </div>

        {config.showCross && (
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">Cross Color</span>
              <input
                type="color"
                value={config.crossColor}
                onChange={(e) => onChangeConfig({ crossColor: e.target.value })}
                className="h-8 w-full rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
              />
            </div>
            <div>
              <span className="text-[10px] text-zinc-400 block mb-1">Size ({config.crossSize}px)</span>
              <input
                type="range"
                min="16"
                max="56"
                step="2"
                value={config.crossSize}
                onChange={(e) => onChangeConfig({ crossSize: Number(e.target.value) })}
                className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer mt-2.5"
              />
            </div>
          </div>
        )}

        {/* Divider Style */}
        <div className="pt-1">
          <label className="text-[11px] font-semibold text-zinc-400 mb-1.5 block">
            Divider Style
          </label>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            {([
              { id: 'gold-line', label: 'Gold Glow' },
              { id: 'cross', label: 'Cross Motif' },
              { id: 'dots', label: 'Dots' },
              { id: 'minimal', label: 'Minimal' },
              { id: 'ornament', label: 'Ornament' },
              { id: 'none', label: 'None' },
            ] as { id: DividerStyle; label: string }[]).map((div) => (
              <button
                key={div.id}
                onClick={() => onChangeConfig({ dividerStyle: div.id, showDivider: div.id !== 'none' })}
                className={`py-1.5 px-2 rounded-lg border text-center text-[11px] font-medium transition cursor-pointer ${
                  config.dividerStyle === div.id
                    ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                    : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                {div.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quote Marks */}
        <div className="flex items-center justify-between text-xs text-zinc-300 pt-1">
          <span className="flex items-center gap-1.5"><Quote className="w-3.5 h-3.5 text-zinc-500" /> Decorative Quote Marks</span>
          <input
            type="checkbox"
            checked={config.quoteMarks}
            onChange={(e) => onChangeConfig({ quoteMarks: e.target.checked })}
            className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
