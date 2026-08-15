import { User, UserRole } from '../types';

export const ROLE_LEVELS: Record<UserRole, number> = {
  visitor: 0,
  member: 1,
  vip: 2,
  moderator: 3,
  management: 4,
  admin: 5,
  owner: 6,
};

export const RANK_EMOJIS: Record<UserRole, string> = {
  owner: '👑',
  admin: '⭐',
  management: '⭐',
  moderator: '🛡️',
  vip: '💎',
  member: '👤',
  visitor: '👤',
};

export const RANK_TITLES: Record<UserRole, string> = {
  owner: 'مالك',
  admin: 'مدير عام (أدمن)',
  management: 'إدارة',
  moderator: 'مشرف',
  vip: 'عضو مميز (VIP)',
  member: 'عضو مسجل',
  visitor: 'زائر',
};

/**
 * Helper to check if a user is System
 */
export const isSystemUser = (user?: User | null | string): boolean => {
  if (!user) return false;
  if (typeof user === 'string') return user === 'user-system' || user === 'System';
  return user.id === 'user-system' || user.username === 'System';
};

/**
 * Format lastSeen string to always return Time and Date (الوقت والتاريخ)
 */
import { toEnglishDigits } from './dateUtils';

export const formatLastSeenDateTime = (lastSeen?: string): string => {
  if (lastSeen && lastSeen !== 'الآن' && lastSeen !== 'متصل الان' && lastSeen.includes(':') && (lastSeen.includes('-') || lastSeen.includes('/'))) {
    return toEnglishDigits(lastSeen);
  }
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${hours}:${minutes} ${day}/${month}/${year}`;
};

/**
 * Returns rank emoji for a given role
 */
export const getRankEmoji = (role?: UserRole | string | null, username?: string): string => {
  if (username === 'System' || role === 'system') return '';
  if (username === 'Araby Chat' || username?.includes('شات الصوتي')) return '🤖';
  if (!role) return '👤';
  return RANK_EMOJIS[role as UserRole] ?? '👤';
};

/**
 * Returns CSS class for rank emoji (e.g. grayscale for management silver star)
 */
export const getRankEmojiClass = (role?: UserRole | string | null, username?: string): string => {
  if (username === 'System' || role === 'system') return 'hidden';
  if (role === 'management') return 'inline-block filter grayscale contrast-150 brightness-150';
  if (role === 'member') return 'inline-block filter brightness-200 grayscale contrast-150';
  if (role === 'visitor') return 'inline-block text-sky-500 [filter:sepia(100%)_hue-rotate(180deg)_saturate(600%)_brightness(95%)]';
  return 'inline-block';
};

/**
 * Returns arabic title for a given role
 */
export const getRankTitle = (role?: UserRole | string | null, username?: string): string => {
  if (username === 'System' || role === 'system') return '';
  if (!role) return 'زائر';
  return RANK_TITLES[role as UserRole] ?? 'زائر';
};

/**
 * Returns numeric hierarchy level for a given role (0 to 6)
 */
export const getRoleLevel = (role?: UserRole | string | null): number => {
  if (!role) return 0;
  return ROLE_LEVELS[role as UserRole] ?? 0;
};

/**
 * Check if actor is target user
 */
export const isSelf = (actor?: User | null, target?: User | null): boolean => {
  if (!actor || !target) return false;
  return actor.id === target.id;
};

/**
 * Check if actor has strictly higher rank than target
 */
export const isHigherRank = (actor?: User | null, target?: User | null): boolean => {
  if (!actor || !target) return false;
  return getRoleLevel(actor.role) > getRoleLevel(target.role);
};

/**
 * Check if actor has staff privileges (moderator or above)
 */
export const isStaff = (actor?: User | null): boolean => {
  return getRoleLevel(actor?.role) >= ROLE_LEVELS.moderator;
};

/**
 * Check if actor is management or higher
 */
export const isManagementOrHigher = (actor?: User | null): boolean => {
  return getRoleLevel(actor?.role) >= ROLE_LEVELS.management;
};

/**
 * Check if actor is admin or owner
 */
export const isAdminOrOwner = (actor?: User | null): boolean => {
  return getRoleLevel(actor?.role) >= ROLE_LEVELS.admin;
};

/**
 * Check if actor is owner
 */
export const isOwner = (actor?: User | null): boolean => {
  return actor?.role === 'owner';
};

/**
 * Check if a target user can be ignored or blocked.
 * Staff members (Owner, Admin, Management, Moderator) and System CANNOT be ignored.
 */
export const canBeIgnored = (targetUser?: User | null): boolean => {
  if (!targetUser) return false;
  if (isSystemUser(targetUser)) return false;
  if (isStaff(targetUser)) return false; // Staff (moderator, management, admin, owner) cannot be ignored
  return true;
};

/**
 * Permissions: Can edit avatar & cover photos
 * - Self if not visitor
 * - Staff (management or higher) editing lower ranks
 */
export const canEditPhotos = (actor?: User | null, target?: User | null): boolean => {
  if (!actor || !target) return false;
  if (target.role === 'owner') {
    return isSelf(actor, target) && actor.role !== 'visitor';
  }
  if (target.role === 'admin') {
    return (isOwner(actor) || isSelf(actor, target)) && actor.role !== 'visitor';
  }
  if (target.role === 'management') {
    return (isAdminOrOwner(actor) || isSelf(actor, target)) && actor.role !== 'visitor';
  }
  if (isSystemUser(target)) return isOwner(actor);
  if (isSelf(actor, target)) {
    return actor.role !== 'visitor';
  }
  return isManagementOrHigher(actor) && isHigherRank(actor, target);
};

/**
 * Permissions: Can edit profile / status / account info
 * - Self if not visitor
 * - High-ranking staff (management+) editing lower ranks
 * - Owner profile CANNOT be edited by anyone else
 * - Admin profile CANNOT be edited by anyone except Owner or self
 * - Management profile CANNOT be edited by anyone except Owner, Admin, or self
 */
export const canEditProfile = (actor?: User | null, target?: User | null): boolean => {
  if (!actor || !target) return false;
  if (target.role === 'owner') {
    return isSelf(actor, target) && actor.role !== 'visitor';
  }
  if (target.role === 'admin') {
    return (isOwner(actor) || isSelf(actor, target)) && actor.role !== 'visitor';
  }
  if (target.role === 'management') {
    return (isAdminOrOwner(actor) || isSelf(actor, target)) && actor.role !== 'visitor';
  }
  if (isSystemUser(target)) return isOwner(actor);
  if (isSelf(actor, target)) {
    return actor.role !== 'visitor';
  }
  return isManagementOrHigher(actor) && isHigherRank(actor, target);
};

/**
 * Permissions: Can perform moderation actions (kick/mute/edit name)
 * - Staff (moderator or above) acting on non-self target with strictly lower rank
 * - NO ONE can perform mod actions on Owner
 * - NO ONE can perform mod actions on Admin except Owner
 * - NO ONE can perform mod actions on Management except Owner and Admin
 */
export const canPerformModActions = (actor?: User | null, target?: User | null): boolean => {
  if (!actor || !target) return false;
  if (target.role === 'owner') return false;
  if (isSystemUser(target)) return false;
  if (target.role === 'admin') return isOwner(actor);
  if (target.role === 'management') return isAdminOrOwner(actor);
  if (isSelf(actor, target)) return false;
  return isStaff(actor) && isHigherRank(actor, target);
};

/**
 * Alias for canPerformModActions for mute/kick
 */
export const canMute = canPerformModActions;
export const canKick = canPerformModActions;

/**
 * Permissions: Can ban user permanently
 * - Strictly Owner or Admin acting on lower rank
 * - NO ONE can ban Owner
 * - NO ONE can ban Admin except Owner
 * - NO ONE can ban Management except Owner and Admin
 */
export const canBan = (actor?: User | null, target?: User | null): boolean => {
  if (!actor || !target) return false;
  if (target.role === 'owner') return false;
  if (isSystemUser(target)) return false;
  if (target.role === 'admin') return isOwner(actor);
  if (target.role === 'management') return isAdminOrOwner(actor);
  if (isSelf(actor, target)) return false;
  return isAdminOrOwner(actor) && isHigherRank(actor, target);
};

/**
 * Permissions: Can view moderation history / mute logs inside user files
 * Hierarchy rules specified by user:
 * - Owner ( المالك ): Can view mute logs for ALL users (Owner down to Visitor).
 * - Admin ( الأدمن ): Can view mute logs for users from Management down to Visitor (Admin logs visible ONLY to Owner).
 * - Management ( الإدارة ): Can view mute logs for users from Moderator down to Visitor (Management logs visible ONLY to Owner and Admin).
 * - Moderator ( المشرف ), VIP ( المميز ), Member ( العضو ), Visitor ( الزائر ): Cannot view mute logs.
 */
export const canViewMuteLogs = (_actor?: User | null, _target?: User | null): boolean => {
  return false;
};

/**
 * Check if a user target qualifies to have a Member Record (السجل) on their profile:
 * - Target must be rank Moderator to Owner (isStaff(target)).
 */
export const hasMemberRecord = (target?: User | null): boolean => {
  if (isSystemUser(target)) return false;
  return isStaff(target);
};

/**
 * Check if an actor (viewer) has authority to enter/access the Member Record (السجل):
 * - Actor must be rank Management to Owner (isManagementOrHigher(actor)).
 */
export const canAccessMemberRecord = (actor?: User | null): boolean => {
  return isManagementOrHigher(actor);
};

/**
 * Permissions: Can see the Member Record (السجل) button on a user profile.
 * - Target must have a member record (Moderator to Owner).
 * - Actor (viewer) must be Staff (Moderator to Owner).
 * - System, Visitors, Members, and VIPs (both as actor or target) do NOT see the record button at all.
 */
export const canViewMemberRecordButton = (actor?: User | null, target?: User | null): boolean => {
  if (!actor || !target) return false;
  if (isSystemUser(target)) return false;
  if (!isManagementOrHigher(actor)) return false;
  if (isSelf(actor, target) && (actor.role === 'admin' || actor.role === 'management')) return false;
  if (target.role === 'owner' && !isOwner(actor)) return false;
  return true;
};

/**
 * Permissions: Can view confidential data (IP, exact map location, device fingerprint)
 * - Strictly Owner
 */
export const canViewConfidentialData = (actor?: User | null): boolean => {
  return isOwner(actor);
};

/**
 * Permissions: Can add friends
 * - Registered accounts (non-visitors)
 */
export const canAddFriends = (actor?: User | null): boolean => {
  return !!actor && actor.role !== 'visitor';
};

/**
 * Permissions: Can send media (studio images, YouTube videos) in public chat
 * - Registered accounts (non-visitors) or VIP+ depending on config
 */
export const canSendMediaInPublic = (actor?: User | null): boolean => {
  if (!actor) return false;
  return actor.role !== 'visitor';
};

/**
 * Utility: Extract 11-character YouTube video ID from various YouTube URL formats
 */
export const getYouTubeVideoId = (url?: string | null): string | null => {
  if (!url) return null;
  const trimmed = url.trim();
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = trimmed.match(regExp);
  if (match && match[2].length === 11) {
    return match[2];
  }
  // If user pasted just the 11-char ID directly
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  return null;
};
