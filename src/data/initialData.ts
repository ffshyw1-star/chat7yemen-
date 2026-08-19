import { Room, User, Message, PrivateMessage, Report, NewsPost, WallPost, Notification, StoreItem, ModLogEntry, RoomActivityLog } from '../types';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'room-general',
    name: 'غرفة العام',
    flag: '🌎',
    description: 'الملتقى الرئيسي لجميع الزوار والأعضاء للتواصل والدردشة العامة',
    isDefault: true,
    baseUserCount: 15
  },
  {
    id: 'room-yemen',
    name: 'غرفة اليمن',
    flag: '🇾🇪',
    description: 'غرفة أصل وفخامة السعيدة، تجمع الأحبة من صنعاء وعدن وتعز وكافة المحافظات',
    baseUserCount: 8
  },
  {
    id: 'room-algeria',
    name: 'غرفة الجزائر',
    flag: '🇩🇿',
    description: 'غرفة مليون ونصف مليون شهيد، ترحيب خاص بإخواننا في الجزائر',
    baseUserCount: 5
  },
  {
    id: 'room-egypt',
    name: 'غرفة مصر',
    flag: '🇪🇬',
    description: 'أم الدنيا وغرفة المحبة والابتسامة وخفة الدم المصرية',
    baseUserCount: 4
  },
  {
    id: 'room-saudi',
    name: 'غرفة السعودية',
    flag: '🇸🇦',
    description: 'غرفة أهل الكرم والجود في المملكة العربية السعودية',
    baseUserCount: 3
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
    currentRoomId: 'room-general',
    joinedDate: '01/01/2026',
    lastSeen: 'الآن',
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
    currentRoomId: 'room-general',
    joinedDate: '01/01/2026',
    lastSeen: 'الآن',
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
    id: 'msg-welcome-sys',
    roomId: 'room-general',
    senderId: 'user-system',
    senderName: 'System',
    senderRole: 'management',
    senderGender: 'other',
    senderAvatar: '/default_male.svg',
    senderUsernameColor: '#00a2e8',
    text: 'مرحباً بكم في دردشة عربي المطورة 🇾🇪 أهلاً وسهلاً بجميع الزوار والأعضاء الكرام ✨',
    type: 'text',
    timestamp: '12:00',
    date: '01/01/2026'
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

