export type UserRole = 'visitor' | 'member' | 'vip' | 'moderator' | 'management' | 'admin' | 'owner';

export type RoomRole = 'none' | 'room_moderator' | 'room_supervisor' | 'room_owner';

export type Gender = 'male' | 'female' | 'other';

export type OnlineStatus = 'online' | 'away' | 'busy';

export type PrivatePrivacySetting = 'everyone' | 'members' | 'friends' | 'none';

export type ThemeMode = 'dark' | 'light' | 'emerald' | 'sapphire' | 'rose' | 'purple';

export interface User {
  id: string;
  username: string;
  password?: string;
  email?: string;
  role: UserRole;
  roomRole?: RoomRole;
  gender: Gender;
  age: number | string; // 16-99 or 'عدم الإظهار'
  avatar?: string; // empty means default placeholder icon
  wallCover?: string;
  statusMessage?: string;
  bio?: string;
  coins: number;
  likes: number;
  likedBy?: string[]; // array of user IDs
  country: string;
  countryFlag?: string;
  hideCountry?: boolean;
  showCountryFlag?: boolean;
  currentRoomId: string;
  joinedDate: string;
  lastSeen: string;
  usernameColor?: string;
  usernameFontSize?: string;
  fontFamily?: string;
  usernameBgGradient?: string;
  isNeon?: boolean;
  fontColor?: string;
  fontSize?: number;
  isStealth?: boolean; // Owner stealth mode
  privatePrivacy: PrivatePrivacySetting;
  onlineStatus: OnlineStatus;
  ip?: string;
  locationMap?: string;
  previousAccount?: string;
  otherAccounts?: string[];
  linkedAccounts?: string[];
  isMuted?: boolean;
  muteUntil?: string; // ISO date or string
  isKicked?: boolean;
  kickUntil?: string;
  isBanned?: boolean;
  friends?: string[]; // user IDs
  ignores?: string[]; // user IDs
  blockedUsers?: string[]; // user IDs blocked by this user
  deletionScheduledDate?: string;
  theme?: ThemeMode;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  senderGender: Gender;
  senderAvatar?: string;
  senderUsernameColor?: string;
  senderUsernameFontSize?: string;
  text: string;
  textColor?: string;
  textFontSize?: string;
  textWeight?: string;
  type: 'text' | 'image' | 'voice' | 'youtube' | 'system';
  mediaUrl?: string;
  voiceDuration?: number; // seconds
  timestamp: string; // e.g. "17:15"
  date: string; // e.g. "16/08/2026"
  reactions?: Record<string, string[]>; // emoji -> array of user IDs who reacted
  targetUserId?: string;
  targetUsername?: string;
}

export interface RoomStaffMember {
  userId: string;
  username: string;
  role: RoomRole;
  avatar?: string;
  assignedAt?: string;
}

export interface Room {
  id: string;
  name: string;
  flag: string;
  description: string;
  baseUserCount?: number;
  isDefault?: boolean;
  password?: string;
  isLocked?: boolean;
  welcomeMessage?: string; // Custom automatic welcome greeting for this room
  autoWelcomeEnabled?: boolean; // Whether auto-welcome bot message is enabled
  mutedUsers?: string[]; // Array of muted user IDs in this room
  kickedUsers?: string[]; // Array of kicked/banned user IDs from this room
  roomStaff?: RoomStaffMember[]; // Array of honorary room staff (مشرف غرفة / مدير غرفة / مالك غرفة)
}

export interface PrivateMessage {
  id: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  receiverId: string;
  text: string;
  mediaUrl?: string;
  voiceDuration?: number;
  type: 'text' | 'image' | 'voice';
  timestamp: string;
  isRead: boolean;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  receiverId: string;
  timestamp: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reportedUserId: string;
  reportedUserName: string;
  messageText: string;
  reason: 'سبام' | 'تنمر' | 'محتوى غير لائق' | 'اساءة' | 'محتوى احتيال' | 'محتوى غير مناسب' | 'احتيال' | 'كلام مسيء' | 'غير ذلك' | string;
  type?: 'chat' | 'private' | 'profile' | string;
  category?: 'spam' | 'bullying' | 'inappropriate' | 'other' | string;
  details?: string;
  timestamp: string;
}

export interface NewsComment {
  id: string;
  authorName: string;
  content: string;
  timestamp: string;
}

export interface NewsPost {
  id: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  reactions: { [emoji: string]: string[] }; // emoji -> array of userIds
  comments: NewsComment[];
}

export interface WallComment {
  id: string;
  authorName: string;
  content: string;
  timestamp: string;
}

export interface WallPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  imageUrl?: string;
  timestamp: string;
  likes: string[]; // array of userIds
  comments: WallComment[];
}

export interface Notification {
  id: string;
  userId: string;
  senderId?: string;
  senderName?: string;
  senderAvatar?: string;
  senderGender?: Gender;
  type: 'like' | 'friend' | 'friend_accept' | 'mute' | 'kick' | 'ban' | 'role_change' | 'name_change' | 'wall_post' | 'system' | 'private_message' | 'mention';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface ModLogEntry {
  id: string;
  targetUserId: string;
  targetUsername: string;
  actionBy: string;
  actionType: 'mute' | 'kick' | 'unmute' | 'unkick' | 'ban' | 'unban' | 'edit_name' | 'delete_account';
  reason: string;
  durationMinutes?: number;
  timestamp: string;
}

export type RoomActivityType =
  | 'join'
  | 'leave'
  | 'delete_message'
  | 'clear_chat'
  | 'update_rules'
  | 'mute'
  | 'unmute'
  | 'kick'
  | 'unkick'
  | 'ban'
  | 'unban'
  | 'role_change'
  | 'room_created'
  | 'delete_account'
  | 'broadcast'
  | 'system_message';

export interface RoomActivityLog {
  id: string;
  roomId: string;
  roomName: string;
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  targetName?: string;
  actionType: RoomActivityType;
  details: string;
  timestamp: string;
  date: string;
}

export interface StoreItem {
  id: string;
  role: 'vip' | 'moderator';
  title: string;
  price: number;
  badge: string;
  requiresOwnerApproval: boolean;
}

export interface AudioSettings {
  publicSound?: boolean;
  privateSound?: boolean;
  friendRequestSound?: boolean;
  mentionSound?: boolean;
  notifSound?: boolean;
  reportAlertSound?: boolean;
  generalBroadcastSound?: boolean;
}

export interface SiteSettings {
  siteName: string;
  siteLogoEmoji: string;
  timeZone: string;
  defaultLanguage: string;
  defaultTheme: 'dark' | 'light';
  primaryColor: string;
  welcomePanoramaUrl: string;
  panoramaCarouselEnabled: boolean;
  allowGuestChat: boolean;
  allowGuestVoice: boolean;
  maxMessagesPerMinute: number;
  maxMessageLength: number;
  autoBotAntiSpam: boolean;
  paymentKuraimi: boolean;
  paymentUsdt: boolean;
  paymentPayeer: boolean;
  paymentMoneygram: boolean;
  supportEmail: string;
  facebookUrl: string;
  telegramUrl: string;
  whatsappNumber: string;
  showOnlineCount: boolean;
  showThirdPartyAds: boolean;
  sendEmailNotifications: boolean;
  // Enhanced Anti-Flood & Moderation Features
  antiFloodEnabled?: boolean;
  floodMaxMessages?: number;
  floodWindowSeconds?: number;
  floodMaxRepeated?: number;
  floodAction?: 'warn' | 'mute' | 'kick' | 'ban';
  floodMuteDurationMinutes?: number;
  antiSpamLinks?: boolean;
  antiSpamCaps?: boolean;
  guestChatMode?: 'allowed' | 'silent' | 'registered_only';
  requireEmailVerification?: boolean;
  enableCookieBan?: boolean;
}

export interface IPModerationRecord {
  id: string;
  ip: string;
  type: 'ban' | 'kick' | 'mute';
  reason: string;
  targetUserId?: string;
  targetUsername?: string;
  actionBy?: string;
  createdAt: string;
  expiresAt?: string; // ISO string for temporary kick/mute, or undefined for permanent ban
}

export interface ToastNotification {
  id: string;
  type: 'private_message' | 'user_join' | 'info' | 'success';
  title: string;
  message: string;
  avatar?: string;
  gender?: Gender;
  role?: UserRole;
  senderName?: string;
  senderId?: string;
  roomId?: string;
  roomName?: string;
  timestamp: string;
  duration?: number;
}

export type BlockActionType = 'block' | 'unblock' | 'ban' | 'unban';

export interface BlockConfirmState {
  isOpen: boolean;
  targetUser: {
    id: string;
    username: string;
    avatar?: string;
    role?: UserRole;
    gender?: Gender;
  } | null;
  actionType: BlockActionType;
  onConfirm?: () => void;
}
