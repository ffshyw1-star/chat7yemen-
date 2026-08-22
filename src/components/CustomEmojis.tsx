import React from 'react';
import { CustomEmojiItem } from '../types';

export interface CustomEmojiDef {
  id: string;
  name: string;
  category: 'greetings' | 'drinks' | 'emotions' | 'actions' | 'love' | 'custom' | string;
  component: React.FC<{ size?: number | string; className?: string; animated?: boolean }>;
  tag: string;
  isBanner?: boolean;
  imageUrl?: string;
  isCustom?: boolean;
}

/* =========================================================================
   1. العبارات والترحيب العربي الثلاثي الأبعاد (3D Arabic Greetings)
   ========================================================================= */

// 1.1 سلام عليكم
export const AnimSalamGreeting: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <span
    className={`inline-flex items-center justify-center font-black tracking-wide select-none px-2 py-0.5 rounded-lg shadow-xs align-middle ${className}`}
    style={{
      background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #b91c1c 100%)',
      color: '#fff',
      border: '1.5px solid #fecaca',
      textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(254,202,202,0.6)',
      fontSize: typeof size === 'number' ? `${Math.max(12, size * 0.52)}px` : '13px',
      fontFamily: 'serif, Tahoma, Arial',
      lineHeight: 1.2,
      animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }}
    title="سلام عليكم"
  >
    ✨ سلام عليكم ✨
  </span>
);

// 1.2 وعليكم السلام
export const AnimWsalamGreeting: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <span
    className={`inline-flex items-center justify-center font-black tracking-wide select-none px-2.5 py-0.5 rounded-lg shadow-xs align-middle ${className}`}
    style={{
      background: 'linear-gradient(135deg, #991b1b 0%, #ef4444 50%, #7f1d1d 100%)',
      color: '#ffffff',
      border: '1.5px solid #fca5a5',
      textShadow: '0 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(252,165,165,0.7)',
      fontSize: typeof size === 'number' ? `${Math.max(12, size * 0.52)}px` : '13px',
      fontFamily: 'serif, Tahoma, Arial',
      lineHeight: 1.2,
      animation: 'pulse 2.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }}
    title="وعليكم السلام"
  >
    🌹 وعليكم السلام 🌹
  </span>
);

// 1.3 ولكمووو
export const AnimWelcomeGreeting: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <span
    className={`inline-flex items-center justify-center font-black tracking-wider select-none px-2.5 py-0.5 rounded-lg shadow-xs align-middle ${className}`}
    style={{
      background: 'linear-gradient(135deg, #a21caf 0%, #ec4899 50%, #d946ef 100%)',
      color: '#ffffff',
      border: '1.5px solid #fbcfe8',
      textShadow: '0 1px 3px rgba(0,0,0,0.7), 0 0 8px rgba(244,114,182,0.8)',
      fontSize: typeof size === 'number' ? `${Math.max(12, size * 0.52)}px` : '13px',
      fontFamily: 'Tahoma, Arial, sans-serif',
      lineHeight: 1.2,
    }}
    title="ولكمووو"
  >
    💖 ولكمووو 💖
  </span>
);

// 1.4 اهلا وسهلا
export const AnimAhlanGreeting: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <span
    className={`inline-flex items-center justify-center font-black tracking-wide select-none px-2 py-0.5 rounded-lg shadow-xs align-middle ${className}`}
    style={{
      background: 'linear-gradient(135deg, #0369a1 0%, #38bdf8 50%, #0284c7 100%)',
      color: '#ffffff',
      border: '1.5px solid #bae6fd',
      textShadow: '0 1px 3px rgba(0,0,0,0.8), 0 0 8px rgba(56,189,248,0.7)',
      fontSize: typeof size === 'number' ? `${Math.max(12, size * 0.52)}px` : '13px',
      fontFamily: 'serif, Tahoma, Arial',
      lineHeight: 1.2,
    }}
    title="اهلا وسهلا"
  >
    🌟 اهلا وسهلا 🌟
  </span>
);


/* =========================================================================
   2. الشيشة والمشروبات والجلسات (Shisha & Drinks Composite Icons)
   ========================================================================= */

// 2.1 شيشة ونارجيلة مع دخان وسمايل بنظارات
export const AnimShisha: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes smoke1 { 0% { transform: translateY(0) scale(0.8); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translateY(-10px) scale(1.3); opacity: 0; } }
      @keyframes smoke2 { 0% { transform: translateY(0) scale(0.6); opacity: 0; } 50% { opacity: 0.9; } 100% { transform: translateY(-12px) scale(1.4); opacity: 0; } }
      @keyframes shishaBlink { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
      .shisha-smoke-1 { animation: smoke1 1.8s infinite ease-out; transform-origin: center; }
      .shisha-smoke-2 { animation: smoke2 2.2s infinite ease-out 0.6s; transform-origin: center; }
      .shisha-head { animation: shishaBlink 2.5s infinite ease-in-out; transform-origin: 34px 24px; }
    `}</style>
    <g transform="translate(3, 8)">
      <path d="M12 2H16V6H12Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1" />
      <circle cx="14" cy="1" r="2" fill="#f97316" />
      <ellipse cx="14" cy="6" rx="6" ry="1.5" fill="#d97706" />
      <rect x="13" y="6" width="2" height="16" fill="#f59e0b" stroke="#78350f" strokeWidth="0.8" />
      <circle cx="14" cy="12" r="3" fill="#fbbf24" />
      <path d="M9 22H19L22 34H6L9 22Z" fill="#38bdf8" fillOpacity="0.85" stroke="#0284c7" strokeWidth="1.2" />
      <path d="M8 27H20L21 33H7L8 27Z" fill="#0284c7" fillOpacity="0.4" />
      <path d="M15 18Q24 24 30 25" stroke="#7c2d12" strokeWidth="2" strokeLinecap="round" fill="none" />
      <rect x="29" y="23" width="4" height="3" rx="1" fill="#facc15" stroke="#713f12" strokeWidth="0.8" />
    </g>
    <g>
      <circle cx="15" cy="6" r="3" fill="#cbd5e1" className="shisha-smoke-1" />
      <circle cx="18" cy="4" r="4" fill="#e2e8f0" className="shisha-smoke-2" />
    </g>
    <g className="shisha-head">
      <circle cx="34" cy="24" r="11" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
      <rect x="26" y="20" width="6" height="5" rx="1.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="34" y="20" width="6" height="5" rx="1.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <line x1="32" y1="22" x2="34" y2="22" stroke="#0f172a" strokeWidth="1.5" />
      <ellipse cx="32" cy="28" rx="2" ry="1.5" fill="#7f1d1d" />
      <circle cx="26" cy="26" r="1.5" fill="#fb7185" />
      <circle cx="41" cy="26" r="1.5" fill="#fb7185" />
    </g>
  </svg>
);

// 2.2 فنجان قهوة وشاي مع ابتسامة ودخان وبسكوت (الأيقونة الشهيرة بالصورة)
export const AnimCoffeeCup: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 34, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 54 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes steamRise { 0% { transform: translateY(0); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translateY(-7px); opacity: 0; } }
      @keyframes smileyWiggle { 0%, 100% { transform: rotate(0deg); } 25% { transform: rotate(-4deg); } 75% { transform: rotate(4deg); } }
      .steam-1 { animation: steamRise 1.6s infinite ease-out; }
      .steam-2 { animation: steamRise 1.9s infinite ease-out 0.5s; }
      .coffee-face { animation: smileyWiggle 2s infinite ease-in-out; transform-origin: 27px 18px; }
    `}</style>
    {/* Left: Steaming Mug */}
    <g transform="translate(1, 8)">
      <path d="M8 0Q6 -4 9 -8" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="steam-1" />
      <path d="M12 0Q14 -4 11 -7" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" className="steam-2" />
      <rect x="4" y="2" width="14" height="16" rx="3" fill="#ffffff" stroke="#475569" strokeWidth="1.2" />
      <path d="M6 5H16" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M4 6C1 6 1 14 4 14" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="11" cy="19" rx="10" ry="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
    </g>

    {/* Center: Cute Happy Smiley Face */}
    <g className="coffee-face">
      <circle cx="27" cy="18" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      <path d="M22 15Q24 13 26 15" stroke="#713f12" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M28 15Q30 13 32 15" stroke="#713f12" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M23 20Q27 25 31 20" stroke="#78350f" strokeWidth="1.6" fill="#dc2626" />
      <ellipse cx="27" cy="22" rx="2" ry="1" fill="#f87171" />
      <circle cx="21" cy="19" r="1.5" fill="#f43f5e" />
      <circle cx="33" cy="19" r="1.5" fill="#f43f5e" />
    </g>

    {/* Right: Biscuit / Sweet cookie */}
    <g transform="translate(39, 12)">
      <circle cx="6" cy="6" r="5.5" fill="#d97706" stroke="#92400e" strokeWidth="1" />
      <circle cx="4" cy="4" r="0.9" fill="#78350f" />
      <circle cx="8" cy="5" r="0.9" fill="#78350f" />
      <circle cx="5" cy="8" r="0.9" fill="#78350f" />
      <circle cx="8" cy="8" r="0.9" fill="#78350f" />
    </g>
  </svg>
);

// 2.3 علبة بيبسي مثلجة
export const AnimPepsi: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes iceGlow { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
      .pepsi-can { animation: iceGlow 2s infinite ease-in-out; transform-origin: 18px 18px; }
    `}</style>
    <g className="pepsi-can">
      <rect x="9" y="6" width="18" height="25" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1.2" />
      <ellipse cx="18" cy="6" rx="9" ry="2.5" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
      <ellipse cx="18" cy="31" rx="9" ry="2.5" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
      <path d="M9 14C12 12 15 16 18 14C21 12 24 16 27 14V21C24 23 21 19 18 21C15 23 12 19 9 21V14Z" fill="#ef4444" />
      <path d="M9 17C13 15 15 19 18 17C21 15 23 19 27 17V19C23 21 21 17 18 19C15 21 13 17 9 19V17Z" fill="#ffffff" />
      <circle cx="12" cy="10" r="0.8" fill="#ffffff" opacity="0.9" />
      <circle cx="23" cy="26" r="0.8" fill="#ffffff" opacity="0.9" />
    </g>
  </svg>
);

// 2.4 كوب شاي أحمر ساخن مع نعناع وبخار
export const AnimHotTea: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes teaSteam { 0% { transform: translateY(0); opacity: 0; } 50% { opacity: 0.9; } 100% { transform: translateY(-8px); opacity: 0; } }
      .tea-steam { animation: teaSteam 1.7s infinite ease-out; }
    `}</style>
    <path d="M14 8Q12 4 15 0" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" className="tea-steam" />
    <path d="M20 8Q22 4 19 1" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" className="tea-steam" style={{ animationDelay: '0.6s' }} />
    <path d="M10 10H26L23 30H13L10 10Z" fill="#dc2626" fillOpacity="0.85" stroke="#b91c1c" strokeWidth="1.2" />
    <ellipse cx="18" cy="10" rx="8" ry="2" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
    <path d="M15 12C14 9 17 8 18 10C19 8 22 9 21 12Z" fill="#22c55e" />
    <ellipse cx="18" cy="31" rx="12" ry="2.5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1" />
  </svg>
);

// 2.5 سمايل يدخن سيجارة مع تصاعد الدخان
export const AnimSmokingSmiley: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 30, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 40 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes cigSmoke { 0% { transform: translateY(0) scale(0.7); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translateY(-9px) scale(1.3); opacity: 0; } }
      .cig-smoke { animation: cigSmoke 1.6s infinite ease-out; transform-origin: 32px 14px; }
    `}</style>
    <circle cx="16" cy="18" r="13" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
    {/* Half closed smug eye */}
    <path d="M8 15Q12 18 15 15" stroke="#713f12" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M17 15Q21 18 24 15" stroke="#713f12" strokeWidth="2" strokeLinecap="round" fill="none" />
    {/* Mouth holding cigarette */}
    <path d="M11 23Q16 26 21 23" stroke="#713f12" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    {/* Cigarette */}
    <rect x="18" y="21" width="14" height="3.5" rx="1" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
    <rect x="18" y="21" width="4" height="3.5" fill="#f59e0b" />
    <circle cx="32" cy="22.5" r="1.5" fill="#ef4444" />
    {/* Smoke rising from tip */}
    <circle cx="33" cy="16" r="2.5" fill="#cbd5e1" className="cig-smoke" />
    <circle cx="35" cy="11" r="3.5" fill="#e2e8f0" className="cig-smoke" style={{ animationDelay: '0.5s' }} />
  </svg>
);


/* =========================================================================
   3. تفاعلات وسمايلات ريترو كلاسيكية (Retro Animated Smileys)
   ========================================================================= */

// 3.1 ضحك وتدحرج ROFL
export const AnimRoflLaugh: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes roflRoll { 0%, 100% { transform: rotate(-15deg); } 50% { transform: rotate(20deg) scale(1.1); } }
      .rofl-head { animation: roflRoll 1.2s infinite ease-in-out; transform-origin: 18px 18px; }
    `}</style>
    <g className="rofl-head">
      <circle cx="18" cy="18" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
      <path d="M9 13L15 16L9 19" stroke="#713f12" strokeWidth="2" strokeLinecap="round" />
      <path d="M27 13L21 16L27 19" stroke="#713f12" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 20C10 27 14 30 18 30C22 30 26 27 26 20H10Z" fill="#7f1d1d" stroke="#991b1b" strokeWidth="1" />
      <ellipse cx="18" cy="26" rx="4" ry="2" fill="#fb7185" />
      <path d="M6 14C5 12 7 10 9 12C9 14 7 15 6 14Z" fill="#38bdf8" />
      <path d="M30 14C31 12 29 10 27 12C27 14 29 15 30 14Z" fill="#38bdf8" />
    </g>
  </svg>
);

// 3.2 قبلة وقلوب متطايرة Kiss
export const AnimKissLove: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes floatHeart { 0% { transform: translate(0, 0) scale(0.6); opacity: 0; } 50% { opacity: 1; transform: translate(6px, -6px) scale(1.1); } 100% { opacity: 0; transform: translate(12px, -14px) scale(1.4); } }
      .kiss-heart { animation: floatHeart 1.8s infinite ease-out; transform-origin: 24px 14px; }
    `}</style>
    <circle cx="16" cy="19" r="13" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
    <path d="M8 17Q11 14 14 17" stroke="#713f12" strokeWidth="2" strokeLinecap="round" fill="none" />
    <circle cx="21" cy="16" r="2" fill="#713f12" />
    <path d="M26 21C28 20 28 23 26 23C27 24 27 26 25 25" stroke="#be123c" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <circle cx="12" cy="21" r="2.5" fill="#f43f5e" opacity="0.8" />
    <g className="kiss-heart">
      <path d="M27 10C27 8 29 6 31 7C33 8 33 11 31 13L27 16L23 13C21 11 21 8 23 7C25 6 27 8 27 10Z" fill="#e11d48" stroke="#be123c" strokeWidth="0.8" />
    </g>
  </svg>
);

// 3.3 نظارات شمسية كشخة Cool
export const AnimCoolGlasses: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes coolBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
      .cool-head { animation: coolBounce 1.5s infinite ease-in-out; }
    `}</style>
    <g className="cool-head">
      <circle cx="18" cy="18" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
      <path d="M6 14H30V20C30 22 28 24 25 24H21L18 20L15 24H11C8 24 6 22 6 20V14Z" fill="#0f172a" stroke="#334155" strokeWidth="1.2" />
      <line x1="9" y1="16" x2="13" y2="21" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="22" y1="16" x2="26" y2="21" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M13 25C15 28 21 28 23 25" stroke="#713f12" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="5" cy="22" r="1.5" fill="#f59e0b" stroke="#78350f" strokeWidth="0.5" />
    </g>
  </svg>
);

// 3.4 غضبان ونار مشتعلة Angry Fire
export const AnimAngryFire: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes fireFlicker { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15) rotate(4deg); } }
      @keyframes angryShake { 0%, 100% { transform: translate(0, 0); } 20% { transform: translate(-1px, 1px); } 40% { transform: translate(1px, -1px); } 60% { transform: translate(-1px, -1px); } 80% { transform: translate(1px, 1px); } }
      .angry-fire { animation: fireFlicker 0.6s infinite ease-in-out; transform-origin: 18px 8px; }
      .angry-body { animation: angryShake 0.4s infinite linear; }
    `}</style>
    <g className="angry-fire">
      <path d="M12 12C10 7 13 4 15 2C17 6 19 3 21 1C23 4 25 7 24 12Z" fill="#f97316" />
      <path d="M15 12C14 9 16 6 18 4C20 7 21 9 20 12Z" fill="#facc15" />
    </g>
    <g className="angry-body">
      <circle cx="18" cy="20" r="13" fill="#ef4444" stroke="#991b1b" strokeWidth="1.5" />
      <path d="M9 16L16 19" stroke="#450a0a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 16L20 19" stroke="#450a0a" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="13" cy="21" r="2" fill="#ffffff" />
      <circle cx="13" cy="21" r="1" fill="#000000" />
      <circle cx="23" cy="21" r="2" fill="#ffffff" />
      <circle cx="23" cy="21" r="1" fill="#000000" />
      <path d="M13 28C15 25 21 25 23 28H13Z" fill="#450a0a" stroke="#000000" strokeWidth="1" />
      <path d="M15 26H21" stroke="#ffffff" strokeWidth="1.5" />
    </g>
  </svg>
);

// 3.5 دموع وبكاء Crying Tears
export const AnimCryingTears: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes tearStream { 0% { transform: scaleY(0.8); opacity: 0.7; } 50% { transform: scaleY(1.2); opacity: 1; } 100% { transform: scaleY(0.8); opacity: 0.7; } }
      .tear-stream { animation: tearStream 0.8s infinite ease-in-out; transform-origin: top; }
    `}</style>
    <circle cx="18" cy="18" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
    <path d="M10 15Q14 11 17 15" stroke="#713f12" strokeWidth="2" strokeLinecap="round" fill="none" />
    <path d="M19 15Q22 11 26 15" stroke="#713f12" strokeWidth="2" strokeLinecap="round" fill="none" />
    <g className="tear-stream">
      <rect x="11" y="16" width="3.5" height="15" rx="1.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
      <rect x="21.5" y="16" width="3.5" height="15" rx="1.5" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
    </g>
    <path d="M13 26Q18 22 23 26" stroke="#78350f" strokeWidth="2" strokeLinecap="round" fill="none" />
  </svg>
);

// 3.6 خجول وحياء Shy Blush
export const AnimShyBlush: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes blushGlow { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
      .shy-blush { animation: blushGlow 1.5s infinite ease-in-out; }
    `}</style>
    <circle cx="18" cy="18" r="14" fill="#fef08a" stroke="#eab308" strokeWidth="1.5" />
    <ellipse cx="14" cy="16" rx="2" ry="2.5" fill="#713f12" />
    <ellipse cx="22" cy="16" rx="2" ry="2.5" fill="#713f12" />
    <circle cx="13" cy="15" r="0.8" fill="#ffffff" />
    <circle cx="21" cy="15" r="0.8" fill="#ffffff" />
    <g className="shy-blush">
      <ellipse cx="11" cy="21" rx="4" ry="2.5" fill="#f43f5e" />
      <ellipse cx="25" cy="21" rx="4" ry="2.5" fill="#f43f5e" />
    </g>
    <path d="M16 23Q18 25 20 23" stroke="#881337" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    <ellipse cx="13" cy="27" rx="3" ry="2" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
    <ellipse cx="23" cy="27" rx="3" ry="2" fill="#fde047" stroke="#ca8a04" strokeWidth="1" />
  </svg>
);

// 3.7 سمايل الشيطان الشرير بقرون Devil Horns (موجود بالسطر الأول بالصورة)
export const AnimDevilEvil: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes devilGrin { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.08); } }
      .devil-head { animation: devilGrin 1.5s infinite ease-in-out; transform-origin: 18px 18px; }
    `}</style>
    <g className="devil-head">
      {/* Red Horns */}
      <path d="M10 10L6 3L13 7Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
      <path d="M26 10L30 3L23 7Z" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
      <circle cx="18" cy="19" r="13" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      {/* Evil Slanted Eyes */}
      <path d="M11 15L16 18" stroke="#713f12" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M25 15L20 18" stroke="#713f12" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="13.5" cy="18.5" r="1.5" fill="#713f12" />
      <circle cx="22.5" cy="18.5" r="1.5" fill="#713f12" />
      {/* Evil Grin */}
      <path d="M12 24C14 28 22 28 24 24" stroke="#713f12" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M16 26L18 28L20 26" stroke="#ffffff" strokeWidth="1.5" fill="#ffffff" />
    </g>
  </svg>
);

// 3.8 سمايل يصفق بيديه بحماس Clapping
export const AnimClappingSmiley: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes clapMotion { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
      .clapper { animation: clapMotion 0.6s infinite ease-in-out; transform-origin: 19px 18px; }
    `}</style>
    <g className="clapper">
      <circle cx="19" cy="18" r="13" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      <path d="M14 15Q16 12 18 15" stroke="#713f12" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M20 15Q22 12 24 15" stroke="#713f12" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M15 22Q19 26 23 22" stroke="#713f12" strokeWidth="2" fill="#ef4444" />
      {/* Clapping Hands on Bottom */}
      <ellipse cx="14" cy="28" rx="4" ry="2.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <ellipse cx="24" cy="28" rx="4" ry="2.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      {/* Sparkles */}
      <line x1="19" y1="26" x2="19" y2="30" stroke="#f59e0b" strokeWidth="1.5" />
    </g>
  </svg>
);

// 3.9 سمايل نائم بالسرير وتحت البطانية Sleeping in Bed (موجود بالصورة)
export const AnimSleepingBed: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 42 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes snoringZ { 0% { transform: translate(0, 0) scale(0.6); opacity: 0; } 50% { opacity: 1; } 100% { transform: translate(6px, -10px) scale(1.2); opacity: 0; } }
      .snore-z { animation: snoringZ 1.8s infinite ease-out; }
    `}</style>
    {/* Pillow */}
    <rect x="4" y="10" width="16" height="12" rx="3" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="1" />
    {/* Sleeping Head */}
    <circle cx="14" cy="16" r="9" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
    <path d="M10 15H13" stroke="#713f12" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M15 15H18" stroke="#713f12" strokeWidth="1.5" strokeLinecap="round" />
    <ellipse cx="14" cy="19" rx="1.5" ry="2" fill="#713f12" />
    {/* Nightcap Hat */}
    <path d="M8 10L14 3L18 10Z" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
    <circle cx="14" cy="3" r="2" fill="#ffffff" />
    {/* Blanket */}
    <path d="M6 20H38V32H6Z" fill="#60a5fa" stroke="#2563eb" strokeWidth="1.2" />
    <path d="M6 20C12 18 20 22 26 20C32 18 36 20 38 20" stroke="#ffffff" strokeWidth="1.5" />
    {/* ZZZ */}
    <text x="24" y="12" fill="#3b82f6" fontSize="10" fontWeight="900" className="snore-z">Z</text>
  </svg>
);

// 3.10 سمايل يأكل بشوكة وسكينة ومريلة Eating Food
export const AnimEatingSmiley: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 30, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes chewMotion { 0%, 100% { transform: scaleY(1); } 50% { transform: scaleY(1.08); } }
      .chewer { animation: chewMotion 0.8s infinite ease-in-out; transform-origin: 19px 16px; }
    `}</style>
    <g className="chewer">
      {/* Baby / Dining Bib */}
      <path d="M12 18C12 28 26 28 26 18Z" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" />
      <circle cx="19" cy="15" r="11" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      <circle cx="15" cy="13" r="1.5" fill="#713f12" />
      <circle cx="23" cy="13" r="1.5" fill="#713f12" />
      {/* Chewing Mouth */}
      <ellipse cx="19" cy="18" rx="3" ry="2" fill="#dc2626" />
      {/* Fork on Left */}
      <path d="M6 10V22M4 10V14M8 10V14" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
      {/* Knife on Right */}
      <path d="M32 10V22M32 10C34 12 34 16 32 18" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
);

// 2.6 سمايل مع قهوة وموبايل/قراءة (محمد-dz: ☕🙂📱)
export const AnimCoffeePhone: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 34, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 54 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes steamRisePhone { 0% { transform: translateY(0); opacity: 0; } 50% { opacity: 0.8; } 100% { transform: translateY(-7px); opacity: 0; } }
      @keyframes phoneGlow { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-3deg); } }
      .steam-p1 { animation: steamRisePhone 1.6s infinite ease-out; }
      .phone-face { animation: phoneGlow 2.2s infinite ease-in-out; transform-origin: 27px 18px; }
    `}</style>
    {/* Left: Steaming Mug */}
    <g transform="translate(1, 8)">
      <path d="M8 0Q6 -4 9 -8" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" className="steam-p1" />
      <rect x="4" y="2" width="14" height="16" rx="3" fill="#ffffff" stroke="#475569" strokeWidth="1.2" />
      <path d="M6 5H16" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M4 6C1 6 1 14 4 14" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <ellipse cx="11" cy="19" rx="10" ry="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="1" />
    </g>

    {/* Center: Cute Happy Smiley Face */}
    <g className="phone-face">
      <circle cx="27" cy="18" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      <circle cx="23" cy="15" r="1.5" fill="#713f12" />
      <circle cx="31" cy="15" r="1.5" fill="#713f12" />
      <path d="M23 20Q27 24 31 20" stroke="#78350f" strokeWidth="1.6" fill="#dc2626" />
      <circle cx="21" cy="18" r="1.5" fill="#f43f5e" />
      <circle cx="33" cy="18" r="1.5" fill="#f43f5e" />
    </g>

    {/* Right: Mobile Phone / Tablet */}
    <g transform="translate(39, 10)">
      <rect x="1" y="2" width="12" height="18" rx="2" fill="#0f172a" stroke="#334155" strokeWidth="1" />
      <rect x="2.5" y="4" width="9" height="12" rx="1" fill="#38bdf8" />
      <circle cx="7" cy="18" r="0.8" fill="#cbd5e1" />
    </g>
  </svg>
);

// 3.11 غمزة ذكية Wink
export const AnimWinkSmile: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes winkEye { 0%, 100% { transform: scaleY(1); } 40%, 60% { transform: scaleY(0.1); } }
      .wink-l { animation: winkEye 2s infinite ease-in-out; transform-origin: 13px 15px; }
    `}</style>
    <circle cx="18" cy="18" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="1.4" />
    <path d="M9 15Q13 12 17 15" stroke="#713f12" strokeWidth="2.2" strokeLinecap="round" fill="none" className="wink-l" />
    <circle cx="23" cy="15" r="2.2" fill="#713f12" />
    <path d="M12 22Q18 28 24 22" stroke="#713f12" strokeWidth="2" strokeLinecap="round" fill="none" />
    <circle cx="8" cy="20" r="2" fill="#fb7185" />
    <circle cx="28" cy="20" r="2" fill="#fb7185" />
  </svg>
);

// 3.12 ثنائي يتعانق بحب Hugging Smileys
export const AnimHugDuo: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes hugSqueeze { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
      .hug-group { animation: hugSqueeze 1.6s infinite ease-in-out; transform-origin: 22px 18px; }
    `}</style>
    <g className="hug-group">
      <circle cx="15" cy="18" r="11" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      <circle cx="29" cy="18" r="11" fill="#fde047" stroke="#ca8a04" strokeWidth="1.2" />
      <circle cx="11" cy="15" r="1.5" fill="#713f12" />
      <circle cx="33" cy="15" r="1.5" fill="#713f12" />
      <path d="M12 21Q16 24 20 21" stroke="#713f12" strokeWidth="1.5" fill="#ef4444" />
      <path d="M24 21Q28 24 32 21" stroke="#713f12" strokeWidth="1.5" fill="#ef4444" />
      <path d="M19 10C19 8 21 7 22 8C23 7 25 8 25 10C25 13 22 15 22 15C22 15 19 13 19 10Z" fill="#e11d48" />
    </g>
  </svg>
);

// 3.13 كتكوت أصفر Cute Chick
export const AnimChick: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes flapWing { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(-15deg); } }
      .chick-wing { animation: flapWing 0.6s infinite ease-in-out; transform-origin: 10px 20px; }
    `}</style>
    <circle cx="18" cy="19" r="13" fill="#fde047" stroke="#ca8a04" strokeWidth="1.2" />
    <circle cx="14" cy="15" r="2" fill="#0f172a" />
    <circle cx="22" cy="15" r="2" fill="#0f172a" />
    <circle cx="13" cy="14" r="0.7" fill="#ffffff" />
    <circle cx="21" cy="14" r="0.7" fill="#ffffff" />
    {/* Orange Beak */}
    <path d="M15 18L18 22L21 18Z" fill="#f97316" stroke="#c2410c" strokeWidth="0.8" />
    {/* Wings */}
    <path d="M6 18C4 14 7 12 10 16" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" className="chick-wing" />
    <path d="M30 18C32 14 29 12 26 16" stroke="#eab308" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 3.14 نظارات طبية وذكاء Nerd
export const AnimNerdGlasses: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <circle cx="18" cy="18" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="1.3" />
    {/* Big Glasses */}
    <circle cx="12" cy="16" r="6" fill="#ffffff" fillOpacity="0.7" stroke="#0f172a" strokeWidth="2" />
    <circle cx="24" cy="16" r="6" fill="#ffffff" fillOpacity="0.7" stroke="#0f172a" strokeWidth="2" />
    <line x1="18" y1="16" x2="18" y2="16" stroke="#0f172a" strokeWidth="2" />
    <circle cx="12" cy="16" r="2" fill="#0f172a" />
    <circle cx="24" cy="16" r="2" fill="#0f172a" />
    {/* Buck Teeth */}
    <path d="M14 24H22" stroke="#713f12" strokeWidth="1.8" strokeLinecap="round" />
    <rect x="15" y="24" width="3" height="4" fill="#ffffff" stroke="#713f12" strokeWidth="0.8" />
    <rect x="18" y="24" width="3" height="4" fill="#ffffff" stroke="#713f12" strokeWidth="0.8" />
  </svg>
);

// 3.15 سمايل بنت بفيونكات وردية Girl with Bows
export const AnimGirlBows: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes bowBounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
      .girl-bows { animation: bowBounce 1.5s infinite ease-in-out; }
    `}</style>
    <g className="girl-bows">
      {/* Pink Bows */}
      <circle cx="6" cy="10" r="3" fill="#ec4899" />
      <circle cx="30" cy="10" r="3" fill="#ec4899" />
      <circle cx="18" cy="19" r="13" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      {/* Eyelashes */}
      <circle cx="13" cy="16" r="2" fill="#713f12" />
      <path d="M10 13L12 14" stroke="#713f12" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="23" cy="16" r="2" fill="#713f12" />
      <path d="M26 13L24 14" stroke="#713f12" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 22Q18 26 22 22" stroke="#713f12" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="9" cy="20" r="2.5" fill="#fb7185" />
      <circle cx="27" cy="20" r="2.5" fill="#fb7185" />
    </g>
  </svg>
);

// 3.16 متجمد وبردان Cold Shivering
export const AnimColdShiver: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes coldShake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-1px); } 75% { transform: translateX(1px); } }
      .cold-head { animation: coldShake 0.15s infinite; }
    `}</style>
    <g className="cold-head">
      <circle cx="18" cy="18" r="14" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.3" />
      <circle cx="13" cy="15" r="2" fill="#0c4a6e" />
      <circle cx="23" cy="15" r="2" fill="#0c4a6e" />
      {/* Chattering teeth */}
      <path d="M12 24H24V28H12Z" fill="#ffffff" stroke="#0c4a6e" strokeWidth="1" />
      <line x1="16" y1="24" x2="16" y2="28" stroke="#0c4a6e" strokeWidth="1" />
      <line x1="20" y1="24" x2="20" y2="28" stroke="#0c4a6e" strokeWidth="1" />
      {/* Icicles */}
      <path d="M10 6L12 10L14 6L16 11L18 6L20 10L22 6L24 11L26 6" stroke="#e0f2fe" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

// 3.17 يمشي بعكاز Walking with Cane
export const AnimWalkingStick: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 30, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes walkLimp { 0%, 100% { transform: rotate(0deg); } 50% { transform: rotate(4deg); } }
      .walker { animation: walkLimp 1.2s infinite ease-in-out; transform-origin: 18px 30px; }
    `}</style>
    <g className="walker">
      <circle cx="18" cy="14" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      <circle cx="15" cy="13" r="1.5" fill="#713f12" />
      <circle cx="21" cy="13" r="1.5" fill="#713f12" />
      <path d="M15 18Q18 20 21 18" stroke="#713f12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Body & Legs */}
      <line x1="18" y1="24" x2="18" y2="32" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="32" x2="14" y2="35" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="32" x2="22" y2="35" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
      {/* Cane */}
      <path d="M28 16C28 12 32 12 32 16V35" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" fill="none" />
    </g>
  </svg>
);

// 3.18 يغطي عينيه Peekaboo / Shy
export const AnimPeekabooEyes: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <circle cx="18" cy="18" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
    <path d="M14 24Q18 28 22 24" stroke="#713f12" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    {/* Hands over eyes */}
    <ellipse cx="12" cy="16" rx="5" ry="4" fill="#fde047" stroke="#ca8a04" strokeWidth="1.2" />
    <ellipse cx="24" cy="16" rx="5" ry="4" fill="#fde047" stroke="#ca8a04" strokeWidth="1.2" />
    <line x1="10" y1="14" x2="14" y2="14" stroke="#713f12" strokeWidth="1" />
    <line x1="22" y1="14" x2="26" y2="14" stroke="#713f12" strokeWidth="1" />
  </svg>
);

// 3.19 ابتسامة عريضة مع أسنان Grin Teeth
export const AnimTeethGrin: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <circle cx="18" cy="18" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="1.3" />
    <ellipse cx="12" cy="13" rx="2.5" ry="3.5" fill="#713f12" />
    <ellipse cx="24" cy="13" rx="2.5" ry="3.5" fill="#713f12" />
    {/* Big Teeth Smile */}
    <path d="M8 20C8 28 28 28 28 20H8Z" fill="#ffffff" stroke="#713f12" strokeWidth="1.5" />
    <line x1="8" y1="23.5" x2="28" y2="23.5" stroke="#713f12" strokeWidth="1" />
    <line x1="13" y1="20" x2="13" y2="27" stroke="#713f12" strokeWidth="1" />
    <line x1="18" y1="20" x2="18" y2="27" stroke="#713f12" strokeWidth="1" />
    <line x1="23" y1="20" x2="23" y2="27" stroke="#713f12" strokeWidth="1" />
  </svg>
);

// 3.20 عيون حلزونية دايخ Spiral Dizzy
export const AnimSpiralDizzy: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes spinEye { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      .spiral-e { animation: spinEye 2s infinite linear; transform-origin: center; }
    `}</style>
    <circle cx="18" cy="18" r="14" fill="#facc15" stroke="#ca8a04" strokeWidth="1.3" />
    <g transform="translate(12, 14)" className="spiral-e">
      <circle cx="0" cy="0" r="4" stroke="#713f12" strokeWidth="1.5" fill="none" />
      <line x1="-3" y1="-3" x2="3" y2="3" stroke="#713f12" strokeWidth="1.2" />
    </g>
    <g transform="translate(24, 14)" className="spiral-e">
      <circle cx="0" cy="0" r="4" stroke="#713f12" strokeWidth="1.5" fill="none" />
      <line x1="-3" y1="-3" x2="3" y2="3" stroke="#713f12" strokeWidth="1.2" />
    </g>
    <path d="M12 24Q18 20 24 24" stroke="#713f12" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);

// 3.21 أنمي مع حبة عرق خجول Anime Sweat
export const AnimSweatAnime: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <circle cx="18" cy="18" r="14" fill="#fef08a" stroke="#eab308" strokeWidth="1.2" />
    <ellipse cx="13" cy="16" rx="2" ry="2.5" fill="#713f12" />
    <ellipse cx="23" cy="16" rx="2" ry="2.5" fill="#713f12" />
    <path d="M14 23Q18 26 22 23" stroke="#713f12" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    {/* Blue Sweat Drop */}
    <path d="M28 8C28 6 30 4 30 4C30 4 32 6 32 8C32 10 30 11 28 8Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
  </svg>
);

// 3.22 كشخة مع قلوب ونار حوله Cool Flame Hearts
export const AnimCoolFlame: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 30, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes heartGlow { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
      .flame-h { animation: heartGlow 1.2s infinite ease-in-out; }
    `}</style>
    <g className="flame-h">
      <path d="M8 8C8 6 10 5 11 6C12 5 14 6 14 8C14 11 11 13 11 13C11 13 8 11 8 8Z" fill="#ef4444" />
      <path d="M26 6C26 4 28 3 29 4C30 3 32 4 32 6C32 9 29 11 29 11C29 11 26 9 26 6Z" fill="#ef4444" />
    </g>
    <circle cx="19" cy="19" r="13" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
    <path d="M8 15H30V20C30 22 28 24 25 24H21L19 20L17 24H13C10 24 8 22 8 20V15Z" fill="#0f172a" />
    <line x1="11" y1="17" x2="15" y2="22" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="23" y1="17" x2="27" y2="22" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M14 26Q19 29 24 26" stroke="#713f12" strokeWidth="1.8" strokeLinecap="round" fill="none" />
  </svg>
);



/* =========================================================================
   4. حركات ورقص وأنشطة (Actions, Dance & Fun Smileys)
   ========================================================================= */

// 4.1 على اللابتوب يكتب بسرعة
export const AnimLaptopTyping: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 44 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes fastTyping { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
      .laptop-head { animation: fastTyping 0.3s infinite ease-in-out; transform-origin: 22px 14px; }
    `}</style>
    <g className="laptop-head">
      <circle cx="22" cy="14" r="11" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      <circle cx="18" cy="12" r="1.8" fill="#713f12" />
      <circle cx="26" cy="12" r="1.8" fill="#713f12" />
      <path d="M19 18C21 21 23 21 25 18" stroke="#713f12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M17 3L22 6L27 3" stroke="#ec4899" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </g>
    <g transform="translate(10, 18)">
      <path d="M4 14L1 2H23L20 14H4Z" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.2" />
      <rect x="5" y="4" width="14" height="7" fill="#0f172a" />
      <rect x="7" y="6" width="10" height="3" fill="#22c55e" />
      <path d="M0 14H24L22 17H2L0 14Z" fill="#64748b" stroke="#334155" strokeWidth="1" />
    </g>
  </svg>
);

// 4.2 سمايلان يرقصان معا بمرح
export const AnimDanceDuo: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 34, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 46 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes danceLeft { 0%, 100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-4px) rotate(6deg); } }
      @keyframes danceRight { 0%, 100% { transform: translateY(-4px) rotate(6deg); } 50% { transform: translateY(0) rotate(-6deg); } }
      .dancer-left { animation: danceLeft 0.8s infinite ease-in-out; transform-origin: 14px 20px; }
      .dancer-right { animation: danceRight 0.8s infinite ease-in-out; transform-origin: 32px 20px; }
    `}</style>
    <g className="dancer-left">
      <circle cx="14" cy="18" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      <circle cx="11" cy="16" r="1.5" fill="#713f12" />
      <circle cx="17" cy="16" r="1.5" fill="#713f12" />
      <path d="M11 21Q14 25 17 21" stroke="#713f12" strokeWidth="1.5" fill="#ef4444" />
      <circle cx="9" cy="9" r="2.5" fill="#ec4899" />
    </g>
    <g className="dancer-right">
      <circle cx="32" cy="18" r="10" fill="#fde047" stroke="#ca8a04" strokeWidth="1.2" />
      <circle cx="29" cy="16" r="1.5" fill="#713f12" />
      <circle cx="35" cy="16" r="1.5" fill="#713f12" />
      <path d="M29 21Q32 25 35 21" stroke="#713f12" strokeWidth="1.5" fill="#ef4444" />
      <circle cx="37" cy="9" r="2.5" fill="#8b5cf6" />
    </g>
    <path d="M23 4L25 2V8" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="24" cy="8" r="1.5" fill="#ec4899" />
  </svg>
);

// 4.3 يطل من وراء الباب Peek Door
export const AnimPeekDoor: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes peekMotion { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(-4px); } }
      .peeker-head { animation: peekMotion 1.8s infinite ease-in-out; }
    `}</style>
    <rect x="24" y="2" width="12" height="32" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
    <circle cx="27" cy="18" r="2" fill="#facc15" stroke="#78350f" strokeWidth="0.8" />
    <g className="peeker-head">
      <circle cx="16" cy="18" r="11" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      <ellipse cx="12" cy="15" rx="3" ry="4" fill="#ffffff" stroke="#713f12" strokeWidth="0.8" />
      <ellipse cx="19" cy="15" rx="3" ry="4" fill="#ffffff" stroke="#713f12" strokeWidth="0.8" />
      <circle cx="11" cy="15" r="1.8" fill="#0f172a" />
      <circle cx="18" cy="15" r="1.8" fill="#0f172a" />
      <path d="M12 23C15 25 18 25 21 22" stroke="#713f12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </g>
  </svg>
);

// 4.4 ساحرة على مكنسة Witch on Broom
export const AnimWitchBroom: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 46 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes broomFly { 0%, 100% { transform: translateY(0) rotate(2deg); } 50% { transform: translateY(-5px) rotate(-4deg); } }
      .broom-flying { animation: broomFly 1.5s infinite ease-in-out; transform-origin: 23px 18px; }
    `}</style>
    <g className="broom-flying">
      <path d="M16 6L23 0L24 7H14Z" fill="#581c87" stroke="#3b0764" strokeWidth="1" />
      <ellipse cx="20" cy="7" rx="9" ry="2" fill="#7e22ce" />
      <circle cx="20" cy="16" r="8" fill="#facc15" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="17" cy="15" r="1.2" fill="#713f12" />
      <circle cx="22" cy="15" r="1.2" fill="#713f12" />
      <path d="M17 19C19 22 22 21 23 19" stroke="#713f12" strokeWidth="1.2" fill="#ec4899" />
      <line x1="2" y1="26" x2="42" y2="18" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M38 18L44 14L46 22L39 20Z" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
    </g>
  </svg>
);

// 4.5 سمايل صاروخ يطير بسرعة Rocket Flying
export const AnimRocketFly: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 30, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 38 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes rocketSpeed { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(4px, -3px); } }
      .rocket-body { animation: rocketSpeed 0.5s infinite ease-in-out; }
    `}</style>
    <g className="rocket-body">
      <path d="M2 18L10 14L8 18L10 22Z" fill="#f97316" />
      <path d="M0 18L6 16L4 18L6 20Z" fill="#facc15" />
      <circle cx="20" cy="18" r="12" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
      <rect x="16" y="14" width="10" height="6" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
      <line x1="10" y1="17" x2="16" y2="17" stroke="#0f172a" strokeWidth="1.5" />
      <line x1="8" y1="8" x2="2" y2="8" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="8" y1="28" x2="2" y2="28" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" />
    </g>
  </svg>
);

// 4.6 سمايلان يطيران بأجنحة ملاك/فراشة Flying Angels
export const AnimAngelFly: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 32, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 46 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes angelHover { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-4px); } }
      .angel-pair { animation: angelHover 1.6s infinite ease-in-out; }
    `}</style>
    <g className="angel-pair">
      {/* Halo */}
      <ellipse cx="23" cy="6" rx="8" ry="2" stroke="#f59e0b" strokeWidth="1.5" fill="none" />
      {/* Angel Wings */}
      <path d="M12 18C4 10 2 24 12 24" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.2" />
      <path d="M34 18C42 10 44 24 34 24" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.2" />
      {/* Cute Head */}
      <circle cx="23" cy="18" r="10" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
      <circle cx="20" cy="16" r="1.5" fill="#713f12" />
      <circle cx="26" cy="16" r="1.5" fill="#713f12" />
      <path d="M20 20Q23 23 26 20" stroke="#713f12" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </g>
  </svg>
);


/* =========================================================================
   5. قلوب وورود ومحبة (Love & Roses)
   ========================================================================= */

// 5.1 وردة حمراء جورية فواحة Red Rose
export const AnimRedRose: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes roseBloom { 0%, 100% { transform: scale(1) rotate(0deg); } 50% { transform: scale(1.08) rotate(3deg); } }
      .rose-head { animation: roseBloom 2s infinite ease-in-out; transform-origin: 18px 14px; }
    `}</style>
    <g className="rose-head">
      <path d="M18 16Q16 26 18 34" stroke="#15803d" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M17 24C12 23 11 27 16 27Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
      <path d="M18 22C23 21 24 25 19 25Z" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
      <circle cx="18" cy="14" r="10" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
      <path d="M12 12C12 7 24 7 24 12C24 18 12 18 12 12Z" fill="#ef4444" />
      <path d="M14 13C14 10 22 10 22 13C22 16 14 16 14 13Z" fill="#f87171" />
      <circle cx="18" cy="13" r="2.5" fill="#7f1d1d" />
      <circle cx="21" cy="10" r="1" fill="#ffffff" />
    </g>
  </svg>
);

// 5.2 إطار قلب حب وردي مع وجه مبتسم
export const AnimHeartSmile: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes heartBeat { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.12); } }
      .heart-frame { animation: heartBeat 1.4s infinite ease-in-out; transform-origin: 18px 18px; }
    `}</style>
    <g className="heart-frame">
      <path
        d="M18 7C14 2 6 5 6 12C6 19 18 29 18 29C18 29 30 19 30 12C30 5 22 2 18 7Z"
        fill="#fdf2f8"
        stroke="#ec4899"
        strokeWidth="2.5"
      />
      <circle cx="18" cy="15" r="7" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
      <circle cx="16" cy="14" r="1" fill="#713f12" />
      <circle cx="20" cy="14" r="1" fill="#713f12" />
      <path d="M16 17Q18 20 20 17" stroke="#713f12" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <circle cx="14" cy="16" r="1" fill="#f43f5e" />
      <circle cx="22" cy="16" r="1" fill="#f43f5e" />
    </g>
  </svg>
);

// 5.3 قلوب حب حمراء متطايرة Flying Hearts
export const AnimHeartsGroup: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={`inline-block select-none align-middle ${className}`}>
    <style>{`
      @keyframes heartsFlutter { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px) scale(1.1); } }
      .hearts-flutter { animation: heartsFlutter 1.3s infinite ease-in-out; }
    `}</style>
    <g className="hearts-flutter">
      <path d="M12 14C9 10 3 13 3 18C3 24 12 30 12 30C12 30 21 24 21 18C21 13 15 10 12 14Z" fill="#ef4444" stroke="#dc2626" strokeWidth="1" />
      <path d="M26 6C24 3 20 5 20 8C20 13 26 18 26 18C26 18 32 13 32 8C32 5 28 3 26 6Z" fill="#ec4899" stroke="#db2777" strokeWidth="0.8" />
      <circle cx="10" cy="16" r="1.5" fill="#ffffff" opacity="0.8" />
    </g>
  </svg>
);


/* =========================================================================
   قائمة الإيموجيات الشاملة المطابقة للصور المرفقة
   ========================================================================= */

export const CUSTOM_EMOJIS_LIST: CustomEmojiDef[] = [
  // 1. العبارات الترحيبية (Banners)
  { id: 'salam', name: 'سلام عليكم', category: 'greetings', component: AnimSalamGreeting, tag: ':salam:', isBanner: true },
  { id: 'welcome', name: 'ولكمووو', category: 'greetings', component: AnimWelcomeGreeting, tag: ':welcome:', isBanner: true },
  { id: 'wsalam', name: 'وعليكم السلام', category: 'greetings', component: AnimWsalamGreeting, tag: ':wsalam:', isBanner: true },
  { id: 'ahlan', name: 'اهلا وسهلا', category: 'greetings', component: AnimAhlanGreeting, tag: ':ahlan:', isBanner: true },

  // 2. الجلسات والمشروبات
  { id: 'coffee', name: 'فنجان قهوة وشاي وبسكوت', category: 'drinks', component: AnimCoffeeCup, tag: ':coffee:' },
  { id: 'coffee_phone', name: 'فنجان قهوة مع موبايل', category: 'drinks', component: AnimCoffeePhone, tag: ':coffee_phone:' },
  { id: 'shisha', name: 'شيشة ونارجيلة ودخان', category: 'drinks', component: AnimShisha, tag: ':shisha:' },
  { id: 'smoke', name: 'سمايل يدخن سيجارة', category: 'drinks', component: AnimSmokingSmiley, tag: ':smoke:' },
  { id: 'tea', name: 'كوب شاي أحمر ساخن', category: 'drinks', component: AnimHotTea, tag: ':tea:' },
  { id: 'pepsi', name: 'علبة بيبسي مثلجة', category: 'drinks', component: AnimPepsi, tag: ':pepsi:' },

  // 3. التفاعلات والسمايلات المتحركة (مطابقة للصور 1 و 2 و 3)
  { id: 'rofl', name: 'ضحك متواصل وتدحرج', category: 'emotions', component: AnimRoflLaugh, tag: ':rofl:' },
  { id: 'wink', name: 'غمزة عين ذكية', category: 'emotions', component: AnimWinkSmile, tag: ':wink:' },
  { id: 'kiss', name: 'قبلة وقلوب متطايرة', category: 'emotions', component: AnimKissLove, tag: ':kiss:' },
  { id: 'hug', name: 'عناق ومحبة', category: 'emotions', component: AnimHugDuo, tag: ':hug:' },
  { id: 'chick', name: 'كتكوت أصفر لطيف', category: 'emotions', component: AnimChick, tag: ':chick:' },
  { id: 'devil', name: 'سمايل شرير بقرون', category: 'emotions', component: AnimDevilEvil, tag: ':devil:' },
  { id: 'nerd', name: 'نظارات ذكاء وطيبة', category: 'emotions', component: AnimNerdGlasses, tag: ':nerd:' },
  { id: 'girl_bows', name: 'سمايل بنت بفيونكات وردية', category: 'emotions', component: AnimGirlBows, tag: ':girl_bows:' },
  { id: 'cool', name: 'نظارات شمسية كشخة', category: 'emotions', component: AnimCoolGlasses, tag: ':cool:' },
  { id: 'cool_flame', name: 'كشخة مع قلوب ونار', category: 'emotions', component: AnimCoolFlame, tag: ':cool_flame:' },
  { id: 'angry', name: 'غضبان ونار مشتعلة', category: 'emotions', component: AnimAngryFire, tag: ':angry:' },
  { id: 'crying', name: 'دموع وبكاء متواصل', category: 'emotions', component: AnimCryingTears, tag: ':crying:' },
  { id: 'shy', name: 'خجول واحمرار الخدين', category: 'emotions', component: AnimShyBlush, tag: ':shy:' },
  { id: 'sweat', name: 'أنمي مع حبة عرق خجول', category: 'emotions', component: AnimSweatAnime, tag: ':sweat:' },
  { id: 'clap', name: 'تصفيق بحماس', category: 'emotions', component: AnimClappingSmiley, tag: ':clap:' },
  { id: 'cold', name: 'متجمد وبردان', category: 'emotions', component: AnimColdShiver, tag: ':cold:' },
  { id: 'teeth', name: 'ابتسامة عريضة مع أسنان', category: 'emotions', component: AnimTeethGrin, tag: ':teeth:' },
  { id: 'dizzy', name: 'عيون حلزونية دايخ', category: 'emotions', component: AnimSpiralDizzy, tag: ':dizzy:' },
  { id: 'peekaboo', name: 'يغطي عينيه بكسوف', category: 'emotions', component: AnimPeekabooEyes, tag: ':peekaboo:' },
  { id: 'bed', name: 'نائم بالسرير وتحت البطانية', category: 'emotions', component: AnimSleepingBed, tag: ':bed:' },
  { id: 'eat', name: 'يأكل بشوكة وسكينة ومريلة', category: 'emotions', component: AnimEatingSmiley, tag: ':eat:' },

  // 4. الحركات والرقص والأنشطة
  { id: 'laptop', name: 'على اللابتوب يكتب بسرعة', category: 'actions', component: AnimLaptopTyping, tag: ':laptop:' },
  { id: 'dance', name: 'رقص واحتفال ثنائي', category: 'actions', component: AnimDanceDuo, tag: ':dance:' },
  { id: 'walker', name: 'يمشي بعكاز', category: 'actions', component: AnimWalkingStick, tag: ':walker:' },
  { id: 'peek', name: 'يطل من وراء الباب', category: 'actions', component: AnimPeekDoor, tag: ':peek:' },
  { id: 'witch', name: 'ساحرة على المكنسة', category: 'actions', component: AnimWitchBroom, tag: ':witch:' },
  { id: 'rocket', name: 'صاروخ طيران سريع', category: 'actions', component: AnimRocketFly, tag: ':rocket:' },
  { id: 'angel', name: 'سمايلان بأجنحة ملاك', category: 'actions', component: AnimAngelFly, tag: ':angel:' },

  // 5. القلوب والورود
  { id: 'rose', name: 'وردة جورية حمراء', category: 'love', component: AnimRedRose, tag: ':rose:' },
  { id: 'heart_smile', name: 'إطار قلب مع ابتسامة', category: 'love', component: AnimHeartSmile, tag: ':heart_smile:' },
  { id: 'hearts', name: 'قلوب حب متطايرة', category: 'love', component: AnimHeartsGroup, tag: ':hearts:' },
];

export const CUSTOM_EMOJI_CATEGORIES = [
  { id: 'all', label: 'الكل ✨' },
  { id: 'greetings', label: 'عبارات وترحيب 💌' },
  { id: 'drinks', label: 'شيشة ومشروبات ☕' },
  { id: 'emotions', label: 'سمايلات وتفاعل 😂' },
  { id: 'actions', label: 'حركات ورقص 💃' },
  { id: 'love', label: 'قلوب ومحبة 💖' },
  { id: 'custom', label: 'مخصصة 🌟' },
];

/**
 * تحويل عنصر إيموجي مخصص من لوحة المالك إلى تعريف إيموجي قابل للعرض
 */
export const convertCustomEmojiItemToDef = (item: CustomEmojiItem): CustomEmojiDef => {
  const comp: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 28, className = '' }) => {
    if (item.imageUrl) {
      return (
        <img
          src={item.imageUrl}
          alt={item.name}
          className={`inline-block object-contain align-middle max-h-[36px] max-w-[140px] select-none ${className}`}
          style={{ height: typeof size === 'number' ? `${size}px` : size }}
          referrerPolicy="no-referrer"
          loading="lazy"
        />
      );
    }

    if (item.bannerText) {
      return (
        <span
          className={`inline-flex items-center justify-center font-black tracking-wide select-none px-2.5 py-0.5 rounded-lg shadow-xs align-middle ${className}`}
          style={{
            background: item.bannerBg || 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%)',
            color: '#ffffff',
            border: '1.5px solid rgba(255,255,255,0.4)',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            fontSize: typeof size === 'number' ? `${Math.max(12, size * 0.5)}px` : '13px',
            fontFamily: 'serif, Tahoma, Arial',
            lineHeight: 1.2,
          }}
          title={item.name}
        >
          {item.bannerText}
        </span>
      );
    }

    return (
      <span
        className={`inline-block select-none align-middle text-center ${className}`}
        style={{ fontSize: typeof size === 'number' ? `${size * 0.8}px` : size }}
        title={item.name}
      >
        {item.emojiChar || '⭐'}
      </span>
    );
  };

  return {
    id: item.id,
    name: item.name,
    category: item.category || 'custom',
    tag: item.tag,
    isBanner: item.isBanner,
    imageUrl: item.imageUrl,
    isCustom: true,
    component: comp,
  };
};

/**
 * الحصول على قائمة الإيموجيات كاملة (الافتراضية + المخصصة المضافة من لوحة المالك)
 */
export const getAllCustomEmojis = (customItems?: CustomEmojiItem[]): CustomEmojiDef[] => {
  let extraItems = customItems;
  if (!extraItems) {
    try {
      const saved = localStorage.getItem('araby_custom_emojis');
      if (saved) {
        extraItems = JSON.parse(saved);
      }
    } catch {
      extraItems = [];
    }
  }

  if (!Array.isArray(extraItems) || extraItems.length === 0) {
    return CUSTOM_EMOJIS_LIST;
  }

  const dynamicDefs = extraItems.map(convertCustomEmojiItemToDef);
  return [...CUSTOM_EMOJIS_LIST, ...dynamicDefs];
};

// دالة تحويل ومعالجة النصوص لعرض الإيموجيات المتحركة فورياً
export const renderTextWithCustomEmojis = (text: string, size: number = 28, extraEmojis?: CustomEmojiItem[]): React.ReactNode => {
  if (!text || typeof text !== 'string') return text;

  // Unicode text sequence mappings to rich animated icons (from chat logs in screenshots)
  const unicodeSequences: Record<string, string> = {
    '☕🙂🍪': ':coffee:',
    '☕ 🙂 🍪': ':coffee:',
    '☕🙂📱': ':coffee_phone:',
    '☕ 🙂 📱': ':coffee_phone:',
    ':chibi_stand:': ':dance:',
    ':chibi_shout:': ':angry:',
    ':chibi_curl:': ':shy:',
    ':chibi_sleep:': ':coffee:',
    ':pixel_hearts:': ':heart_smile:',
    ':pixel_heart:': ':rose:',
    ':bear_cool:': ':cool:',
    ':bear_love:': ':kiss:',
    ':pacman_love:': ':dance:',
    ':msn_laugh:': ':rofl:',
    ':msn_wide:': ':rofl:',
  };

  let normalizedText = text;
  Object.entries(unicodeSequences).forEach(([seq, newTag]) => {
    if (normalizedText.includes(seq)) {
      normalizedText = normalizedText.replaceAll(seq, newTag);
    }
  });

  const fullList = getAllCustomEmojis(extraEmojis);

  const regex = /(:[a-zA-Z0-9_]+:)/g;
  const parts = normalizedText.split(regex);
  if (parts.length === 1) return normalizedText;

  return parts.map((part, idx) => {
    const match = fullList.find(e => e.tag === part || `:${e.id}:` === part);
    if (match) {
      const Comp = match.component;
      return (
        <span key={`ce-${idx}`} className="inline-flex items-center align-middle mx-0.5" title={match.name}>
          <Comp size={match.isBanner ? size : Math.max(26, size)} animated={true} />
        </span>
      );
    }
    return part;
  });
};
