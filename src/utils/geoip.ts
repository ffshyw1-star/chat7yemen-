// GeoIP Utility for fetching user's country, country flag, and IP address automatically

export interface GeoIPResult {
  country: string;
  countryFlag: string;
  ip: string;
}

export const ARABIC_TO_ENGLISH_COUNTRY_MAP: Record<string, string> = {
  'اليمن': 'Yemen',
  'فلسطين': 'Palestine',
  'الأراضي الفلسطينية': 'Palestinian Territories',
  'السعودية': 'Saudi Arabia',
  'المملكة العربية السعودية': 'Saudi Arabia',
  'مصر': 'Egypt',
  'الإمارات': 'United Arab Emirates',
  'الإمارات العربية المتحدة': 'United Arab Emirates',
  'العراق': 'Iraq',
  'المغرب': 'Morocco',
  'الجزائر': 'Algeria',
  'سوريا': 'Syria',
  'الأردن': 'Jordan',
  'الكويت': 'Kuwait',
  'عُمان': 'Oman',
  'عمان': 'Oman',
  'سلطنة عمان': 'Oman',
  'قطر': 'Qatar',
  'البحرين': 'Bahrain',
  'ليبيا': 'Libya',
  'تونس': 'Tunisia',
  'السودان': 'Sudan',
  'سودان': 'Sudan',
  'لبنان': 'Lebanon',
  'موريتانيا': 'Mauritania',
  'الصومال': 'Somalia',
  'جيبوتي': 'Djibouti',
  'جزر القمر': 'Comoros',
  'أمريكا': 'United States',
  'الولايات المتحدة': 'United States',
  'الولايات المتحدة الأمريكية': 'United States',
  'بريطانيا': 'United Kingdom',
  'المملكة المتحدة': 'United Kingdom',
  'ألمانيا': 'Germany',
  'فرنسا': 'France',
  'تركيا': 'Turkey',
  'كندا': 'Canada',
  'إسبانيا': 'Spain',
  'إيطاليا': 'Italy',
  'روسيا': 'Russia',
  'الصين': 'China',
  'الهند': 'India',
  'باكستان': 'Pakistan',
  'إندونيسيا': 'Indonesia',
  'أندونيسيا': 'Indonesia',
  'ماليزيا': 'Malaysia',
  'السويد': 'Sweden',
  'النرويج': 'Norway',
  'الدنمارك': 'Denmark',
  'هولندا': 'Netherlands',
  'بلجيكا': 'Belgium',
  'سويسرا': 'Switzerland',
  'النمسا': 'Austria',
  'اليونان': 'Greece',
  'البرازيل': 'Brazil',
  'الأرجنتين': 'Argentina',
  'اليابان': 'Japan',
  'كوريا الجنوبية': 'South Korea',
};

export function getEnglishCountryName(countryInput?: string): string {
  if (!countryInput || !countryInput.trim()) return 'Yemen';
  const trimmed = countryInput.trim();
  if (ARABIC_TO_ENGLISH_COUNTRY_MAP[trimmed]) {
    return ARABIC_TO_ENGLISH_COUNTRY_MAP[trimmed];
  }
  for (const [ar, en] of Object.entries(ARABIC_TO_ENGLISH_COUNTRY_MAP)) {
    if (trimmed.includes(ar)) {
      return en;
    }
  }
  return trimmed;
}

const ARABIC_COUNTRY_MAP: Record<string, { name: string; flag: string }> = {
  YE: { name: 'اليمن', flag: '🇾🇪' },
  SA: { name: 'السعودية', flag: '🇸🇦' },
  EG: { name: 'مصر', flag: '🇪🇬' },
  AE: { name: 'الإمارات', flag: '🇦🇪' },
  IQ: { name: 'العراق', flag: '🇮🇶' },
  MA: { name: 'المغرب', flag: '🇲🇦' },
  DZ: { name: 'الجزائر', flag: '🇩🇿' },
  SY: { name: 'سوريا', flag: '🇸🇾' },
  JO: { name: 'الأردن', flag: '🇯🇴' },
  KW: { name: 'الكويت', flag: '🇰🇼' },
  OM: { name: 'عُمان', flag: '🇴🇲' },
  QA: { name: 'قطر', flag: '🇶🇦' },
  BH: { name: 'البحرين', flag: '🇧🇭' },
  LY: { name: 'ليبيا', flag: '🇱🇾' },
  TN: { name: 'تونس', flag: '🇹🇳' },
  SD: { name: 'السودان', flag: '🇸🇩' },
  PS: { name: 'فلسطين', flag: '🇵🇸' },
  LB: { name: 'لبنان', flag: '🇱🇧' },
  MR: { name: 'موريتانيا', flag: '🇲🇷' },
  SO: { name: 'الصومال', flag: '🇸🇴' },
  DJ: { name: 'جيبوتي', flag: '🇩🇯' },
  KM: { name: 'جزر القمر', flag: '🇰🇲' },
  US: { name: 'أمريكا', flag: '🇺🇸' },
  GB: { name: 'بريطانيا', flag: '🇬🇧' },
  DE: { name: 'ألمانيا', flag: '🇩🇪' },
  FR: { name: 'فرنسا', flag: '🇫🇷' },
  TR: { name: 'تركيا', flag: '🇹🇷' },
};

function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return '🇾🇪';
  return countryCode
    .toUpperCase()
    .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

export async function fetchUserGeoIP(): Promise<GeoIPResult> {
  // Primary attempt: ipwhois.app
  try {
    const response = await fetch('https://ipwhois.app/json/', { cache: 'no-cache' });
    if (response.ok) {
      const data = await response.json();
      if (data && data.success !== false) {
        const code = (data.country_code || '').toUpperCase();
        const mapped = ARABIC_COUNTRY_MAP[code];
        
        return {
          country: mapped?.name || data.country || 'اليمن',
          countryFlag: mapped?.flag || data.country_flag || getFlagEmoji(code),
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
        const mapped = ARABIC_COUNTRY_MAP[code];

        return {
          country: mapped?.name || data.country || 'اليمن',
          countryFlag: mapped?.flag || getFlagEmoji(code),
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
    for (const item of Object.values(ARABIC_COUNTRY_MAP)) {
      if (item.name === c) return item.flag;
    }
    for (const [code, item] of Object.entries(ARABIC_COUNTRY_MAP)) {
      if (code.toUpperCase() === c.toUpperCase() || item.name.includes(c)) return item.flag;
    }
  }
  return '🇾🇪';
}

