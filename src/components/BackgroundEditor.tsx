import React, { useState } from 'react';
import { BackgroundConfig, WallpaperConfig } from '../types';
import { PRESET_BACKGROUNDS, GRADIENT_PRESETS, COLOR_PALETTES } from '../data/backgrounds';
import {
  Image as ImageIcon,
  Layers,
  Sparkles,
  Sun,
  Eye,
  Sliders,
  Upload,
  Link2,
  Check,
  Palette,
  Contrast,
  X
} from 'lucide-react';

interface BackgroundEditorProps {
  config: WallpaperConfig;
  onUpdateBg: (updates: Partial<BackgroundConfig>) => void;
  onClose: () => void;
}

export const BackgroundEditor: React.FC<BackgroundEditorProps> = ({
  config,
  onUpdateBg,
  onClose,
}) => {
  const { background } = config;
  const [activeSubTab, setActiveSubTab] = useState<'presets' | 'gradients' | 'solids' | 'custom'>('presets');
  const [customUrlInput, setCustomUrlInput] = useState('');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateBg({
            type: 'image',
            imageUrl: event.target.result as string,
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const applyCustomUrl = () => {
    if (customUrlInput.trim()) {
      onUpdateBg({
        type: 'image',
        imageUrl: customUrlInput.trim(),
      });
    }
  };

  return (
    <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-5 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Background & Visual FX</h3>
            <p className="text-[11px] text-zinc-400">Curated photography, shaders, blur & scrim</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Sub-Tabs: Photos, Gradients, Solids, Custom Upload */}
      <div className="flex p-1 bg-black rounded-xl border border-zinc-800 text-xs">
        <button
          onClick={() => setActiveSubTab('presets')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            activeSubTab === 'presets' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Curated Photos
        </button>
        <button
          onClick={() => setActiveSubTab('gradients')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            activeSubTab === 'gradients' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Gradients
        </button>
        <button
          onClick={() => setActiveSubTab('solids')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            activeSubTab === 'solids' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Solids
        </button>
        <button
          onClick={() => setActiveSubTab('custom')}
          className={`flex-1 py-1.5 rounded-lg font-medium transition cursor-pointer ${
            activeSubTab === 'custom' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Upload / URL
        </button>
      </div>

      {/* Background Source Content */}
      <div className="min-h-[140px]">
        {activeSubTab === 'presets' && (
          <div className="grid grid-cols-4 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {PRESET_BACKGROUNDS.map((preset) => {
              const isSelected = background.type === 'image' && background.imageUrl === preset.fullUrl;
              return (
                <button
                  key={preset.id}
                  onClick={() => onUpdateBg({
                    type: 'image',
                    imageUrl: preset.fullUrl,
                    scrimOpacity: preset.defaultOverlay
                  })}
                  className={`group relative aspect-[9/16] rounded-xl overflow-hidden border-2 transition cursor-pointer ${
                    isSelected ? 'border-amber-400 shadow-md shadow-amber-500/30' : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                >
                  <img
                    src={preset.thumbnailUrl}
                    alt={preset.name}
                    className="w-full h-full object-cover transition duration-300 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1.5">
                    <span className="text-[10px] text-white font-medium truncate">{preset.name}</span>
                  </div>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-amber-400 text-black rounded-full flex items-center justify-center text-[10px] font-bold">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {activeSubTab === 'gradients' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
            {GRADIENT_PRESETS.map((grad) => {
              const isSelected = background.type === 'gradient' && background.gradientColors.join(',') === grad.colors.join(',');
              return (
                <button
                  key={grad.id}
                  onClick={() => onUpdateBg({
                    type: 'gradient',
                    gradientColors: grad.colors,
                    gradientDirection: grad.dir
                  })}
                  className={`h-16 rounded-xl p-2 flex flex-col justify-end text-left border-2 transition cursor-pointer relative overflow-hidden ${
                    isSelected ? 'border-amber-400 shadow-md shadow-amber-500/30' : 'border-zinc-800 hover:border-zinc-600'
                  }`}
                  style={{
                    background: `linear-gradient(${grad.dir}, ${grad.colors.join(', ')})`
                  }}
                >
                  <span className="text-[11px] font-bold text-white drop-shadow truncate">{grad.name}</span>
                  {isSelected && (
                    <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-400 text-black rounded-full flex items-center justify-center text-[10px] font-bold">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {activeSubTab === 'solids' && (
          <div className="space-y-3">
            <div className="grid grid-cols-6 gap-2">
              {COLOR_PALETTES.map((col) => {
                const isSelected = background.type === 'solid' && background.solidColor.toLowerCase() === col.hex.toLowerCase();
                return (
                  <button
                    key={col.name}
                    onClick={() => onUpdateBg({ type: 'solid', solidColor: col.hex })}
                    className={`aspect-square rounded-xl transition cursor-pointer relative ${
                      isSelected ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black scale-105 shadow-md shadow-amber-500/20' : 'hover:scale-105 border border-white/20'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  />
                );
              })}
            </div>
          </div>
        )}

        {activeSubTab === 'custom' && (
          <div className="space-y-3 p-3 bg-black/60 rounded-xl border border-zinc-800">
            {/* File Upload */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Local Device Image Upload
              </label>
              <label className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-zinc-700 hover:border-amber-500 rounded-xl bg-zinc-900/80 cursor-pointer text-xs text-zinc-300 transition">
                <Upload className="w-4 h-4 text-amber-400" />
                <span>Choose Image from Computer/Phone</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Custom URL */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                Or Direct Image URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={customUrlInput}
                  onChange={(e) => setCustomUrlInput(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-500"
                />
                <button
                  onClick={applyCustomUrl}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl text-xs cursor-pointer"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Graphic Layer Shaders & Adjustment Sliders */}
      <div className="space-y-4 pt-3 border-t border-zinc-800">
        <h4 className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-amber-400" />
          <span>Real-time Graphic Layer FX</span>
        </h4>

        {/* 1. Scrim Darkness Slider */}
        <div>
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-zinc-400" />
              <span>Dark Scrim Overlay</span>
            </span>
            <span className="font-mono font-bold text-amber-400">{Math.round(background.scrimOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.9"
            step="0.02"
            value={background.scrimOpacity}
            onChange={(e) => onUpdateBg({ scrimOpacity: Number(e.target.value) })}
            className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* 2. Gaussian Blur Slider */}
        <div>
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3 text-zinc-400" />
              <span>Gaussian Background Blur</span>
            </span>
            <span className="font-mono font-bold text-amber-400">{background.blur} px</span>
          </div>
          <input
            type="range"
            min="0"
            max="30"
            step="1"
            value={background.blur}
            onChange={(e) => onUpdateBg({ blur: Number(e.target.value) })}
            className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* 3. Brightness Slider */}
        <div>
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span className="flex items-center gap-1">
              <Sun className="w-3 h-3 text-zinc-400" />
              <span>Brightness</span>
            </span>
            <span className="font-mono font-bold text-amber-400">{background.brightness}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            step="2"
            value={background.brightness}
            onChange={(e) => onUpdateBg({ brightness: Number(e.target.value) })}
            className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* 4. Contrast Slider */}
        <div>
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span className="flex items-center gap-1">
              <Contrast className="w-3 h-3 text-zinc-400" />
              <span>Contrast</span>
            </span>
            <span className="font-mono font-bold text-amber-400">{background.contrast}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="150"
            step="2"
            value={background.contrast}
            onChange={(e) => onUpdateBg({ contrast: Number(e.target.value) })}
            className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* 5. Vignette Depth */}
        <div>
          <div className="flex justify-between text-xs text-zinc-300 mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-zinc-400" />
              <span>Vignette Edge Depth</span>
            </span>
            <span className="font-mono font-bold text-amber-400">{Math.round((background.vignette || 0) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={background.vignette || 0}
            onChange={(e) => onUpdateBg({ vignette: Number(e.target.value) })}
            className="w-full accent-amber-500 bg-zinc-800 h-2 rounded-lg cursor-pointer"
          />
        </div>
      </div>

    </div>
  );
};
