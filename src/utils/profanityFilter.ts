/**
 * Automatic Profanity & Inappropriate Content Filter Utility (فلتر الكلمات البذيئة والرسائل)
 * Filters bad words, insults, and abusive language in Arabic and English across public and private chats.
 */

export const DEFAULT_ARABIC_PROFANITY_LIST: string[] = [
  // شتائم وألفاظ نابية وإهانات شائعة
  'كلب', 'حمار', 'غبي', 'قذر', 'منحط', 'حقير', 'تفه', 'تافه', 'سافل',
  'وقح', 'حيوان', 'زفت', 'جحش', 'صايع', 'فاسد', 'احتيال', 'شتيمة', 'كلمة_مسيئة', 'بلا شرف', 'مغفل',
  'عاهرة', 'قحبة', 'شرموطة', 'شرموط', 'ديوث', 'عرص', 'منيك', 'منيوك', 'كسمك', 'كس اختك', 'كس امك',
  'يلعن', 'يلعنك', 'يلعن ابوك', 'طيز', 'زب', 'نيك', 'خول', 'سفاح', 'وسخ', 'واطي', 'لوطي',
  'شاذ', 'زاني', 'زانية', 'قواد', 'يا كلب', 'يا حمار', 'يا غبي', 'يا قذر', 'يا حقير', 'يا سافل',
  'يا وقح', 'يا حيوان', 'يا زفت', 'يا جحش', 'يا صايع', 'يا فاسد', 'يا واطي', 'يا وسخ', 'يا قحبة',
  'يا شرموطة', 'يا ديوث', 'يا عرص', 'يا خول', 'ابن الكلب', 'ابن الحرام', 'ابن الشرموطة', 'ابن القحبة',
  'ابن السافلة', 'ابن العاهرة', 'تفو', 'تفو عليك', 'اللعنة', 'يلعن دينك'
];

export const DEFAULT_ENGLISH_PROFANITY_LIST: string[] = [
  'fuck', 'fucking', 'fucker', 'motherfucker', 'shit', 'bullshit',
  'bitch', 'bitches', 'asshole', 'bastard', 'crap', 'dick', 'pussy',
  'slut', 'whore', 'cunt', 'nigger', 'nigga', 'fag', 'faggot', 'cock',
  'blowjob', 'dumbass', 'retard', 'wanker', 'twat'
];

// Combined default list
export const DEFAULT_ALL_PROFANITY_LIST: string[] = Array.from(
  new Set([...DEFAULT_ARABIC_PROFANITY_LIST, ...DEFAULT_ENGLISH_PROFANITY_LIST])
);

// Backward compatibility
export const ARABIC_PROFANITY_LIST: string[] = DEFAULT_ARABIC_PROFANITY_LIST;

/**
 * Normalizes Arabic text for flexible matching:
 * - Removes diacritics / tashkeel
 * - Removes tatweel (kashida)
 * - Normalizes Alef forms (أ, إ, آ, ٱ -> ا)
 * - Normalizes Yeh forms (ى, ئ -> ي)
 * - Normalizes Waw forms (ؤ -> و)
 * - Normalizes Teh Marbuta (ة -> ه)
 */
export const normalizeArabicText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '') // Remove tashkeel & tatweel
    .replace(/[أإآٱ]/g, 'ا') // Normalize Alef
    .replace(/[ىئ]/g, 'ي') // Normalize Yeh
    .replace(/ؤ/g, 'و') // Normalize Waw with Hamza
    .replace(/ة/g, 'ه'); // Normalize Teh Marbuta
};

/**
 * Collapses 3 or more repeated consecutive identical characters into 1
 * e.g. "كللللللب" -> "كلب", "fuuuuck" -> "fuck"
 */
export const collapseRepeatedChars = (text: string): string => {
  if (!text) return '';
  return text.replace(/(.)\1{2,}/gu, '$1');
};

export interface ProfanityCheckResult {
  hasProfanity: boolean;
  cleanText: string;
  badWordsFound: string[];
}

/**
 * Escapes regex special characters
 */
const escapeRegex = (str: string): string => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Builds a flexible regex for an individual profanity word
 */
const buildWordPattern = (word: string, matchMode: 'flexible' | 'exact' = 'flexible'): RegExp | null => {
  const trimmed = word.trim().toLowerCase();
  if (!trimmed) return null;

  if (matchMode === 'exact') {
    // Exact word boundary matching
    return new RegExp(`(^|\\s|[.,!?;:()[\\]{}\\-_/"'\\\\])(${escapeRegex(trimmed)})($|\\s|[.,!?;:()[\\]{}\\-_/"'\\\\])`, 'i');
  }

  const normalized = normalizeArabicText(trimmed);

  // If multi-word phrase (e.g. "ابن الكلب" or "يا حمار" or "fuck you")
  if (normalized.includes(' ')) {
    const parts = normalized.split(/\s+/).filter(Boolean);
    const pattern = parts
      .map(p => escapeRegex(p).split('').join('[\\s\\-_._\\u0640]*'))
      .join('\\s+');
    return new RegExp(`(^|\\s|[.,!?;:()[\\]{}\\-_/"'\\\\])(${pattern})($|\\s|[.,!?;:()[\\]{}\\-_/"'\\\\])`, 'i');
  }

  // Single word: build pattern that handles optional Arabic prefixes (ال, و, ف, ب, ل, يا, يا )
  // and allows tatweel, spaces, dashes or dots between letters
  const charPatterns = normalized.split('').map(c => {
    if (c === 'ا') return '[اأإآٱ]+';
    if (c === 'ي') return '[يىئ]+';
    if (c === 'ه') return '[هة]+';
    if (c === 'و') return '[وؤ]+';
    return escapeRegex(c) + '+';
  });

  const core = charPatterns.join('[\\s\\-_._\\u0640]*');
  const prefixes = '(?:ال|و|ف|ب|ل|يا\\s*|يا)?';
  const suffixes = '(?:ين|ون|ات|ان|ك|كم|ه|ها|هم)?';

  return new RegExp(`(^|\\s|[.,!?;:()[\\]{}\\-_/"'\\\\])(${prefixes}${core}${suffixes})($|\\s|[.,!?;:()[\\]{}\\-_/"'\\\\])`, 'i');
};

/**
 * Filters and detects profanity in a given string
 * @param inputText The raw message text
 * @param customWords List of additional forbidden words provided by owner
 * @param matchMode 'flexible' (smart normalized, catches evasion) or 'exact' (strict whole-word)
 */
export const filterProfanity = (
  inputText: string,
  customWords: string[] = [],
  matchMode: 'flexible' | 'exact' = 'flexible'
): ProfanityCheckResult => {
  if (!inputText || typeof inputText !== 'string') {
    return { hasProfanity: false, cleanText: '', badWordsFound: [] };
  }

  let cleanText = inputText;
  const badWordsFound: string[] = [];

  // Normalize input for flexible comparison
  const normalizedInput = normalizeArabicText(collapseRepeatedChars(inputText.toLowerCase()));

  // Deduplicate all bad words (defaults + custom words)
  const allBadWords = Array.from(
    new Set([...DEFAULT_ALL_PROFANITY_LIST, ...(customWords || [])])
  );

  for (const word of allBadWords) {
    if (!word || !word.trim()) continue;
    const trimmedWord = word.trim();
    const normalizedWord = normalizeArabicText(trimmedWord.toLowerCase());

    // 1. Direct Regex Pattern Matching
    const pattern = buildWordPattern(trimmedWord, matchMode);
    let matched = false;

    if (pattern && pattern.test(inputText)) {
      matched = true;
      // Mask occurrences in cleanText
      cleanText = cleanText.replace(pattern, (match, p1, p2, p3) => {
        return (p1 || '') + '****' + (p3 || '');
      });
    }

    // 2. Also test on normalized text if flexible mode is enabled
    if (!matched && matchMode === 'flexible' && pattern && pattern.test(normalizedInput)) {
      matched = true;
      const simpleRegex = new RegExp(escapeRegex(trimmedWord), 'gi');
      cleanText = cleanText.replace(simpleRegex, '****');
    }

    // 3. Fallback contains check for words with 3+ characters
    if (!matched && matchMode === 'flexible' && normalizedWord.length >= 3) {
      // Check word boundaries in normalized text
      const tokenRegex = new RegExp(`(^|\\s|[.,!?;:()[\\]{}\\-_/"'\\\\])${escapeRegex(normalizedWord)}($|\\s|[.,!?;:()[\\]{}\\-_/"'\\\\])`, 'i');
      if (tokenRegex.test(normalizedInput)) {
        matched = true;
        const simpleRegex = new RegExp(escapeRegex(trimmedWord), 'gi');
        cleanText = cleanText.replace(simpleRegex, '****');
      }
    }

    if (matched && !badWordsFound.includes(trimmedWord)) {
      badWordsFound.push(trimmedWord);
    }
  }

  return {
    hasProfanity: badWordsFound.length > 0,
    cleanText,
    badWordsFound
  };
};
