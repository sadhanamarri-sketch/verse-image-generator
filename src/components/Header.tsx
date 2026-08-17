import React from 'react';
import { Sparkles, Download, RefreshCw, BookOpen, Image as ImageIcon } from 'lucide-react';

interface HeaderProps {
  onOpenVersePicker: () => void;
  onOpenBgPicker: () => void;
  onOpenExportModal: () => void;
  onResetToDefault: () => void;
  verseReference: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenVersePicker,
  onOpenBgPicker,
  onOpenExportModal,
  onResetToDefault,
  verseReference
}) => {
  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-md border-b border-zinc-800/90">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & App Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-xl">
              ✝
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2 font-['Outfit']">
                  Scripture Paper
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  Telugu & English Studio
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-sans hidden sm:block">
                Parallel Telugu BSI & English KJV Wallpaper Studio
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="btn-quick-verse"
              onClick={onOpenVersePicker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition cursor-pointer"
              title="Select Scripture"
            >
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span className="hidden md:inline font-semibold">Scripture:</span>
              <span className="max-w-[120px] sm:max-w-[160px] truncate text-amber-300">{verseReference}</span>
            </button>

            <button
              id="btn-quick-bg"
              onClick={onOpenBgPicker}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-[#18181b] hover:bg-zinc-800 text-zinc-200 border border-zinc-800 transition cursor-pointer"
              title="Change Background"
            >
              <ImageIcon className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Background FX</span>
            </button>

            <button
              id="btn-reset-header"
              onClick={onResetToDefault}
              className="hidden sm:flex items-center gap-1.5 p-2 rounded-xl text-xs font-medium bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition cursor-pointer"
              title="Reset to default wallpaper"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-export-highres"
              onClick={onOpenExportModal}
              className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black shadow-md shadow-amber-500/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export HD</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
