import { WallpaperConfig, AspectRatioType } from '../types';

export interface ExportResolution {
  width: number;
  height: number;
  label: string;
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
  const paddingX = width * 0.08;
  const maxContentWidth = width - (paddingX * 2);

  // Measure and layout text items
  const showTe = config.primaryLanguage === 'telugu' || config.primaryLanguage === 'parallel';
  const showEn = config.primaryLanguage === 'english' || config.primaryLanguage === 'parallel';

  // Helper for word wrapping with per-word custom styling
  interface WordRenderMeta {
    text: string;
    color: string;
    font: string;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    isItalic: boolean;
    highlightColor?: string;
    highlightOpacity?: number;
    width: number;
    height: number;
    x?: number;
    y?: number;
  }

  const prepareWords = (words: typeof config.teluguWords): WordRenderMeta[] => {
    return words.map(w => {
      const fontSize = Math.round(w.fontSizeSp * scale);
      const font = `${w.isItalic ? 'italic ' : ''}${w.fontWeight} ${fontSize}px "${w.fontFamily}", sans-serif`;
      ctx.font = font;
      const textToDraw = w.isAllCaps ? w.text.toUpperCase() : w.text;
      const metrics = ctx.measureText(textToDraw);
      return {
        text: textToDraw,
        color: w.color,
        font,
        fontSize,
        fontFamily: w.fontFamily,
        fontWeight: w.fontWeight,
        isItalic: w.isItalic,
        highlightColor: w.highlightColor,
        highlightOpacity: w.highlightOpacity,
        width: metrics.width,
        height: fontSize * 1.3
      };
    });
  };

  const layoutParagraph = (wordMetas: WordRenderMeta[], maxWidth: number) => {
    const lines: WordRenderMeta[][] = [];
    let currentLine: WordRenderMeta[] = [];
    let currentLineWidth = 0;
    const spaceWidth = 10 * scale;

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

  const teluguLines = showTe ? layoutParagraph(teluguWordsMeta, maxContentWidth) : [];
  const englishLines = showEn ? layoutParagraph(englishWordsMeta, maxContentWidth) : [];

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
  const dividerHeight = (config.showDivider && showTe && showEn) ? 24 * scale : 0;
  const refHeight = config.referenceStyle.showTeluguRef || config.referenceStyle.showEnglishRef ? 36 * scale : 0;

  totalContentHeight = teHeight + enHeight + dividerHeight + refHeight + (showTe && showEn ? sectionSpacing : 0);

  // Determine starting Y based on vertical alignment
  let currentY = (height - totalContentHeight) / 2;
  if (config.verticalAlignment === 'top') {
    currentY = height * 0.18;
  } else if (config.verticalAlignment === 'bottom') {
    currentY = height - totalContentHeight - (height * 0.15);
  }

  // Draw Lines Helper
  const drawLines = (lines: WordRenderMeta[][]) => {
    const spaceWidth = 10 * scale;
    for (const line of lines) {
      const lineHeight = Math.max(...line.map(w => w.height), 20 * scale);
      const totalLineWidth = line.reduce((sum, w, i) => sum + w.width + (i > 0 ? spaceWidth : 0), 0);
      
      let lineStartX = paddingX;
      if (config.layoutAlignment === 'center') {
        lineStartX = (width - totalLineWidth) / 2;
      } else if (config.layoutAlignment === 'right') {
        lineStartX = width - paddingX - totalLineWidth;
      }

      let curX = lineStartX;
      for (const w of line) {
        ctx.font = w.font;

        // Draw highlight box if present
        if (w.highlightColor && (w.highlightOpacity ?? 0) > 0) {
          ctx.save();
          ctx.fillStyle = w.highlightColor;
          ctx.globalAlpha = w.highlightOpacity || 0.4;
          const boxPadding = 4 * scale;
          ctx.fillRect(
            curX - boxPadding,
            currentY - (w.fontSize * 0.85),
            w.width + (boxPadding * 2),
            w.fontSize * 1.2
          );
          ctx.restore();
        }

        // Draw text with subtle shadow for legibility
        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.65)';
        ctx.shadowBlur = 8 * scale;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 2 * scale;
        ctx.fillStyle = w.color;
        ctx.fillText(w.text, curX, currentY);
        ctx.restore();

        curX += w.width + spaceWidth;
      }

      currentY += lineHeight + lineSpacing;
    }
  };

  // 1. Draw Telugu
  if (showTe && teluguLines.length > 0) {
    drawLines(teluguLines);
  }

  // 2. Draw Divider
  if (config.showDivider && showTe && showEn) {
    currentY += 8 * scale;
    ctx.save();
    ctx.strokeStyle = config.dividerColor || 'rgba(255,255,255,0.4)';
    ctx.lineWidth = Math.max(2, 2 * scale);
    const divWidth = Math.min(100 * scale, width * 0.25);
    const divStartX = (width - divWidth) / 2;
    ctx.beginPath();
    ctx.moveTo(divStartX, currentY);
    ctx.lineTo(divStartX + divWidth, currentY);
    ctx.stroke();
    ctx.restore();
    currentY += 28 * scale;
  }

  // 3. Draw English
  if (showEn && englishLines.length > 0) {
    drawLines(englishLines);
  }

  // 4. Draw Reference Badge
  if (config.referenceStyle.showTeluguRef || config.referenceStyle.showEnglishRef) {
    currentY += 16 * scale;
    const parts = [];
    if (config.referenceStyle.showTeluguRef && config.referenceTe) parts.push(config.referenceTe);
    if (config.referenceStyle.showEnglishRef && config.referenceEn) parts.push(config.referenceEn);
    const refString = parts.join(' • ');

    if (refString) {
      const refFontSize = Math.round(config.referenceStyle.fontSizeSp * scale);
      ctx.font = `${config.referenceStyle.fontWeight} ${refFontSize}px "${config.referenceStyle.fontFamily}", sans-serif`;
      ctx.fillStyle = config.referenceStyle.color || '#FBBF24';
      ctx.textAlign = config.referenceAlignment;

      let refX = width / 2;
      if (config.referenceAlignment === 'left') refX = paddingX;
      if (config.referenceAlignment === 'right') refX = width - paddingX;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 6 * scale;
      ctx.fillText(refString, refX, currentY);
      ctx.restore();
    }
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

  const link = document.createElement('a');
  const filename = `ScripturePaper_${config.referenceEn.replace(/[^a-zA-Z0-9]/g, '_')}_${quality === 'ultra' ? 'Ultra' : 'HD'}.${format === 'png' ? 'png' : 'jpg'}`;
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return dataUrl;
}
