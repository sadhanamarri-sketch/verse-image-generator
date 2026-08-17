export interface WordStyle {
  id: string;
  text: string;
  color: string;
  fontSizeSp: number;
  fontFamily: string;
  fontWeight: '300' | '400' | '500' | '600' | '700' | '800' | '900';
  isItalic: boolean;
  isAllCaps: boolean;
  highlightColor?: string; // Hex color with opacity or null
  highlightOpacity?: number; // 0 to 1
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

export type AspectRatioType = '9:16' | '16:9' | '1:1' | '3:4' | '4:5';

export interface BackgroundConfig {
  type: 'image' | 'gradient' | 'solid';
  imageUrl: string;
  gradientColors: string[];
  gradientDirection: string;
  solidColor: string;
  scrimColor: string;
  scrimOpacity: number; // 0 to 1
  blur: number; // 0 to 40 px
  brightness: number; // 50 to 150 %
  contrast: number; // 50 to 150 %
  saturation: number; // 50 to 150 %
  vignette: number; // 0 to 1
}

export interface WallpaperConfig {
  aspectRatio: AspectRatioType;
  primaryLanguage: 'telugu' | 'english' | 'parallel';
  layoutAlignment: 'left' | 'center' | 'right';
  verticalAlignment: 'top' | 'center' | 'bottom';
  referenceAlignment: 'left' | 'center' | 'right';
  padding: number;
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
  };
  background: BackgroundConfig;
  showDivider: boolean;
  dividerColor: string;
  dividerWidth: number;
  watermarkText?: string;
  showWatermark: boolean;
}
