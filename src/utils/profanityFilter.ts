/**
 * Automatic Profanity & Inappropriate Content Filter Utility
 * Filters bad words, insults, and abusive language in Arabic and English.
 */

export const ARABIC_PROFANITY_LIST = [
  'كلب', 'حمار', 'غبي', 'قذر', 'منحط', 'حقير', 'تفه',
  'تافه', 'سافل', 'وقح', 'حيوان', 'زفت', 'جحش', 'صايع',
  'فاسد', 'احتيال', 'شتيمة', 'كلمة_مسيئة', 'بلا شرف', 'مغفل',
  'يا كلب', 'يا حمار', 'يا غبي', 'يا قذر', 'يا حقير', 'يا سافل',
  'يا وقح', 'يا حيوان', 'يا زفت', 'يا جحش', 'يا صايع', 'يا فاسد',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'crap', 'dick', 'pussy', 'slut', 'whore'
];

/**
 * Normalizes Arabic text for flexible matching (removes diacritics, unifies alef/yeh/teh marbuta)
 */
export const normalizeArabicText = (text: string): string => {
  return text
    .replace(/[\u064B-\u065F]/g, '') // Remove tashkeel (diacritics)
    .replace(/[أإآٱ]/g, 'ا') // Normalize Alef
    .replace(/ى/g, 'ي') // Normalize Yeh
    .replace(/ؤ/g, 'و') // Normalize Waw with Hamza
    .replace(/ئ/g, 'ي'); // Normalize Yeh with Hamza
};

/**
 * Checks text for profanity and returns details
 */
export interface ProfanityCheckResult {
  hasProfanity: boolean;
  cleanText: string;
  badWordsFound: string[];
}

export const filterProfanity = (inputText: string, customWords: string[] = []): ProfanityCheckResult => {
  if (!inputText) {
    return { hasProfanity: false, cleanText: '', badWordsFound: [] };
  }

  let cleanText = inputText;
  const badWordsFound: string[] = [];
  const normalizedInput = normalizeArabicText(inputText.toLowerCase());

  const allBadWords = Array.from(new Set([...ARABIC_PROFANITY_LIST, ...customWords]));

  allBadWords.forEach((word) => {
    if (!word || !word.trim()) return;
    const trimmedWord = word.trim();
    const normalizedWord = normalizeArabicText(trimmedWord.toLowerCase());
    const escapedWord = trimmedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedWord, 'gi');

    if (regex.test(cleanText) || (normalizedWord.length > 1 && normalizedInput.includes(normalizedWord))) {
      badWordsFound.push(trimmedWord);
      const replacement = '****';
      cleanText = cleanText.replace(regex, replacement);
    }
  });

  return {
    hasProfanity: badWordsFound.length > 0,
    cleanText,
    badWordsFound
  };
};
