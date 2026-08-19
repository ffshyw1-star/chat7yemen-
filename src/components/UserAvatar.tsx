import React from 'react';
import { UserRole, Gender } from '../types';
import { User, UserCheck, Shield, Sparkles, Crown, Star } from 'lucide-react';
import { resolveUserAvatar } from '../utils/avatarUtils';

interface UserAvatarProps {
  avatarUrl?: string;
  gender: Gender;
  role?: UserRole;
  username?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showRankBadge?: boolean;
  className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatarUrl,
  gender,
  role = 'visitor',
  username = '',
  size = 'md',
  showRankBadge = false,
  className = ''
}) => {
  // Determine ring border class according to gender rule
  const ringClass =
    gender === 'male'
      ? 'avatar-ring-male'
      : gender === 'female'
      ? 'avatar-ring-female'
      : 'avatar-ring-other';

  // Size classes
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-14 h-14 text-xl',
    xl: 'w-20 h-20 text-2xl',
  }[size];

  const badgeSize = {
    xs: 'w-3 h-3 text-[8px]',
    sm: 'w-4 h-4 text-[10px]',
    md: 'w-5 h-5 text-[11px]',
    lg: 'w-6 h-6 text-[12px]',
    xl: 'w-7 h-7 text-[14px]',
  }[size];

  // Role badge icon & colors
  const getRankBadgeInfo = () => {
    switch (role) {
      case 'owner':
        return { icon: <span className="text-[12px] leading-none select-none">👑</span>, bg: 'bg-amber-950 border-amber-500' };
      case 'admin':
        return { icon: <Star className="w-full h-full text-red-500 fill-red-500" />, bg: 'bg-red-950 border-red-500' };
      case 'management':
        return { icon: <Star className="w-full h-full text-slate-100 fill-slate-100" />, bg: 'bg-slate-800 border-slate-300' };
      case 'moderator':
        return { icon: <Shield className="w-full h-full text-blue-400 fill-blue-500/30" />, bg: 'bg-blue-950 border-blue-500' };
      case 'vip':
        return { icon: <Sparkles className="w-full h-full text-purple-400 fill-purple-400" />, bg: 'bg-purple-950 border-purple-500' };
      case 'member':
        return { icon: <UserCheck className="w-full h-full text-emerald-400" />, bg: 'bg-emerald-950 border-emerald-500' };
      default:
        return { icon: <User className="w-full h-full text-slate-400" />, bg: 'bg-slate-800 border-slate-600' };
    }
  };

  const badgeInfo = getRankBadgeInfo();

  const isSystem = username === 'System' || username === 'system' || (role as string) === 'system';

  const effectiveAvatar = resolveUserAvatar(avatarUrl, gender);

  return (
    <div className={`relative inline-block shrink-0 ${className}`}>
      <div
        className={`${sizeClasses} rounded-full overflow-hidden flex items-center justify-center bg-slate-200 ${ringClass} transition-transform duration-200`}
      >
        <img
          src={effectiveAvatar}
          alt={username}
          className="w-full h-full object-cover rounded-full"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            const fallback = gender === 'female' ? '/default_female.svg' : '/default_male.svg';
            if (target.src !== fallback) {
              target.src = fallback;
            }
          }}
        />
      </div>

      {showRankBadge && !isSystem && badgeInfo && (
        <div
          className={`absolute -bottom-0.5 -right-0.5 ${badgeSize} rounded-full border border-slate-900 flex items-center justify-center p-0.5 shadow-md ${badgeInfo.bg}`}
          title={role}
        >
          {badgeInfo.icon}
        </div>
      )}
    </div>
  );
};
