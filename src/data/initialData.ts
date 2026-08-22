import { Room, User, Message, PrivateMessage, Report, NewsPost, WallPost, Notification, StoreItem, ModLogEntry, RoomActivityLog, SiteSettings } from '../types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-general',
    name: 'غرفة العام',
    flag: '🌎',
    description: 'الملتقى الرئيسي لجميع الزوار والأعضاء للتواصل والدردشة العامة',
    isDefault: true
  },
  {
    id: 'room-yemen',
    name: 'غرفة اليمن',
    flag: '🇾🇪',
    description: 'غرفة أصل وفخامة السعيدة، تجمع الأحبة من صنعاء وعدن وتعز وكافة المحافظات'
  },
  {
    id: 'room-algeria',
    name: 'غرفة الجزائر',
    flag: '🇩🇿',
    description: 'غرفة مليون ونصف مليون شهيد، ترحيب خاص بإخواننا في الجزائر'
  },
  {
    id: 'room-egypt',
    name: 'غرفة مصر',
    flag: '🇪🇬',
    description: 'أم الدنيا وغرفة المحبة والابتسامة وخفة الدم المصرية'
  },
  {
    id: 'room-saudi',
    name: 'غرفة السعودية',
    flag: '🇸🇦',
    description: 'غرفة أهل الكرم والجود في المملكة العربية السعودية'
  }
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user-system',
    username: 'System',
    password: 'sys_password_2026',
    email: 'system@chat.ye',
    role: 'management',
    gender: 'other',
    age: 99,
    avatar: '/default_male.svg',
    wallCover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1000&q=80',
    statusMessage: '🤖 النظام الإداري المباشر | System',
    bio: 'حساب النظام الآلي الرسمي للشات لنشر التنبيهات والإشعارات والترحيب.',
    coins: 0,
    likes: 100,
    likedBy: ['user-owner'],
    country: 'اليمن',
    countryFlag: '⚙️',
    specialty: 'إدارة وتقنية 💻',
    specialtyCategory: 'tech',
    language: 'العربية 🇸🇦',
    currentRoomId: 'room-general',
    joinedDate: '01/01/2026',
    joinedTimestamp: 1767225600000,
    lastSeen: 'الآن',
    lastSeenTimestamp: 1767225600000,
    usernameColor: '#00a2e8',
    fontColor: '#00a2e8',
    fontSize: 16,
    isStealth: false,
    privatePrivacy: 'everyone',
    onlineStatus: 'online',
    ip: '127.0.0.1',
    friends: [],
    ignores: []
  },
  {
    id: 'user-owner',
    username: 'المالك',
    password: 'Owner@2026',
    email: 'owner@chat.ye',
    role: 'owner',
    gender: 'male',
    age: 28,
    avatar: '/default_male.svg',
    wallCover: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1000&q=80',
    statusMessage: '👑 المالك الرئيسي | مرحباً بكم في دردشة عربي المطورة',
    bio: 'حساب المالك الرئيسي والمؤسس للدردشة. يسعدني تواجدكم جميعاً.',
    coins: 1000000,
    likes: 500,
    likedBy: [],
    country: 'اليمن',
    countryFlag: '🇾🇪',
    specialty: 'إدارة وتطوير 💻',
    specialtyCategory: 'tech',
    language: 'العربية 🇸🇦',
    currentRoomId: 'room-general',
    joinedDate: '01/01/2026',
    joinedTimestamp: 1767225600000,
    lastSeen: 'الآن',
    lastSeenTimestamp: 1767225600000,
    usernameColor: '#f59e0b',
    fontColor: '#fbbf24',
    fontSize: 16,
    isStealth: false,
    privatePrivacy: 'everyone',
    onlineStatus: 'online',
    ip: '197.220.12.89',
    locationMap: 'صنعاء، اليمن',
    friends: [],
    ignores: []
  }
];

export const INITIAL_PRIVATE_MESSAGES: PrivateMessage[] = [];

export const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    roomId: 'room-general',
    senderId: 'user-katim',
    senderName: '0كاتم الاحزانツ彡',
    senderRole: 'vip',
    senderGender: 'male',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    senderUsernameColor: '#00a6d6',
    text: '🥷',
    type: 'text',
    timestamp: '16:11',
    date: '22/08/2026'
  },
  {
    id: 'msg-2',
    roomId: 'room-general',
    senderId: 'user-silva',
    senderName: 'silva',
    senderRole: 'member',
    senderGender: 'female',
    senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    senderUsernameColor: '#71717a',
    text: '🥷 彡★ كبرياء 彡★',
    type: 'text',
    timestamp: '16:11',
    date: '22/08/2026'
  },
  {
    id: 'msg-3',
    roomId: 'room-general',
    senderId: 'user-raad',
    senderName: 'RAAD YAFAA',
    senderRole: 'admin',
    senderGender: 'male',
    senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    senderUsernameColor: '#0284c7',
    text: '彡★ كبرياء 彡★ الله يديمها عليك 💫 🥷 الحمد لله في أحسن حال',
    type: 'text',
    timestamp: '16:11',
    date: '22/08/2026'
  },
  {
    id: 'msg-4',
    roomId: 'room-general',
    senderId: 'user-kibriya',
    senderName: '彡★ كبرياء 彡★',
    senderRole: 'moderator',
    senderGender: 'male',
    senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    senderUsernameColor: '#8b5cf6',
    text: 'صح 🥷 RAAD YAFAA',
    type: 'text',
    timestamp: '16:11',
    date: '22/08/2026'
  },
  {
    id: 'msg-5',
    roomId: 'room-general',
    senderId: 'user-katim',
    senderName: '0كاتم الاحزانツ彡',
    senderRole: 'vip',
    senderGender: 'male',
    senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    senderUsernameColor: '#00a6d6',
    text: '🤣',
    type: 'text',
    timestamp: '16:11',
    date: '22/08/2026'
  },
  {
    id: 'msg-6',
    roomId: 'room-general',
    senderId: 'user-jawbak',
    senderName: 'جوابك سكوتي',
    senderRole: 'member',
    senderGender: 'female',
    senderAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    senderUsernameColor: '#a855f7',
    text: '🦅',
    type: 'text',
    timestamp: '16:12',
    date: '22/08/2026'
  }
];

export const INITIAL_REPORTS: Report[] = [];

export const INITIAL_NEWS: NewsPost[] = [
  {
    id: 'news-1',
    authorName: 'المالك',
    authorAvatar: '/default_male.svg',
    title: 'افتتاح النسخة الرسمية المطورة 🎉',
    content: 'أهلاً بكم جميعاً في شات عربي المطور، بأعلى معايير السرعة والأمان والتصميم المتكامل.',
    imageUrl: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=800&q=80',
    timestamp: '01/01/2026 - 12:00',
    reactions: {
      '❤️': ['user-owner']
    },
    comments: []
  }
];

export const INITIAL_WALL_POSTS: WallPost[] = [];

export const INITIAL_NOTIFICATIONS: Notification[] = [];

export const INITIAL_STORE_ITEMS: StoreItem[] = [
  {
    id: 'store-vip',
    role: 'vip',
    title: 'شراء رتبة مميز 💎',
    price: 500,
    badge: '💎',
    requiresOwnerApproval: false
  },
  {
    id: 'store-mod',
    role: 'moderator',
    title: 'شراء رتبة مشرف 🛡️',
    price: 150000,
    badge: '🛡️',
    requiresOwnerApproval: true // Requires owner approval for site security
  }
];

export const PROFANITY_WORDS = ['سب1', 'سب2', 'احتيال', 'شتيمة', 'كلمة_مسيئة'];

export const INITIAL_ROOM_ACTIVITY_LOGS: RoomActivityLog[] = [];

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  siteName: 'دردشة عربي المطورة',
  siteLogoEmoji: '💬',
  timeZone: 'Asia/Riyadh',
  defaultLanguage: 'ar',
  defaultTheme: 'light',
  primaryColor: '#0284c7',
  welcomePanoramaUrl: '',
  panoramaCarouselEnabled: false,
  allowGuestChat: true,
  allowGuestVoice: true,
  maxMessagesPerMinute: 30,
  maxMessageLength: 500,
  autoBotAntiSpam: true,
  paymentKuraimi: true,
  paymentUsdt: true,
  paymentPayeer: true,
  paymentMoneygram: true,
  supportEmail: 'support@chat.ye',
  facebookUrl: '',
  telegramUrl: '',
  whatsappNumber: '',
  showOnlineCount: true,
  showThirdPartyAds: false,
  sendEmailNotifications: false,
  onlinePresenceTimeoutHours: 0, // 0 = instant, 6, 12, 24, 48, -1 = forever
  hideRoomSwitchNotifications: false, // Owner toggle for hiding room movement
  antiFloodEnabled: true,
  floodMaxMessages: 6,
  floodWindowSeconds: 4,
  floodMaxRepeated: 3,
  floodAction: 'warn',
  floodMuteDurationMinutes: 5,
  antiSpamLinks: true,
  antiSpamCaps: false,
  guestChatMode: 'allowed',
  requireEmailVerification: false,
  enableCookieBan: true
};

