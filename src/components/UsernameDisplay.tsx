import React from 'react';
import { UserRole, RoleBadgeConfig } from '../types';
import { RoleBadge } from './RoleBadge';

interface UsernameDisplayProps {
  id?: string;
  username: string;
  role?: UserRole;
  showRankBadge?: boolean;
  customRoleBadge?: RoleBadgeConfig;
  badgeSize?: 'xs' | 'sm' | 'md' | 'lg';
  usernameColor?: string;
  usernameBgGradient?: string;
  isNeon?: boolean;
  fontFamily?: string;
  fontSize?: string | number;
  className?: string;
  title?: string;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
  onContextMenu?: (e: React.MouseEvent<HTMLSpanElement>) => void;
  onTouchStart?: (e: React.TouchEvent<HTMLSpanElement>) => void;
  onTouchEnd?: (e: React.TouchEvent<HTMLSpanElement>) => void;
  onTouchCancel?: (e: React.TouchEvent<HTMLSpanElement>) => void;
}

export const UsernameDisplay: React.FC<UsernameDisplayProps> = ({
  id,
  username,
  role,
  showRankBadge = false,
  customRoleBadge,
  badgeSize = 'sm',
  usernameColor,
  usernameBgGradient,
  isNeon = false,
  fontFamily,
  fontSize,
  className = '',
  title,
  onClick,
  onContextMenu,
  onTouchStart,
  onTouchEnd,
  onTouchCancel
}) => {
  const hasBg = Boolean(usernameBgGradient && usernameBgGradient.trim() !== '');

  // Neon text shadow calculation
  const getNeonShadow = () => {
    if (!isNeon) {
      if (hasBg) {
        return '0 1px 2px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.9)';
      }
      return 'none';
    }
    const glowColor = usernameColor || '#38bdf8';
    return `0 0 8px ${glowColor}, 0 0 16px ${glowColor}, 0 1px 2px #000000`;
  };

  const textStyle: React.CSSProperties = {
    color: hasBg ? (usernameColor || '#ffffff') : (usernameColor || undefined),
    fontFamily: fontFamily || undefined,
    fontSize: fontSize || undefined,
    textShadow: getNeonShadow(),
  };

  const renderBadge = (showRankBadge || role) && role ? (
    <RoleBadge
      role={role}
      customBadge={customRoleBadge}
      size={badgeSize}
      className="inline-block align-middle"
    />
  ) : null;

  if (hasBg) {
    return (
      <span className="username-with-badge-container">
        {renderBadge}
        <span
          id={id}
          title={title}
          onClick={onClick}
          onContextMenu={onContextMenu}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchCancel}
          style={{
            background: usernameBgGradient,
          }}
          className={`username-shiny-badge username-text-wrapper px-2.5 py-0.5 group cursor-pointer transition-transform select-text ${className}`}
        >
          {/* Subtle sparkle corner indicator */}
          <span className="absolute top-0.5 right-1.5 text-[8px] opacity-70 pointer-events-none animate-pulse select-none z-10">
            ✦
          </span>
          
          {/* Crisp text foreground on top of the shimmer animation */}
          <span
            style={textStyle}
            className="username-text-foreground truncate max-w-full font-black drop-shadow-sm tracking-tight"
          >
            {username}
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className="username-with-badge-container">
      {renderBadge}
      <span
        id={id}
        title={title}
        onClick={onClick}
        onContextMenu={onContextMenu}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
        style={textStyle}
        className={`username-text-wrapper font-extrabold select-text transition-colors ${
          isNeon ? 'drop-shadow-sm' : ''
        } ${className}`}
      >
        {username}
      </span>
    </span>
  );
};
