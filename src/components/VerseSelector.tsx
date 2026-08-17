import React, { useState } from 'react';
import { ParallelVerse } from '../types';
import { POPULAR_VERSES } from '../data/verses';
import {
  BookOpen,
  Search,
  Check,
  PlusCircle,
  Sparkles,
  Tag,
  X,
  FileText
} from 'lucide-react';

interface VerseSelectorProps {
  currentVerseId?: string;
  onSelectVerse: (verse: ParallelVerse) => void;
  onCustomVerseSubmit: (refTe: string, refEn: string, teluguText: string, englishText: string) => void;
  onClose: () => void;
}

export const VerseSelector: React.FC<VerseSelectorProps> = ({
  currentVerseId,
  onSelectVerse,
  onCustomVerseSubmit,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Custom Form Inputs
  const [customRefTe, setCustomRefTe] = useState('యోహాను 3:16');
  const [customRefEn, setCustomRefEn] = useState('John 3:16');
  const [customTeText, setCustomTeText] = useState('దేవుడు లోకమును ఎంతో ప్రేమించెను...');
  const [customEnText, setCustomEnText] = useState('For God so loved the world, that he gave his only begotten Son...');

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(POPULAR_VERSES.map(v => v.category)))];

  const filteredVerses = POPULAR_VERSES.filter((v) => {
    const matchesCategory = selectedCategory === 'All' || v.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q ||
      v.referenceEn.toLowerCase().includes(q) ||
      v.referenceTe.toLowerCase().includes(q) ||
      v.englishKjv.toLowerCase().includes(q) ||
      v.teluguBsi.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customTeText.trim() || customEnText.trim()) {
      onCustomVerseSubmit(customRefTe.trim(), customRefEn.trim(), customTeText.trim(), customEnText.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-[#121214] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-['Outfit']">
                Scripture Library (తెలుగు BSI & English KJV)
              </h2>
              <p className="text-xs text-zinc-400">
                Choose a pre-formatted parallel verse or input your own custom passage
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Toggle: Preset Catalog vs Custom Input */}
        <div className="flex border-b border-zinc-800 bg-black/50 p-2 gap-2 text-xs">
          <button
            onClick={() => setIsCustomMode(false)}
            className={`flex-1 py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              !isCustomMode
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Curated Parallel Verses</span>
          </button>

          <button
            onClick={() => setIsCustomMode(true)}
            className={`flex-1 py-2 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
              isCustomMode
                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manual Scripture Input</span>
          </button>
        </div>

        {/* Mode 1: Verse Library */}
        {!isCustomMode ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Search & Category Filter */}
            <div className="p-4 border-b border-zinc-800/80 bg-[#141417] space-y-3">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search reference (e.g. John 3:16, కీర్తనలు, shepherd, ప్రేమ)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-black border border-zinc-800 rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Category Chips */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold'
                        : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Verses Scrollable List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {filteredVerses.map((verse) => {
                const isSelected = currentVerseId === verse.id;
                return (
                  <div
                    key={verse.id}
                    onClick={() => {
                      onSelectVerse(verse);
                      onClose();
                    }}
                    className={`p-4 rounded-xl border transition cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/80 shadow-md ring-1 ring-amber-500/40'
                        : 'bg-black/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-amber-400 font-['Outfit']">
                          {verse.referenceEn}
                        </span>
                        <span className="text-xs text-zinc-400">•</span>
                        <span className="font-bold text-sm text-amber-300 font-['Noto_Serif_Telugu']">
                          {verse.referenceTe}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                        {verse.category}
                      </span>
                    </div>

                    {/* Telugu Text Preview */}
                    <p className="text-xs sm:text-sm text-zinc-100 font-['Noto_Serif_Telugu'] line-clamp-2 leading-relaxed mb-1.5">
                      {verse.teluguBsi}
                    </p>

                    {/* English Text Preview */}
                    <p className="text-xs text-zinc-300 font-['Cinzel'] line-clamp-2 opacity-90">
                      {verse.englishKjv}
                    </p>
                  </div>
                );
              })}

              {filteredVerses.length === 0 && (
                <div className="text-center py-10 text-zinc-500">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-xs">No matching verses found for "{searchQuery}".</p>
                  <p className="text-[11px] text-zinc-600 mt-1">Try switching to custom input tab.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Mode 2: Custom Verse Input Form */
          <form onSubmit={handleCustomSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
            
            {/* References */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Telugu Reference (ఉదా: యోహాను 3:16)
                </label>
                <input
                  type="text"
                  value={customRefTe}
                  onChange={(e) => setCustomRefTe(e.target.value)}
                  placeholder="యోహాను 3:16"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  English Reference (e.g. John 3:16)
                </label>
                <input
                  type="text"
                  value={customRefEn}
                  onChange={(e) => setCustomRefEn(e.target.value)}
                  placeholder="John 3:16"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Telugu Verse Text */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Telugu Verse Text (BSI Translation)
              </label>
              <textarea
                rows={3}
                value={customTeText}
                onChange={(e) => setCustomTeText(e.target.value)}
                placeholder="తెలుగు వాక్యమును ఇక్కడ రాయండి లేదా పేస్ట్ చేయండి..."
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-['Noto_Serif_Telugu'] leading-relaxed"
              />
            </div>

            {/* English Verse Text */}
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                English Verse Text (KJV Translation)
              </label>
              <textarea
                rows={3}
                value={customEnText}
                onChange={(e) => setCustomEnText(e.target.value)}
                placeholder="Type or paste the English King James scripture..."
                className="w-full bg-black border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500 font-['Cinzel'] leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Apply Custom Verse
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
