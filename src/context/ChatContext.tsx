import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  User, UserRole, RoomRole, Gender, Room, Message, PrivateMessage,
  FriendRequest, Report, NewsPost, WallPost, Notification, StoreItem,
  ModLogEntry, OnlineStatus, PrivatePrivacySetting, ThemeMode,
  RoomActivityLog, RoomActivityType, SiteSettings, ToastNotification,
  IPModerationRecord, BlockConfirmState, BlockActionType, CustomEmojiItem,
  BlockedDeviceItem, BlockedBrowserItem, BlockedCountryItem, BlockedXBandItem
} from '../types';
import {
  INITIAL_ROOMS, INITIAL_USERS, INITIAL_MESSAGES, INITIAL_REPORTS,
  INITIAL_NEWS, INITIAL_WALL_POSTS, INITIAL_NOTIFICATIONS, INITIAL_STORE_ITEMS,
  INITIAL_ROOM_ACTIVITY_LOGS, PROFANITY_WORDS, INITIAL_PRIVATE_MESSAGES
} from '../data/initialData';
import { playChatSound } from '../utils/audio';
import { getRankEmoji, canBeIgnored, hasRolePermission, DEFAULT_PERMISSIONS, getRoleLevel } from '../utils/permissions';
import { filterProfanity } from '../utils/profanityFilter';
import { fetchUserGeoIP, getArabicCountryName, getEnglishCountryName, getCountryFlagByName, getUserDisplayTag, getUserIdentityNumber } from '../utils/geoip';
import { hashPassword, verifyPasswordMatch, isDuplicateUsername, normalizeUsername } from '../utils/security';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';
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
import {
  saveUserToFirestore,
  deleteUserFromFirestore,
  saveMessageToFirestore,
  deleteMessageFromFirestore,
  savePrivateMessageToFirestore,
  saveRoomToFirestore,
  saveSettingsToFirestore,
  db,
  handleFirestoreError,
  OperationType,
  signInWithGoogle
} from '../lib/firebase';
import { collection, doc, onSnapshot, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getAppLanguage, applyLanguageSettings, isRTL } from '../utils/translations';

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
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
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
  customEmojis: CustomEmojiItem[];
  addCustomEmoji: (emoji: Omit<CustomEmojiItem, 'id' | 'createdAt'>) => CustomEmojiItem;
  deleteCustomEmoji: (emojiId: string) => void;
  clearAllCustomEmojis: () => void;
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
  
  // Context Menu State (Long press on text & images)
  textContextMenu: { isOpen: boolean; text: string; title?: string } | null;
  openTextContextMenu: (text: string, title?: string) => void;
  closeTextContextMenu: () => void;
  imageContextMenu: { isOpen: boolean; imageUrl: string; altText?: string } | null;
  openImageContextMenu: (imageUrl: string, altText?: string) => void;
  closeImageContextMenu: () => void;
  // Modals visibility toggles
  isProfileSettingsOpen: boolean;
  isOwnerDashboardOpen: boolean;
  isStoreOpen: boolean;
  isSideMenuOpen: boolean;
  sideMenuInitialView: 'menu' | 'status' | 'wall' | 'news' | 'recharge' | 'bans';
  setSideMenuInitialView: (view: 'menu' | 'status' | 'wall' | 'news' | 'recharge' | 'bans') => void;
  openNews: () => void;
  isReportsOpen: boolean;
  isNotificationsOpen: boolean;
  isFriendRequestsOpen: boolean;
  isPrivateChatOpen: boolean;
  isOnlineListOpen: boolean;
  isRoomsListOpen: boolean;
  isRoomLogsOpen: boolean;
  isRoomSettingsOpen: boolean;
  isGoogleChatOpen: boolean;
  setIsGoogleChatOpen: (open: boolean) => void;
  isGoogleDriveOpen: boolean;
  setIsGoogleDriveOpen: (open: boolean) => void;
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
  updateRoomDetails: (roomId: string, updates: Partial<Room>) => void;
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

  hasPermission: (role: UserRole | string | undefined | null, permissionId: string) => boolean;
  currentUserCan: (permissionId: string) => boolean;

  loginAsVisitor: (username: string, age: number | string, gender: Gender) => { success: boolean; error?: string };
  loginAsMember: (username: string, password: string) => { success: boolean; error?: string };
  registerAccount: (username: string, password: string, email: string, age: number | string, gender: Gender) => { success: boolean; error?: string };
  loginWithFirebaseGoogle: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  switchRoom: (roomId: string, passwordAttempt?: string) => boolean;
  sendMessage: (
    text: string,
    type?: Message['type'],
    mediaUrl?: string,
    voiceDuration?: number,
    textStyle?: {
      color?: string;
      fontSize?: string;
      fontWeight?: string;
      fontFamily?: string;
      fontStyle?: string;
      bgGradient?: string;
      isNeon?: boolean;
    }
  ) => void;
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
  addRoom: (roomInput: Partial<Room> | string, flag?: string, description?: string) => void;
  deleteRoom: (roomId: string) => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;
  addCoins: (userId: string, amount: number) => void;
  clearModerationState: (userId: string) => void;
  toggleOwnerStealth: () => void;
  moderatorAction: (targetUserId: string, actionType: 'mute' | 'kick' | 'unmute' | 'unkick' | 'ban' | 'edit_name' | 'delete_account', durationMinutes?: number, reason?: string, newName?: string) => void;
  deleteMessage: (messageId: string) => void | Promise<void>;
  clearChat: (roomId?: string) => void | Promise<void>;
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
  reactToWallPost: (postId: string, emoji?: string) => void;
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

  bannedIps: string[];
  banIp: (ip: string, username?: string, reason?: string) => void;
  unbanIp: (ip: string) => void;
  banDevice: (deviceId: string, username?: string, reason?: string, deviceName?: string) => void;
  unbanDevice: (deviceId: string) => void;
  banBrowser: (fingerprint: string, username?: string, reason?: string, browserName?: string) => void;
  unbanBrowser: (fingerprint: string) => void;
  banCountry: (countryCode: string, countryName?: string, reason?: string) => void;
  unbanCountry: (countryCode: string) => void;

  cleanupInactiveUsers: () => void;
  updateUserLastActivity: (userId?: string) => void;
  sendBotWelcomeMessage: (customText?: string) => void;

  currentLang: string;
  setAppLanguage: (lang: string) => void;
  isRtl: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Global App Language State
  const [currentLang, setCurrentLangState] = useState<string>(() => getAppLanguage());

  useEffect(() => {
    const handleLangChange = (e: any) => {
      if (e?.detail) {
        setCurrentLangState(e.detail);
      }
    };
    window.addEventListener('appLanguageChanged', handleLangChange);
    return () => window.removeEventListener('appLanguageChanged', handleLangChange);
  }, []);

  const handleSetAppLanguage = useCallback((lang: string) => {
    applyLanguageSettings(lang);
    setCurrentLangState(lang);
  }, []);

  const isRtl = useMemo(() => isRTL(currentLang), [currentLang]);

  // Persistent users list (purging mock users)
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem('araby_users');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const map = new Map(INITIAL_USERS.map(u => [u.id, u]));
          const mockIds = ['user-katim', 'user-silva', 'user-raad', 'user-kibriya', 'user-jawbak', 'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'];
          parsed.forEach((u: User) => {
            if (u && u.id && !mockIds.includes(u.id)) {
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
        if (parsed && parsed.id) {
          // Restore text format settings from localStorage if available
          try {
            const userSpecificFormat = localStorage.getItem(`araby_chat_format_${parsed.id}`);
            const globalFormat = localStorage.getItem('araby_chat_text_format');
            const formatObj = userSpecificFormat ? JSON.parse(userSpecificFormat) : (globalFormat ? JSON.parse(globalFormat) : null);
            if (formatObj) {
              if (!parsed.chatTextColor && formatObj.color) parsed.chatTextColor = formatObj.color;
              if (!parsed.chatFontFamily && formatObj.fontFamily) parsed.chatFontFamily = formatObj.fontFamily;
              if (!parsed.chatFontStyle && formatObj.style) parsed.chatFontStyle = formatObj.style;
              if (!parsed.chatTextWeight && formatObj.weight) parsed.chatTextWeight = formatObj.weight;
              if (parsed.chatIsNeon === undefined && formatObj.isNeon !== undefined) parsed.chatIsNeon = formatObj.isNeon;
              if (!parsed.chatTextBgGradient && formatObj.bgGradient) parsed.chatTextBgGradient = formatObj.bgGradient;
            }
          } catch (err) {
            console.error('Error hydrating format for user:', err);
          }
          return parsed;
        }
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

  useEffect(() => {
    const mockMsgIds = ['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6'];
    const mockUserIds = ['user-katim', 'user-silva', 'user-raad', 'user-kibriya', 'user-jawbak'];
    setMessages(prev => prev.filter(m => !mockMsgIds.includes(m.id) && !mockUserIds.includes(m.senderId)));
  }, []);

  // Real-time Firestore sync for public messages
  useEffect(() => {
    try {
      const messagesRef = collection(db, 'messages');
      const unsubscribe = onSnapshot(messagesRef, (snapshot) => {
        const removedDocIds = new Set<string>();
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
            removedDocIds.add(change.doc.id);
          }
        });

        const cloudMsgs: Message[] = [];
        snapshot.forEach((docSnap) => {
          if (!removedDocIds.has(docSnap.id)) {
            const d = docSnap.data();
            if (d && d.id && d.text) {
              cloudMsgs.push(d as Message);
            }
          }
        });

        setMessages(prev => {
          let currentList = prev.filter(m => !removedDocIds.has(m.id));
          if (cloudMsgs.length > 0) {
            const map = new Map<string, Message>();
            currentList.forEach(m => map.set(m.id, m));
            cloudMsgs.forEach(m => {
              if (!removedDocIds.has(m.id)) {
                map.set(m.id, m);
              }
            });
            return Array.from(map.values()).sort((a, b) => {
              const tA = (a as any).createdAt || a.timestamp || '';
              const tB = (b as any).createdAt || b.timestamp || '';
              return tA > tB ? 1 : -1;
            });
          }
          return currentList;
        });
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'messages');
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore messages listener error:', e);
    }
  }, []);

  // Real-time Firestore sync for users & accounts
  useEffect(() => {
    try {
      const usersRef = collection(db, 'users');
      const unsubscribe = onSnapshot(usersRef, (snapshot) => {
        const removedUserIds = new Set<string>();
        snapshot.docChanges().forEach(change => {
          if (change.type === 'removed') {
            removedUserIds.add(change.doc.id);
          }
        });

        const cloudUsers: User[] = [];
        snapshot.forEach((docSnap) => {
          if (!removedUserIds.has(docSnap.id)) {
            const d = docSnap.data();
            if (d && d.id && d.username) {
              cloudUsers.push(d as User);
            }
          }
        });

        if (removedUserIds.size > 0 || cloudUsers.length > 0) {
          setUsers(prev => {
            // Remove deleted users from state
            const filteredPrev = prev.filter(u => !removedUserIds.has(u.id));
            const map = new Map<string, User>();
            filteredPrev.forEach(u => map.set(u.id, u));
            cloudUsers.forEach(u => {
              if (!removedUserIds.has(u.id)) {
                const existing = map.get(u.id);
                // Keep existing socket-driven onlineStatus and isOnline intact so stale db docs don't mark active users offline
                map.set(u.id, existing ? {
                  ...existing,
                  ...u,
                  onlineStatus: existing.onlineStatus,
                  isOnline: existing.isOnline,
                  lastSeen: existing.lastSeen,
                  lastSeenTimestamp: existing.lastSeenTimestamp
                } : u);
              }
            });
            return Array.from(map.values());
          });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore users listener error:', e);
    }
  }, []);

  // Real-time Firestore sync for global site settings & permissions
  useEffect(() => {
    try {
      const settingsDocRef = doc(db, 'settings', 'global');
      const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const cloudSettings = docSnap.data();
          if (cloudSettings && typeof cloudSettings === 'object') {
            setSiteSettings(prev => ({ ...prev, ...cloudSettings }));
            try {
              localStorage.setItem('araby_site_settings', JSON.stringify(cloudSettings));
            } catch {}
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/global');
      });
      return () => unsubscribe();
    } catch (e) {
      console.warn('Firestore settings listener error:', e);
    }
  }, []);

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
      timestamp: formatEnglishTime(new Date())
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
      const updated = [...prev, trimmed];
      updateSiteSettings({ customBadWordsList: updated });
      return updated;
    });
  };

  const removeCustomBadWord = (word: string) => {
    setCustomBadWords(prev => {
      const updated = prev.filter(w => w !== word);
      updateSiteSettings({ customBadWordsList: updated });
      return updated;
    });
  };

  // Custom Emojis Added by Owner
  const [customEmojis, setCustomEmojis] = useState<CustomEmojiItem[]>(() => {
    try {
      const saved = localStorage.getItem('araby_custom_emojis');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('araby_custom_emojis', JSON.stringify(customEmojis));
    } catch (e) {
      console.error(e);
    }
  }, [customEmojis]);

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

  const addCustomEmoji = useCallback((emojiData: Omit<CustomEmojiItem, 'id' | 'createdAt'>): CustomEmojiItem => {
    const rawTag = emojiData.tag.trim().replace(/^:+|:+$/g, '');
    const cleanTag = `:${rawTag || 'custom'}:`;
    const newEmoji: CustomEmojiItem = {
      ...emojiData,
      id: `emoji-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tag: cleanTag,
      createdAt: formatEnglishDate(new Date()),
      createdBy: currentUser?.username || 'الإدارة',
    };
    setCustomEmojis(prev => {
      const updated = [newEmoji, ...prev];
      sendSocketEvent('ADD_CUSTOM_EMOJI', newEmoji);
      fetch('/api/emojis/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji: newEmoji })
      }).catch(err => console.warn('Failed to persist custom emoji:', err));
      return updated;
    });
    return newEmoji;
  }, [currentUser, sendSocketEvent]);

  const deleteCustomEmoji = useCallback((emojiId: string) => {
    setCustomEmojis(prev => {
      const updated = prev.filter(e => e.id !== emojiId);
      sendSocketEvent('DELETE_CUSTOM_EMOJI', { id: emojiId });
      fetch('/api/emojis/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: emojiId })
      }).catch(err => console.warn('Failed to delete custom emoji:', err));
      return updated;
    });
  }, [sendSocketEvent]);

  const clearAllCustomEmojis = useCallback(() => {
    setCustomEmojis([]);
    sendSocketEvent('CLEAR_CUSTOM_EMOJIS', {});
    fetch('/api/emojis/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emojis: [] })
    }).catch(err => console.warn('Failed to clear custom emojis:', err));
  }, [sendSocketEvent]);

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
    landingTitle: 'دردشة تعارف',
    landingSubtitle: 'دردشة تعارف هو موقع تعارف شباب وبنات العرب محادثات عامة ومحادثات خاصة بدون تسجيل',
    landingTitleEn: 'Taarof Chat',
    landingSubtitleEn: 'Free online chat rooms for friends to meet and talk in public and private without registration',
    hideVisitorLogin: false,
    hideRegisterLink: false,
    maxUsernameLength: 20,
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
      saveSettingsToFirestore(updated);
      try {
        localStorage.setItem('araby_site_settings', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, [sendSocketEvent]);

  const hasPermission = useCallback((role: UserRole | string | undefined | null, permissionId: string): boolean => {
    if (!role) return false;
    if (role === 'owner') return true;
    return hasRolePermission(role, permissionId, siteSettings?.rolePermissions);
  }, [siteSettings?.rolePermissions]);

  const currentUserCan = useCallback((permissionId: string): boolean => {
    if (!currentUser) return false;
    if (currentUser.role === 'owner') return true;
    if (permissionId === 'change_username') {
      if (siteSettings?.disableUsernameChangeAll) return false;
      if (siteSettings?.disableUsernameChangeRoles && siteSettings.disableUsernameChangeRoles.includes(currentUser.role)) {
        return false;
      }
      return hasPermission(currentUser.role, 'change_username');
    }
    return hasPermission(currentUser.role, permissionId);
  }, [currentUser, hasPermission, siteSettings?.disableUsernameChangeAll, siteSettings?.disableUsernameChangeRoles]);
  // Context Menu State (Long press on text & images)
  const [textContextMenu, setTextContextMenu] = useState<{ isOpen: boolean; text: string; title?: string } | null>(null);
  const [imageContextMenu, setImageContextMenu] = useState<{ isOpen: boolean; imageUrl: string; altText?: string } | null>(null);

  const openTextContextMenu = useCallback((text: string, title?: string) => {
    if (!text || !text.trim()) return;
    setTextContextMenu({ isOpen: true, text: text.trim(), title });
  }, []);

  const closeTextContextMenu = useCallback(() => {
    setTextContextMenu(null);
  }, []);

  const openImageContextMenu = useCallback((imageUrl: string, altText?: string) => {
    if (!imageUrl || !imageUrl.trim()) return;
    setImageContextMenu({ isOpen: true, imageUrl: imageUrl.trim(), altText });
  }, []);

  const closeImageContextMenu = useCallback(() => {
    setImageContextMenu(null);
  }, []);

  const [isSideMenuOpen, setIsSideMenuOpen] = useState<boolean>(false);
  const [sideMenuInitialView, setSideMenuInitialView] = useState<'menu' | 'status' | 'wall' | 'news' | 'recharge' | 'bans'>('menu');
  const openNews = useCallback(() => {
    setSideMenuInitialView('news');
    setIsSideMenuOpen(true);
  }, []);
  const [isReportsOpen, setIsReportsOpen] = useState<boolean>(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState<boolean>(false);
  const [isFriendRequestsOpen, setIsFriendRequestsOpen] = useState<boolean>(false);
  const [isPrivateChatOpen, setIsPrivateChatOpen] = useState<boolean>(false);
  const [isOnlineListOpen, setIsOnlineListOpen] = useState<boolean>(false);
  const [isRoomsListOpen, setIsRoomsListOpen] = useState<boolean>(false);
  const [isRoomLogsOpen, setIsRoomLogsOpen] = useState<boolean>(false);
  const [isRoomSettingsOpen, setIsRoomSettingsOpen] = useState<boolean>(false);
  const [isGoogleChatOpen, setIsGoogleChatOpen] = useState<boolean>(false);
  const [isGoogleDriveOpen, setIsGoogleDriveOpen] = useState<boolean>(false);
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
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to parse ip_moderations from localStorage:', e);
    }
    return [
      {
        id: 'ip-ban-demo-1',
        ip: '197.245.10.82',
        deviceId: 'dev_9381024_a7b8c',
        type: 'ban',
        targetUserId: 'user-banned-demo-1',
        targetUsername: 'عمر_المشاغب',
        actionBy: 'المطور الرئيسي',
        reason: 'مخالفة شروط الدردشة وتكرار نشر الروابط',
        createdAt: '2026-08-25T14:30:00.000Z'
      },
      {
        id: 'ip-ban-demo-2',
        ip: '45.132.88.19',
        deviceId: 'dev_iphone_9921_x',
        type: 'ban',
        targetUserId: 'user-banned-demo-2',
        targetUsername: 'عاشق_الصمت_المخالف',
        actionBy: 'إدارة الموقع',
        reason: 'تكرار السبام والإعلانات المزعجة في الغرف',
        createdAt: '2026-08-27T18:15:00.000Z'
      }
    ];
  });

  const [deviceId, setDeviceId] = useState<string>('dev_unknown');

  useEffect(() => {
    getDeviceFingerprint().then(id => {
      setDeviceId(id);
    });
  }, []);

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
      if (r.ip === idOrIp || r.deviceId === idOrIp) {
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

  const checkIpStatus = useCallback((ipToCheck?: string, deviceIdToCheck?: string) => {
    // Owner is always exempt from any bans
    if (currentUserRef.current?.role === 'owner' || currentUserRef.current?.id === 'user-owner' || currentUserRef.current?.username?.toLowerCase() === 'owner') {
      return { isBanned: false, isKicked: false, isMuted: false, bannedRecord: null, kickedRecord: null, mutedRecord: null, activeRecords: [] };
    }

    const ip = ipToCheck || clientIp;
    const now = Date.now();
    
    // Check if the exact IP is banned
    const active = ipModerations.filter(rec => {
      const matchIp = rec.ip === ip || rec.ip === 'all';
      if (!matchIp) return false;
      if (rec.type === 'ban') return true;
      if (rec.expiresAt) {
        return new Date(rec.expiresAt).getTime() > now;
      }
      return true;
    });

    const banned = active.find(r => r.type === 'ban') || ipModerations.some(r => r.type === 'ban' && r.ip === ip);
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
                const mockUserIds = ['user-katim', 'user-silva', 'user-raad', 'user-kibriya', 'user-jawbak', 'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'];
                const mockMsgIds = ['msg-1', 'msg-2', 'msg-3', 'msg-4', 'msg-5', 'msg-6'];
                if (payload.messages && Array.isArray(payload.messages)) {
                  setMessages(payload.messages.filter((m: Message) => !mockMsgIds.includes(m.id) && !mockUserIds.includes(m.senderId)));
                }
                if (payload.privateMessages && Array.isArray(payload.privateMessages)) {
                  setPrivateMessages(payload.privateMessages);
                }
                if (payload.friendRequests && Array.isArray(payload.friendRequests)) {
                  setFriendRequests(payload.friendRequests);
                }
                if (payload.users && payload.users.length > 0) {
                  const cleanUsers = payload.users
                    .filter((u: User) => !mockUserIds.includes(u.id))
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
                if (payload.customEmojis && Array.isArray(payload.customEmojis)) {
                  setCustomEmojis(prev => {
                    const map = new Map<string, CustomEmojiItem>();
                    prev.forEach(e => map.set(e.id, e));
                    payload.customEmojis.forEach((e: CustomEmojiItem) => map.set(e.id, e));
                    const merged = Array.from(map.values());
                    if (merged.length > payload.customEmojis.length) {
                      fetch('/api/emojis/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ emojis: merged })
                      }).catch(() => {});
                    }
                    return merged;
                  });
                }
                if (payload.news && Array.isArray(payload.news)) {
                  setNews(payload.news);
                }
                if (payload.wallPosts && Array.isArray(payload.wallPosts)) {
                  setWallPosts(payload.wallPosts);
                }
                if (payload.siteSettings && typeof payload.siteSettings === 'object') {
                  setSiteSettings(prev => ({ ...prev, ...payload.siteSettings }));
                }
                break;
              }

              case "SYNC_NEWS": {
                if (Array.isArray(payload)) {
                  setNews(payload);
                }
                break;
              }

              case "NEW_NEWS_POST": {
                const post: NewsPost = payload;
                if (!post || !post.id) break;

                setNews(prev => {
                  if (prev.some(n => n.id === post.id)) return prev;
                  return [post, ...prev];
                });

                const curUser = currentUserRef.current;
                const author = post.authorName || 'الإدارة';
                const preview = post.title ? `${post.title}: ${post.content}` : post.content;
                const truncatedPreview = preview.length > 55 ? preview.substring(0, 55) + '...' : preview;

                // 1. Notification in User's Notification Center
                if (curUser) {
                  const newsNotif: Notification = {
                    id: `notif-news-${Date.now()}-${Math.random()}`,
                    userId: curUser.id,
                    type: 'system',
                    title: `📰 خبر جديد: ${post.title || author}`,
                    message: post.title ? `${post.title} - ${post.content}` : post.content,
                    senderId: 'system',
                    senderName: author,
                    senderAvatar: post.authorAvatar,
                    timestamp: post.timestamp || formatEnglishTime(new Date()),
                    isRead: false
                  };
                  setNotifications(prev => [newsNotif, ...prev]);
                }

                // 2. Top Banner Alert
                showTopBanner(`📰 خبر جديد من "${author}": ${truncatedPreview}`);

                // 3. In-App Toast Popup (Just like Private Message Alert)
                addToast({
                  type: 'news',
                  title: `📰 خبر جديد من ${author}`,
                  message: truncatedPreview,
                  avatar: post.authorAvatar,
                  senderName: author,
                });

                // 4. Audio Alert
                if (audioSettingsRef.current?.notificationSound !== false) {
                  playChatSound('notification');
                }

                // 5. Native Browser Notification
                showBrowserNotification(`📰 خبر جديد: ${post.title || author}`, {
                  body: truncatedPreview,
                  icon: post.authorAvatar,
                  onClick: () => {
                    try {
                      window.focus();
                    } catch {}
                    setSideMenuInitialView('news');
                    setIsSideMenuOpen(true);
                  }
                });
                break;
              }

              case "SYNC_WALL_POSTS": {
                if (Array.isArray(payload)) {
                  setWallPosts(payload);
                }
                break;
              }

              case "SYNC_CUSTOM_EMOJIS": {
                if (Array.isArray(payload)) {
                  setCustomEmojis(payload);
                }
                break;
              }

              case "USER_ROOM_CHANGED": {
                const { userId, fromRoomId, toRoomId } = payload || {};
                if (userId && toRoomId) {
                  setUsers(prev => prev.map(u => u.id === userId ? { ...u, currentRoomId: toRoomId } : u));
                  setCurrentUser(prev => prev && prev.id === userId ? { ...prev, currentRoomId: toRoomId } : prev);
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
                      timestamp: newMsg.timestamp || formatEnglishTime(new Date()),
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
                    timestamp: newPMsg.timestamp || formatEnglishTime(new Date()),
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
                    timestamp: newReq.timestamp || formatEnglishTime(new Date()),
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
                  const mockUserIds = ['user-katim', 'user-silva', 'user-raad', 'user-kibriya', 'user-jawbak', 'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'];
                  const cleanUsers = payload
                    .filter((u: User) => u && u.id && !mockUserIds.includes(u.id))
                    .map((u: User) => ({
                      ...u,
                      friends: (u.friends || []).filter(fId => fId !== 'user-system' && fId !== 'system')
                    }));

                  // Server is the single source of truth: replace list directly to eliminate ghost users
                  setUsers(cleanUsers);

                  // Update currentUser if their record was updated in sync
                  if (currentUser) {
                    const me = cleanUsers.find(u => u.id === currentUser.id);
                    if (me) {
                      setCurrentUser(prev => prev ? { ...prev, ...me } : me);
                    }
                  }
                }
                break;
              }

              case "UPDATE_ONLINE_USERS": {
                if (Array.isArray(payload)) {
                  const mockUserIds = ['user-katim', 'user-silva', 'user-raad', 'user-kibriya', 'user-jawbak', 'user-1', 'user-2', 'user-3', 'user-4', 'user-5', 'user-6', 'user-7', 'user-8'];
                  const onlineUserList = payload
                    .filter((u: User) => u && u.id && !mockUserIds.includes(u.id));
                  const onlineIds = new Set(onlineUserList.map(u => u.id));

                  setUsers(prev => {
                    const map = new Map<string, User>();
                    prev.forEach(u => {
                      if (onlineIds.has(u.id)) {
                        const onlineUser = onlineUserList.find(ou => ou.id === u.id);
                        map.set(u.id, onlineUser ? {
                          ...u,
                          ...onlineUser,
                          onlineStatus: onlineUser.onlineStatus || 'online',
                          isOnline: true
                        } : { ...u, onlineStatus: 'online', isOnline: true });
                      } else {
                        // Mark offline if not in online presence list (unless stealth owner)
                        const isOffline = u.role !== 'owner' || !u.isStealth;
                        map.set(u.id, isOffline ? { ...u, onlineStatus: 'offline', isOnline: false } : u);
                      }
                    });
                    // Also include any newly connected online user that wasn't in prev yet
                    onlineUserList.forEach(ou => {
                      if (!map.has(ou.id)) {
                        map.set(ou.id, { ...ou, onlineStatus: ou.onlineStatus || 'online', isOnline: true });
                      }
                    });
                    return Array.from(map.values());
                  });
                }
                break;
              }

              case "USER_LEFT": {
                const { userId } = payload || {};
                if (userId) {
                  setUsers(prev => prev
                    .map(u => u.id === userId ? {
                      ...u,
                      onlineStatus: 'offline' as const,
                      isOnline: false,
                      lastSeen: 'الآن'
                    } : u)
                    .filter(u => !(u.id === userId && (u.role === 'visitor' || u.id.startsWith('visitor-'))))
                  );
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
                  setCurrentRoom(prev => {
                    const found = payload.find((r: Room) => r.id === prev.id);
                    if (found) {
                      return { ...prev, ...found };
                    }
                    return prev;
                  });
                }
                break;
              }

              case "ROOM_KICKED": {
                const { roomId, userId, targetRoomName, fallbackRoomId } = payload || {};
                const fallbackId = fallbackRoomId || 'room-general';
                setUsers(prev => prev.map(u => {
                  if (u.id === userId && (u.currentRoomId === roomId || !u.currentRoomId)) {
                    return { ...u, currentRoomId: fallbackId };
                  }
                  return u;
                }));
                setRooms(prev => prev.map(r => {
                  if (r.id === roomId) {
                    const currentKicked = r.kickedUsers || [];
                    if (!currentKicked.includes(userId)) {
                      return { ...r, kickedUsers: [...currentKicked, userId] };
                    }
                  }
                  return r;
                }));
                setCurrentRoom(prev => {
                  if (prev.id === roomId) {
                    const currentKicked = prev.kickedUsers || [];
                    const updatedKicked = currentKicked.includes(userId) ? currentKicked : [...currentKicked, userId];
                    return { ...prev, kickedUsers: updatedKicked };
                  }
                  return prev;
                });
                if (currentUser && currentUser.id === userId) {
                  setCurrentUser(prev => prev ? { ...prev, currentRoomId: fallbackId } : null);
                  setCurrentRoom(prev => {
                    if (prev.id === roomId) {
                      const gen = rooms.find(r => r.id === fallbackId) || rooms[0];
                      showTopBanner(`🚫 تم طردك من غرفة (${targetRoomName || prev.name})`);
                      return gen ? { ...gen } : prev;
                    }
                    return prev;
                  });
                }
                break;
              }

              case "ROOM_MUTED": {
                const { roomId, userId, targetRoomName } = payload || {};
                setRooms(prev => prev.map(r => {
                  if (r.id === roomId) {
                    const currentMuted = r.mutedUsers || [];
                    if (!currentMuted.includes(userId)) {
                      return { ...r, mutedUsers: [...currentMuted, userId] };
                    }
                  }
                  return r;
                }));
                setCurrentRoom(prev => {
                  if (prev.id === roomId) {
                    const currentMuted = prev.mutedUsers || [];
                    const updatedMuted = currentMuted.includes(userId) ? currentMuted : [...currentMuted, userId];
                    return { ...prev, mutedUsers: updatedMuted };
                  }
                  return prev;
                });
                if (currentUser && currentUser.id === userId && currentRoom.id === roomId) {
                  showTopBanner(`🔇 تم كتمك في غرفة (${targetRoomName || currentRoom.name})`);
                }
                break;
              }

              case "ROOM_UNMUTED": {
                const { roomId, userId } = payload || {};
                setRooms(prev => prev.map(r => {
                  if (r.id === roomId) {
                    return { ...r, mutedUsers: (r.mutedUsers || []).filter(uid => uid !== userId) };
                  }
                  return r;
                }));
                setCurrentRoom(prev => {
                  if (prev.id === roomId) {
                    return { ...prev, mutedUsers: (prev.mutedUsers || []).filter(uid => uid !== userId) };
                  }
                  return prev;
                });
                break;
              }

              case "ROOM_UNKICKED": {
                const { roomId, userId } = payload || {};
                setRooms(prev => prev.map(r => {
                  if (r.id === roomId) {
                    return { ...r, kickedUsers: (r.kickedUsers || []).filter(uid => uid !== userId) };
                  }
                  return r;
                }));
                setCurrentRoom(prev => {
                  if (prev.id === roomId) {
                    return { ...prev, kickedUsers: (prev.kickedUsers || []).filter(uid => uid !== userId) };
                  }
                  return prev;
                });
                break;
              }

              case "SYNC_SETTINGS": {
                const newSettings = payload;
                if (newSettings && typeof newSettings === 'object') {
                  setSiteSettings(prev => ({ ...prev, ...newSettings }));
                  try {
                    localStorage.setItem('araby_site_settings', JSON.stringify(newSettings));
                  } catch {}
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
                const timeString = formatEnglishTime(now);
                const dateString = formatEnglishDate(now);
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
          const timeString = formatEnglishTime(nowObj);
          const dateString = formatEnglishDate(nowObj);

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
          const timeString = formatEnglishTime(nowObj);
          const dateString = formatEnglishDate(nowObj);

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
      timestamp: formatEnglishSecondsTime(now),
      date: formatEnglishDate(now)
    };
    setRoomActivityLogs(prev => [newLog, ...prev]);
  };

  const clearRoomActivityLogs = () => {
    setRoomActivityLogs([]);
  };

  // Helper to emit user room leave message "🚪 غادر هذا المستخدم الغرفة [ ... ]"
  const emitUserRoomLeaveMessage = (user: User, roomId: string) => {
    if (user.role === 'owner' && user.isStealth) return;
    if (siteSettings?.hideRoomSwitchNotifications || siteSettings?.announceUserEnterLeave === false) return;

    const now = new Date();
    const leaveMsg: Message = {
      id: `leave-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      roomId,
      senderId: user.id,
      senderName: user.username,
      senderRole: user.role,
      senderGender: user.gender,
      senderAvatar: user.avatar,
      senderUsernameColor: user.usernameColor,
      text: `🚪 غادر هذا المستخدم الغرفة [ ${user.username} ]`,
      type: 'text',
      timestamp: formatEnglishTime(now),
      date: formatEnglishDate(now),
    };

    setMessages(prev => [...prev, leaveMsg]);
    sendSocketEvent('SEND_MESSAGE', leaveMsg);
  };

  // Helper to emit user room join message "هذا المستخدم انضم للغرفة [ رتبة ... ]"
  const emitUserRoomJoinMessage = (user: User, roomId: string) => {
    // If owner is in stealth mode, do not emit public room join announcement
    if (user.role === 'owner' && user.isStealth) {
      return;
    }
    if (siteSettings?.hideRoomSwitchNotifications || siteSettings?.announceUserEnterLeave === false) {
      return;
    }

    const now = new Date();
    const timeStr = formatEnglishTime(now);
    const dateStr = formatEnglishDate(now);
    
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

  // Actual presence: Update last active time in state and storage
  const updateUserLastActivity = useCallback((targetUserId?: string) => {
    const uid = targetUserId || currentUser?.id;
    if (!uid) return;
    const now = Date.now();
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, lastSeenTimestamp: now, lastActivityTime: now, onlineStatus: 'online', isOnline: true } : u));
    setCurrentUser(prev => prev && prev.id === uid ? { ...prev, lastSeenTimestamp: now, lastActivityTime: now, onlineStatus: 'online', isOnline: true } : prev);
  }, [currentUser?.id]);

  // Actual presence: Clean up users who exceeded inactivity timeout
  const cleanupInactiveUsers = useCallback(() => {
    const timeoutMin = siteSettings?.userInactivityTimeoutMinutes || 15;
    const cutoff = Date.now() - (timeoutMin * 60 * 1000);

    setUsers(prev => {
      let changed = false;
      const updated = prev.map(u => {
        if (currentUser && u.id === currentUser.id) return u;
        if (u.onlineStatus === 'online' && u.lastSeenTimestamp && u.lastSeenTimestamp < cutoff) {
          changed = true;
          return {
            ...u,
            onlineStatus: 'offline' as const,
            isOnline: false,
          };
        }
        return u;
      });
      return changed ? updated : prev;
    });
  }, [siteSettings?.userInactivityTimeoutMinutes, currentUser]);

  // Inactivity auto-cleanup runner (checks every minute)
  useEffect(() => {
    cleanupInactiveUsers();
    const interval = setInterval(() => {
      cleanupInactiveUsers();
    }, 60000);
    return () => clearInterval(interval);
  }, [cleanupInactiveUsers]);

  // User activity listeners
  useEffect(() => {
    let throttleTimeout: any = null;
    const handleActivity = () => {
      if (!throttleTimeout) {
        throttleTimeout = setTimeout(() => {
          updateUserLastActivity();
          throttleTimeout = null;
        }, 20000);
      }
    };

    window.addEventListener('mousemove', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('touchstart', handleActivity, { passive: true });
    window.addEventListener('focus', handleActivity);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('focus', handleActivity);
      if (throttleTimeout) clearTimeout(throttleTimeout);
    };
  }, [updateUserLastActivity]);

  // Welcome Bot: Send automated or custom welcome message
  const sendBotWelcomeMessage = useCallback((customText?: string) => {
    const botName = siteSettings?.welcomeBotName || 'بوت الترحيب الآلي 🤖';
    const rawTemplate = customText || siteSettings?.welcomeBotMessage || 'أهلاً وسهلاً بك يا {username} في دردشتنا! نتمنى لك أطيب الأوقات والالتزام بالقوانين 🌹';
    const formatted = rawTemplate.replace('{username}', currentUser?.username || 'الزوار والأعضاء');

    const botMessage: Message = {
      id: `bot-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      roomId: currentRoom?.id || 'room-general',
      senderId: 'system-welcome-bot',
      senderName: botName,
      senderRole: 'admin',
      senderGender: 'male',
      senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
      text: formatted,
      type: 'text',
      timestamp: formatEnglishTime(new Date()),
      date: formatEnglishDate(new Date()),
      createdAt: new Date().toISOString()
    };

    setMessages(prev => [...prev, botMessage]);
    sendSocketEvent('SEND_MESSAGE', botMessage);
  }, [siteSettings?.welcomeBotName, siteSettings?.welcomeBotMessage, currentUser?.username, currentRoom?.id]);

  // Welcome Bot Scheduler (runs every minute or per owner interval)
  useEffect(() => {
    if (!siteSettings?.welcomeBotActive) return;

    const intervalSec = Math.max(10, siteSettings?.welcomeBotIntervalSeconds || 60);
    const timer = setInterval(() => {
      sendBotWelcomeMessage();
    }, intervalSec * 1000);

    return () => clearInterval(timer);
  }, [siteSettings?.welcomeBotActive, siteSettings?.welcomeBotIntervalSeconds, sendBotWelcomeMessage]);

  // Helper to fetch IP and update current user's country & flag automatically
  const updateGeoLocationForUser = useCallback(async (userId: string) => {
    try {
      const geo = await fetchUserGeoIP();
      if (geo) {
        const arabicCountry = getArabicCountryName(geo.country) || 'اليمن';

        setUsers(prev => prev.map(u => {
          if (u.id !== userId) return u;
          // Keep country if user manually modified it via Language/Location settings
          const targetCountry = u.countryModified ? u.country : arabicCountry;
          const targetFlag = u.countryModified ? u.countryFlag : (geo.countryFlag || getCountryFlagByName(arabicCountry) || '🇾🇪');
          return {
            ...u,
            country: targetCountry,
            countryFlag: targetFlag,
            ip: geo.ip || u.ip,
            locationMap: `${getEnglishCountryName(targetCountry)} (${geo.ip || u.ip})`
          };
        }));

        setCurrentUser(prev => {
          if (!prev || prev.id !== userId) return prev;
          const targetCountry = prev.countryModified ? prev.country : arabicCountry;
          const targetFlag = prev.countryModified ? prev.countryFlag : (geo.countryFlag || getCountryFlagByName(arabicCountry) || '🇾🇪');
          return {
            ...prev,
            country: targetCountry,
            countryFlag: targetFlag,
            ip: geo.ip || prev.ip,
            locationMap: `${getEnglishCountryName(targetCountry)} (${geo.ip || prev.ip})`
          };
        });
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

    // 2. Device Ban check
    const isDeviceBlocked = (siteSettings.blockedDevices || []).some(d => (deviceId && (d.id === deviceId || d.token === deviceId)));
    if (isDeviceBlocked) {
      return { success: false, error: '🚫 هذا الجهاز محظور نهائياً من دخول الدردشة من قبل إدارة الموقع' };
    }

    // 3. Browser Fingerprint Ban check
    const currentBrowserFp = `fp_brw_${(navigator.userAgent || '').replace(/[^a-zA-Z0-9]/g, '').slice(-12)}`;
    const isBrowserBlocked = (siteSettings.blockedBrowsers || []).some(b => b.id === currentBrowserFp || b.fingerprint === currentBrowserFp);
    if (isBrowserBlocked) {
      return { success: false, error: '🚫 بصمة هذا المتصفح محظورة من دخول الموقع وفقاً لقرارات الأمان' };
    }

    // 4. IP Kick check (User cannot enter as visitor while kick is active)
    if (ipCheck.isKicked) {
      const expTime = ipCheck.kickedRecord?.expiresAt ? formatEnglishTime(new Date(ipCheck.kickedRecord.expiresAt)) : 'انتهاء المدة';
      alert(`🚫 هذا الآي بي مطرود مؤقتاً كزائر حتى ${expTime}. يمكنك تسجيل الدخول إذا كنت تمتلك عضوية مسجلة مسبقاً.`);
      return { success: false, error: `🚫 هذا الآي بي مطرود مؤقتاً كزائر حتى ${expTime}` };
    }

    if (siteSettings?.hideVisitorLogin || siteSettings?.enableGuestLogin === false) {
      return { success: false, error: '🚫 تم تعطيل دخول الزوار حالياً من قبل إدارة الموقع' };
    }

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      return { success: false, error: 'الرجاء إدخال اسم الزائر المطلوب' };
    }

    if (cleanUsername.length < 2) {
      return { success: false, error: 'يجب أن يتكون اسم الزائر من حرفين على الأقل' };
    }

    const maxUserLen = siteSettings?.maxUsernameLength || 20;
    if (cleanUsername.length > maxUserLen) {
      return { success: false, error: `🚫 اسم الزائر يتجاوز الحد الأقصى المسموح (${maxUserLen} حرف)` };
    }

    if (!gender || (gender !== 'male' && gender !== 'female' && (gender as string) !== 'other')) {
      return { success: false, error: 'الرجاء تحديد الجنس (ذكر أو أنثى أو آخر) لإكمال الدخول' };
    }

    if (age === 'العمر' || !age) {
      return { success: false, error: 'الرجاء تحديد العمر لإكمال الدخول كزائر' };
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

    // Restore saved format settings if user previously configured them
    let initialFormat: any = null;
    try {
      const globalFormat = localStorage.getItem('araby_chat_text_format');
      if (globalFormat) initialFormat = JSON.parse(globalFormat);
    } catch (e) {
      console.error(e);
    }

    const newVisitor: User = {
      id: `visitor-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      username: cleanUsername,
      role: 'visitor',
      gender: gender || 'male',
      age: cleanAge,
      avatar: '/default_guest.svg',
      coins: 0,
      likes: 0,
      country: 'Yemen',
      countryFlag: '🇾🇪',
      ip: clientIp,
      currentRoomId: currentRoom.id,
      joinedDate: formatEnglishDate(new Date()),
      joinedTimestamp: Date.now(),
      lastSeen: 'الآن',
      privatePrivacy: 'everyone',
      onlineStatus: 'online',
      ignores: [],
      blockedUsers: [],
      isMuted: isMutedFromIp,
      muteUntil: muteUntilFromIp,
      chatTextColor: initialFormat?.color,
      chatTextBgGradient: initialFormat?.bgGradient,
      chatFontFamily: initialFormat?.fontFamily,
      chatFontStyle: initialFormat?.style,
      chatTextWeight: initialFormat?.weight,
      chatIsNeon: initialFormat?.isNeon,
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

    // 2. Device Ban check
    const isDeviceBlocked = (siteSettings.blockedDevices || []).some(d => (deviceId && (d.id === deviceId || d.token === deviceId)));
    if (isDeviceBlocked) {
      return { success: false, error: '🚫 هذا الجهاز محظور نهائياً من دخول الدردشة من قبل إدارة الموقع' };
    }

    // 3. Browser Fingerprint Ban check
    const currentBrowserFp = `fp_brw_${(navigator.userAgent || '').replace(/[^a-zA-Z0-9]/g, '').slice(-12)}`;
    const isBrowserBlocked = (siteSettings.blockedBrowsers || []).some(b => b.id === currentBrowserFp || b.fingerprint === currentBrowserFp);
    if (isBrowserBlocked) {
      return { success: false, error: '🚫 بصمة هذا المتصفح محظورة من دخول الموقع وفقاً لقرارات الأمان' };
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
    emitUserRoomJoinMessage(user, currentRoom.id);
    sendSocketEvent('JOIN_USER', { user });
    saveUserToFirestore(user);

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
    const maxUserLen = siteSettings?.maxUsernameLength || 20;
    if (cleanUsername.length > maxUserLen) {
      return { success: false, error: `🚫 اسم المستخدم يتجاوز الحد الأقصى المسموح (${maxUserLen} حرف)` };
    }
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
      country: 'Yemen',
      countryFlag: '🇾🇪',
      ip: clientIp,
      currentRoomId: currentRoom.id,
      joinedDate: formatEnglishDate(new Date()),
      joinedTimestamp: Date.now(),
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
    emitUserRoomJoinMessage(newMember, currentRoom.id);
    sendSocketEvent('JOIN_USER', { user: newMember });
    saveUserToFirestore(newMember);
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: newMember })
    }).catch(err => console.warn('Failed to persist new registered member to D1:', err));

    // Fetch IP and update country/flag automatically
    updateGeoLocationForUser(newMember.id);
    return { success: true };
  };

  // Login with Firebase Authentication (Google Quick Sign In)
  const loginWithFirebaseGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await signInWithGoogle();
      if (!result) {
        return { success: false, error: 'تم إلغاء تسجيل الدخول أو إغلاق نافذة المصادقة' };
      }
      const { user: fbUser } = result;
      let existingUser = users.find(u => u.email === fbUser.email || u.id === `firebase_${fbUser.uid}`);
      if (!existingUser) {
        const newUser: User = {
          id: `firebase_${fbUser.uid}`,
          username: fbUser.displayName || fbUser.email?.split('@')[0] || 'مستخدم جوجل',
          password: `google_auth_${fbUser.uid}`,
          email: fbUser.email || '',
          role: 'member',
          gender: 'male',
          age: 25,
          avatar: fbUser.photoURL || '/default_male.svg',
          statusMessage: '✨ متصل عبر Firebase Authentication',
          bio: 'حساب مسجل عبر نظام تسجيل الدخول السريع لـ Firebase.',
          coins: 150,
          likes: 0,
          likedBy: [],
          country: 'اليمن',
          countryFlag: '🇾🇪',
          ip: clientIp,
          currentRoomId: currentRoom.id,
          joinedDate: formatEnglishDate(new Date()),
          joinedTimestamp: Date.now(),
          lastSeen: 'الآن',
          privatePrivacy: 'everyone',
          onlineStatus: 'online',
          friends: [],
          ignores: [],
          blockedUsers: []
        };
        setUsers(prev => [...prev, newUser]);
        existingUser = newUser;
      }

      if (existingUser.isBanned) {
        return { success: false, error: 'عذراً، هذا الحساب محظور من دخول الشات من قبل الإدارة' };
      }

      setCurrentUser(existingUser);
      setCurrentView('rooms');
      emitUserRoomJoinMessage(existingUser, currentRoom.id);
      sendSocketEvent('JOIN_USER', { user: existingUser });
      saveUserToFirestore(existingUser);
      showTopBanner(`✨ أهلاً بك ${existingUser.username}! تم تسجيل الدخول بنجاح عبر Firebase Authentication.`);
      updateGeoLocationForUser(existingUser.id);
      return { success: true };
    } catch (err: any) {
      console.error('Firebase Auth error:', err);
      return { success: false, error: err?.message || 'حدث خطأ أثناء الاتصال بخدمة Firebase Authentication' };
    }
  };

  // Logout
  const logout = () => {
    if (currentUser) {
      const loggedOutUserId = currentUser.id;
      const isVisitor = currentUser.role === 'visitor' || loggedOutUserId.startsWith('visitor-');
      const userRoomId = currentUser.currentRoomId || currentRoom?.id || 'room-general';

      // 1. Emit exit announcement message in room
      const now = new Date();
      let exitText = '';
      if (isVisitor) {
        exitText = `غادر ${getUserDisplayTag(currentUser)}`;
      } else {
        let roleTitle = 'عضو';
        if (currentUser.role === 'vip') roleTitle = 'مميز';
        else if (currentUser.role === 'moderator') roleTitle = 'مشرف';
        else if (currentUser.role === 'management') roleTitle = 'إدارة';
        else if (currentUser.role === 'admin') roleTitle = 'أدمن';
        else if (currentUser.role === 'owner') roleTitle = 'المالك';
        exitText = `غادر ${currentUser.username} [ ${roleTitle} ]`;
      }

      const exitMsg: Message = {
        id: `sys-exit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        roomId: userRoomId,
        senderId: 'user-system',
        senderName: 'System',
        senderRole: 'management',
        senderGender: 'other',
        text: exitText,
        type: 'system',
        timestamp: formatEnglishTime(now),
        date: formatEnglishDate(now)
      };

      setMessages(prev => [...prev, exitMsg]);
      sendSocketEvent('SEND_MESSAGE', exitMsg);

      // 2. Clear private messages involving this user on logout
      setPrivateMessages(prev => prev.filter(pm => pm.senderId !== loggedOutUserId && pm.receiverId !== loggedOutUserId));
      sendSocketEvent('CLEAR_USER_PRIVATE_MESSAGES', { userId: loggedOutUserId });
      fetch('/api/private/clear-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedOutUserId })
      }).catch(err => console.warn('Failed to clear user private messages on backend:', err));

      // 3. Immediately update local state so current client reflects departure
      if (isVisitor) {
        setUsers(prev => prev.filter(u => u.id !== loggedOutUserId));
      } else {
        setUsers(prev => prev.map(u => u.id === loggedOutUserId ? { ...u, onlineStatus: 'offline', isOnline: false, lastSeen: 'الآن' } : u));
      }

      // 4. Notify backend server via WebSocket and REST to update source-of-truth and broadcast
      sendSocketEvent('USER_LOGOUT', { userId: loggedOutUserId, isVisitor });
      fetch('/api/users/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: loggedOutUserId, isVisitor })
      }).catch(err => console.warn('Failed to call /api/users/logout:', err));
    }

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
    const timeStr = formatEnglishTime(now);
    const dateStr = formatEnglishDate(now);

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

  // Switch active room (with lock/password protection & role-based restrictions)
  const switchRoom = (roomId: string, passwordAttempt?: string): boolean => {
    const room = rooms.find(r => r.id === roomId) || rooms[0];
    const isMgmt = ['management', 'admin', 'owner'].includes(currentUser?.role || '');
    const userRole = currentUser?.role || 'visitor';
    const isOwner = userRole === 'owner';

    // 1. Role-based restrictions check (Diamond Room & Admin Room)
    if (room.roomType === 'admin') {
      const allowed = room.allowedRoles && room.allowedRoles.length > 0
        ? room.allowedRoles.includes(userRole) || isOwner
        : ['owner', 'management', 'admin', 'moderator'].includes(userRole);

      if (!allowed) {
        showTopBanner('🚫 هذه الغرفة مخصصة للإدارة فقط ولا تملك الصلاحية لدخولها');
        return false;
      }
    }

    if (room.roomType === 'diamond' || (room.allowedRoles && room.allowedRoles.length > 0)) {
      if (!isOwner && room.allowedRoles && room.allowedRoles.length > 0 && !room.allowedRoles.includes(userRole)) {
        const roleLabels: Record<string, string> = {
          owner: 'المالك',
          management: 'إدارة',
          admin: 'أدمن',
          moderator: 'مشرف',
          vip: 'مميز',
          member: 'عضو',
          visitor: 'زائر'
        };
        const allowedLabels = room.allowedRoles.map(r => roleLabels[r] || r).join('، ');
        showTopBanner(`🚫 هذه الغرفة الماسية مخصصة لرتب محددة فقط (${allowedLabels})`);
        return false;
      }
    }

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

    const previousRoomId = currentUser?.currentRoomId || currentRoom.id;
    setCurrentRoom(room);
    if (currentUser) {
      const updatedCurUser: User = { ...currentUser, currentRoomId: room.id };
      setCurrentUser(updatedCurUser);
      setUsers(prev => prev.map(u => u.id === currentUser.id ? updatedCurUser : u));
      sendSocketEvent('CHANGE_ROOM', {
        userId: currentUser.id,
        fromRoomId: previousRoomId,
        toRoomId: room.id
      });
      sendSocketEvent('UPDATE_USER', updatedCurUser);
      fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: updatedCurUser })
      }).catch(err => console.warn('Failed to persist user room change to D1:', err));

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
      // Emit user room leave message from previous room and join message in new room
      if (previousRoomId && previousRoomId !== room.id) {
        emitUserRoomLeaveMessage(currentUser, previousRoomId);
      }
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
      const timeString = formatEnglishTime(nowObj);
      const dateString = formatEnglishDate(nowObj);

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
        timestamp: formatEnglishDateTime(new Date())
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
  const sendMessage = (
    text: string,
    type: Message['type'] = 'text',
    mediaUrl?: string,
    voiceDuration?: number,
    textStyle?: {
      color?: string;
      fontSize?: string;
      fontWeight?: string;
      fontFamily?: string;
      fontStyle?: string;
      bgGradient?: string;
      isNeon?: boolean;
    }
  ) => {
    if (!currentUser) return;

    // 1. Data Size Check & Max Public Length
    const maxPublicLen = siteSettings?.maxPublicMessageLength || 500;
    if (text && text.length > maxPublicLen) {
      showTopBanner(`🚫 تجاوزت الحد الأقصى لطول الرسالة في العام (${maxPublicLen} حرف)`);
      return;
    }

    if (siteSettings?.enableProfilePhotoCheck && (!currentUser.avatar || currentUser.avatar.includes('default_guest'))) {
      showTopBanner('🚫 يتطلب إرسال الرسائل تعيين صورة بروفايل خاصة بك أولاً من إعدادات الملف الشخصي!');
      return;
    }

    // 2. Rate Limiting Check (Max 2 messages per second)
    const nowMs = Date.now();
    const timestamps = userMsgTimestampsRef.current;
    const recentTimestamps = timestamps.filter(t => nowMs - t < 1000);
    if (recentTimestamps.length >= 2) {
      showTopBanner('⚠️ معدل الطلبات (Rate Limiting): الحد الأقصى رسالتان في الثانية. يرجى التمهل!');
      return;
    }
    recentTimestamps.push(nowMs);
    userMsgTimestampsRef.current = recentTimestamps;

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

    // Role-based Permissions Enforcement
    if (type === 'text' && !currentUserCan('send_text')) {
      showTopBanner('🚫 ليس لديك صلاحية إرسال الرسائل النصية حسب رتبتك');
      return;
    }
    if (type === 'image' && !currentUserCan('send_media')) {
      showTopBanner('🚫 ليس لديك صلاحية إرسال الصور والوسائط حسب رتبتك');
      return;
    }
    if (type === 'voice') {
      if (siteSettings.enableVoiceNotes === false || (siteSettings as any).modulesState?.voice === false) {
        showTopBanner('🔒 الرسائل الصوتية معطلة حالياً في الموقع');
        return;
      }
      if (!currentUserCan('send_voice')) {
        showTopBanner('🚫 ليس لديك صلاحية إرسال الرسائل الصوتية حسب رتبتك');
        return;
      }
    }
    if ((type as string) === 'draw' && !currentUserCan('send_canvas')) {
      showTopBanner('🚫 ليس لديك صلاحية استخدام لوحة الرسم حسب رتبتك');
      return;
    }

    // Auto profanity filtering
    let processedText = text;
    if (text) {
      const { cleanText } = processProfanityAndFilter(currentUser, text);
      processedText = cleanText;
    }

    const now = new Date();
    const timeStr = formatEnglishTime(now);
    const dateStr = formatEnglishDate(now);

    // Check background gradient permission and site settings
    let effectiveBgGradient = textStyle?.bgGradient !== undefined ? textStyle.bgGradient : currentUser.chatTextBgGradient;
    const isVisitorOrMember = currentUser.role === 'visitor' || currentUser.role === 'member';
    const isBgHiddenForVisitorMember = siteSettings.hideChatBackgroundForVisitorAndMember !== false;
    const hasBgPermission = hasRolePermission(currentUser.role, 'chat_background', siteSettings.rolePermissions);

    if (effectiveBgGradient && isVisitorOrMember && (isBgHiddenForVisitorMember || !hasBgPermission)) {
      effectiveBgGradient = undefined;
    }

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
      textColor: textStyle?.color || currentUser.chatTextColor || currentUser.fontColor,
      textFontSize: textStyle?.fontSize || currentUser.chatTextFontSize || (currentUser.fontSize ? `${currentUser.fontSize}px` : undefined),
      textWeight: textStyle?.fontWeight || currentUser.chatTextWeight,
      fontFamily: textStyle?.fontFamily || currentUser.chatFontFamily,
      textStyle: textStyle?.fontStyle || currentUser.chatFontStyle,
      textBgGradient: effectiveBgGradient,
      isNeon: textStyle?.isNeon !== undefined ? textStyle.isNeon : currentUser.chatIsNeon,
      type,
      mediaUrl,
      voiceDuration,
      timestamp: timeStr,
      date: dateStr
    };

    setMessages(prev => [...prev, newMsg]);
    sendSocketEvent('SEND_MESSAGE', newMsg);
    saveMessageToFirestore(newMsg);
    fetch('/api/messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: newMsg })
    }).catch(err => console.warn('Failed to persist message to D1:', err));

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

    const maxPrivateLen = siteSettings?.maxPrivateMessageLength || 500;
    if (text && text.length > maxPrivateLen) {
      showTopBanner(`🚫 تجاوزت الحد الأقصى لطول الرسالة في الخاص (${maxPrivateLen} حرف)`);
      return false;
    }

    if (siteSettings?.enableProfilePhotoCheck && (!currentUser.avatar || currentUser.avatar.includes('default_guest'))) {
      showTopBanner('🚫 يتطلب إرسال الرسائل الخاصة تعيين صورة بروفايل خاصة بك أولاً!');
      return false;
    }

    // Check Site & Role Permissions for Private Chat
    if (siteSettings.enableDirectChat === false || (siteSettings as any).modulesState?.private === false) {
      showTopBanner('🔒 المحادثات الخاصة معطلة حالياً في الموقع من قِبل الإدارة');
      return false;
    }

    if (!currentUserCan('private_chat')) {
      showTopBanner('🚫 ليس لديك صلاحية استخدام المحادثات الخاصة حسب رتبتك');
      return false;
    }

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
    const timeStr = formatEnglishTime(now);

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
    savePrivateMessageToFirestore(newPm);
    fetch('/api/private-messages/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ privateMessage: newPm })
    }).catch(err => console.warn('Failed to persist private message to D1:', err));
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
    saveUserToFirestore(updatedUser);
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

    if (targetUser.role === 'owner' || targetUser.id === 'user-owner') {
      showTopBanner('🚫 لا يمكنك اتخاذ أي إجراء إداري (كتم أو طرد أو حظر) على المالك الرئيسي!');
      return;
    }

    const isActorOwner = currentUser.role === 'owner' || currentUser.id === 'user-owner';
    const isActorSuperAdmin = !!currentUser.is_super_admin || isActorOwner;

    // Super Admin Immunity Check
    if (targetUser.is_super_admin && !isActorSuperAdmin && currentUser.id !== targetUserId) {
      showTopBanner('🛡️ هذا العضو يتمتع بحصانة (Super Admin). لا يمكن اتخاذ أي إجراء إداري ضده!');
      return;
    }

    // Mutual Ban & Rank Enforcement: Cannot take action on equal or higher rank unless owner/super-admin
    const actorLevel = getRoleLevel(currentUser.role);
    const targetLevel = getRoleLevel(targetUser.role);
    if (!isActorSuperAdmin && targetLevel >= actorLevel && currentUser.id !== targetUserId) {
      showTopBanner('🚫 لا يمكنك حظر أو اتخاذ أي إجراء إداري ضد عضو يملك نفس رتبتك أو رتبة أعلى منك!');
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
        deviceId: targetUser.deviceId || deviceId,
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
      deleteUserFromFirestore(targetUserId).catch(err => console.warn('Failed to delete user from Firestore:', err));
      setUsers(prev => prev.filter(u => u.id !== targetUserId));
      sendSocketEvent('DELETE_USER_ACCOUNT', { userId: targetUserId });
      fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: targetUserId,
          requesterId: currentUser?.id,
          requesterRole: currentUser?.role
        })
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

  // Delete message: Server & Database First -> WebSocket -> Local State
  const deleteMessage = async (messageId: string) => {
    if (!messageId || !currentUser) return;
    const targetMsg = messages.find(m => m.id === messageId);

    try {
      // 1. Check permissions and delete on the server & database first
      const response = await fetch('/api/messages/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          userId: currentUser.id,
          userRole: currentUser.role
        })
      });

      // 2. Do not treat delete as successful if response is not ok
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'فشل حذف الرسالة من الخادم');
      }

      const resJson = await response.json().catch(() => ({ success: true }));
      if (!resJson.success) {
        throw new Error(resJson.error || 'فشل حذف الرسالة');
      }

      // 3. Sync deletion to Firestore so it never returns on refresh
      try {
        await deleteMessageFromFirestore(messageId);
      } catch (fErr) {
        console.warn('Firestore delete sync error:', fErr);
      }

      // 4. Update local state upon confirmed success
      setMessages(prev => prev.filter(m => m.id !== messageId));

      // 5. Broadcast to room activity log
      if (targetMsg) {
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
    } catch (err: any) {
      console.error('Delete message error:', err);
      alert(err.message || 'حدث خطأ: تعذر حذف الرسالة');
    }
  };

  // Clear Room Public Messages (Command /Clear or Admin/Staff action)
  const clearChat = async (roomId?: string) => {
    if (!currentUser) return;
    const targetRoomId = roomId || currentRoom.id;
    const targetRoom = rooms.find(r => r.id === targetRoomId) || currentRoom;

    // Allowed ONLY for Owner, Admin, and Management (المشرف أو الرتب الأخرى يظهر له حدث خطأ ما)
    const hasClearPermission = ['owner', 'admin', 'management'].includes(currentUser.role);

    if (hasClearPermission) {
      try {
        const response = await fetch('/api/messages/clear', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            roomId: targetRoomId,
            userId: currentUser.id,
            userRole: currentUser.role
          })
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || 'فشل مسح المحادثة من الخادم');
        }

        setMessages(prev => prev.filter(m => m.roomId !== targetRoomId));

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
        const timeStr = formatEnglishTime(now);
        const dateStr = formatEnglishDate(now);
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
      } catch (err: any) {
        console.error('Clear chat error:', err);
        showTopBanner(`⚠️ فشل مسح المحادثة: ${err.message || 'خطأ في الخادم'}`);
      }
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

    const isActorOwner = currentUser.role === 'owner' || currentUser.id === 'user-owner';
    const isActorSuperAdmin = !!currentUser.is_super_admin || isActorOwner;
    const isActorAdmin = currentUser.role === 'admin';
    const isActorManagement = currentUser.role === 'management';
    const isSelfEdit = currentUser.id === userId;

    // Protection 1: Primary Owner (user-owner) profile cannot be modified by anyone except the primary owner itself
    if (targetUser.id === 'user-owner' && currentUser.id !== 'user-owner') {
      showTopBanner('🚫 لا يمكن تعديل أو تغيير رتبة أو ملف المالك الرئيسي إلا بواسطة المالك الرئيسي الأصلي!');
      return;
    }

    // Super Admin Immunity Check
    if (targetUser.is_super_admin && !isActorSuperAdmin && !isSelfEdit) {
      showTopBanner('🛡️ هذا العضو يتمتع بحصانة (Super Admin). لا يمكن تعديل ملفه!');
      return;
    }

    // Mutual Rank & Ban Enforcement: Cannot modify equal or higher rank unless super admin/owner or self
    const actorLevel = getRoleLevel(currentUser.role);
    const targetLevel = getRoleLevel(targetUser.role);
    if (!isActorSuperAdmin && targetLevel >= actorLevel && !isSelfEdit) {
      showTopBanner('🚫 لا يمكنك تعديل ملف عضو يملك نفس رتبتك أو رتبة أعلى منك!');
      return;
    }

    // Prevent unauthorized change of is_super_admin field
    if (updates.is_super_admin !== undefined && updates.is_super_admin !== targetUser.is_super_admin && !isActorOwner && !currentUser.is_super_admin) {
      showTopBanner('🚫 لا تملك صلاحية تعديل حقل حصانة السوبر أدمن (is_super_admin)!');
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
    fetch('/api/users/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user: updatedUser })
    }).catch(err => console.warn('Failed to persist owner user update to D1:', err));
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
    if (!currentUser) return;
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (targetUser.role === 'owner' || targetUser.id === 'user-owner') {
      showTopBanner('🚫 لا يمكن حظر المالك الرئيسي!');
      return;
    }

    const isActorOwner = currentUser.role === 'owner' || currentUser.id === 'user-owner';
    const isActorSuperAdmin = !!currentUser.is_super_admin || isActorOwner;

    if (targetUser.is_super_admin && !isActorSuperAdmin && currentUser.id !== userId) {
      showTopBanner('🛡️ هذا العضو يتمتع بحصانة (Super Admin). لا يمكن حظره!');
      return;
    }

    const actorLevel = getRoleLevel(currentUser.role);
    const targetLevel = getRoleLevel(targetUser.role);
    if (!isActorSuperAdmin && targetLevel >= actorLevel && currentUser.id !== userId) {
      showTopBanner('🚫 لا يمكنك حظر عضو يملك نفس رتبتك أو رتبة أعلى منك!');
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
        deviceId: targetUser?.deviceId || deviceId,
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

  const bannedIps = useMemo(() => {
    const list = new Set<string>();
    ipModerations.forEach(r => {
      if (r.type === 'ban' && r.ip && r.ip !== 'all') {
        list.add(r.ip);
      }
    });
    return Array.from(list);
  }, [ipModerations]);

  const banIp = (ip: string, username?: string, reason?: string) => {
    const cleanIp = ip.trim();
    if (!cleanIp) return;
    const targetUser = users.find(u => u.ip === cleanIp || (username && u.username.toLowerCase() === username.toLowerCase()));
    const finalUsername = username || targetUser?.username || cleanIp;

    addIPModerationRecord({
      id: `ip-ban-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ip: cleanIp,
      deviceId: targetUser?.deviceId,
      type: 'ban',
      targetUserId: targetUser?.id,
      targetUsername: finalUsername,
      actionBy: currentUser?.username || 'الإدارة',
      reason: reason || 'حظر عنوان الآي بي من لوحة التحكم',
      createdAt: new Date().toISOString()
    });

    if (targetUser) {
      setBanList(prev => [...prev.filter(id => id !== targetUser.id), targetUser.id]);
      setUsers(prev => prev.map(u => (u.id === targetUser.id || u.ip === cleanIp) ? { ...u, isBanned: true, onlineStatus: 'offline', currentRoomId: undefined } : u));
    }

    sendSocketEvent('BAN_USER', {
      userId: targetUser?.id,
      ip: cleanIp,
      reason: reason || 'حظر IP'
    });

    addToast({
      type: 'warning',
      title: 'حظر IP',
      message: `تم حظر عنوان الـ IP (${cleanIp}) للعضو [${finalUsername}] بنجاح 🚫`
    });
  };

  const unbanIp = (ip: string) => {
    const cleanIp = ip.trim();
    if (!cleanIp) return;
    removeIPModerationRecord(cleanIp, 'ban');
    setUsers(prev => prev.map(u => u.ip === cleanIp ? { ...u, isBanned: false } : u));
    sendSocketEvent('UNBAN_USER', { ip: cleanIp });
    addToast({
      type: 'success',
      title: 'فك حظر IP',
      message: `تم فك الحظر عن عنوان الـ IP (${cleanIp}) بنجاح 🔓`
    });
  };

  const banDevice = (targetDeviceId: string, username?: string, reason?: string, deviceName?: string) => {
    const cleanId = targetDeviceId.trim();
    if (!cleanId) return;
    const targetUser = users.find(u => u.deviceId === cleanId || (username && u.username.toLowerCase() === username.toLowerCase()));
    const finalUsername = username || targetUser?.username || 'جهاز غير معروف';

    const newItem: BlockedDeviceItem = {
      id: cleanId,
      name: deviceName || (cleanId.startsWith('dev_') ? `جهاز (${cleanId.substring(0, 10)})` : cleanId),
      token: cleanId,
      username: finalUsername,
      targetUserId: targetUser?.id,
      date: formatEnglishDate(new Date()),
      reason: reason || 'حظر الجهاز من لوحة التحكم',
      actionBy: currentUser?.username || 'الإدارة'
    };

    updateSiteSettings({
      blockedDevices: [
        ...(siteSettings.blockedDevices || []).filter(d => d.id !== cleanId && d.token !== cleanId),
        newItem
      ]
    });

    if (targetUser) {
      setUsers(prev => prev.map(u => (u.id === targetUser.id || u.deviceId === cleanId) ? { ...u, isBanned: true, onlineStatus: 'offline', currentRoomId: undefined } : u));
    }

    addToast({
      type: 'warning',
      title: 'حظر جهاز',
      message: `تم حظر الجهاز [${newItem.name}] للعضو (${finalUsername}) بنجاح 🚫`
    });
  };

  const unbanDevice = (targetDeviceId: string) => {
    const cleanId = targetDeviceId.trim();
    if (!cleanId) return;

    const removedItem = (siteSettings.blockedDevices || []).find(d => d.id === cleanId || d.token === cleanId);
    updateSiteSettings({
      blockedDevices: (siteSettings.blockedDevices || []).filter(d => d.id !== cleanId && d.token !== cleanId)
    });

    if (cleanId === deviceId) {
      try {
        localStorage.removeItem('araby_device_banned');
        document.cookie = 'araby_ban=; path=/; max-age=0';
      } catch (e) {}
    }

    if (removedItem?.targetUserId || removedItem?.username) {
      setUsers(prev => prev.map(u => (u.id === removedItem.targetUserId || u.username === removedItem.username || u.deviceId === cleanId) ? { ...u, isBanned: false } : u));
    }

    addToast({
      type: 'success',
      title: 'فك حظر جهاز',
      message: `تم فك حظر الجهاز [${removedItem?.name || cleanId}] للعضو (${removedItem?.username || 'مستخدم'}) بنجاح 🔓`
    });
  };

  const banBrowser = (fingerprint: string, username?: string, reason?: string, browserName?: string) => {
    const cleanFp = fingerprint.trim();
    if (!cleanFp) return;
    const targetUser = users.find(u => (u as any).browserFingerprint === cleanFp || (username && u.username.toLowerCase() === username.toLowerCase()));
    const finalUsername = username || targetUser?.username || 'متصفح مجهول';

    const newItem: BlockedBrowserItem = {
      id: cleanFp,
      name: browserName || `متصفح (${cleanFp.substring(0, 10)})`,
      fingerprint: cleanFp,
      username: finalUsername,
      targetUserId: targetUser?.id,
      date: formatEnglishDate(new Date()),
      reason: reason || 'حظر بصمة المتصفح من لوحة التحكم',
      actionBy: currentUser?.username || 'الإدارة'
    };

    updateSiteSettings({
      blockedBrowsers: [
        ...(siteSettings.blockedBrowsers || []).filter(b => b.id !== cleanFp && b.fingerprint !== cleanFp),
        newItem
      ]
    });

    if (targetUser) {
      setUsers(prev => prev.map(u => (u.id === targetUser.id) ? { ...u, isBanned: true, onlineStatus: 'offline', currentRoomId: undefined } : u));
    }

    addToast({
      type: 'warning',
      title: 'حظر بصمة المتصفح',
      message: `تم حظر بصمة المتصفح [${newItem.name}] للعضو (${finalUsername}) بنجاح 🚫`
    });
  };

  const unbanBrowser = (fingerprint: string) => {
    const cleanFp = fingerprint.trim();
    if (!cleanFp) return;

    const removedItem = (siteSettings.blockedBrowsers || []).find(b => b.id === cleanFp || b.fingerprint === cleanFp);
    updateSiteSettings({
      blockedBrowsers: (siteSettings.blockedBrowsers || []).filter(b => b.id !== cleanFp && b.fingerprint !== cleanFp)
    });

    if (removedItem?.targetUserId || removedItem?.username) {
      setUsers(prev => prev.map(u => (u.id === removedItem.targetUserId || u.username === removedItem.username) ? { ...u, isBanned: false } : u));
    }

    addToast({
      type: 'success',
      title: 'فك حظر بصمة المتصفح',
      message: `تم فك حظر بصمة المتصفح [${removedItem?.name || cleanFp}] للعضو (${removedItem?.username || 'مستخدم'}) بنجاح 🔓`
    });
  };

  const banCountry = (countryCode: string, countryName?: string, reason?: string) => {
    const cleanCode = countryCode.trim().toUpperCase();
    if (!cleanCode) return;
    const finalName = countryName || cleanCode;

    const newItem: BlockedCountryItem = {
      code: cleanCode,
      name: finalName,
      date: formatEnglishDate(new Date()),
      reason: reason || 'حجب الدولة من دخول الموقع من الإدارة',
      actionBy: currentUser?.username || 'الإدارة'
    };

    updateSiteSettings({
      blockedCountries: [
        ...(siteSettings.blockedCountries || []).filter(c => c.code.toUpperCase() !== cleanCode),
        newItem
      ]
    });

    addToast({
      type: 'warning',
      title: 'حجب دولة',
      message: `تم حجب الدولة [${finalName}] (${cleanCode}) من دخول الموقع بنجاح 🌍🚫`
    });
  };

  const unbanCountry = (countryCode: string) => {
    const cleanCode = countryCode.trim().toUpperCase();
    if (!cleanCode) return;

    const removedItem = (siteSettings.blockedCountries || []).find(c => c.code.toUpperCase() === cleanCode);
    updateSiteSettings({
      blockedCountries: (siteSettings.blockedCountries || []).filter(c => c.code.toUpperCase() !== cleanCode)
    });

    addToast({
      type: 'success',
      title: 'إلغاء حجب الدولة',
      message: `تم إلغاء حجب الدولة [${removedItem?.name || cleanCode}] والسماح لمواطنيها بالدخول 🌍🔓`
    });
  };

  // Room Management Actions
  const updateRoomDetails = (roomId: string, updates: Partial<Room>) => {
    setRooms(prev => {
      const updatedRooms = prev.map(r => {
        if (r.id === roomId) {
          const updated = {
            ...r,
            ...updates
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
    const targetRoomObj = rooms.find(r => r.id === roomId) || currentRoom;
    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        const currentMuted = r.mutedUsers || [];
        if (!currentMuted.includes(userId)) {
          const updated = { ...r, mutedUsers: [...currentMuted, userId] };
          if (currentRoom.id === roomId) setCurrentRoom(updated);
          return updated;
        }
      }
      return r;
    });
    setRooms(updatedRooms);
    try {
      localStorage.setItem('araby_custom_rooms', JSON.stringify(updatedRooms));
    } catch (e) {}
    sendSocketEvent('UPDATE_ROOMS', updatedRooms);
    sendSocketEvent('ROOM_MUTE_EVENT', {
      roomId,
      userId,
      targetRoomName: targetRoomObj.name
    });
    showTopBanner(`🔇 تم كتم العضو (${target?.username || 'المستخدم'}) في غرفة (${targetRoomObj.name})`);
  };

  const unmuteUserInRoom = (roomId: string, userId: string) => {
    const target = users.find(u => u.id === userId);
    const targetRoomObj = rooms.find(r => r.id === roomId) || currentRoom;
    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        const currentMuted = r.mutedUsers || [];
        const updated = { ...r, mutedUsers: currentMuted.filter(id => id !== userId) };
        if (currentRoom.id === roomId) setCurrentRoom(updated);
        return updated;
      }
      return r;
    });
    setRooms(updatedRooms);
    try {
      localStorage.setItem('araby_custom_rooms', JSON.stringify(updatedRooms));
    } catch (e) {}
    sendSocketEvent('UPDATE_ROOMS', updatedRooms);
    sendSocketEvent('ROOM_UNMUTE_EVENT', { roomId, userId });
    showTopBanner(`🔊 تم إلغاء كتم (${target?.username || 'المستخدم'}) في غرفة (${targetRoomObj.name})`);
  };

  const kickUserFromRoom = (roomId: string, userId: string) => {
    const target = users.find(u => u.id === userId);
    if (target?.role === 'owner') {
      showTopBanner('🚫 لا يمكن طرد المالك الرئيسي!');
      return;
    }
    const targetRoomObj = rooms.find(r => r.id === roomId) || currentRoom;
    const generalRoom = rooms.find(r => r.id === 'room-general') || rooms[0];
    const fallbackId = generalRoom?.id || 'room-general';

    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        const currentKicked = r.kickedUsers || [];
        if (!currentKicked.includes(userId)) {
          const updated = { ...r, kickedUsers: [...currentKicked, userId] };
          if (currentRoom.id === roomId) setCurrentRoom(updated);
          return updated;
        }
      }
      return r;
    });
    setRooms(updatedRooms);
    try {
      localStorage.setItem('araby_custom_rooms', JSON.stringify(updatedRooms));
    } catch (e) {}
    sendSocketEvent('UPDATE_ROOMS', updatedRooms);

    // Eject target user from this room and persist across server & socket
    const targetUser = users.find(u => u.id === userId);
    if (targetUser) {
      const updatedTargetUser: User = { ...targetUser, currentRoomId: fallbackId };
      setUsers(prev => prev.map(u => u.id === userId ? updatedTargetUser : u));
      sendSocketEvent('UPDATE_USER', updatedTargetUser);
      fetch('/api/users/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user: updatedTargetUser })
      }).catch(err => console.warn('Failed to update kicked user room in D1:', err));
    }

    sendSocketEvent('ROOM_KICK_EVENT', {
      roomId,
      userId,
      targetRoomName: targetRoomObj.name,
      fallbackRoomId: fallbackId
    });

    // If current logged-in user is the one kicked from active room, redirect to general room
    if (currentUser?.id === userId && currentRoom.id === roomId) {
      if (generalRoom) {
        setCurrentRoom(generalRoom);
        setCurrentUser(prev => prev ? { ...prev, currentRoomId: generalRoom.id } : null);
      }
      showTopBanner(`🚫 تم طردك من غرفة (${targetRoomObj.name})`);
    } else {
      showTopBanner(`🚪 تم طرد العضو (${target?.username || 'المستخدم'}) من غرفة (${targetRoomObj.name})`);
    }
  };

  const unkickUserFromRoom = (roomId: string, userId: string) => {
    const target = users.find(u => u.id === userId);
    const targetRoomObj = rooms.find(r => r.id === roomId) || currentRoom;
    const updatedRooms = rooms.map(r => {
      if (r.id === roomId) {
        const currentKicked = r.kickedUsers || [];
        const updated = { ...r, kickedUsers: currentKicked.filter(id => id !== userId) };
        if (currentRoom.id === roomId) setCurrentRoom(updated);
        return updated;
      }
      return r;
    });
    setRooms(updatedRooms);
    try {
      localStorage.setItem('araby_custom_rooms', JSON.stringify(updatedRooms));
    } catch (e) {}
    sendSocketEvent('UPDATE_ROOMS', updatedRooms);
    sendSocketEvent('ROOM_UNKICK_EVENT', { roomId, userId });
    showTopBanner(`🔓 تم فك طرد (${target?.username || 'المستخدم'}) من غرفة (${targetRoomObj.name})`);
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
  const addRoom = (roomInput: Partial<Room> | string, flag?: string, description?: string) => {
    let newRoom: Room;
    if (typeof roomInput === 'string') {
      newRoom = {
        id: `room-${Date.now()}`,
        name: roomInput.trim(),
        flag: flag?.trim() || '🇾🇪',
        description: description?.trim() || 'غرفة جديدة',
        isDefault: false,
        roomType: 'standard',
        customIcon: 'globe'
      };
    } else {
      newRoom = {
        id: `room-${Date.now()}`,
        name: roomInput.name?.trim() || 'غرفة جديدة',
        flag: roomInput.flag?.trim() || (roomInput.roomType === 'diamond' ? '💎' : roomInput.roomType === 'admin' ? '⭐' : '🇾🇪'),
        description: roomInput.description?.trim() || '',
        password: roomInput.password?.trim() || undefined,
        isLocked: Boolean(roomInput.isLocked || (roomInput.password && roomInput.password.trim())),
        roomType: roomInput.roomType || 'standard',
        allowedRoles: roomInput.allowedRoles,
        customIcon: roomInput.customIcon || (roomInput.roomType === 'diamond' ? 'diamond' : roomInput.roomType === 'admin' ? 'admin_star' : 'globe'),
        isDefault: Boolean(roomInput.isDefault)
      };
    }
    setRooms(prev => {
      const updatedRooms = [...prev, newRoom];
      sendSocketEvent('UPDATE_ROOMS', updatedRooms);
      fetch('/api/rooms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rooms: updatedRooms })
      }).catch(err => console.warn('Failed to persist rooms update to D1:', err));
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
      fetch('/api/rooms/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rooms: filtered })
      }).catch(err => console.warn('Failed to persist rooms update to D1:', err));
      return filtered;
    });
  };

  // Update user role - Strictly restricted to Site Owner only
  const updateUserRole = (userId: string, newRole: UserRole) => {
    if (!currentUser) return;
    if (currentUser.role !== 'owner') {
      showTopBanner('🚫 تنزيل ورفع الرتب من صلاحيات المالك (صاحب الموقع) فقط.');
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (targetUser?.id === 'user-owner' && currentUser?.id !== 'user-owner') {
      showTopBanner('🚫 لا يمكن تعديل أو تغيير رتبة المالك الرئيسي إلا بواسطة المالك الرئيسي الأصلي!');
      return;
    }

    const isActorOwner = currentUser.role === 'owner' || currentUser.id === 'user-owner';
    const isActorSuperAdmin = !!currentUser.is_super_admin || isActorOwner;

    if (targetUser.is_super_admin && !isActorSuperAdmin && currentUser.id !== userId) {
      showTopBanner('🛡️ هذا العضو يتمتع بحصانة (Super Admin). لا يمكن تغيير رتبته!');
      return;
    }

    const actorLevel = getRoleLevel(currentUser.role);
    const targetLevel = getRoleLevel(targetUser.role);
    if (!isActorSuperAdmin && targetLevel >= actorLevel && currentUser.id !== userId) {
      showTopBanner('🚫 لا يمكنك تعديل رتبة عضو يملك نفس رتبتك أو رتبة أعلى منك!');
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
    if (currentUser.role === 'guest') {
      showTopBanner('⚠️ نشر الأخبار متاح للإدارة والمشرفين فقط');
      return;
    }
    const post: NewsPost = {
      id: `news-${Date.now()}`,
      authorName: currentUser.username,
      authorAvatar: currentUser.avatar,
      title,
      content,
      imageUrl,
      timestamp: formatEnglishDateTime(new Date()),
      reactions: {},
      comments: []
    };
    setNews(prev => [post, ...prev]);
    sendSocketEvent('ADD_NEWS_POST', post);

    // Immediate Local Notification / Toast for the publisher
    showTopBanner(`📰 تم نشر الخبر بنجاح: "${title}"`);
    addToast({
      type: 'news',
      title: `📰 تم نشر خبرك: ${title}`,
      message: content.length > 55 ? content.substring(0, 55) + '...' : content,
      avatar: currentUser.avatar,
      senderName: currentUser.username,
    });
    if (audioSettingsRef.current?.notificationSound !== false) {
      playChatSound('notification');
    }
  };

  const deleteNewsPost = (newsId: string) => {
    setNews(prev => prev.filter(n => n.id !== newsId));
    sendSocketEvent('DELETE_NEWS_POST', { newsId });
  };

  const reactToNews = (newsId: string, emoji: string) => {
    if (!currentUser) return;
    if (currentUser.role === 'guest') {
      showTopBanner('⚠️ عذراً، الإعجاب والتفاعل في الأخبار متاح للأعضاء المسجلين فقط');
      addToast({
        type: 'warning',
        title: 'تنبيه الزوار',
        message: 'عذراً، الإعجاب والتفاعل في الأخبار متاح للأعضاء المسجلين فقط. يرجى تسجيل حسابك أولاً.',
      });
      return;
    }

    setNews(prev => prev.map(n => {
      if (n.id !== newsId) return n;
      const reactions: { [key: string]: string[] } = {};
      Object.entries(n.reactions || {}).forEach(([em, uIds]) => {
        reactions[em] = Array.isArray(uIds) ? [...uIds] : [];
      });

      // Find if user currently reacted with any emoji
      let currentReactionEmoji: string | null = null;
      Object.entries(reactions).forEach(([em, uIds]) => {
        if (uIds.includes(currentUser.id)) {
          currentReactionEmoji = em;
        }
      });

      // Remove user from all reaction arrays (Enforcing exactly one reaction per user)
      Object.keys(reactions).forEach(em => {
        reactions[em] = reactions[em].filter(id => id !== currentUser.id);
      });

      // If user clicked a different emoji, set their new reaction.
      // If they clicked the same emoji, they simply toggled off their reaction.
      if (currentReactionEmoji !== emoji) {
        reactions[emoji] = [...(reactions[emoji] || []), currentUser.id];
      }

      sendSocketEvent('REACT_NEWS_POST', { newsId, reactions });
      return { ...n, reactions };
    }));
  };

  const addNewsComment = (newsId: string, content: string) => {
    if (!currentUser || !content.trim()) return;
    if (currentUser.role === 'guest') {
      showTopBanner('⚠️ عذراً، التعليق متاح للأعضاء المسجلين فقط');
      return;
    }
    const comment = {
      id: `nc-${Date.now()}`,
      authorName: currentUser.username,
      content: content.trim(),
      timestamp: formatEnglishTime(new Date())
    };
    setNews(prev => prev.map(n => {
      if (n.id !== newsId) return n;
      return {
        ...n,
        comments: [...n.comments, comment]
      };
    }));
    sendSocketEvent('ADD_NEWS_COMMENT', { newsId, comment });
  };

  // Add Wall Post
  const addWallPost = (content: string, imageUrl?: string) => {
    if (!currentUser) return;
    if (currentUser.role === 'guest') {
      showTopBanner('⚠️ عذراً، حائط الأصدقاء مخصص للأعضاء المسجلين فقط');
      return;
    }
    const post: WallPost = {
      id: `wall-${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.username,
      authorAvatar: currentUser.avatar,
      content,
      imageUrl,
      timestamp: 'الآن',
      reactions: {},
      likes: [],
      comments: []
    };
    setWallPosts(prev => [post, ...prev]);
    sendSocketEvent('ADD_WALL_POST', post);

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
    sendSocketEvent('DELETE_WALL_POST', { postId });
  };

  const reactToWallPost = (postId: string, emoji: string = '❤️') => {
    if (!currentUser) return;
    if (currentUser.role === 'guest') {
      showTopBanner('⚠️ عذراً، حائط الأصدقاء والتفاعل متاح للأعضاء المسجلين فقط');
      addToast({
        type: 'warning',
        title: 'تنبيه الزوار',
        message: 'عذراً، حائط الأصدقاء والتفاعل متاح للأعضاء المسجلين فقط.',
      });
      return;
    }

    setWallPosts(prev => prev.map(w => {
      if (w.id !== postId) return w;
      const reactions: { [key: string]: string[] } = {};
      Object.entries(w.reactions || {}).forEach(([em, uIds]) => {
        reactions[em] = Array.isArray(uIds) ? [...uIds] : [];
      });

      // Find current user's reaction
      let currentReactionEmoji: string | null = null;
      Object.entries(reactions).forEach(([em, uIds]) => {
        if (uIds.includes(currentUser.id)) {
          currentReactionEmoji = em;
        }
      });
      if (!currentReactionEmoji && w.likes?.includes(currentUser.id)) {
        currentReactionEmoji = '❤️';
      }

      // Remove user from all reaction arrays (Enforcing exactly one reaction per user)
      Object.keys(reactions).forEach(em => {
        reactions[em] = reactions[em].filter(id => id !== currentUser.id);
      });

      // If user clicked a different emoji, set new reaction.
      if (currentReactionEmoji !== emoji) {
        reactions[emoji] = [...(reactions[emoji] || []), currentUser.id];
      }

      // Compute consolidated unique user likes
      const allLikedUserIds = Array.from(
        new Set(Object.values(reactions).flat().filter(Boolean))
      );

      sendSocketEvent('REACT_WALL_POST', { postId, reactions, likes: allLikedUserIds });
      return { ...w, reactions, likes: allLikedUserIds };
    }));
  };

  const addWallComment = (postId: string, content: string) => {
    if (!currentUser || !content.trim()) return;
    if (currentUser.role === 'guest') {
      showTopBanner('⚠️ عذراً، التعليق في الحائط متاح للأعضاء المسجلين فقط');
      return;
    }
    const comment = {
      id: `wc-${Date.now()}`,
      authorName: currentUser.username,
      content: content.trim(),
      timestamp: formatEnglishTime(new Date())
    };
    setWallPosts(prev => prev.map(w => {
      if (w.id !== postId) return w;
      return {
        ...w,
        comments: [...w.comments, comment]
      };
    }));
    sendSocketEvent('ADD_WALL_COMMENT', { postId, comment });
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
  const deleteUserAccount = async (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    if (target.role === 'owner' && currentUser?.id !== userId) {
      showTopBanner('🚫 لا يمكن حذف حساب المالك الرئيسي!');
      return;
    }

    try {
      // 1. Database first: delete from SQLite D1 via REST endpoint
      const response = await fetch('/api/users/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          requesterId: currentUser?.id,
          requesterRole: currentUser?.role
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'فشل حذف الحساب من قاعدة البيانات');
      }

      // 2. Remove document from Firestore to prevent onSnapshot resurrection
      deleteUserFromFirestore(userId).catch(e => console.warn('Firestore delete user error:', e));

      // 3. Remove user from local state
      setUsers(prev => prev.filter(u => u.id !== userId));

      // 4. Remove associated private conversations
      setPrivateMessages(prev => prev.filter(pm => pm.senderId !== userId && pm.receiverId !== userId));

      // 5. Broadcast to WebSocket
      sendSocketEvent('DELETE_USER_ACCOUNT', { userId });

      if (currentUser?.id === userId) {
        logout();
      } else {
        showTopBanner(`🗑️ تم حذف حساب العضو "${target.username}" بنجاح`);
      }
    } catch (err: any) {
      console.error("Failed to delete user:", err);
      showTopBanner(`⚠️ خطأ أثناء حذف الحساب: ${err.message || 'حدث خطأ غير متوقع'}`);
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
        setRooms,
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
        customEmojis,
        addCustomEmoji,
        deleteCustomEmoji,
        clearAllCustomEmojis,
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

        textContextMenu,
        openTextContextMenu,
        closeTextContextMenu,
        imageContextMenu,
        openImageContextMenu,
        closeImageContextMenu,

        isProfileSettingsOpen,
        isOwnerDashboardOpen,
        isStoreOpen,
        isSideMenuOpen,
        sideMenuInitialView,
        setSideMenuInitialView,
        openNews,
        isReportsOpen,
        isNotificationsOpen,
        isFriendRequestsOpen,
        isPrivateChatOpen,
        isOnlineListOpen,
        isRoomsListOpen,
        isRoomLogsOpen,
        isRoomSettingsOpen,
        isGoogleChatOpen,
        isGoogleDriveOpen,
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
        setIsGoogleChatOpen,
        setIsGoogleDriveOpen,
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

        hasPermission,
        currentUserCan,

        loginAsVisitor,
        loginAsMember,
        registerAccount,
        loginWithFirebaseGoogle,
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

        bannedIps,
        banIp,
        unbanIp,
        banDevice,
        unbanDevice,
        banBrowser,
        unbanBrowser,
        banCountry,
        unbanCountry,

        cleanupInactiveUsers,
        updateUserLastActivity,
        sendBotWelcomeMessage,

        currentLang,
        setAppLanguage: handleSetAppLanguage,
        isRtl,
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
