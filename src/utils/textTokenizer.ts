import { WordStyle } from '../types';

/**
 * Tokenize a raw string into individual WordStyle objects.
 * Handles both English words and Telugu words with complex Unicode conjunct characters (ottulu/vattulu, matras).
 */
export function tokenizeStringToWords(
  text: string,
  language: 'telugu' | 'english',
  defaultOptions?: Partial<WordStyle>
): WordStyle[] {
  if (!text || text.trim().length === 0) {
    return [];
  }

  // Split by whitespace while preserving punctuation attached to the words
  const rawWords = text.trim().split(/\s+/);

  return rawWords.map((word, index) => {
    const id = `${language}-w-${index}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Default styling defaults based on language
    const isTelugu = language === 'telugu';
    
    return {
      id,
      text: word,
      color: defaultOptions?.color || (isTelugu ? '#FFFFFF' : '#FEF3C7'),
      fontSizeSp: defaultOptions?.fontSizeSp || (isTelugu ? 24 : 20),
      fontFamily: defaultOptions?.fontFamily || (isTelugu ? 'Noto Serif Telugu' : 'Cinzel'),
      fontWeight: defaultOptions?.fontWeight || (isTelugu ? '600' : '400'),
      isItalic: defaultOptions?.isItalic ?? false,
      isAllCaps: defaultOptions?.isAllCaps ?? false,
      highlightColor: defaultOptions?.highlightColor || undefined,
      highlightOpacity: defaultOptions?.highlightOpacity ?? 0,
      letterSpacing: defaultOptions?.letterSpacing ?? 0,
      isHighlighted: false
    };
  });
}

/**
 * Reconstructs full verse text from word array
 */
export function wordsToString(words: WordStyle[]): string {
  return words.map(w => w.text).join(' ');
}
