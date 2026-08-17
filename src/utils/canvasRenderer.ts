import { WallpaperConfig, AspectRatioType, WordStyle } from '../types';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface ExportResolution {
  width: number;
  height: number;
  label: string;
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
    const previewScale = width / 400;
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
        const scaledBlur = (bg.blur * (width / 400));
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
    radial.addColorStop(1, `rgba(0,0,0,${bg.vignette * 0.8})`);
    ctx.fillStyle = radial;
    ctx.fillRect(0, 0, width, height);
    ctx.restore();
  }

  // 4. Compute Dynamic Typography Metrics
  const scale = width / 400; // Base reference scale from 400px preview
  const paddingX = (config.padding ?? 24) * scale;
  // Content Max Width narrows the text column (like the live preview's CSS maxWidth)
  // and centers it within the outer padded safe area.
  const availableWidth = width - (paddingX * 2);
  const maxContentWidth = availableWidth * ((config.containerMaxWidth ?? 100) / 100);
  const contentOffsetX = paddingX + (availableWidth - maxContentWidth) / 2;

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
        height: fontSize * lineHeight
      };
    });
  };

  const layoutParagraph = (wordMetas: WordRenderMeta[], maxWidth: number) => {
    const lines: WordRenderMeta[][] = [];
    let currentLine: WordRenderMeta[] = [];
    let currentLineWidth = 0;
    const spaceWidth = (config.wordSpacing ?? 10) * scale;

    for (const w of wordMetas) {
      if (currentLine.length > 0 && currentLineWidth + spaceWidth + w.width > maxWidth) {
        lines.push(currentLine);
        currentLine = [w];
        currentLineWidth = w.width;
      } else {
        currentLine.push(w);
        currentLineWidth += (currentLine.length === 1 ? 0 : spaceWidth) + w.width;
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

  // Calculate total height needed
  const lineSpacing = 16 * scale;
  const sectionSpacing = 32 * scale;
  
  let totalContentHeight = 0;
  const getLinesHeight = (lines: WordRenderMeta[][]) => {
    return lines.reduce((acc, line) => {
      const maxH = Math.max(...line.map(w => w.height), 20 * scale);
      return acc + maxH + lineSpacing;
    }, 0);
  };

  const teHeight = showTe ? getLinesHeight(teluguLines) : 0;
  const enHeight = showEn ? getLinesHeight(englishLines) : 0;
  const dividerHeight = (config.showDivider && showTe && showEn && !isSideBySide) ? 24 * scale : 0;
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

  totalContentHeight = isSideBySide
    ? Math.max(teHeight, enHeight) + refHeight
    : teHeight + enHeight + dividerHeight + refHeight + (showTe && showEn ? sectionSpacing : 0);

  // Determine starting Y based on vertical alignment
  let currentY = (height - totalContentHeight) / 2;
  if (config.verticalAlignment === 'top') {
    currentY = height * 0.18;
  } else if (config.verticalAlignment === 'bottom') {
    currentY = height - totalContentHeight - (height * 0.15);
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
      const padX = 14 * scale;
      const padY = 8 * scale;
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

  // Reference at Top: draw first, then push content down past it
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

  // Draw Lines Helper — draws within [regionX, regionX+regionWidth] starting at startY, returns the ending Y
  const drawLines = (lines: WordRenderMeta[][], startY: number, regionX: number, regionWidth: number): number => {
    const spaceWidth = (config.wordSpacing ?? 10) * scale;
    let y = startY;
    for (const line of lines) {
      const lineHeight = Math.max(...line.map(w => w.height), 20 * scale);
      const totalLineWidth = line.reduce((sum, w, i) => sum + w.width + (i > 0 ? spaceWidth : 0), 0);

      let lineStartX = regionX;
      if (config.layoutAlignment === 'center') {
        lineStartX = regionX + (regionWidth - totalLineWidth) / 2;
      } else if (config.layoutAlignment === 'right') {
        lineStartX = regionX + regionWidth - totalLineWidth;
      }

      let curX = lineStartX;
      for (const w of line) {
        ctx.font = w.font;

        // Draw highlight box if present, honoring per-word padding & corner radius
        if (w.highlightColor && (w.highlightOpacity ?? 0) > 0) {
          ctx.save();
          ctx.fillStyle = w.highlightColor;
          ctx.globalAlpha = w.highlightOpacity || 0.4;
          const padX = w.highlightPaddingX;
          const padY = w.highlightPaddingY;
          const boxX = curX - padX;
          const boxY = y - (w.fontSize * 0.85) - padY;
          const boxW = w.width + (padX * 2);
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
        ctx.fillText(w.text, curX, y);
        ctx.restore();

        // Underline, drawn beneath the text baseline
        if (w.textDecoration === 'underline') {
          ctx.save();
          ctx.strokeStyle = w.color;
          ctx.lineWidth = Math.max(1, w.fontSize * 0.06);
          const underlineY = y + w.fontSize * 0.12;
          ctx.beginPath();
          ctx.moveTo(curX, underlineY);
          ctx.lineTo(curX + w.width, underlineY);
          ctx.stroke();
          ctx.restore();
        }

        curX += w.width + spaceWidth;
      }

      y += lineHeight + lineSpacing;
    }
    return y;
  };

  if (isSideBySide && showTe && showEn) {
    // Side-by-side: Telugu in the left column, English in the right column
    const teEndY = teluguLines.length > 0 ? drawLines(teluguLines, currentY, contentOffsetX, colWidth) : currentY;
    const enEndY = englishLines.length > 0 ? drawLines(englishLines, currentY, contentOffsetX + colWidth + columnGap, colWidth) : currentY;

    if (config.showDivider) {
      ctx.save();
      ctx.strokeStyle = config.dividerColor || 'rgba(255,255,255,0.4)';
      ctx.lineWidth = Math.max(2, 2 * scale);
      const divX = contentOffsetX + colWidth + columnGap / 2;
      ctx.beginPath();
      ctx.moveTo(divX, currentY - (20 * scale));
      ctx.lineTo(divX, Math.max(teEndY, enEndY) - (16 * scale));
      ctx.stroke();
      ctx.restore();
    }

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
      currentY += 8 * scale;
      ctx.save();
      ctx.strokeStyle = config.dividerColor || 'rgba(255,255,255,0.4)';
      ctx.lineWidth = Math.max(2, 2 * scale);
      const divWidth = Math.min(100 * scale, maxContentWidth * 0.5);
      const divStartX = contentOffsetX + (maxContentWidth - divWidth) / 2;
      ctx.beginPath();
      ctx.moveTo(divStartX, currentY);
      ctx.lineTo(divStartX + divWidth, currentY);
      ctx.stroke();
      ctx.restore();
      currentY += 28 * scale;
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

  // 4. Draw Reference Badge (bottom placement only — top was drawn earlier;
  // split places its two halves inline with each language block instead)
  if (showRef && !isRefOnTop && !canSplit) {
    currentY += refGap;
    drawReferenceBlock(currentY);
  }

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
