import React, { useState } from 'react';
import { WallpaperConfig, WordStyle, ParallelVerse, AspectRatioType, LayoutMode } from './types';
import { POPULAR_VERSES } from './data/verses';
import { PRESET_BACKGROUNDS } from './data/backgrounds';
import { tokenizeStringToWords } from './utils/textTokenizer';

import { Header } from './components/Header';
import { WallpaperCanvas } from './components/WallpaperCanvas';
import { FloatingWordToolbar } from './components/FloatingWordToolbar';
import { WordStyleEditor } from './components/WordStyleEditor';
import { BackgroundEditor } from './components/BackgroundEditor';
import { ReferenceEditor } from './components/ReferenceEditor';
import { LayoutEditor } from './components/LayoutEditor';
import { VerseSelector } from './components/VerseSelector';
import { ExportModal } from './components/ExportModal';

import {
  BookOpen,
  Image as ImageIcon,
  Sliders,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Download,
  RotateCcw,
  Sparkles,
  Check,
  Plus,
  CheckSquare,
  ListChecks,
  Quote,
  Layout
} from 'lucide-react';

const INITIAL_VERSE = POPULAR_VERSES[0]; // John 3:16

const createInitialConfig = (): WallpaperConfig => {
  return {
    aspectRatio: '9:16',
    customWidth: 1080,
    customHeight: 1920,
    layoutMode: 'stacked-te-en',
    layoutAlignment: 'center',
    verticalAlignment: 'center',
    referenceAlignment: 'center',
    padding: 24,
    containerMaxWidth: 100,
    sectionGap: 16,
    verticalOffset: 0,
    horizontalOffset: 0,
    teluguWords: tokenizeStringToWords(INITIAL_VERSE.teluguBsi, 'telugu', {
      fontSizeSp: 23,
      fontFamily: 'Noto Serif Telugu',
      fontWeight: '600',
      color: '#FFFFFF'
    }),
    englishWords: tokenizeStringToWords(INITIAL_VERSE.englishKjv, 'english', {
      fontSizeSp: 18,
      fontFamily: 'Cinzel',
      fontWeight: '400',
      color: '#FEF3C7'
    }),
    referenceTe: INITIAL_VERSE.referenceTe,
    referenceEn: INITIAL_VERSE.referenceEn,
    referenceStyle: {
      color: '#FBBF24',
      fontSizeSp: 15,
      fontFamily: 'Cinzel',
      fontWeight: '700',
      showTeluguRef: true,
      showEnglishRef: true,
      placement: 'bottom',
      showBadge: true,
      badgeBg: 'rgba(0, 0, 0, 0.6)',
      badgeBorder: 'rgba(255, 255, 255, 0.1)',
      letterSpacing: 0.05,
    },
    background: {
      type: 'image',
      imageUrl: PRESET_BACKGROUNDS[0].fullUrl,
      gradientColors: ['#000000', '#121212', '#1E1E24'],
      gradientDirection: 'to bottom',
      gradientType: 'linear',
      solidColor: '#0A0A0A',
      scrimColor: '#000000',
      scrimOpacity: 0.35,
      blur: 0,
      brightness: 100,
      contrast: 100,
      saturation: 100,
      vignette: 0.35,
      grain: false,
    },
    cardBackdrop: {
      enabled: false,
      color: '#0F172A',
      opacity: 50,
      blur: 16,
      border: true,
      borderColor: '#FFFFFF',
      borderRadius: 20,
      shadow: true,
    },
    showDivider: true,
    dividerColor: 'rgba(255, 255, 255, 0.35)',
    dividerWidth: 64,
    dividerStyle: 'minimal',
    showCross: false,
    crossColor: '#FBBF24',
    crossSize: 28,
    quoteMarks: false,
    watermarkText: 'SCRIPTURE PAPER • TELUGU & ENGLISH',
    showWatermark: true,
  };
};

export default function App() {
  const [config, setConfig] = useState<WallpaperConfig>(createInitialConfig);
  
  // Multi-selection state for words
  const [selectedWordIds, setSelectedWordIds] = useState<string[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState<'telugu' | 'english'>('telugu');
  const [isMultiSelectMode, setIsMultiSelectMode] = useState<boolean>(false);

  // Modals / Panels
  const [showVerseSelector, setShowVerseSelector] = useState(false);
  const [showBgEditor, setShowBgEditor] = useState(false);
  const [showRefEditor, setShowRefEditor] = useState(false);
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // Active word list lookup based on selected language
  const activeWordList = selectedLanguage === 'telugu' ? config.teluguWords : config.englishWords;
  const selectedWords = activeWordList.filter(w => selectedWordIds.includes(w.id));
  const activeWordIndex = selectedWords.length === 1 ? activeWordList.findIndex(w => w.id === selectedWords[0].id) : -1;

  // Handle word selection from canvas (supports single tap, Shift/Cmd click, or Multi-select toggle mode)
  const handleSelectWord = (word: WordStyle, language: 'telugu' | 'english', isMultiToggle: boolean = false) => {
    setShowBgEditor(false); // Focus on styling inspector
    setShowRefEditor(false);
    setShowLayoutEditor(false);

    if (language !== selectedLanguage) {
      // Switching between Telugu and English resets selection to the new language's word
      setSelectedLanguage(language);
      setSelectedWordIds([word.id]);
      return;
    }

    if (isMultiToggle || isMultiSelectMode) {
      setSelectedWordIds(prev => {
        if (prev.includes(word.id)) {
          const next = prev.filter(id => id !== word.id);
          return next;
        } else {
          return [...prev, word.id];
        }
      });
    } else {
      setSelectedWordIds([word.id]);
    }
  };

  // Select all words in language
  const handleSelectAllLanguage = (language: 'telugu' | 'english') => {
    setSelectedLanguage(language);
    setShowBgEditor(false);
    setShowRefEditor(false);
    setShowLayoutEditor(false);
    const targetWords = language === 'telugu' ? config.teluguWords : config.englishWords;
    setSelectedWordIds(targetWords.map(w => w.id));
  };

  // Clear word selection
  const handleClearSelection = () => {
    setSelectedWordIds([]);
  };

  // Remove individual word from multi-selection
  const handleRemoveWordFromSelection = (wordId: string) => {
    setSelectedWordIds(prev => prev.filter(id => id !== wordId));
  };

  // Update specific properties of all selected words
  const handleUpdateWordStyle = (updates: Partial<WordStyle>) => {
    if (selectedWordIds.length === 0) return;

    setConfig(prev => {
      if (selectedLanguage === 'telugu') {
        return {
          ...prev,
          teluguWords: prev.teluguWords.map(w => selectedWordIds.includes(w.id) ? { ...w, ...updates } : w)
        };
      } else {
        return {
          ...prev,
          englishWords: prev.englishWords.map(w => selectedWordIds.includes(w.id) ? { ...w, ...updates } : w)
        };
      }
    });
  };

  // Apply primary selected word's style to all words in that language
  const handleApplyToAllWords = () => {
    if (selectedWords.length === 0) return;
    const {
      color, fontSizeSp, fontFamily, fontWeight, isItalic,
      textTransform, textDecoration, lineHeight,
      shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY,
      highlightPaddingX, highlightPaddingY, highlightRadius,
    } = selectedWords[0];

    const bulkStyle = {
      color, fontSizeSp, fontFamily, fontWeight, isItalic,
      textTransform, textDecoration, lineHeight,
      shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY,
      highlightPaddingX, highlightPaddingY, highlightRadius,
    };

    setConfig(prev => {
      if (selectedLanguage === 'telugu') {
        return {
          ...prev,
          teluguWords: prev.teluguWords.map(w => ({ ...w, ...bulkStyle }))
        };
      } else {
        return {
          ...prev,
          englishWords: prev.englishWords.map(w => ({ ...w, ...bulkStyle }))
        };
      }
    });
  };

  // Navigate word by word when in single select
  const handlePrevWord = () => {
    if (activeWordIndex > 0) {
      setSelectedWordIds([activeWordList[activeWordIndex - 1].id]);
    }
  };

  const handleNextWord = () => {
    if (activeWordIndex < activeWordList.length - 1 && activeWordIndex !== -1) {
      setSelectedWordIds([activeWordList[activeWordIndex + 1].id]);
    }
  };

  // Switch scripture verse
  const handleSelectVerse = (verse: ParallelVerse) => {
    setConfig(prev => ({
      ...prev,
      referenceTe: verse.referenceTe,
      referenceEn: verse.referenceEn,
      teluguWords: tokenizeStringToWords(verse.teluguBsi, 'telugu', {
        fontSizeSp: 23,
        fontFamily: 'Noto Serif Telugu',
        fontWeight: '600',
        color: '#FFFFFF'
      }),
      englishWords: tokenizeStringToWords(verse.englishKjv, 'english', {
        fontSizeSp: 18,
        fontFamily: 'Cinzel',
        fontWeight: '400',
        color: '#FEF3C7'
      })
    }));
    setSelectedWordIds([]);
  };

  // Custom scripture input
  const handleCustomVerse = (refTe: string, refEn: string, teText: string, enText: string) => {
    setConfig(prev => ({
      ...prev,
      referenceTe: refTe || 'వాక్యము',
      referenceEn: refEn || 'Scripture',
      teluguWords: tokenizeStringToWords(teText, 'telugu', {
        fontSizeSp: 23,
        fontFamily: 'Noto Serif Telugu',
        fontWeight: '600',
        color: '#FFFFFF'
      }),
      englishWords: tokenizeStringToWords(enText, 'english', {
        fontSizeSp: 18,
        fontFamily: 'Cinzel',
        fontWeight: '400',
        color: '#FEF3C7'
      })
    }));
    setSelectedWordIds([]);
  };

  // Reset to initial clean state
  const handleReset = () => {
    setConfig(createInitialConfig());
    setSelectedWordIds([]);
  };

  // Update reference (citation) styling
  const handleUpdateRefStyle = (updates: Partial<WallpaperConfig['referenceStyle']>) => {
    setConfig(prev => ({ ...prev, referenceStyle: { ...prev.referenceStyle, ...updates } }));
  };

  const handleUpdateRefAlignment = (alignment: 'left' | 'center' | 'right') => {
    setConfig(prev => ({ ...prev, referenceAlignment: alignment }));
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      
      {/* Top Navbar */}
      <Header
        onOpenVersePicker={() => setShowVerseSelector(true)}
        onOpenBgPicker={() => {
          setShowBgEditor(true);
          setShowRefEditor(false);
          setShowLayoutEditor(false);
          setSelectedWordIds([]);
        }}
        onOpenExportModal={() => setShowExportModal(true)}
        onResetToDefault={handleReset}
        verseReference={config.referenceEn}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left / Center: Interactive Wallpaper Canvas */}
            <div className="lg:col-span-7 flex flex-col items-center justify-center bg-[#101012] border border-zinc-800/80 rounded-3xl p-4 sm:p-6 shadow-2xl relative">
              
              {/* Quick Canvas Toolbar */}
              <div className="w-full flex flex-wrap items-center justify-between gap-2 mb-2 pb-3 border-b border-zinc-800/80 text-xs">
                
                {/* Aspect Ratio Selector */}
                <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-800">
                  {(['9:16', '16:9', '1:1', '4:5'] as AspectRatioType[]).map((ratio) => (
                    <button
                      key={ratio}
                      id={`ratio-${ratio.replace(':', '-')}`}
                      onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                      className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer ${
                        config.aspectRatio === ratio
                          ? 'bg-amber-500 text-black font-bold shadow-sm shadow-amber-500/20'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {ratio === '9:16' ? '9:16 Mobile' : ratio === '16:9' ? '16:9 Desktop' : ratio === '1:1' ? '1:1 Square' : '4:5 Story'}
                    </button>
                  ))}
                </div>

                {/* Alignment Toggles */}
                <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-800">
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, layoutAlignment: 'left' }))}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${config.layoutAlignment === 'left' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                    title="Align Left"
                  >
                    <AlignLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, layoutAlignment: 'center' }))}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${config.layoutAlignment === 'center' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                    title="Align Center"
                  >
                    <AlignCenter className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfig(prev => ({ ...prev, layoutAlignment: 'right' }))}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${config.layoutAlignment === 'right' ? 'bg-zinc-800 text-amber-400' : 'text-zinc-400 hover:text-zinc-200'}`}
                    title="Align Right"
                  >
                    <AlignRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Layout Mode Selector */}
                <div className="flex items-center gap-1 bg-black p-1 rounded-xl border border-zinc-800 flex-wrap">
                  {([
                    { id: 'stacked-te-en', label: 'తె → EN' },
                    { id: 'stacked-en-te', label: 'EN → తె' },
                    { id: 'side-by-side', label: 'తె | EN' },
                    { id: 'telugu-only', label: 'తెలుగు' },
                    { id: 'english-only', label: 'English' },
                  ] as { id: LayoutMode; label: string }[]).map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setConfig(prev => ({ ...prev, layoutMode: mode.id }))}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer ${config.layoutMode === mode.id ? 'bg-amber-500 text-black font-bold shadow-sm' : 'text-zinc-400 hover:text-white'}`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Main Interactive Canvas with Multi-selection */}
              <WallpaperCanvas
                config={config}
                selectedWordIds={selectedWordIds}
                isMultiSelectMode={isMultiSelectMode}
                onToggleMultiSelectMode={() => setIsMultiSelectMode(prev => !prev)}
                onSelectWord={handleSelectWord}
                onSelectAllLanguage={handleSelectAllLanguage}
                onClearSelection={handleClearSelection}
              />

              {/* Floating Quick-Style Toolbar for the active word selection */}
              <FloatingWordToolbar
                selectedWords={selectedWords}
                language={selectedLanguage}
                onUpdate={handleUpdateWordStyle}
                onOpenFullEditor={() => {
                  document.getElementById('word-style-inspector')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
                onDeselect={handleClearSelection}
              />
            </div>

            {/* Right Column: Dynamic Inspector Panel (Word Styling or Background & Layout) */}
            <div className="lg:col-span-5 space-y-4">
              
              {/* Quick Actions Card */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  id="btn-open-verses"
                  onClick={() => setShowVerseSelector(true)}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#121214] hover:bg-[#18181b] border border-zinc-800/80 hover:border-amber-500/50 transition shadow-lg group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">Change Scripture</div>
                      <div className="text-[10px] text-zinc-400 truncate max-w-[120px]">{config.referenceEn}</div>
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 font-bold">→</span>
                </button>

                <button
                  id="btn-open-bg"
                  onClick={() => {
                    setShowBgEditor(true);
                    setShowRefEditor(false);
                    setShowLayoutEditor(false);
                    setSelectedWordIds([]);
                  }}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-[#121214] hover:bg-[#18181b] border border-zinc-800/80 hover:border-amber-500/50 transition shadow-lg group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">Background FX</div>
                      <div className="text-[10px] text-zinc-400">Black, Charcoal, Blur</div>
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 font-bold">→</span>
                </button>

                <button
                  id="btn-open-ref"
                  onClick={() => {
                    setShowRefEditor(true);
                    setShowBgEditor(false);
                    setShowLayoutEditor(false);
                    setSelectedWordIds([]);
                  }}
                  className="col-span-2 flex items-center justify-between p-3.5 rounded-2xl bg-[#121214] hover:bg-[#18181b] border border-zinc-800/80 hover:border-amber-500/50 transition shadow-lg group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                      <Quote className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">Reference Styling</div>
                      <div className="text-[10px] text-zinc-400">Placement, badge, color & size</div>
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 font-bold">→</span>
                </button>

                <button
                  id="btn-open-layout"
                  onClick={() => {
                    setShowLayoutEditor(true);
                    setShowBgEditor(false);
                    setShowRefEditor(false);
                    setSelectedWordIds([]);
                  }}
                  className="col-span-2 flex items-center justify-between p-3.5 rounded-2xl bg-[#121214] hover:bg-[#18181b] border border-zinc-800/80 hover:border-amber-500/50 transition shadow-lg group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                      <Layout className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-bold text-white group-hover:text-amber-300">Layout & Spacing</div>
                      <div className="text-[10px] text-zinc-400">Width, gap & fine position offsets</div>
                    </div>
                  </div>
                  <span className="text-xs text-amber-400 font-bold">→</span>
                </button>
              </div>

              {/* Conditional Active Inspector */}
              {selectedWords.length > 0 ? (
                <div id="word-style-inspector">
                  <WordStyleEditor
                    selectedWords={selectedWords}
                    language={selectedLanguage}
                    onUpdate={handleUpdateWordStyle}
                    onApplyToAll={handleApplyToAllWords}
                    onClose={handleClearSelection}
                    onRemoveWordFromSelection={handleRemoveWordFromSelection}
                    onSelectAllWords={() => handleSelectAllLanguage(selectedLanguage)}
                    onPrevWord={handlePrevWord}
                    onNextWord={handleNextWord}
                    hasPrev={activeWordIndex > 0}
                    hasNext={activeWordIndex < activeWordList.length - 1 && activeWordIndex !== -1}
                  />
                </div>
              ) : showBgEditor ? (
                <BackgroundEditor
                  config={config}
                  onUpdateBg={(updates) => setConfig(prev => ({ ...prev, background: { ...prev.background, ...updates } }))}
                  onClose={() => setShowBgEditor(false)}
                />
              ) : showRefEditor ? (
                <ReferenceEditor
                  config={config}
                  onUpdateRef={handleUpdateRefStyle}
                  onUpdateAlignment={handleUpdateRefAlignment}
                  onClose={() => setShowRefEditor(false)}
                />
              ) : showLayoutEditor ? (
                <LayoutEditor
                  config={config}
                  onChangeConfig={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
                  onClose={() => setShowLayoutEditor(false)}
                />
              ) : (
                /* Default Inspector Placeholder when no word is selected */
                <div className="bg-[#121214] border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold">
                        <Sliders className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-white">Interactive Styling Studio</h3>
                        <p className="text-[11px] text-zinc-400">Single word tap or Multi-select mode</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setIsMultiSelectMode(prev => !prev)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        isMultiSelectMode
                          ? 'bg-amber-500 text-black border-amber-400 shadow-sm'
                          : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                      }`}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      <span>Multi-Select {isMultiSelectMode ? 'ON' : 'OFF'}</span>
                    </button>
                  </div>

                  <div className="p-4 bg-black/60 rounded-xl border border-zinc-800/80 text-xs text-zinc-300 space-y-2">
                    <p className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <ListChecks className="w-3.5 h-3.5" />
                      <span>Multi-Word Selection Enabled</span>
                    </p>
                    <p className="text-zinc-400 leading-relaxed text-[11px]">
                      Select multiple words by tapping with <strong>Multi-Select Mode</strong> on, or holding <strong>Shift / Cmd</strong> while clicking words. Edit font size, color, Google Font, and highlight styles for whole phrases simultaneously.
                    </p>
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleSelectAllLanguage('telugu')}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium border border-zinc-700 transition cursor-pointer"
                      >
                        Select All Telugu
                      </button>
                      <button
                        onClick={() => handleSelectAllLanguage('english')}
                        className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-medium border border-zinc-700 transition cursor-pointer"
                      >
                        Select All English
                      </button>
                    </div>
                  </div>

                  {/* Layout & Typography Settings */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <span>Divider Line Between Verses</span>
                      <input
                        type="checkbox"
                        checked={config.showDivider}
                        onChange={(e) => setConfig(prev => ({ ...prev, showDivider: e.target.checked }))}
                        className="accent-amber-500 w-4 h-4 rounded cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-300">
                      <span>Vertical Alignment</span>
                      <select
                        value={config.verticalAlignment}
                        onChange={(e) => setConfig(prev => ({ ...prev, verticalAlignment: e.target.value as any }))}
                        className="bg-black border border-zinc-800 rounded-lg px-2 py-1 text-xs text-white"
                      >
                        <option value="top">Top</option>
                        <option value="center">Center</option>
                        <option value="bottom">Bottom</option>
                      </select>
                    </div>
                  </div>

                  {/* Export Trigger */}
                  <button
                    onClick={() => setShowExportModal(true)}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export High-Resolution Bitmap (1080p / 4K)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>

      {/* Scripture Selection Modal */}
      {showVerseSelector && (
        <VerseSelector
          onSelectVerse={handleSelectVerse}
          onCustomVerseSubmit={handleCustomVerse}
          onClose={() => setShowVerseSelector(false)}
        />
      )}

      {/* Export High-Res Modal */}
      {showExportModal && (
        <ExportModal
          config={config}
          onClose={() => setShowExportModal(false)}
        />
      )}

    </div>
  );
}
