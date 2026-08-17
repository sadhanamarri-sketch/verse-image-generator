export interface WordStyle {
  id: string;
  text: string;
  color: string;
  fontSizeSp: number;
  fontFamily: string;
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  isItalic: boolean;
  /** @deprecated use textTransform instead. Kept for backward compatibility. */
  isAllCaps?: boolean;
  textTransform?: 'none' | 'uppercase' | 'capitalize' | 'lowercase';
  textDecoration?: 'none' | 'underline';
  lineHeight?: number; // multiplier, e.g. 1.0 - 2.0
  highlightColor?: string; // Hex color with opacity or null
  highlightOpacity?: number; // 0 to 1
  highlightPaddingX?: number; // px, horizontal padding of the highlight box
  highlightPaddingY?: number; // px, vertical padding of the highlight box
  highlightRadius?: number; // px, corner radius of the highlight box
  shadowColor?: string;
  shadowBlur?: number; // px
  shadowOffsetX?: number; // px
  shadowOffsetY?: number; // px
  letterSpacing?: number; // em
  isHighlighted?: boolean;
}

export interface ParallelVerse {
  id: string;
  referenceEn: string;
  referenceTe: string;
  category: string;
  englishKjv: string;
  teluguBsi: string;
  themeNotes?: string;
}

export type AspectRatioType = '9:16' | '16:9' | '1:1' | '3:4' | '4:5' | 'custom';

export type LayoutMode = 'stacked-te-en' | 'stacked-en-te' | 'side-by-side' | 'telugu-only' | 'english-only';

export type DividerStyle = 'gold-line' | 'cross' | 'dots' | 'minimal' | 'ornament' | 'none';

export interface BackgroundConfig {
  type: 'image' | 'gradient' | 'solid';
  imageUrl: string;
  gradientColors: string[];
  gradientDirection: string;
  gradientType: 'linear' | 'radial';
  solidColor: string;
  scrimColor: string;
  scrimOpacity: number; // 0 to 1
  blur: number; // 0 to 40 px
  brightness: number; // 50 to 150 %
  contrast: number; // 50 to 150 %
  saturation: number; // 50 to 150 %
  vignette: number; // 0 to 1
  grain: boolean; // subtle film-grain texture overlay
}

export interface CardBackdropConfig {
  enabled: boolean;
  color: string; // hex color, opacity applied separately
  opacity: number; // 0 to 100
  blur: number; // 0 to 30 px (glass blur)
  border: boolean;
  borderColor: string;
  borderRadius: number; // px
  shadow: boolean;
}

export interface WallpaperConfig {
  aspectRatio: AspectRatioType;
  customWidth: number; // px, used when aspectRatio === 'custom'
  customHeight: number; // px, used when aspectRatio === 'custom'
  layoutMode: LayoutMode;
  layoutAlignment: 'left' | 'center' | 'right';
  verticalAlignment: 'top' | 'center' | 'bottom';
  referenceAlignment: 'left' | 'center' | 'right';
  padding: number;
  // Fine-grained layout controls
  containerMaxWidth: number; // percentage, 50 to 100
  sectionGap: number; // gap between Telugu & English blocks, in px
  wordSpacing: number; // gap between adjacent words on a line, in px
  verticalOffset: number; // -50 to 50, nudges content up/down
  horizontalOffset: number; // -50 to 50, nudges content left/right
  teluguWords: WordStyle[];
  englishWords: WordStyle[];
  referenceEn: string;
  referenceTe: string;
  referenceStyle: {
    color: string;
    fontSizeSp: number;
    fontFamily: string;
    fontWeight: '400' | '600' | '700';
    showTeluguRef: boolean;
    showEnglishRef: boolean;
    placement: 'top' | 'bottom' | 'integrated' | 'split';
    showBadge: boolean;
    badgeBg: string;
    badgeBorder: string;
    letterSpacing: number;
  };
  background: BackgroundConfig;
  cardBackdrop: CardBackdropConfig;
  showDivider: boolean;
  dividerColor: string;
  dividerWidth: number;
  dividerStyle: DividerStyle;
  showCross: boolean;
  crossColor: string;
  crossSize: number;
  quoteMarks: boolean;
  watermarkText?: string;
  showWatermark: boolean;
}
