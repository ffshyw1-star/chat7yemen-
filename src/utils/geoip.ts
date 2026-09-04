// GeoIP & User Profile Specialty Utility for fetching user's country, country flag, language, and IP address automatically

export interface GeoIPResult {
  country: string;
  countryFlag: string;
  language: string;
  ip: string;
}

export interface UserSpecialty {
  id: string;
  name: string;
  icon: string;
  category: 'tech' | 'management' | 'creative' | 'business' | 'medical' | 'student' | 'general';
  description: string;
  color: string;
}

export const USER_SPECIALTIES: UserSpecialty[] = [
  { id: 'dev', name: 'مبرمج ومطور', icon: '💻', category: 'tech', description: 'تطوير البرمجيات والمواقع والأنظمة', color: '#3b82f6' },
  { id: 'design', name: 'مصمم جرافيك وفنون', icon: '🎨', category: 'creative', description: 'تصميم الهويات الرقمية والواجهات', color: '#ec4899' },
  { id: 'admin_spec', name: 'إدارة وإشراف', icon: '🛡️', category: 'management', description: 'تنظيم الحوار وإدارة المجتمعات', color: '#f59e0b' },
  { id: 'business_spec', name: 'رائد أعمال وتجارة', icon: '💼', category: 'business', description: 'إدارة الأعمال والاستثمار', color: '#10b981' },
  { id: 'content', name: 'صانع محتوى وإعلام', icon: '✍️', category: 'creative', description: 'الكتابة والإعلام والتواصل', color: '#8b5cf6' },
  { id: 'security', name: 'أمن سيبراني وتقنية', icon: '🔒', category: 'tech', description: 'حماية الشبكات والأنظمة الرقمية', color: '#ef4444' },
  { id: 'audio', name: 'هندسة صوت وموسيقى', icon: '🎧', category: 'creative', description: 'المكساج والإنتاج الصوتي', color: '#06b6d4' },
  { id: 'medical_spec', name: 'طبيب وصحة', icon: '🩺', category: 'medical', description: 'مجال الطب والرعاية الصحية', color: '#14b8a6' },
  { id: 'engineer', name: 'مهندس / هندسة', icon: '📐', category: 'tech', description: 'الهندسة المعمارية والمدنية والكهربائية', color: '#f97316' },
  { id: 'teacher', name: 'معلم ومربي أجيال', icon: '📚', category: 'student', description: 'التعليم والتدريب الأكاديمي', color: '#6366f1' },
  { id: 'student', name: 'طالب / دراسة', icon: '🎓', category: 'student', description: 'طلاب جامعيون ومدرسيون طموحون', color: '#eab308' },
  { id: 'general', name: 'عضو مميز 🌟', icon: '🌟', category: 'general', description: 'اهتمامات عامة وثقافة شاملة', color: '#64748b' },
];

export const SPECIALTIES_LIST = USER_SPECIALTIES;

export interface CountryInfo {
  code: string;
  name: string;
  englishName: string;
  flag: string;
  language: string;
}

// Complete world countries list with Arabic names, English names, and Flags
export const COUNTRIES_LIST: CountryInfo[] = [
  // --- الدول العربية (Arab World) ---
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

  // --- الشرق الأوسط وآسيا (Asia & Middle East) ---
  { code: 'TR', name: 'تركيا', englishName: 'Turkey', flag: '🇹🇷', language: 'Türkçe 🇹🇷' },
  { code: 'IR', name: 'إيران', englishName: 'Iran', flag: '🇮🇷', language: 'فارسی 🇮🇷' },
  { code: 'AF', name: 'أفغانستان', englishName: 'Afghanistan', flag: '🇦🇫', language: 'پښتو / دری 🇦🇫' },
  { code: 'PK', name: 'باكستان', englishName: 'Pakistan', flag: '🇵🇰', language: 'اردو / English 🇵🇰' },
  { code: 'IN', name: 'الهند', englishName: 'India', flag: '🇮🇳', language: 'हिन्दी / English 🇮🇳' },
  { code: 'BD', name: 'بنغلاديش', englishName: 'Bangladesh', flag: '🇧🇩', language: 'বাংলা 🇧🇩' },
  { code: 'CN', name: 'الصين', englishName: 'China', flag: '🇨🇳', language: '中文 🇨🇳' },
  { code: 'JP', name: 'اليابان', englishName: 'Japan', flag: '🇯🇵', language: '日本語 🇯🇵' },
  { code: 'KR', name: 'كوريا الجنوبية', englishName: 'South Korea', flag: '🇰🇷', language: '한국어 🇰🇷' },
  { code: 'KP', name: 'كوريا الشمالية', englishName: 'North Korea', flag: '🇰🇵', language: '한국어 🇰🇵' },
  { code: 'ID', name: 'إندونيسيا', englishName: 'Indonesia', flag: '🇮🇩', language: 'Bahasa Indonesia 🇮🇩' },
  { code: 'MY', name: 'ماليزيا', englishName: 'Malaysia', flag: '🇲🇾', language: 'Bahasa Melayu 🇲🇾' },
  { code: 'PH', name: 'الفلبين', englishName: 'Philippines', flag: '🇵🇭', language: 'Filipino / English 🇵🇭' },
  { code: 'TH', name: 'تايلاند', englishName: 'Thailand', flag: '🇹🇭', language: 'ไทย 🇹🇭' },
  { code: 'VN', name: 'فيتنام', englishName: 'Vietnam', flag: '🇻🇳', language: 'Tiếng Việt 🇻🇳' },
  { code: 'SG', name: 'سنغافورة', englishName: 'Singapore', flag: '🇸🇬', language: 'English 🇸🇬' },
  { code: 'AZ', name: 'أذربيجان', englishName: 'Azerbaijan', flag: '🇦🇿', language: 'Azərbaycan 🇦🇿' },
  { code: 'GE', name: 'جورجيا', englishName: 'Georgia', flag: '🇬🇪', language: 'ქართული 🇬🇪' },
  { code: 'AM', name: 'أرمينيا', englishName: 'Armenia', flag: '🇦🇲', language: 'Հայերեն 🇦🇲' },
  { code: 'KZ', name: 'كازاخستان', englishName: 'Kazakhstan', flag: '🇰🇿', language: 'Қазақша 🇰🇿' },
  { code: 'UZ', name: 'أوزبكستان', englishName: 'Uzbekistan', flag: '🇺🇿', language: 'Oʻzbekcha 🇺🇿' },
  { code: 'TM', name: 'تركمانستان', englishName: 'Turkmenistan', flag: '🇹🇲', language: 'Türkmençe 🇹🇲' },
  { code: 'TJ', name: 'طاجيكستان', englishName: 'Tajikistan', flag: '🇹🇯', language: 'Тоҷикӣ 🇹🇯' },
  { code: 'KG', name: 'قيرغيزستان', englishName: 'Kyrgyzstan', flag: '🇰🇬', language: 'Кыргызча 🇰🇬' },
  { code: 'LK', name: 'سريلانكا', englishName: 'Sri Lanka', flag: '🇱🇰', language: 'සිංහල / தமிழ் 🇱🇰' },
  { code: 'NP', name: 'نيبال', englishName: 'Nepal', flag: '🇳🇵', language: 'नेपाली 🇳🇵' },
  { code: 'MM', name: 'ميانمار', englishName: 'Myanmar', flag: '🇲🇲', language: 'မြန်မာစာ 🇲🇲' },
  { code: 'KH', name: 'كمبوديا', englishName: 'Cambodia', flag: '🇰🇭', language: 'ភាសាខ្មែរ 🇰🇭' },
  { code: 'LA', name: 'لاوس', englishName: 'Laos', flag: '🇱🇦', language: 'ພາສາລາວ 🇱🇦' },
  { code: 'BN', name: 'بروناي', englishName: 'Brunei', flag: '🇧🇳', language: 'Melayu 🇧🇳' },
  { code: 'MV', name: 'جزر المالديف', englishName: 'Maldives', flag: '🇲🇻', language: 'ދިވެހި 🇲🇻' },
  { code: 'BT', name: 'بوتان', englishName: 'Bhutan', flag: '🇧🇹', language: 'རྫོང་ཁ 🇧🇹' },
  { code: 'MN', name: 'منغوليا', englishName: 'Mongolia', flag: '🇲🇳', language: 'Монгол 🇲🇳' },
  { code: 'TW', name: 'تايوان', englishName: 'Taiwan', flag: '🇹🇼', language: '繁體中文 🇹🇼' },
  { code: 'HK', name: 'هونغ كونغ', englishName: 'Hong Kong', flag: '🇭🇰', language: '粵語 / English 🇭🇰' },
  { code: 'TL', name: 'تيمور الشرقية', englishName: 'Timor-Leste', flag: '🇹🇱', language: 'Tetum / Português 🇹🇱' },
  { code: 'CY', name: 'قبرص', englishName: 'Cyprus', flag: '🇨🇾', language: 'Ελληνικά / Türkçe 🇨🇾' },

  // --- أوروبا (Europe) ---
  { code: 'GB', name: 'بريطانيا', englishName: 'United Kingdom', flag: '🇬🇧', language: 'English 🇬🇧' },
  { code: 'DE', name: 'ألمانيا', englishName: 'Germany', flag: '🇩🇪', language: 'Deutsch 🇩🇪' },
  { code: 'FR', name: 'فرنسا', englishName: 'France', flag: '🇫🇷', language: 'Français 🇫🇷' },
  { code: 'IT', name: 'إيطاليا', englishName: 'Italy', flag: '🇮🇹', language: 'Italiano 🇮🇹' },
  { code: 'ES', name: 'إسبانيا', englishName: 'Spain', flag: '🇪🇸', language: 'Español 🇪🇸' },
  { code: 'BE', name: 'بلجيكا', englishName: 'Belgium', flag: '🇧🇪', language: 'Français / Nederlands 🇧🇪' },
  { code: 'NL', name: 'هولندا', englishName: 'Netherlands', flag: '🇳🇱', language: 'Nederlands 🇳🇱' },
  { code: 'CH', name: 'سويسرا', englishName: 'Switzerland', flag: '🇨🇭', language: 'Deutsch / Français 🇨🇭' },
  { code: 'SE', name: 'السويد', englishName: 'Sweden', flag: '🇸🇪', language: 'Svenska 🇸🇪' },
  { code: 'NO', name: 'النرويج', englishName: 'Norway', flag: '🇳🇴', language: 'Norsk 🇳🇴' },
  { code: 'DK', name: 'الدنمارك', englishName: 'Denmark', flag: '🇩🇰', language: 'Dansk 🇩🇰' },
  { code: 'FI', name: 'فنلندا', englishName: 'Finland', flag: '🇫🇮', language: 'Suomi 🇫🇮' },
  { code: 'AT', name: 'النمسا', englishName: 'Austria', flag: '🇦🇹', language: 'Deutsch 🇦🇹' },
  { code: 'PT', name: 'البرتغال', englishName: 'Portugal', flag: '🇵🇹', language: 'Português 🇵🇹' },
  { code: 'GR', name: 'اليونان', englishName: 'Greece', flag: '🇬🇷', language: 'Ελληνικά 🇬🇷' },
  { code: 'RU', name: 'روسيا', englishName: 'Russia', flag: '🇷🇺', language: 'Русский 🇷🇺' },
  { code: 'UA', name: 'أوكرانيا', englishName: 'Ukraine', flag: '🇺🇦', language: 'Українська 🇺🇦' },
  { code: 'PL', name: 'بولندا', englishName: 'Poland', flag: '🇵🇱', language: 'Polski 🇵🇱' },
  { code: 'CZ', name: 'التشيك', englishName: 'Czech Republic', flag: '🇨🇿', language: 'Čeština 🇨🇿' },
  { code: 'HU', name: 'المجر', englishName: 'Hungary', flag: '🇭🇺', language: 'Magyar 🇭🇺' },
  { code: 'RO', name: 'رومانيا', englishName: 'Romania', flag: '🇷🇴', language: 'Română 🇷🇴' },
  { code: 'IE', name: 'أيرلندا', englishName: 'Ireland', flag: '🇮🇪', language: 'English 🇮🇪' },
  { code: 'HR', name: 'كرواتيا', englishName: 'Croatia', flag: '🇭🇷', language: 'Hrvatski 🇭🇷' },
  { code: 'RS', name: 'صربيا', englishName: 'Serbia', flag: '🇷🇸', language: 'Српски 🇷🇸' },
  { code: 'BG', name: 'بلغاريا', englishName: 'Bulgaria', flag: '🇧🇬', language: 'Български 🇧🇬' },
  { code: 'SK', name: 'سلوفاكيا', englishName: 'Slovakia', flag: '🇸🇰', language: 'Slovenčina 🇸🇰' },
  { code: 'BY', name: 'بيلاروسيا', englishName: 'Belarus', flag: '🇧🇾', language: 'Беларуская 🇧🇾' },
  { code: 'SI', name: 'سلوفينيا', englishName: 'Slovenia', flag: '🇸🇮', language: 'Slovenščina 🇸🇮' },
  { code: 'EE', name: 'إستونيا', englishName: 'Estonia', flag: '🇪🇪', language: 'Eesti 🇪🇪' },
  { code: 'LV', name: 'لاتفيا', englishName: 'Latvia', flag: '🇱🇻', language: 'Latviešu 🇱🇻' },
  { code: 'LT', name: 'ليتوانيا', englishName: 'Lithuania', flag: '🇱🇹', language: 'Lietuvių 🇱🇹' },
  { code: 'AL', name: 'ألبانيا', englishName: 'Albania', flag: '🇦🇱', language: 'Shqip 🇦🇱' },
  { code: 'BA', name: 'البوسنة والهرسك', englishName: 'Bosnia and Herzegovina', flag: '🇧🇦', language: 'Bosanski 🇧🇦' },
  { code: 'MK', name: 'مقدونيا الشمالية', englishName: 'North Macedonia', flag: '🇲🇰', language: 'Македонски 🇲🇰' },
  { code: 'ME', name: 'الجبل الأسود', englishName: 'Montenegro', flag: '🇲🇪', language: 'Crnogorski 🇲🇪' },
  { code: 'MD', name: 'مولدوفا', englishName: 'Moldova', flag: '🇲🇩', language: 'Română 🇲🇩' },
  { code: 'MT', name: 'مالطا', englishName: 'Malta', flag: '🇲🇹', language: 'Malti / English 🇲🇹' },
  { code: 'IS', name: 'أيسلندا', englishName: 'Iceland', flag: '🇮🇸', language: 'Íslenska 🇮🇸' },
  { code: 'LU', name: 'لوكسمبورغ', englishName: 'Luxembourg', flag: '🇱🇺', language: 'Lëtzebuergesch 🇱🇺' },
  { code: 'MC', name: 'موناكو', englishName: 'Monaco', flag: '🇲🇨', language: 'Français 🇲🇨' },
  { code: 'LI', name: 'ليختنشتاين', englishName: 'Liechtenstein', flag: '🇱🇮', language: 'Deutsch 🇱🇮' },
  { code: 'AD', name: 'أندورا', englishName: 'Andorra', flag: '🇦🇩', language: 'Català 🇦🇩' },
  { code: 'SM', name: 'سان مارينو', englishName: 'San Marino', flag: '🇸🇲', language: 'Italiano 🇸🇲' },
  { code: 'VA', name: 'الفاتيكان', englishName: 'Vatican City', flag: '🇻🇦', language: 'Italiano 🇻🇦' },

  // --- الأمريكيتين (Americas) ---
  { code: 'US', name: 'أمريكا', englishName: 'United States', flag: '🇺🇸', language: 'English 🇺🇸' },
  { code: 'CA', name: 'كندا', englishName: 'Canada', flag: '🇨🇦', language: 'English / Français 🇨🇦' },
  { code: 'MX', name: 'المكسيك', englishName: 'Mexico', flag: '🇲🇽', language: 'Español 🇲🇽' },
  { code: 'BR', name: 'البرازيل', englishName: 'Brazil', flag: '🇧🇷', language: 'Português 🇧🇷' },
  { code: 'AR', name: 'الأرجنتين', englishName: 'Argentina', flag: '🇦🇷', language: 'Español 🇦🇷' },
  { code: 'CL', name: 'تشيلي', englishName: 'Chile', flag: '🇨🇱', language: 'Español 🇨🇱' },
  { code: 'CO', name: 'كولومبيا', englishName: 'Colombia', flag: '🇨🇴', language: 'Español 🇨🇴' },
  { code: 'PE', name: 'بيرو', englishName: 'Peru', flag: '🇵🇪', language: 'Español 🇵🇪' },
  { code: 'VE', name: 'فنزويلا', englishName: 'Venezuela', flag: '🇻🇪', language: 'Español 🇻🇪' },
  { code: 'EC', name: 'الإكوادور', englishName: 'Ecuador', flag: '🇪🇨', language: 'Español 🇪🇨' },
  { code: 'BO', name: 'بوليفيا', englishName: 'Bolivia', flag: '🇧🇴', language: 'Español 🇧🇴' },
  { code: 'PY', name: 'باراغواي', englishName: 'Paraguay', flag: '🇵🇾', language: 'Español 🇵🇾' },
  { code: 'UY', name: 'أوروغواي', englishName: 'Uruguay', flag: '🇺🇾', language: 'Español 🇺🇾' },
  { code: 'CU', name: 'كوبا', englishName: 'Cuba', flag: '🇨🇺', language: 'Español 🇨🇺' },
  { code: 'DO', name: 'جمهورية الدومينيكان', englishName: 'Dominican Republic', flag: '🇩🇴', language: 'Español 🇩🇴' },
  { code: 'PA', name: 'بنما', englishName: 'Panama', flag: '🇵🇦', language: 'Español 🇵🇦' },
  { code: 'CR', name: 'كوستاريكا', englishName: 'Costa Rica', flag: '🇨🇷', language: 'Español 🇨🇷' },
  { code: 'PR', name: 'بورتوريكو', englishName: 'Puerto Rico', flag: '🇵🇷', language: 'Español / English 🇵🇷' },
  { code: 'JM', name: 'جامايكا', englishName: 'Jamaica', flag: '🇯🇲', language: 'English 🇯🇲' },
  { code: 'GT', name: 'غواتيمالا', englishName: 'Guatemala', flag: '🇬🇹', language: 'Español 🇬🇹' },
  { code: 'HN', name: 'هندوراس', englishName: 'Honduras', flag: '🇭🇳', language: 'Español 🇭🇳' },
  { code: 'SV', name: 'السلفادور', englishName: 'El Salvador', flag: '🇸🇻', language: 'Español 🇸🇻' },
  { code: 'NI', name: 'نيكاراغوا', englishName: 'Nicaragua', flag: '🇳🇮', language: 'Español 🇳🇮' },
  { code: 'HT', name: 'هايتي', englishName: 'Haiti', flag: '🇭🇹', language: 'Kreyòl / Français 🇭🇹' },
  { code: 'TT', name: 'ترينيداد وتوباغو', englishName: 'Trinidad and Tobago', flag: '🇹🇹', language: 'English 🇹🇹' },
  { code: 'BS', name: 'باهاماس', englishName: 'Bahamas', flag: '🇧🇸', language: 'English 🇧🇸' },
  { code: 'BB', name: 'بربادوس', englishName: 'Barbados', flag: '🇧🇧', language: 'English 🇧🇧' },
  { code: 'BZ', name: 'بليز', englishName: 'Belize', flag: '🇧🇿', language: 'English 🇧🇿' },
  { code: 'GY', name: 'غيانا', englishName: 'Guyana', flag: '🇬🇾', language: 'English 🇬🇾' },
  { code: 'SR', name: 'سورينام', englishName: 'Suriname', flag: '🇸🇷', language: 'Nederlands 🇸🇷' },

  // --- أفريقيا (Africa) ---
  { code: 'ZA', name: 'جنوب أفريقيا', englishName: 'South Africa', flag: '🇿🇦', language: 'English / Afrikaans 🇿🇦' },
  { code: 'NG', name: 'نيجيريا', englishName: 'Nigeria', flag: '🇳🇬', language: 'English 🇳🇬' },
  { code: 'KE', name: 'كينيا', englishName: 'Kenya', flag: '🇰🇪', language: 'Swahili / English 🇰🇪' },
  { code: 'ET', name: 'إثيوبيا', englishName: 'Ethiopia', flag: '🇪🇹', language: 'አማርኛ 🇪🇹' },
  { code: 'GH', name: 'غانا', englishName: 'Ghana', flag: '🇬🇭', language: 'English 🇬🇭' },
  { code: 'TZ', name: 'تنزانيا', englishName: 'Tanzania', flag: '🇹🇿', language: 'Swahili / English 🇹🇿' },
  { code: 'SN', name: 'السنغال', englishName: 'Senegal', flag: '🇸🇳', language: 'Français / Wolof 🇸🇳' },
  { code: 'CI', name: 'ساحل العاج', englishName: 'Ivory Coast', flag: '🇨🇮', language: 'Français 🇨🇮' },
  { code: 'UG', name: 'أوغندا', englishName: 'Uganda', flag: '🇺🇬', language: 'English / Swahili 🇺🇬' },
  { code: 'CM', name: 'الكاميرون', englishName: 'Cameroon', flag: '🇨🇲', language: 'Français / English 🇨🇲' },
  { code: 'AO', name: 'أنغولا', englishName: 'Angola', flag: '🇦🇴', language: 'Português 🇦🇴' },
  { code: 'ZW', name: 'زيمبابوي', englishName: 'Zimbabwe', flag: '🇿🇼', language: 'English 🇿🇼' },
  { code: 'ZM', name: 'زامبيا', englishName: 'Zambia', flag: '🇿🇲', language: 'English 🇿🇲' },
  { code: 'RW', name: 'رواندا', englishName: 'Rwanda', flag: '🇷🇼', language: 'Kinyarwanda / Français 🇷🇼' },
  { code: 'ML', name: 'مالي', englishName: 'Mali', flag: '🇲🇱', language: 'Bambara / Français 🇲🇱' },
  { code: 'GN', name: 'غينيا', englishName: 'Guinea', flag: '🇬🇳', language: 'Français 🇬🇳' },
  { code: 'BJ', name: 'بنين', englishName: 'Benin', flag: '🇧🇯', language: 'Français 🇧🇯' },
  { code: 'BF', name: 'بوركينا فاسو', englishName: 'Burkina Faso', flag: '🇧🇫', language: 'Français 🇧🇫' },
  { code: 'TD', name: 'تشاد', englishName: 'Chad', flag: '🇹🇩', language: 'Français / العربية 🇹🇩' },
  { code: 'MG', name: 'مدغشقر', englishName: 'Madagascar', flag: '🇲🇬', language: 'Malagasy / Français 🇲🇬' },
  { code: 'MZ', name: 'موزمبيق', englishName: 'Mozambique', flag: '🇲🇿', language: 'Português 🇲🇿' },
  { code: 'NA', name: 'ناميبيا', englishName: 'Namibia', flag: '🇳🇦', language: 'English 🇳🇦' },
  { code: 'BW', name: 'بوتسوانا', englishName: 'Botswana', flag: '🇧🇼', language: 'English / Setswana 🇧🇼' },
  { code: 'MU', name: 'موريشيوس', englishName: 'Mauritius', flag: '🇲🇺', language: 'English / Français 🇲🇺' },
  { code: 'SC', name: 'سيشل', englishName: 'Seychelles', flag: '🇸🇨', language: 'Seselwa / English 🇸🇨' },
  { code: 'GA', name: 'الغابون', englishName: 'Gabon', flag: '🇬🇦', language: 'Français 🇬🇦' },
  { code: 'CG', name: 'الكونغو', englishName: 'Congo', flag: '🇨🇬', language: 'Français 🇨🇬' },
  { code: 'CD', name: 'جمهورية الكونغو الديمقراطية', englishName: 'DR Congo', flag: '🇨🇩', language: 'Français 🇨🇩' },
  { code: 'NE', name: 'النيجر', englishName: 'Niger', flag: '🇳🇪', language: 'Français 🇳🇪' },
  { code: 'TG', name: 'توغو', englishName: 'Togo', flag: '🇹🇬', language: 'Français 🇹🇬' },
  { code: 'SL', name: 'سيراليون', englishName: 'Sierra Leone', flag: '🇸🇱', language: 'English 🇸🇱' },
  { code: 'LR', name: 'ليبيريا', englishName: 'Liberia', flag: '🇱🇷', language: 'English 🇱🇷' },
  { code: 'ER', name: 'إريتريا', englishName: 'Eritrea', flag: '🇪🇷', language: 'ትግርኛ / العربية 🇪🇷' },
  { code: 'CF', name: 'جمهورية أفريقيا الوسطى', englishName: 'Central African Republic', flag: '🇨🇫', language: 'Français 🇨🇫' },
  { code: 'GQ', name: 'غينيا الاستوائية', englishName: 'Equatorial Guinea', flag: '🇬🇶', language: 'Español 🇬🇶' },
  { code: 'BI', name: 'بوروندي', englishName: 'Burundi', flag: '🇧🇮', language: 'Kirundi / Français 🇧🇮' },
  { code: 'LS', name: 'ليسوتو', englishName: 'Lesotho', flag: '🇱🇸', language: 'Sesotho / English 🇱🇸' },
  { code: 'SZ', name: 'إسواتيني', englishName: 'Eswatini', flag: '🇸🇿', language: 'English / siSwati 🇸🇿' },
  { code: 'GM', name: 'غامبيا', englishName: 'Gambia', flag: '🇬🇲', language: 'English 🇬🇲' },
  { code: 'CV', name: 'كاب فيردي', englishName: 'Cape Verde', flag: '🇨🇻', language: 'Português 🇨🇻' },
  { code: 'ST', name: 'ساو تومي وبرينسيب', englishName: 'Sao Tome and Principe', flag: '🇸🇹', language: 'Português 🇸🇹' },
  { code: 'SS', name: 'جنوب السودان', englishName: 'South Sudan', flag: '🇸🇸', language: 'English 🇸🇸' },

  // --- أوقيانوسيا (Oceania) ---
  { code: 'AU', name: 'أستراليا', englishName: 'Australia', flag: '🇦🇺', language: 'English 🇦🇺' },
  { code: 'NZ', name: 'نيوزيلندا', englishName: 'New Zealand', flag: '🇳🇿', language: 'English 🇳🇿' },
  { code: 'FJ', name: 'فيجي', englishName: 'Fiji', flag: '🇫🇯', language: 'English 🇫🇯' },
  { code: 'PG', name: 'بابوا غينيا الجديدة', englishName: 'Papua New Guinea', flag: '🇵🇬', language: 'English / Tok Pisin 🇵🇬' },
  { code: 'WS', name: 'ساموا', englishName: 'Samoa', flag: '🇼🇸', language: 'Samoan / English 🇼🇸' },
  { code: 'TO', name: 'تونغا', englishName: 'Tonga', flag: '🇹🇴', language: 'Tongan / English 🇹🇴' },
  { code: 'VU', name: 'فانواتو', englishName: 'Vanuatu', flag: '🇻🇺', language: 'Bislama / English 🇻🇺' },
  { code: 'SB', name: 'جزر سليمان', englishName: 'Solomon Islands', flag: '🇸🇧', language: 'English 🇸🇧' },
  { code: 'KI', name: 'كيريباتي', englishName: 'Kiribati', flag: '🇰🇮', language: 'English 🇰🇮' },
  { code: 'PW', name: 'بالاو', englishName: 'Palau', flag: '🇵🇼', language: 'Palauan / English 🇵🇼' },
  { code: 'MH', name: 'جزر مارشال', englishName: 'Marshall Islands', flag: '🇲🇭', language: 'Marshallese / English 🇲🇭' },
  { code: 'FM', name: 'ميكرونيسيا', englishName: 'Micronesia', flag: '🇫🇲', language: 'English 🇫🇲' },
  { code: 'NR', name: 'ناورو', englishName: 'Nauru', flag: '🇳🇷', language: 'Nauruan / English 🇳🇷' },
  { code: 'TV', name: 'توفالو', englishName: 'Tuvalu', flag: '🇹🇻', language: 'Tuvaluan / English 🇹🇻' },
];

export const ARABIC_TO_ENGLISH_COUNTRY_MAP: Record<string, string> = Object.fromEntries(
  COUNTRIES_LIST.map(c => [c.name, c.englishName])
);

export const ENGLISH_TO_ARABIC_COUNTRY_MAP: Record<string, string> = Object.fromEntries(
  COUNTRIES_LIST.map(c => [c.englishName.toLowerCase(), c.name])
);

export function getEnglishCountryName(countryInput?: string): string {
  if (!countryInput || !countryInput.trim()) return 'Yemen';
  const trimmed = countryInput.trim();
  if (ARABIC_TO_ENGLISH_COUNTRY_MAP[trimmed]) {
    return ARABIC_TO_ENGLISH_COUNTRY_MAP[trimmed];
  }
  for (const c of COUNTRIES_LIST) {
    if (trimmed.toLowerCase() === c.name.toLowerCase() || trimmed.toLowerCase() === c.englishName.toLowerCase()) {
      return c.englishName;
    }
  }
  return trimmed;
}

export function getArabicCountryName(countryInput?: string): string {
  if (!countryInput || !countryInput.trim()) return 'اليمن';
  const trimmed = countryInput.trim();
  if (trimmed === 'عدم إظهار' || trimmed === 'none' || trimmed === 'hide') {
    return 'عدم إظهار';
  }
  if (ENGLISH_TO_ARABIC_COUNTRY_MAP[trimmed.toLowerCase()]) {
    return ENGLISH_TO_ARABIC_COUNTRY_MAP[trimmed.toLowerCase()];
  }
  for (const c of COUNTRIES_LIST) {
    if (trimmed.toLowerCase() === c.englishName.toLowerCase() || trimmed.toUpperCase() === c.code || trimmed === c.name) {
      return c.name;
    }
  }
  return trimmed;
}

export function getCountryFlagByName(countryName?: string): string {
  if (!countryName || countryName === 'عدم إظهار') return '';
  const trimmed = countryName.trim();
  const found = COUNTRIES_LIST.find(
    c => c.name === trimmed ||
         c.englishName.toLowerCase() === trimmed.toLowerCase() ||
         c.code === trimmed.toUpperCase()
  );
  if (found) return found.flag;
  return '🇾🇪';
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
        // Proceed with external lookup for country
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
          country: found?.name || 'اليمن',
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
          country: found?.name || 'اليمن',
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
  if (user.hideCountry || user.showCountryFlag === false || user.country === 'عدم إظهار') {
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

/**
 * Extract identity ID number from user ID (e.g. visitor-1740234891 -> 4891 or last 4 digits)
 */
export function getUserIdentityNumber(id?: string): string {
  if (!id) return '';
  const digits = id.replace(/\D/g, '');
  if (digits.length >= 4) {
    return digits.slice(-4);
  }
  if (digits.length > 0) return digits;
  return id.replace(/^(visitor|member|user)-/i, '').slice(-4);
}

/**
 * Get formatted username tag e.g. "أحمد@1234" or "أحمد@"
 */
export function getUserDisplayTag(user?: { id?: string; username?: string } | null): string {
  if (!user || !user.username) return '';
  const idNum = getUserIdentityNumber(user.id);
  return idNum ? `${user.username}@${idNum}` : `${user.username}@`;
}
