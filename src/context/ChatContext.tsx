import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  User, UserRole, Gender, Room, Message, PrivateMessage,
  FriendRequest, Report, NewsPost, WallPost, Notification, StoreItem,
  ModLogEntry, OnlineStatus, PrivatePrivacySetting, ThemeMode,
  RoomActivityLog, RoomActivityType, SiteSettings, ToastNotification
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
import {
  toEnglishDigits,
  formatEnglishTime,
  formatEnglishDate,
  formatEnglishDateTime,
  formatEnglishShortDateTime,
  formatEnglishSecondsTime
} from '../utils/dateUtils';

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
  updateRoomDetails: (roomId: string, updates: { name?: string; description?: string; password?: string; isLocked?: boolean }) => void;
  muteUserInRoom: (roomId: string, userId: string) => void;
  unmuteUserInRoom: (roomId: string, userId: string) => void;
  kickUserFromRoom: (roomId: string, userId: string) => void;
  unkickUserFromRoom: (roomId: string, userId: string) => void;
  setInputInsertedUsername: (name: string | null) => void;
  addRoomActivityLog: (roomId: string, roomName: string, actorId: string, actorName: string, actorRole: UserRole, actionType: RoomActivityType, details: string, targetName?: string) => void;
  clearRoomActivityLogs: () => void;
  addCustomBadWord: (word: string) => void;
  removeCustomBadWord: (word: string) => void;

  loginAsVisitor: (username: string, age: number | string, gender: Gender) => void;
  loginAsMember: (username: string, password: string) => { success: boolean; error?: string };
  registerAccount: (username: string, password: string, email: string, age: number | string, gender: Gender) => { success: boolean; error?: string };
  loginAsOwner: () => User;
  logout: () => void;
  
  switchRoom: (roomId: string) => void;
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
  // Persistent users list
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('araby_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(INITIAL_USERS.map(u => [u.id, u]));
          parsed.forEach((u: User) => map.set(u.id, u));
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

  // Persistent currentUser state across reloads
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
    return INITIAL_USERS.find(u => u.role === 'owner') || INITIAL_USERS[1] || null;
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

  // Persistent currentView state across reloads
  const [currentView, setCurrentView] = useState<'landing' | 'rooms' | 'chat'>(() => {
    try {
      const savedUser = localStorage.getItem('araby_current_user');
      const savedView = localStorage.getItem('araby_current_view') as 'landing' | 'rooms' | 'chat' | null;
      if (savedUser && savedView && ['landing', 'rooms', 'chat'].includes(savedView)) {
        return savedView === 'landing' ? 'rooms' : savedView;
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
    setSiteSettings(prev => ({ ...prev, ...newSettings }));
  }, []);
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

  // Live Typing Indicators State
  const [typingUsers, setTypingUsers] = useState<Record<string, { username: string; roomId: string; isTyping: boolean }>>({});

  // WebSocket Client Connection Reference
  const socketRef = useRef<WebSocket | null>(null);

  const sendSocketEvent = useCallback((type: string, payload: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

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
                if (payload.messages && payload.messages.length > 0) {
                  setMessages(payload.messages);
                }
                if (payload.privateMessages) {
                  setPrivateMessages(payload.privateMessages);
                }
                if (payload.users && payload.users.length > 0) {
                  setUsers(prev => {
                    const userMap = new Map(prev.map(u => [u.id, u]));
                    payload.users.forEach((u: User) => userMap.set(u.id, u));
                    return Array.from(userMap.values());
                  });
                }
                if (payload.rooms && payload.rooms.length > 0) {
                  setRooms(payload.rooms);
                }
                break;
              }

              case "NEW_MESSAGE": {
                const newMsg: Message = payload;
                setMessages(prev => {
                  if (prev.some(m => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });

                // In-app Notification for Mention in Public Chat
                const curUserMsg = currentUserRef.current;
                if (
                  curUserMsg &&
                  newMsg?.senderId &&
                  newMsg.senderId !== curUserMsg.id &&
                  newMsg.text &&
                  curUserMsg.username
                ) {
                  const mentionKeyword = curUserMsg.username.trim();
                  if (mentionKeyword && (newMsg.text.includes(`@${mentionKeyword}`) || newMsg.text.toLowerCase().includes(mentionKeyword.toLowerCase()))) {
                    const mentionNotif: Notification = {
                      id: `notif-mention-${Date.now()}-${Math.random()}`,
                      userId: curUserMsg.id,
                      type: 'mention',
                      title: 'إشارة / ذكر اسم 📣',
                      message: `قام "${newMsg.senderName || 'مستخدم'}" بذكر اسمك في العامة: "${newMsg.text}"`,
                      senderId: newMsg.senderId,
                      senderName: newMsg.senderName,
                      senderAvatar: newMsg.senderAvatar,
                      timestamp: newMsg.timestamp || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }),
                      isRead: false
                    };
                    setNotifications(prev => [mentionNotif, ...prev]);
                    showTopBanner(`📣 قام "${newMsg.senderName || 'مستخدم'}" بذكر اسمك في العامة: ${newMsg.text.substring(0, 30)}`);
                    if (audioSettingsRef.current?.mentionSound !== false) {
                      playChatSound('mention');
                    }
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

                // In-app Notification for New Private Message
                const curUserPM = currentUserRef.current;
                if (curUserPM && newPMsg?.receiverId === curUserPM.id && newPMsg?.senderId !== curUserPM.id) {
                  const privateNotif: Notification = {
                    id: `notif-pm-${Date.now()}-${Math.random()}`,
                    userId: curUserPM.id,
                    type: 'private_message',
                    title: 'رسالة خاصة جديدة 📩',
                    message: `أرسل لك "${newPMsg.senderName || 'مستخدم'}" رسالة خاصة: "${newPMsg.text ? (newPMsg.text.length > 30 ? newPMsg.text.substring(0, 30) + '...' : newPMsg.text) : 'محتوى وسائط/صوت'}"`,
                    senderId: newPMsg.senderId,
                    senderName: newPMsg.senderName,
                    senderAvatar: newPMsg.senderAvatar,
                    timestamp: newPMsg.timestamp || new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    isRead: false
                  };
                  setNotifications(prev => [privateNotif, ...prev]);
                  showTopBanner(`📩 رسالة خاصة جديدة من "${newPMsg.senderName || 'مستخدم'}": ${newPMsg.text ? (newPMsg.text.length > 25 ? newPMsg.text.substring(0, 25) + '...' : newPMsg.text) : 'وسائط / صوت'}`);
                  addToast({
                    type: 'private_message',
                    title: `رسالة خاصة من ${newPMsg.senderName || 'مستخدم'} 📩`,
                    message: newPMsg.text ? (newPMsg.text.length > 40 ? newPMsg.text.substring(0, 40) + '...' : newPMsg.text) : 'محتوى وسائط / صوت',
                    avatar: newPMsg.senderAvatar,
                    senderName: newPMsg.senderName,
                    senderId: newPMsg.senderId,
                  });
                  if (audioSettingsRef.current?.privateSound !== false) {
                    playChatSound('private');
                  }
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
            message: 'تم فك الكتم تلقائياً لانتهاء المدة',
            timestamp: `${timeString} - ${dateString}`,
            isRead: false
          };
          setNotifications(prev => [notif, ...prev]);
          showTopBanner('🟢 تم فك الكتم تلقائياً لانتهاء المدة المحددة');
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

  // Compute unread private messages
  const unreadPrivateCount = currentUser
    ? privateMessages.filter(pm => pm.receiverId === currentUser.id && !pm.isRead).length
    : 0;

  // Helper to emit user room join message "هذا المستخدم انضم للغرفة [ رتبة ... ]"
  const emitUserRoomJoinMessage = (user: User, roomId: string) => {
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

  // Login as Visitor
  const loginAsVisitor = (username: string, age: number | string, gender: Gender) => {
    const cleanUsername = username.trim() || `زائر_${Math.floor(100 + Math.random() * 900)}`;
    const newVisitor: User = {
      id: `visitor-${Date.now()}`,
      username: cleanUsername,
      role: 'visitor',
      gender,
      age: age || 'عدم الإظهار',
      avatar: '',
      coins: 100,
      likes: 0,
      country: 'اليمن',
      countryFlag: '🇾🇪',
      currentRoomId: currentRoom.id,
      joinedDate: new Date().toLocaleDateString('ar-EG'),
      lastSeen: 'الآن',
      privatePrivacy: 'everyone',
      onlineStatus: 'online',
      ignores: [],
      blockedUsers: [],
    };

    setUsers(prev => [newVisitor, ...prev]);
    setCurrentUser(newVisitor);
    setCurrentView('rooms');
    emitUserRoomJoinMessage(newVisitor, currentRoom.id);
    sendSocketEvent('JOIN_USER', { user: newVisitor });

    // Fetch IP and update country/flag automatically
    updateGeoLocationForUser(newVisitor.id);
  };

  // Login as Member
  const loginAsMember = (username: string, password: string) => {
    const user = users.find(u => u.username === username.trim() && u.password === password);
    if (!user) {
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }
    if (user.isBanned) {
      return { success: false, error: 'عذراً، هذا الحساب محظور من دخول الشات' };
    }
    setCurrentUser(user);
    setCurrentView('rooms');
    sendSocketEvent('JOIN_USER', { user });

    // Fetch IP and update country/flag automatically
    updateGeoLocationForUser(user.id);
    return { success: true };
  };

  // Register new account
  const registerAccount = (username: string, password: string, email: string, age: number | string, gender: Gender) => {
    const cleanUsername = username.trim();
    if (!cleanUsername) return { success: false, error: 'الرجاء كتابة اسم المستخدم' };
    if (!password) return { success: false, error: 'الرجاء كتابة كلمة المرور' };

    const exists = users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (exists) {
      return { success: false, error: 'اسم المستخدم مستخدم بالفعل، اختر اسماً آخر' };
    }

    const newMember: User = {
      id: `member-${Date.now()}`,
      username: cleanUsername,
      password,
      email: email || `${cleanUsername}@chat.ye`,
      role: 'member',
      gender,
      age: age || 'عدم الإظهار',
      avatar: '',
      statusMessage: '🧑💼 عضو جديد في شات اليمن المطور',
      bio: 'أهلاً بك في ملفي الشخصي',
      coins: 500,
      likes: 0,
      country: 'اليمن',
      countryFlag: '🇾🇪',
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

  // Login as Owner (هيبة ملك)
  const loginAsOwner = (): User => {
    let owner = users.find(u => u.role === 'owner' || u.id === 'user-owner' || u.username === 'هيبة ملك');
    if (!owner) {
      owner = {
        id: 'user-owner',
        username: 'هيبة ملك',
        password: '123',
        email: 'owner@chat.ye',
        role: 'owner',
        gender: 'male',
        age: 28,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
        wallCover: 'https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=1000&q=80',
        statusMessage: '👑 مالك الموقع | مرحباً بالجميع في شات اليمن المطور',
        bio: 'صانع المحتوى ومؤسس منصة شات اليمن المطور. يسعدني وجودكم جميعاً.',
        coins: 999999,
        likes: 999,
        likedBy: ['user-admin', 'user-vip', 'user-mod'],
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
        locationMap: 'صنعاء، اليمن (15.3694° N, 44.1910° E)',
        linkedAccounts: ['مالك_الخير', 'سلطان_اليمن'],
        friends: ['user-admin', 'user-mod', 'user-vip', 'user-member'],
        ignores: [],
      };
      setUsers(prev => [owner!, ...prev]);
    }
    setCurrentUser(owner);
    setCurrentView('rooms');
    sendSocketEvent('JOIN_USER', { user: owner });
    showTopBanner('👑 مرحباً بك! تم تسجيل الدخول كمالك الشات والموقع (هيبة ملك)');

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
  const sendRoomWelcomeMessage = (targetRoom: Room, username?: string) => {
    // Find online staff
    const onlineMods = users.filter(u =>
      ['moderator', 'management', 'admin', 'owner'].includes(u.role) &&
      !u.isBanned &&
      u.onlineStatus !== 'offline'
    );

    const modsText = onlineMods.length > 0
      ? onlineMods.map(m => `${getRankEmoji(m.role)} ${m.username}`).join(' ، ')
      : 'لا يوجد مشرفون متواجدون حالياً (الروبوت الآلي لحمايتكم 🤖)';

    const userDisplayName = username || currentUser?.username || 'زائرنا العزيز';

    const welcomeText = `👋 أهلاً وسهلاً بك يا [ ${userDisplayName} ] في غرفة ${targetRoom.name} ${targetRoom.flag}!

📜 **قوانين وتعليمات الغرفة**:
• الاحترام المتبادل بين جميع الأعضاء والزوار وعدم الإساءة.
• يُمنع استخدام الألفاظ الجارحة أو السب والشتم.
• يُمنع نشر الروابط الخارجية، الإعلانات، والتسويق غير المصرح.
• يُمنع التكرار المزعج للرسائل (Spam) أو الإزعاج.

🛡️ **المشرفون والمتواجدون من الإدارة حالياً**:
${modsText}`;

    const welcomeMsg: Message = {
      id: `sys-welcome-${targetRoom.id}-${Date.now()}`,
      roomId: targetRoom.id,
      senderId: 'user-system',
      senderName: 'System',
      senderRole: 'management',
      senderGender: 'other',
      text: welcomeText,
      type: 'system',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: new Date().toLocaleDateString('ar-EG'),
    };

    const publicAnnouncementText = `🎉 انضم المستخدم [ ${userDisplayName} ] إلى غرفة ${targetRoom.name} ${targetRoom.flag} الآن! نرحب بك أجمل ترحيب ونتمنى لك وقتاً ممتعاً 🌹✨`;

    const publicAnnouncementMsg: Message = {
      id: `sys-announcement-${targetRoom.id}-${Date.now() + 1}`,
      roomId: targetRoom.id,
      senderId: 'user-system',
      senderName: 'System',
      senderRole: 'management',
      senderGender: 'other',
      text: publicAnnouncementText,
      type: 'system',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false }),
      date: new Date().toLocaleDateString('ar-EG'),
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
      `تم إرسال قوانين وتوجيهات الغرفة للمستخدم (${userDisplayName})`
    );
  };

  // Trigger welcome message when entering chat view if room not yet visited
  useEffect(() => {
    if (currentView === 'chat' && currentRoom && !visitedRoomIds.includes(currentRoom.id)) {
      setVisitedRoomIds(prev => [...prev, currentRoom.id]);
      sendRoomWelcomeMessage(currentRoom, currentUser?.username);
    }
  }, [currentView, currentRoom.id]);

  // Switch active room
  const switchRoom = (roomId: string) => {
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
      showTopBanner('لا تستطيع دخول الغرفة');
      alert('لا تستطيع دخول الغرفة');
      return;
    }

    // Check room password/lock
    if (room.password && room.password.trim() !== '' && !isMgmt) {
      const passAttempt = window.prompt(`🔐 الغرفة "${room.name}" مقفلة بكلمة سر.\nالرجاء إدخال الرمز لدخول الغرفة:`);
      if (passAttempt !== room.password) {
        alert('❌ رمز الدخول غير صحيح، تعذر دخول الغرفة.');
        return;
      }
    }

    setCurrentRoom(room);
    if (currentUser) {
      setCurrentUser(prev => prev ? { ...prev, currentRoomId: room.id } : null);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, currentRoomId: room.id } : u));
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

    if (!visitedRoomIds.includes(room.id)) {
      setVisitedRoomIds(prev => [...prev, room.id]);
      sendRoomWelcomeMessage(room, currentUser?.username);
    }

    setCurrentView('chat');
  };

  // Auto Bot check for offensive words & profanity filtering
  const processProfanityAndFilter = (sender: User, rawText: string): { isMuted: boolean; cleanText: string } => {
    if (!rawText) return { isMuted: false, cleanText: rawText };

    const filterResult = filterProfanity(rawText, customBadWords);

    if (filterResult.hasProfanity) {
      // Auto mute for 1 minute (60 seconds) by System
      const muteExpiry = new Date(Date.now() + 1 * 60 * 1000).toISOString();
      setUsers(prev => prev.map(u => u.id === sender.id ? { ...u, isMuted: true, muteUntil: muteExpiry } : u));
      if (currentUser?.id === sender.id) {
        setCurrentUser(prev => prev ? { ...prev, isMuted: true, muteUntil: muteExpiry } : null);
      }

      // Add System announcement message
      const systemAvatar = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80';
      const nowObj = new Date();
      const timeString = nowObj.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', hour12: false });
      const dateString = nowObj.toLocaleDateString('ar-EG');

      const systemMsg: Message = {
        id: `sys-mute-${Date.now()}`,
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

      // Record in mod logs (سجل الكتم والطرد) with full original message
      const sysLog: ModLogEntry = {
        id: `sys-log-${Date.now()}`,
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

      // Add Notification to user for Notifications Modal (زر الايك)
      const profanityNotif: Notification = {
        id: `notif-profanity-${Date.now()}`,
        userId: sender.id,
        type: 'mute',
        title: 'System',
        message: 'لقد تم كتمك بسبب الكلمات المسيئة',
        timestamp: `${timeString} - ${dateString}`,
        isRead: false
      };
      setNotifications(prev => [profanityNotif, ...prev]);

      showTopBanner(`🚫 تم كتمك لمدة دقيقة واحدة من قِبل System بسبب استخدام كلمات مسيئة`);

      return { isMuted: true, cleanText: filterResult.cleanText };
    }

    return { isMuted: false, cleanText: filterResult.cleanText };
  };

  // Ref to track user's last message text for repeat spam detection
  const lastUserMsgTextRef = useRef<{ text: string; count: number }>({ text: '', count: 0 });

  // Configurable Flood & Anti-Spam Protection Builder
  const checkFloodAndMute = (sender: User, msgText?: string): boolean => {
    // Owners and Admins are immune to flood checks
    if (sender.role === 'owner' || sender.role === 'admin') return false;

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
      showTopBanner(`🚫 لقد تم كتمك لمدة ${durationMinutes} دقيقة بسبب نظام مكافحة الفيضانات`);
    } else if (action === 'kick') {
      setUsers(prev => prev.map(u => u.id === sender.id ? { ...u, isKicked: true, kickUntil: expiryStr } : u));
      if (currentUser?.id === sender.id) {
        setCurrentUser(prev => prev ? { ...prev, isKicked: true, kickUntil: expiryStr } : null);
      }
      showTopBanner(`🚫 لقد تم طردك مؤقتاً لمدة ${durationMinutes} دقيقة بسبب نظام مكافحة الفيضانات`);
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
      showTopBanner('🚫 لقد تم حظر حسابك نهائياً من قبل نظام مكافحة الفيضانات والسبام');
    }

    const floodNotif: Notification = {
      id: `notif-flood-${now}`,
      userId: sender.id,
      type: 'mute',
      title: 'System',
      message: `تم تطبيق إجراء (${action}) بسبب نظام مكافحة الفيضانات: ${reason}`,
      timestamp: `${timeString} - ${dateString}`,
      isRead: false
    };
    setNotifications(prev => [floodNotif, ...prev]);

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
    const coinReward = currentUser.role === 'visitor' ? 2 : 5;
    setCurrentUser(prev => prev ? { ...prev, coins: prev.coins + coinReward } : null);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, coins: u.coins + coinReward } : u));

    // Sound effect
    if (audioSettings.publicSound) {
      playChatSound('public');
    }
  };

  // Check if a user is blocked by current user or if current user is blocked by target user
  const isUserBlocked = (targetUserId: string): boolean => {
    if (!currentUser) return false;
    const isBlockedByMe = (currentUser.blockedUsers || []).includes(targetUserId) || (currentUser.ignores || []).includes(targetUserId);
    const targetUser = users.find(u => u.id === targetUserId);
    const amIBlockedByTarget = (targetUser?.blockedUsers || []).includes(currentUser.id) || (targetUser?.ignores || []).includes(currentUser.id);
    return isBlockedByMe || amIBlockedByTarget;
  };

  // Toggle Block User
  const toggleBlockUser = (targetUserId: string) => {
    if (!currentUser) return;
    if (targetUserId === currentUser.id) {
      alert('لا يمكنك حظر نفسك');
      return;
    }

    const targetUser = users.find(u => u.id === targetUserId);
    if (targetUser && !canBeIgnored(targetUser)) {
      alert('لا يمكنك تجاهل المالك أو الأدمن أو الإدارة أو المشرفين 🛡️');
      return;
    }

    const isCurrentlyBlocked = (currentUser.blockedUsers || []).includes(targetUserId) || (currentUser.ignores || []).includes(targetUserId);

    if (isCurrentlyBlocked) {
      // Unblock user
      const updatedBlocked = (currentUser.blockedUsers || []).filter(id => id !== targetUserId);
      const updatedIgnores = (currentUser.ignores || []).filter(id => id !== targetUserId);

      setCurrentUser(prev => prev ? { ...prev, blockedUsers: updatedBlocked, ignores: updatedIgnores } : null);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, blockedUsers: updatedBlocked, ignores: updatedIgnores } : u));
      alert('تم إلغاء حظر المستخدم 🔓');
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

      alert('تم حظر المستخدم بنجاح 🚫. لن تظهر لك أو له أي رسائل أو تفاعلات متبادلة.');
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
        const reactions = m.reactions || [];
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
      id: `notif-${Date.now()}`,
      userId: targetUserId,
      type: 'like',
      title: 'إعجاب جديد ❤️',
      message: `قام "${currentUser.username}" بالإعجاب بملفك الشخصي`,
      timestamp: formatEnglishShortDateTime(new Date()),
      isRead: false
    };
    setNotifications(prev => [newNotif, ...prev]);

    if (audioSettings.notificationSound) {
      playChatSound('notification');
    }
  };

  // Send Friend Request
  const sendFriendRequest = (targetUserId: string) => {
    if (!currentUser) return;
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
      id: `fr-${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.username,
      senderAvatar: currentUser.avatar,
      receiverId: targetUserId,
      timestamp: formatEnglishTime(new Date())
    };

    setFriendRequests(prev => [...prev, req]);

    // Create Notification for receiver
    const notif: Notification = {
      id: `notif-${Date.now()}`,
      userId: targetUserId,
      type: 'friend',
      title: 'طلب صداقة جديد ➕👤',
      message: `أرسل لك "${currentUser.username}" طلب صداقة جديد.`,
      timestamp: formatEnglishShortDateTime(new Date()),
      isRead: false
    };
    setNotifications(prev => [notif, ...prev]);

    if (audioSettings.friendRequestSound !== false) {
      playChatSound('friend_request');
    }

    showTopBanner(`✉️ تم إرسال طلب الصداقة لـ "${targetUser?.username || 'العضو'}" بنجاح`);
  };

  // Respond Friend Request
  const respondFriendRequest = (requestId: string, accept: boolean) => {
    const req = friendRequests.find(r => r.id === requestId);
    if (!req || !currentUser) return;

    if (accept) {
      // Add friends bidirectionally
      setUsers(prev => prev.map(u => {
        if (u.id === currentUser.id) {
          const currentFriends = u.friends || [];
          return { ...u, friends: currentFriends.includes(req.senderId) ? currentFriends : [...currentFriends, req.senderId] };
        }
        if (u.id === req.senderId) {
          const currentFriends = u.friends || [];
          return { ...u, friends: currentFriends.includes(currentUser.id) ? currentFriends : [...currentFriends, currentUser.id] };
        }
        return u;
      }));
      setCurrentUser(prev => {
        if (!prev) return null;
        const currentFriends = prev.friends || [];
        return { ...prev, friends: currentFriends.includes(req.senderId) ? currentFriends : [...currentFriends, req.senderId] };
      });

      // Add Notification
      const notif: Notification = {
        id: `notif-${Date.now()}`,
        userId: req.senderId,
        type: 'friend_accept',
        title: 'قبول طلب صداقة 🤝',
        message: `قبل "${currentUser.username}" طلب الصداقة الخاص بك.`,
        timestamp: formatEnglishShortDateTime(new Date()),
        isRead: false
      };
      setNotifications(prev => [notif, ...prev]);
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

    const updatedUser = { ...currentUser, ...updates };

    if (updates.username && updates.username !== currentUser.username) {
      const nowObj = new Date();
      const timeString = formatEnglishTime(nowObj);
      const dateString = formatEnglishDate(nowObj);
      const timeStampFormatted = formatEnglishDateTime(nowObj);

      const nameNotif: Notification = {
        id: `notif-name-${Date.now()}`,
        userId: currentUser.id,
        type: 'name_change',
        title: 'System',
        message: `تم تغير اسمك إلى: "${updates.username}"`,
        timestamp: timeStampFormatted,
        isRead: false
      };
      setNotifications(prev => [nameNotif, ...prev]);

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
      localStorage.setItem('araby_chat_user', JSON.stringify(updatedUser));
    } catch (e) {
      console.error('Failed to save user in localStorage:', e);
    }

    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedUser : u));
    sendSocketEvent('UPDATE_USER', updatedUser);
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

    return { success: true, message: `تهانينا! تم الشراء بنجاح وترقيتك إلى رتبة ${role === 'vip' ? 'مميز 💎' : 'مشرف 🛡️'}` };
  };

  // Moderator / Admin Actions
  const moderatorAction = (
    targetUserId: string,
    actionType: 'mute' | 'kick' | 'unmute' | 'unkick' | 'ban' | 'edit_name' | 'delete_account',
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

    if (actionType === 'mute') {
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isMuted: true, muteUntil: expiryStr } : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser(prev => prev ? { ...prev, isMuted: true, muteUntil: expiryStr } : null);
      }
    } else if (actionType === 'unmute') {
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isMuted: false, muteUntil: undefined } : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser(prev => prev ? { ...prev, isMuted: false, muteUntil: undefined } : null);
      }
    } else if (actionType === 'kick') {
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isKicked: true, kickUntil: expiryStr } : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser(prev => prev ? { ...prev, isKicked: true, kickUntil: expiryStr } : null);
      }
    } else if (actionType === 'unkick') {
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isKicked: false, kickUntil: undefined } : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser(prev => prev ? { ...prev, isKicked: false, kickUntil: undefined } : null);
      }
    } else if (actionType === 'ban') {
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, isBanned: true } : u));
      setBanList(prev => [...prev, targetUserId]);
    } else if (actionType === 'edit_name' && newName) {
      setUsers(prev => prev.map(u => u.id === targetUserId ? { ...u, username: newName } : u));
      if (currentUser.id === targetUserId) {
        setCurrentUser(prev => prev ? { ...prev, username: newName } : null);
      }
    } else if (actionType === 'delete_account') {
      setUsers(prev => prev.filter(u => u.id !== targetUserId));
    }

    const nowObj = new Date();
    const timeString = formatEnglishTime(nowObj);
    const dateString = formatEnglishDate(nowObj);
    const timeStampFormatted = formatEnglishDateTime(nowObj);

    if (actionType === 'edit_name' && newName) {
      const nameNotif: Notification = {
        id: `notif-mod-name-${Date.now()}`,
        userId: targetUserId,
        type: 'name_change',
        title: 'System',
        message: `تم تغير اسمك إلى: "${newName}"`,
        timestamp: timeStampFormatted,
        isRead: false
      };
      setNotifications(prev => [nameNotif, ...prev]);
    } else if (actionType === 'mute') {
      const muteNotif: Notification = {
        id: `notif-mod-mute-${Date.now()}`,
        userId: targetUserId,
        type: 'mute',
        title: 'System',
        message: `لقد تم كتمك لمدة ${durationMinutes} دقيقة. السبب: ${reason}`,
        timestamp: timeStampFormatted,
        isRead: false
      };
      setNotifications(prev => [muteNotif, ...prev]);
    } else if (actionType === 'unmute') {
      const unmuteNotif: Notification = {
        id: `notif-mod-unmute-${Date.now()}`,
        userId: targetUserId,
        type: 'system',
        title: 'System',
        message: 'تم فك الكتم',
        timestamp: timeStampFormatted,
        isRead: false
      };
      setNotifications(prev => [unmuteNotif, ...prev]);
    } else if (actionType === 'kick') {
      const kickNotif: Notification = {
        id: `notif-mod-kick-${Date.now()}`,
        userId: targetUserId,
        type: 'kick',
        title: 'System',
        message: `لقد تم طردك من الدردشة لمدة ${durationMinutes} دقيقة. السبب: ${reason}`,
        timestamp: timeStampFormatted,
        isRead: false
      };
      setNotifications(prev => [kickNotif, ...prev]);
    } else if (actionType === 'unkick') {
      const unkickNotif: Notification = {
        id: `notif-mod-unkick-${Date.now()}`,
        userId: targetUserId,
        type: 'system',
        title: 'System',
        message: 'انتهت مدة الطرد المؤقت ويمكنك الآن استخدام الدردشة',
        timestamp: timeStampFormatted,
        isRead: false
      };
      setNotifications(prev => [unkickNotif, ...prev]);
    } else if (actionType === 'ban') {
      const banNotif: Notification = {
        id: `notif-mod-ban-${Date.now()}`,
        userId: targetUserId,
        type: 'ban',
        title: 'System',
        message: `لقد تم حظرك من قبل المالك. السبب: ${reason || 'مخالفة القوانين العامة'}`,
        timestamp: timeStampFormatted,
        isRead: false
      };
      setNotifications(prev => [banNotif, ...prev]);
    }

    // Add log
    const log: ModLogEntry = {
      id: `log-${Date.now()}`,
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

    // Format announcement message from System
    const actionVerbMap: Record<string, string> = {
      mute: 'كتم',
      kick: 'طرد',
      ban: 'حظر'
    };

    const systemAvatar = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80';

    let sysMsgText = `📢 إجراء إداري: قام "${currentUser.username}" بتطبيق [${actionType}] على "${targetUser.username}". السبب: ${reason}`;
    if (actionType === 'edit_name' && newName) {
      sysMsgText = `تم تغيير اسم العضو: ${newName} | arabsyemen.com`;
    } else if (actionType in actionVerbMap) {
      const verb = actionVerbMap[actionType];
      sysMsgText = `${targetUser.username}\narabsyemen.com تم ${verb}`;
    }

    // Send announcement message in room
    const sysMsg: Message = {
      id: `sys-${Date.now()}`,
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
  };

  const unbanUser = (userId: string) => {
    setBanList(prev => prev.filter(id => id !== userId));
    showTopBanner(`🔓 تم رفع الحظر عن العضو (${userId}) بنجاح`);
  };

  // Room Management Actions
  const updateRoomDetails = (roomId: string, updates: { name?: string; description?: string; password?: string; isLocked?: boolean }) => {
    setRooms(prev => {
      const updatedRooms = prev.map(r => {
        if (r.id === roomId) {
          const updated = {
            ...r,
            ...(updates.name !== undefined ? { name: updates.name } : {}),
            ...(updates.description !== undefined ? { description: updates.description } : {}),
            ...(updates.password !== undefined ? { password: updates.password } : {}),
            ...(updates.isLocked !== undefined ? { isLocked: updates.isLocked } : {})
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
      type: 'role_change',
      title: 'System',
      message: `تم تغيير رتبتك إلى: [ ${roleTitle} ]`,
      timestamp: formatEnglishDateTime(new Date()),
      isRead: false
    };
    setNotifications(prev => [roleNotif, ...prev]);
  };

  // Add coins to user
  const addCoins = (userId: string, amount: number) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, coins: (u.coins || 0) + amount } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, coins: (prev.coins || 0) + amount } : null);
    }
  };

  // Clear moderation state
  const clearModerationState = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isMuted: false, muteUntil: undefined, isKicked: false, kickUntil: undefined } : u));
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, isMuted: false, muteUntil: undefined, isKicked: false, kickUntil: undefined } : null);
    }
  };

  // Toggle Owner Stealth Mode
  const toggleOwnerStealth = () => {
    if (!currentUser || currentUser.role !== 'owner') return;
    const newStealth = !currentUser.isStealth;
    setCurrentUser(prev => prev ? { ...prev, isStealth: newStealth } : null);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isStealth: newStealth } : u));
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
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
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

  // Admin & Owner Stealth Mode Toggle
  const toggleAdminStealth = () => {
    if (!currentUser || (currentUser.role !== 'owner' && currentUser.role !== 'admin' && currentUser.role !== 'management')) return;
    const newStealth = !currentUser.isStealth;
    setCurrentUser(prev => prev ? { ...prev, isStealth: newStealth } : null);
    setUsers(prev => prev.map(u => u.id === currentUser.id ? { ...u, isStealth: newStealth } : u));
    sendSocketEvent('UPDATE_USER', { ...currentUser, isStealth: newStealth });
    showTopBanner(newStealth ? '🕵️‍♂️ تم تفعيل وضع الاختفاء (أنت مخفي الآن عن قائمة المتصلين)' : '👁️ تم إلغاء وضع الاختفاء (أنت ظاهر الآن للجميع)');
  };

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
        updateSiteSettings,
        updateRoomDetails,
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
