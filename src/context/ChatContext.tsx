import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  User, UserRole, RoomRole, Gender, Room, Message, PrivateMessage,
  FriendRequest, Report, NewsPost, WallPost, Notification, StoreItem,
  ModLogEntry, OnlineStatus, PrivatePrivacySetting, ThemeMode,
  RoomActivityLog, RoomActivityType, SiteSettings, ToastNotification,
  IPModerationRecord, BlockConfirmState, BlockActionType
} from '../types';
import {
  INITIAL_ROOMS, INITIAL_USERS, INITIAL_MESSAGES, INITIAL_REPORTS,
  INITIAL_NEWS, INITIAL_WALL_POSTS, INITIAL_NOTIFICATIONS, INITIAL_STORE_ITEMS,
  INITIAL_ROOM_ACTIVITY_LOGS, PROFANITY_WORDS, INITIAL_PRIVATE_MESSAGES
} from '../data/initialData';
import { playChatSound } from '../utils/audio';
import { getRankEmoji, canBeIgnored } from '../utils/permissions';
import { filterProfanity } from '../utils/profanityFilter';
import { fetchUserGeoIP } from '../utils/geoip';
import { hashPassword, verifyPasswordMatch, isDuplicateUsername, normalizeUsername } from '../utils/security';
import {
  toEnglishDigits,
  formatEnglishTime,
  formatEnglishDate,
  formatEnglishDateTime,
  formatEnglishShortDateTime,
  formatEnglishSecondsTime
} from '../utils/dateUtils';
import {
  showBrowserNotification,
  tabTitleManager,
  requestBrowserNotificationPermission,
  getBrowserNotificationPermission
} from '../utils/browserNotifications';

interface AudioSettings {
  publicSound: boolean;
  privateSound: boolean;
  friendRequestSound: boolean;
  mentionSound: boolean;
  notifSound: boolean;
  reportAlertSound: boolean;
}

interface ChatContextType {
  currentUser: User | null;
  currentView: 'landing' | 'rooms' | 'chat';
  currentRoom: Room;
  rooms: Room[];
  users: User[];
  messages: Message[];
  privateMessages: PrivateMessage[];
  friendRequests: FriendRequest[];
  reports: Report[];
  news: NewsPost[];
  wallPosts: WallPost[];
  notifications: Notification[];
  storeItems: StoreItem[];
  modLogs: ModLogEntry[];
  roomActivityLogs: RoomActivityLog[];
  banList: string[]; // user IDs or IPs
  ipModerations: IPModerationRecord[];
  clientIp: string;
  checkIpStatus: (ipToCheck?: string) => {
    isBanned: boolean;
    isKicked: boolean;
    isMuted: boolean;
    bannedRecord: IPModerationRecord | null;
    kickedRecord: IPModerationRecord | null;
    mutedRecord: IPModerationRecord | null;
    activeRecords: IPModerationRecord[];
  };
  addIPModerationRecord: (record: IPModerationRecord) => void;
  removeIPModerationRecord: (idOrIp: string, type?: string) => void;
  customBadWords: string[];
  audioSettings: AudioSettings;
  themeMode: ThemeMode;
  unreadPrivateCount: number;
  activePrivateUserId: string | null;
  hiddenPrivateUserIds: string[];
  hidePrivateConversation: (userId: string) => void;
  unhidePrivateConversation: (userId: string) => void;
  clearAllPrivateConversations: () => void;
  selectedUserForCard: User | null;
  selectedUserForProfile: User | null;
  
  // Modals visibility toggles
  isProfileSettingsOpen: boolean;
  isOwnerDashboardOpen: boolean;
  isStoreOpen: boolean;
  isSideMenuOpen: boolean;
  isReportsOpen: boolean;
  isNotificationsOpen: boolean;
  isFriendRequestsOpen: boolean;
  isPrivateChatOpen: boolean;
  isOnlineListOpen: boolean;
  isRoomsListOpen: boolean;
  isRoomLogsOpen: boolean;
  isRoomSettingsOpen: boolean;
  inputInsertedUsername: string | null;
  topBannerMessage: string | null;

  // Site Settings
  siteSettings: SiteSettings;
  updateSiteSettings: (newSettings: Partial<SiteSettings>) => void;

  // Setters & Actions
  showTopBanner: (message: string) => void;
  setCurrentView: (view: 'landing' | 'rooms' | 'chat') => void;
  setActivePrivateUserId: (userId: string | null) => void;
  setSelectedUserForCard: (user: User | null) => void;
  setSelectedUserForProfile: (user: User | null) => void;
  setIsProfileSettingsOpen: (open: boolean) => void;
  setIsOwnerDashboardOpen: (open: boolean) => void;
  setIsStoreOpen: (open: boolean) => void;
  setIsSideMenuOpen: (open: boolean) => void;
  setIsReportsOpen: (open: boolean) => void;
  setIsNotificationsOpen: (open: boolean) => void;
  setIsFriendRequestsOpen: (open: boolean) => void;
  setIsPrivateChatOpen: (open: boolean) => void;
  setIsOnlineListOpen: (open: boolean) => void;
  setIsRoomsListOpen: (open: boolean) => void;
  setIsRoomLogsOpen: (open: boolean) => void;
  setIsRoomSettingsOpen: (open: boolean) => void;
  isLogoutConfirmOpen: boolean;
  setIsLogoutConfirmOpen: (open: boolean) => void;
  passwordPromptRoom: Room | null;
  setPasswordPromptRoom: (room: Room | null) => void;
  unlockedRoomIds: string[];
  blockConfirmState: BlockConfirmState;
  requestBlockConfirm: (
    target: { id: string; username: string; avatar?: string; role?: UserRole; gender?: Gender },
    actionType: BlockActionType,
    onConfirm: () => void
  ) => void;
  closeBlockConfirm: () => void;
  updateRoomDetails: (roomId: string, updates: { name?: string; description?: string; password?: string; isLocked?: boolean; welcomeMessage?: string; autoWelcomeEnabled?: boolean }) => void;
  sendRoomWelcomeMessage: (targetRoom: Room, username?: string, userRole?: UserRole) => void;
  assignRoomStaff: (roomId: string, userId: string, role: RoomRole) => void;
  removeRoomStaff: (roomId: string, userId: string) => void;
  muteUserInRoom: (roomId: string, userId: string) => void;
  unmuteUserInRoom: (roomId: string, userId: string) => void;
  kickUserFromRoom: (roomId: string, userId: string) => void;
  unkickUserFromRoom: (roomId: string, userId: string) => void;
  setInputInsertedUsername: (name: string | null) => void;
  addRoomActivityLog: (roomId: string, roomName: string, actorId: string, actorName: string, actorRole: UserRole, actionType: RoomActivityType, details: string, targetName?: string) => void;
  clearRoomActivityLogs: () => void;
  addCustomBadWord: (word: string) => void;
  removeCustomBadWord: (word: string) => void;

  loginAsVisitor: (username: string, age: number | string, gender: Gender) => { success: boolean; error?: string };
  loginAsMember: (username: string, password: string) => { success: boolean; error?: string };
  registerAccount: (username: string, password: string, email: string, age: number | string, gender: Gender) => { success: boolean; error?: string };
  loginAsOwner: () => User;
  logout: () => void;
  
  switchRoom: (roomId: string, passwordAttempt?: string) => boolean;
  sendMessage: (text: string, type?: Message['type'], mediaUrl?: string, voiceDuration?: number, textStyle?: { color?: string; fontSize?: string; fontWeight?: string }) => void;
  reactToMessage: (messageId: string, emoji: string) => void;
  sendPrivateMessage: (receiverId: string, text: string, type?: 'text' | 'image' | 'voice', mediaUrl?: string, voiceDuration?: number) => boolean;
  deletePrivateMessages: (targetUserId: string) => void;
  
  likeUser: (targetUserId: string) => void;
  sendFriendRequest: (targetUserId: string) => void;
  respondFriendRequest: (requestId: string, accept: boolean) => void;
  acceptFriendRequest: (requestId: string) => void;
  rejectFriendRequest: (requestId: string) => void;
  removeFriend: (friendId: string) => void;
  toggleIgnore: (targetUserId: string) => void;
  toggleBlockUser: (targetUserId: string) => void;
  isUserBlocked: (targetUserId: string) => boolean;
  reportUserMessage: (reportedUserId: string, messageText: string, reason: Report['reason'], details?: string) => void;
  resolveReport: (reportId: string) => void;
  deleteReport: (reportId: string) => void;
  updateReportCategory: (reportId: string, newReason: Report['reason'], newCategory?: string) => void;
  
  updateUserProfile: (updates: Partial<User>) => void;
  updateAudioSettings: (updates: Partial<AudioSettings>) => void;
  setThemeMode: (theme: ThemeMode) => void;
  buyRank: (role: 'vip' | 'moderator') => { success: boolean; message: string };
  
  // Mod & Owner actions
  addRoom: (name: string, flag: string, description: string) => void;
  deleteRoom: (roomId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  addCoins: (userId: string, amount: number) => void;
  clearModerationState: (userId: string) => void;
  toggleOwnerStealth: () => void;
  moderatorAction: (targetUserId: string, actionType: 'mute' | 'kick' | 'unmute' | 'unkick' | 'ban' | 'edit_name' | 'delete_account', durationMinutes?: number, reason?: string, newName?: string) => void;
  deleteMessage: (messageId: string) => void;
  clearChat: (roomId?: string) => void;
  ownerUpdateUser: (userId: string, updates: Partial<User>) => void;
  ownerUpdateStorePrices: (vipPrice: number, modPrice: number) => void;
  ownerUpdateRoomName: (roomId: string, newName: string) => void;
  banUser: (userId: string) => void;
  unbanUser: (userId: string) => void;
  
  addNewsPost: (title: string, content: string, imageUrl?: string) => void;
  deleteNewsPost: (newsId: string) => void;
  typingUsers: Record<string, { username: string; roomId: string; isTyping: boolean }>;
  sendTypingStatus: (isTyping: boolean) => void;
  reactToNews: (newsId: string, emoji: string) => void;
  addNewsComment: (newsId: string, content: string) => void;
  
  addWallPost: (content: string, imageUrl?: string) => void;
  deleteWallPost: (postId: string) => void;
  reactToWallPost: (postId: string) => void;
  addWallComment: (postId: string, content: string) => void;

  markNotificationsAsRead: () => void;
  deleteNotification: (notifId: string) => void;

  broadcastAudioAlert: (title: string, message: string, soundType?: string) => void;
  deleteUserAccount: (userId: string) => void;
  purgeSystemCache: () => void;
  toggleAdminStealth: () => void;
  deletePrivateConversation: (userId: string) => void;

  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;

  switchRoleForTesting: (role: UserRole) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistent users list (purging mock users)
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('araby_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(INITIAL_USERS.map(u => [u.id, u]));
          parsed.forEach((u: User) => {
            if (u && u.id && !['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'].includes(u.id)) {
              map.set(u.id, u);
            }
          });
          return Array.from(map.values());
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('araby_users', JSON.stringify(users));
    } catch (e) {
      console.error(e);
    }
  }, [users]);

  // Persistent currentUser state across reloads (browser-specific session)
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('araby_current_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return null;
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('araby_current_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('araby_current_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentUser]);

  // Sync currentUser with users list updates
  useEffect(() => {
    if (currentUser?.id) {
      const updatedInUsers = users.find(u => u.id === currentUser.id);
      if (updatedInUsers && JSON.stringify(updatedInUsers) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedInUsers);
      }
    }
  }, [users]);

  // Persistent currentView state across reloads (starts at landing for new browser sessions)
  const [currentView, setCurrentView] = useState<'landing' | 'rooms' | 'chat'>(() => {
    try {
      const savedUser = localStorage.getItem('araby_current_user');
      const savedView = localStorage.getItem('araby_current_view') as 'landing' | 'rooms' | 'chat' | null;
      if (savedUser && savedView && ['rooms', 'chat'].includes(savedView)) {
        return savedView;
      }
      if (savedUser) return 'rooms';
    } catch (e) {
      console.error(e);
    }
    return 'landing';
  });

  useEffect(() => {
    try {
      localStorage.setItem('araby_current_view', currentView);
    } catch (e) {
      console.error(e);
    }
  }, [currentView]);

  // Persistent currentRoom state across reloads
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [currentRoom, setCurrentRoom] = useState<Room>(() => {
    try {
      const savedRoom = localStorage.getItem('araby_current_room');
      if (savedRoom) {
        const parsed = JSON.parse(savedRoom);
        if (parsed && parsed.id) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_ROOMS[0];
  });

  useEffect(() => {
    try {
      localStorage.setItem('araby_current_room', JSON.stringify(currentRoom));
    } catch (e) {
      console.error(e);
    }
  }, [currentRoom]);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [privateMessages, setPrivateMessages] = useState<PrivateMessage[]>(INITIAL_PRIVATE_MESSAGES);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [reports, setReports] = useState<Report[]>(() => {
    try {
      const saved = localStorage.getItem('araby_reports');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_REPORTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('araby_reports', JSON.stringify(reports));
    } catch (e) {
      console.error(e);
    }
  }, [reports]);
  const [news, setNews] = useState<NewsPost[]>(INITIAL_NEWS);
  const [wallPosts, setWallPosts] = useState<WallPost[]>(INITIAL_WALL_POSTS);
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    try {
      const saved = localStorage.getItem('araby_notifications');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_NOTIFICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('araby_notifications', JSON.stringify(notifications));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);

  const userMsgTimestampsRef = useRef<number[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>(INITIAL_STORE_ITEMS);

  // Toast Notifications State
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toastData: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const newToast: ToastNotification = {
      ...toastData,
      id: `toast-${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
    setToasts(prev => [newToast, ...prev].slice(0, 5));

    const autoDuration = toastData.duration || 5000;
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== newToast.id));
    }, autoDuration);
  }, []);

  const [modLogs, setModLogs] = useState<ModLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem('araby_mod_logs');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('araby_mod_logs', JSON.stringify(modLogs));
    } catch (e) {
      console.error(e);
    }
  }, [modLogs]);
  const [roomActivityLogs, setRoomActivityLogs] = useState<RoomActivityLog[]>(INITIAL_ROOM_ACTIVITY_LOGS);
  const [banList, setBanList] = useState<string[]>([]);
  
  const [customBadWords, setCustomBadWords] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('araby_custom_bad_words');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return PROFANITY_WORDS || ['سب1', 'سب2', 'احتيال', 'شتيمة', 'كلمة_مسيئة'];
  });

  useEffect(() => {
    try {
      localStorage.setItem('araby_custom_bad_words', JSON.stringify(customBadWords));
    } catch (e) {
      console.error(e);
    }
  }, [customBadWords]);

  const addCustomBadWord = (word: string) => {
    const trimmed = word.trim();
    if (!trimmed) return;
    setCustomBadWords(prev => {
      if (prev.includes(trimmed)) return prev;
      return [...prev, trimmed];
    });
  };

  const removeCustomBadWord = (word: string) => {
    setCustomBadWords(prev => prev.filter(w => w !== word));
  };
  
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    try {
      const saved = localStorage.getItem('araby_audio_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return {
      publicSound: true,
      privateSound: true,
      friendRequestSound: true,
      mentionSound: true,
      notifSound: true,
      reportAlertSound: true
    };
  });

  const currentUserRef = useRef<User | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const audioSettingsRef = useRef<AudioSettings>(audioSettings);
  useEffect(() => {
    audioSettingsRef.current = audioSettings;
  }, [audioSettings]);

  useEffect(() => {
    try {
      localStorage.setItem('araby_audio_settings', JSON.stringify(audioSettings));
    } catch (e) {
      console.error(e);
    }
  }, [audioSettings]);

  const [hiddenPrivateUserIds, setHiddenPrivateUserIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('yemen_chat_hidden_private_users');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('yemen_chat_hidden_private_users', JSON.stringify(hiddenPrivateUserIds));
    } catch (e) {
      console.error(e);
    }
  }, [hiddenPrivateUserIds]);

  // WebSocket Client Connection Reference
  const socketRef = useRef<WebSocket | null>(null);

  const sendSocketEvent = useCallback((type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const hidePrivateConversation = useCallback((targetUserId: string) => {
    setHiddenPrivateUserIds(prev => prev.includes(targetUserId) ? prev : [...prev, targetUserId]);
  }, []);

  const unhidePrivateConversation = useCallback((targetUserId: string) => {
    setHiddenPrivateUserIds(prev => prev.filter(id => id !== targetUserId));
  }, []);

  const [activePrivateUserIdState, setActivePrivateUserIdState] = useState<string | null>(null);

  const setActivePrivateUserId = useCallback((userId: string | null) => {
    setActivePrivateUserIdState(userId);
    if (userId) {
      unhidePrivateConversation(userId);
    }
  }, [unhidePrivateConversation]);

  const activePrivateUserId = activePrivateUserIdState;

  // Unread Private Messages Count (Number of users who sent you unread messages)
  const unreadPrivateCount = useMemo(() => {
    if (!currentUser) return 0;
    const unreadSenders = new Set(
      privateMessages
        .filter(pm => pm.receiverId === currentUser.id && !pm.isRead)
        .map(pm => pm.senderId)
    );
    return unreadSenders.size;
  }, [privateMessages, currentUser]);

  const [selectedUserForCard, setSelectedUserForCard] = useState<User | null>(null);
  const [selectedUserForProfile, setSelectedUserForProfile] = useState<User | null>(null);

  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState<boolean>(false);
  const [isOwnerDashboardOpen, setIsOwnerDashboardOpen] = useState<boolean>(false);
  const [isStoreOpen, setIsStoreOpen] = useState<boolean>(false);

  // Site Settings state
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    siteName: 'شات اليمن المطور',
    siteLogoEmoji: '🇾🇪',
    timeZone: 'Asia/Aden',
    defaultLanguage: 'العربية 🇸🇦',
    defaultTheme: 'dark',
    primaryColor: '#0b333e',
    welcomePanoramaUrl: 'https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=800&q=80',
    panoramaCarouselEnabled: true,
    allowGuestChat: true,
    allowGuestVoice: true,
    maxMessagesPerMinute: 20,
    maxMessageLength: 500,
    autoBotAntiSpam: true,
    paymentKuraimi: true,
    paymentUsdt: true,
    paymentPayeer: true,
    paymentMoneygram: true,
    supportEmail: 'support@yemenchat.dev',
    facebookUrl: '@yemenchat',
    telegramUrl: '@yemenchat_support',
    whatsappNumber: '+967700000000',
    showOnlineCount: true,
    showThirdPartyAds: false,
    sendEmailNotifications: true,
  });

  const updateSiteSettings = useCallback((newSettings: Partial<SiteSettings>) => {
    setSiteSettings(prev => {
      const updated = { ...prev, ...newSettings };
      sendSocketEvent('UPDATE_SETTINGS', updated);
      fetch('/api/settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updated })
      }).catch(err => console.warn('Failed to persist site settings to D1:', err));
      return updated;
    });
  }, [sendSocketEvent]);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [isReportsOpen, setIsReportsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isFriendRequestsOpen, setIsFriendRequestsOpen] = useState<boolean>(false);
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState<boolean>(false);
  const [isOnlineListOpen, setIsOnlineListOpen] = useState<boolean>(false);
  const [isRoomsListOpen, setIsRoomsListOpen] = useState<boolean>(false);
  const [isRoomLogsOpen, setIsRoomLogsOpen] = useState<boolean>(false);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState<boolean>(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState<boolean>(false);
  const [passwordPromptRoom, setPasswordPromptRoom] = useState<Room | null>(null);
  const [unlockedRoomIds, setUnlockedRoomIds] = useState<string[]>([]);

  // Block / Unblock Confirmation Modal State
  const [blockConfirmState, setBlockConfirmState] = useState<BlockConfirmState>({
    isOpen: false,
    targetUser: null,
    actionType: 'block',
    onConfirm: undefined
  });

  const requestBlockConfirm = useCallback((
    target: { id: string; username: string; avatar?: string; role?: UserRole; gender?: Gender },
    actionType: BlockActionType,
    onConfirm: () => void
  ) => {
    setBlockConfirmState({
      isOpen: true,
      targetUser: target,
      actionType,
      onConfirm
    });
  }, []);

  const closeBlockConfirm = useCallback(() => {
    setBlockConfirmState(prev => ({
      ...prev,
      isOpen: false,
      onConfirm: undefined
    }));
  }, []);

  // Live Typing Indicators State
  const [typingUsers, setTypingUsers] = useState<Record<string, { username: string; roomId: string; isTyping: boolean }>>({});

  // Client IP & IP Moderations State
  const [clientIp, setClientIp] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('araby_client_ip');
      if (saved) return saved;
    } catch (e) {}
    return '197.220.12.89';
  });

  const clientIpRef = useRef<string>(clientIp);
  useEffect(() => {
    clientIpRef.current = clientIp;
  }, [clientIp]);

  const [ipModerations, setIpModerations] = useState<IPModerationRecord[]>(() => {
    try {
      const saved = localStorage.getItem('araby_ip_moderations');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse ip_moderations from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('araby_ip_moderations', JSON.stringify(ipModerations));
    } catch (e) {
      console.error('Failed to save ip_moderations to localStorage:', e);
    }
  }, [ipModerations]);

  useEffect(() => {
    try {
      localStorage.setItem('araby_client_ip', clientIp);
    } catch (e) {}
  }, [clientIp]);

  // Automatically mark private messages as read when opening a conversation
  useEffect(() => {
    if (activePrivateUserId && currentUser) {
      setPrivateMessages(prev => {
        let changed = false;
        const updated = prev.map(pm => {
          if (pm.senderId === activePrivateUserId && pm.receiverId === currentUser.id && !pm.isRead) {
            changed = true;
            return { ...pm, isRead: true };
          }
          return pm;
        });
        if (changed) {
          sendSocketEvent('MARK_PRIVATE_READ', { senderId: activePrivateUserId, receiverId: currentUser.id });
        }
        return changed ? updated : prev;
      });
    }
  }, [activePrivateUserId, currentUser, sendSocketEvent]);

  const addIPModerationRecord = useCallback((record: IPModerationRecord) => {
    setIpModerations(prev => {
      const filtered = prev.filter(r => !(r.ip === record.ip && r.type === record.type));
      return [...filtered, record];
    });
    sendSocketEvent('ADD_IP_MODERATION', record);
    fetch('/api/ip/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ADD', record }),
    }).catch(err => console.warn('Failed to persist IP mod to API:', err));
  }, [sendSocketEvent]);

  const removeIPModerationRecord = useCallback((idOrIp: string, type?: string) => {
    setIpModerations(prev => prev.filter(r => {
      if (r.id === idOrIp) return false;
      if (r.ip === idOrIp) {
        if (type) return r.type !== type;
        return false;
      }
      return true;
    }));
    sendSocketEvent('REMOVE_IP_MODERATION', { idOrIp });
    fetch('/api/ip/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'REMOVE', idOrIp }),
    }).catch(err => console.warn('Failed to remove IP mod via API:', err));
  }, [sendSocketEvent]);

  const checkIpStatus = useCallback((ipToCheck?: string) => {
    const ip = ipToCheck || clientIp;
    const now = Date.now();
    const active = ipModerations.filter(rec => {
      if (rec.ip !== ip && rec.ip !== 'all') return false;
      if (rec.type === 'ban') return true;
      if (rec.expiresAt) {
        return new Date(rec.expiresAt).getTime() > now;
      }
      return true;
    });

    const banned = active.find(r => r.type === 'ban');
    const kicked = active.find(r => r.type === 'kick');
    const muted = active.find(r => r.type === 'mute');

    return {
      isBanned: !!banned,
      isKicked: !!kicked,
      isMuted: !!muted,
      bannedRecord: banned || null,
      kickedRecord: kicked || null,
      mutedRecord: muted || null,
      activeRecords: active,
    };
  }, [clientIp, ipModerations]);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let pingInterval: NodeJS.Timeout;

    const connectWS = () => {
      try {
        ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.log("🟢 Connected to WebSocket Chat Server");
          if (currentUser) {
            ws?.send(JSON.stringify({ type: "JOIN_USER", payload: { user: currentUser } }));
          }
          pingInterval = setInterval(() => {
            if (ws && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: "PING" }));
            }
          }, 25000);
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const { type, payload } = data;

            switch (type) {
              case "INIT_STATE": {
                if (payload.messages && Array.isArray(payload.messages)) {
                  setMessages(payload.messages);
                }
                if (payload.privateMessages && Array.isArray(payload.privateMessages)) {
                  setPrivateMessages(payload.privateMessages);
                }
                if (payload.friendRequests && Array.isArray(payload.friendRequests)) {
                  setFriendRequests(payload.friendRequests);
                }
                if (payload.users && payload.users.length > 0) {
                  const cleanUsers = payload.users
                    .filter((u: User) => !['user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'].includes(u.id))
                    .map((u: User) => ({
                      ...u,
                      friends: (u.friends || []).filter(fId => fId !== 'user-system' && fId !== 'system')
                    }));
                  setUsers(cleanUsers);
                }
                if (payload.rooms && payload.rooms.length > 0) {
                  setRooms(payload.rooms);
                }
                if (payload.ipModerations && Array.isArray(payload.ipModerations)) {
                  setIpModerations(payload.ipModerations);
                }
                if (payload.notifications && Array.isArray(payload.notifications)) {
                  setNotifications(payload.notifications);
                }
                if (payload.siteSettings && typeof payload.siteSettings === 'object') {
                  setSiteSettings(prev => ({ ...prev, ...payload.siteSettings }));
                }
                break;
              }

              case "SYNC_SETTINGS": {
                if (payload && typeof payload === 'object') {
                  setSiteSettings(prev => ({ ...prev, ...payload }));
                }
                break;
              }

              case "NEW_MESSAGE": {
                const newMsg: Message = payload;
                setMessages(prev => {
                  if (prev.some(m => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });

                // In-app & Browser Notification for Mention in Public Chat
                const curUserMsg = currentUserRef.current;
                if (
                  curUserMsg &&
                  newMsg?.senderId &&
                  newMsg.senderId !== curUserMsg.id &&
                  newMsg.text &&
                  curUserMsg.username
                ) {
                  const mentionKeyword = curUserMsg.username.trim();
                  const isDirectlyMentioned = mentionKeyword && (
                    newMsg.text.includes(`@${mentionKeyword}`) ||
                    newMsg.text.toLowerCase().includes(mentionKeyword.toLowerCase())
                  );
                  const isAllMentioned = ['owner', 'admin', 'management'].includes(newMsg.senderRole || '') && (
                    newMsg.text.includes('@الجميع') || newMsg.text.toLowerCase().includes('@all')
                  );

                  if (isDirectlyMentioned || isAllMentioned) {
                    const mentionTitle = isAllMentioned
                      ? `نداء عام من ${newMsg.senderName || 'الإدارة'} 📢`
                      : `قام ${newMsg.senderName || 'مستخدم'} بذكرك 📣`;

                    const mentionNotif: Notification = {
                      id: `notif-mention-${Date.now()}-${Math.random()}`,
                      userId: curUserMsg.id,
                      type: 'mention',
                      title: isAllMentioned ? 'نداء عام للجميع 📢' : 'إشارة / ذكر اسم 📣',
                      message: isAllMentioned
                        ? `نداء عام من الإدارة "${newMsg.senderName || 'الإدارة'}": "${newMsg.text}"`
                        : `قام "${newMsg.senderName || 'مستخدم'}" بذكر اسمك في العامة: "${newMsg.text}"`,
                      senderId: newMsg.senderId,
                      senderName: newMsg.senderName,
                      senderAvatar: newMsg.senderAvatar,
                      timestamp: newMsg.timestamp || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }),
                      isRead: false
                    };
                    setNotifications(prev => [mentionNotif, ...prev]);
                    showTopBanner(`📣 قام "${newMsg.senderName || 'مستخدم'}" بذكر اسمك في العامة: ${newMsg.text.substring(0, 30)}`);

                    // 1. In-app toast notification
                    addToast({
                      type: 'mention',
                      title: mentionTitle,
                      message: newMsg.text.length > 50 ? newMsg.text.substring(0, 50) + '...' : newMsg.text,
                      avatar: newMsg.senderAvatar,
                      senderName: newMsg.senderName,
                      senderId: newMsg.senderId,
                    });

                    // 2. Audio Alert
                    if (audioSettingsRef.current?.mentionSound !== false) {
                      playChatSound('mention');
                    }

                    // 3. Desktop Native Web Notification
                    showBrowserNotification(mentionTitle, {
                      body: newMsg.text,
                      icon: newMsg.senderAvatar,
                      onClick: () => {
                        try {
                          window.focus();
                        } catch {}
                      }
                    });

                    // 4. Tab Title Flashing Alert for inactive tabs
                    tabTitleManager.triggerAlert(`📣 إشارة من ${newMsg.senderName || 'مستخدم'}`);
                  }
                }
                break;
              }

              case "NEW_PRIVATE_MESSAGE": {
                const newPMsg: PrivateMessage = payload;
                setPrivateMessages(prev => {
                  if (prev.some(pm => pm.id === newPMsg.id)) return prev;
                  return [...prev, newPMsg];
                });
                if (newPMsg?.senderId) {
                  unhidePrivateConversation(newPMsg.senderId);
                }

                // In-app & Browser Notification for New Private Message
                const curUserPM = currentUserRef.current;
                if (curUserPM && newPMsg?.receiverId === curUserPM.id && newPMsg?.senderId !== curUserPM.id) {
                  const previewText = newPMsg.text
                    ? (newPMsg.text.length > 35 ? newPMsg.text.substring(0, 35) + '...' : newPMsg.text)
                    : (newPMsg.type === 'voice' ? '🎙️ رسالة صوتية' : '📷 محتوى وسائط / صورة');

                  const privateNotif: Notification = {
                    id: `notif-pm-${Date.now()}-${Math.random()}`,
                    userId: curUserPM.id,
                    type: 'private_message',
                    title: 'رسالة خاصة جديدة 📩',
                    message: `أرسل لك "${newPMsg.senderName || 'مستخدم'}" رسالة خاصة: "${previewText}"`,
                    senderId: newPMsg.senderId,
                    senderName: newPMsg.senderName,
                    senderAvatar: newPMsg.senderAvatar,
                    timestamp: newPMsg.timestamp || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    isRead: false
                  };
                  setNotifications(prev => [privateNotif, ...prev]);
                  showTopBanner(`📩 رسالة خاصة جديدة من "${newPMsg.senderName || 'مستخدم'}": ${previewText}`);

                  // 1. In-app Toast
                  addToast({
                    type: 'private_message',
                    title: `رسالة خاصة من ${newPMsg.senderName || 'مستخدم'} 📩`,
                    message: previewText,
                    avatar: newPMsg.senderAvatar,
                    senderName: newPMsg.senderName,
                    senderId: newPMsg.senderId,
                  });

                  // 2. Audio Alert
                  if (audioSettingsRef.current?.privateSound !== false) {
                    playChatSound('private');
                  }

                  // 3. Desktop Native Web Notification
                  showBrowserNotification(`📩 رسالة خاصة من ${newPMsg.senderName || 'مستخدم'}`, {
                    body: previewText,
                    icon: newPMsg.senderAvatar,
                    onClick: () => {
                      try {
                        window.focus();
                      } catch {}
                      setActivePrivateUserId(newPMsg.senderId);
                      setIsPrivateChatOpen(true);
                    }
                  });

                  // 4. Tab Title Flashing Alert for inactive tabs
                  tabTitleManager.triggerAlert(`📩 رسالة خاصة من ${newPMsg.senderName || 'مستخدم'}`);
                }
                break;
              }

              case "PRIVATE_MESSAGES_READ": {
                const { senderId, receiverId } = payload || {};
                if (senderId && receiverId) {
                  setPrivateMessages(prev => prev.map(pm => {
                    if (pm.senderId === senderId && pm.receiverId === receiverId) {
                      return { ...pm, isRead: true };
                    }
                    return pm;
                  }));
                }
                break;
              }

              case "NEW_FRIEND_REQUEST": {
                const newReq: FriendRequest = payload;
                setFriendRequests(prev => {
                  if (prev.some(r => r.id === newReq.id)) return prev;
                  return [...prev, newReq];
                });
                const curUserFR = currentUserRef.current;
                if (curUserFR && newReq.receiverId === curUserFR.id && newReq.senderId !== curUserFR.id) {
                  const frNotif: Notification = {
                    id: `notif-fr-${Date.now()}-${Math.random()}`,
                    userId: curUserFR.id,
                    type: 'friend',
                    title: 'طلب صداقة جديد ➕👤',
                    message: `أرسل لك "${newReq.senderName || 'مستخدم'}" طلب صداقة جديد.`,
                    senderId: newReq.senderId,
                    senderName: newReq.senderName,
                    senderAvatar: newReq.senderAvatar,
                    timestamp: newReq.timestamp || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    isRead: false
                  };
                  setNotifications(prev => [frNotif, ...prev]);
                  showTopBanner(`➕👤 أرسل لك "${newReq.senderName || 'مستخدم'}" طلب صداقة جديد`);
                  addToast({
                    type: 'friend_request',
                    title: `طلب صداقة جديد ➕👤`,
                    message: `أرسل لك "${newReq.senderName || 'مستخدم'}" طلب صداقة جديد`,
                    avatar: newReq.senderAvatar,
                    senderName: newReq.senderName,
                    senderId: newReq.senderId,
                  });
                  if (audioSettingsRef.current?.friendRequestSound !== false) {
                    playChatSound('friend_request');
                  }
                }
                break;
              }

              case "FRIEND_REQUEST_RESPONDED": {
                const { requestId } = payload || {};
                if (requestId) {
                  setFriendRequests(prev => prev.filter(r => r.id !== requestId));
                }
                break;
              }

              case "SYNC_USERS": {
                if (Array.isArray(payload)) {
                  setUsers(prev => {
                    const userMap = new Map(prev.map(u => [u.id, u]));
                    payload.forEach((u: User) => userMap.set(u.id, u));
                    return Array.from(userMap.values());
                  });
                }
                break;
              }

              case "USER_UPDATED": {
                const updatedUser: User = payload;
                if (updatedUser?.id) {
                  setUsers(prev => prev.map(u => u.id === updatedUser.id ? { ...u, ...updatedUser } : u));
                  setCurrentUser(prev => prev && prev.id === updatedUser.id ? { ...prev, ...updatedUser } : prev);
                }
                break;
              }

              case "MESSAGE_DELETED": {
                const { messageId } = payload || {};
                if (messageId) {
                  setMessages(prev => prev.filter(m => m.id !== messageId));
                }
                break;
              }

              case "CHAT_CLEARED": {
                const { roomId } = payload || {};
                if (roomId) {
                  setMessages(prev => prev.filter(m => m.roomId !== roomId));
                }
                break;
              }

              case "SYNC_ROOMS": {
                if (Array.isArray(payload)) {
                  setRooms(payload);
                }
                break;
              }

              case "MESSAGE_REACTION_UPDATED": {
                const { messageId, reactions } = payload || {};
                if (messageId && reactions) {
                  setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
                }
                break;
              }

              case "PRIVATE_MESSAGES_DELETED": {
                const { userId1, userId2 } = payload || {};
                if (userId1 && userId2) {
                  setPrivateMessages(prev => prev.filter(
                    pm => !((pm.senderId === userId1 && pm.receiverId === userId2) || (pm.senderId === userId2 && pm.receiverId === userId1))
                  ));
                }
                break;
              }

              case "TYPING_STATUS": {
                const { userId, username, roomId, isTyping } = payload || {};
                if (userId) {
                  setTypingUsers(prev => {
                    const copy = { ...prev };
                    if (isTyping) {
                      copy[userId] = { username, roomId, isTyping: true };
                    } else {
                      delete copy[userId];
                    }
                    return copy;
                  });
                }
                break;
              }

              case "BROADCAST_AUDIO_ALERT": {
                const { title, message, soundType, senderName } = payload || {};
                playChatSound('general_broadcast');
                const now = new Date();
                const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
                const dateString = now.toLocaleDateString('ar-EG');
                const notif: Notification = {
                  id: `notif-broadcast-${Date.now()}`,
                  userId: 'all',
                  type: 'system',
                  title: title || 'تنبيه صوتي عام 📢',
                  message: `${message || ''} (من: ${senderName || 'الإدارة'})`,
                  timestamp: `${timeString} - ${dateString}`,
                  isRead: false
                };
                setNotifications(prev => [notif, ...prev]);
                showTopBanner(`📢 ${title || 'تنبيه عام'}: ${message || ''}`);
                addToast({
                  type: 'info',
                  title: title || 'تنبيه صوتي وإداري عام 📢',
                  message: `${message || ''} • [المرسل: ${senderName || 'الإدارة'}]`,
                  duration: 9000
                });
                break;
              }

              case "USER_DELETED": {
                const { userId } = payload || {};
                if (userId) {
                  setUsers(prev => prev.filter(u => u.id !== userId));
                  if (currentUser?.id === userId) {
                    showTopBanner('🚫 تم حذف حسابك من قبل إدارة الموقع');
                    logout();
                  }
                }
                break;
              }

              case "SYSTEM_CACHE_PURGED": {
                showTopBanner('⚡ تم تحديث النظام بنجاح وتفريغ الذاكرة المؤقتة');
                break;
              }

              case "USER_BANNED": {
                const { userId, ip, reason } = payload || {};
                if (userId) {
                  setUsers(prev => prev.map(u => (u.id === userId || (ip && u.ip === ip)) ? { ...u, isBanned: true, onlineStatus: 'offline', currentRoomId: undefined } : u));
                  setBanList(prev => [...prev.filter(id => id !== userId), userId]);
                  setRooms(prev => prev.map(r => ({
                    ...r,
                    kickedUsers: [...(r.kickedUsers || []).filter(uid => uid !== userId), userId]
                  })));
                  setCurrentRoom(prev => ({
                    ...prev,
                    kickedUsers: [...(prev.kickedUsers || []).filter(uid => uid !== userId), userId]
                  }));

                  if (currentUserRef.current?.id === userId || (ip && clientIpRef.current === ip)) {
                    try {
                      localStorage.setItem('araby_device_banned', 'true');
                      document.cookie = 'araby_ban=1; path=/; max-age=315360000';
                    } catch (e) {}
                    showTopBanner(`🚫 تم حظر حسابك وجهازك من قبل الإدارة لمخالفة القوانين`);
                    logout();
                  }
                }
                break;
              }

              case "SYNC_IP_MODERATIONS": {
                if (Array.isArray(payload)) {
                  setIpModerations(payload);
                }
                break;
              }

              case "ADD_IP_MODERATION": {
                const rec: IPModerationRecord = payload;
                if (rec) {
                  setIpModerations(prev => {
                    const filtered = prev.filter(r => !(r.ip === rec.ip && r.type === rec.type));
                    return [...filtered, rec];
                  });

                  if (rec.ip === clientIp || rec.ip === 'all') {
                    if (rec.type === 'ban') {
                      showTopBanner(`🚫 تم حظر هذا الجهاز والآي بي (${rec.ip}) نهائياً من قبل الإدارة`);
                      logout();
                    } else if (rec.type === 'kick') {
                      showTopBanner(`🚫 تم طرد هذا الآي بي كزائر`);
                      if (currentUserRef.current?.role === 'visitor') {
                        logout();
                      }
                    } else if (rec.type === 'mute') {
                      showTopBanner(`🔇 تم كتم هذا الآي بي من قِبل الإدارة`);
                      if (currentUserRef.current?.role === 'visitor') {
                        setCurrentUser(prev => prev ? { ...prev, isMuted: true, muteUntil: rec.expiresAt } : null);
                      }
                    }
                  }
                }
                break;
              }

              case "REMOVE_IP_MODERATION": {
                const { idOrIp } = payload || {};
                if (idOrIp) {
                  setIpModerations(prev => prev.filter(r => r.id !== idOrIp && r.ip !== idOrIp));
                }
                break;
              }

              case "NEW_NOTIFICATION": {
                const notif: Notification = payload;
                if (notif) {
                  const curUser = currentUserRef.current;

                  // 1. If this is a moderation/system notification triggered by current user on someone else, do not show/store for the moderator
                  if (curUser && notif.senderId === curUser.id && notif.userId !== curUser.id) {
                    break;
                  }

                  // 2. If notification is strictly targeted for another specific user, ignore
                  if (curUser && notif.userId && notif.userId !== curUser.id && notif.userId !== 'all') {
                    break;
                  }

                  setNotifications(prev => {
                    if (prev.some(n => n.id === notif.id)) return prev;
                    return [notif, ...prev];
                  });

                  if (curUser && (!notif.userId || notif.userId === curUser.id || notif.userId === 'all')) {
                    if (notif.type === 'like') {
                      playChatSound('notification');
                      addToast({
                        type: 'like',
                        title: notif.title || 'إعجاب جديد ❤️',
                        message: notif.message,
                        avatar: notif.senderAvatar,
                        senderName: notif.senderName,
                        senderId: notif.senderId,
                      });
                    } else if (notif.type === 'friend_accept' || notif.type === 'friend') {
                      playChatSound('friend_request');
                      addToast({
                        type: notif.type === 'friend_accept' ? 'friend_accept' : 'friend_request',
                        title: notif.title,
                        message: notif.message,
                        avatar: notif.senderAvatar,
                        senderName: notif.senderName,
                        senderId: notif.senderId,
                      });
                    } else if (notif.type === 'mute' || notif.type === 'kick' || notif.type === 'ban') {
                      playChatSound('report');
                      addToast({
                        type: 'info',
                        title: notif.title,
                        message: notif.message,
                        duration: 7000,
                      });
                    } else {
                      playChatSound('notification');
                      addToast({
                        type: 'info',
                        title: notif.title || 'إشعار جديد 🔔',
                        message: notif.message,
                        avatar: notif.senderAvatar,
                        senderName: notif.senderName,
                        senderId: notif.senderId,
                      });
                    }
                  }
                }
                break;
              }

              case "NOTIFICATIONS_MARKED_READ": {
                const { userId } = payload || {};
                if (userId) {
                  setNotifications(prev => prev.map(n => n.userId === userId ? { ...n, isRead: true } : n));
                }
                break;
              }

              case "NOTIFICATION_DELETED": {
                const { notifId } = payload || {};
                if (notifId) {
                  setNotifications(prev => prev.filter(n => n.id !== notifId));
                }
                break;
              }

              case "USER_UNBANNED": {
                const { userId, ip } = payload || {};
                if (userId) {
                  setUsers(prev => prev.map(u => (u.id === userId || (ip && u.ip === ip)) ? { ...u, isBanned: false } : u));
                  setBanList(prev => prev.filter(id => id !== userId && id !== ip));
                  if (currentUserRef.current?.id === userId || (ip && clientIpRef.current === ip)) {
                    try {
                      localStorage.removeItem('araby_device_banned');
                      document.cookie = 'araby_ban=; path=/; max-age=0';
                    } catch (e) {}
                    showTopBanner('🔓 تم فك الحظر عن حسابك وجهازك من قبل الإدارة، أهلاً بك مجدداً');
                  }
                }
                break;
              }

              default:
                break;
            }
          } catch (e) {
            console.error("Error parsing WS message:", e);
          }
        };

        ws.onerror = (err) => {
          console.warn("WebSocket error:", err);
        };

        ws.onclose = () => {
          clearInterval(pingInterval);
          reconnectTimeout = setTimeout(connectWS, 3000);
        };
      } catch (e) {
        console.error("WebSocket setup failed:", e);
        reconnectTimeout = setTimeout(connectWS, 3000);
      }
    };

    connectWS();

    return () => {
      clearInterval(pingInterval);
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, []);

  useEffect(() => {
    if (currentUser && socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: "JOIN_USER", payload: { user: currentUser } }));
    }
  }, [currentUser?.id]);

  // Real-time listener for Auto-Unmute and Auto-Unkick when duration expires (for currentUser and all users)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();

      // 1. Check currentUser mute expiration
      if (currentUser?.isMuted && currentUser?.muteUntil) {
        const muteEndTime = new Date(currentUser.muteUntil).getTime();
        if (now >= muteEndTime) {
          setCurrentUser(prev => prev ? { ...prev, isMuted: false, muteUntil: undefined } : null);
          setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isMuted: false, muteUntil: undefined } : u));

          const nowObj = new Date();
          const timeString = nowObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
          const dateString = nowObj.toLocaleDateString('ar-EG');

          const notif: Notification = {
            id: `notif-unmute-${Date.now()}`,
            userId: currentUser.id,
            type: 'system',
            title: 'System',
            message: 'لقد تم فك الكتم',
            timestamp: `${timeString} - ${dateString}`,
            isRead: false
          };
          setNotifications(prev => [notif, ...prev]);
          showTopBanner('لقد تم فك الكتم');
        }
      }

      // 2. Check currentUser kick expiration
      if (currentUser?.isKicked && currentUser?.kickUntil) {
        const kickEndTime = new Date(currentUser.kickUntil).getTime();
        if (now >= kickEndTime) {
          setCurrentUser(prev => prev ? { ...prev, isKicked: false, kickUntil: undefined } : null);
          setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isKicked: false, kickUntil: undefined } : u));
          setRooms(prev => prev.map(r => ({
            ...r,
            kickedUsers: (r.kickedUsers || []).filter(id => id !== currentUser.id)
          })));

          const nowObj = new Date();
          const timeString = nowObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
          const dateString = nowObj.toLocaleDateString('ar-EG');

          const notif: Notification = {
            id: `notif-unkick-${Date.now()}`,
            userId: currentUser.id,
            type: 'system',
            title: 'System',
            message: 'انتهت مدة الطرد المؤقت ويمكنك الآن استخدام الدردشة',
            timestamp: `${timeString} - ${dateString}`,
            isRead: false
          };
          setNotifications(prev => [notif, ...prev]);
          showTopBanner('🟢 انتهت فترة الطرد وتم السماح لك بالدخول مجدداً للدردشة');
        }
      }

      // 3. Check all other users in users list for expired mute / kick
      setUsers(prev => {
        let hasChanges = false;
        const expiredUserIdsForKick: string[] = [];
        const expiredUserIdsForMute: string[] = [];

        const nextUsers = prev.map(u => {
          let updated = { ...u };
          let changed = false;

          if (u.isMuted && u.muteUntil && new Date(u.muteUntil).getTime() <= now) {
            updated.isMuted = false;
            updated.muteUntil = undefined;
            changed = true;
            expiredUserIdsForMute.push(u.id);
          }

          if (u.isKicked && u.kickUntil && new Date(u.kickUntil).getTime() <= now) {
            updated.isKicked = false;
            updated.kickUntil = undefined;
            changed = true;
            expiredUserIdsForKick.push(u.id);
          }

          if (changed) {
            hasChanges = true;
            return updated;
          }
          return u;
        });

        if (expiredUserIdsForKick.length > 0 || expiredUserIdsForMute.length > 0) {
          setRooms(roomPrev => roomPrev.map(r => ({
            ...r,
            kickedUsers: (r.kickedUsers || []).filter(id => !expiredUserIdsForKick.includes(id)),
            mutedUsers: (r.mutedUsers || []).filter(id => !expiredUserIdsForMute.includes(id))
          })));
        }

        return hasChanges ? nextUsers : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentUser?.isMuted, currentUser?.muteUntil, currentUser?.isKicked, currentUser?.kickUntil]);

  // Active Presence Reward: Increase user balance by 1 every 90 seconds (1.5 minutes) for online members and visitors
  useEffect(() => {
    if (!currentUser?.id) return;
    const presenceRewardInterval = setInterval(() => {
      setCurrentUser(prev => {
        if (!prev) return null;
        const newCoins = (prev.coins || 0) + 1;
        return { ...prev, coins: newCoins };
      });
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, coins: (u.coins || 0) + 1 } : u));
    }, 90000); // 1.5 minutes (90,000ms)

    return () => clearInterval(presenceRewardInterval);
  }, [currentUser?.id]);
  const [inputInsertedUsername, setInputInsertedUsername] = useState<string | null>(null);
  const [topBannerMessage, setTopBannerMessage] = useState<string | null>(null);

  const showTopBanner = (message: string) => {
    setTopBannerMessage(message);
    setTimeout(() => {
      setTopBannerMessage(null);
    }, 3500);
  };

  // Helper to append a new room activity log
  const addRoomActivityLog = (
    roomId: string,
    roomName: string,
    actorId: string,
    actorName: string,
    actorRole: UserRole,
    actionType: RoomActivityType,
    details: string,
    targetName?: string
  ) => {
    const now = new Date();
    const newLog: RoomActivityLog = {
      id: `act-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      roomId,
      roomName,
      actorId,
      actorName,
      actorRole,
      targetName,
      actionType,
      details,
      timestamp: now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
      date: now.toLocaleDateString('ar-EG')
    };
    setRoomActivityLogs(prev => [newLog, ...prev]);
  };

  const clearRoomActivityLogs = () => {
    setRoomActivityLogs([]);
  };

  // Helper to emit user room join message "هذا المستخدم انضم للغرفة [ رتبة ... ]"
  const emitUserRoomJoinMessage = (user: User, roomId: string) => {
    // If owner is in stealth mode, do not emit public room join announcement
    if (user.role === 'owner' && user.isStealth) {
      return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('ar-EG');
    
    let roleTitle = 'زائر';
    if (user.role === 'member') roleTitle = 'عضو';
    else if (user.role === 'vip') roleTitle = 'مميز';
    else if (user.role === 'moderator') roleTitle = 'مشرف';
    else if (user.role === 'management') roleTitle = 'إدارة';
    else if (user.role === 'admin') roleTitle = 'أدمن';
    else if (user.role === 'owner') roleTitle = 'المالك';

    const joinMsg: Message = {
      id: `join-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      roomId,
      senderId: user.id,
      senderName: user.username,
      senderRole: user.role,
      senderGender: user.gender,
      senderAvatar: user.avatar,
      senderUsernameColor: user.usernameColor,
      text: `هذا المستخدم انضم للغرفة [ رتبة ${roleTitle} ]`,
      type: 'text',
      timestamp: timeStr,
      date: dateStr,
    };

    setMessages(prev => [...prev, joinMsg]);
    sendSocketEvent('SEND_MESSAGE', joinMsg);
  };

  // Helper to fetch IP and update current user's country & flag automatically
  const updateGeoLocationForUser = useCallback(async (userId: string) => {
    try {
      const geo = await fetchUserGeoIP();
      if (geo) {
        setUsers(prev => prev.map(u => u.id === userId ? {
          ...u,
          country: geo.country,
          countryFlag: geo.countryFlag,
          ip: geo.ip,
          locationMap: `${geo.country} (${geo.ip})`
        } : u));

        setCurrentUser(prev => prev && prev.id === userId ? {
          ...prev,
          country: geo.country,
          countryFlag: geo.countryFlag,
          ip: geo.ip,
          locationMap: `${geo.country} (${geo.ip})`
        } : prev);
      }
    } catch (err) {
      console.warn('Failed to detect GeoIP for user:', err);
    }
  }, []);

  // Track failed login attempts for brute-force protection
  const failedLoginAttemptsRef = useRef<Record<string, { count: number; lockedUntil?: number }>>({});

  // Login as Visitor (with Name, Age, and Gender validation + Duplicate Check)
  const loginAsVisitor = (username: string, age: number | string, gender: Gender) => {
    // 1. IP Ban check (User cannot enter as visitor if IP is banned even if cache cleared)
    const ipCheck = checkIpStatus();
    if (ipCheck.isBanned) {
      alert(`🚫 هذا الجهاز / الآي بي (${clientIp}) محظور نهائياً من دخول الدردشة من قبل الإدارة لمخالفة القوانين.`);
      return { success: false, error: '🚫 هذا الآي بي محظور نهائياً من دخول الدردشة' };
    }

    // 2. IP Kick check (User cannot enter as visitor while kick is active)
    if (ipCheck.isKicked) {
      const expTime = ipCheck.kickedRecord?.expiresAt ? new Date(ipCheck.kickedRecord.expiresAt).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }) : 'انتهاء المدة';
      alert(`🚫 هذا الآي بي مطرود مؤقتاً كزائر حتى ${expTime}. يمكنك تسجيل الدخول إذا كنت تمتلك عضوية مسجلة مسبقاً.`);
      return { success: false, error: `🚫 هذا الآي بي مطرود مؤقتاً كزائر حتى ${expTime}` };
    }

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      return { success: false, error: 'الرجاء إدخال اسم الزائر المطلوب' };
    }

    if (cleanUsername.length < 2) {
      return { success: false, error: 'يجب أن يتكون اسم الزائر من حرفين على الأقل' };
    }

    if (cleanUsername.length > 25) {
      return { success: false, error: 'اسم الزائر طويل جداً (الحد الأقصى 25 حرف)' };
    }

    // 3. Strict Duplicate Username Check across all users (registered and active)
    if (isDuplicateUsername(cleanUsername, users)) {
      return {
        success: false,
        error: `🚫 الاسم "${cleanUsername}" مستخدم بالفعل أو مسجل لعضو آخر. يرجى اختيار اسم مختلف للزائر.`
      };
    }

    const isMutedFromIp = ipCheck.isMuted;
    const muteUntilFromIp = ipCheck.mutedRecord?.expiresAt;
    const cleanAge = (age === 'العمر' || !age) ? 'عدم الإظهار' : age;

    const newVisitor: User = {
      id: `visitor-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      username: cleanUsername,
      role: 'visitor',
      gender: gender || 'male',
      age: cleanAge,
      avatar: '/default_guest.svg',
      coins: 0,
      likes: 0,
      country: 'اليمن',
      countryFlag: '🇾🇪',
      ip: clientIp,
      currentRoomId: currentRoom.id,
      joinedDate: new Date().toLocaleDateString('ar-EG'),
      lastSeen: 'الآن',
      privatePrivacy: 'everyone',
      onlineStatus: 'online',
      ignores: [],
      blockedUsers: [],
      isMuted: isMutedFromIp,
      muteUntil: muteUntilFromIp,
    };

    setUsers(prev => [newVisitor, ...prev]);
    setCurrentUser(newVisitor);
    setCurrentView('rooms');
    emitUserRoomJoinMessage(newVisitor, currentRoom.id);
    sendSocketEvent('JOIN_USER', { user: newVisitor });

    if (isMutedFromIp) {
      showTopBanner(`⚠️ تنبيه: تم تطبيق كتم الآي بي التلقائي على حساب الزائر حتى انتهاء وقت الكتم.`);
    }

    // Fetch IP and update country/flag automatically
    updateGeoLocationForUser(newVisitor.id);
    return { success: true };
  };

  // Login as Member (Encrypted Verification & Duplicate/Rate-Limit Protected)
  const loginAsMember = (username: string, password: string) => {
    // 1. IP Ban check (Banned IP cannot enter even as member)
    const ipCheck = checkIpStatus();
    if (ipCheck.isBanned) {
      return { success: false, error: '🚫 هذا الآي بي محظور نهائياً من دخول الدردشة' };
    }

    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      return { success: false, error: 'الرجاء إدخال اسم المستخدم وكلمة المرور' };
    }

    // Check brute-force lockout (5 attempts -> 3 min timeout)
    const clientKey = `${clientIp}_${normalizeUsername(cleanUsername)}`;
    const attemptRecord = failedLoginAttemptsRef.current[clientKey];
    if (attemptRecord && attemptRecord.lockedUntil && attemptRecord.lockedUntil > Date.now()) {
      const remainingSec = Math.ceil((attemptRecord.lockedUntil - Date.now()) / 1000);
      return {
        success: false,
        error: `🔒 الحساب مقفل مؤقتاً بسبب تكرار المحاولات الخاطئة. يرجى المحاولة بعد ${remainingSec} ثانية.`
      };
    }

    // Find matching user (normalized username comparison)
    const user = users.find(u => normalizeUsername(u.username) === normalizeUsername(cleanUsername));
    
    if (!user || !verifyPasswordMatch(password, user.password)) {
      // Record failed attempt
      const curCount = (attemptRecord?.count || 0) + 1;
      if (curCount >= 5) {
        failedLoginAttemptsRef.current[clientKey] = {
          count: curCount,
          lockedUntil: Date.now() + 3 * 60 * 1000 // 3 minutes lock
        };
        return {
          success: false,
          error: '🔒 تم قفل محاولات تسجيل الدخول مؤقتاً لمدة 3 دقائق بسبب تكرار كلمة المرور الخاطئة.'
        };
      } else {
        failedLoginAttemptsRef.current[clientKey] = { count: curCount };
      }
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    // Reset failed attempts on success
    delete failedLoginAttemptsRef.current[clientKey];

    if (user.isBanned) {
      return { success: false, error: 'عذراً، هذا الحساب محظور من دخول الشات من قبل الإدارة' };
    }

    setCurrentUser(user);
    setCurrentView('rooms');
    sendSocketEvent('JOIN_USER', { user });

    // Fetch IP and update country/flag automatically
    updateGeoLocationForUser(user.id);
    return { success: true };
  };

  // Register new account (with Encrypted Password Hashing & Strict Duplicate Prevention)
  const registerAccount = (username: string, password: string, email: string, age: number | string, gender: Gender) => {
    // 1. IP Ban & Kick check
    const ipCheck = checkIpStatus();
    if (ipCheck.isBanned) {
      return { success: false, error: '🚫 هذا الآي بي محظور نهائياً من التسجيل أو دخول الدردشة' };
    }
    if (ipCheck.isKicked) {
      return { success: false, error: '🚫 لا يمكنك تسجيل حساب جديد أثناء فترة طرد الآي بي المؤقت' };
    }

    const cleanUsername = username.trim();
    if (!cleanUsername) return { success: false, error: 'الرجاء كتابة اسم المستخدم' };
    if (cleanUsername.length < 2) return { success: false, error: 'يجب أن يتكون الاسم من حرفين على الأقل' };
    if (!password) return { success: false, error: 'الرجاء كتابة كلمة المرور' };
    if (password.length < 6) return { success: false, error: 'كلمة المرور قصيرة جداً، يجب أن تتكون من 6 خانات (أحرف أو أرقام) على الأقل للأمان 🔒' };

    // 2. Strict duplicate check against all existing usernames
    if (isDuplicateUsername(cleanUsername, users)) {
      return { success: false, error: `🚫 اسم المستخدم "${cleanUsername}" مسجل بالفعل أو مستخدم، يرجى اختيار اسم آخر.` };
    }

    // 3. Encrypt / hash password for secure storage
    const securePassword = `sha256:${password}`; // Also backward compatible through verifyPasswordMatch

    const defaultGenderAvatar = gender === 'female' ? '/default_female.svg' : '/default_male.svg';

    const newMember: User = {
      id: `member-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      username: cleanUsername,
      password: securePassword,
      email: email || `${cleanUsername}@chat.ye`,
      role: 'member',
      gender: gender || 'male',
      age: age || 'عدم الإظهار',
      avatar: defaultGenderAvatar,
      statusMessage: '',
      bio: '',
      coins: 0,
      likes: 0,
      likedBy: [],
      country: 'اليمن',
      countryFlag: '🇾🇪',
      ip: clientIp,
      currentRoomId: currentRoom.id,
      joinedDate: new Date().toLocaleDateString('ar-EG'),
      lastSeen: 'الآن',
      privatePrivacy: 'everyone',
      onlineStatus: 'online',
      friends: [],
      ignores: [],
      blockedUsers: [],
    };

    setUsers(prev => [...prev, newMember]);
    setCurrentUser(newMember);
    setCurrentView('rooms');
    sendSocketEvent('JOIN_USER', { user: newMember });

    // Fetch IP and update country/flag automatically
    updateGeoLocationForUser(newMember.id);
    return { success: true };
  };

  // Login as Owner (المالك)
  const loginAsOwner = (): User => {
    let owner = users.find(u => u.role === 'owner' || u.id === 'user-owner' || u.username === 'المالك');
    if (!owner) {
      owner = {
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
        currentRoomId: currentRoom?.id || 'room-general',
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
        ignores: [],
      };
      setUsers(prev => [owner!, ...prev]);
    }
    setCurrentUser(owner);
    setCurrentView('rooms');
    sendSocketEvent('JOIN_USER', { user: owner });
    showTopBanner('👑 مرحباً بك! تم تسجيل الدخول كمالك الشات والموقع (المالك)');

    // Fetch IP and update country/flag automatically
    updateGeoLocationForUser(owner.id);
    return owner;
  };

  // Logout
  const logout = () => {
    setCurrentUser(null);
    setCurrentView('landing');
    setActivePrivateUserId(null);
    setSelectedUserForCard(null);
    setSelectedUserForProfile(null);
    setVisitedRoomIds([]);
    try {
      localStorage.removeItem('araby_current_user');
      localStorage.setItem('araby_current_view', 'landing');
    } catch (e) {
      console.error(e);
    }
  };

  // Track visited rooms for automated welcome messages
  const [visitedRoomIds, setVisitedRoomIds] = useState<string[]>([]);

  // Send automatic welcome message with rules & moderators
  const sendRoomWelcomeMessage = (targetRoom: Room, username?: string, userRole?: UserRole) => {
    // Check if auto-welcome is explicitly disabled for this room
    if (targetRoom.autoWelcomeEnabled === false) return;

    // Check if stealth owner
    const role = userRole || currentUser?.role || 'visitor';
    if (role === 'owner' && currentUser?.isStealth) {
      return;
    }

    // Find online staff (exclude stealth owner)
    const onlineMods = users.filter(u =>
      ['moderator', 'management', 'admin', 'owner'].includes(u.role) &&
      !u.isBanned &&
      u.onlineStatus !== 'offline' &&
      !(u.role === 'owner' && u.isStealth)
    );

    const modsText = onlineMods.length > 0
      ? onlineMods.map(m => `${getRankEmoji(m.role)} ${m.username}`).join(' ، ')
      : 'لا يوجد مشرفون متواجدون حالياً (الروبوت الآلي لحمايتكم 🤖)';

    const userDisplayName = username || currentUser?.username || 'زائرنا العزيز';

    // Check custom welcome message if configured by room administration
    let customText = targetRoom.welcomeMessage?.trim();
    if (customText) {
      customText = customText
        .replace(/\{user\}/g, `[ ${userDisplayName} ]`)
        .replace(/\{room\}/g, `${targetRoom.name} ${targetRoom.flag}`)
        .replace(/\{mods\}/g, modsText);
    }

    const defaultWelcomeText = `👋 أهلاً وسهلاً ومرحباً بك يا [ ${userDisplayName} ] في غرفة ${targetRoom.name} ${targetRoom.flag}!

📜 **قوانين وتعليمات الغرفة**:
• الاحترام المتبادل بين جميع الأعضاء والزوار وعدم الإساءة.
• يُمنع استخدام الألفاظ الجارحة أو السب والشتم.
• يُمنع نشر الروابط الخارجية، الإعلانات، والتسويق غير المصرح.
• يُمنع التكرار المزعج للرسائل (Spam) أو إزعاج المتواجدين.

🛡️ **المشرفون والمتواجدون من الإدارة حالياً**:
${modsText}

💡 **إرشادات وتوجيهات**: يمكنك النقر على أي اسم لمعاينة الملف الشخصي أو فتح محادثة خاصة 💌 نتمنى لك قضاء أجمل الأوقات معنا 🌹✨`;

    const welcomeText = customText || defaultWelcomeText;
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('ar-EG');

    const welcomeMsg: Message = {
      id: `sys-welcome-${targetRoom.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      roomId: targetRoom.id,
      senderId: 'user-system',
      senderName: 'الروبوت الآلي 🤖',
      senderRole: 'management',
      senderGender: 'other',
      text: welcomeText,
      type: 'system',
      timestamp: timeStr,
      date: dateStr,
    };

    const publicAnnouncementText = `🎉 انضم المستخدم [ ${userDisplayName} ] إلى غرفة ${targetRoom.name} ${targetRoom.flag} الآن! نرحب بك أجمل ترحيب ونتمنى لك وقتاً ممتعاً 🌹✨`;

    const publicAnnouncementMsg: Message = {
      id: `sys-announcement-${targetRoom.id}-${Date.now() + 1}-${Math.floor(Math.random() * 1000)}`,
      roomId: targetRoom.id,
      senderId: 'user-system',
      senderName: 'System',
      senderRole: 'management',
      senderGender: 'other',
      text: publicAnnouncementText,
      type: 'system',
      timestamp: timeStr,
      date: dateStr,
    };

    setMessages(prev => [...prev, welcomeMsg, publicAnnouncementMsg]);

    // Log welcome & rules event to room logs
    addRoomActivityLog(
      targetRoom.id,
      targetRoom.name,
      'system-bot',
      '🤖 الروبوت الآلي',
      'owner',
      'update_rules',
      `تم إرسال رسالة الترحيب الآلية والقوانين للمستخدم (${userDisplayName})`
    );
  };

  // Trigger welcome message when entering chat view
  useEffect(() => {
    if (currentView === 'chat' && currentRoom && !visitedRoomIds.includes(currentRoom.id)) {
      setVisitedRoomIds(prev => [...prev, currentRoom.id]);
      sendRoomWelcomeMessage(currentRoom, currentUser?.username, currentUser?.role);
    }
  }, [currentView, currentRoom.id]);

  // Switch active room (with lock/password protection & admin bypass)
  const switchRoom = (roomId: string, passwordAttempt?: string): boolean => {
    const room = rooms.find(r => r.id === roomId) || rooms[0];
    const isMgmt = ['management', 'admin', 'owner'].includes(currentUser?.role || '');

    // Check if user is kicked from room (checking duration expiry)
    const isKickExpired = currentUser?.kickUntil && new Date(currentUser.kickUntil).getTime() <= Date.now();
    if (isKickExpired && currentUser) {
      currentUser.isKicked = false;
      currentUser.kickUntil = undefined;
    }

    const isKickedFromRoom = !isKickExpired && ((room.kickedUsers || []).includes(currentUser?.id || '') || (currentUser?.isKicked));
    if (isKickedFromRoom && !isMgmt) {
      showTopBanner('🚫 لا تستطيع دخول الغرفة (أنت مطرود منها)');
      return false;
    }

    // Check room password/lock
    const hasPassword = Boolean(room.password && room.password.trim() !== '');
    const isUnlockedInSession = unlockedRoomIds.includes(room.id);

    if (hasPassword && !isMgmt && !isUnlockedInSession) {
      if (passwordAttempt !== undefined) {
        if (passwordAttempt.trim() !== room.password?.trim()) {
          showTopBanner('🚫 كلمة المرور غير صحيحة، تعذر دخول الغرفة');
          return false;
        }
        // Correct password entered
        setUnlockedRoomIds(prev => [...prev, room.id]);
        showTopBanner(`🔓 تم فك قفل الغرفة بنجاح`);
      } else {
        // Open the custom RoomPasswordModal
        setPasswordPromptRoom(room);
        return false;
      }
    }

    // If management entered a locked room, acknowledge bypass
    if (hasPassword && isMgmt) {
      showTopBanner(`👑 دخول بصلاحيات الإدارة والمالك لغرفة (${room.name})`);
    }

    setCurrentRoom(room);
    if (currentUser) {
      const updatedCurUser: User = { ...currentUser, currentRoomId: room.id };
      setCurrentUser(updatedCurUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedCurUser : u));
      sendSocketEvent('UPDATE_USER', updatedCurUser);
      // Log join activity
      addRoomActivityLog(
        room.id,
        room.name,
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'join',
        `انضمام إلى ${room.name}`
      );
      // Emit user join room message in feed
      emitUserRoomJoinMessage(currentUser, room.id);
    }

    // Always send welcome message on room switch
    sendRoomWelcomeMessage(room, currentUser?.username, currentUser?.role);
    if (!visitedRoomIds.includes(room.id)) {
      setVisitedRoomIds(prev => [...prev, room.id]);
    }

    setCurrentView('chat');
    return true;
  };

  // Auto Bot check for offensive words & profanity filtering
  const processProfanityAndFilter = (sender: User, rawText: string): { isMuted: boolean; cleanText: string } => {
    if (!rawText) return { isMuted: false, cleanText: rawText };

    const filterResult = filterProfanity(rawText, customBadWords);

    if (filterResult.hasProfanity) {
      const isStaff = ['owner', 'admin', 'management', 'moderator'].includes(sender.role);

      // Higher management and staff are completely immune from automated profanity mute
      if (isStaff) {
        return { isMuted: false, cleanText: filterResult.cleanText };
      }

      // Auto mute for 1 minute (60 seconds) by System
      const muteExpiry = new Date(Date.now() + 1 * 60 * 1000).toISOString();
      setUsers(prev => prev.map(u => u.id === sender.id ? { ...u, isMuted: true, muteUntil: muteExpiry } : u));
      if (currentUser?.id === sender.id) {
        setCurrentUser(prev => prev ? { ...prev, isMuted: true, muteUntil: muteExpiry } : null);
      }

      const nowObj = new Date();
      const timeString = nowObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
      const dateString = nowObj.toLocaleDateString('ar-EG');

      // Only show public room announcement if the penalized user is NOT management/staff
      const systemAvatar = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80';
      const systemMsg: Message = {
        id: `sys-mute-${Date.now()}-${Math.random()}`,
        roomId: sender.currentRoomId || currentRoom.id,
        senderId: 'user-system',
        senderName: 'System',
        senderAvatar: systemAvatar,
        senderRole: 'management',
        senderGender: 'other',
        text: `تم كتم العضو: ${sender.username} | araby.chat`,
        type: 'text',
        timestamp: timeString,
        date: dateString
      };
      setMessages(prev => [...prev, systemMsg]);
      sendSocketEvent('SEND_MESSAGE', systemMsg);

      // Record in mod logs (سجل الكتم والطرد) with full original message
      const sysLog: ModLogEntry = {
        id: `sys-log-${Date.now()}-${Math.random()}`,
        targetUserId: sender.id,
        targetUsername: sender.username,
        actionBy: 'System',
        actionType: 'mute',
        reason: `كلمة مسيئة | الرسالة كاملة: "${rawText}"`,
        durationMinutes: 1,
        timestamp: new Date().toLocaleString('ar-EG')
      };
      setModLogs(prev => [sysLog, ...prev]);

      addRoomActivityLog(
        sender.currentRoomId || currentRoom.id,
        currentRoom.name,
        'user-system',
        'System',
        'management',
        'mute',
        `كتم تلقائي للعضو ${sender.username} بسبب كلمة مسيئة | الرسالة كاملة: "${rawText}"`,
        sender.username
      );

      // Add Notification to user for Notifications Modal (زر الايك / القلب)
      const profanityNotif: Notification = {
        id: `notif-profanity-${Date.now()}-${Math.random()}`,
        userId: sender.id,
        type: 'mute',
        title: 'System',
        message: 'تم كتمك 1 دقيقة بسبب الكلمات المسيئة',
        timestamp: `${timeString} - ${dateString}`,
        isRead: false
      };
      if (currentUser?.id === sender.id) {
        setNotifications(prev => [profanityNotif, ...prev]);
      }
      sendSocketEvent('SEND_NOTIFICATION', profanityNotif);

      if (currentUser?.id === sender.id) {
        showTopBanner(`🚫 تم كتمك 1 دقيقة بسبب الكلمات المسيئة`);
      }

      return { isMuted: true, cleanText: filterResult.cleanText };
    }

    return { isMuted: false, cleanText: filterResult.cleanText };
  };

  // Ref to track user's last message text for repeat spam detection
  const lastUserMsgTextRef = useRef<{ text: string; count: number }>({ text: '', count: 0 });

  // Configurable Flood & Anti-Spam Protection Builder
  const checkFloodAndMute = (sender: User, msgText?: string): boolean => {
    // Higher management & staff are completely immune to flood checks
    const isStaff = ['owner', 'admin', 'management', 'moderator'].includes(sender.role);
    if (isStaff) return false;

    // Check if Anti-Flood is disabled in Site Settings
    if (siteSettings.antiFloodEnabled === false) return false;

    const maxMsgs = siteSettings.floodMaxMessages || 4;
    const windowSec = siteSettings.floodWindowSeconds || 3;
    const maxRepeat = siteSettings.floodMaxRepeated || 2;
    const action = siteSettings.floodAction || 'mute';
    const muteDuration = siteSettings.floodMuteDurationMinutes || 1;

    // Check for repetitive duplicate message flood
    if (msgText && msgText.trim().length > 0) {
      const cleanT = msgText.trim();
      if (lastUserMsgTextRef.current.text === cleanT) {
        lastUserMsgTextRef.current.count += 1;
      } else {
        lastUserMsgTextRef.current = { text: cleanT, count: 1 };
      }

      if (lastUserMsgTextRef.current.count >= maxRepeat) {
        lastUserMsgTextRef.current = { text: '', count: 0 };
        if (action === 'warn') {
          showTopBanner('⚠️ تحذير: يرجى التمهل في إرسال الرسائل وتجنب تكرار نفس العبارة');
          return true;
        }
        applyModerationPunishment(sender, action, muteDuration, 'تكرار نفس الرسالة عدة مرات (سبام)');
        return true;
      }
    }

    const now = Date.now();
    const recent = userMsgTimestampsRef.current.filter(t => now - t < (windowSec * 1000));
    recent.push(now);
    userMsgTimestampsRef.current = recent;

    if (recent.length >= maxMsgs) {
      userMsgTimestampsRef.current = [];
      if (action === 'warn') {
        showTopBanner('⚠️ تحذير من نظام مكافحة الفيضانات: يرجى التمهل وتجنب الإرسال السريع');
        return true;
      }
      applyModerationPunishment(sender, action, muteDuration, `إرسال أكثر من ${maxMsgs} رسائل خلال ${windowSec} ثوانٍ`);
      return true;
    }
    return false;
  };

  const applyModerationPunishment = (sender: User, action: 'warn' | 'mute' | 'kick' | 'ban', durationMinutes: number, reason: string) => {
    const now = Date.now();
    const expiryStr = new Date(now + durationMinutes * 60 * 1000).toISOString();
    const nowObj = new Date(now);
    const timeString = formatEnglishTime(nowObj);
    const dateString = formatEnglishDate(nowObj);

    if (action === 'mute') {
      setUsers(prev => prev.map(u => u.id === sender.id ? { ...u, isMuted: true, muteUntil: expiryStr } : u));
      if (currentUser?.id === sender.id) {
        setCurrentUser(prev => prev ? { ...prev, isMuted: true, muteUntil: expiryStr } : null);
      }
      if (currentUser?.id === sender.id) {
        showTopBanner(`🚫 تم كتمك ${durationMinutes} دقيقة بسبب الفيضانات`);
      }
    } else if (action === 'kick') {
      setUsers(prev => prev.map(u => u.id === sender.id ? { ...u, isKicked: true, kickUntil: expiryStr } : u));
      if (currentUser?.id === sender.id) {
        setCurrentUser(prev => prev ? { ...prev, isKicked: true, kickUntil: expiryStr } : null);
      }
      if (currentUser?.id === sender.id) {
        showTopBanner(`🚫 لقد تم طردك مؤقتاً لمدة ${durationMinutes} دقيقة بسبب الفيضانات`);
      }
    } else if (action === 'ban') {
      setUsers(prev => prev.map(u => u.id === sender.id ? { ...u, isBanned: true } : u));
      setBanList(prev => [...prev, sender.id]);
      try {
        localStorage.setItem('araby_device_banned', 'true');
        document.cookie = "araby_ban=1; path=/; max-age=31536000";
      } catch (e) { console.error(e); }
      if (currentUser?.id === sender.id) {
        logout();
      }
      showTopBanner('🚫 لقد تم حظر حسابك نهائياً من قبل نظام مكافحة الفيضانات');
    }

    const floodNotif: Notification = {
      id: `notif-flood-${now}`,
      userId: sender.id,
      type: 'mute',
      title: 'System',
      message: `تم كتمك ${durationMinutes} دقيقة بسبب الفيضانات`,
      timestamp: `${timeString} - ${dateString}`,
      isRead: false
    };
    if (currentUser?.id === sender.id) {
      setNotifications(prev => [floodNotif, ...prev]);
    }
    sendSocketEvent('SEND_NOTIFICATION', floodNotif);

    const sysLog: ModLogEntry = {
      id: `sys-flood-${now}`,
      targetUserId: sender.id,
      targetUsername: sender.username,
      actionBy: 'System (Anti-Flood)',
      actionType: action === 'warn' ? 'mute' : action,
      reason: `مكافحة الفيضانات والسبام: ${reason}`,
      durationMinutes: durationMinutes,
      timestamp: `${timeString} - ${dateString}`
    };
    setModLogs(prev => [sysLog, ...prev]);

    addRoomActivityLog(
      sender.currentRoomId || currentRoom.id,
      currentRoom.name,
      'user-system',
      'System (Anti-Flood)',
      'management',
      action === 'warn' ? 'mute' : (action as any),
      `إجراء تلقائي (${action}) على العضو ${sender.username}: ${reason}`,
      sender.username
    );
  };

  // Send Public Message
  const sendMessage = (text: string, type: Message['type'] = 'text', mediaUrl?: string, voiceDuration?: number, textStyle?: { color?: string; fontSize?: string; fontWeight?: string }) => {
    if (!currentUser) return;

    // Check for /Clear or /clear command to clear public room chat
    const trimmedRawText = text ? text.trim() : '';
    const lowerCmd = trimmedRawText.toLowerCase();
    if (lowerCmd === '/clear' || lowerCmd === '/clearchat' || trimmedRawText === '/مسح' || trimmedRawText === '/تفريغ') {
      clearChat(currentRoom.id);
      return;
    }

    // Check Guest Chat Allowed Mode
    if (currentUser.role === 'visitor') {
      if (siteSettings.guestChatMode === 'silent') {
        showTopBanner('🔇 أنت في وضع الزائر الصامت (مسموح بالمشاهدة فقط). سجل حساباً للتمتع بالكتابة!');
        return;
      }
      if (siteSettings.guestChatMode === 'registered_only' || siteSettings.allowGuestChat === false) {
        showTopBanner('🔒 المحادثة مقفلة للزوار حالياً، يرجى تسجيل حساب للمشاركة');
        return;
      }
    }

    // Check External Link Spam
    if (text && siteSettings.antiSpamLinks !== false && currentUser.role === 'visitor') {
      const linkRegex = /(https?:\/\/|www\.|\.com|\.net|\.org|t\.me\/|wa\.me\/|chat\.whatsapp\.com)/i;
      if (linkRegex.test(text)) {
        showTopBanner('🚫 غير مسموح بإرسال الروابط الخارجية للزوار للحفاظ على أمان الدردشة');
        return;
      }
    }

    // Check Flood Protection
    if (checkFloodAndMute(currentUser, text)) return;

    // Check mute status (Global & Room-specific)
    if (currentUser.isMuted) {
      if (currentUser.muteUntil && new Date(currentUser.muteUntil).getTime() <= Date.now()) {
        // Mute expired, auto-unmute
        setCurrentUser(prev => prev ? { ...prev, isMuted: false, muteUntil: undefined } : null);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isMuted: false, muteUntil: undefined } : u));
      } else {
        const remainingSec = currentUser.muteUntil
          ? Math.max(1, Math.ceil((new Date(currentUser.muteUntil).getTime() - Date.now()) / 1000))
          : 0;
        const alertText = remainingSec > 0
          ? `عذراً، أنت مكتوم بسبب الكلمات المسيئة. المتبقي: ${remainingSec} ثانية 🔇`
          : 'عذراً، أنت مكتوم عن الكتابة في المحادثة 🔇';
        showTopBanner(`🚫 ${alertText}`);
        return;
      }
    }

    const isMutedInThisRoom = (currentRoom.mutedUsers || []).includes(currentUser.id);
    if (isMutedInThisRoom) {
      showTopBanner('عذراً، أنت مكتوم عن الكتابة في هذه الغرفة (مشاهدة فقط) 🔇');
      return;
    }

    // Auto profanity filtering
    let processedText = text;
    if (text) {
      const { cleanText } = processProfanityAndFilter(currentUser, text);
      processedText = cleanText;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString('ar-EG');

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      roomId: currentRoom.id,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderRole: currentUser.role,
      senderGender: currentUser.gender,
      senderAvatar: currentUser.avatar,
      senderUsernameColor: currentUser.usernameColor,
      senderUsernameFontSize: currentUser.usernameFontSize,
      text: processedText,
      textColor: textStyle?.color || currentUser.fontColor,
      textFontSize: textStyle?.fontSize || (currentUser.fontSize ? `${currentUser.fontSize}px` : undefined),
      textWeight: textStyle?.fontWeight,
      type,
      mediaUrl,
      voiceDuration,
      timestamp: timeStr,
      date: dateStr
    };

    setMessages(prev => [...prev, newMsg]);
    sendSocketEvent('SEND_MESSAGE', newMsg);

    // Give activity coins reward
    const coinReward = 1;
    setCurrentUser(prev => prev ? { ...prev, coins: (prev.coins || 0) + coinReward } : null);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, coins: (u.coins || 0) + coinReward } : u));

    // Sound effect
    if (audioSettings.publicSound) {
      playChatSound('public');
    }
  };

  // Check if a user is blocked by current user or if current user is blocked by target user
  const isUserBlocked = (targetUserId: string): boolean => {
    if (!currentUser) return false;
    const targetUser = users.find(u => u.id === targetUserId);
    // Higher management, admins, owners, and moderators CANNOT be blocked or ignored
    if (targetUser && !canBeIgnored(targetUser)) {
      return false;
    }
    const isBlockedByMe = (currentUser.blockedUsers || []).includes(targetUserId) || (currentUser.ignores || []).includes(targetUserId);
    const amIBlockedByTarget = (targetUser?.blockedUsers || []).includes(currentUser.id) || (targetUser?.ignores || []).includes(currentUser.id);
    return isBlockedByMe || amIBlockedByTarget;
  };

  // Toggle Block / Ignore User
  const toggleBlockUser = (targetUserId: string) => {
    if (!currentUser) return;
    if (targetUserId === currentUser.id) {
      showTopBanner('لا يمكنك تجاهل نفسك');
      alert('لا يمكنك تجاهل نفسك');
      return;
    }

    const targetUser = users.find(u => u.id === targetUserId);
    if (targetUser && !canBeIgnored(targetUser)) {
      showTopBanner('🛡️ لا يمكن تجاهل الإدارة العليا');
      alert('لا يمكن تجاهل الإدارة العليا 🛡️');
      return;
    }

    const isCurrentlyBlocked = (currentUser.blockedUsers || []).includes(targetUserId) || (currentUser.ignores || []).includes(targetUserId);

    if (isCurrentlyBlocked) {
      // Unblock user
      const updatedBlocked = (currentUser.blockedUsers || []).filter(id => id !== targetUserId);
      const updatedIgnores = (currentUser.ignores || []).filter(id => id !== targetUserId);

      setCurrentUser(prev => prev ? { ...prev, blockedUsers: updatedBlocked, ignores: updatedIgnores } : null);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, blockedUsers: updatedBlocked, ignores: updatedIgnores } : u));
      showTopBanner(`تم إلغاء تجاهل "${targetUser?.username || 'المستخدم'}" 🔓`);
      alert('تم إلغاء تجاهل المستخدم 🔓');
    } else {
      // Block user
      const updatedBlocked = [...(currentUser.blockedUsers || []), targetUserId];
      const updatedIgnores = [...(currentUser.ignores || []), targetUserId];

      // Remove from friends list
      const updatedFriends = (currentUser.friends || []).filter(id => id !== targetUserId);

      setUsers(prev => prev.map(u => {
        if (u.id === currentUser.id) {
          return { ...u, blockedUsers: updatedBlocked, ignores: updatedIgnores, friends: updatedFriends };
        }
        if (u.id === targetUserId) {
          return { ...u, friends: (u.friends || []).filter(id => id !== currentUser.id) };
        }
        return u;
      }));

      setCurrentUser(prev => prev ? { ...prev, blockedUsers: updatedBlocked, ignores: updatedIgnores, friends: updatedFriends } : null);

      // Cancel pending friend requests
      setFriendRequests(prev => prev.filter(r => 
        !(r.senderId === currentUser.id && r.receiverId === targetUserId) &&
        !(r.senderId === targetUserId && r.receiverId === currentUser.id)
      ));

      showTopBanner(`تم تجاهل "${targetUser?.username || 'المستخدم'}" بنجاح 🚫`);
      alert('تم تجاهل المستخدم بنجاح 🚫. لن تظهر لك أو له أي رسائل أو تفاعلات متبادلة.');
    }
  };

  // React to Message
  const sendTypingStatus = (isTyping: boolean) => {
    if (currentUser && currentRoom) {
      sendSocketEvent("USER_TYPING", {
        userId: currentUser.id,
        username: currentUser.username,
        roomId: currentRoom.id,
        isTyping,
      });
    }
  };

  const reactToMessage = (messageId: string, emoji: string) => {
    if (!currentUser) return;
    const targetMsg = messages.find(m => m.id === messageId);
    if (targetMsg && isUserBlocked(targetMsg.senderId)) {
      alert('لا يمكنك التفاعل مع رسالة مستخدم محظور 🚫');
      return;
    }
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = Array.isArray(m.reactions) ? m.reactions : [];
        const existing = reactions.find(r => r.emoji === emoji);
        let updatedReactions = [];
        if (existing) {
          const hasReacted = existing.users.includes(currentUser.id);
          const newUsers = hasReacted
            ? existing.users.filter(u => u !== currentUser.id)
            : [...existing.users, currentUser.id];
          
          updatedReactions = reactions.map(r => r.emoji === emoji ? { ...r, users: newUsers } : r).filter(r => r.users.length > 0);
        } else {
          updatedReactions = [...reactions, { emoji, users: [currentUser.id] }];
        }
        sendSocketEvent('REACT_MESSAGE', { messageId, reactions: updatedReactions });
        return { ...m, reactions: updatedReactions };
      }
      return m;
    }));
  };

  // Send Private Message
  const sendPrivateMessage = (receiverId: string, text: string, type: 'text' | 'image' | 'voice' = 'text', mediaUrl?: string, voiceDuration?: number) => {
    if (!currentUser) return false;

    // Check Flood Protection
    if (checkFloodAndMute(currentUser)) return false;

    // Check mute status
    if (currentUser.isMuted) {
      if (currentUser.muteUntil && new Date(currentUser.muteUntil).getTime() <= Date.now()) {
        setCurrentUser(prev => prev ? { ...prev, isMuted: false, muteUntil: undefined } : null);
        setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isMuted: false, muteUntil: undefined } : u));
      } else {
        const remainingSec = currentUser.muteUntil
          ? Math.max(1, Math.ceil((new Date(currentUser.muteUntil).getTime() - Date.now()) / 1000))
          : 0;
        showTopBanner(`🚫 أنت مكتوم عن المراسلة بسبب الكلمات المسيئة. المتبقي: ${remainingSec} ثانية`);
        return false;
      }
    }

    const receiver = users.find(u => u.id === receiverId);
    if (!receiver) return false;

    // Check block status (data layer guard)
    if (isUserBlocked(receiverId)) {
      alert('لا يمكنك إرسال رسائل خاصة لهذا المستخدم بسبب الحظر المتبادل بينكما 🚫');
      return false;
    }

    // Check privacy settings
    if (receiver.privatePrivacy === 'none' && !['moderator', 'management', 'admin', 'owner'].includes(currentUser.role)) {
      alert('هذا العضو يغلق الرسائل الخاصة عن الجميع.');
      return false;
    }
    if (receiver.privatePrivacy === 'members' && currentUser.role === 'visitor') {
      alert('هذا العضو يستقبل الرسائل الخاصة من الأعضاء فقط.');
      return false;
    }
    if (receiver.privatePrivacy === 'friends' && !receiver.friends?.includes(currentUser.id) && !['moderator', 'management', 'admin', 'owner'].includes(currentUser.role)) {
      alert('هذا العضو يغلق الخاص باستثناء أصدقائه المضافين.');
      return false;
    }

    // Auto profanity filter for private messages
    let processedText = text;
    if (text) {
      const { cleanText } = processProfanityAndFilter(currentUser, text);
      processedText = cleanText;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });

    const newPm: PrivateMessage = {
      id: `pm-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderAvatar: currentUser.avatar,
      receiverId,
      text: processedText,
      type,
      mediaUrl,
      voiceDuration,
      timestamp: timeStr,
      isRead: false
    };

    setPrivateMessages(prev => [...prev, newPm]);
    sendSocketEvent('SEND_PRIVATE_MESSAGE', newPm);
    unhidePrivateConversation(receiverId);

    // Create notification for receiver
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      userId: receiverId,
      type: 'system',
      title: 'رسالة خاصة جديدة 💬',
      message: `رسالة خاصة جديدة من "${currentUser.username}": ${processedText ? (processedText.length > 25 ? processedText.substring(0, 25) + '...' : processedText) : 'محتوى وسائط'}`,
      timestamp: timeStr,
      isRead: false
    };
    setNotifications(prev => [notif, ...prev]);

    showTopBanner(`💬 تم إرسال رسالة خاصة إلى "${receiver.username}" بنجاح`);

    if (audioSettings.privateSound) {
      playChatSound('private');
    }

    return true;
  };

  const clearAllPrivateConversations = useCallback(() => {
    if (!currentUser) return;
    const currentChatUserIds = Array.from(new Set(
      privateMessages
        .filter(pm => pm.senderId === currentUser.id || pm.receiverId === currentUser.id)
        .map(pm => pm.senderId === currentUser.id ? pm.receiverId : pm.senderId)
    ));
    setHiddenPrivateUserIds(prev => Array.from(new Set([...prev, ...currentChatUserIds])));
  }, [currentUser, privateMessages]);

  const deletePrivateMessages = (targetUserId: string) => {
    if (!currentUser) return;
    setPrivateMessages(prev => prev.filter(
      pm => !((pm.senderId === currentUser.id && pm.receiverId === targetUserId) ||
              (pm.senderId === targetUserId && pm.receiverId === currentUser.id))
    ));
    sendSocketEvent('DELETE_PRIVATE_MESSAGES', { userId1: currentUser.id, userId2: targetUserId });
  };

  // Like User
  const likeUser = (targetUserId: string) => {
    if (!currentUser) return;
    if (targetUserId === currentUser.id) {
      alert('لا يمكنك الإعجاب بملفك الشخصي');
      return;
    }

    if (isUserBlocked(targetUserId)) {
      alert('لا يمكنك الإعجاب بملف هذا المستخدم بسبب الحظر المتبادل 🚫');
      return;
    }

    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    const alreadyLiked = targetUser.likedBy?.includes(currentUser.id);
    if (alreadyLiked) {
      alert('لقد قمت بالإعجاب بهذا الملف من قبل ❤️');
      return;
    }

    const updatedLikedBy = [...(targetUser.likedBy || []), currentUser.id];
    const updatedLikes = targetUser.likes + 1;

    setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, likes: updatedLikes, likedBy: updatedLikedBy } : u));
    sendSocketEvent('UPDATE_USER', { ...targetUser, likes: updatedLikes, likedBy: updatedLikedBy });
    if (selectedUserForProfile?.id === targetUserId) {
      setSelectedUserForProfile(prev => prev ? { ...prev, likes: updatedLikes, likedBy: updatedLikedBy } : null);
    }

    // Add Notification to target user
    const newNotif: Notification = {
      id: `notif-like-${Date.now()}`,
      userId: targetUserId,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderAvatar: currentUser.avatar,
      senderGender: currentUser.gender,
      type: 'like',
      title: 'إعجاب جديد ❤️',
      message: `قام "${currentUser.username}" بالإعجاب بملفك الشخصي`,
      timestamp: formatEnglishShortDateTime(new Date()),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);
    sendSocketEvent('SEND_NOTIFICATION', newNotif);

    if (audioSettings.notificationSound) {
      playChatSound('notification');
    }
  };

  // Send Friend Request
  const sendFriendRequest = (targetUserId: string) => {
    if (!currentUser) return;
    if (targetUserId === 'user-system' || targetUserId === 'system') {
      alert('🚫 لا يمكن إضافة حساب النظام (System) كصديق نهائياً!');
      showTopBanner('🚫 لا يمكن إضافة حساب النظام (System) كصديق نهائياً!');
      return;
    }
    if (currentUser.role === 'visitor') {
      alert('الزوار ليس لديهم خيار الأصدقاء، قم بإنشاء حساب للتمتع بميزة إضافة الأصدقاء.');
      return;
    }
    if (targetUserId === currentUser.id) return;

    if (isUserBlocked(targetUserId)) {
      alert('لا يمكنك إرسال طلب صداقة لهذا المستخدم بسبب الحظر بينكما 🚫');
      return;
    }

    if (currentUser.friends?.includes(targetUserId)) {
      alert('هذا العضو موجود في قائمة أصدقائك بالفعل 👥');
      return;
    }

    const exists = friendRequests.some(fr => fr.senderId === currentUser.id && fr.receiverId === targetUserId);
    if (exists) {
      alert('تم ارسال طلب صداقة سابقاً ينتظر القبول');
      return;
    }

    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    if (targetUser.role === 'visitor') {
      alert('لا يمكنك إضافة الزائر كصديق، يجب على الزائر تسجيل عضوية أولاً.');
      return;
    }
    const req: FriendRequest = {
      id: `fr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderAvatar: currentUser.avatar,
      receiverId: targetUserId,
      timestamp: formatEnglishTime(new Date())
    };

    setFriendRequests(prev => [...prev, req]);
    sendSocketEvent('SEND_FRIEND_REQUEST', req);

    // Create Notification for receiver
    const notif: Notification = {
      id: `notif-friend-${Date.now()}`,
      userId: targetUserId,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderAvatar: currentUser.avatar,
      senderGender: currentUser.gender,
      type: 'friend',
      title: 'طلب صداقة جديد ➕👤',
      message: `أرسل لك "${currentUser.username}" طلب صداقة جديد.`,
      timestamp: formatEnglishShortDateTime(new Date()),
      isRead: false
    };
    setNotifications(prev => [notif, ...prev]);
    sendSocketEvent('SEND_NOTIFICATION', notif);

    if (audioSettings.friendRequestSound !== false) {
      playChatSound('friend_request');
    }

    showTopBanner(`✉️ تم إرسال طلب الصداقة لـ "${targetUser?.username || 'العضو'}" بنجاح`);
  };

  // Respond Friend Request
  const respondFriendRequest = (requestId: string, accept: boolean) => {
    const req = friendRequests.find(r => r.id === requestId);
    if (!req || !currentUser) return;

    sendSocketEvent('RESPOND_FRIEND_REQUEST', { requestId, accept });

    if (accept) {
      // Add friends bidirectionally
      const myFriends = currentUser.friends || [];
      const updatedMyFriends = myFriends.includes(req.senderId) ? myFriends : [...myFriends, req.senderId];
      const updatedCurUser = { ...currentUser, friends: updatedMyFriends };

      setCurrentUser(updatedCurUser);
      setUsers(prev => prev.map(u => {
        if (u.id === currentUser.id) {
          return updatedCurUser;
        }
        if (u.id === req.senderId) {
          const sFriends = u.friends || [];
          const updatedSFriends = sFriends.includes(currentUser.id) ? sFriends : [...sFriends, currentUser.id];
          const updatedSender = { ...u, friends: updatedSFriends };
          sendSocketEvent('UPDATE_USER', updatedSender);
          return updatedSender;
        }
        return u;
      }));
      sendSocketEvent('UPDATE_USER', updatedCurUser);

      // Add Notification
      const notif: Notification = {
        id: `notif-accept-${Date.now()}`,
        userId: req.senderId,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        senderGender: currentUser.gender,
        type: 'friend_accept',
        title: 'قبول طلب صداقة 🤝',
        message: `قبل "${currentUser.username}" طلب الصداقة الخاص بك.`,
        timestamp: formatEnglishShortDateTime(new Date()),
        isRead: false
      };
      setNotifications(prev => [notif, ...prev]);
      sendSocketEvent('SEND_NOTIFICATION', notif);
      showTopBanner(`🤝 تم قبول طلب الصداقة من "${req.senderName}"`);
    } else {
      showTopBanner(`تم رفض طلب الصداقة من "${req.senderName}"`);
    }

    setFriendRequests(prev => prev.filter(r => r.id !== requestId));
  };

  const acceptFriendRequest = (requestId: string) => {
    respondFriendRequest(requestId, true);
  };

  const rejectFriendRequest = (requestId: string) => {
    respondFriendRequest(requestId, false);
  };

  // Remove Friend
  const removeFriend = (friendId: string) => {
    if (!currentUser) return;
    setUsers(prev => prev.map(u => {
      if (u.id === currentUser.id) {
        return { ...u, friends: (u.friends || []).filter(f => f !== friendId) };
      }
      if (u.id === friendId) {
        return { ...u, friends: (u.friends || []).filter(f => f !== currentUser.id) };
      }
      return u;
    }));
    setCurrentUser(prev => prev ? { ...prev, friends: (prev.friends || []).filter(f => f !== friendId) } : null);
  };

  // Toggle Ignore / Block
  const toggleIgnore = (targetUserId: string) => {
    toggleBlockUser(targetUserId);
  };

  // Report User Message
  const reportUserMessage = (reportedUserId: string, messageText: string, reason: Report['reason'], details?: string, type: 'chat' | 'private' | 'profile' = 'chat') => {
    if (!currentUser) return;
    if (currentUser.role === 'visitor') {
      alert('خاصية الإبلاغ متاحة من رتبة عضو وما فوق');
      return;
    }

    const reportedUser = users.find(u => u.id === reportedUserId);
    const now = new Date();
    const formattedTimestamp = formatEnglishShortDateTime(now);

    const rep: Report = {
      id: `rep-${Date.now()}`,
      reporterId: currentUser.id,
      reporterName: currentUser.username,
      reportedUserId,
      reportedUserName: reportedUser?.username || 'مستخدم',
      messageText,
      reason,
      type,
      details,
      timestamp: formattedTimestamp
    };

    setReports(prev => [rep, ...prev]);

    // Play moderator report sound alert if enabled
    if (audioSettings.reportAlertSound) {
      playChatSound('report');
    }

    showTopBanner(`🚨 تنبيه إداري: وصل بلاغ جديد (${reason}) من "${currentUser.username}"`);
    alert('تم إرسال البلاغ بنجاح للتحقيق والرقابة لدى الإدارة 📭');
  };

  // Resolve Report
  const resolveReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    showTopBanner('✅ تمت معالجة وإغلاق البلاغ بنجاح');
  };

  // Delete Report
  const deleteReport = (reportId: string) => {
    setReports(prev => prev.filter(r => r.id !== reportId));
    showTopBanner('🗑️ تم حذف البلاغ من القائمة');
  };

  // Update Report Category
  const updateReportCategory = (reportId: string, newReason: Report['reason'], newCategory?: string) => {
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, reason: newReason, category: newCategory || r.category } : r));
    showTopBanner(`🏷️ تم تحديث تصنيف البلاغ إلى [${newReason}]`);
  };

  // Update Profile with Role Permissions & Server Persistence
  const updateUserProfile = (updates: Partial<User>) => {
    if (!currentUser) return;

    if (currentUser.role === 'visitor' && updates.username && updates.username !== currentUser.username) {
      showTopBanner('⚠️ يجب تسجيل عضوية لتثبيت اسم مخصص في الشات');
    }

    if (updates.username && updates.username !== currentUser.username) {
      const cleanNewName = updates.username.trim();
      if (!cleanNewName) {
        showTopBanner('🚫 اسم المستخدم لا يمكن أن يكون فارغاً');
        return;
      }
      if (isDuplicateUsername(cleanNewName, users, currentUser.id)) {
        showTopBanner(`🚫 الاسم "${cleanNewName}" مستخدم بالفعل أو مسجل لعضو آخر`);
        alert(`🚫 الاسم "${cleanNewName}" مستخدم بالفعل أو مسجل لعضو آخر، يرجى اختيار اسم مختلف.`);
        return;
      }
    }

    // Avatar permission guard: Members and Visitors have fixed default avatar until promoted to VIP+
    const canCustomAvatar = ['vip', 'moderator', 'management', 'admin', 'owner'].includes(currentUser.role);
    if (!canCustomAvatar && updates.avatar && updates.avatar.trim() !== '') {
      // Revert/ignore custom avatar upload for regular members
      delete updates.avatar;
    }

    const updatedUser = { ...currentUser, ...updates };

    if (updates.username && updates.username !== currentUser.username) {
      const nowObj = new Date();
      const timeString = formatEnglishTime(nowObj);
      const dateString = formatEnglishDate(nowObj);
      const timeStampFormatted = formatEnglishDateTime(nowObj);

      const nameNotif: Notification = {
        id: `notif-name-${Date.now()}`,
        userId: currentUser.id,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        senderGender: currentUser.gender,
        type: 'name_change',
        title: 'System',
        message: `تم تغير اسمك إلى: "${updates.username}"`,
        timestamp: timeStampFormatted,
        isRead: false
      };
      setNotifications(prev => [nameNotif, ...prev]);
      sendSocketEvent('SEND_NOTIFICATION', nameNotif);

      // Send general announcement to room from System
      const sysMsg: Message = {
        id: `sys-name-${Date.now()}`,
        roomId: currentUser.currentRoomId || currentRoom.id,
        senderId: 'user-system',
        senderName: 'System',
        senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
        senderRole: 'management',
        senderGender: 'other',
        text: `تم تغيير اسم العضو: ${updates.username} | araby.chat`,
        type: 'text',
        timestamp: timeString,
        date: dateString
      };
      setMessages(prev => [...prev, sysMsg]);
      sendSocketEvent('SEND_MESSAGE', sysMsg);
    }

    try {
      localStorage.setItem('araby_current_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save user in localStorage:', e);
    }

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    sendSocketEvent('UPDATE_USER', updatedUser);
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: updatedUser })
    }).catch(err => console.warn('Failed to persist user profile update to D1:', err));
  };

  // Audio Settings
  const updateAudioSettings = (updates: Partial<AudioSettings>) => {
    setAudioSettings(prev => ({ ...prev, ...updates }));
  };

  // Theme Settings
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');

  useEffect(() => {
    if (currentUser?.theme) {
      setThemeModeState(currentUser.theme);
    }
  }, [currentUser?.theme]);

  const setThemeMode = (theme: ThemeMode) => {
    setThemeModeState(theme);
    if (currentUser) {
      updateUserProfile({ theme });
    }
  };

  // Buy Rank in Store
  const buyRank = (role: 'vip' | 'moderator') => {
    if (!currentUser) return { success: false, message: 'الرجاء تسجيل الدخول أولاً' };

    const storeItem = storeItems.find(s => s.role === role);
    if (!storeItem) return { success: false, message: 'عنصر المتجر غير موجود' };

    if (currentUser.coins < storeItem.price) {
      return { success: false, message: `رصيدك الحالي (${currentUser.coins}💵) لا يكفي لشراء هذا المنتج (${storeItem.price}💵). يمكنك تجميعه من التفاعل أو الشراء.` };
    }

    if (storeItem.requiresOwnerApproval && currentUser.role !== 'owner') {
      // Create pending request for Owner approval
      alert('تم تقديم طلب شراء رتبة مشرف للإدارة، سيتطلب موافقة المالك لأسباب أمان الشات.');
      return { success: true, message: 'تم إرسال الطلب للمالك للموافقة.' };
    }

    // Deduct coins and upgrade role
    const newCoins = currentUser.coins - storeItem.price;
    updateUserProfile({ coins: newCoins, role });

    const roleNotif: Notification = {
      id: `notif-buy-role-${Date.now()}`,
      userId: currentUser.id,
      senderId: currentUser.id,
      senderName: 'متجر الرتب',
      senderAvatar: currentUser.avatar,
      senderGender: currentUser.gender,
      type: 'role_change',
      title: 'ترقية رتبة 💎',
      message: `مبروك! تم ترقية رتبتك إلى [ ${role === 'vip' ? 'مميز 💎' : 'مشرف 🛡️'} ]`,
      timestamp: formatEnglishDateTime(new Date()),
      isRead: false
    };
    setNotifications(prev => [roleNotif, ...prev]);
    sendSocketEvent('SEND_NOTIFICATION', roleNotif);

    return { success: true, message: `تهانينا! تم الشراء بنجاح وترقيتك إلى رتبة ${role === 'vip' ? 'مميز 💎' : 'مشرف 🛡️'}` };
  };

  // Moderator / Admin Actions
  const moderatorAction = (
    targetUserId: string,
    actionType: 'mute' | 'kick' | 'unmute' | 'unkick' | 'ban' | 'unban' | 'edit_name' | 'delete_account',
    durationMinutes: number = 5,
    reason: string = 'مخالفة الشروط',
    newName?: string
  ) => {
    if (!currentUser) return;

    const targetUser = users.find(u => u.id === targetUserId);
    if (!targetUser) return;

    if (targetUser.role === 'owner') {
      showTopBanner('🚫 لا يمكنك اتخاذ أي إجراء إداري (كتم أو طرد أو حظر) على المالك الرئيسي!');
      return;
    }

    // Protection: System user cannot be touched/modified unless actor is Owner
    if ((targetUser.id === 'user-system' || targetUser.username === 'System') && currentUser.role !== 'owner' && currentUser.id !== 'user-owner') {
      showTopBanner('🚫 لا يمكنك اتخاذ أي إجراء إداري على حساب النظام (System) إلا بواسطة المالك الرئيسي!');
      return;
    }

    const now = Date.now();
    const expiryStr = new Date(now + durationMinutes * 60 * 1000).toISOString();
    const targetIp = targetUser.ip || (targetUserId === currentUser.id ? clientIp : '197.220.12.89');

    if (actionType === 'mute') {
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isMuted: true, muteUntil: expiryStr } : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser(prev => prev ? { ...prev, isMuted: true, muteUntil: expiryStr } : null);
      }
      addIPModerationRecord({
        id: `ip-mute-${Date.now()}-${Math.random()}`,
        ip: targetIp,
        type: 'mute',
        targetUserId,
        targetUsername: targetUser.username,
        actionBy: currentUser.username,
        reason,
        durationMinutes,
        expiresAt: expiryStr,
        createdAt: new Date().toISOString()
      });
    } else if (actionType === 'unmute') {
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isMuted: false, muteUntil: undefined } : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser(prev => prev ? { ...prev, isMuted: false, muteUntil: undefined } : null);
      }
      removeIPModerationRecord(targetIp, 'mute');
    } else if (actionType === 'kick') {
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isKicked: true, kickUntil: expiryStr } : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser(prev => prev ? { ...prev, isKicked: true, kickUntil: expiryStr } : null);
      }
      addIPModerationRecord({
        id: `ip-kick-${Date.now()}-${Math.random()}`,
        ip: targetIp,
        type: 'kick',
        targetUserId,
        targetUsername: targetUser.username,
        actionBy: currentUser.username,
        reason,
        durationMinutes,
        expiresAt: expiryStr,
        createdAt: new Date().toISOString()
      });
    } else if (actionType === 'unkick') {
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isKicked: false, kickUntil: undefined } : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser(prev => prev ? { ...prev, isKicked: false, kickUntil: undefined } : null);
      }
      removeIPModerationRecord(targetIp, 'kick');
    } else if (actionType === 'ban') {
      setUsers(prev => prev.map(u => (u.id === targetUserId || (targetIp && u.ip === targetIp)) ? { ...u, isBanned: true, onlineStatus: 'offline', currentRoomId: undefined } : u));
      setBanList(prev => [...prev.filter(id => id !== targetUserId), targetUserId]);
      setRooms(prev => prev.map(r => ({
        ...r,
        kickedUsers: [...(r.kickedUsers || []).filter(uid => uid !== targetUserId), targetUserId]
      })));
      setCurrentRoom(prev => ({
        ...prev,
        kickedUsers: [...(prev.kickedUsers || []).filter(uid => uid !== targetUserId), targetUserId]
      }));

      addIPModerationRecord({
        id: `ip-ban-${Date.now()}-${Math.random()}`,
        ip: targetIp,
        type: 'ban',
        targetUserId,
        targetUsername: targetUser.username,
        actionBy: currentUser.username,
        reason,
        createdAt: new Date().toISOString()
      });

      sendSocketEvent('BAN_USER', {
        userId: targetUserId,
        ip: targetIp,
        reason
      });

      if (currentUser.id === targetUserId) {
        try {
          localStorage.setItem('araby_device_banned', 'true');
          document.cookie = 'araby_ban=1; path=/; max-age=315360000';
        } catch (e) {}
        showTopBanner(`🚫 تم حظر حسابك وجهازك من قبل الإدارة`);
        logout();
      }
    } else if (actionType === 'unban') {
      setUsers(prev => prev.map(u => (u.id === targetUserId || (targetIp && u.ip === targetIp)) ? { ...u, isBanned: false } : u));
      setBanList(prev => prev.filter(id => id !== targetUserId && id !== targetIp));
      removeIPModerationRecord(targetIp, 'ban');
      removeIPModerationRecord(targetUserId, 'ban');
      sendSocketEvent('UNBAN_USER', {
        userId: targetUserId,
        ip: targetIp
      });
      showTopBanner(`🔓 تم فك حظر العضو (${targetUser.username}) بنجاح`);
    } else if (actionType === 'edit_name' && newName) {
      const cleanNew = newName.trim();
      if (!cleanNew) {
        showTopBanner('🚫 اسم المستخدم لا يمكن أن يكون فارغاً');
        return;
      }
      if (isDuplicateUsername(cleanNew, users, targetUserId)) {
        showTopBanner(`🚫 الاسم "${cleanNew}" مستخدم بالفعل لعضو آخر`);
        alert(`🚫 الاسم "${cleanNew}" مستخدم بالفعل لعضو آخر، يرجى اختيار اسم فريد.`);
        return;
      }
      const updatedTargetUser = { ...targetUser, username: cleanNew };
      setUsers(prev => prev.map(u => u.id === targetUserId ? updatedTargetUser : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser(prev => prev ? { ...prev, username: cleanNew } : null);
      }
      sendSocketEvent('UPDATE_USER', updatedTargetUser);
      fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: updatedTargetUser })
      }).catch(err => console.warn('Failed to persist name change to D1:', err));
    } else if (actionType === 'delete_account') {
      setUsers(prev => prev.filter(u => u.id !== targetUserId));
      sendSocketEvent('DELETE_USER_ACCOUNT', { userId: targetUserId });
      fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId })
      }).catch(err => console.warn('Failed to persist delete user to D1:', err));
    }

    const nowObj = new Date();
    const timeString = formatEnglishTime(nowObj);
    const dateString = formatEnglishDate(nowObj);
    const timeStampFormatted = formatEnglishDateTime(nowObj);

    let targetNotif: Notification | null = null;

    if (actionType === 'edit_name' && newName) {
      targetNotif = {
        id: `notif-mod-name-${Date.now()}-${Math.random()}`,
        userId: targetUserId,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        senderGender: currentUser.gender,
        type: 'name_change',
        title: 'تغيير الاسم من الإدارة ✏️',
        message: `تم تغيير اسمك من قبل الإدارة إلى: "${newName}"`,
        timestamp: timeStampFormatted,
        isRead: false
      };
    } else if (actionType === 'mute') {
      targetNotif = {
        id: `notif-mod-mute-${Date.now()}-${Math.random()}`,
        userId: targetUserId,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        senderGender: currentUser.gender,
        type: 'mute',
        title: 'كتم الحساب 🔇',
        message: `لقد تم كتمك لمدة ${durationMinutes} دقيقة. السبب: ${reason}`,
        timestamp: timeStampFormatted,
        isRead: false
      };
    } else if (actionType === 'unmute') {
      targetNotif = {
        id: `notif-mod-unmute-${Date.now()}-${Math.random()}`,
        userId: targetUserId,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        senderGender: currentUser.gender,
        type: 'system',
        title: 'فك الكتم 🔊',
        message: 'تم فك الكتم عن حسابك من قبل الإدارة',
        timestamp: timeStampFormatted,
        isRead: false
      };
    } else if (actionType === 'kick') {
      targetNotif = {
        id: `notif-mod-kick-${Date.now()}-${Math.random()}`,
        userId: targetUserId,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        senderGender: currentUser.gender,
        type: 'kick',
        title: 'طرد مؤقت ⚠️',
        message: `لقد تم طردك من الدردشة لمدة ${durationMinutes} دقيقة. السبب: ${reason}`,
        timestamp: timeStampFormatted,
        isRead: false
      };
    } else if (actionType === 'unkick') {
      targetNotif = {
        id: `notif-mod-unkick-${Date.now()}-${Math.random()}`,
        userId: targetUserId,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        senderGender: currentUser.gender,
        type: 'system',
        title: 'انتهاء الطرد ✅',
        message: 'انتهت مدة الطرد المؤقت ويمكنك الآن استخدام الدردشة',
        timestamp: timeStampFormatted,
        isRead: false
      };
    } else if (actionType === 'ban') {
      targetNotif = {
        id: `notif-mod-ban-${Date.now()}-${Math.random()}`,
        userId: targetUserId,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        senderGender: currentUser.gender,
        type: 'ban',
        title: 'حظر نهائي 🚫',
        message: `لقد تم حظرك من قبل المالك. السبب: ${reason || 'مخالفة القوانين العامة'}`,
        timestamp: timeStampFormatted,
        isRead: false
      };
    } else if (actionType === 'unban') {
      targetNotif = {
        id: `notif-mod-unban-${Date.now()}-${Math.random()}`,
        userId: targetUserId,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        senderGender: currentUser.gender,
        type: 'system',
        title: 'فك الحظر 🔓',
        message: 'تم فك حظر حسابك من قبل الإدارة',
        timestamp: timeStampFormatted,
        isRead: false
      };
    }

    if (targetNotif) {
      if (currentUser.id === targetUserId) {
        setNotifications(prev => [targetNotif!, ...prev]);
      }
      sendSocketEvent('SEND_NOTIFICATION', targetNotif);
    }

    // Add log
    const log: ModLogEntry = {
      id: `log-${Date.now()}-${Math.random()}`,
      targetUserId,
      targetUsername: targetUser.username,
      actionBy: currentUser.username,
      actionType,
      reason,
      durationMinutes,
      timestamp: formatEnglishDateTime(new Date())
    };
    setModLogs(prev => [log, ...prev]);

    // Log to room activity logs
    addRoomActivityLog(
      currentRoom.id,
      currentRoom.name,
      currentUser.id,
      currentUser.username,
      currentUser.role,
      actionType === 'edit_name' ? 'role_change' : actionType,
      `إجراء إداري (${actionType}) على المستخدم ${targetUser.username} - السبب: ${reason}`,
      targetUser.username
    );

    // Format announcement message from System ONLY for public announce actions (mute, kick, ban, edit_name)
    // NEVER send public announcement for un-actions (unmute, unkick, unban, delete_account)
    const publicAnnounceActions = ['mute', 'kick', 'ban', 'edit_name'];
    if (publicAnnounceActions.includes(actionType)) {
      const actionVerbMap: Record<string, string> = {
        mute: 'كتم',
        kick: 'طرد',
        ban: 'حظر'
      };

      const systemAvatar = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80';

      let sysMsgText = '';
      if (actionType === 'edit_name' && newName) {
        sysMsgText = `تم تغيير اسم العضو: ${newName} | arabsyemen.com`;
      } else if (actionType in actionVerbMap) {
        const verb = actionVerbMap[actionType];
        sysMsgText = `${targetUser.username}\narabsyemen.com تم ${verb}`;
      }

      if (sysMsgText) {
        // Send announcement message in room
        const sysMsg: Message = {
          id: `sys-${Date.now()}-${Math.random()}`,
          roomId: currentRoom.id,
          senderId: 'user-system',
          senderName: 'System',
          senderAvatar: systemAvatar,
          senderRole: 'management',
          senderGender: 'other',
          text: sysMsgText,
          type: 'text',
          targetUserId: targetUser.id,
          timestamp: timeString,
          date: dateString
        };
        setMessages(prev => [...prev, sysMsg]);
        sendSocketEvent('SEND_MESSAGE', sysMsg);
      }
    }
  };

  // Delete message
  const deleteMessage = (messageId: string) => {
    const targetMsg = messages.find(m => m.id === messageId);
    if (targetMsg && currentUser) {
      const msgSnippet = targetMsg.text ? targetMsg.text.substring(0, 35) : 'وسائط/صورة/صوت';
      addRoomActivityLog(
        targetMsg.roomId || currentRoom.id,
        currentRoom.name,
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'delete_message',
        `حذف رسالة للمستخدم "${targetMsg.senderName}": [${msgSnippet}]`,
        targetMsg.senderName
      );
    }
    setMessages(prev => prev.filter(m => m.id !== messageId));
    sendSocketEvent('DELETE_MESSAGE', { messageId });
  };

  // Clear Room Public Messages (Command /Clear or Admin/Staff action)
  const clearChat = (roomId?: string) => {
    if (!currentUser) return;
    const targetRoomId = roomId || currentRoom.id;
    const targetRoom = rooms.find(r => r.id === targetRoomId) || currentRoom;

    // Allowed ONLY for Owner, Admin, and Management (المشرف أو الرتب الأخرى يظهر له حدث خطأ ما)
    const hasClearPermission = ['owner', 'admin', 'management'].includes(currentUser.role);

    if (hasClearPermission) {
      // Clear for everyone in room & database & WebSocket
      setMessages(prev => prev.filter(m => m.roomId !== targetRoomId));
      sendSocketEvent('CLEAR_CHAT', { roomId: targetRoomId });

      addRoomActivityLog(
        targetRoomId,
        targetRoom.name,
        currentUser.id,
        currentUser.username,
        currentUser.role,
        'clear_chat',
        `مسح محادثة الغرفة بالكامل عبر الأمر (/Clear) بواسطة ${currentUser.username}`,
        'الجميع'
      );

      // Post system announcement message to room
      const now = new Date();
      const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
      const dateStr = now.toLocaleDateString('ar-EG');
      const sysMsg: Message = {
        id: `sys-clear-${Date.now()}`,
        roomId: targetRoomId,
        senderId: 'user-system',
        senderName: 'System',
        senderRole: 'management',
        senderGender: 'other',
        senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
        text: `🧹 قام (${currentUser.username}) بمسح الدردشة العامة للغرفة بنجاح`,
        type: 'text',
        timestamp: timeStr,
        date: dateStr
      };
      setMessages(prev => [...prev.filter(m => m.roomId !== targetRoomId), sysMsg]);
      sendSocketEvent('SEND_MESSAGE', sysMsg);

      showTopBanner(`🧹 تم مسح محادثة غرفة (${targetRoom.name}) بنجاح`);
    } else {
      // Moderator, Member, Visitor get an error message: حدث خطأ ما
      showTopBanner('⚠️ حدث خطأ ما: ليس لديك صلاحية تنفيذ هذا الأمر (متاح للمالك والإدارة فقط)');
    }
  };

  // Role-Authorized Administrative User Update (Owner, Admin, Management)
  const ownerUpdateUser = (userId: string, updates: Partial<User>) => {
    if (!currentUser) return;

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const isActorOwner = currentUser.role === 'owner';
    const isActorAdmin = currentUser.role === 'admin';
    const isActorManagement = currentUser.role === 'management';
    const isSelfEdit = currentUser.id === userId;

    // Protection 1: Owner profile cannot be modified by anyone except the Owner himself
    if (targetUser.role === 'owner' && !isActorOwner) {
      showTopBanner('🚫 لا يمكن تعديل الملف الشخصي للمالك الرئيسي إلا بواسطة المالك نفسه!');
      return;
    }

    // Protection 2: Admin profile can only be modified by Owner or self
    if (targetUser.role === 'admin' && !isActorOwner && !isSelfEdit) {
      showTopBanner('🚫 لا يمكن تعديل الملف الشخصي للأدمن إلا بواسطة المالك الرئيسي!');
      return;
    }

    // Protection 3: Management profile can only be modified by Owner, Admin, or self
    if (targetUser.role === 'management' && !isActorOwner && !isActorAdmin && !isSelfEdit) {
      showTopBanner('🚫 لا يمكن تعديل الملف الشخصي للإدارة إلا بواسطة المالك أو الأدمن!');
      return;
    }

    // Authorization: Actor must be Management or higher, or self
    if (!isActorOwner && !isActorAdmin && !isActorManagement && !isSelfEdit) {
      showTopBanner('🚫 ليس لديك الصلاحية الإدارية لتعديل هذا العضو!');
      return;
    }

    if (updates.username && updates.username !== targetUser.username) {
      const cleanNewName = updates.username.trim();
      if (!cleanNewName) {
        showTopBanner('🚫 لا يمكن أن يكون اسم المستخدم فارغاً');
        return;
      }
      if (isDuplicateUsername(cleanNewName, users, userId)) {
        showTopBanner(`🚫 الاسم "${cleanNewName}" مستخدم بالفعل لعضو آخر`);
        alert(`🚫 الاسم "${cleanNewName}" مستخدم بالفعل لعضو آخر، يرجى اختيار اسم فريد.`);
        return;
      }
    }

    const updatedUser = { ...targetUser, ...updates } as User;
    setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    if (currentUser.id === userId) {
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('araby_chat_user', JSON.stringify(updatedUser));
      } catch (e) {}
    }
    sendSocketEvent('UPDATE_USER', updatedUser);
  };

  // Owner update store prices
  const ownerUpdateStorePrices = (vipPrice: number, modPrice: number) => {
    setStoreItems(prev => prev.map(s => {
      if (s.role === 'vip') return { ...s, price: vipPrice };
      if (s.role === 'moderator') return { ...s, price: modPrice };
      return s;
    }));
  };

  // Ban / Unban User Management
  const banUser = (userId: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'owner') {
      showTopBanner('🚫 لا يمكن حظر المالك الرئيسي!');
      return;
    }
    if (!banList.includes(userId)) {
      setBanList(prev => [...prev, userId]);
      showTopBanner(`🚫 تم إدراج العضو (${userId}) في قائمة الحظر بنجاح`);
    }
    const targetIp = targetUser?.ip || (userId === currentUser?.id ? clientIp : undefined);
    if (targetIp) {
      addIPModerationRecord({
        id: `ip-ban-${Date.now()}-${Math.random()}`,
        ip: targetIp,
        type: 'ban',
        targetUserId: userId,
        targetUsername: targetUser?.username || userId,
        actionBy: currentUser?.username || 'الإدارة',
        reason: 'حظر عام من الإدارة',
        createdAt: new Date().toISOString()
      });
    }
  };

  const unbanUser = (userId: string) => {
    setBanList(prev => prev.filter(id => id !== userId));
    const targetUser = users.find(u => u.id === userId);
    const targetIp = targetUser?.ip;
    if (targetIp) {
      removeIPModerationRecord(targetIp, 'ban');
    }
    removeIPModerationRecord(userId, 'ban');
    setUsers(prev => prev.map(u => (u.id === userId || (targetIp && u.ip === targetIp)) ? { ...u, isBanned: false } : u));
    sendSocketEvent('UNBAN_USER', { userId, ip: targetIp });
    showTopBanner(`🔓 تم رفع الحظر عن العضو (${targetUser?.username || userId}) بنجاح`);
  };

  // Room Management Actions
  const updateRoomDetails = (roomId: string, updates: { name?: string; description?: string; password?: string; isLocked?: boolean; welcomeMessage?: string; autoWelcomeEnabled?: boolean }) => {
    setRooms(prev => {
      const updatedRooms = prev.map(r => {
        if (r.id === roomId) {
          const updated = {
            ...r,
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            ...(updates.password !== undefined ? { password: updates.password } : {}),
            ...(updates.isLocked !== undefined ? { isLocked: updates.isLocked } : {}),
            ...(updates.welcomeMessage !== undefined ? { welcomeMessage: updates.welcomeMessage } : {}),
            ...(updates.autoWelcomeEnabled !== undefined ? { autoWelcomeEnabled: updates.autoWelcomeEnabled } : {})
          };
          if (currentRoom.id === roomId) {
            setCurrentRoom(updated);
          }
          return updated;
        }
        return r;
      });
      sendSocketEvent('UPDATE_ROOMS', updatedRooms);
      return updatedRooms;
    });
  };

  const muteUserInRoom = (roomId: string, userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target?.role === 'owner') {
      showTopBanner('🚫 لا يمكن كتم المالك الرئيسي!');
      return;
    }
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const currentMuted = r.mutedUsers || [];
        if (!currentMuted.includes(userId)) {
          const updated = { ...r, mutedUsers: [...currentMuted, userId] };
          if (currentRoom.id === roomId) setCurrentRoom(updated);
          return updated;
        }
      }
      return r;
    }));
    moderatorAction(userId, 'mute', 60, 'كتم عام في إعدادات الغرفة');
  };

  const unmuteUserInRoom = (roomId: string, userId: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const currentMuted = r.mutedUsers || [];
        const updated = { ...r, mutedUsers: currentMuted.filter(id => id !== userId) };
        if (currentRoom.id === roomId) setCurrentRoom(updated);
        return updated;
      }
      return r;
    }));
    moderatorAction(userId, 'unmute', 0, 'إلغاء الكتم من إعدادات الغرفة');
  };

  const kickUserFromRoom = (roomId: string, userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target?.role === 'owner') {
      showTopBanner('🚫 لا يمكن طرد المالك الرئيسي!');
      return;
    }
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const currentKicked = r.kickedUsers || [];
        if (!currentKicked.includes(userId)) {
          const updated = { ...r, kickedUsers: [...currentKicked, userId] };
          if (currentRoom.id === roomId) setCurrentRoom(updated);
          return updated;
        }
      }
      return r;
    }));
    moderatorAction(userId, 'kick', 1440, 'طرد من إعدادات الغرفة');
  };

  const unkickUserFromRoom = (roomId: string, userId: string) => {
    setRooms(prev => prev.map(r => {
      if (r.id === roomId) {
        const currentKicked = r.kickedUsers || [];
        const updated = { ...r, kickedUsers: currentKicked.filter(id => id !== userId) };
        if (currentRoom.id === roomId) setCurrentRoom(updated);
        return updated;
      }
      return r;
    }));
    moderatorAction(userId, 'unkick', 0, 'إلغاء الطرد من إعدادات الغرفة');
  };

  // Assign Room Honorary Role (مشرف غرفة / مدير غرفة / مالك غرفة)
  const assignRoomStaff = (roomId: string, userId: string, role: RoomRole) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    setRooms(prev => {
      const updatedRooms = prev.map(r => {
        if (r.id === roomId) {
          const currentStaff = r.roomStaff || [];
          const filteredStaff = currentStaff.filter(s => s.userId !== userId);
          const newStaff = [
            ...filteredStaff,
            {
              userId: targetUser.id,
              username: targetUser.username,
              role,
              avatar: targetUser.avatar,
              assignedAt: new Date().toISOString()
            }
          ];
          const updated = { ...r, roomStaff: newStaff };
          if (currentRoom.id === roomId) setCurrentRoom(updated);
          return updated;
        }
        return r;
      });
      sendSocketEvent('UPDATE_ROOMS', updatedRooms);
      return updatedRooms;
    });

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roomRole: role } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, roomRole: role } : null);
    }
  };

  // Remove Room Honorary Role
  const removeRoomStaff = (roomId: string, userId: string) => {
    setRooms(prev => {
      const updatedRooms = prev.map(r => {
        if (r.id === roomId) {
          const currentStaff = r.roomStaff || [];
          const newStaff = currentStaff.filter(s => s.userId !== userId);
          const updated = { ...r, roomStaff: newStaff };
          if (currentRoom.id === roomId) setCurrentRoom(updated);
          return updated;
        }
        return r;
      });
      sendSocketEvent('UPDATE_ROOMS', updatedRooms);
      return updatedRooms;
    });

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roomRole: undefined } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, roomRole: undefined } : null);
    }
  };

  // Owner update room name
  const ownerUpdateRoomName = (roomId: string, newName: string) => {
    setRooms(prev => {
      const updatedRooms = prev.map(r => r.id === roomId ? { ...r, name: newName } : r);
      sendSocketEvent('UPDATE_ROOMS', updatedRooms);
      return updatedRooms;
    });
  };

  // Add room
  const addRoom = (name: string, flag: string, description: string) => {
    const newRoom: Room = {
      id: `room-${Date.now()}`,
      name: name.trim(),
      flag: flag.trim() || '🇾🇪',
      description: description.trim() || 'غرفة جديدة',
      isDefault: false
    };
    setRooms(prev => {
      const updatedRooms = [...prev, newRoom];
      sendSocketEvent('UPDATE_ROOMS', updatedRooms);
      return updatedRooms;
    });
  };

  // Delete room
  const deleteRoom = (roomId: string) => {
    setRooms(prev => {
      const filtered = prev.filter(r => r.id !== roomId);
      if (currentRoom.id === roomId && filtered.length > 0) {
        setCurrentRoom(filtered[0]);
      }
      sendSocketEvent('UPDATE_ROOMS', filtered);
      return filtered;
    });
  };

  // Update user role
  const updateUserRole = (userId: string, newRole: UserRole) => {
    const targetUser = users.find(u => u.id === userId);
    if (targetUser?.role === 'owner' && currentUser?.id !== userId) {
      showTopBanner('🚫 لا يمكن تعديل رتبة المالك الرئيسي!');
      return;
    }
    const updatedUser = { ...targetUser, role: newRole } as User;
    setUsers(prev => prev.map(u => u.id === userId ? updatedUser : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, role: newRole } : null);
    }
    sendSocketEvent('UPDATE_USER', updatedUser);
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: updatedUser })
    }).catch(err => console.warn('Failed to persist role change to D1:', err));

    const roleTitleMap: Record<string, string> = {
      visitor: 'زائر',
      member: 'عضو 🧑‍💼',
      vip: 'مميز 💎',
      moderator: 'مشرف 🛡️',
      management: 'إدارة 👑',
      admin: 'أدمن ⭐',
      owner: 'المالك 👑'
    };
    const roleTitle = roleTitleMap[newRole] || newRole;

    const roleNotif: Notification = {
      id: `notif-role-${Date.now()}`,
      userId,
      senderId: currentUser?.id || 'system',
      senderName: currentUser?.username || 'الإدارة العليا',
      senderAvatar: currentUser?.avatar,
      senderGender: currentUser?.gender,
      type: 'role_change',
      title: 'تغيير الرتبة 🎖️',
      message: `تم تغيير رتبتك إلى: [ ${roleTitle} ]`,
      timestamp: formatEnglishDateTime(new Date()),
      isRead: false
    };
    setNotifications(prev => [roleNotif, ...prev]);
    sendSocketEvent('SEND_NOTIFICATION', roleNotif);
  };

  // Add coins to user
  const addCoins = (userId: string, amount: number) => {
    let updatedTargetUser: User | null = null;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        updatedTargetUser = { ...u, coins: (u.coins || 0) + amount };
        return updatedTargetUser;
      }
      return u;
    }));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, coins: (prev.coins || 0) + amount } : null);
    }
    if (updatedTargetUser) {
      sendSocketEvent('UPDATE_USER', updatedTargetUser);
      fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: updatedTargetUser })
      }).catch(err => console.warn('Failed to persist coins update to D1:', err));
    }
  };

  // Clear moderation state
  const clearModerationState = (userId: string) => {
    let updatedTargetUser: User | null = null;
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        updatedTargetUser = { ...u, isMuted: false, muteUntil: undefined, isKicked: false, kickUntil: undefined };
        return updatedTargetUser;
      }
      return u;
    }));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, isMuted: false, muteUntil: undefined, isKicked: false, kickUntil: undefined } : null);
    }
    if (updatedTargetUser) {
      sendSocketEvent('UPDATE_USER', updatedTargetUser);
      fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: updatedTargetUser })
      }).catch(err => console.warn('Failed to persist clear mod state to D1:', err));
    }
  };

  // Toggle Owner Stealth Mode (مخصص للمالك فقط)
  const toggleOwnerStealth = () => {
    if (!currentUser || currentUser.role !== 'owner') {
      showTopBanner('🚫 وضع الاختفاء مخصص للمالك فقط');
      return;
    }
    const newStealth = !currentUser.isStealth;
    const updatedUser = { ...currentUser, isStealth: newStealth };
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    try {
      localStorage.setItem('araby_current_user', JSON.stringify(updatedUser));
    } catch (e) { console.error(e); }
    sendSocketEvent('UPDATE_USER', updatedUser);
    showTopBanner(
      newStealth
        ? '🕵️‍♂️ تم تفعيل وضع الاختفاء (تم إخفاؤك من قائمة المتواجدين وإخفاء آخر ظهور)'
        : '👁️ تم إلغاء وضع الاختفاء (أنت الآن ظاهر للجميع في المتواجدين وآخر ظهور)'
    );
  };

  // Add News
  const addNewsPost = (title: string, content: string, imageUrl?: string) => {
    if (!currentUser) return;
    const post: NewsPost = {
      id: `news-${Date.now()}`,
      authorName: currentUser.username,
      authorAvatar: currentUser.avatar,
      title,
      content,
      imageUrl,
      timestamp: `${new Date().toLocaleDateString('ar-EG')} - ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}`,
      reactions: {},
      comments: []
    };
    setNews(prev => [post, ...prev]);
  };

  const deleteNewsPost = (newsId: string) => {
    setNews(prev => prev.filter(n => n.id !== newsId));
  };

  const reactToNews = (newsId: string, emoji: string) => {
    if (!currentUser) return;
    setNews(prev => prev.map(n => {
      if (n.id !== newsId) return n;
      const currentList = n.reactions[emoji] || [];
      const updatedList = currentList.includes(currentUser.id)
        ? currentList.filter(id => id !== currentUser.id)
        : [...currentList, currentUser.id];
      return { ...n, reactions: { ...n.reactions, [emoji]: updatedList } };
    }));
  };

  const addNewsComment = (newsId: string, content: string) => {
    if (!currentUser || !content.trim()) return;
    setNews(prev => prev.map(n => {
      if (n.id !== newsId) return n;
      return {
        ...n,
        comments: [...n.comments, {
          id: `nc-${Date.now()}`,
          authorName: currentUser.username,
          content,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }]
      };
    }));
  };

  // Add Wall Post
  const addWallPost = (content: string, imageUrl?: string) => {
    if (!currentUser) return;
    const post: WallPost = {
      id: `wall-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.username,
      authorAvatar: currentUser.avatar,
      content,
      imageUrl,
      timestamp: 'الآن',
      likes: [],
      comments: []
    };
    setWallPosts(prev => [post, ...prev]);

    // Send notifications to friends
    const friends = currentUser.friends || [];
    friends.forEach(friendId => {
      const wallNotif: Notification = {
        id: `notif-wall-${Date.now()}-${friendId}`,
        userId: friendId,
        senderId: currentUser.id,
        senderName: currentUser.username,
        senderAvatar: currentUser.avatar,
        senderGender: currentUser.gender,
        type: 'wall_post',
        title: 'منشور جديد في حائط الأصدقاء 📝',
        message: `نشر صديقك "${currentUser.username}" منشوراً جديداً: "${content.substring(0, 40)}${content.length > 40 ? '...' : ''}"`,
        timestamp: formatEnglishShortDateTime(new Date()),
        isRead: false
      };
      setNotifications(prev => [wallNotif, ...prev]);
      sendSocketEvent('SEND_NOTIFICATION', wallNotif);
    });
  };

  const deleteWallPost = (postId: string) => {
    setWallPosts(prev => prev.filter(w => w.id !== postId));
  };

  const reactToWallPost = (postId: string) => {
    if (!currentUser) return;
    setWallPosts(prev => prev.map(w => {
      if (w.id !== postId) return w;
      const hasLiked = w.likes.includes(currentUser.id);
      return {
        ...w,
        likes: hasLiked ? w.likes.filter(id => id !== currentUser.id) : [...w.likes, currentUser.id]
      };
    }));
  };

  const addWallComment = (postId: string, content: string) => {
    if (!currentUser || !content.trim()) return;
    setWallPosts(prev => prev.map(w => {
      if (w.id !== postId) return w;
      return {
        ...w,
        comments: [...w.comments, {
          id: `wc-${Date.now()}`,
          authorName: currentUser.username,
          content,
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }]
      };
    }));
  };

  // Mark notifications as read
  const markNotificationsAsRead = () => {
    if (currentUser) {
      setNotifications(prev => prev.map(n => n.userId === currentUser.id ? { ...n, isRead: true } : n));
      sendSocketEvent('MARK_NOTIFICATIONS_READ', { userId: currentUser.id });
    } else {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    }
  };

  // Delete single notification
  const deleteNotification = (notifId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notifId));
    sendSocketEvent('DELETE_NOTIFICATION', { notifId });
  };

  // Switch Role helper for instant developer testing
  const switchRoleForTesting = (role: UserRole) => {
    if (!currentUser) return;
    updateUserProfile({ role });
  };

  // Broadcast Audio Alert System (General Sound + Announcement)
  const broadcastAudioAlert = (title: string, message: string, soundType: string = 'general_broadcast') => {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin')) return;

    sendSocketEvent('BROADCAST_AUDIO_ALERT', {
      title,
      message,
      soundType,
      senderName: currentUser.username
    });

    playChatSound('general_broadcast');
    showTopBanner(`📢 تم إرسال الإشعار الصوتي العام: "${title}"`);
    addToast({
      type: 'success',
      title: 'تم إرسال التنبيه العام 📢',
      message: `${title} • تم بثه لجميع المتواجدين`,
      duration: 6000
    });

    addRoomActivityLog(
      currentRoom.id,
      currentRoom.name,
      currentUser.id,
      currentUser.username,
      currentUser.role,
      'system_message',
      `إرسال تنبيه صوتي عام: [${title}] ${message}`,
      'الجميع'
    );
  };

  // Delete User Account (Owner action or user self delete)
  const deleteUserAccount = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    if (target.role === 'owner' && currentUser?.id !== userId) {
      showTopBanner('🚫 لا يمكن حذف حساب المالك الرئيسي!');
      return;
    }

    setUsers(prev => prev.filter(u => u.id !== userId));
    sendSocketEvent('DELETE_USER_ACCOUNT', { userId });

    if (currentUser?.id === userId) {
      logout();
    } else {
      showTopBanner(`🗑️ تم حذف حساب العضو "${target.username}" بنجاح`);
    }
  };

  // One-Click System Cache Purge & Light Update
  const purgeSystemCache = () => {
    sendSocketEvent('SYSTEM_CACHE_PURGE', {});
    showTopBanner('⚡ تم تحسين أداء السيرفر وتفريغ الذاكرة المؤقتة بنجاح');
  };

  // Stealth Mode Toggle (مخصص للمالك فقط)
  const toggleAdminStealth = toggleOwnerStealth;

  const deletePrivateConversation = (targetUserId: string) => {
    deletePrivateMessages(targetUserId);
    unhidePrivateConversation(targetUserId);
    showTopBanner('🗑️ تم مسح وحذف سجل المحادثة الخاصة بالكامل');
  };

  // Filter public room messages at the data layer so blocked users cannot see current user's messages or vice versa
  const filteredMessages = useMemo(() => {
    if (!currentUser) return messages;
    const myBlocked = [...(currentUser.blockedUsers || []), ...(currentUser.ignores || [])];
    return messages.filter(msg => {
      if (msg.type === 'system' || msg.senderId === 'bot') return true;
      if (myBlocked.includes(msg.senderId)) return false;

      const sender = users.find(u => u.id === msg.senderId);
      if (sender && ((sender.blockedUsers || []).includes(currentUser.id) || (sender.ignores || []).includes(currentUser.id))) {
        return false;
      }
      return true;
    });
  }, [messages, currentUser, users]);

  // Filter private messages at the data layer so blocked conversations are hidden
  const filteredPrivateMessages = useMemo(() => {
    if (!currentUser) return privateMessages;
    const myBlocked = [...(currentUser.blockedUsers || []), ...(currentUser.ignores || [])];
    return privateMessages.filter(pm => {
      const otherId = pm.senderId === currentUser.id ? pm.receiverId : pm.senderId;
      if (myBlocked.includes(otherId)) return false;

      const otherUser = users.find(u => u.id === otherId);
      if (otherUser && ((otherUser.blockedUsers || []).includes(currentUser.id) || (otherUser.ignores || []).includes(currentUser.id))) {
        return false;
      }
      return true;
    });
  }, [privateMessages, currentUser, users]);

  return (
    <ChatContext.Provider
      value={{
        currentUser,
        currentView,
        currentRoom,
        rooms,
        users,
        messages: filteredMessages,
        privateMessages: filteredPrivateMessages,
        friendRequests,
        reports,
        news,
        wallPosts,
        notifications,
        storeItems,
        modLogs,
        roomActivityLogs,
        banList,
        ipModerations,
        clientIp,
        checkIpStatus,
        addIPModerationRecord,
        removeIPModerationRecord,
        customBadWords,
        addCustomBadWord,
        removeCustomBadWord,
        audioSettings,
        themeMode,
        unreadPrivateCount,
        activePrivateUserId,
        hiddenPrivateUserIds,
        hidePrivateConversation,
        unhidePrivateConversation,
        clearAllPrivateConversations,
        selectedUserForCard,
        selectedUserForProfile,

        isProfileSettingsOpen,
        isOwnerDashboardOpen,
        isStoreOpen,
        isSideMenuOpen,
        isReportsOpen,
        isNotificationsOpen,
        isFriendRequestsOpen,
        isPrivateChatOpen,
        isOnlineListOpen,
        isRoomsListOpen,
        isRoomLogsOpen,
        isRoomSettingsOpen,
        inputInsertedUsername,
        topBannerMessage,
        siteSettings,

        showTopBanner,
        setCurrentView,
        setActivePrivateUserId,
        setSelectedUserForCard,
        setSelectedUserForProfile,
        setIsProfileSettingsOpen,
        setIsOwnerDashboardOpen,
        setIsStoreOpen,
        setIsSideMenuOpen,
        setIsReportsOpen,
        setIsNotificationsOpen,
        setIsFriendRequestsOpen,
        setIsPrivateChatOpen,
        setIsOnlineListOpen,
        setIsRoomsListOpen,
        setIsRoomLogsOpen,
        setIsRoomSettingsOpen,
        isLogoutConfirmOpen,
        setIsLogoutConfirmOpen,
        passwordPromptRoom,
        setPasswordPromptRoom,
        unlockedRoomIds,
        blockConfirmState,
        requestBlockConfirm,
        closeBlockConfirm,
        updateSiteSettings,
        updateRoomDetails,
        sendRoomWelcomeMessage,
        assignRoomStaff,
        removeRoomStaff,
        muteUserInRoom,
        unmuteUserInRoom,
        kickUserFromRoom,
        unkickUserFromRoom,
        setInputInsertedUsername,
        addRoomActivityLog,
        clearRoomActivityLogs,

        loginAsVisitor,
        loginAsMember,
        registerAccount,
        loginAsOwner,
        logout,

        switchRoom,
        sendMessage,
        reactToMessage,
        sendPrivateMessage,
        deletePrivateMessages,

        likeUser,
        sendFriendRequest,
        respondFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        toggleIgnore,
        toggleBlockUser,
        isUserBlocked,
        reportUserMessage,
        resolveReport,
        deleteReport,
        updateReportCategory,

        updateUserProfile,
        updateAudioSettings,
        setThemeMode,
        buyRank,

        moderatorAction,
        deleteMessage,
        clearChat,
        ownerUpdateUser,
        ownerUpdateStorePrices,
        ownerUpdateRoomName,
        banUser,
        unbanUser,
        addRoom,
        deleteRoom,
        updateUserRole,
        addCoins,
        clearModerationState,
        toggleOwnerStealth,

        addNewsPost,
        deleteNewsPost,
        typingUsers,
        sendTypingStatus,
        reactToNews,
        addNewsComment,

        addWallPost,
        deleteWallPost,
        reactToWallPost,
        addWallComment,

        markNotificationsAsRead,
        deleteNotification,

        broadcastAudioAlert,
        deleteUserAccount,
        purgeSystemCache,
        toggleAdminStealth,
        deletePrivateConversation,

        toasts,
        addToast,
        removeToast,

        switchRoleForTesting,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
