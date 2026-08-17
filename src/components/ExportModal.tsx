import React, { useState } from 'react';
import { WallpaperConfig } from '../types';
import { downloadWallpaper, shareWallpaper, renderWallpaperToCanvas, getResolutionForAspect } from '../utils/canvasRenderer';
import confetti from 'canvas-confetti';
import {
  Download,
  Sparkles,
  Smartphone,
  Check,
  Loader2,
  FileImage,
  Layers,
  Copy,
  ExternalLink,
  Share2,
  X
} from 'lucide-react';

interface ExportModalProps {
  config: WallpaperConfig;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ config, onClose }) => {
  const [quality, setQuality] = useState<'standard' | 'ultra'>('standard');
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const resInfo = getResolutionForAspect(config.aspectRatio, quality);

  const handleExportDownload = async () => {
    setIsExporting(true);
    try {
      const dataUrl = await downloadWallpaper(config, format, quality);
      setPreviewUrl(dataUrl);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#FBBF24', '#38BDF8', '#34D399', '#FDA4AF']
      });
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await shareWallpaper(config, format, quality);
    } catch (err) {
      console.error('Share error:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const canvas = await renderWallpaperToCanvas(config, 'standard');
      canvas.toBlob(async (blob) => {
        if (blob) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        }
      }, 'image/png');
    } catch (err) {
      console.error('Copy to clipboard failed', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-5 sm:p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-['Outfit']">
                Export Scripture Wallpaper
              </h3>
              <p className="text-xs text-zinc-400">
                Native Canvas render without preview compression
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resolution Options */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300">
            Output Quality & Resolution
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => setQuality('standard')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                quality === 'standard'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                  : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-bold text-xs text-white">Full HD (1080p)</div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {getResolutionForAspect(config.aspectRatio, 'standard').width} × {getResolutionForAspect(config.aspectRatio, 'standard').height} px
              </div>
              <div className="text-[10px] text-amber-400/90 mt-1 font-semibold">Fast • Standard Devices</div>
            </button>

            <button
              onClick={() => setQuality('ultra')}
              className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                quality === 'ultra'
                  ? 'bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/40'
                  : 'bg-black/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              <div className="font-bold text-xs text-white flex items-center gap-1.5">
                <span>Ultra HD (WQHD+)</span>
                <span className="text-[9px] px-1 py-0.2 bg-amber-500/30 text-amber-300 rounded font-bold">PRO</span>
              </div>
              <div className="text-[11px] text-zinc-400 mt-0.5">
                {getResolutionForAspect(config.aspectRatio, 'ultra').width} × {getResolutionForAspect(config.aspectRatio, 'ultra').height} px
              </div>
              <div className="text-[10px] text-amber-400/90 mt-1 font-semibold">Flagship OLED / Retina</div>
            </button>
          </div>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-300">
            Image Format
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setFormat('jpeg')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                format === 'jpeg'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              JPEG (95% Quality - Optimal for Wallpapers)
            </button>
            <button
              onClick={() => setFormat('png')}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                format === 'png'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-black border-zinc-800 text-zinc-400 hover:border-zinc-700'
              }`}
            >
              Lossless PNG
            </button>
          </div>
        </div>

        {/* Summary Info Pill */}
        <div className="p-3 bg-black rounded-xl border border-zinc-800 text-xs text-zinc-300 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-amber-400" />
            <span>Target Resolution:</span>
          </span>
          <span className="font-mono font-bold text-amber-300">
            {resInfo.width} × {resInfo.height} px
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleExportDownload}
            disabled={isExporting}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-sm shadow-xl shadow-amber-500/20 transition cursor-pointer disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Rendering Canvas ({resInfo.width}x{resInfo.height})...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download High-Res Wallpaper</span>
              </>
            )}
          </button>

          <button
            onClick={handleShare}
            disabled={isSharing}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-sm border border-zinc-700 transition cursor-pointer disabled:opacity-50"
          >
            {isSharing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Preparing...</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share Wallpaper</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopyToClipboard}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold border border-zinc-700 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard!' : 'Copy Image to Clipboard'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
