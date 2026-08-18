import { WallpaperConfig, AspectRatioType, WordStyle } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface ExportResolution {
  width: number;
  height: number;
  label: string;
}

// Mirrors WallpaperCanvas.tsx's getAspectDimensions() on-screen preview box widths.
// The live preview draws text at literal `fontSizeSp` pixels inside a box of this
// width (only `padding` is pre-scaled against it) — so for the export to reproduce
// the exact same line-wrapping and proportions the user sees on screen, it must
// scale everything off the SAME reference width the preview box actually uses,
// not an arbitrary constant. Keep this in sync with getAspectDimensions().
function getPreviewReferenceWidth(config: WallpaperConfig): number {
  switch (config.aspectRatio) {
    case '9:16': return 380;
    case '16:9': return 640;
    case '1:1': return 480;
    case '3:4': return 420;
    case '4:5': return 400;
    case 'custom': {
      const w = config.customWidth || 1080;
      const h = config.customHeight || 1920;
      const ratioValue = w / h;
      const maxBoxPx = 480;
      return ratioValue >= 1 ? maxBoxPx : maxBoxPx * ratioValue;
    }
    default: return 380;
  }
}

// Reference numerals (chapter:verse, verse ranges) always render in this plain,
// standard-digit font rather than the reference's decorative fontFamily —
// display fonts (especially Telugu ones) often carry stylized or script-look
// digits that read as "off" next to a normal citation number.
const STANDARD_NUMERAL_FONT = 'Inter';

// Splits a reference string like "యోహాను 3:16" or "John 3:16-18" into
// alternating text/numeric runs so each can be drawn with its own font.
function splitRefSegments(text: string): { text: string; isNumeric: boolean }[] {
  const parts = text.split(/(\d+(?:[:\-–,]\d+)*)/g);
  return parts.filter((p) => p.length > 0).map((p) => ({ text: p, isNumeric: /^\d[\d:\-–,]*\d$|^\d$/.test(p) }));
}

/**
 * Converts a #rrggbb hex color + 0-100 opacity into an rgba() string.
 * Mirrors WallpaperCanvas.tsx's hexToRgba so the card backdrop tint matches
 * the preview exactly.
 */
function hexToRgbaLocal(hex: string, opacityPct: number): string {
  let h = (hex || '#000000').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const r = parseInt(h.substring(0, 2), 16) || 0;
  const g = parseInt(h.substring(2, 4), 16) || 0;
  const b = parseInt(h.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(100, opacityPct)) / 100})`;
}

/**
 * Traces a rounded-rectangle path on the given context (manual implementation
 * for broad WebView compatibility, since ctx.roundRect isn't universally supported).
 */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.arcTo(x + w, y, x + w, y + radius, radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.arcTo(x + w, y + h, x + w - radius, y + h, radius);
  ctx.lineTo(x + radius, y + h);
  ctx.arcTo(x, y + h, x, y + h - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

export function getResolutionForAspect(aspectRatio: AspectRatioType, quality: 'standard' | 'ultra' = 'standard'): ExportResolution {
  if (quality === 'ultra') {
    switch (aspectRatio) {
      case '9:16': return { width: 1440, height: 3120, label: 'Ultra Mobile 1440x3120 (WQHD+)' };
      case '16:9': return { width: 3840, height: 2160, label: '4K Desktop 3840x2160' };
      case '1:1': return { width: 2048, height: 2048, label: 'High-Res Square 2048x2048' };
      case '3:4': return { width: 1800, height: 2400, label: 'Tablet 1800x2400' };
      case '4:5': return { width: 1440, height: 1800, label: 'Social 1440x1800' };
    }
  }

  // Standard high-res (Full HD)
  switch (aspectRatio) {
    case '9:16': return { width: 1080, height: 1920, label: 'Full HD Mobile 1080x1920' };
    case '16:9': return { width: 1920, height: 1080, label: 'Full HD Desktop 1920x1080' };
    case '1:1': return { width: 1200, height: 1200, label: 'HD Square 1200x1200' };
    case '3:4': return { width: 1200, height: 1600, label: 'HD Tablet 1200x1600' };
    case '4:5': return { width: 1080, height: 1350, label: 'Portrait Social 1080x1350' };
  }
}

/**
 * Loads an image URL into an HTMLImageElement safely with CORS.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    img.onload = () => resolve(img);
    img.onerror = () => {
      // Fallback without crossOrigin if CORS failed
      const fallback = new Image();
      fallback.onload = () => resolve(fallback);
      fallback.onerror = (e) => reject(e);
      fallback.src = url;
    };
    img.src = url;
  });
}

/**
 * High-precision canvas export matching the Android Native Canvas static layout drawing.
 */
export async function renderWallpaperToCanvas(
  config: WallpaperConfig,
  quality: 'standard' | 'ultra' = 'standard'
): Promise<HTMLCanvasElement> {
  const { width, height } = getResolutionForAspect(config.aspectRatio, quality);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });

  if (!ctx) {
    throw new Error('Canvas 2D context not supported');
  }

  // Enable crisp text rendering
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 0. Ensure every custom web font this render will use is fully downloaded
  // before we measure or draw a single word. The Google Fonts <link> uses
  // `display=swap`, so on a fast/first export the font may still be mid-download:
  // ctx.measureText() would silently measure with the fallback system font while
  // ctx.fillText() moments later draws with the real (differently-sized) font once
  // it swaps in — the two widths disagree and words creep backward, overlapping
  // the word before them. Explicitly loading + awaiting document.fonts.ready keeps
  // measurement and drawing consistent.
  try {
    const previewScale = width / getPreviewReferenceWidth(config);
    const fontSpecs = new Set<string>();
    const addSpec = (family: string, weight: string, italic: boolean, sizeSp: number) => {
      const sizePx = Math.max(1, Math.round(sizeSp * previewScale));
      fontSpecs.add(`${italic ? 'italic ' : ''}${weight} ${sizePx}px "${family}"`);
    };
    config.teluguWords.forEach(w => addSpec(w.fontFamily, w.fontWeight, w.isItalic, w.fontSizeSp));
    config.englishWords.forEach(w => addSpec(w.fontFamily, w.fontWeight, w.isItalic, w.fontSizeSp));
    addSpec(config.referenceStyle.fontFamily, config.referenceStyle.fontWeight, false, config.referenceStyle.fontSizeSp);
    addSpec('Outfit', '500', false, 11);

    if (document.fonts) {
      await Promise.all(Array.from(fontSpecs).map(spec => document.fonts.load(spec).catch(() => {})));
      await document.fonts.ready;
    }
  } catch {
    // Font Loading API unavailable in this WebView — proceed with best-effort metrics.
  }

  // 1. Draw Background
  const bg = config.background;
  if (bg.type === 'image' && bg.imageUrl) {
    try {
      const img = await loadImage(bg.imageUrl);
      
      // Calculate cover dimensions
      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let renderWidth = width;
      let renderHeight = height;
      let offsetX = 0;
      let offsetY = 0;

      if (imgRatio > canvasRatio) {
        renderHeight = height;
        renderWidth = height * imgRatio;
        offsetX = (width - renderWidth) / 2;
      } else {
        renderWidth = width;
        renderHeight = width / imgRatio;
        offsetY = (height - renderHeight) / 2;
      }

      ctx.save();
      // Apply filters if needed
      const filters = [];
      if (bg.blur > 0) {
        // scale blur relative to canvas width
        const scaledBlur = (bg.blur * (width / getPreviewReferenceWidth(config)));
        filters.push(`blur(${scaledBlur}px)`);
      }
      if (bg.brightness !== 100) filters.push(`brightness(${bg.brightness}%)`);
      if (bg.contrast !== 100) filters.push(`contrast(${bg.contrast}%)`);
      if (bg.saturation !== 100) filters.push(`saturate(${bg.saturation}%)`);

      if (filters.length > 0) {
        ctx.filter = filters.join(' ');
      }

      ctx.drawImage(img, offsetX, offsetY, renderWidth, renderHeight);
      ctx.restore();
    } catch {
      // Fallback background color if image load fails
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, width, height);
    }
  } else if (bg.type === 'gradient' && bg.gradientColors.length > 0) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    bg.gradientColors.forEach((col, idx) => {
      gradient.addColorStop(idx / (bg.gradientColors.length - 1), col);
    });
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = bg.solidColor || '#0F172A';
    ctx.fillRect(0, 0, width, height);
  }

  // 2. Draw Scrim Overlay
  if (bg.scrimOpacity > 0) {
    ctx.save();
    ctx.fillStyle = bg.scrimColor || '#000000';
    ctx.globalAlpha = bg.scrimOpacity;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 3. Draw Vignette if specified
  if (bg.vignette && bg.vignette > 0) {
    ctx.save();
    const radial = ctx.createRadialGradient(
      width / 2, height / 2, width * 0.25,
      width / 2, height / 2, Math.max(width, height) * 0.7
    );
    radial.addColorStop(0, 'rgba(0,0,0,0)');
    radial.addColorStop(1, `rgba(0,0,0,${bg.vignette * 0.85})`);
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 3b. Draw Film Grain Texture (matches the preview's tiled SVG turbulence
  // overlay, approximated here as tiled random noise composited with
  // 'overlay' blending at the same 0.4 opacity).
  if (bg.grain) {
    const tileSize = 120;
    const noiseCanvas = document.createElement('canvas');
    noiseCanvas.width = tileSize;
    noiseCanvas.height = tileSize;
    const nctx = noiseCanvas.getContext('2d');
    if (nctx) {
      const imgData = nctx.createImageData(tileSize, tileSize);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const v = Math.floor(Math.random() * 255);
        imgData.data[i] = v;
        imgData.data[i + 1] = v;
        imgData.data[i + 2] = v;
        imgData.data[i + 3] = 255;
      }
      nctx.putImageData(imgData, 0, 0);
      const pattern = ctx.createPattern(noiseCanvas, 'repeat');
      if (pattern) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }
    }
  }

  // 4. Compute Dynamic Typography Metrics
  // `scale` reproduces the live preview's RAW (unscaled) CSS pixel values — font
  // sizes, word spacing, highlight/shadow sizing, reference styling, etc. are all
  // set as literal `Npx` in the preview with no adjustment for the preview box's
  // on-screen size, so matching them here means scaling off the same reference
  // width the preview box actually renders at for this aspect ratio.
  //
  // `padding` is the one exception: the preview deliberately pre-scales it by
  // (boxWidth / 400) before applying it (see WallpaperCanvas.tsx), so it must be
  // reproduced with that same /400 reference instead of `scale`, or the padded
  // content width drifts from the preview.
  const scale = width / getPreviewReferenceWidth(config);
  const paddingScale = width / 400;
  const paddingX = (config.padding ?? 24) * paddingScale;
  // Content Max Width narrows the text column (like the live preview's CSS maxWidth)
  // and centers it within the outer padded safe area.
  const availableWidth = width - (paddingX * 2);
  const outerContentWidth = availableWidth * ((config.containerMaxWidth ?? 100) / 100);
  const outerContentOffsetX = paddingX + (availableWidth - outerContentWidth) / 2;

  // When the card backdrop is enabled, the preview's card div uses a fixed
  // 28px inner padding (border-box), which eats into the space available to
  // the actual words/reference/etc inside it. Mirror that here so the text
  // wraps at the same width as the preview.
  const cardEnabled = !!config.cardBackdrop?.enabled;
  const cardPad = cardEnabled ? 28 * scale : 0;
  const maxContentWidth = outerContentWidth - cardPad * 2;
  const contentOffsetX = outerContentOffsetX + cardPad;

  // Measure and layout text items
  const showTe = config.layoutMode !== 'english-only';
  const showEn = config.layoutMode !== 'telugu-only';
  const isSideBySide = config.layoutMode === 'side-by-side';
  const isEnglishFirst = config.layoutMode === 'stacked-en-te';

  // Helper for word wrapping with per-word custom styling
  interface WordRenderMeta {
    text: string;
    color: string;
    font: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    isItalic: boolean;
    textDecoration?: 'none' | 'underline';
    lineHeight: number;
    highlightColor?: string;
    highlightOpacity?: number;
    highlightPaddingX: number;
    highlightPaddingY: number;
    highlightRadius: number;
    shadowColor: string;
    shadowBlur: number;
    shadowOffsetX: number;
    shadowOffsetY: number;
    width: number;
    height: number;
    // Horizontal padding this word occupies in the preview's word "button"
    // (highlightPaddingX when highlighted, or the CSS fallback of 3px when
    // not — every word button carries this padding whether highlighted or
    // not). Included in boxWidth so wrapping/centering match the preview.
    layoutPadX: number;
    boxWidth: number;
    // Same idea, vertically: paddingTop/Bottom on the button (highlightPaddingY
    // when highlighted, else a 2px CSS fallback) adds to each wrapped row's
    // real height in the preview.
    layoutPadY: number;
    rowHeight: number;
    x?: number;
    y?: number;
  }

  // Applies the word's textTransform (falling back to the legacy isAllCaps
  // boolean for configs created before textTransform existed).
  const applyTextTransform = (text: string, w: WordStyle): string => {
    const transform = w.textTransform ?? (w.isAllCaps ? 'uppercase' : 'none');
    switch (transform) {
      case 'uppercase': return text.toUpperCase();
      case 'lowercase': return text.toLowerCase();
      case 'capitalize': return text.replace(/\b\w/g, (c) => c.toUpperCase());
      default: return text;
    }
  };

  const prepareWords = (words: typeof config.teluguWords): WordRenderMeta[] => {
    return words.map(w => {
      const fontSize = Math.round(w.fontSizeSp * scale);
      const font = `${w.isItalic ? 'italic ' : ''}${w.fontWeight} ${fontSize}px "${w.fontFamily}", sans-serif`;
      ctx.font = font;
      const textToDraw = applyTextTransform(w.text, w);
      const metrics = ctx.measureText(textToDraw);
      const lineHeight = w.lineHeight ?? 1.3;
      // Mirrors WallpaperCanvas.tsx's per-word <button>: paddingLeft/Right is
      // highlightPaddingX when highlighted, otherwise a hardcoded 3px — that
      // 3px fallback still widens every plain word's box in the preview, so
      // it must be included here or the canvas underestimates line width and
      // wraps later than the preview does.
      const hasHighlight = !!w.highlightColor && (w.highlightOpacity ?? 0) > 0;
      const layoutPadX = (hasHighlight ? (w.highlightPaddingX ?? 4) : 3) * scale;
      const layoutPadY = (hasHighlight ? (w.highlightPaddingY ?? 2) : 2) * scale;
      const wordHeight = fontSize * lineHeight;
      return {
        text: textToDraw,
        color: w.color,
        font,
        fontSize,
        fontFamily: w.fontFamily,
        fontWeight: w.fontWeight,
        isItalic: w.isItalic,
        textDecoration: w.textDecoration ?? 'none',
        lineHeight,
        highlightColor: w.highlightColor,
        highlightOpacity: w.highlightOpacity,
        highlightPaddingX: (w.highlightPaddingX ?? 4) * scale,
        highlightPaddingY: (w.highlightPaddingY ?? 2) * scale,
        highlightRadius: (w.highlightRadius ?? 4) * scale,
        shadowColor: w.shadowColor ?? 'rgba(0, 0, 0, 0.65)',
        shadowBlur: (w.shadowBlur ?? 8) * scale,
        shadowOffsetX: (w.shadowOffsetX ?? 0) * scale,
        shadowOffsetY: (w.shadowOffsetY ?? 2) * scale,
        width: metrics.width,
        height: wordHeight,
        layoutPadX,
        boxWidth: metrics.width + layoutPadX * 2,
        layoutPadY,
        rowHeight: wordHeight + layoutPadY * 2
      };
    });
  };

  const layoutParagraph = (wordMetas: WordRenderMeta[], maxWidth: number) => {
    const lines: WordRenderMeta[][] = [];
    let currentLine: WordRenderMeta[] = [];
    let currentLineWidth = 0;
    const spaceWidth = (config.wordSpacing ?? 10) * scale;

    for (const w of wordMetas) {
      if (currentLine.length > 0 && currentLineWidth + spaceWidth + w.boxWidth > maxWidth) {
        lines.push(currentLine);
        currentLine = [w];
        currentLineWidth = w.boxWidth;
      } else {
        currentLine.push(w);
        currentLineWidth += (currentLine.length === 1 ? 0 : spaceWidth) + w.boxWidth;
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
    return lines;
  };

  const teluguWordsMeta = showTe ? prepareWords(config.teluguWords) : [];
  const englishWordsMeta = showEn ? prepareWords(config.englishWords) : [];

  const columnGap = 24 * scale;
  const colWidth = (maxContentWidth - columnGap) / 2;
  const wrapWidth = isSideBySide ? colWidth : maxContentWidth;

  const teluguLines = showTe ? layoutParagraph(teluguWordsMeta, wrapWidth) : [];
  const englishLines = showEn ? layoutParagraph(englishWordsMeta, wrapWidth) : [];

  // Calculate total height needed.
  // `wrapLineGap` matches the preview's flex-wrap `gap-y-1.5` (6px) between
  // wrapped lines of the SAME paragraph. `sectionSpacing` matches the gap the
  // preview produces between the Telugu and English blocks (their combined
  // marginTop/marginBottom), so it now tracks config.sectionGap instead of a
  // hardcoded constant.
  const wrapLineGap = 6 * scale;
  const sectionSpacing = (config.sectionGap ?? 16) * scale;

  let totalContentHeight = 0;
  const getLinesHeight = (lines: WordRenderMeta[][]) => {
    return lines.reduce((acc, line, idx) => {
      const maxH = Math.max(...line.map(w => w.rowHeight), 20 * scale);
      return acc + maxH + (idx < lines.length - 1 ? wrapLineGap : 0);
    }, 0);
  };

  const teHeight = showTe ? getLinesHeight(teluguLines) : 0;
  const enHeight = showEn ? getLinesHeight(englishLines) : 0;
  const dividerShown = config.showDivider && showTe && showEn && !isSideBySide;
  const dividerHeight = dividerShown ? 8 * scale : 0;
  // The preview's word blocks (renderWordBlock) always carry sectionGap/2
  // margin top+bottom. When a divider is shown, the divider itself ALSO
  // carries a full sectionGap margin top+bottom (see WallpaperCanvas.tsx's
  // `gapStyle`). Flexbox doesn't collapse margins between siblings, so with
  // a divider the true gap is block(sectionGap/2) + divider(sectionGap) +
  // divider(sectionGap) + block(sectionGap/2) = 3× sectionGap; without one
  // it's just block(sectionGap/2) + block(sectionGap/2) = 1× sectionGap.
  const interBlockSpacing = (showTe && showEn) ? (dividerShown ? sectionSpacing * 3 : sectionSpacing) : 0;
  const showRef = (config.referenceStyle.showTeluguRef || config.referenceStyle.showEnglishRef)
    && (!!config.referenceTe || !!config.referenceEn);
  const isRefOnTop = config.referenceStyle.placement === 'top';
  const isRefIntegrated = config.referenceStyle.placement === 'integrated';
  const isRefSplit = config.referenceStyle.placement === 'split';
  // Split only makes sense when Telugu and English are stacked one above the
  // other; for side-by-side or single-language layouts it falls back to a
  // single combined block at the bottom (same as 'bottom' placement).
  const canSplit = isRefSplit && showTe && showEn && !isSideBySide;
  // Integrated mode sits tight against the verse text, like an inline citation,
  // rather than occupying its own separated block.
  const refGap = isRefIntegrated ? 6 * scale : 16 * scale;
  const singleRefBlockHeight = (36 * scale) + refGap;

  // In split mode, whichever language is drawn first (top of the stack) gets
  // its own reference above it, and whichever is drawn second (bottom of the
  // stack) gets its own reference below it — each only if that language's ref
  // toggle is on and it has text.
  const splitTopText = isEnglishFirst ? config.referenceEn : config.referenceTe;
  const splitBottomText = isEnglishFirst ? config.referenceTe : config.referenceEn;
  const splitTopShown = isEnglishFirst ? config.referenceStyle.showEnglishRef : config.referenceStyle.showTeluguRef;
  const splitBottomShown = isEnglishFirst ? config.referenceStyle.showTeluguRef : config.referenceStyle.showEnglishRef;
  const splitTopHeight = (canSplit && splitTopShown && splitTopText) ? singleRefBlockHeight : 0;
  const splitBottomHeight = (canSplit && splitBottomShown && splitBottomText) ? singleRefBlockHeight : 0;

  const refHeight = canSplit
    ? splitTopHeight + splitBottomHeight
    : (showRef ? singleRefBlockHeight : 0);

  // Decorative extras (cross icon, quote marks) add their own height, matching
  // the preview's icon size + margin (cross: mb-4 ≈ 16px; quote marks: 28px
  // icon each, tightened by -mb-2/-mt-2 ≈ 8px overlap into the text below/above).
  // Circle around the cross icon has its own 10px padding (`rounded-full
  // p-2.5`) on top of the icon size, plus the block's own 16px bottom margin
  // (`mb-4`) — both must be reserved, not just the margin.
  const crossBlockHeight = config.showCross ? (config.crossSize * scale) + (20 * scale) + (16 * scale) : 0;
  const quoteMarkHeight = config.quoteMarks ? (28 * scale) - (8 * scale) : 0;
  const decorHeight = crossBlockHeight + quoteMarkHeight * 2;

  totalContentHeight = (isSideBySide
    ? Math.max(teHeight, enHeight) + refHeight
    : teHeight + enHeight + dividerHeight + refHeight + interBlockSpacing)
    + decorHeight + cardPad * 2;

  // Determine starting Y based on vertical alignment.
  // Preview uses fixed Tailwind `pt-12`/`pb-12` (48px raw CSS px on the
  // preview box) for top/bottom — not a percentage of the box's height — so
  // it must be scaled the same way every other raw pixel value in this file
  // is (by `scale`, off the preview's reference width), not by canvas height.
  // The old `height * 0.18` / `height * 0.15` badly overshot this (e.g. at
  // 1080×1920 it placed content ~345px/288px from the edge instead of ~136px).
  let currentY = (height - totalContentHeight) / 2;
  if (config.verticalAlignment === 'top') {
    currentY = 48 * scale;
  } else if (config.verticalAlignment === 'bottom') {
    currentY = height - totalContentHeight - (48 * scale);
  }

  // Draws the reference (citation) badge or plain text, baseline at y. Honors
  // placement/badge/color/letter-spacing from config.referenceStyle. Pass
  // soloText for split mode to draw just one language's reference instead of
  // the usual Telugu+English joined string.
  const drawReferenceBlock = (y: number, soloText?: string) => {
    if (!showRef) return;
    const refStyle = config.referenceStyle;
    let joined: string;
    if (soloText !== undefined) {
      joined = soloText;
    } else {
      const parts: string[] = [];
      if (refStyle.showTeluguRef && config.referenceTe) parts.push(config.referenceTe);
      if (refStyle.showEnglishRef && config.referenceEn) parts.push(config.referenceEn);
      joined = parts.join(' • ');
    }
    if (!joined) return;
    // Integrated placement reads as an inline citation woven right after the verse text.
    const refString = isRefIntegrated ? `— ${joined}` : joined;

    // Everything below mutates ctx state (font, textAlign, letterSpacing). Scope it
    // to this call so it can't leak into whatever draws next — critical when
    // placement is 'top', since this runs *before* the verse words are drawn.
    ctx.save();

    const refFontSize = Math.round(refStyle.fontSizeSp * scale);
    const textFont = `${isRefIntegrated ? 'italic ' : ''}${refStyle.fontWeight} ${refFontSize}px "${refStyle.fontFamily}", sans-serif`;
    const numFont = `${isRefIntegrated ? 'italic ' : ''}${refStyle.fontWeight} ${refFontSize}px "${STANDARD_NUMERAL_FONT}", sans-serif`;

    // Approximate letter-spacing (supported on modern Chromium-based WebViews)
    const letterSpacingPx = (refStyle.letterSpacing ?? 0.05) * refFontSize;
    if ('letterSpacing' in ctx) {
      (ctx as any).letterSpacing = `${letterSpacingPx}px`;
    }

    // Numbers (chapter:verse) are drawn in a plain standard-digit font, kept
    // separate from the surrounding text which uses the chosen reference font.
    const segments = splitRefSegments(refString);
    const segmentWidth = (s: { text: string; isNumeric: boolean }) => {
      ctx.font = s.isNumeric ? numFont : textFont;
      return ctx.measureText(s.text).width;
    };
    const textWidth = segments.reduce((sum, s) => sum + segmentWidth(s), 0);
    ctx.textAlign = 'left';

    let refX = width / 2 - textWidth / 2;
    if (config.referenceAlignment === 'left') refX = contentOffsetX;
    if (config.referenceAlignment === 'right') refX = contentOffsetX + maxContentWidth - textWidth;

    if (refStyle.showBadge && !isRefIntegrated) {
      // Preview badge is Tailwind `px-3 py-1` = 12px horizontal / 4px vertical
      // padding — not 14/8.
      const padX = 12 * scale;
      const padY = 4 * scale;
      const badgeWidth = textWidth + padX * 2;
      const badgeHeight = refFontSize + padY * 2;

      let badgeLeft: number;
      if (config.referenceAlignment === 'left') badgeLeft = contentOffsetX;
      else if (config.referenceAlignment === 'right') badgeLeft = contentOffsetX + maxContentWidth - badgeWidth;
      else badgeLeft = contentOffsetX + (maxContentWidth - badgeWidth) / 2;

      const badgeTop = y - refFontSize * 0.85 - padY;

      ctx.save();
      ctx.fillStyle = refStyle.badgeBg || 'rgba(0, 0, 0, 0.6)';
      ctx.strokeStyle = refStyle.badgeBorder || 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = Math.max(1, scale);
      roundRectPath(ctx, badgeLeft, badgeTop, badgeWidth, badgeHeight, badgeHeight / 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Badge alignment centers the badge itself; re-center the text run within it.
      if (config.referenceAlignment === 'center') refX = badgeLeft + padX;
      else if (config.referenceAlignment === 'left') refX = badgeLeft + padX;
      else refX = badgeLeft + badgeWidth - padX - textWidth;
    }

    ctx.fillStyle = refStyle.color || '#FBBF24';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
    ctx.shadowBlur = 6 * scale;

    let curX = refX;
    for (const s of segments) {
      ctx.font = s.isNumeric ? numFont : textFont;
      ctx.fillText(s.text, curX, y);
      curX += ctx.measureText(s.text).width;
    }

    ctx.restore();
  };

  // Everything from here (card backdrop, decorations, verse text, references)
  // lives inside the preview's transformed content div, so wrap it in the same
  // horizontal/vertical offset translation (percentages of the full canvas,
  // matching the preview div's own w-full/h-full box).
  ctx.save();
  const offsetXpx = ((config.horizontalOffset ?? 0) / 100) * width;
  const offsetYpx = ((config.verticalOffset ?? 0) / 100) * height;
  ctx.translate(offsetXpx, offsetYpx);

  // Card Backdrop: a translucent rounded panel behind all the content,
  // matching the preview's cardBackdrop div (background/blur/border/shadow).
  // True backdrop-filter blur is approximated by blurring a snapshot of
  // what's been drawn so far within the card bounds, then compositing it
  // back before the tint/border/shadow.
  if (cardEnabled && config.cardBackdrop) {
    const cb = config.cardBackdrop;
    const cardLeft = outerContentOffsetX;
    const cardTop = currentY;
    const cardWidth = outerContentWidth;
    const cardHeight = totalContentHeight;
    const cardRadius = (cb.borderRadius ?? 16) * scale;

    if (cb.blur > 0) {
      try {
        const snap = document.createElement('canvas');
        snap.width = Math.max(1, Math.round(cardWidth));
        snap.height = Math.max(1, Math.round(cardHeight));
        const sctx = snap.getContext('2d');
        if (sctx) {
          // Copy the current canvas content under the card's (translated) bounds
          sctx.drawImage(
            canvas,
            cardLeft + offsetXpx, cardTop + offsetYpx, cardWidth, cardHeight,
            0, 0, cardWidth, cardHeight
          );
          ctx.save();
          roundRectPath(ctx, cardLeft, cardTop, cardWidth, cardHeight, cardRadius);
          ctx.clip();
          ctx.filter = `blur(${cb.blur * scale}px)`;
          ctx.drawImage(snap, cardLeft, cardTop, cardWidth, cardHeight);
          ctx.restore();
        }
      } catch {
        // Cross-origin background image can taint the canvas and block drawImage
        // read-back — fall back to just the tint/border/shadow below.
      }
    }

    ctx.save();
    roundRectPath(ctx, cardLeft, cardTop, cardWidth, cardHeight, cardRadius);
    ctx.fillStyle = hexToRgbaLocal(cb.color, cb.opacity);
    if (cb.shadow) {
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 40 * scale;
      ctx.shadowOffsetY = 20 * scale;
    }
    ctx.fill();
    if (cb.border) {
      ctx.shadowColor = 'transparent';
      ctx.strokeStyle = hexToRgbaLocal(cb.borderColor, 30);
      ctx.lineWidth = Math.max(1, scale);
      ctx.stroke();
    }
    ctx.restore();
  }
  currentY += cardPad;

  // Alignment anchor for decorative elements (cross, quote marks), matching
  // the preview's getAlignClass applied to their wrapper divs.
  const decorAnchorX = config.layoutAlignment === 'left'
    ? contentOffsetX
    : config.layoutAlignment === 'right'
      ? contentOffsetX + maxContentWidth
      : contentOffsetX + maxContentWidth / 2;
  const decorTextAlign: CanvasTextAlign = config.layoutAlignment === 'left'
    ? 'left'
    : config.layoutAlignment === 'right'
      ? 'right'
      : 'center';

  // Decorative Cross Icon
  if (config.showCross) {
    const crossSizePx = config.crossSize * scale;
    const circleR = crossSizePx * 0.5 + 10 * scale;
    const circleCx = config.layoutAlignment === 'left' ? decorAnchorX + circleR
      : config.layoutAlignment === 'right' ? decorAnchorX - circleR
      : decorAnchorX;
    const circleCy = currentY + circleR - (4 * scale);

    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.shadowColor = `${config.crossColor}66`;
    ctx.shadowBlur = 20 * scale;
    ctx.beginPath();
    ctx.arc(circleCx, circleCy, circleR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = config.crossColor;
    ctx.lineWidth = Math.max(1.5, crossSizePx * 0.09);
    ctx.lineCap = 'round';
    const half = crossSizePx / 2;
    ctx.beginPath();
    ctx.moveTo(circleCx, circleCy - half);
    ctx.lineTo(circleCx, circleCy + half);
    ctx.moveTo(circleCx - half * 0.6, circleCy - half * 0.25);
    ctx.lineTo(circleCx + half * 0.6, circleCy - half * 0.25);
    ctx.stroke();
    ctx.restore();

    currentY += crossBlockHeight;
  }


  if (showRef && isRefOnTop) {
    const refFontSize = Math.round(config.referenceStyle.fontSizeSp * scale);
    drawReferenceBlock(currentY + refFontSize * 0.85);
    currentY += refHeight;
  }

  // Split, top half: the reference for whichever language is drawn first
  // (e.g. Telugu, when Telugu is on top) goes directly above it.
  if (canSplit && splitTopHeight > 0) {
    const refFontSize = Math.round(config.referenceStyle.fontSizeSp * scale);
    drawReferenceBlock(currentY + refFontSize * 0.85, splitTopText);
    currentY += splitTopHeight;
  }

  // Decorative Opening Quote Mark
  const quoteColor = config.dividerColor || '#FBBF24';
  if (config.quoteMarks) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = quoteColor;
    ctx.font = `${Math.round(40 * scale)}px Georgia, serif`;
    ctx.textAlign = decorTextAlign;
    ctx.fillText('\u275D', decorAnchorX, currentY + 28 * scale);
    ctx.restore();
    currentY += quoteMarkHeight;
  }

  // Draw Lines Helper — draws within [regionX, regionX+regionWidth] starting at startY, returns the ending Y.
  // Uses `wrapLineGap` (defined above) between wrapped lines of the SAME
  // paragraph — distinct from the larger sectionGap margin applied between
  // separate language blocks, which is added by the caller after this returns.
  const drawLines = (lines: WordRenderMeta[][], startY: number, regionX: number, regionWidth: number): number => {
    const spaceWidth = (config.wordSpacing ?? 10) * scale;
    let y = startY;
    lines.forEach((line, lineIdx) => {
      const lineHeight = Math.max(...line.map(w => w.rowHeight), 20 * scale);
      const totalLineWidth = line.reduce((sum, w, i) => sum + w.boxWidth + (i > 0 ? spaceWidth : 0), 0);

      let lineStartX = regionX;
      if (config.layoutAlignment === 'center') {
        lineStartX = regionX + (regionWidth - totalLineWidth) / 2;
      } else if (config.layoutAlignment === 'right') {
        lineStartX = regionX + regionWidth - totalLineWidth;
      }

      // curX tracks the left edge of each word's box (text width + its
      // layout padding on both sides), matching the preview's per-word
      // button — not just the glyph's left edge.
      let curX = lineStartX;
      for (const w of line) {
        ctx.font = w.font;
        const textX = curX + w.layoutPadX;

        // Draw highlight box if present, honoring per-word padding & corner radius
        if (w.highlightColor && (w.highlightOpacity ?? 0) > 0) {
          ctx.save();
          ctx.fillStyle = w.highlightColor;
          ctx.globalAlpha = w.highlightOpacity || 0.4;
          const padY = w.highlightPaddingY;
          const boxX = curX;
          const boxY = y - (w.fontSize * 0.85) - padY;
          const boxW = w.boxWidth;
          const boxH = w.fontSize * 1.2 + (padY * 2);
          if (w.highlightRadius > 0) {
            roundRectPath(ctx, boxX, boxY, boxW, boxH, w.highlightRadius);
            ctx.fill();
          } else {
            ctx.fillRect(boxX, boxY, boxW, boxH);
          }
          ctx.restore();
        }

        // Draw text with per-word shadow for legibility / user-defined effect
        ctx.save();
        ctx.shadowColor = w.shadowColor;
        ctx.shadowBlur = w.shadowBlur;
        ctx.shadowOffsetX = w.shadowOffsetX;
        ctx.shadowOffsetY = w.shadowOffsetY;
        ctx.fillStyle = w.color;
        ctx.fillText(w.text, textX, y);
        ctx.restore();

        // Underline, drawn beneath the text baseline
        if (w.textDecoration === 'underline') {
          ctx.save();
          ctx.strokeStyle = w.color;
          ctx.lineWidth = Math.max(1, w.fontSize * 0.06);
          const underlineY = y + w.fontSize * 0.12;
          ctx.beginPath();
          ctx.moveTo(textX, underlineY);
          ctx.lineTo(textX + w.width, underlineY);
          ctx.stroke();
          ctx.restore();
        }

        curX += w.boxWidth + spaceWidth;
      }

      y += lineHeight + (lineIdx < lines.length - 1 ? wrapLineGap : 0);
    });
    return y;
  };

  // Draws the stacked-layout divider at vertical position y, honoring
  // dividerStyle/dividerColor/dividerWidth — matches the preview's five
  // divider variants (minimal/gold-line/cross/dots/ornament/none) instead
  // of always drawing a single plain line.
  const drawDivider = (y: number) => {
    const style = config.dividerStyle ?? 'minimal';
    if (style === 'none') return;
    const color = config.dividerColor || 'rgba(255,255,255,0.4)';
    const divWidth = Math.min((config.dividerWidth || 60) * scale, maxContentWidth * 0.9);
    const divStartX = decorAnchorX - (config.layoutAlignment === 'left' ? 0 : config.layoutAlignment === 'right' ? divWidth : divWidth / 2);

    ctx.save();
    if (style === 'gold-line') {
      const grad = ctx.createLinearGradient(divStartX, y, divStartX + divWidth, y);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, color);
      grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad;
      ctx.lineWidth = Math.max(1.5, 2 * scale);
      ctx.beginPath();
      ctx.moveTo(divStartX, y);
      ctx.lineTo(divStartX + divWidth, y);
      ctx.stroke();
    } else if (style === 'cross') {
      const segW = 14 * scale;
      const gap = 12 * scale;
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1, scale);
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(decorAnchorX - gap / 2 - segW, y);
      ctx.lineTo(decorAnchorX - gap / 2, y);
      ctx.moveTo(decorAnchorX + gap / 2, y);
      ctx.lineTo(decorAnchorX + gap / 2 + segW, y);
      ctx.stroke();
      // small plus mark in the middle
      ctx.lineWidth = Math.max(1.5, 2 * scale);
      const r = 6 * scale;
      ctx.beginPath();
      ctx.moveTo(decorAnchorX, y - r);
      ctx.lineTo(decorAnchorX, y + r);
      ctx.moveTo(decorAnchorX - r, y);
      ctx.lineTo(decorAnchorX + r, y);
      ctx.stroke();
    } else if (style === 'dots') {
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.85;
      const gap = 8 * scale;
      const sizes = [3 * scale, 4 * scale, 3 * scale];
      let dx = decorAnchorX - gap - sizes[1];
      for (const r of sizes) {
        ctx.beginPath();
        ctx.arc(dx, y, r, 0, Math.PI * 2);
        ctx.fill();
        dx += gap + r;
      }
    } else if (style === 'ornament') {
      const segW = 10 * scale;
      const gap = 8 * scale;
      ctx.strokeStyle = color;
      ctx.globalAlpha = 0.9;
      ctx.lineWidth = Math.max(1, scale);
      ctx.beginPath();
      ctx.moveTo(decorAnchorX - gap / 2 - segW, y);
      ctx.lineTo(decorAnchorX - gap / 2, y);
      ctx.moveTo(decorAnchorX + gap / 2, y);
      ctx.lineTo(decorAnchorX + gap / 2 + segW, y);
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = color;
      ctx.font = `${Math.round(13 * scale)}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText('\u2767', decorAnchorX, y + 4 * scale);
    } else {
      // minimal (default)
      ctx.strokeStyle = color;
      ctx.lineWidth = Math.max(1.5, 2 * scale);
      ctx.beginPath();
      ctx.moveTo(divStartX, y);
      ctx.lineTo(divStartX + divWidth, y);
      ctx.stroke();
    }
    ctx.restore();
  };

  if (isSideBySide && showTe && showEn) {
    // Side-by-side: Telugu in the left column, English in the right column
    const teEndY = teluguLines.length > 0 ? drawLines(teluguLines, currentY, contentOffsetX, colWidth) : currentY;
    const enEndY = englishLines.length > 0 ? drawLines(englishLines, currentY, contentOffsetX + colWidth + columnGap, colWidth) : currentY;

    // The preview always renders a subtle column separator here
    // (`w-px self-stretch bg-white/15`), independent of the showDivider /
    // dividerColor / dividerWidth settings — those only apply to the stacked
    // layout's divider. Match that fixed style exactly, unconditionally.
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = Math.max(1, scale);
    const divX = contentOffsetX + colWidth + columnGap / 2;
    ctx.beginPath();
    ctx.moveTo(divX, currentY);
    ctx.lineTo(divX, Math.max(teEndY, enEndY));
    ctx.stroke();
    ctx.restore();

    currentY = Math.max(teEndY, enEndY);
  } else {
    // Stacked: order depends on layoutMode (Telugu-first vs English-first)
    const firstLines = isEnglishFirst ? englishLines : teluguLines;
    const secondLines = isEnglishFirst ? teluguLines : englishLines;
    const firstShow = isEnglishFirst ? showEn : showTe;
    const secondShow = isEnglishFirst ? showTe : showEn;

    if (firstShow && firstLines.length > 0) {
      currentY = drawLines(firstLines, currentY, contentOffsetX, maxContentWidth);
    }

    if (config.showDivider && showTe && showEn) {
      // 1.5× on each side of the divider = 3× total, matching the block's
      // own sectionGap/2 margin plus the divider's full sectionGap margin
      // stacking on both sides (see interBlockSpacing comment above).
      currentY += sectionSpacing * 1.5;
      drawDivider(currentY);
      currentY += sectionSpacing * 1.5;
    } else if (showTe && showEn) {
      currentY += sectionSpacing;
    }

    if (secondShow && secondLines.length > 0) {
      currentY = drawLines(secondLines, currentY, contentOffsetX, maxContentWidth);
    }

    // Split, bottom half: the reference for whichever language is drawn second
    // (e.g. English, when Telugu is on top) goes directly below it.
    if (canSplit && splitBottomHeight > 0) {
      currentY += refGap;
      drawReferenceBlock(currentY, splitBottomText);
      currentY += splitBottomHeight - refGap;
    }
  }

  // Decorative Closing Quote Mark
  if (config.quoteMarks) {
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = quoteColor;
    ctx.font = `${Math.round(40 * scale)}px Georgia, serif`;
    ctx.textAlign = decorTextAlign;
    ctx.fillText('\u275E', decorAnchorX, currentY + 28 * scale);
    ctx.restore();
    currentY += quoteMarkHeight;
  }

  // 4. Draw Reference Badge (bottom placement only — top was drawn earlier;
  // split places its two halves inline with each language block instead)
  if (showRef && !isRefOnTop && !canSplit) {
    currentY += refGap;
    drawReferenceBlock(currentY);
  }

  // End of offset-translated content block (card backdrop, decorations, text,
  // references) started right before "Reference at Top" above.
  ctx.restore();

  // 5. Draw Watermark if enabled
  if (config.showWatermark && config.watermarkText) {
    ctx.save();
    ctx.font = `500 ${Math.round(11 * scale)}px "Outfit", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'center';
    ctx.fillText(config.watermarkText, width / 2, height - (24 * scale));
    ctx.restore();
  }

  return canvas;
}

/**
 * Opens the native/browser share sheet for the rendered wallpaper,
 * separate from downloadWallpaper's save-to-device flow.
 */
export async function shareWallpaper(
  config: WallpaperConfig,
  format: 'jpeg' | 'png' = 'jpeg',
  quality: 'standard' | 'ultra' = 'standard'
): Promise<void> {
  const canvas = await renderWallpaperToCanvas(config, quality);
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, format === 'png' ? 1.0 : 0.95);
  const filename = `ScripturePaper_${config.referenceEn.replace(/[^a-zA-Z0-9]/g, '_')}_${quality === 'ultra' ? 'Ultra' : 'HD'}.${format === 'png' ? 'png' : 'jpg'}`;

  if (Capacitor.isNativePlatform()) {
    const base64Data = dataUrl.split(',')[1];
    const writeResult = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'Scripture Wallpaper',
      text: config.referenceEn,
      url: writeResult.uri,
      dialogTitle: 'Share your wallpaper',
    });
    return;
  }

  // Web: the Web Share API needs an actual File/Blob to share an image
  // (sharing a data: URL directly isn't supported), so convert first.
  const blob = await (await fetch(dataUrl)).blob();
  const file = new File([blob], filename, { type: mimeType });

  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: 'Scripture Wallpaper',
      text: config.referenceEn,
      files: [file],
    });
    return;
  }

  // Fallback for browsers without Web Share API file support: fall back
  // to a normal download so the action still does something useful.
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Triggers a direct browser file download for the canvas
 */
export async function downloadWallpaper(
  config: WallpaperConfig,
  format: 'jpeg' | 'png' = 'jpeg',
  quality: 'standard' | 'ultra' = 'standard'
): Promise<string> {
  const canvas = await renderWallpaperToCanvas(config, quality);
  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, format === 'png' ? 1.0 : 0.95);
  const filename = `ScripturePaper_${config.referenceEn.replace(/[^a-zA-Z0-9]/g, '_')}_${quality === 'ultra' ? 'Ultra' : 'HD'}.${format === 'png' ? 'png' : 'jpg'}`;

  if (Capacitor.isNativePlatform()) {
    // Browser-style <a download> clicks don't trigger file downloads inside
    // Android/iOS WebViews, so on native platforms we write the image to
    // disk with the Filesystem plugin and hand it off to the native share
    // sheet, which lets the user save it straight to Photos/Gallery.
    const base64Data = dataUrl.split(',')[1];
    const writeResult = await Filesystem.writeFile({
      path: filename,
      data: base64Data,
      directory: Directory.Cache,
    });

    await Share.share({
      title: 'Scripture Wallpaper',
      url: writeResult.uri,
      dialogTitle: 'Save or share your wallpaper',
    });

    return dataUrl;
  }

  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}
