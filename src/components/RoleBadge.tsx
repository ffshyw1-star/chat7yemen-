import React from 'react';
import { UserRole, RoleBadgeConfig } from '../types';
import { useChat } from '../context/ChatContext';
import { DEFAULT_ROLE_BADGES } from '../utils/roleBadges';
import { Shield, Star, Sparkles, User, UserCheck, Crown, Zap, Flame, Rocket, Award, Gem, Trophy } from 'lucide-react';

interface RoleBadgeProps {
  role?: UserRole;
  customBadge?: RoleBadgeConfig;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role = 'member',
  customBadge,
  size = 'sm',
  className = '',
  showTooltip = true,
  onClick
}) => {
  const { siteSettings } = useChat();

  // Resolve active badge configuration from:
  // 1. Direct customBadge passed as prop
  // 2. Site-wide customized role badges from siteSettings
  // 3. Fallback default role badge configuration
  const activeBadge: RoleBadgeConfig =
    customBadge ||
    siteSettings?.roleBadges?.[role] ||
    DEFAULT_ROLE_BADGES[role] ||
    DEFAULT_ROLE_BADGES.member;

  // Responsive dimensions
  const sizeClasses = {
    xs: 'w-3.5 h-3.5 min-w-[14px] text-[8px]',
    sm: 'w-4.5 h-4.5 sm:w-5 sm:h-5 min-w-[18px] sm:min-w-[20px] text-[10px] sm:text-[11px]',
    md: 'w-6 h-6 min-w-[24px] text-xs',
    lg: 'w-8 h-8 min-w-[32px] text-sm',
    xl: 'w-10 h-10 min-w-[40px] text-base',
  }[size];

  const iconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5 sm:w-3 sm:h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4.5 h-4.5',
    xl: 'w-6 h-6',
  }[size];

  // Helper for Lucide icon fallback
  const renderLucideIcon = (val: string) => {
    switch (val.toLowerCase()) {
      case 'crown':
      case '👑':
        return <Crown className={iconSizes} />;
      case 'trophy':
      case '🏆':
        return <Trophy className={iconSizes} />;
      case 'star':
      case '⭐':
      case '🌟':
        return <Star className={`${iconSizes} fill-current`} />;
      case 'shield':
      case '🛡️':
        return <Shield className={`${iconSizes} fill-current`} />;
      case 'zap':
      case '⚡':
        return <Zap className={`${iconSizes} fill-current`} />;
      case 'sparkles':
      case '✨':
        return <Sparkles className={iconSizes} />;
      case 'gem':
      case '💎':
        return <Gem className={iconSizes} />;
      case 'flame':
      case '🔥':
        return <Flame className={`${iconSizes} fill-current`} />;
      case 'rocket':
      case '🚀':
        return <Rocket className={iconSizes} />;
      case 'award':
      case '🎖️':
        return <Award className={iconSizes} />;
      case 'usercheck':
        return <UserCheck className={iconSizes} />;
      default:
        return <User className={iconSizes} />;
    }
  };

  const isImage =
    activeBadge.iconType === 'image' ||
    (activeBadge.iconValue &&
      (activeBadge.iconValue.startsWith('http://') ||
        activeBadge.iconValue.startsWith('https://') ||
        activeBadge.iconValue.startsWith('data:image')));

  const glowStyle = activeBadge.glow
    ? {
        boxShadow: `0 0 8px ${activeBadge.glowColor || 'rgba(245, 158, 11, 0.45)'}`,
      }
    : {};

  const frameStyle: React.CSSProperties = {
    background: activeBadge.bgColor || '#fef3c7',
    borderColor: activeBadge.borderColor || '#fbbf24',
    borderWidth: `${activeBadge.borderWidth || 1.5}px`,
    borderStyle: 'solid',
    color: activeBadge.textColor || '#ffffff',
    ...glowStyle,
  };

  return (
    <span
      onClick={onClick}
      title={showTooltip ? `رتبة: ${activeBadge.label || role}` : undefined}
      style={frameStyle}
      className={`role-badge-frame shadow-2xs ${sizeClasses} ${className}`}
    >
      {isImage ? (
        <img
          src={activeBadge.iconValue}
          alt={activeBadge.label || role}
          className="w-full h-full object-contain p-0.5 pointer-events-none select-none"
          loading="lazy"
        />
      ) : activeBadge.iconType === 'lucide' ? (
        renderLucideIcon(activeBadge.iconValue)
      ) : (
        <span className="leading-none select-none flex items-center justify-center pointer-events-none text-center">
          {activeBadge.iconValue || '👑'}
        </span>
      )}
    </span>
  );
};
