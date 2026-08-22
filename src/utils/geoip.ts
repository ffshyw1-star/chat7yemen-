// GeoIP & User Profile Specialty Utility for fetching user's country, country flag, language, and IP address automatically

export interface GeoIPResult {
  country: string;
  countryFlag: string;
  language: string;
  ip: string;
}

export interface SpecialtyItem {
  id: string;
  name: string;
  icon: string;
  category: string;
  description: string;
  color: string;
}

export const SPECIALTIES_LIST: SpecialtyItem[] = [
  { id: 'tech', name: 'تقنية وبرمجة', icon: '💻', category: 'technology', description: 'مطورو برمجيات، تقنيون، وهواة حاسوب', color: '#0284c7' },
  { id: 'design', name: 'تصميم وفنون', icon: '🎨', category: 'design', description: 'جرافيك، رسم، وتصميم واجهات', color: '#ec4899' },
  { id: 'medicine', name: 'طب وصحة', icon: '🩺', category: 'health', description: 'أطباء، صيادلة، وكوادر صحية', color: '#10b981' },
  { id: 'engineering', name: 'هندسة وعمارة', icon: '📐', category: 'engineering', description: 'مهندسون مدنيون، معماريون، وكهرباء', color: '#f59e0b' },
  { id: 'education', name: 'تعليم وتدريس', icon: '📚', category: 'education', description: 'معلمون، أكاديميون، وباحثون', color: '#8b5cf6' },
  { id: 'business', name: 'أعمال وتجارة', icon: '💼', category: 'business', description: 'إدارة، تسويق، ورواد أعمال', color: '#3b82f6' },
  { id: 'media', name: 'إعلام وصحافة', icon: '🎙️', category: 'media', description: 'صحفيون، مذيعون، وصناع محتوى', color: '#f97316' },
  { id: 'writing', name: 'كتابة وأدب', icon: '✍️', category: 'literature', description: 'شعراء، كتاب، ومترجمون', color: '#a855f7' },
  { id: 'sports', name: 'رياضة ولياقة', icon: '⚽', category: 'sports', description: 'مدربون، رياضيون، ومحبو لياقة', color: '#22c55e' },
  { id: 'music', name: 'موسيقى وصوتيات', icon: '🎵', category: 'music', description: 'عازفون، مهندسو صوت، وفنانون', color: '#06b6d4' },
  { id: 'student', name: 'طالب / دراسة', icon: '🎓', category: 'student', description: 'طلاب جامعيون ومدرسيون طموحون', color: '#eab308' },
  { id: 'general', name: 'عام / منوع', icon: '✨', category: 'general', description: 'اهتمامات عامة وثقافة شاملة', color: '#64748b' },
];

export interface CountryInfo {
  code: string;
  name: string;
  englishName: string;
  flag: string;
  language: string;
}

export const COUNTRIES_LIST: CountryInfo[] = [
  { code: 'YE', name: 'اليمن', englishName: 'Yemen', flag: '🇾🇪', language: 'العربية 🇸🇦' },
  { code: 'SA', name: 'السعودية', englishName: 'Saudi Arabia', flag: '🇸🇦', language: 'العربية 🇸🇦' },
  { code: 'EG', name: 'مصر', englishName: 'Egypt', flag: '🇪🇬', language: 'العربية 🇸🇦' },
  { code: 'AE', name: 'الإمارات', englishName: 'United Arab Emirates', flag: '🇦🇪', language: 'العربية 🇸🇦' },
  { code: 'IQ', name: 'العراق', englishName: 'Iraq', flag: '🇮🇶', language: 'العربية 🇸🇦' },
  { code: 'MA', name: 'المغرب', englishName: 'Morocco', flag: '🇲🇦', language: 'العربية 🇸🇦' },
  { code: 'DZ', name: 'الجزائر', englishName: 'Algeria', flag: '🇩🇿', language: 'العربية 🇸🇦' },
  { code: 'SY', name: 'سوريا', englishName: 'Syria', flag: '🇸🇾', language: 'العربية 🇸🇦' },
  { code: 'JO', name: 'الأردن', englishName: 'Jordan', flag: '🇯🇴', language: 'العربية 🇸🇦' },
  { code: 'KW', name: 'الكويت', englishName: 'Kuwait', flag: '🇰🇼', language: 'العربية 🇸🇦' },
  { code: 'OM', name: 'عُمان', englishName: 'Oman', flag: '🇴🇲', language: 'العربية 🇸🇦' },
  { code: 'QA', name: 'قطر', englishName: 'Qatar', flag: '🇶🇦', language: 'العربية 🇸🇦' },
  { code: 'BH', name: 'البحرين', englishName: 'Bahrain', flag: '🇧🇭', language: 'العربية 🇸🇦' },
  { code: 'LY', name: 'ليبيا', englishName: 'Libya', flag: '🇱🇾', language: 'العربية 🇸🇦' },
  { code: 'TN', name: 'تونس', englishName: 'Tunisia', flag: '🇹🇳', language: 'العربية 🇸🇦' },
  { code: 'SD', name: 'السودان', englishName: 'Sudan', flag: '🇸🇩', language: 'العربية 🇸🇦' },
  { code: 'PS', name: 'فلسطين', englishName: 'Palestine', flag: '🇵🇸', language: 'العربية 🇸🇦' },
  { code: 'LB', name: 'لبنان', englishName: 'Lebanon', flag: '🇱🇧', language: 'العربية 🇸🇦' },
  { code: 'MR', name: 'موريتانيا', englishName: 'Mauritania', flag: '🇲🇷', language: 'العربية 🇸🇦' },
  { code: 'SO', name: 'الصومال', englishName: 'Somalia', flag: '🇸🇴', language: 'العربية 🇸🇦' },
  { code: 'DJ', name: 'جيبوتي', englishName: 'Djibouti', flag: '🇩🇯', language: 'العربية 🇸🇦' },
  { code: 'KM', name: 'جزر القمر', englishName: 'Comoros', flag: '🇰🇲', language: 'العربية 🇸🇦' },
  { code: 'US', name: 'أمريكا', englishName: 'United States', flag: '🇺🇸', language: 'English 🇺🇸' },
  { code: 'GB', name: 'بريطانيا', englishName: 'United Kingdom', flag: '🇬🇧', language: 'English 🇬🇧' },
  { code: 'DE', name: 'ألمانيا', englishName: 'Germany', flag: '🇩🇪', language: 'Deutsch 🇩🇪' },
  { code: 'FR', name: 'فرنسا', englishName: 'France', flag: '🇫🇷', language: 'Français 🇫🇷' },
  { code: 'TR', name: 'تركيا', englishName: 'Turkey', flag: '🇹🇷', language: 'Türkçe 🇹🇷' },
  { code: 'CA', name: 'كندا', englishName: 'Canada', flag: '🇨🇦', language: 'English 🇨🇦' },
  { code: 'ES', name: 'إسبانيا', englishName: 'Spain', flag: '🇪🇸', language: 'Español 🇪🇸' },
  { code: 'IT', name: 'إيطاليا', englishName: 'Italy', flag: '🇮🇹', language: 'Italiano 🇮🇹' },
  { code: 'RU', name: 'روسيا', englishName: 'Russia', flag: '🇷🇺', language: 'Русский 🇷🇺' },
  { code: 'CN', name: 'الصين', englishName: 'China', flag: '🇨🇳', language: '中文 🇨🇳' },
  { code: 'IN', name: 'الهند', englishName: 'India', flag: '🇮🇳', language: 'हिन्दी / English 🇮🇳' },
  { code: 'PK', name: 'باكستان', englishName: 'Pakistan', flag: '🇵🇰', language: 'اردو / English 🇵🇰' },
  { code: 'ID', name: 'إندونيسيا', englishName: 'Indonesia', flag: '🇮🇩', language: 'Bahasa 🇮🇩' },
  { code: 'MY', name: 'ماليزيا', englishName: 'Malaysia', flag: '🇲🇾', language: 'Bahasa 🇲🇾' },
  { code: 'SE', name: 'السويد', englishName: 'Sweden', flag: '🇸🇪', language: 'Svenska 🇸🇪' },
  { code: 'NO', name: 'النرويج', englishName: 'Norway', flag: '🇳🇴', language: 'Norsk 🇳🇴' },
  { code: 'NL', name: 'هولندا', englishName: 'Netherlands', flag: '🇳🇱', language: 'Nederlands 🇳🇱' },
  { code: 'BR', name: 'البرازيل', englishName: 'Brazil', flag: '🇧🇷', language: 'Português 🇧🇷' },
  { code: 'JP', name: 'اليابان', englishName: 'Japan', flag: '🇯🇵', language: '日本語 🇯🇵' },
  { code: 'KR', name: 'كوريا الجنوبية', englishName: 'South Korea', flag: '🇰🇷', language: '한국어 🇰🇷' },
];

export const ARABIC_TO_ENGLISH_COUNTRY_MAP: Record<string, string> = Object.fromEntries(
  COUNTRIES_LIST.map(c => [c.name, c.englishName])
);

export function getEnglishCountryName(countryInput?: string): string {
  if (!countryInput || !countryInput.trim()) return 'Yemen';
  const trimmed = countryInput.trim();
  if (ARABIC_TO_ENGLISH_COUNTRY_MAP[trimmed]) {
    return ARABIC_TO_ENGLISH_COUNTRY_MAP[trimmed];
  }
  for (const c of COUNTRIES_LIST) {
    if (trimmed.includes(c.name) || c.englishName.toLowerCase() === trimmed.toLowerCase()) {
      return c.englishName;
    }
  }
  return trimmed;
}

export function getCountryLanguage(countryCodeOrName?: string): string {
  if (!countryCodeOrName) return 'العربية 🇸🇦';
  const upper = countryCodeOrName.trim().toUpperCase();
  const byCode = COUNTRIES_LIST.find(c => c.code === upper);
  if (byCode) return byCode.language;
  const byName = COUNTRIES_LIST.find(c => c.name === countryCodeOrName.trim() || c.englishName.toLowerCase() === countryCodeOrName.trim().toLowerCase());
  if (byName) return byName.language;
  return 'العربية 🇸🇦';
}

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🇾🇪';
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export async function fetchUserGeoIP(): Promise<GeoIPResult> {
  // First attempt: Server-side real IP lookup from /api/ip/status
  try {
    const res = await fetch('/api/ip/status');
    if (res.ok) {
      const data = await res.json();
      if (data && data.ip && data.ip !== '127.0.0.1' && data.ip !== 'localhost') {
        // Find if we have more info, else fallback gracefully
      }
    }
  } catch (e) {
    // Continue to external lookup
  }

  // Primary attempt: ipwhois.app
  try {
    const response = await fetch('https://ipwhois.app/json/', { cache: 'no-cache' });
    if (response.ok) {
      const data = await response.json();
      if (data && data.success !== false) {
        const code = (data.country_code || '').toUpperCase();
        const found = COUNTRIES_LIST.find(c => c.code === code);
        
        return {
          country: found?.name || data.country || 'اليمن',
          countryFlag: found?.flag || data.country_flag || getFlagEmoji(code),
          language: found?.language || 'العربية 🇸🇦',
          ip: data.ip || '197.220.12.89',
        };
      }
    }
  } catch (e) {
    console.warn('ipwhois failed, trying fallback IP lookup:', e);
  }

  // Fallback attempt: ip-api.com
  try {
    const response = await fetch('https://ip-api.com/json/?fields=status,country,countryCode,query', { cache: 'no-cache' });
    if (response.ok) {
      const data = await response.json();
      if (data && data.status === 'success') {
        const code = (data.countryCode || '').toUpperCase();
        const found = COUNTRIES_LIST.find(c => c.code === code);

        return {
          country: found?.name || data.country || 'اليمن',
          countryFlag: found?.flag || getFlagEmoji(code),
          language: found?.language || 'العربية 🇸🇦',
          ip: data.query || '197.220.12.89',
        };
      }
    }
  } catch (e) {
    console.warn('ip-api failed:', e);
  }

  // Default fallback
  return {
    country: 'اليمن',
    countryFlag: '🇾🇪',
    language: 'العربية 🇸🇦',
    ip: '197.220.12.89',
  };
}

export function getUserFlagEmoji(user?: { country?: string; countryFlag?: string; hideCountry?: boolean; showCountryFlag?: boolean } | null): string | null {
  if (!user) return null;
  if (user.hideCountry || user.showCountryFlag === false) {
    return null;
  }
  if (user.countryFlag && user.countryFlag.trim()) {
    return user.countryFlag.trim();
  }
  if (user.country && user.country.trim()) {
    const c = user.country.trim();
    const found = COUNTRIES_LIST.find(item => item.name === c || item.englishName.toLowerCase() === c.toLowerCase() || item.code === c.toUpperCase());
    if (found) return found.flag;
  }
  return '🇾🇪';
}


