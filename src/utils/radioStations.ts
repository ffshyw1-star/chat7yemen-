import { RadioStation } from '../types';

export const RADIO_STATIONS: RadioStation[] = [
  {
    id: 'quran-tarteel',
    name: 'إذاعة القرآن الكريم (ترتيل مباشر)',
    description: 'بث مباشر متواصل لأعذب التلاوات القرآنية على مدار الساعة',
    url: 'https://qurango.net/radio/tarteel',
    category: 'قرآن كريم'
  },
  {
    id: 'quran-makkah',
    name: 'إذاعة القرآن الكريم - مكة المكرمة',
    description: 'تلاوات خاشعة من رحاب الحرم المكي الشريف',
    url: 'https://backup.qurango.net/radio/makkah',
    category: 'قرآن كريم'
  },
  {
    id: 'yemen-heritage',
    name: 'إذاعة صنعاء والتراث اليمني (طرب أصيل)',
    description: 'أجمل الأغاني والموروث الشعبي والفن الصنعاني واليمني',
    url: 'https://stream.zeno.fm/f3wvbbqmdg8uv',
    category: 'تراث وطرب'
  },
  {
    id: 'bbc-arabic',
    name: 'إذاعة الأخبار والثقافة العربية',
    description: 'نشرات إخبارية وتحليلات وبرامج ثقافية مباشرة',
    url: 'https://stream.zeno.fm/fvrx4527vd0uv',
    category: 'أخبار'
  },
  {
    id: 'relax-chill',
    name: 'إذاعة الروقان والموسيقى الهادئة',
    description: 'أنغام هادئة مريحة للأعصاب للدردشة والاسترخاء',
    url: 'https://stream.zeno.fm/4v3s90qdfv8uv',
    category: 'موسيقى'
  }
];
