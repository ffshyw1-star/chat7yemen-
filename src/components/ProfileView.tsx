import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import { User, UserRole } from '../types';
import {
  getRankEmoji,
  getRankEmojiClass,
  getRankTitle,
  isOwner as checkIsOwner,
  isSelf as checkIsSelf,
  isStaff,
  isManagementOrHigher as checkIsManagementOrHigher,
  isAdminOrOwner,
  canViewMemberRecordButton,
  canAccessMemberRecord,
  canBeIgnored,
  canViewMuteLogs,
  canPerformModActions,
  canEditPhotos,
  canEditProfile,
  formatLastSeenDateTime
} from '../utils/permissions';
import { getEnglishCountryName } from '../utils/geoip';
import { formatEnglishNumber, toEnglishDigits } from '../utils/dateUtils';
import {
  X, Zap, FileText, Heart, MessageSquare, UserPlus, Ban, Unlock,
  Coins, MapPin, Shield, AlertTriangle, Search, Lock,
  Settings, ShoppingBag, UserX, VolumeX, Edit3, Flag,
  Smartphone, Clock, Sparkles, Check, Globe, Menu,
  Eye, Trash2, CheckCircle, Equal, Camera, ArrowUp, ArrowDown, Paperclip,
  ArrowLeft, Palette, Paintbrush, CheckCircle2, Star, Save, Key,
  User as UserIcon, Briefcase
} from 'lucide-react';

const USERNAME_COLOR_PALETTE = [
  { name: 'ذهبي كلاسيكي', color: '#f59e0b' },
  { name: 'أصفر فاقع', color: '#eab308' },
  { name: 'أحمر ناري', color: '#ef4444' },
  { name: 'وردي أنيق', color: '#ec4899' },
  { name: 'أزرق ملكي', color: '#3b82f6' },
  { name: 'أزرق سماوي', color: '#06b6d4' },
  { name: 'أخضر زمردي', color: '#10b981' },
  { name: 'أخضر ليموني', color: '#84cc16' },
  { name: 'بنفسجي فاخر', color: '#8b5cf6' },
  { name: 'أرجواني غامق', color: '#a855f7' },
  { name: 'برتقالي متوهج', color: '#f97316' },
  { name: 'أسود داكن', color: '#1e293b' },
  { name: 'نيون أزرق', color: '#00f0ff' },
  { name: 'نيون أخضر', color: '#39ff14' },
  { name: 'نيون وردي', color: '#ff007f' },
  { name: 'نيون ذهبي', color: '#ffd700' },
];

interface ProfileViewProps {
  user?: User | null;
  onClose?: () => void;
  isModal?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  onClose,
  isModal = true
}) => {
  const {
    selectedUserForProfile, setSelectedUserForProfile,
    currentUser, currentRoom, likeUser, sendFriendRequest, toggleIgnore, toggleBlockUser,
    requestBlockConfirm,
    setActivePrivateUserId, setIsPrivateChatOpen, setIsSideMenuOpen,
    modLogs, users, rooms, setIsProfileSettingsOpen, setIsStoreOpen,
    setIsRoomSettingsOpen, setIsOwnerDashboardOpen, banList, ipModerations,
    moderatorAction, muteUserInRoom, unmuteUserInRoom, kickUserFromRoom, unkickUserFromRoom, showTopBanner,
    updateUserRole, ownerUpdateUser, updateUserProfile, reportUserMessage
  } = useChat();

  const [activeTab, setActiveTab] = useState<'my_info' | 'friends' | 'system_info' | 'mute_log'>('my_info');
  
  // Member Record Modal (📝 Pencil Box on Top Left)
  const [showMemberLogModal, setShowMemberLogModal] = useState(false);
  const [memberLogTab, setMemberLogTab] = useState<'options' | 'history'>('options');

  // Header Dropdown Popover Menu (≡)
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);

  // Moderation Command Modal / Drawer (⚡)
  const [showCommandOverlay, setShowCommandOverlay] = useState(false);
  const [cmdSubTab, setCmdSubTab] = useState<'basic' | 'room_options'>('basic');
  const [cmdAction, setCmdAction] = useState<'none' | 'mute' | 'kick'>('none');
  const [cmdMuteReason, setCmdMuteReason] = useState('مخالفة النظام والقوانين');
  const [cmdMuteDuration, setCmdMuteDuration] = useState<number>(5);
  const [cmdKickReason, setCmdKickReason] = useState('مخالفة نظام الغرفة');
  const [cmdKickDuration, setCmdKickDuration] = useState<number>(10);

  // Status toggle button (🟰)
  const [showAltActions, setShowAltActions] = useState(false);

  // Owner Editing Controls for Member Record Modal (خيارات)
  const [isEditingStatusMessage, setIsEditingStatusMessage] = useState(false);
  const [newStatusInput, setNewStatusInput] = useState('');

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [newBioInput, setNewBioInput] = useState('');

  // Cleared History Users State (Owner action: محو سجل المستخدم)
  const [clearedUserIds, setClearedUserIds] = useState<string[]>([]);

  // Name Editing State
  const [isEditingName, setIsEditingName] = useState(false);
  const [newNameInput, setNewNameInput] = useState('');

  // Photo Edit Modal (🔍) for Management to Owner
  const [showPhotoEditModal, setShowPhotoEditModal] = useState(false);
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [newWallCoverUrl, setNewWallCoverUrl] = useState('');

  // Native Photo Upload File Inputs
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const wallInputRef = useRef<HTMLInputElement>(null);

  // Sub-option active panel in Member Log Modal (خيارات: تغيير رتبة / تغير اسم / تغير لون / تحرير حالة)
  const [memberLogActiveSubOption, setMemberLogActiveSubOption] = useState<'none' | 'rank' | 'name' | 'color' | 'status'>('none');
  const [selectedRank, setSelectedRank] = useState<UserRole>('member');
  const [selectedNameColor, setSelectedNameColor] = useState<string>('#f59e0b');

  // Dedicated Popup Modals Matching Screenshots
  const [showNameChangeModal, setShowNameChangeModal] = useState(false);
  const [showRankChangeModal, setShowRankChangeModal] = useState(false);
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');

  const initialTarget = user || selectedUserForProfile || currentUser;
  const target = users.find(u => u.id === initialTarget?.id) || initialTarget;

  useEffect(() => {
    if (target) {
      setSelectedRank(target.role);
      setSelectedNameColor(target.usernameColor || '#f59e0b');
    }
  }, [target?.id, target?.role, target?.usernameColor]);

  // Helper to get linked / other accounts by IP
  const getOtherAccountsList = (targetUser: User): string[] => {
    const list: string[] = [];
    if (targetUser.otherAccounts) {
      targetUser.otherAccounts.forEach(a => { if (a && a !== targetUser.username && !list.includes(a)) list.push(a); });
    }
    if (targetUser.linkedAccounts) {
      targetUser.linkedAccounts.forEach(a => { if (a && a !== targetUser.username && !list.includes(a)) list.push(a); });
    }
    // Also find all active/registered users with same IP
    const currentIp = targetUser.ip || '197.234.12.89';
    if (currentIp) {
      users.forEach(u => {
        if ((u.ip === currentIp || (u.id === 'user-1' && currentIp === '197.234.12.89')) && u.username !== targetUser.username && !list.includes(u.username)) {
          list.push(u.username);
        }
      });
      // Check stored ip map in localStorage
      try {
        const rawMap = localStorage.getItem('araby_ip_usernames_map');
        if (rawMap) {
          const map = JSON.parse(rawMap);
          const fromIp = map[currentIp] || [];
          fromIp.forEach((name: string) => {
            if (name && name !== targetUser.username && !list.includes(name)) {
              list.push(name);
            }
          });
        }
      } catch (e) { console.error(e); }
    }
    return list;
  };

  const getPreviousAccountDisplay = (targetUser: User): string => {
    if (targetUser.previousAccount) return targetUser.previousAccount;
    const others = getOtherAccountsList(targetUser);
    return others.length > 0 ? others[0] : 'لا يوجد';
  };

  const getOtherAccountsDisplay = (targetUser: User): string => {
    const others = getOtherAccountsList(targetUser);
    return others.length > 0 ? others.join('، ') : 'لا يوجد';
  };

  if (!target) return null;

  const isVisitorTarget = target.role === 'visitor';
  const isSystemTarget = target.id === 'user-system' || target.username === 'System';
  const hideFriendsTab = isVisitorTarget || isSystemTarget;
  const canSeeMuteLogTab = canViewMuteLogs(currentUser, target);

  // Role permissions checks
  const canUserEditTargetPhotos = canEditPhotos(currentUser, target);
  const canUserEditTargetName = canEditProfile(currentUser, target);

  const isTargetMuted = Boolean(
    target && !isSystemTarget && (
      target.isMuted ||
      (target.muteUntil && new Date(target.muteUntil).getTime() > Date.now()) ||
      (currentRoom?.mutedUsers || []).includes(target.id)
    )
  );

  const isTargetKicked = Boolean(
    target && !isSystemTarget && (
      (currentRoom?.kickedUsers || []).includes(target.id)
    )
  );

  const isTargetBanned = Boolean(
    target && !isSystemTarget && (
      target.isBanned ||
      (banList || []).includes(target.id) ||
      (target.ip && (banList || []).includes(target.ip)) ||
      (ipModerations || []).some(rec => rec.type === 'ban' && (rec.targetUserId === target.id || (target.ip && rec.ip === target.ip)))
    )
  );

  // Fallbacks if active tab is hidden/restricted
  useEffect(() => {
    if (hideFriendsTab && activeTab === 'friends') {
      setActiveTab('my_info');
    }
    if (!canSeeMuteLogTab && activeTab === 'mute_log') {
      setActiveTab('my_info');
    }
  }, [hideFriendsTab, canSeeMuteLogTab, activeTab]);

  const rolesHierarchy: UserRole[] = ['visitor', 'member', 'vip', 'moderator', 'management', 'admin', 'owner'];

  // Handle direct role selection from dropdown (Owner only)
  const handleRoleSelectChange = (newRole: UserRole) => {
    if (!currentUser || currentUser.role !== 'owner') return;
    if (target.role === 'owner' && currentUser.id !== target.id) {
      alert('لا يمكنك تعديل رتبة المالك الرئيسي!');
      return;
    }
    updateUserRole(target.id, newRole);
    if (currentUser.id !== target.id) {
      ownerUpdateUser(target.id, { role: newRole });
    }
    showTopBanner(`👑 تم تغيير رتبة العضو "${target.username}" إلى (${getRankTitle(newRole)})`);
  };

  // Name Change Handler with Role Permissions
  const handleSaveNewName = () => {
    if (!newNameInput.trim()) {
      alert('الرجاء كتابة اسم صحيح');
      return;
    }
    const trimmedName = newNameInput.trim();
    if (!canUserEditTargetName) {
      alert('🚫 ليس لديك الصلاحية لتعديل اسم هذا العضو بحسب الرتبة!');
      return;
    }

    if (currentUser?.id === target.id) {
      updateUserProfile({ username: trimmedName });
    } else {
      ownerUpdateUser(target.id, { username: trimmedName });
    }
    setIsEditingName(false);
    showTopBanner(`✨ تم تغيير اسم العضو إلى (${trimmedName}) بنجاح وحفظه في السيرفر`);
  };

  // Username Color Handler
  const handleSaveUsernameColor = (color: string) => {
    if (!currentUser) return;
    const canChange = checkIsOwner(currentUser) || checkIsManagementOrHigher(currentUser) || currentUser.id === target.id;
    if (!canChange) {
      alert('🚫 ليس لديك الصلاحية لتعديل لون اسم هذا العضو!');
      return;
    }
    setSelectedNameColor(color);
    if (currentUser.id === target.id) {
      updateUserProfile({ usernameColor: color });
    } else {
      ownerUpdateUser(target.id, { usernameColor: color });
    }
    showTopBanner(`🎨 تم تغيير وتطبيق لون اسم المستخدم (${target.username}) بنجاح`);
  };

  // Photo Upload Handlers with Role Permissions
  const triggerAvatarUpload = () => {
    if (!canUserEditTargetPhotos) {
      alert('🚫 ليس لديك الصلاحية لتعديل الصورة الشخصية لهذا العضو بحسب الرتبة!');
      return;
    }
    avatarInputRef.current?.click();
  };

  const triggerWallUpload = () => {
    if (!canUserEditTargetPhotos) {
      alert('🚫 ليس لديك الصلاحية لتعديل صورة الحائط لهذا العضو بحسب الرتبة!');
      return;
    }
    wallInputRef.current?.click();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (isSystemTarget) {
      if (!isOwner) {
        alert('🚫 المالك فقط من يملك الصلاحية لتعديل صورة حساب النظام (System)!');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        ownerUpdateUser(target.id || 'user-system', { avatar: result });
        showTopBanner('📸 تم تحديث صورة System بنجاح وحفظها في السيرفر');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
      return;
    }
    if (!canUserEditTargetPhotos) {
      alert('🚫 ليس لديك الصلاحية لتعديل الصورة الشخصية لهذا العضو بحسب الرتبة!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (currentUser?.id === target.id) {
        updateUserProfile({ avatar: result });
      } else {
        ownerUpdateUser(target.id, { avatar: result });
      }
      showTopBanner('📸 تم رفع وتحديث الصورة الشخصية وحفظها في السيرفر');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleWallFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!canUserEditTargetPhotos) {
      alert('🚫 ليس لديك الصلاحية لتعديل صورة الحائط لهذا العضو بحسب الرتبة!');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      if (currentUser?.id === target.id) {
        updateUserProfile({ wallCover: result });
      } else {
        ownerUpdateUser(target.id, { wallCover: result });
      }
      showTopBanner('🌄 تم رفع وتحديث صورة الحائط وحفظها في السيرفر');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveAvatar = () => {
    if (!canUserEditTargetPhotos) {
      showTopBanner('🚫 ليس لديك الصلاحية لحذف الصورة الشخصية لهذا العضو بحسب الرتبة!');
      return;
    }
    if (currentUser?.id === target.id) {
      updateUserProfile({ avatar: '' });
    } else {
      ownerUpdateUser(target.id, { avatar: '' });
    }
    showTopBanner('❌ تم حذف الصورة الشخصية وحفظ التغيير في السيرفر');
  };

  const handleRemoveWall = () => {
    if (!canUserEditTargetPhotos) {
      showTopBanner('🚫 ليس لديك الصلاحية لحذف صورة الغلاف لهذا العضو بحسب الرتبة!');
      return;
    }
    if (currentUser?.id === target.id) {
      updateUserProfile({ wallCover: '' });
    } else {
      ownerUpdateUser(target.id, { wallCover: '' });
    }
    showTopBanner('❌ تم حذف صورة الحائط وحفظ التغيير في السيرفر');
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setSelectedUserForProfile(null);
    }
  };

  const isMe = checkIsSelf(currentUser, target);
  const isOwner = currentUser?.role === 'owner';
  const isManagementOrHigher = ['management', 'admin', 'owner'].includes(currentUser?.role || '');
  const isModOrHigher = ['moderator', 'management', 'admin', 'owner'].includes(currentUser?.role || '');
  const isTargetIgnored = (currentUser?.blockedUsers || []).includes(target.id) || (currentUser?.ignores || []).includes(target.id);

  // Current room info for target user
  const targetRoom = rooms.find(r => r.id === target.currentRoomId) || rooms[0];

  // Target user's friends list (Strictly excluding System and Visitors)
  const friendUsers = users.filter(u =>
    target.friends?.includes(u.id) &&
    u.id !== 'user-system' &&
    u.id !== 'system' &&
    u.username !== 'System' &&
    u.role !== 'visitor'
  );
  const displayFriends = friendUsers;

  // Moderation logs for target user
  const targetModLogs = modLogs.filter(m => m.targetUserId === target.id || m.targetUsername === target.username);

  // Default sample history items matching the screenshot if no real logs exist
  const sampleHistoryLogs = [
    {
      id: 'sample-1',
      typeTitle: 'كتم',
      timestamp: '7:55 28/07',
      author: '༻الجلاد༺',
      duration: '2 دقائق',
      reason: 'ازعاج'
    },
    {
      id: 'sample-2',
      typeTitle: 'كتم',
      timestamp: '7:15 28/07',
      author: 'سرمدية الهوى',
      duration: '2 دقائق',
      reason: 'لا يوجد سبب مقدم'
    },
    {
      id: 'sample-3',
      typeTitle: 'كلمة الكتم',
      timestamp: '6:34 28/07',
      author: 'System',
      duration: '1 دقيقة',
      reason: 'كلمة غير لائقة'
    }
  ];

  const isHistoryCleared = clearedUserIds.includes(target.id);

  const historyDisplayLogs = (isSystemTarget || isHistoryCleared)
    ? []
    : (targetModLogs.length > 0
        ? targetModLogs.map(log => ({
            id: log.id,
            typeTitle: log.actionType === 'mute' ? 'كتم' : log.actionType === 'kick' ? 'طرد' : 'كلمة الكتم',
            timestamp: log.timestamp,
            author: log.actionBy,
            duration: `${log.durationMinutes || 2} دقائق`,
            reason: log.reason
          }))
        : sampleHistoryLogs);

  // Owner Handler: Save Status Message (تعديل حالة المستخدم)
  const handleSaveOwnerStatus = () => {
    if (!isOwner) return;
    const trimmed = newStatusInput.trim();
    if (isMe) {
      updateUserProfile({ statusMessage: trimmed });
    } else {
      ownerUpdateUser(target.id, { statusMessage: trimmed });
    }
    setIsEditingStatusMessage(false);
    showTopBanner('✨ تم تعديل حالة المستخدم بنجاح');
  };

  // Owner Handler: Save Bio (تعديل معلومات - النبذة)
  const handleSaveOwnerBio = () => {
    if (!isOwner) return;
    const trimmed = newBioInput.trim();
    if (isMe) {
      updateUserProfile({ bio: trimmed });
    } else {
      ownerUpdateUser(target.id, { bio: trimmed });
    }
    setIsEditingBio(false);
    showTopBanner('✨ تم تعديل معلومات العضو (النبذة) بنجاح');
  };

  // Owner Handler: Clear History Log (محو سجل المستخدم)
  const handleClearUserHistory = () => {
    if (!isOwner) return;
    if (confirm(`هل أنت متأكد من محو سجل العضو (${target.username}) بالكامل؟`)) {
      setClearedUserIds(prev => [...prev, target.id]);
      showTopBanner(`🗑️ تم محو سجل العضو (${target.username}) بنجاح`);
    }
  };

  // Execute Command Mute from ⚡
  const handleExecuteCmdMute = (duration?: number, reason?: string) => {
    if (target.role === 'owner') {
      alert('لا يمكنك كتم المالك الرئيسي!');
      return;
    }
    if (target.role === 'admin' && currentUser?.role !== 'owner') {
      alert('لا يمكنك كتم الأدمن! المالك فقط من يملك الصلاحية.');
      return;
    }
    const finalDuration = duration || cmdMuteDuration;
    const finalReason = (reason || cmdMuteReason).trim() || 'مخالفة النظام والقوانين';
    moderatorAction(target.id, 'mute', finalDuration, finalReason);
    setShowCommandOverlay(false);
    showTopBanner(`🔇 تم كتم العضو (${target.username}) لمدة ${finalDuration} دقيقة`);
  };

  // Execute Command Unmute from ⚡
  const handleExecuteCmdUnmute = () => {
    if (currentRoom) {
      unmuteUserInRoom(currentRoom.id, target.id);
    } else {
      moderatorAction(target.id, 'unmute', 0, 'إلغاء الكتم');
    }
    setShowCommandOverlay(false);
    showTopBanner(`🔊 تم إلغاء الكتم عن العضو (${target.username})`);
  };

  // Execute Command Kick from ⚡
  const handleExecuteCmdKick = (duration?: number, reason?: string) => {
    if (target.role === 'owner') {
      alert('لا يمكنك طرد المالك الرئيسي!');
      return;
    }
    if (target.role === 'admin' && currentUser?.role !== 'owner') {
      alert('لا يمكنك طرد الأدمن! المالك فقط من يملك الصلاحية.');
      return;
    }
    const finalDuration = duration || cmdKickDuration;
    const finalReason = (reason || cmdKickReason).trim() || 'مخالفة نظام الغرفة';
    moderatorAction(target.id, 'kick', finalDuration, finalReason);
    setShowCommandOverlay(false);
    showTopBanner(`👞 تم طرد العضو (${target.username})`);
  };

  // Execute Command Unkick from ⚡
  const handleExecuteCmdUnkick = () => {
    if (currentRoom) {
      unkickUserFromRoom(currentRoom.id, target.id);
    } else {
      moderatorAction(target.id, 'unkick', 0, 'إلغاء الطرد');
    }
    setShowCommandOverlay(false);
    showTopBanner(`🚪 تم إلغاء الطرد عن العضو (${target.username})`);
  };

  // Instant General Mute
  const handleInstantGeneralMute = () => {
    if (target.role === 'owner') {
      alert('لا يمكنك كتم المالك الرئيسي!');
      return;
    }
    if (target.role === 'admin' && currentUser?.role !== 'owner') {
      alert('لا يمكنك كتم الأدمن! المالك فقط من يملك الصلاحية.');
      return;
    }
    if (currentRoom) {
      muteUserInRoom(currentRoom.id, target.id);
    }
    setShowCommandOverlay(false);
    showTopBanner(`🔇 تم الكتم المباشر للعضو (${target.username})`);
  };

  // Instant Room Kick
  const handleInstantRoomKick = () => {
    if (target.role === 'owner') {
      alert('لا يمكنك طرد المالك الرئيسي!');
      return;
    }
    if (target.role === 'admin' && currentUser?.role !== 'owner') {
      alert('لا يمكنك طرد الأدمن! المالك فقط من يملك الصلاحية.');
      return;
    }
    if (currentRoom) {
      kickUserFromRoom(currentRoom.id, target.id);
    }
    setShowCommandOverlay(false);
    showTopBanner(`👞 تم الطرد المباشر للعضو (${target.username}) من الغرفة`);
  };

  // Permanent Ban / Unban (Owner / Admin)
  const handleOwnerBan = () => {
    if (target.role === 'owner') {
      showTopBanner('🚫 لا يمكنك حظر المالك الرئيسي!');
      return;
    }
    if (target.role === 'admin' && currentUser?.role !== 'owner') {
      showTopBanner('🚫 لا يمكنك حظر الأدمن! المالك فقط من يملك الصلاحية.');
      return;
    }
    const actionType = isTargetBanned ? 'unban' : 'ban';
    requestBlockConfirm(target, actionType, () => {
      if (isTargetBanned) {
        moderatorAction(target.id, 'unban', 0, 'فك حظر من الإدارة');
        setShowCommandOverlay(false);
        showTopBanner(`🔓 تم فك حظر العضو (${target.username}) بنجاح`);
      } else {
        moderatorAction(target.id, 'ban', 0, 'حظر دائم من الإدارة');
        setShowCommandOverlay(false);
        showTopBanner(`🚫 تم حظر العضو (${target.username}) نهائياً من الشات`);
      }
    });
  };

  // Delete Account (Owner)
  const handleDeleteAccount = () => {
    if (target.role === 'owner') {
      showTopBanner('🚫 لا يمكنك حذف حساب المالك الرئيسي!');
      return;
    }
    if (target.role === 'admin' && currentUser?.role !== 'owner') {
      showTopBanner('🚫 لا يمكنك حذف حساب الأدمن! المالك فقط من يملك الصلاحية.');
      return;
    }
    moderatorAction(target.id, 'delete_account', 0, 'حذف حساب من المالك');
    setShowCommandOverlay(false);
    handleClose();
    showTopBanner(`🗑️ تم حذف حساب العضو (${target.username}) بنجاح`);
  };

  // Photo Edit Handler (🔍)
  const handleSavePhotoEdits = () => {
    if (target.role === 'owner' && currentUser?.id !== target.id) {
      alert('لا يمكنك تعديل صور المالك الرئيسي!');
      return;
    }
    if (target.role === 'admin' && currentUser?.role !== 'owner' && currentUser?.id !== target.id) {
      alert('لا يمكنك تعديل صور الأدمن!');
      return;
    }
    const updates: Partial<User> = {};
    if (newAvatarUrl.trim()) updates.avatar = newAvatarUrl.trim();
    if (newWallCoverUrl.trim()) updates.wallCover = newWallCoverUrl.trim();
    
    ownerUpdateUser(target.id, updates);
    setShowPhotoEditModal(false);
    alert('تم تحديث الصور بنجاح ✨');
  };

  const handleDeleteProfilePhoto = () => {
    if (target.role === 'owner' && currentUser?.id !== target.id) {
      alert('لا يمكنك حذف الصورة الشخصية للمالك الرئيسي!');
      return;
    }
    if (target.role === 'admin' && currentUser?.role !== 'owner' && currentUser?.id !== target.id) {
      alert('لا يمكنك حذف الصورة الشخصية للأدمن!');
      return;
    }
    if (confirm('هل تريد حذف الصورة الشخصية لهذا العضو؟')) {
      ownerUpdateUser(target.id, { avatar: '' });
      alert('تم حذف الصورة الشخصية بنجاح ❌');
    }
  };

  const handleDeleteWallCover = () => {
    if (target.role === 'owner' && currentUser?.id !== target.id) {
      alert('لا يمكنك حذف صورة الغلاف للمالك الرئيسي!');
      return;
    }
    if (target.role === 'admin' && currentUser?.role !== 'owner' && currentUser?.id !== target.id) {
      alert('لا يمكنك حذف صورة الغلاف للأدمن!');
      return;
    }
    if (confirm('هل تريد حذف صورة الحائط/الغلاف لهذا العضو؟')) {
      ownerUpdateUser(target.id, { wallCover: '' });
      alert('تم حذف صورة الغلاف بنجاح ❌');
    }
  };

  const content = isSystemTarget ? (
    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative select-none text-slate-800 font-sans">
      {/* Hidden File Input for System Avatar Upload (Owner Only) */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* 1. System Header (Dark Teal #072a32) */}
      <div className="bg-[#072a32] p-4 sm:p-5 relative flex flex-col justify-between shrink-0 min-h-[160px] sm:min-h-[180px]">
        {/* Top Control Bar on Left: X (Close) & ≡ (Menu) */}
        <div className="flex items-center gap-2.5 z-20">
          {/* Close Button X */}
          <button
            onClick={handleClose}
            className="w-8 h-8 text-white hover:text-slate-200 flex items-center justify-center cursor-pointer transition-all"
            title="إغلاق"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Menu Button ≡ */}
          <div className="relative">
            <button
              onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              className="w-8 h-8 text-white hover:text-slate-200 flex items-center justify-center cursor-pointer transition-all"
              title="القائمة ≡"
            >
              <Menu className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* Menu Dropdown Popover (Shows "خاص") */}
            {showHeaderMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowHeaderMenu(false)}
                />
                <div className="absolute top-9 left-0 z-50 w-44 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 text-xs font-bold animate-in fade-in zoom-in-95 duration-150">
                  <button
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setActivePrivateUserId(target.id);
                      setIsPrivateChatOpen(true);
                      handleClose();
                    }}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-sky-50 text-slate-800 transition-colors font-extrabold cursor-pointer"
                  >
                    <span className="font-extrabold text-sm text-slate-800">خاص</span>
                    <MessageSquare className="w-4 h-4 text-sky-500 fill-sky-500/20 shrink-0" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* User Info & Avatar Header (Avatar on right, Details on left) */}
        <div className="flex items-end gap-3 mt-3 dir-rtl">
          
          {/* Avatar on Right side */}
          <div className="relative shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#0a1820] rounded-2xl border-2 border-white shadow-xl flex items-center justify-center relative p-1">
              <div className="w-full h-full rounded-xl border-2 border-white/90 flex items-center justify-center overflow-hidden bg-slate-900">
                {target.avatar && target.avatar !== '/default_male.svg' && target.avatar.trim() !== '' ? (
                  <img src={target.avatar} alt="System Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <span className="text-white font-black text-4xl sm:text-5xl select-none">!</span>
                )}
              </div>
              <span className="absolute bottom-1 right-1 w-4 h-4 bg-[#84cc16] border-2 border-[#072a32] rounded-full shadow-xs"></span>

              {/* Small Camera Icon visible ONLY to the Owner to change System avatar */}
              {isOwner && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    avatarInputRef.current?.click();
                  }}
                  className="absolute -top-2 -left-2 w-7 h-7 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 rounded-full border-2 border-white shadow-lg flex items-center justify-center cursor-pointer transition-transform hover:scale-110 z-30"
                  title="تغيير صورة System (خاص بالمالك)"
                >
                  <Camera className="w-3.5 h-3.5 stroke-[2.5]" />
                </button>
              )}
            </div>
          </div>

          {/* Details on Left side */}
          <div className="flex flex-col items-start gap-1 flex-1 text-right">
            <div className="flex items-center gap-1.5 text-white font-extrabold text-xs sm:text-sm">
              <span>🤖</span>
              <span>بوت</span>
            </div>
            <h2 className="text-white font-black text-xl sm:text-2xl leading-tight">
              {target.username || 'System'}
            </h2>
            {/* Cyan Private Chat Button */}
            <button
              onClick={() => {
                setActivePrivateUserId(target.id);
                setIsPrivateChatOpen(true);
                handleClose();
              }}
              className="mt-1 bg-[#0284c7] hover:bg-[#0369a1] text-white p-2 sm:p-2.5 rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center justify-center"
              title="محادثة خاصة"
            >
              <MessageSquare className="w-5 h-5 fill-white text-white" />
            </button>
          </div>

        </div>
      </div>

      {/* 2. Tab Bar */}
      <div className="bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        <div className="bg-[#072a32] text-white font-black text-sm sm:text-base px-6 py-3 select-none">
          معلوماتي
        </div>
        <div className="flex-1 bg-white h-full"></div>
      </div>

      {/* 3. Content Body (White Background) */}
      <div className="bg-white text-slate-800 p-5 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 font-bold text-sm sm:text-base">
        
        {/* 1. Member Balance */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3.5">
          <span className="text-slate-800 font-extrabold">رصيد العضو</span>
          <span className="font-extrabold text-slate-800 flex items-center gap-1">
            <span>0</span>
            <span className="text-lg">💵</span>
          </span>
        </div>

        {/* 2. Joined Date */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3.5">
          <span className="text-slate-800 font-extrabold">تاريخ الإنضمام</span>
          <span className="font-bold text-slate-600 dir-ltr">
            {target.joinedDate || '2020-11-16'}
          </span>
        </div>

        {/* 3. Current Room */}
        <div className="flex justify-between items-center border-b border-slate-200 pb-3.5">
          <span className="text-slate-800 font-extrabold">الروم الحالي</span>
          <span className="font-bold text-slate-600">
            {targetRoom?.name || 'غرفة العام'}
          </span>
        </div>

      </div>
    </div>
  ) : (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative select-none text-slate-100 font-sans">
      
      {/* Hidden File Inputs for Native Studio / Gallery Uploads */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={wallInputRef}
        onChange={handleWallFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* TOP HEADER COVER BANNER WITH USER PROFILE PHOTO & BUTTONS */}
      <div className="h-40 sm:h-48 relative bg-slate-950 overflow-hidden shrink-0">
        {target.wallCover && target.wallCover.trim() !== '' ? (
          <img
            src={target.wallCover}
            alt="صورة الحائط"
            className="w-full h-full object-cover brightness-90"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-[#0a2c35] via-[#0d343e] to-[#134450] flex flex-col items-center justify-center text-teal-400/30 font-black text-xl tracking-wider select-none">
            <span>شات اليمن المطور</span>
          </div>
        )}

        {/* Top Control Bar on Cover Header */}
        <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
          
          {/* Top Left Controls: Exit ×, Menu ≡, Zap ⚡, Pencil Box 📝 (Opens Member Record Modal) */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-2xl border border-slate-700/60 backdrop-blur-md shadow-lg pointer-events-auto">
            {/* Close Button X */}
            <button
              onClick={handleClose}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl flex items-center justify-center cursor-pointer transition-all"
              title="إغلاق الملف ×"
            >
              <X className="w-4 h-4 font-black" />
            </button>

            {/* Side Menu ≡ */}
            <div className="relative">
              <button
                onClick={() => setShowHeaderMenu(!showHeaderMenu)}
                className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 rounded-xl flex items-center justify-center cursor-pointer transition-all"
                title="القائمة ≡"
              >
                <Menu className="w-4 h-4" />
              </button>

              {/* DROPDOWN MENU POPOVER MATCHING SCREENSHOT */}
              {showHeaderMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowHeaderMenu(false)}
                  />
                  <div className="absolute top-9 left-0 z-50 w-48 sm:w-52 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 text-xs font-bold animate-in fade-in zoom-in-95 duration-150">
                    
                    {/* If System target: Show ONLY "خاص" (Private Chat) */}
                    {isSystemTarget ? (
                      <button
                        onClick={() => {
                          setShowHeaderMenu(false);
                          setActivePrivateUserId(target.id);
                          setIsPrivateChatOpen(true);
                          handleClose();
                        }}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-sky-50 text-sky-700 transition-colors font-extrabold cursor-pointer"
                      >
                        <span className="font-extrabold text-xs text-sky-800">خاص</span>
                        <MessageSquare className="w-4 h-4 text-sky-500 fill-sky-500/20 shrink-0" />
                      </button>
                    ) : (
                      <>
                        {/* 1. Private Chat (خاص) */}
                        <button
                          onClick={() => {
                            setShowHeaderMenu(false);
                            if (target.id === currentUser?.id) {
                              alert('هذا ملفك الشخصي');
                              return;
                            }
                            setActivePrivateUserId(target.id);
                            setIsPrivateChatOpen(true);
                            handleClose();
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer"
                        >
                          <span className="font-extrabold text-xs text-slate-700">خاص</span>
                          <MessageSquare className="w-4 h-4 text-sky-500 fill-sky-500/20 shrink-0" />
                        </button>

                        {/* 2. Add/Remove Friend (إضافة صديق) - Hidden for visitors */}
                        {currentUser?.role !== 'visitor' && (
                          <button
                            onClick={() => {
                              setShowHeaderMenu(false);
                              if (target.id === currentUser?.id) {
                                alert('لا يمكنك إضافة نفسك كصديق');
                                return;
                              }
                              if (target.role === 'visitor') {
                                alert('لا يمكنك إضافة الزائر كصديق، يجب على الزائر تسجيل عضوية أولاً.');
                                return;
                              }
                              sendFriendRequest(target.id);
                            }}
                            className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer"
                          >
                            <span className="font-extrabold text-xs text-slate-700">
                              {currentUser?.friends?.includes(target.id) ? 'إلغاء الصداقة' : 'إضافة صديق'}
                            </span>
                            <UserPlus className="w-4 h-4 text-[#8cc63f] shrink-0" />
                          </button>
                        )}

                        {/* 3. Ignore / Un-ignore (تجاهل) */}
                        <button
                          onClick={() => {
                            setShowHeaderMenu(false);
                            if (target.id === currentUser?.id) {
                              alert('لا يمكنك تجاهل نفسك');
                              return;
                            }
                            if (!canBeIgnored(target)) {
                              alert('عفواً، لا يمكنك تجاهل رتب الإدارة العليا');
                              return;
                            }
                            const isIgnored = currentUser?.ignoredUsers?.includes(target.id);
                            requestBlockConfirm(target, isIgnored ? 'unblock' : 'block', () => {
                              toggleIgnore(target.id);
                            });
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer"
                        >
                          <span className="font-extrabold text-xs text-slate-700">
                            {currentUser?.ignoredUsers?.includes(target.id) ? 'إلغاء التجاهل' : 'تجاهل'}
                          </span>
                          <Ban className="w-4 h-4 text-red-500 shrink-0" />
                        </button>

                        {/* 4. Room Settings (إعدادات الغرفة) */}
                        <button
                          onClick={() => {
                            setShowHeaderMenu(false);
                            setIsRoomSettingsOpen(true);
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 transition-colors border-b border-slate-100 cursor-pointer"
                        >
                          <span className="font-extrabold text-xs text-slate-700">إعدادات الغرفة</span>
                          <Settings className="w-4 h-4 text-emerald-600 shrink-0" />
                        </button>

                        {/* 5. Report Profile (إبلاغ عن البروفايل) */}
                        <button
                          onClick={() => {
                            setShowHeaderMenu(false);
                            if (target.id === currentUser?.id) {
                              alert('لا يمكنك الإبلاغ عن ملفك الشخصي');
                              return;
                            }
                            reportUserMessage(target.id, target.username, 'إبلاغ عن ملف شخصي - محتوى غير مناسب', 'احتيال', 'profile');
                            alert('تم إرسال إبلاغ عن البروفايل للإدارة بنجاح 🚩');
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-red-50 text-red-700 transition-colors border-b border-slate-100 cursor-pointer"
                        >
                          <span className="font-extrabold text-xs text-red-600">إبلاغ عن البروفايل</span>
                          <Flag className="w-4 h-4 text-red-500 shrink-0" />
                        </button>

                        {/* 6. Permanent Ban / Unban for Owner & Admin */}
                        {(isOwner || currentUser?.role === 'admin') && target.role !== 'owner' && (
                          <button
                            onClick={() => {
                              setShowHeaderMenu(false);
                              handleOwnerBan();
                            }}
                            className={`w-full px-4 py-3 flex items-center justify-between transition-colors font-extrabold cursor-pointer border-b border-slate-100 ${
                              isTargetBanned ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800' : 'hover:bg-red-50 text-red-700'
                            }`}
                          >
                            <span className="font-extrabold text-xs">
                              {isTargetBanned ? 'إلغاء وفك الحظر 🔓' : 'حظر نهائي من الشات 🚫'}
                            </span>
                            <Ban className={`w-4 h-4 shrink-0 ${isTargetBanned ? 'text-emerald-600' : 'text-red-500'}`} />
                          </button>
                        )}

                        {/* 7. Control Panel / Owner Dashboard (لوحة تحكم) */}
                        <button
                          onClick={() => {
                            setShowHeaderMenu(false);
                            setIsOwnerDashboardOpen(true);
                          }}
                          className="w-full px-4 py-3 flex items-center justify-between hover:bg-amber-50 text-amber-900 transition-colors cursor-pointer"
                        >
                          <span className="font-extrabold text-xs text-amber-800 flex items-center gap-1">
                            <span>لوحة تحكم</span>
                            <span>👑</span>
                          </span>
                          <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                        </button>
                      </>
                    )}

                  </div>
                </>
              )}
            </div>

            {/* Zap / Command Icon ⚡ (Mod Commands Modal Trigger) */}
            {canPerformModActions(currentUser, target) && (
              <button
                onClick={() => {
                  setShowCommandOverlay(true);
                  setCmdSubTab('basic');
                  setCmdAction('none');
                }}
                className="w-7 h-7 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-md"
                title="أمر الإشراف والعقوبات ⚡"
              >
                <Zap className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
              </button>
            )}

            {/* Pencil Icon 📝 Box (Sijill / Member Record Modal Trigger) */}
            {/* Sijill appears on profiles of target ranks Moderator through Owner (not Visitor, Member, or VIP) */}
            {/* Viewer must be Staff (Moderator through Owner); actual log access requires Management through Owner */}
            {canViewMemberRecordButton(currentUser, target) && (
              <button
                onClick={() => {
                  if (!canAccessMemberRecord(currentUser)) {
                    alert('عفواً، صلاحيات دخول السجل مخصصة لرتب الإدارة إلى رتبة المالك فقط ⛔');
                    return;
                  }
                  setShowMemberLogModal(true);
                  setMemberLogTab('options');
                }}
                className="w-7 h-7 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl flex items-center justify-center cursor-pointer transition-all shadow-md"
                title="سجل العضو والخيارات 📝"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Top Right Controls: Return Arrow ← */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-2xl border border-slate-700/60 backdrop-blur-md shadow-lg pointer-events-auto">
            <button
              onClick={handleClose}
              className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl flex items-center justify-center cursor-pointer transition-all"
              title="رجوع ←"
            >
              <span className="font-black text-sm">←</span>
            </button>
          </div>

        </div>

        {/* User Name & Avatar overlay inside Header Banner (Avatar on Right, Name/Rank on Left in RTL) */}
        <div className="absolute bottom-2.5 left-3 right-3 z-20 flex items-center gap-3 dir-rtl">
          
          {/* Profile Avatar on Right side in white border box with online dot */}
          <div className="relative group shrink-0">
            <div className="p-1 bg-white rounded-2xl shadow-2xl border-2 border-white/90 relative">
              {isSystemTarget ? (
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-900 rounded-xl border border-slate-700 flex items-center justify-center text-white font-black text-3xl select-none">
                  !
                </div>
              ) : (
                <UserAvatar
                  avatarUrl={target.avatar}
                  gender={target.gender}
                  role={target.role}
                  username={target.username}
                  size="lg"
                  className="rounded-xl overflow-hidden bg-slate-950"
                />
              )}
              {/* Online indicator dot - Hidden when target is stealth owner and viewer is not owner */}
              {!(target.role === 'owner' && target.isStealth && currentUser?.role !== 'owner') && (
                <span className={`absolute bottom-1 right-1 w-3.5 h-3.5 ${target.onlineStatus === 'online' ? 'bg-emerald-500' : 'bg-slate-400'} border-2 border-white rounded-full shadow-xs`}></span>
              )}
            </div>
          </div>

          {/* User Name, Rank & Status on Left side */}
          <div className="flex-1 text-right min-w-0 pr-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-white font-black text-base sm:text-lg drop-shadow-md truncate">
                {target.username}
              </span>
              {!isSystemTarget ? (
                <span className="text-xs text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded-lg border border-amber-500/40 font-bold flex items-center gap-1">
                  <span className={getRankEmojiClass(target.role, target.username)}>{getRankEmoji(target.role, target.username)}</span>
                  <span>{getRankTitle(target.role, target.username)}</span>
                </span>
              ) : (
                <span className="text-xs text-cyan-300 font-bold flex items-center gap-1">
                  🤖 بوت
                </span>
              )}
              {target.role === 'owner' && target.isStealth && (
                <span className="text-[11px] text-purple-300 bg-purple-950/90 px-2 py-0.5 rounded-lg border border-purple-500/50 font-bold flex items-center gap-1">
                  🕵️‍♂️ وضع الاختفاء (مخفي)
                </span>
              )}
            </div>

            {isSystemTarget ? (
              <div className="mt-1.5">
                <button
                  onClick={() => {
                    setActivePrivateUserId(target.id);
                    setIsPrivateChatOpen(true);
                    handleClose();
                  }}
                  className="bg-sky-500 hover:bg-sky-400 text-white p-2 rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center justify-center"
                  title="محادثة خاصة مع System"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                </button>
              </div>
            ) : (
              <p className="text-slate-200 text-xs font-medium drop-shadow-xs truncate mt-0.5">
                "{target.statusMessage || target.bio || 'بنت تعز مشيتها ع الارض تهز'}"
              </p>
            )}
          </div>

        </div>

      </div>

      {/* ACTION BUTTONS DIRECTLY BELOW COVER HEADER (الإعجاب ❤️, الخاص 💬 / تعديل ✏️, تجاهل 🚫, الأمر ⚡) - Hidden for System */}
      {!isSystemTarget && (
        <div className="bg-slate-950 p-2.5 border-b border-slate-800 flex items-center justify-between gap-2 shrink-0">
          
          {/* Like Button with Counter: 480 ❤️ */}
          <button
            onClick={() => likeUser(target.id)}
            className="flex-1 bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 border border-pink-500/40 py-2 px-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
          >
            <span>{target.likes || 0}</span>
            <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-400" />
          </button>

          {/* Edit Button for own profile: ✏️ */}
          {isMe && (
            <button
              onClick={() => {
                setIsProfileSettingsOpen(true);
                handleClose();
              }}
              className="flex-1 bg-[#0b333e] hover:bg-[#07242c] text-white py-2 px-3 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md border border-[#0b333e]"
            >
              <Edit3 className="w-4 h-4 text-slate-200" />
              <span>تعديل</span>
            </button>
          )}

          {/* Private Chat Button: 💬 */}
          {!isMe && (
            <button
              onClick={() => {
                setActivePrivateUserId(target.id);
                setIsPrivateChatOpen(true);
                handleClose();
              }}
              className="flex-1 bg-sky-500 hover:bg-sky-400 text-slate-950 py-2 px-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>رسائل 💬</span>
            </button>
          )}

          {/* Ignore / Block Button: 🚫 */}
          {!isMe && (
            <button
              onClick={() => {
                if (target.id === currentUser?.id) {
                  showTopBanner('لا يمكنك تجاهل نفسك');
                  alert('لا يمكنك تجاهل نفسك');
                  return;
                }
                if (!canBeIgnored(target)) {
                  showTopBanner('🛡️ لا يمكن تجاهل الإدارة العليا');
                  alert('لا يمكن تجاهل الإدارة العليا 🛡️');
                  return;
                }
                const isBlocked = (currentUser?.ignores?.includes(target.id) || currentUser?.blockedUsers?.includes(target.id));
                requestBlockConfirm(target, isBlocked ? 'unblock' : 'block', () => {
                  toggleIgnore(target.id);
                });
              }}
              title={!canBeIgnored(target) ? 'لا يمكن تجاهل الإدارة العليا' : undefined}
              className={`flex-1 py-2 px-2.5 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs border ${
                !canBeIgnored(target)
                  ? 'bg-slate-900/60 text-slate-400 border-slate-700/60 hover:border-slate-600'
                  : (currentUser?.ignores?.includes(target.id) || currentUser?.blockedUsers?.includes(target.id))
                  ? 'bg-amber-600/30 text-amber-300 border-amber-500/50'
                  : 'bg-red-950/40 hover:bg-red-900/60 text-red-300 border-red-500/40'
              }`}
            >
              <Ban className="w-3.5 h-3.5" />
              <span>
                {(currentUser?.ignores?.includes(target.id) || currentUser?.blockedUsers?.includes(target.id))
                  ? 'إلغاء التجاهل'
                  : 'تجاهل'}
              </span>
            </button>
          )}

          {/* Zap / Command Button: ⚡ (الأمر) */}
          {canPerformModActions(currentUser, target) && (
            <button
              onClick={() => {
                setShowCommandOverlay(true);
                setCmdSubTab('basic');
                setCmdAction('none');
              }}
              className="w-10 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center shadow-md cursor-pointer transition-all hover:scale-105 shrink-0"
              title="الأمر ⚡"
            >
              <Zap className="w-4 h-4 fill-slate-950 text-slate-950" />
            </button>
          )}

        </div>
      )}

      {/* MUTED ALERT BANNER MATCHING SCREENSHOT (Only for visitors, members, vip - NOT higher management/admins) */}
      {isTargetMuted && !isTargetBanned && !['owner', 'admin', 'management', 'moderator'].includes(target.role) && (
        <div className="bg-[#f59e0b] text-white py-2.5 px-5 font-black text-xs sm:text-sm flex items-center justify-end gap-2 shadow-sm shrink-0 select-none">
          <span>تم كتم هذا المستخدم حالياً</span>
          <span className="w-4 h-4 rounded-full bg-white text-[#f59e0b] font-black text-[11px] flex items-center justify-center shrink-0">
            !
          </span>
        </div>
      )}

      {/* BANNED ALERT BANNER MATCHING SCREENSHOT (Red bar with exclamation mark and text) */}
      {isTargetBanned && (
        <div className="bg-[#d32f2f] text-white py-2 px-5 font-bold text-xs sm:text-sm flex items-center justify-end gap-2 shadow-sm shrink-0 select-none">
          <span>هذا المستخدم محظور حاليًا</span>
          <span className="w-4 h-4 rounded-full bg-white text-[#d32f2f] font-black text-[11px] flex items-center justify-center shrink-0">
            !
          </span>
        </div>
      )}

      {/* MAIN TABS (معلوماتي | الأصدقاء | معلومات | سجل الكتم) */}
      <div
        className={`grid ${
          hideFriendsTab
            ? canSeeMuteLogTab ? 'grid-cols-3' : 'grid-cols-2'
            : canSeeMuteLogTab ? 'grid-cols-4' : 'grid-cols-3'
        } bg-slate-100 border-b border-slate-200 shrink-0 text-slate-800`}
      >
        
        {/* Tab 1: معلوماتي (My Info) */}
        <button
          type="button"
          onClick={() => setActiveTab('my_info')}
          className={`py-3 text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'my_info'
              ? 'bg-[#0b333e] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>معلوماتي</span>
        </button>

        {/* Tab 2: الأصدقاء (Friends) - Hidden for Visitors and System */}
        {!hideFriendsTab && (
          <button
            type="button"
            onClick={() => setActiveTab('friends')}
            className={`py-3 text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'friends'
                ? 'bg-[#0b333e] text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>الأصدقاء</span>
          </button>
        )}

        {/* Tab 3: معلومات (System Info / Info) */}
        <button
          type="button"
          onClick={() => setActiveTab('system_info')}
          className={`py-3 text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
            activeTab === 'system_info'
              ? 'bg-[#0b333e] text-white shadow-md'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          <span>معلومات</span>
        </button>

        {/* Tab 4: سجل الكتم (Mute Log) - Restricted strictly from Owner down to Management only */}
        {canSeeMuteLogTab && (
          <button
            type="button"
            onClick={() => setActiveTab('mute_log')}
            className={`py-3 text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'mute_log'
                ? 'bg-red-900 text-amber-300 shadow-md border-b-2 border-amber-400'
                : 'bg-red-950/10 text-red-900 hover:bg-red-900/20'
            }`}
            title="سجل الكتم والعقوبات (مخصص للمالك والأدمن والإدارة فقط) 🔇"
          >
            <VolumeX className="w-3.5 h-3.5 text-red-600" />
            <span>سجل الكتم 🔇</span>
          </button>
        )}

      </div>

      {/* MAIN CONTENT AREA FOR TABS */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white text-slate-800 p-4 space-y-4">
        
        {/* TAB 1: معلوماتي (MY INFO) */}
        {activeTab === 'my_info' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            
            {/* 1. Member Balance (رصيد العضو) */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-700 font-bold text-sm">رصيد العضو</span>
              <span className="font-extrabold text-emerald-600 text-sm sm:text-base flex items-center gap-1 font-mono">
                <span>{isSystemTarget ? '0' : formatEnglishNumber(target.coins ?? 128795)}</span>
                <span className="text-base">💵</span>
              </span>
            </div>

            {/* 2. Age (العمر) */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-700 font-bold text-sm">العمر</span>
              <span className="font-bold text-slate-600 text-sm">
                {target.age && target.age !== 'عدم الإظهار' ? `${toEnglishDigits(target.age)} سنة` : '30 سنة'}
              </span>
            </div>

            {/* 3. Gender (الجنس) */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-700 font-bold text-sm">الجنس</span>
              <span className="font-bold text-slate-600 text-sm">
                {target.gender === 'male' ? 'ذكر ♂' : target.gender === 'female' ? 'أنثى ♀' : 'آخر ⚥'}
              </span>
            </div>

            {/* 4. Specialty (التخصص) */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-700 font-bold text-sm flex items-center gap-1">
                <span>التخصص</span>
              </span>
              <span className="font-bold text-amber-700 text-sm bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                {target.specialty || 'عضو مميز 🌟'}
              </span>
            </div>

            {/* 5. Country (البلد) */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-700 font-bold text-sm">البلد</span>
              <span className="font-bold text-slate-600 text-sm flex items-center gap-1.5">
                {target.countryFlag && <span className="text-base">{target.countryFlag}</span>}
                <span>{getEnglishCountryName(target.country)}</span>
              </span>
            </div>

            {/* 6. Join Date (تاريخ الإنضمام) */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-700 font-bold text-sm">تاريخ الإنضمام</span>
              <span className="font-mono text-slate-500 text-sm dir-ltr">
                {toEnglishDigits(target.joinedDate || '2024-04-20')}
              </span>
            </div>

            {/* 7. Current Room (الروم الحالي) */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-700 font-bold text-sm">الروم الحالي</span>
              <span className="font-bold text-[#0b333e] text-sm">
                {targetRoom?.name || 'غرفة اليمن'}
              </span>
            </div>

            {/* 8. Bio / Personal Note (معلوماتي) */}
            <div className="pt-1 space-y-1.5">
              <div className="flex items-center gap-1 text-slate-800 font-black text-sm">
                <span className="text-red-500">🔴</span>
                <span>معلوماتي</span>
                <span className="text-red-500">🔴</span>
              </div>
              <p className="text-slate-700 text-xs sm:text-sm leading-relaxed font-semibold bg-slate-50 p-3.5 rounded-2xl border border-slate-100 whitespace-pre-line">
                {target.bio || target.statusMessage || 'حافظوا على الشرفاء حتى ولو كانوا خصومكم، ولا تفرحوا بالسفهاء ولو وقفوا معكم،.. فالشريف عندما تحتاج اليه ولو كان خصمك، لن تجده في مواقف الكرامه الا شهما،..'}
              </p>
            </div>

          </div>
        )}

        {/* TAB 2: الأصدقاء (FRIENDS) - Grid layout as in Screenshot 3 */}
        {!isVisitorTarget && activeTab === 'friends' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="flex justify-between items-center pb-1">
              <p className="text-xs font-black text-slate-700">قائمة الأصدقاء ({displayFriends.length}):</p>
              <span className="text-[10px] text-slate-400 font-bold">اضغط لعرض الملف</span>
            </div>

            {displayFriends.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs font-medium">
                لا يوجد أصدقاء مضافون في قائمة هذا العضو حالياً.
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                {displayFriends.map((friend) => (
                  <div
                    key={friend.id}
                    onClick={() => setSelectedUserForProfile(friend)}
                    className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group cursor-pointer border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all bg-slate-100"
                  >
                    {friend.avatar && friend.avatar.trim() !== '' ? (
                      <img
                        src={friend.avatar}
                        alt={friend.username}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300 font-bold select-none">
                        <UserIcon className="w-1/2 h-1/2 text-slate-400" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent p-1 pt-3 text-center">
                      <span className="text-[10px] sm:text-xs font-black text-white truncate block dir-rtl">
                        {friend.username}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: معلومات (SYSTEM INFO / INFO) - As in Screenshot 4 */}
        {activeTab === 'system_info' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            
            {/* 1. Last Seen (آخر تواجد) */}
            {!(target.role === 'owner' && target.isStealth && currentUser?.role !== 'owner') ? (
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-700 font-bold text-sm">آخر تواجد</span>
                <span className="font-semibold text-slate-600 text-sm flex items-center gap-1.5 dir-ltr">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${target.onlineStatus === 'online' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                  <span>{formatLastSeenDateTime(target.lastSeen, target.lastSeenTimestamp, target.onlineStatus === 'online')}</span>
                  {target.role === 'owner' && target.isStealth && (
                    <span className="text-[10px] text-purple-600 font-bold dir-rtl mr-1">🕵️‍♂️ (مخفي)</span>
                  )}
                </span>
              </div>
            ) : (
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-700 font-bold text-sm">آخر تواجد</span>
                <span className="font-bold text-slate-400 text-xs flex items-center gap-1">
                  <span>مخفي 👁️</span>
                </span>
              </div>
            )}

            {/* 2. Language (اللغة) */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-700 font-bold text-sm">اللغة</span>
              <span className="font-bold text-slate-600 text-sm flex items-center gap-1">
                <span>{target.language || 'العربية 🇸🇦'}</span>
              </span>
            </div>

            {/* 3. Theme (الثيم) */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <span className="text-slate-700 font-bold text-sm">الثيم</span>
              <span className="font-bold text-slate-600 text-sm">
                Lite
              </span>
            </div>

            {/* Owner-only fields displayed after Theme */}
            {currentUser && checkIsOwner(currentUser) && (
              <>
                {/* 4. IP Address (الاي بي) */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="text-slate-700 font-bold text-sm">الاي بي (IP)</span>
                  <span className="font-mono text-slate-700 text-xs font-bold dir-ltr bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                    {target.ip || '197.234.12.89'}
                  </span>
                </div>

                {/* 5. Location Map (خريطة الموقع) */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="text-slate-700 font-bold text-sm">خريطة الموقع</span>
                  <span className="font-bold text-slate-600 text-sm flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    <span>{target.locationMap || getEnglishCountryName(target.country)}</span>
                  </span>
                </div>

                {/* 6. Previous Account (الحساب السابق) */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                  <span className="text-slate-700 font-bold text-sm">الحساب السابق</span>
                  <span className="font-bold text-slate-600 text-sm">
                    {getPreviousAccountDisplay(target)}
                  </span>
                </div>
              </>
            )}

            {/* Other Account (حساب آخر) displayed after Theme for Admin, Management, Moderator, and Owner (Hidden for Owner if viewer is not Owner) */}
            {currentUser && isStaff(currentUser) && (!checkIsOwner(target) || checkIsOwner(currentUser)) && (
              <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
                <span className="text-slate-700 font-bold text-sm">حساب آخر</span>
                <span className="font-bold text-slate-600 text-sm">
                  {getOtherAccountsDisplay(target)}
                </span>
              </div>
            )}

          </div>
        )}

        {/* TAB 4: سجل الكتم (MUTE LOG - STRICTLY FOR OWNER, ADMIN, MANAGEMENT) */}
        {canSeeMuteLogTab && activeTab === 'mute_log' && (
          <div className="space-y-3 text-xs animate-in fade-in duration-150">
            
            {/* Mute Log Banner Header */}
            <div className="bg-red-950/10 border border-red-300 p-3.5 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <VolumeX className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-red-950">
                    سجل الكتم والعقوبات الإدارية ({historyDisplayLogs.length})
                  </h4>
                  <p className="text-[10px] font-bold text-slate-500">
                    خاص برتب الإدارة والمالك فقط 🛡️
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold bg-red-800 text-amber-200 px-2.5 py-1 rounded-xl shadow-xs shrink-0">
                إدارة - مالك
              </span>
            </div>

            {/* Mute Log Items */}
            {historyDisplayLogs.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-xs font-bold">
                لا يوجد أي سجل كتم أو عقوبات سابقة لهذا العضو ✨
              </div>
            ) : (
              <div className="space-y-2.5">
                {historyDisplayLogs.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-xs space-y-2 hover:border-red-300 transition-colors"
                  >
                    <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="font-black text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-lg">
                        {item.typeTitle} 🔇
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono dir-ltr">{item.timestamp}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700 font-medium pt-1">
                      <p className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold">بواسطة المشرف:</span>
                        <span className="font-extrabold text-slate-900">{item.author}</span>
                      </p>

                      <p className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-bold">مدة التأخير:</span>
                        <span className="font-extrabold text-slate-900">{item.duration}</span>
                      </p>
                    </div>

                    <div className="flex items-start gap-1.5 pt-2 border-t border-slate-100 text-xs">
                      <span className="text-slate-400 font-bold shrink-0">السبب والرسالة:</span>
                      <span className="font-bold text-slate-800 bg-slate-50 p-2 rounded-xl border border-slate-200 w-full break-words">
                        {item.reason}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>

      {/* MODERATION COMMAND MODAL (نافذة الأمر - تنفتح عند الضغط على زر ⚡) */}
      {showCommandOverlay && canPerformModActions(currentUser, target) && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-800 font-sans border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-3.5 bg-[#002f34] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <UserAvatar
                  avatarUrl={target.avatar}
                  gender={target.gender}
                  role={target.role}
                  username={target.username}
                  size="sm"
                  showRankBadge={false}
                  className="w-9 h-9 rounded-full border border-white/80 object-cover bg-slate-950"
                />
                <div className="flex flex-col text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-sm text-white">{target.username}</span>
                    <span className="text-[10px] text-amber-300 font-bold bg-white/10 px-1.5 py-0.5 rounded-md">
                      {getRankTitle(target.role, target.username)}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-300">أوامر الإشراف والإدارة ⚡</span>
                </div>
              </div>

              <button
                onClick={() => setShowCommandOverlay(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Sub-tabs: [الأساسية] and [خيارات الغرفة] */}
            <div className="flex border-b border-slate-200 text-xs font-black bg-slate-100 shrink-0">
              <button
                onClick={() => {
                  setCmdSubTab('basic');
                  setCmdAction('none');
                }}
                className={`py-3 px-6 text-center transition-colors cursor-pointer font-black flex-1 ${
                  cmdSubTab === 'basic'
                    ? 'bg-white text-[#002f34] border-b-2 border-[#002f34] shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الأساسية
              </button>
              <button
                onClick={() => {
                  setCmdSubTab('room_options');
                  setCmdAction('none');
                }}
                className={`py-3 px-6 text-center transition-colors cursor-pointer font-black flex-1 ${
                  cmdSubTab === 'room_options'
                    ? 'bg-white text-[#002f34] border-b-2 border-[#002f34] shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                خيارات الغرفة
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 bg-white overflow-y-auto custom-scrollbar flex-1 space-y-3">
              
              {/* TAB 1: الأساسية */}
              {cmdSubTab === 'basic' && (
                <>
                  {cmdAction === 'none' && (
                    <div className="space-y-2.5">
                      {/* Button 1: كتم (أو فك الكتم) */}
                      <button
                        onClick={() => {
                          if (isTargetMuted) {
                            handleExecuteCmdUnmute();
                          } else {
                            setCmdAction('mute');
                          }
                        }}
                        className="w-full bg-[#f4f5f7] hover:bg-[#e9ebef] active:bg-[#dde1e7] border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-right transition-all cursor-pointer group shadow-xs"
                      >
                        <div className="flex flex-col text-right">
                          <span className="font-extrabold text-sm text-slate-800">
                            {isTargetMuted ? 'فك الكتم 🔊' : 'كتم العضو 🔇'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {isTargetMuted ? 'رفع الكتم واستعادة إمكانية الكتابة' : 'كتم العضو مع تحديد المدة والسبب'}
                          </span>
                        </div>
                        <VolumeX className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                      </button>

                      {/* Button 2: طرد (أو فك الطرد) */}
                      <button
                        onClick={() => {
                          if (isTargetKicked) {
                            handleExecuteCmdUnkick();
                          } else {
                            setCmdAction('kick');
                          }
                        }}
                        className="w-full bg-[#f4f5f7] hover:bg-[#e9ebef] active:bg-[#dde1e7] border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-right transition-all cursor-pointer group shadow-xs"
                      >
                        <div className="flex flex-col text-right">
                          <span className="font-extrabold text-sm text-slate-800">
                            {isTargetKicked ? 'فك الطرد 🚪' : 'طرد العضو 👞'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {isTargetKicked ? 'السماح للعضو بالدخول مجدداً' : 'طرد العضو مع تحديد المدة والسبب'}
                          </span>
                        </div>
                        <Zap className="w-5 h-5 text-red-600 fill-red-600 group-hover:scale-110 transition-transform shrink-0" />
                      </button>

                      {/* Owner Extra Actions: Permanent Ban and Delete Account */}
                      {isOwner && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <button
                            onClick={handleOwnerBan}
                            className={`w-full ${
                              isTargetBanned
                                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                            } rounded-2xl p-3 flex items-center justify-between text-right transition-all cursor-pointer shadow-xs`}
                          >
                            <div className="flex flex-col text-right">
                              <span className={`font-extrabold text-xs ${isTargetBanned ? 'text-emerald-800' : 'text-red-700'}`}>
                                {isTargetBanned ? 'فك حظر العضو 🔓' : 'حظر نهائي من الشات 🚫'}
                              </span>
                              <span className={`text-[10px] ${isTargetBanned ? 'text-emerald-600' : 'text-red-500'} font-medium`}>
                                {isTargetBanned ? 'إلغاء الحظر والسماح للعضو بالدخول والدردشة مجدداً' : 'حظر العضو ومنعه من الدخول بشكل دائم'}
                              </span>
                            </div>
                            {isTargetBanned ? (
                              <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
                            ) : (
                              <Ban className="w-4 h-4 text-red-600 shrink-0" />
                            )}
                          </button>

                          <button
                            onClick={handleDeleteAccount}
                            className="w-full bg-red-500 hover:bg-red-600 text-white rounded-2xl p-3 flex items-center justify-between text-right transition-all cursor-pointer shadow-xs"
                          >
                            <div className="flex flex-col text-right">
                              <span className="font-extrabold text-xs text-white">حذف حساب العضو بالكامل 🗑️</span>
                              <span className="text-[10px] text-red-100 font-medium">حذف نهائي للحساب من السيرفر</span>
                            </div>
                            <Trash2 className="w-4 h-4 text-white shrink-0" />
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form for Mute Duration and Reason */}
                  {cmdAction === 'mute' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-1.5">
                        <VolumeX className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>كتم العضو: {target.username}</span>
                      </div>

                      {/* Quick duration selection pills (2 to 10 min) */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
                          مدة الكتم بالدقائق:
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[2, 3, 5, 8, 10].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => setCmdMuteDuration(mins)}
                              className={`py-2 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                                cmdMuteDuration === mins
                                  ? 'bg-[#002f34] text-white shadow-sm'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {mins} د
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reason input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                          سبب الكتم:
                        </label>
                        <input
                          type="text"
                          value={cmdMuteReason}
                          onChange={(e) => setCmdMuteReason(e.target.value)}
                          placeholder="اكتب سبب الكتم..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        {/* Quick reasons */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {['مخالفة النظام والقوانين', 'ازعاج وتكرار', 'ألفاظ غير لائقة', 'إعلانات سبام'].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => setCmdMuteReason(r)}
                              className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-lg cursor-pointer font-bold"
                            >
                              {r}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Submit / Cancel Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleExecuteCmdMute()}
                          className="bg-[#cc0000] hover:bg-[#b30000] active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                        >
                          تأكيد الكتم ({cmdMuteDuration} د)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCmdAction('none')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form for Kick Duration and Reason */}
                  {cmdAction === 'kick' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div className="bg-red-50 p-2.5 rounded-xl border border-red-200 text-red-900 text-xs font-bold flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-red-600 shrink-0" />
                        <span>طرد العضو: {target.username}</span>
                      </div>

                      {/* Quick duration selection pills */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
                          مدة الطرد بالدقائق:
                        </label>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[5, 10, 15, 30, 60].map((mins) => (
                            <button
                              key={mins}
                              type="button"
                              onClick={() => setCmdKickDuration(mins)}
                              className={`py-2 text-center text-xs font-black rounded-xl transition-all cursor-pointer ${
                                cmdKickDuration === mins
                                  ? 'bg-[#002f34] text-white shadow-sm'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {mins} د
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reason input */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                          سبب الطرد:
                        </label>
                        <input
                          type="text"
                          value={cmdKickReason}
                          onChange={(e) => setCmdKickReason(e.target.value)}
                          placeholder="اكتب سبب الطرد..."
                          className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                      </div>

                      {/* Submit / Cancel Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleExecuteCmdKick()}
                          className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                        >
                          تأكيد الطرد ({cmdKickDuration} د)
                        </button>
                        <button
                          type="button"
                          onClick={() => setCmdAction('none')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: خيارات الغرفة */}
              {cmdSubTab === 'room_options' && (
                <div className="space-y-3">
                  {/* زر الكتم المباشر */}
                  <button
                    onClick={() => {
                      if (isTargetMuted) {
                        handleExecuteCmdUnmute();
                      } else {
                        handleInstantGeneralMute();
                      }
                    }}
                    className="w-full bg-[#f4f5f7] hover:bg-[#e9ebef] active:bg-[#dde1e7] border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-right transition-all cursor-pointer group shadow-xs"
                  >
                    <div className="flex flex-col text-right">
                      <span className="font-extrabold text-sm text-slate-800">
                        {isTargetMuted ? 'فك الكتم 🔊' : 'كتم مباشر 🔇'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {isTargetMuted ? 'إلغاء الكتم عن العضو فوراً' : 'كتم فوري ومباشر للعضو في هذه الغرفة'}
                      </span>
                    </div>
                    <VolumeX className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                  </button>

                  {/* زر الطرد المباشر */}
                  <button
                    onClick={() => {
                      if (isTargetKicked) {
                        handleExecuteCmdUnkick();
                      } else {
                        handleInstantRoomKick();
                      }
                    }}
                    className="w-full bg-[#f4f5f7] hover:bg-[#e9ebef] active:bg-[#dde1e7] border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-right transition-all cursor-pointer group shadow-xs"
                  >
                    <div className="flex flex-col text-right">
                      <span className="font-extrabold text-sm text-slate-800">
                        {isTargetKicked ? 'فك الطرد 🚪' : 'طرد مباشر من الغرفة 👞'}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {isTargetKicked ? 'السماح للعضو بدخول الغرفة' : 'طرد فوري ومباشر بدون إدخال وقت أو سبب'}
                      </span>
                    </div>
                    <Zap className="w-5 h-5 text-red-600 fill-red-600 group-hover:scale-110 transition-transform shrink-0" />
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MEMBER RECORD MODAL (سجل العضو - الذي ينفتح بالضغط على أيكونة القلم 📝 من أعلى يسار الغلاف) */}
      {showMemberLogModal && canAccessMemberRecord(currentUser) && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-100 font-sans">
            
            {/* Modal Header Banner matching screenshot 1 */}
            <div className="h-36 relative overflow-hidden bg-[#0d343e] shrink-0">
              {target.wallCover && target.wallCover.trim() !== '' ? (
                <img src={target.wallCover} alt="الغلاف" className="w-full h-full object-cover brightness-85" />
              ) : (
                <div className="w-full h-full bg-gradient-to-r from-[#0a2c35] to-[#134450] flex items-center justify-center text-teal-400/30 font-black text-lg">
                  <span>سجل العضو</span>
                </div>
              )}

              {/* Upper Right: Back / Return Arrow (←) */}
              <div className="absolute top-2.5 right-2.5 z-30">
                <button
                  type="button"
                  onClick={() => setShowMemberLogModal(false)}
                  className="w-7 h-7 bg-slate-950/70 hover:bg-slate-900 text-white rounded-lg flex items-center justify-center cursor-pointer transition-all border border-white/20 shadow-xs"
                  title="رجوع ←"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Upper Left: Close (✖), Camera (📷), Remove Cover (✖) */}
              <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5">
                {/* Close Button ✖ */}
                <button
                  type="button"
                  onClick={() => setShowMemberLogModal(false)}
                  className="w-7 h-7 bg-slate-950/70 hover:bg-slate-900 text-white rounded-lg flex items-center justify-center cursor-pointer transition-all border border-white/20 shadow-xs"
                  title="إغلاق ✖"
                >
                  <X className="w-4 h-4 font-black" />
                </button>

                {/* Change Cover Camera Button 📷 */}
                <button
                  type="button"
                  onClick={triggerWallUpload}
                  disabled={!canUserEditTargetPhotos}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border shadow-xs ${
                    canUserEditTargetPhotos
                      ? 'bg-slate-950/70 hover:bg-slate-900 text-amber-400 border-white/20 cursor-pointer'
                      : 'bg-slate-950/40 text-slate-500 border-transparent cursor-not-allowed'
                  }`}
                  title="تغيير صورة الغلاف 📷"
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Delete Cover Button ✖ */}
                <button
                  type="button"
                  onClick={handleRemoveWall}
                  disabled={!canUserEditTargetPhotos || !target.wallCover}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all border shadow-xs ${
                    canUserEditTargetPhotos && target.wallCover
                      ? 'bg-slate-950/70 hover:bg-red-900/80 text-red-400 border-white/20 cursor-pointer'
                      : 'bg-slate-950/40 text-slate-500 border-transparent cursor-not-allowed'
                  }`}
                  title="حذف صورة الغلاف ✖"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* User Avatar & Name in Modal Header (Avatar on the RIGHT, before Rank & Name) */}
              <div className="absolute bottom-2.5 left-3 right-3 z-20 flex items-center gap-3 dir-rtl text-right">
                
                {/* Avatar with Camera & Delete icons on the RIGHT in RTL */}
                <div className="relative group shrink-0">
                  <div className="p-1 bg-white rounded-2xl shadow-xl border-2 border-white/90">
                    <UserAvatar
                      avatarUrl={target.avatar}
                      gender={target.gender}
                      role={target.role}
                      username={target.username}
                      size="md"
                      className="rounded-xl overflow-hidden bg-slate-950"
                    />
                  </div>
                  {/* Photo buttons next to avatar */}
                  <div className="absolute -top-1.5 -right-1.5 flex items-center gap-1 z-30">
                    <button
                      type="button"
                      onClick={triggerAvatarUpload}
                      disabled={!canUserEditTargetPhotos}
                      className="w-6 h-6 bg-slate-950 text-amber-400 hover:bg-slate-800 rounded-full flex items-center justify-center cursor-pointer shadow-md border border-amber-400/50"
                      title="تغيير الصورة الشخصية 📷"
                    >
                      <Camera className="w-3.5 h-3.5" />
                    </button>
                    {target.avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={!canUserEditTargetPhotos}
                        className="w-6 h-6 bg-slate-950 text-red-400 hover:bg-red-900 rounded-full flex items-center justify-center cursor-pointer shadow-md border border-red-400/50"
                        title="حذف الصورة الشخصية ✖"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Username, Rank & Status on the left of Avatar */}
                <div className="flex-1 text-right min-w-0 pr-1">
                  <h3
                    className="font-black text-base drop-shadow-md truncate flex items-center gap-1.5"
                    style={{ color: target.usernameColor || '#ffffff' }}
                  >
                    <span>{target.username}</span>
                  </h3>
                  <p className="text-slate-200 text-xs drop-shadow-xs truncate font-bold flex items-center gap-1">
                    <span className="text-amber-300 font-extrabold">{getRankTitle(target.role, target.username)}</span>
                    <span className={getRankEmojiClass(target.role, target.username)}>{getRankEmoji(target.role, target.username)}</span>
                    <span className="text-slate-300">|</span>
                    <span>{target.statusMessage || target.bio || 'أهلاً وسهلاً بكم'}</span>
                  </p>
                </div>

              </div>
            </div>

            {/* MEMBER RECORD TABS (خيارات | التاريخ) MATCHING SCREENSHOT 1 */}
            <div className="grid grid-cols-2 bg-slate-200 border-b border-slate-300 shrink-0 text-slate-800">
              
              <button
                type="button"
                onClick={() => setMemberLogTab('options')}
                className={`py-2.5 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  memberLogTab === 'options'
                    ? 'bg-[#0c3843] text-white shadow-md'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <span>خيارات</span>
              </button>

              <button
                type="button"
                onClick={() => setMemberLogTab('history')}
                className={`py-2.5 text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  memberLogTab === 'history'
                    ? 'bg-[#0c3843] text-white shadow-md'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                <span>التاريخ</span>
              </button>

            </div>

            {/* MEMBER RECORD TAB CONTENTS */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100 text-slate-800 p-3 sm:p-4 space-y-3">
              
              {/* TAB 1: خيارات (OPTIONS IN MEMBER RECORD) */}
              {memberLogTab === 'options' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  
                  {/* The 2x2 Options Grid Matching Screenshot */}
                  <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
                    <div className="grid grid-cols-2 divide-x divide-x-reverse divide-y divide-slate-100 text-slate-800">
                      
                      {/* Row 1, Col 1 (Right): ★ تغيير رتبة */}
                      <button
                        type="button"
                        onClick={() => {
                          if (!isOwner) {
                            showTopBanner('👑 تغيير الرتب متاح للمالك الرئيسي فقط');
                            alert('👑 تغيير الرتب متاح للمالك الرئيسي فقط');
                            return;
                          }
                          setShowRankChangeModal(true);
                        }}
                        className="p-3.5 flex items-center justify-between transition-all cursor-pointer hover:bg-slate-50"
                      >
                        <span className="text-amber-500 text-base font-bold">★</span>
                        <span className="text-xs font-extrabold">تغيير رتبة</span>
                      </button>

                      {/* Row 1, Col 2 (Left): 📝 اسم المستخدم */}
                      <button
                        type="button"
                        onClick={() => {
                          setNewNameInput(target.username);
                          setShowNameChangeModal(true);
                        }}
                        className="p-3.5 flex items-center justify-between transition-all cursor-pointer hover:bg-slate-50"
                      >
                        <span className="text-sky-600 text-base font-bold">📝</span>
                        <span className="text-xs font-extrabold">اسم المستخدم</span>
                      </button>

                      {/* Row 2, Col 1 (Right): 🖌️ تغير لون اسم المستخدم */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedNameColor(target.usernameColor || '#f59e0b');
                          setMemberLogActiveSubOption(prev => prev === 'color' ? 'none' : 'color');
                        }}
                        className={`p-3.5 flex items-center justify-between transition-all cursor-pointer hover:bg-slate-50 ${
                          memberLogActiveSubOption === 'color' ? 'bg-purple-50 text-purple-950 font-black' : ''
                        }`}
                      >
                        <span className="text-purple-600 text-base font-bold">🖌️</span>
                        <span className="text-xs font-extrabold">تغير لون اسم المستخدم</span>
                      </button>

                      {/* Row 2, Col 2 (Left): ✔️ تحرير حالة الحساب */}
                      <button
                        type="button"
                        onClick={() => {
                          setNewStatusInput(target.statusMessage || target.bio || '');
                          setMemberLogActiveSubOption(prev => prev === 'status' ? 'none' : 'status');
                        }}
                        className={`p-3.5 flex items-center justify-between transition-all cursor-pointer hover:bg-slate-50 ${
                          memberLogActiveSubOption === 'status' ? 'bg-emerald-50 text-emerald-950 font-black' : ''
                        }`}
                      >
                        <span className="text-emerald-600 text-base font-bold">✔️</span>
                        <span className="text-xs font-extrabold">تحرير حالة الحساب</span>
                      </button>

                    </div>
                  </div>

                  {/* Owner Special Action: 🔑 تغيير باسورد العضو (يظهر فقط للمالك) */}
                  {isOwner && (
                    <div className="bg-white rounded-2xl border border-amber-200 overflow-hidden shadow-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setNewPasswordInput(target.password || '');
                          setShowPasswordChangeModal(true);
                        }}
                        className="w-full p-3.5 flex items-center justify-between transition-all cursor-pointer hover:bg-amber-50 text-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 text-base font-bold">🔑</span>
                          <span className="text-xs font-extrabold">تغيير باسورد العضو</span>
                        </div>
                        <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                          صلاحية المالك فقط 👑
                        </span>
                      </button>
                    </div>
                  )}

                  {/* SUB-OPTION 3: 🖌️ تغير لون اسم المستخدم */}
                  {memberLogActiveSubOption === 'color' && (
                    <div className="bg-white border border-purple-200 rounded-2xl p-3.5 shadow-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <span className="text-purple-600 text-base">🖌️</span>
                          <span>تغير لون اسم المستخدم</span>
                        </span>
                        <span className="text-[10px] bg-purple-100 text-purple-900 px-2 py-0.5 rounded-lg font-bold">
                          معاينة فورية
                        </span>
                      </div>

                      {/* Preview Box */}
                      <div className="bg-slate-950 p-3 rounded-xl flex items-center justify-center border border-slate-800 shadow-inner">
                        <span
                          className="text-base font-black tracking-wide drop-shadow-md"
                          style={{ color: selectedNameColor }}
                        >
                          {target.username}
                        </span>
                      </div>

                      {/* Color Palette Grid */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold text-slate-600">اختر لوناً:</span>
                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                          {USERNAME_COLOR_PALETTE.map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              onClick={() => setSelectedNameColor(c.color)}
                              className={`h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 ${
                                selectedNameColor.toLowerCase() === c.color.toLowerCase()
                                  ? 'border-slate-900 scale-110 shadow-md ring-2 ring-purple-400'
                                  : 'border-transparent hover:scale-105'
                              }`}
                              style={{ backgroundColor: c.color }}
                              title={c.name}
                            >
                              {selectedNameColor.toLowerCase() === c.color.toLowerCase() && (
                                <Check className="w-4 h-4 text-white drop-shadow-sm stroke-[3]" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveUsernameColor(selectedNameColor);
                            setMemberLogActiveSubOption('none');
                          }}
                          className="bg-purple-600 hover:bg-purple-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          حفظ وتطبيق اللون
                        </button>
                        <button
                          type="button"
                          onClick={() => setMemberLogActiveSubOption('none')}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}

                  {/* SUB-OPTION 4: ✔️ تحرير حالة الحساب */}
                  {memberLogActiveSubOption === 'status' && (
                    <div className="bg-white border border-emerald-200 rounded-2xl p-3.5 shadow-xs space-y-3 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                        <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                          <span className="text-emerald-600 text-base">✔️</span>
                          <span>تحرير حالة الحساب والرسالة</span>
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-lg font-black ${
                          isTargetBanned ? 'bg-red-500 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isTargetBanned ? 'محظور 🚫' : 'نشط وفعال ✔️'}
                        </span>
                      </div>

                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-slate-600">رسالة الحالة / النبذة:</span>
                          <input
                            type="text"
                            value={newStatusInput}
                            onChange={(e) => setNewStatusInput(e.target.value)}
                            placeholder="اكتب الحالة (مثال: بسم الله الرحمن الرحيم)..."
                            className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3.5 py-2 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1.5">
                          {['بسم الله الرحمن الرحيم 🕊️', 'متصل الآن ✨', 'في العمل 💼', 'مشغول حالياً ⏳', 'أهلاً بالجميع 🌟'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setNewStatusInput(preset)}
                              className="text-[10px] font-bold bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-900 px-2 py-1 rounded-lg border border-slate-200 transition-all cursor-pointer"
                            >
                              {preset}
                            </button>
                          ))}
                        </div>

                        {/* Moderation Ban / Unban Toggle */}
                        {(isOwner || currentUser?.role === 'admin') && target.role !== 'owner' && (
                          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                            <div className="text-right">
                              <span className="text-xs font-bold text-slate-800 block">حالة الحظر من الشات:</span>
                              <span className="text-[10px] text-slate-500">
                                {isTargetBanned ? 'الحساب محظور حالياً' : 'الحساب نشط وغير محظور'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={handleOwnerBan}
                              className={`py-1.5 px-3 font-black text-xs rounded-xl flex items-center gap-1 cursor-pointer transition-all ${
                                isTargetBanned
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-red-600 hover:bg-red-500 text-white'
                              }`}
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>{isTargetBanned ? 'فك الحظر 🔓' : 'حظر الحساب 🚫'}</span>
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              if (currentUser?.id === target.id) {
                                updateUserProfile({ statusMessage: newStatusInput.trim(), bio: newStatusInput.trim() });
                              } else {
                                ownerUpdateUser(target.id, { statusMessage: newStatusInput.trim(), bio: newStatusInput.trim() });
                              }
                              showTopBanner('✔️ تم حفظ وتحديث حالة الحساب بنجاح');
                              setMemberLogActiveSubOption('none');
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                          >
                            حفظ حالة الحساب
                          </button>
                          <button
                            type="button"
                            onClick={() => setMemberLogActiveSubOption('none')}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-3 py-2 rounded-xl cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: التاريخ (HISTORY/MUTES IN MEMBER RECORD) */}
              {memberLogTab === 'history' && (
                <div className="space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between mb-1 gap-2">
                    <p className="text-xs font-black text-slate-700">سجل العقوبات وكتم العضو ({historyDisplayLogs.length}):</p>
                    <div className="flex items-center gap-2">
                      {/* OWNER ONLY: CLEAR USER HISTORY BUTTON (محو سجل المستخدم) */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={handleClearUserHistory}
                          className="py-1 px-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-[11px] rounded-xl flex items-center gap-1 cursor-pointer transition-all shadow-xs"
                          title="محو سجل المستخدم بالكامل (خاص بالمالك) 🗑️"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>محو سجل المستخدم 🗑️</span>
                        </button>
                      )}

                      <span className="text-[10px] text-slate-500 bg-slate-200 px-2 py-0.5 rounded-lg font-bold shrink-0">
                        سجل العقوبات 🛡️
                      </span>
                    </div>
                  </div>

                  {historyDisplayLogs.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs space-y-1.5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                        <span className="font-black text-slate-900 text-xs sm:text-sm">{item.typeTitle}</span>
                        <span className="text-[11px] text-slate-400 font-mono dir-ltr">{item.timestamp}</span>
                      </div>

                      <div className="space-y-1 text-xs text-slate-700 font-medium">
                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-bold min-w-14">الكاتب :</span>
                          <span className="font-extrabold text-slate-900">{item.author}</span>
                        </p>

                        <p className="flex items-center gap-1.5">
                          <span className="text-slate-400 font-bold min-w-14">تأخير :</span>
                          <span className="font-extrabold text-slate-900">{item.duration}</span>
                        </p>

                        <div className="flex items-start gap-1.5 pt-1 border-t border-slate-100">
                          <span className="text-slate-400 font-bold min-w-14 shrink-0">السبب والرسالة:</span>
                          <span className="font-extrabold text-slate-900 break-words whitespace-pre-wrap leading-relaxed">{item.reason}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 1. POPUP MODAL: تعديل اسم المستخدم (MATCHING SCREENSHOT) */}
      {/* ======================================================== */}
      {showNameChangeModal && (
        <div
          onClick={() => setShowNameChangeModal(false)}
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 dir-rtl font-sans"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm sm:max-w-md overflow-hidden shadow-2xl border border-slate-200 text-right animate-in zoom-in-95 duration-150"
          >
            {/* Dark Teal Header Matching Screenshot */}
            <div className="bg-[#002f34] text-white px-4 py-3 flex items-center justify-between">
              <span className="font-black text-sm text-white">اسم المستخدم</span>
              <button
                type="button"
                onClick={() => setShowNameChangeModal(false)}
                className="text-white/80 hover:text-white transition-colors p-1 cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
                  اسم المستخدم
                </label>
                <input
                  type="text"
                  value={newNameInput}
                  onChange={(e) => setNewNameInput(e.target.value)}
                  placeholder="اكتب اسم المستخدم..."
                  className="w-full bg-[#f1f5f9] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 text-right"
                  autoFocus
                />
              </div>

              {/* Action Buttons Matching Screenshot */}
              <div className="flex items-center justify-start gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    handleSaveNewName();
                    setShowNameChangeModal(false);
                  }}
                  className="bg-[#0284c7] hover:bg-[#0369a1] active:scale-95 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowNameChangeModal(false)}
                  className="bg-[#002f34] hover:bg-[#001f24] active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <span>إلغاء</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. POPUP MODAL: تغيير رتبة المستخدم (VERTICAL LIST)     */}
      {/* ======================================================== */}
      {showRankChangeModal && (
        <div
          onClick={() => setShowRankChangeModal(false)}
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 dir-rtl font-sans"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 text-right animate-in zoom-in-95 duration-150"
          >
            {/* Dark Teal Header */}
            <div className="bg-[#002f34] text-white px-4 py-3 flex items-center justify-between">
              <span className="font-black text-sm text-white flex items-center gap-1.5">
                <span className="text-amber-400">★</span>
                <span>تغيير رتبة المستخدم</span>
              </span>
              <button
                type="button"
                onClick={() => setShowRankChangeModal(false)}
                className="text-white/80 hover:text-white transition-colors p-1 cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Vertical Ranks List from Visitor to Owner */}
            <div className="p-3 sm:p-4 space-y-1.5 max-h-[70vh] overflow-y-auto">
              <p className="text-[11px] text-slate-500 font-bold mb-2">
                اختر رتبة لتطبيقها فوراً على العضو ({target.username}):
              </p>

              {(['visitor', 'member', 'vip', 'moderator', 'management', 'admin', 'owner'] as UserRole[]).map((r) => {
                const isCurrent = target.role === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      handleRoleSelectChange(r);
                      setShowRankChangeModal(false);
                    }}
                    className={`w-full p-3 rounded-xl flex items-center justify-between transition-all cursor-pointer border text-right ${
                      isCurrent
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-black shadow-xs'
                        : 'bg-slate-50 hover:bg-amber-50/60 text-slate-800 border-slate-200 hover:border-amber-300 font-bold'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-base ${getRankEmojiClass(r, target.username)}`}>
                        {getRankEmoji(r, target.username)}
                      </span>
                      <span className="text-xs font-extrabold">{getRankTitle(r, target.username)}</span>
                    </div>
                    {isCurrent ? (
                      <span className="text-[10px] bg-slate-950 text-amber-400 px-2 py-0.5 rounded-full font-black">
                        الحالية ✓
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">
                        تطبيق فوري ⚡
                      </span>
                    )}
                  </button>
                );
              })}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setShowRankChangeModal(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. POPUP MODAL: تغيير باسورد العضو (OWNER EXCLUSIVE)    */}
      {/* ======================================================== */}
      {showPasswordChangeModal && (
        <div
          onClick={() => setShowPasswordChangeModal(false)}
          className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 dir-rtl font-sans"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-sm sm:max-w-md overflow-hidden shadow-2xl border border-slate-200 text-right animate-in zoom-in-95 duration-150"
          >
            {/* Dark Teal Header */}
            <div className="bg-[#002f34] text-white px-4 py-3 flex items-center justify-between">
              <span className="font-black text-sm text-white flex items-center gap-1.5">
                <Key className="w-4 h-4 text-amber-400" />
                <span>تغيير باسورد العضو</span>
              </span>
              <button
                type="button"
                onClick={() => setShowPasswordChangeModal(false)}
                className="text-white/80 hover:text-white transition-colors p-1 cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-right">
                  كلمة المرور الجديدة للعضو ({target.username})
                </label>
                <input
                  type="text"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  placeholder="اكتب كلمة المرور الجديدة..."
                  className="w-full bg-[#f1f5f9] border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-extrabold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500 text-right"
                  autoFocus
                />
                <p className="text-[10px] text-slate-500 mt-1.5 font-medium">
                  💡 سيتم تعيين هذه الكلمة لحساب العضو فوراً ليتمكن من تسجيل الدخول بها.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-start gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!newPasswordInput.trim()) {
                      alert('الرجاء كتابة كلمة مرور صالحة');
                      return;
                    }
                    ownerUpdateUser(target.id, { password: newPasswordInput.trim() });
                    setShowPasswordChangeModal(false);
                    showTopBanner(`🔑 تم تغيير باسورد العضو (${target.username}) بنجاح`);
                  }}
                  className="bg-[#0284c7] hover:bg-[#0369a1] active:scale-95 text-white font-black text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPasswordChangeModal(false)}
                  className="bg-[#002f34] hover:bg-[#001f24] active:scale-95 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer"
                >
                  <span>إلغاء</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
        {content}
      </div>
    );
  }

  return content;
};
