import React from 'react';
import { WallpaperConfig, WordStyle, AspectRatioType } from '../types';
import {
  Sparkles,
  Check,
  MousePointerClick,
  CheckSquare,
  Square,
  ListChecks,
  XCircle,
  Layers,
  ChevronRight
} from 'lucide-react';

interface WallpaperCanvasProps {
  config: WallpaperConfig;
  selectedWordIds: string[];
  isMultiSelectMode: boolean;
  onToggleMultiSelectMode: () => void;
  onSelectWord: (word: WordStyle, language: 'telugu' | 'english', isMultiToggle?: boolean) => void;
  onSelectAllLanguage: (language: 'telugu' | 'english') => void;
  onClearSelection: () => void;
  scale?: number;
}

export const WallpaperCanvas: React.FC<WallpaperCanvasProps> = ({
  config,
  selectedWordIds,
  isMultiSelectMode,
  onToggleMultiSelectMode,
  onSelectWord,
  onSelectAllLanguage,
  onClearSelection,
}) => {
  const { background, aspectRatio } = config;

  // Aspect ratio aspect class / style
  const getAspectDimensions = (ratio: AspectRatioType) => {
    switch (ratio) {
      case '9:16':
        return { width: '380px', height: '675px', ratioValue: 9 / 16 };
      case '16:9':
        return { width: '640px', height: '360px', ratioValue: 16 / 9 };
      case '1:1':
        return { width: '480px', height: '480px', ratioValue: 1 };
      case '3:4':
        return { width: '420px', height: '560px', ratioValue: 3 / 4 };
      case '4:5':
        return { width: '400px', height: '500px', ratioValue: 4 / 5 };
      default:
        return { width: '380px', height: '675px', ratioValue: 9 / 16 };
    }
  };

  const dims = getAspectDimensions(aspectRatio);

  const getBackgroundStyle = (): React.CSSProperties => {
    if (background.type === 'image' && background.imageUrl) {
      return {
        backgroundImage: `url(${background.imageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: `blur(${background.blur}px) brightness(${background.brightness}%) contrast(${background.contrast}%) saturate(${background.saturation}%)`,
        transform: background.blur > 0 ? 'scale(1.08)' : 'scale(1)', // prevent white edges when blurring
      };
    } else if (background.type === 'gradient' && background.gradientColors.length > 0) {
      return {
        background: `linear-gradient(${background.gradientDirection}, ${background.gradientColors.join(', ')})`,
        filter: `brightness(${background.brightness}%) contrast(${background.contrast}%)`,
      };
    } else {
      return {
        backgroundColor: background.solidColor || '#0f172a',
      };
    }
  };

  const showTelugu = config.primaryLanguage === 'telugu' || config.primaryLanguage === 'parallel';
  const showEnglish = config.primaryLanguage === 'english' || config.primaryLanguage === 'parallel';

  const getAlignClass = (align: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'left': return 'text-left justify-start items-start';
      case 'right': return 'text-right justify-end items-end';
      case 'center': default: return 'text-center justify-center items-center';
    }
  };

  const getVerticalAlignClass = (vAlign: 'top' | 'center' | 'bottom') => {
    switch (vAlign) {
      case 'top': return 'justify-start pt-12';
      case 'bottom': return 'justify-end pb-12';
      case 'center': default: return 'justify-center';
    }
  };

  const hasMultipleSelected = selectedWordIds.length > 1;

  return (
    <div className="relative flex flex-col items-center justify-center w-full py-2 overflow-hidden select-none">
      
      {/* Multi-Selection Controls Bar */}
      <div className="w-full max-w-[540px] mb-3 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-black/85 border border-zinc-800 rounded-2xl backdrop-blur-md text-xs shadow-lg">
        
        {/* Toggle Multi-Select Mode Button */}
        <button
          id="btn-toggle-multiselect"
          onClick={onToggleMultiSelectMode}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
            isMultiSelectMode
              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
              : 'bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white border border-zinc-800'
          }`}
        >
          {isMultiSelectMode ? (
            <CheckSquare className="w-4 h-4 text-black" />
          ) : (
            <Square className="w-4 h-4 text-amber-400" />
          )}
          <span>Multi-Select {isMultiSelectMode ? 'Active' : 'Mode'}</span>
          {selectedWordIds.length > 0 && (
            <span className={`px-1.5 py-0.2 text-[11px] rounded-full font-bold ${
              isMultiSelectMode ? 'bg-black text-amber-300' : 'bg-amber-500/20 text-amber-400'
            }`}>
              {selectedWordIds.length}
            </span>
          )}
        </button>

        {/* Quick Bulk Selection Helpers */}
        <div className="flex items-center gap-1.5">
          {showTelugu && (
            <button
              onClick={() => onSelectAllLanguage('telugu')}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border border-zinc-800 text-[11px] font-medium transition cursor-pointer"
              title="Select all Telugu words"
            >
              All తెలుగు
            </button>
          )}

          {showEnglish && (
            <button
              onClick={() => onSelectAllLanguage('english')}
              className="px-2.5 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-amber-300 border border-zinc-800 text-[11px] font-medium transition cursor-pointer"
              title="Select all English words"
            >
              All English
            </button>
          )}

          {selectedWordIds.length > 0 && (
            <button
              onClick={onClearSelection}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-[11px] font-medium transition cursor-pointer"
              title="Clear all selections"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )}
        </div>

      </div>

      {/* Main Wallpaper Preview Stage */}
      <div
        id="wallpaper-preview-stage"
        className="relative transition-all duration-300 rounded-[28px] overflow-hidden shadow-2xl shadow-black/90 border-[6px] border-[#141417] ring-1 ring-zinc-800 bg-black flex flex-col"
        style={{
          width: dims.width,
          height: dims.height,
          maxWidth: '92vw',
          maxHeight: '72vh',
          aspectRatio: `${dims.ratioValue}`
        }}
      >
        {/* Layer 1: Background Layer with Dynamic Filters */}
        <div
          className="absolute inset-0 w-full h-full transition-all duration-200 pointer-events-none"
          style={getBackgroundStyle()}
        />

        {/* Layer 2: Scrim Overlay */}
        {background.scrimOpacity > 0 && (
          <div
            className="absolute inset-0 w-full h-full pointer-events-none transition-all"
            style={{
              backgroundColor: background.scrimColor,
              opacity: background.scrimOpacity,
            }}
          />
        )}

        {/* Layer 3: Vignette Effect */}
        {background.vignette > 0 && (
          <div
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, transparent 40%, rgba(0,0,0,${background.vignette * 0.85}) 100%)`,
            }}
          />
        )}

        {/* Layer 4: Typography & Word Interactive Flow */}
        <div
          className={`relative z-10 w-full h-full flex flex-col p-6 sm:p-8 overflow-y-auto no-scrollbar ${getVerticalAlignClass(config.verticalAlignment)}`}
        >
          {/* Telugu Verse Words */}
          {showTelugu && config.teluguWords.length > 0 && (
            <div className={`flex flex-wrap gap-x-1.5 gap-y-1.5 my-1 ${getAlignClass(config.layoutAlignment)}`}>
              {config.teluguWords.map((word) => {
                const isSelected = selectedWordIds.includes(word.id);
                const highlightBg = word.highlightColor && (word.highlightOpacity ?? 0) > 0
                  ? `${word.highlightColor}${Math.round((word.highlightOpacity ?? 0.4) * 255).toString(16).padStart(2, '0')}`
                  : 'transparent';

                return (
                  <button
                    key={word.id}
                    id={`word-te-${word.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const isMulti = isMultiSelectMode || e.shiftKey || e.metaKey || e.ctrlKey;
                      onSelectWord(word, 'telugu', isMulti);
                    }}
                    className={`relative group inline-flex items-center justify-center px-1.5 py-0.5 rounded cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95 ${
                      isSelected
                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black/90 shadow-lg shadow-amber-500/30 bg-amber-500/10'
                        : 'hover:bg-white/10'
                    }`}
                    style={{
                      backgroundColor: highlightBg !== 'transparent' ? highlightBg : undefined,
                    }}
                  >
                    <span
                      style={{
                        color: word.color,
                        fontSize: `${word.fontSizeSp}px`,
                        fontFamily: `"${word.fontFamily}", sans-serif`,
                        fontWeight: word.fontWeight,
                        fontStyle: word.isItalic ? 'italic' : 'normal',
                        textTransform: word.isAllCaps ? 'uppercase' : 'none',
                        textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                        lineHeight: 1.4,
                      }}
                    >
                      {word.text}
                    </span>

                    {/* Word active marker */}
                    {isSelected && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 text-black rounded-full flex items-center justify-center text-[9px] font-black shadow-md animate-in zoom-in-50">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Divider between Parallel Verses */}
          {config.showDivider && showTelugu && showEnglish && (
            <div className={`my-4 flex ${getAlignClass(config.layoutAlignment)}`}>
              <div
                className="h-0.5 rounded-full transition-all"
                style={{
                  width: `${config.dividerWidth || 60}px`,
                  backgroundColor: config.dividerColor || 'rgba(255,255,255,0.4)',
                }}
              />
            </div>
          )}

          {/* English Verse Words */}
          {showEnglish && config.englishWords.length > 0 && (
            <div className={`flex flex-wrap gap-x-1.5 gap-y-1.5 my-1 ${getAlignClass(config.layoutAlignment)}`}>
              {config.englishWords.map((word) => {
                const isSelected = selectedWordIds.includes(word.id);
                const highlightBg = word.highlightColor && (word.highlightOpacity ?? 0) > 0
                  ? `${word.highlightColor}${Math.round((word.highlightOpacity ?? 0.4) * 255).toString(16).padStart(2, '0')}`
                  : 'transparent';

                return (
                  <button
                    key={word.id}
                    id={`word-en-${word.id}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      const isMulti = isMultiSelectMode || e.shiftKey || e.metaKey || e.ctrlKey;
                      onSelectWord(word, 'english', isMulti);
                    }}
                    className={`relative group inline-flex items-center justify-center px-1.5 py-0.5 rounded cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95 ${
                      isSelected
                        ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black/90 shadow-lg shadow-amber-500/30 bg-amber-500/10'
                        : 'hover:bg-white/10'
                    }`}
                    style={{
                      backgroundColor: highlightBg !== 'transparent' ? highlightBg : undefined,
                    }}
                  >
                    <span
                      style={{
                        color: word.color,
                        fontSize: `${word.fontSizeSp}px`,
                        fontFamily: `"${word.fontFamily}", sans-serif`,
                        fontWeight: word.fontWeight,
                        fontStyle: word.isItalic ? 'italic' : 'normal',
                        textTransform: word.isAllCaps ? 'uppercase' : 'none',
                        textShadow: '0 2px 8px rgba(0,0,0,0.7)',
                        lineHeight: 1.4,
                      }}
                    >
                      {word.text}
                    </span>

                    {/* Word active marker */}
                    {isSelected && (
                      <span className="absolute -top-2 -right-2 w-4 h-4 bg-amber-400 text-black rounded-full flex items-center justify-center text-[9px] font-black shadow-md animate-in zoom-in-50">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Reference Badge */}
          {(config.referenceStyle.showTeluguRef || config.referenceStyle.showEnglishRef) && (
            <div className={`mt-5 flex ${getAlignClass(config.referenceAlignment)}`}>
              <div
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-md"
                style={{
                  color: config.referenceStyle.color || '#FBBF24',
                  fontSize: `${config.referenceStyle.fontSizeSp}px`,
                  fontFamily: `"${config.referenceStyle.fontFamily}", sans-serif`,
                  fontWeight: config.referenceStyle.fontWeight,
                  letterSpacing: '0.05em',
                }}
              >
                {config.referenceStyle.showTeluguRef && config.referenceTe && (
                  <span>{config.referenceTe}</span>
                )}
                {config.referenceStyle.showTeluguRef && config.referenceStyle.showEnglishRef && config.referenceTe && config.referenceEn && (
                  <span className="opacity-40">•</span>
                )}
                {config.referenceStyle.showEnglishRef && config.referenceEn && (
                  <span>{config.referenceEn}</span>
                )}
              </div>
            </div>
          )}

          {/* Optional Watermark */}
          {config.showWatermark && config.watermarkText && (
            <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] text-white/40 tracking-wider font-['Outfit'] pointer-events-none">
              {config.watermarkText}
            </div>
          )}
        </div>

        {/* Mobile Bezel speaker bar simulation */}
        {aspectRatio === '9:16' && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-white/20 rounded-full pointer-events-none z-20" />
        )}
      </div>

    </div>
  );
};
