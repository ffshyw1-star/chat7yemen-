import { UserRole, RoleBadgeConfig, RoleBadgesMap } from '../types';

export const DEFAULT_ROLE_BADGES: Record<UserRole, RoleBadgeConfig> = {
  owner: {
    role: 'owner',
    label: 'مالك (صاحب الموقع)',
    iconType: 'image',
    iconValue: '/owner.svg',
    bgColor: '#ffffff',
    borderColor: '#f59e0b',
    textColor: '#b45309',
    borderWidth: 2,
    glow: true,
    glowColor: 'rgba(245, 158, 11, 0.5)',
  },
  system: {
    role: 'system',
    label: 'بوت آلي (System)',
    iconType: 'image',
    iconValue: '/bot_badge.svg',
    bgColor: 'linear-gradient(135deg, #4b5563, #1f2937)',
    borderColor: '#9ca3af',
    textColor: '#ffffff',
    borderWidth: 1.5,
    glow: true,
    glowColor: 'rgba(107, 114, 128, 0.5)',
  },
  management: {
    role: 'management',
    label: 'الإدارة العليا (Management)',
    iconType: 'emoji',
    iconValue: '🛡️',
    bgColor: 'linear-gradient(135deg, #e11d48, #be123c)',
    borderColor: '#fda4af',
    textColor: '#ffffff',
    borderWidth: 1.5,
    glow: true,
    glowColor: 'rgba(225, 29, 72, 0.4)',
  },
  admin: {
    role: 'admin',
    label: 'مدير (Admin)',
    iconType: 'emoji',
    iconValue: '⭐',
    bgColor: 'linear-gradient(135deg, #ea580c, #c2410c)',
    borderColor: '#fdba74',
    textColor: '#ffffff',
    borderWidth: 1.5,
    glow: true,
    glowColor: 'rgba(234, 88, 12, 0.35)',
  },
  moderator: {
    role: 'moderator',
    label: 'مشرف (Moderator)',
    iconType: 'emoji',
    iconValue: '⚡',
    bgColor: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
    borderColor: '#93c5fd',
    textColor: '#ffffff',
    borderWidth: 1.5,
    glow: true,
    glowColor: 'rgba(37, 99, 235, 0.35)',
  },
  vip: {
    role: 'vip',
    label: 'عضو مميز (VIP)',
    iconType: 'emoji',
    iconValue: '💎',
    bgColor: 'linear-gradient(135deg, #9333ea, #7e22ce)',
    borderColor: '#d8b4fe',
    textColor: '#ffffff',
    borderWidth: 1.5,
    glow: true,
    glowColor: 'rgba(147, 51, 234, 0.35)',
  },
  member: {
    role: 'member',
    label: 'عضو مسجل (Member)',
    iconType: 'emoji',
    iconValue: '👤',
    bgColor: 'linear-gradient(135deg, #059669, #047857)',
    borderColor: '#6ee7b7',
    textColor: '#ffffff',
    borderWidth: 1,
    glow: false,
  },
  visitor: {
    role: 'visitor',
    label: 'زائر (Visitor)',
    iconType: 'emoji',
    iconValue: '🌐',
    bgColor: '#e2e8f0',
    borderColor: '#cbd5e1',
    textColor: '#475569',
    borderWidth: 1,
    glow: false,
  },
};

export const PRESET_BADGE_ICONS = [
  { label: 'تاج المالك الرسمي', value: '/owner.svg' },
  { label: 'تاج ملكي', value: '👑' },
  { label: 'كأس ذهبي', value: '🏆' },
  { label: 'شعار ملكي', value: '⚜️' },
  { label: 'درع حماية', value: '🛡️' },
  { label: 'نجمة متألقة', value: '⭐' },
  { label: 'نجمة ذهبية', value: '🌟' },
  { label: 'ألماسة نادرة', value: '💎' },
  { label: 'شعلة نار', value: '🔥' },
  { label: 'صاعقة برق', value: '⚡' },
  { label: 'صاروخ فضاء', value: '🚀' },
  { label: 'أسد ملكي', value: '🦁' },
  { label: 'صقر جارح', value: '🦅' },
  { label: 'وسام شرف', value: '🎖️' },
  { label: 'رمح ثلاثي', value: '🔱' },
  { label: 'ميدالية ذهب', value: '🥇' },
  { label: 'قلب ذهبي', value: '💛' },
  { label: 'بريق سحري', value: '✨' },
  { label: 'كوكب فضائي', value: '🪐' },
  { label: 'كرة نارية', value: '💥' },
  { label: 'عين الصقر', value: '👁️' },
];

export const PRESET_BADGE_STYLES = [
  {
    name: 'ذهبي ملكي (Gold Luxury)',
    bgColor: 'linear-gradient(135deg, #f59e0b, #b45309)',
    borderColor: '#fbbf24',
    textColor: '#ffffff',
    glowColor: 'rgba(245, 158, 11, 0.45)',
  },
  {
    name: 'ياقوتي أحمر (Ruby Crimson)',
    bgColor: 'linear-gradient(135deg, #e11d48, #9f1239)',
    borderColor: '#fda4af',
    textColor: '#ffffff',
    glowColor: 'rgba(225, 29, 72, 0.4)',
  },
  {
    name: 'أزرق ملكي (Royal Sapphire)',
    bgColor: 'linear-gradient(135deg, #2563eb, #1e40af)',
    borderColor: '#93c5fd',
    textColor: '#ffffff',
    glowColor: 'rgba(37, 99, 235, 0.4)',
  },
  {
    name: 'زمردي فاخر (Emerald Green)',
    bgColor: 'linear-gradient(135deg, #059669, #065f46)',
    borderColor: '#6ee7b7',
    textColor: '#ffffff',
    glowColor: 'rgba(5, 150, 105, 0.4)',
  },
  {
    name: 'بنفسجي جمشت (Amethyst Purple)',
    bgColor: 'linear-gradient(135deg, #8b5cf6, #581c87)',
    borderColor: '#d8b4fe',
    textColor: '#ffffff',
    glowColor: 'rgba(139, 92, 246, 0.4)',
  },
  {
    name: 'برتقالي ناري (Solar Flare)',
    bgColor: 'linear-gradient(135deg, #f97316, #c2410c)',
    borderColor: '#fed7aa',
    textColor: '#ffffff',
    glowColor: 'rgba(249, 115, 22, 0.4)',
  },
  {
    name: 'سماوي نيون (Cyber Cyan)',
    bgColor: 'linear-gradient(135deg, #06b6d4, #0e7490)',
    borderColor: '#a5f3fc',
    textColor: '#ffffff',
    glowColor: 'rgba(6, 182, 212, 0.4)',
  },
  {
    name: 'أسود ملكي فاخر (Obsidian Black)',
    bgColor: 'linear-gradient(135deg, #1e293b, #0f172a)',
    borderColor: '#64748b',
    textColor: '#ffffff',
    glowColor: 'rgba(15, 23, 42, 0.5)',
  },
];

export function getRankTitle(role?: string): string {
  if (!role) return 'عضو مسجل';
  const badge = DEFAULT_ROLE_BADGES[role as UserRole];
  return badge?.label || role;
}

export function getRankEmoji(role?: string): string {
  if (!role) return '👤';
  const badge = DEFAULT_ROLE_BADGES[role as UserRole];
  if (badge?.iconType === 'emoji') return badge.iconValue;
  if (role === 'owner') return '👑';
  return '👤';
}

export function getRankColor(role?: string): string {
  if (!role) return '#059669';
  const badge = DEFAULT_ROLE_BADGES[role as UserRole];
  return badge?.textColor || '#059669';
}

