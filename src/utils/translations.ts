// Multi-language translation engine for individual client-side localization

export type AppLanguage =
  | 'Arabic'
  | 'English'
  | 'Francais'
  | 'Spanish'
  | 'German'
  | 'Turkish'
  | 'Russian'
  | 'Bulgarian'
  | 'Croatia'
  | 'Greek'
  | 'Hebrew'
  | 'Netherlands'
  | 'Portuguese'
  | 'Romana';

export const SUPPORTED_LANGUAGES = [
  'Arabic', 'English', 'Francais', 'Spanish', 'German',
  'Turkish', 'Russian', 'Bulgarian', 'Croatia', 'Greek',
  'Hebrew', 'Netherlands', 'Portuguese', 'Romana'
] as const;

export function getAppLanguage(): string {
  if (typeof window === 'undefined') return 'Arabic';
  const saved = localStorage.getItem('selectedLang');
  if (saved && saved.trim()) {
    // Normalize if needed
    if (saved.toLowerCase().includes('arabic') || saved.includes('عربي')) return 'Arabic';
    if (saved.toLowerCase().includes('english') || saved.includes('انجليز')) return 'English';
    if (saved.toLowerCase().includes('francais') || saved.toLowerCase().includes('french') || saved.includes('فرنس')) return 'Francais';
    if (saved.toLowerCase().includes('spanish') || saved.includes('إسبان')) return 'Spanish';
    if (saved.toLowerCase().includes('german') || saved.includes('ألمان')) return 'German';
    if (saved.toLowerCase().includes('turkish') || saved.includes('ترك')) return 'Turkish';
    if (saved.toLowerCase().includes('russian') || saved.includes('روس')) return 'Russian';
    return saved;
  }
  return 'Arabic';
}

export function isRTL(lang?: string): boolean {
  const l = (lang || getAppLanguage()).toLowerCase();
  return l === 'arabic' || l === 'hebrew' || l.includes('عرب') || l.includes('عبر');
}

export function applyLanguageSettings(lang: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('selectedLang', lang);
  const rtl = isRTL(lang);
  document.documentElement.dir = rtl ? 'rtl' : 'ltr';
  document.documentElement.lang = rtl ? 'ar' : 'en';
  try {
    window.dispatchEvent(new CustomEvent('appLanguageChanged', { detail: lang }));
  } catch (e) {}
}

// Initialize on page load immediately
if (typeof window !== 'undefined') {
  const current = getAppLanguage();
  applyLanguageSettings(current);
}

// Translations Dictionary
const TRANSLATIONS: Record<string, Record<string, string>> = {
  // Brand & Site Names
  'brand.name': {
    Arabic: 'شات اليمن',
    English: 'Yemen Chat',
  },
  'brand.chat': {
    Arabic: 'شات',
    English: 'Chat',
  },
  'brand.yemen': {
    Arabic: 'اليمن',
    English: 'Yemen',
  },
  'brand.tagline': {
    Arabic: 'دردشة تعارف',
    English: 'Dating & Chat',
  },

  // Landing Page
  'landing.hero_title': {
    Arabic: 'دردشة تعارف',
    English: 'Dating & Chat',
  },
  'landing.hero_subtitle': {
    Arabic: 'موقع تعارف شباب وبنات العرب محادثات عامة ومحادثات خاصة بدون تسجيل',
    English: 'Free online chat rooms for friends to meet and talk in public and private without registration',
  },
  'landing.btn_login': {
    Arabic: 'دخول',
    English: 'Login',
  },
  'landing.btn_visitor': {
    Arabic: 'دخول الزوار',
    English: 'Guest Login',
  },
  'landing.btn_firebase': {
    Arabic: 'تسجيل سريع عبر Firebase Authentication',
    English: 'Quick Sign-in via Firebase Authentication',
  },
  'landing.not_registered': {
    Arabic: '. لست مسجل لدينا ؟ سجل الآن',
    English: 'Not registered yet? Register now',
  },

  // Modals Titles
  'modal.login_title': {
    Arabic: 'تسجيل الدخول للأعضاء',
    English: 'Member Login',
  },
  'modal.visitor_title': {
    Arabic: 'دخول الزوار السريع',
    English: 'Quick Guest Login',
  },
  'modal.register_title': {
    Arabic: 'إنشاء حساب جديد',
    English: 'Create New Account',
  },

  // Form Fields & Buttons
  'form.username_label': {
    Arabic: 'اسم المستخدم / البريد الإلكتروني',
    English: 'Username / Email Address',
  },
  'form.username_placeholder': {
    Arabic: 'اسم الحساب...',
    English: 'Account username...',
  },
  'form.password_label': {
    Arabic: 'كلمة المرور',
    English: 'Password',
  },
  'form.password_placeholder': {
    Arabic: 'كلمة المرور...',
    English: 'Password...',
  },
  'form.forgot_password': {
    Arabic: 'نسيت كلمة المرور ؟',
    English: 'Forgot password?',
  },
  'form.visitor_name_label': {
    Arabic: 'اسم المستخدم (زائر)',
    English: 'Guest Username',
  },
  'form.visitor_name_placeholder': {
    Arabic: 'اختر اسماً فريداً للزائر...',
    English: 'Choose a unique guest nickname...',
  },
  'form.visitor_mode_label': {
    Arabic: 'نوع دخول الزائر',
    English: 'Guest Access Mode',
  },
  'form.visitor_mode_chat': {
    Arabic: 'مسموح بالدردشة',
    English: 'Chat Allowed',
  },
  'form.visitor_mode_silent': {
    Arabic: '🔇 دخول صامت (مشاهدة)',
    English: '🔇 Silent Mode (Watch only)',
  },
  'form.gender_label': {
    Arabic: 'الجنس',
    English: 'Gender',
  },
  'form.gender_male': {
    Arabic: '👨 ذكر',
    English: '👨 Male',
  },
  'form.gender_female': {
    Arabic: '👩 أنثى',
    English: '👩 Female',
  },
  'form.age_label': {
    Arabic: 'العمر',
    English: 'Age',
  },
  'form.age_select': {
    Arabic: 'العمر (اختر)',
    English: 'Age (Select)',
  },
  'form.years_old': {
    Arabic: 'سنة',
    English: 'years',
  },
  'form.enter_chat': {
    Arabic: 'دخول الدردشة',
    English: 'Enter Chat',
  },
  'form.reg_username_label': {
    Arabic: 'اسم المستخدم',
    English: 'Username',
  },
  'form.reg_username_placeholder': {
    Arabic: 'اسمك الجديد...',
    English: 'Your new username...',
  },
  'form.email_label': {
    Arabic: 'البريد الإلكتروني',
    English: 'Email Address',
  },
  'form.email_placeholder': {
    Arabic: 'example@mail.com',
    English: 'example@mail.com',
  },
  'form.email_optional': {
    Arabic: 'اختياري (لحماية الحساب)',
    English: 'Optional (account protection)',
  },
  'form.email_required': {
    Arabic: 'مطلوب للتحقق 🔒',
    English: 'Required for verification 🔒',
  },
  'form.reg_btn': {
    Arabic: 'تسجيل حساب جديد',
    English: 'Register Account',
  },
  'form.confirm_reg_btn': {
    Arabic: 'تأكيد التسجيل',
    English: 'Confirm Registration',
  },
  'form.terms_notice': {
    Arabic: 'بتسجيلك أنت توافق على شروط الاستخدام وقوانين الدردشة',
    English: 'By registering, you agree to the Terms of Service and Chat Rules',
  },

  // SEO & Features
  'seo.headline': {
    Arabic: 'شات اليمن | دردشة تعارف |',
    English: 'Yemen Chat | Dating & Social Chat |',
  },
  'seo.description': {
    Arabic: 'منصة تواصل عربية حديثة وآمنة تتيح لك التعارف والدردشة العامة والخاصة مجاناً وبدون تسجيل مع شباب وبنات الوطن العربي.',
    English: 'A modern, secure communication platform for public and private chat without registration with friends from all over the world.',
  },
  'feat.chat_title': {
    Arabic: 'محادثات عامة وخاصة',
    English: 'Public & Private Chats',
  },
  'feat.chat_desc': {
    Arabic: 'غرف وتفاعل مستمر على مدار الساعة',
    English: '24/7 continuous room interaction',
  },
  'feat.voice_title': {
    Arabic: 'رسائل صوتية ورومات',
    English: 'Voice Notes & Rooms',
  },
  'feat.voice_desc': {
    Arabic: 'تعبير صريح وتفاعل حي ممتاز',
    English: 'Live voice communication and crystal sound',
  },
  'feat.country_title': {
    Arabic: 'ربط وتحديد الدول تلقائياً',
    English: 'Auto Country Detection',
  },
  'feat.country_desc': {
    Arabic: 'عرض الدولة والعلم تلقائياً بالـ IP',
    English: 'Automatic country and flag identification via IP',
  },
  'feat.security_title': {
    Arabic: 'أمان وحظر التطفل',
    English: 'Privacy & Security',
  },
  'feat.security_desc': {
    Arabic: 'تشفير وحماية الخصوصية كاملة',
    English: 'Complete privacy protection and encryption',
  },
  'policy.title': {
    Arabic: 'سياسة الشات والخصوصية',
    English: 'Chat Policy & Privacy',
  },
  'policy.item1': {
    Arabic: 'احترام الأعضاء والالتزام بالآداب العامة وعدم التجاوز.',
    English: 'Respect all members and observe public decency.',
  },
  'policy.item2': {
    Arabic: 'يمنع نشر الإعلانات التجارية أو الروابط المجهولة.',
    English: 'Commercial advertisements and unverified links are strictly forbidden.',
  },
  'policy.item3': {
    Arabic: 'مراجعة فورية للبلاغات من قِبل فريق المشرفين والإدارة.',
    English: 'Immediate review of all reports by our moderation and admin team.',
  },
  'footer.copyright': {
    Arabic: '© 2026 شات اليمن - جميع الحقوق محفوظة',
    English: '© 2026 Yemen Chat - All rights reserved',
  },
  'footer.cookies': {
    Arabic: 'إعدادات ملفات تعريف الارتباط والخصوصية 🍪',
    English: 'Cookie Settings & Privacy 🍪',
  },
  'footer.privacy_notice': {
    Arabic: 'يتم حفظ بيانات تسجيل الدخول وتفضيلات الدردشة في متصفحك المحلي بأمان',
    English: 'Login credentials and preferences are securely stored locally in your browser',
  },

  // Language Menu
  'lang.title': {
    Arabic: 'اختر لغة الموقع',
    English: 'Select Site Language',
  },
  'lang.saudi_arabic': {
    Arabic: 'علم السعودية - اللغة العربية',
    English: 'Saudi Arabia Flag - Arabic Language',
  },
  'lang.usa_english': {
    Arabic: 'علم أمريكا - اللغة الإنجليزية',
    English: 'United States Flag - English Language',
  },
  'lang.saudi_name': {
    Arabic: 'علم السعودية',
    English: 'Saudi Arabia',
  },
  'lang.arabic_name': {
    Arabic: 'اللغة العربية',
    English: 'Arabic',
  },
  'lang.usa_name': {
    Arabic: 'علم أمريكا',
    English: 'United States',
  },
  'lang.english_name': {
    Arabic: 'اللغة الإنجليزية',
    English: 'English',
  },
  // Navigation & Bottom Bar
  'nav.online': {
    Arabic: 'المتواجدين',
    English: 'Online',
    Francais: 'En ligne',
    Spanish: 'En línea',
    German: 'Online',
    Turkish: 'Çevrimiçi',
    Russian: 'В сети',
  },
  'nav.rooms': {
    Arabic: 'الغرف',
    English: 'Rooms',
    Francais: 'Salons',
    Spanish: 'Salas',
    German: 'Räume',
    Turkish: 'Odalar',
    Russian: 'Комнаты',
  },
  'nav.options': {
    Arabic: 'خيارات',
    English: 'Options',
    Francais: 'Options',
    Spanish: 'Opciones',
    German: 'Optionen',
    Turkish: 'Seçenekler',
    Russian: 'Опции',
  },
  'nav.station': {
    Arabic: 'محطة',
    English: 'Station',
    Francais: 'Station',
    Spanish: 'Estación',
    German: 'Sender',
    Turkish: 'İstasyon',
    Russian: 'Станция',
  },

  // Header
  'header.store': {
    Arabic: '.Store',
    English: '.Store',
    Francais: '.Boutique',
    Spanish: '.Tienda',
    German: '.Shop',
    Turkish: '.Mağaza',
    Russian: '.Магазин',
  },
  'header.friend_requests': {
    Arabic: 'طلبات الصداقة',
    English: 'Friend Requests',
    Francais: "Demandes d'amis",
    Spanish: 'Solicitudes de amistad',
    German: 'Freundschaftsanfragen',
    Turkish: 'Arkadaşlık İstekleri',
    Russian: 'Заявки в друзья',
  },
  'header.private_messages': {
    Arabic: 'الرسائل الخاصة',
    English: 'Private Messages',
    Francais: 'Messages privés',
    Spanish: 'Mensajes privados',
    German: 'Private Nachrichten',
    Turkish: 'Özel Mesajlar',
    Russian: 'Личные сообщения',
  },
  'header.reports': {
    Arabic: 'إبلاغات',
    English: 'Reports',
    Francais: 'Signalements',
    Spanish: 'Reportes',
    German: 'Meldungen',
    Turkish: 'Raporlar',
    Russian: 'Жалобы',
  },
  'header.likes': {
    Arabic: 'الإعجابات',
    English: 'Likes',
    Francais: "J'aime",
    Spanish: 'Me gusta',
    German: 'Gefällt mir',
    Turkish: 'Beğeniler',
    Russian: 'Лайки',
  },
  'header.menu': {
    Arabic: 'القائمة',
    English: 'Menu',
    Francais: 'Menu',
    Spanish: 'Menú',
    German: 'Menü',
    Turkish: 'Menü',
    Russian: 'Меню',
  },

  // Chat Input
  'input.placeholder': {
    Arabic: 'اكتب هنا... (أو اكتب Clear/ لمسح الشات)',
    English: 'Type here... (or type /clear to clear chat)',
    Francais: 'Écrivez ici... (ou /clear pour effacer)',
    Spanish: 'Escribe aquí... (o /clear para borrar)',
    German: 'Hier schreiben... (oder /clear zum Löschen)',
    Turkish: 'Buraya yazın... (veya temizlemek için /clear)',
    Russian: 'Напишите здесь... (или /clear для очистки)',
  },
  'input.send': {
    Arabic: 'إرسال',
    English: 'Send',
    Francais: 'Envoyer',
    Spanish: 'Enviar',
    German: 'Senden',
    Turkish: 'Gönder',
    Russian: 'Отправить',
  },
  'input.voice': {
    Arabic: 'تسجيل صوتي',
    English: 'Voice Record',
    Francais: 'Message vocal',
    Spanish: 'Nota de voz',
    German: 'Sprachnachricht',
    Turkish: 'Ses Kaydı',
    Russian: 'Голосовое сообщение',
  },

  // Account Settings / Options Modal
  'settings.title': {
    Arabic: 'خيارات الحساب والإعدادات',
    English: 'Account & Settings Options',
    Francais: 'Options et Paramètres',
    Spanish: 'Opciones de Cuenta y Ajustes',
    German: 'Konto & Einstellungen',
    Turkish: 'Hesap ve Ayarlar Seçenekleri',
    Russian: 'Настройки аккаунта',
  },
  'settings.lang_loc': {
    Arabic: 'اللغة والموقع',
    English: 'Language & Location',
    Francais: 'Langue et Emplacement',
    Spanish: 'Idioma y Ubicación',
    German: 'Sprache & Standort',
    Turkish: 'Dil ve Konum',
    Russian: 'Язык и местоположение',
  },
  'settings.account_info': {
    Arabic: 'معلومات الحساب',
    English: 'Account Info',
    Francais: 'Informations du compte',
    Spanish: 'Información de la cuenta',
    German: 'Kontoinformationen',
    Turkish: 'Hesap Bilgileri',
    Russian: 'Данные аккаунта',
  },
  'settings.colors': {
    Arabic: 'ألوان الخط والاسم',
    English: 'Colors & Font',
    Francais: 'Couleurs et police',
    Spanish: 'Colores y fuente',
    German: 'Farben & Schriftart',
    Turkish: 'Renkler ve Yazı Tipi',
    Russian: 'Цвета и шрифты',
  },
  'settings.save': {
    Arabic: 'حفظ',
    English: 'Save',
    Francais: 'Enregistrer',
    Spanish: 'Guardar',
    German: 'Speichern',
    Turkish: 'Kaydet',
    Russian: 'Сохранить',
  },
  'settings.cancel': {
    Arabic: 'إلغاء',
    English: 'Cancel',
    Francais: 'Annuler',
    Spanish: 'Cancelar',
    German: 'Abbrechen',
    Turkish: 'İptal',
    Russian: 'Отмена',
  },
  'settings.lang': {
    Arabic: 'اللغة',
    English: 'Language',
    Francais: 'Langue',
    Spanish: 'Idioma',
    German: 'Sprache',
    Turkish: 'Dil',
    Russian: 'Язык',
  },
  'settings.country': {
    Arabic: 'البلد',
    English: 'Country',
    Francais: 'Pays',
    Spanish: 'País',
    German: 'Land',
    Turkish: 'Ülke',
    Russian: 'Страна',
  },
  'settings.timezone': {
    Arabic: 'منطقة التوقيت الزمني',
    English: 'Timezone',
    Francais: 'Fuseau horaire',
    Spanish: 'Zona horaria',
    German: 'Zeitzone',
    Turkish: 'Saat Dilimi',
    Russian: 'Часовой пояс',
  },

  // Profile Editor Modal
  'profile.title': {
    Arabic: 'محرر الملف الشخصي والرمزية',
    English: 'Profile & Avatar Editor',
    Francais: "Éditeur de profil et d'avatar",
    Spanish: 'Editor de Perfil y Avatar',
    German: 'Profil- und Avatar-Editor',
    Turkish: 'Profil ve Avatar Düzenleyici',
    Russian: 'Редактор профиля и аватара',
  },
  'profile.username': {
    Arabic: 'اسم المستخدم',
    English: 'Username',
    Francais: "Nom d'utilisateur",
    Spanish: 'Nombre de usuario',
    German: 'Benutzername',
    Turkish: 'Kullanıcı Adı',
    Russian: 'Имя пользователя',
  },
  'profile.status': {
    Arabic: 'الحالة (Status)',
    English: 'Status',
    Francais: 'Statut',
    Spanish: 'Estado',
    German: 'Status',
    Turkish: 'Durum',
    Russian: 'Статус',
  },
  'profile.bio': {
    Arabic: 'نبذة عني (Bio)',
    English: 'About Me (Bio)',
    Francais: 'À propos de moi',
    Spanish: 'Sobre mí (Bio)',
    German: 'Über mich (Bio)',
    Turkish: 'Hakkımda (Bio)',
    Russian: 'О себе (Био)',
  },
  'profile.gender': {
    Arabic: 'الجنس',
    English: 'Gender',
    Francais: 'Genre',
    Spanish: 'Género',
    German: 'Geschlecht',
    Turkish: 'Cinsiyet',
    Russian: 'Пол',
  },
  'profile.age': {
    Arabic: 'العمر',
    English: 'Age',
    Francais: 'Âge',
    Spanish: 'Edad',
    German: 'Alter',
    Turkish: 'Yaş',
    Russian: 'Возраст',
  },
  'profile.male': {
    Arabic: 'ذكر',
    English: 'Male',
    Francais: 'Homme',
    Spanish: 'Masculino',
    German: 'Männlich',
    Turkish: 'Erkek',
    Russian: 'Мужской',
  },
  'profile.female': {
    Arabic: 'أنثى',
    English: 'Female',
    Francais: 'Femme',
    Spanish: 'Femenino',
    German: 'Weiblich',
    Turkish: 'Kadın',
    Russian: 'Женский',
  },

  // Rooms Page
  'rooms.title': {
    Arabic: 'غرف الدردشة والمحادثة',
    English: 'Chat & Conversation Rooms',
    Francais: 'Salons de discussion',
    Spanish: 'Salas de chat',
    German: 'Chat-Räume',
    Turkish: 'Sohbet Odaları',
    Russian: 'Комнаты чата',
  },
  'rooms.enter': {
    Arabic: 'دخول الغرفة',
    English: 'Enter Room',
    Francais: 'Entrer dans le salon',
    Spanish: 'Entrar a la sala',
    German: 'Raum betreten',
    Turkish: 'Odaya Gir',
    Russian: 'Войти в комнату',
  },
};

export function t(key: string, fallback?: string, langOverride?: string): string {
  const currentLang = langOverride || getAppLanguage();
  const entry = TRANSLATIONS[key];
  if (!entry) return fallback || key;
  return entry[currentLang] || entry['English'] || entry['Arabic'] || fallback || key;
}

