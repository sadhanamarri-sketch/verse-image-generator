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
  ChevronRight,
  Cross,
  Quote,
} from 'lucide-react';

// Converts a #rrggbb hex color + 0-100 opacity into an rgba() string for translucent fills.
function hexToRgba(hex: string, opacityPct: number): string {
  let h = (hex || '#000000').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, opacityPct)) / 100})`;
}

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
      case 'custom': {
        const w = config.customWidth || 1080;
        const h = config.customHeight || 1920;
        const ratioValue = w / h;
        // Scale the preview to fit a reasonable on-screen box while preserving the custom ratio.
        const maxBoxPx = 480;
        const displayW = ratioValue >= 1 ? maxBoxPx : maxBoxPx * ratioValue;
        const displayH = ratioValue >= 1 ? maxBoxPx / ratioValue : maxBoxPx;
        return { width: `${Math.round(displayW)}px`, height: `${Math.round(displayH)}px`, ratioValue };
      }
      default:
        return { width: '380px', height: '675px', ratioValue: 9 / 16 };
    }
  };

  const dims = getAspectDimensions(aspectRatio);

  // Reference (citation) badge/plain-text renderer, shared by top & bottom placement
  const renderReference = () => {
    const ref = config.referenceStyle;
    if (!ref.showTeluguRef && !ref.showEnglishRef) return null;
    if (!config.referenceTe && !config.referenceEn) return null;

    const isIntegrated = ref.placement === 'integrated';

    const textStyle: React.CSSProperties = {
      color: ref.color || '#FBBF24',
      fontSize: `${ref.fontSizeSp}px`,
      fontFamily: `"${ref.fontFamily}", sans-serif`,
      fontWeight: ref.fontWeight,
      letterSpacing: `${ref.letterSpacing ?? 0.05}em`,
      fontStyle: isIntegrated ? 'italic' : 'normal',
    };

    const content = (
      <>
        {isIntegrated && <span className="opacity-70 mr-1">—</span>}
        {ref.showTeluguRef && config.referenceTe && <span>{config.referenceTe}</span>}
        {ref.showTeluguRef && ref.showEnglishRef && config.referenceTe && config.referenceEn && (
          <span className="opacity-40">•</span>
        )}
        {ref.showEnglishRef && config.referenceEn && <span>{config.referenceEn}</span>}
      </>
    );

    // Integrated mode always renders as plain woven-in text, never a badge.
    if (ref.showBadge && !isIntegrated) {
      return (
        <div className={`flex ${getAlignClass(config.referenceAlignment)}`}>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-md shadow-md"
            style={{
              backgroundColor: ref.badgeBg ?? 'rgba(0, 0, 0, 0.6)',
              border: `1px solid ${ref.badgeBorder ?? 'rgba(255, 255, 255, 0.1)'}`,
              ...textStyle,
            }}
          >
            {content}
          </div>
        </div>
      );
    }

    return (
      <div className={`flex ${getAlignClass(config.referenceAlignment)}`}>
        <p style={{ ...textStyle, textShadow: '0 2px 6px rgba(0,0,0,0.7)' }}>{content}</p>
      </div>
    );
  };

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
      const stops = background.gradientColors.filter(Boolean).join(', ');
      const gradientCss = background.gradientType === 'radial'
        ? `radial-gradient(circle, ${stops})`
        : `linear-gradient(${background.gradientDirection}, ${stops})`;
      return {
        background: gradientCss,
        filter: `brightness(${background.brightness}%) contrast(${background.contrast}%)`,
      };
    } else {
      return {
        backgroundColor: background.solidColor || '#0f172a',
      };
    }
  };

  const showTelugu = config.layoutMode !== 'english-only';
  const showEnglish = config.layoutMode !== 'telugu-only';
  const isSideBySide = config.layoutMode === 'side-by-side';
  const isEnglishFirst = config.layoutMode === 'stacked-en-te';

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

        {/* Layer 3b: Film Grain Texture */}
        {background.grain && (
          <div
            className="absolute inset-0 w-full h-full pointer-events-none mix-blend-overlay opacity-40"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
              backgroundRepeat: 'repeat',
            }}
          />
        )}

        {/* Layer 4: Typography & Word Interactive Flow */}
        <div
          className={`relative z-10 w-full h-full flex flex-col p-6 sm:p-8 overflow-y-auto no-scrollbar ${getVerticalAlignClass(config.verticalAlignment)}`}
          style={{
            padding: config.padding,
            transform: `translate(${config.horizontalOffset ?? 0}%, ${config.verticalOffset ?? 0}%)`,
          }}
        >
          {/* Content width constraint, centered within the padded stage */}
          <div
            className="w-full mx-auto flex flex-col transition-all"
            style={{
              maxWidth: `${config.containerMaxWidth ?? 100}%`,
              backgroundColor: config.cardBackdrop?.enabled
                ? hexToRgba(config.cardBackdrop.color, config.cardBackdrop.opacity)
                : 'transparent',
              backdropFilter: config.cardBackdrop?.enabled ? `blur(${config.cardBackdrop.blur}px)` : 'none',
              WebkitBackdropFilter: config.cardBackdrop?.enabled ? `blur(${config.cardBackdrop.blur}px)` : 'none',
              border: config.cardBackdrop?.enabled && config.cardBackdrop.border
                ? `1px solid ${hexToRgba(config.cardBackdrop.borderColor, 30)}`
                : 'none',
              borderRadius: config.cardBackdrop?.enabled ? `${config.cardBackdrop.borderRadius}px` : '0px',
              padding: config.cardBackdrop?.enabled ? '28px' : '0px',
              boxShadow: config.cardBackdrop?.enabled && config.cardBackdrop.shadow
                ? '0 20px 40px rgba(0,0,0,0.5)'
                : 'none',
            }}
          >
          {/* Optional Decorative Cross Icon */}
          {config.showCross && (
            <div className={`mb-4 flex ${getAlignClass(config.layoutAlignment)}`}>
              <div
                className="rounded-full p-2.5"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  boxShadow: `0 0 20px ${config.crossColor}40`,
                }}
              >
                <Cross
                  className="stroke-[1.5]"
                  style={{
                    height: `${config.crossSize}px`,
                    width: `${config.crossSize}px`,
                    color: config.crossColor,
                  }}
                />
              </div>
            </div>
          )}

          {/* Reference (Top Placement) */}
          {config.referenceStyle.placement === 'top' && (
            <div className="mb-4">{renderReference()}</div>
          )}

          {/* Decorative Opening Quote Mark */}
          {config.quoteMarks && (
            <div className={`flex ${getAlignClass(config.layoutAlignment)} -mb-2`}>
              <Quote
                className="fill-current opacity-30"
                style={{ width: 28, height: 28, color: config.dividerColor || '#FBBF24', transform: 'scaleX(-1)' }}
              />
            </div>
          )}

          {(() => {
            const renderWordBlock = (words: WordStyle[], language: 'telugu' | 'english') => (
              <div
                className={`flex flex-wrap gap-x-1.5 gap-y-1.5 ${getAlignClass(config.layoutAlignment)}`}
                style={{ marginTop: (config.sectionGap ?? 16) / 2, marginBottom: (config.sectionGap ?? 16) / 2 }}
              >
                {words.map((word) => {
                  const isSelected = selectedWordIds.includes(word.id);
                  const highlightBg = word.highlightColor && (word.highlightOpacity ?? 0) > 0
                    ? `${word.highlightColor}${Math.round((word.highlightOpacity ?? 0.4) * 255).toString(16).padStart(2, '0')}`
                    : 'transparent';
                  const padX = word.highlightPaddingX ?? 6;
                  const padY = word.highlightPaddingY ?? 2;
                  const radius = word.highlightRadius ?? 4;
                  const shadowColor = word.shadowColor ?? 'rgba(0,0,0,0.7)';
                  const shadowBlur = word.shadowBlur ?? 8;
                  const shadowOffsetX = word.shadowOffsetX ?? 0;
                  const shadowOffsetY = word.shadowOffsetY ?? 2;
                  // Fall back to the legacy isAllCaps flag for configs created before textTransform existed.
                  const textTransform = word.textTransform ?? (word.isAllCaps ? 'uppercase' : 'none');

                  return (
                    <button
                      key={word.id}
                      id={`word-${language === 'telugu' ? 'te' : 'en'}-${word.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        const isMulti = isMultiSelectMode || e.shiftKey || e.metaKey || e.ctrlKey;
                        onSelectWord(word, language, isMulti);
                      }}
                      className={`relative group inline-flex items-center justify-center cursor-pointer transition-all duration-150 transform hover:scale-105 active:scale-95 ${
                        isSelected
                          ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black/90 shadow-lg shadow-amber-500/30 bg-amber-500/10'
                          : 'hover:bg-white/10'
                      }`}
                      style={{
                        backgroundColor: highlightBg !== 'transparent' ? highlightBg : undefined,
                        paddingLeft: highlightBg !== 'transparent' ? padX : 6,
                        paddingRight: highlightBg !== 'transparent' ? padX : 6,
                        paddingTop: highlightBg !== 'transparent' ? padY : 2,
                        paddingBottom: highlightBg !== 'transparent' ? padY : 2,
                        borderRadius: highlightBg !== 'transparent' ? radius : 4,
                      }}
                    >
                      <span
                        style={{
                          color: word.color,
                          fontSize: `${word.fontSizeSp}px`,
                          fontFamily: `"${word.fontFamily}", sans-serif`,
                          fontWeight: word.fontWeight,
                          fontStyle: word.isItalic ? 'italic' : 'normal',
                          textTransform,
                          textDecoration: word.textDecoration === 'underline' ? 'underline' : 'none',
                          textShadow: `${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor}`,
                          lineHeight: word.lineHeight ?? 1.4,
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
            );

            const divider = config.showDivider && showTelugu && showEnglish && (() => {
              const style = config.dividerStyle ?? 'minimal';
              const color = config.dividerColor || 'rgba(255,255,255,0.4)';
              const alignClass = getAlignClass(config.layoutAlignment);
              const gapStyle = { marginTop: config.sectionGap ?? 16, marginBottom: config.sectionGap ?? 16 };

              if (style === 'none') return null;

              if (style === 'cross') {
                return (
                  <div className={`flex items-center gap-3 opacity-90 ${alignClass}`} style={gapStyle}>
                    <div className="h-px w-14" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
                    <Cross className="w-4 h-4" style={{ color }} />
                    <div className="h-px w-14" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
                  </div>
                );
              }

              if (style === 'dots') {
                return (
                  <div className={`flex items-center gap-2 opacity-85 ${alignClass}`} style={gapStyle}>
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                    <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
                  </div>
                );
              }

              if (style === 'gold-line') {
                return (
                  <div className={`flex ${alignClass}`} style={gapStyle}>
                    <div
                      className="h-[2px] rounded-full"
                      style={{
                        width: `${config.dividerWidth || 60}px`,
                        background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                      }}
                    />
                  </div>
                );
              }

              if (style === 'ornament') {
                return (
                  <div className={`flex items-center gap-2 opacity-90 ${alignClass}`} style={gapStyle}>
                    <div className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${color})` }} />
                    <span style={{ color, fontSize: '13px', lineHeight: 1 }}>❧</span>
                    <div className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${color})` }} />
                  </div>
                );
              }

              // minimal (default)
              return (
                <div className={`flex ${alignClass}`} style={gapStyle}>
                  <div
                    className="h-0.5 rounded-full"
                    style={{ width: `${config.dividerWidth || 60}px`, backgroundColor: color }}
                  />
                </div>
              );
            })();

            const teluguBlock = showTelugu && config.teluguWords.length > 0 && renderWordBlock(config.teluguWords, 'telugu');
            const englishBlock = showEnglish && config.englishWords.length > 0 && renderWordBlock(config.englishWords, 'english');

            // Side-by-side: two columns, Telugu left / English right, own scroll each
            if (isSideBySide && showTelugu && showEnglish) {
              return (
                <div className="flex flex-row w-full items-start justify-center" style={{ gap: config.sectionGap ?? 16 }}>
                  <div className="flex-1 min-w-0">{teluguBlock}</div>
                  <div className="w-px self-stretch bg-white/15 rounded-full" />
                  <div className="flex-1 min-w-0">{englishBlock}</div>
                </div>
              );
            }

            // Stacked: order depends on layoutMode (Telugu-first vs English-first)
            const first = isEnglishFirst ? englishBlock : teluguBlock;
            const second = isEnglishFirst ? teluguBlock : englishBlock;

            return (
              <>
                {first}
                {divider}
                {second}
              </>
            );
          })()}

          {/* Decorative Closing Quote Mark */}
          {config.quoteMarks && (
            <div className={`flex ${getAlignClass(config.layoutAlignment)} -mt-2`}>
              <Quote
                className="fill-current opacity-30"
                style={{ width: 28, height: 28, color: config.dividerColor || '#FBBF24' }}
              />
            </div>
          )}

          {/* Reference (Bottom / Integrated Placement) */}
          {config.referenceStyle.placement !== 'top' && (
            <div className={config.referenceStyle.placement === 'integrated' ? 'mt-1.5' : 'mt-5'}>
              {renderReference()}
            </div>
          )}
          </div>

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
