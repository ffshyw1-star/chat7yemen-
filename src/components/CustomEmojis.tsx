import React from 'react';

export interface CustomEmojiDef {
  id: string;
  name: string;
  category: 'chibi' | 'hearts' | 'bear' | 'pacman' | 'msn';
  categoryLabel: string;
  component: React.FC<{ size?: number | string; className?: string; animated?: boolean }>;
  tag: string;
}

/* =========================================================================
   1. شخصية البيكسل تشيبي (Pixel Art Chibi)
   - الستايل: Pixel Art Chibi (Terraria / Stardew Valley / RPG)
   - الشكل: رأس كبير، شعر بني، لبس أخضر، وشاح أحمر
   - 4 تعابير دقيقة: واقف، يصرخ، متكور، نايم
   ========================================================================= */

// 1.1 واقف (Standing)
export const PixelChibiStand: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 36, className = '', animated = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={`inline-block select-none ${animated ? 'hover:scale-110 hover:-translate-y-0.5 transition-all duration-200' : ''} ${className}`}
  >
    {/* Floor Shadow */}
    <rect x="7" y="30" width="18" height="2" fill="#0f172a" fillOpacity="0.4" rx="1" />

    {/* Brown Hair (Chibi big volume) */}
    <rect x="9" y="2" width="14" height="3" fill="#4a2e16" />
    <rect x="7" y="5" width="18" height="4" fill="#5c381c" />
    <rect x="6" y="9" width="4" height="5" fill="#5c381c" />
    <rect x="22" y="9" width="4" height="5" fill="#5c381c" />
    <rect x="10" y="4" width="6" height="2" fill="#784924" />

    {/* Face Skin */}
    <rect x="9" y="8" width="14" height="9" fill="#ffdfba" />

    {/* Big expressive anime eyes */}
    <rect x="10" y="11" width="3" height="4" fill="#1e293b" />
    <rect x="19" y="11" width="3" height="4" fill="#1e293b" />
    {/* White eye reflections */}
    <rect x="10" y="11" width="1" height="2" fill="#ffffff" />
    <rect x="19" y="11" width="1" height="2" fill="#ffffff" />

    {/* Cheerful blush */}
    <rect x="8" y="14" width="3" height="2" fill="#fb7185" />
    <rect x="21" y="14" width="3" height="2" fill="#fb7185" />

    {/* Gentle smile */}
    <rect x="15" y="15" width="2" height="1" fill="#881337" />

    {/* Red Scarf (flowing to the side) */}
    <rect x="8" y="17" width="16" height="3" fill="#dc2626" />
    <rect x="7" y="18" width="4" height="4" fill="#ef4444" />
    <rect x="5" y="20" width="4" height="4" fill="#dc2626" />
    <rect x="4" y="22" width="3" height="2" fill="#991b1b" />

    {/* Green RPG Tunic */}
    <rect x="9" y="20" width="14" height="6" fill="#16a34a" />
    <rect x="10" y="21" width="12" height="4" fill="#22c55e" />
    <rect x="8" y="20" width="2" height="4" fill="#15803d" />
    <rect x="22" y="20" width="2" height="4" fill="#15803d" />
    {/* Gold Buckle Belt */}
    <rect x="9" y="24" width="14" height="1" fill="#78350f" />
    <rect x="15" y="24" width="2" height="1" fill="#fbbf24" />

    {/* Blue Trousers & Brown Boots */}
    <rect x="10" y="26" width="4" height="3" fill="#1e3a8a" />
    <rect x="18" y="26" width="4" height="3" fill="#1e3a8a" />
    <rect x="9" y="28" width="5" height="2" fill="#4a2e16" />
    <rect x="18" y="28" width="5" height="2" fill="#4a2e16" />
  </svg>
);

// 1.2 يصرخ (Shouting / Battle Cry)
export const PixelChibiShout: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 36, className = '', animated = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={`inline-block select-none ${animated ? 'hover:scale-110 hover:rotate-3 transition-all duration-150' : ''} ${className}`}
  >
    {/* Shock / Shout Sparkle Lines */}
    <rect x="2" y="5" width="2" height="2" fill="#f59e0b" />
    <rect x="28" y="4" width="2" height="2" fill="#f59e0b" />
    <rect x="1" y="12" width="3" height="1" fill="#ef4444" />
    <rect x="28" y="12" width="3" height="1" fill="#ef4444" />

    {/* Brown Spiky Hair */}
    <rect x="7" y="1" width="18" height="4" fill="#4a2e16" />
    <rect x="5" y="4" width="22" height="4" fill="#5c381c" />
    <rect x="3" y="7" width="4" height="5" fill="#784924" />
    <rect x="25" y="6" width="4" height="5" fill="#784924" />

    {/* Face */}
    <rect x="7" y="8" width="18" height="10" fill="#ffdfba" />

    {/* Shouting > < Eyes */}
    <rect x="8" y="10" width="1" height="1" fill="#1e293b" />
    <rect x="9" y="11" width="3" height="1" fill="#1e293b" />
    <rect x="12" y="10" width="1" height="1" fill="#1e293b" />

    <rect x="19" y="10" width="1" height="1" fill="#1e293b" />
    <rect x="20" y="11" width="3" height="1" fill="#1e293b" />
    <rect x="23" y="10" width="1" height="1" fill="#1e293b" />

    {/* Big Screaming Mouth */}
    <rect x="12" y="13" width="8" height="5" fill="#881337" />
    <rect x="13" y="14" width="6" height="3" fill="#ef4444" />
    <rect x="13" y="13" width="6" height="1" fill="#ffffff" />

    {/* Scarf blown in wind */}
    <rect x="6" y="18" width="20" height="3" fill="#dc2626" />
    <rect x="2" y="19" width="6" height="4" fill="#ef4444" />
    <rect x="1" y="22" width="4" height="3" fill="#b91c1c" />

    {/* Green Tunic */}
    <rect x="7" y="21" width="18" height="5" fill="#16a34a" />
    <rect x="8" y="21" width="16" height="4" fill="#22c55e" />

    {/* Boots Stance */}
    <rect x="8" y="26" width="5" height="4" fill="#1e3a8a" />
    <rect x="19" y="26" width="5" height="4" fill="#1e3a8a" />
    <rect x="6" y="28" width="6" height="2" fill="#4a2e16" />
    <rect x="20" y="28" width="6" height="2" fill="#4a2e16" />
  </svg>
);

// 1.3 متكور (Curled up / Defeated Cute Pose)
export const PixelChibiCurl: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 36, className = '', animated = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={`inline-block select-none ${animated ? 'hover:scale-110 transition-transform duration-150' : ''} ${className}`}
  >
    {/* Shadow */}
    <rect x="5" y="29" width="22" height="2" fill="#0f172a" fillOpacity="0.4" />

    {/* Big round brown hair bun */}
    <rect x="8" y="7" width="16" height="4" fill="#4a2e16" />
    <rect x="6" y="9" width="20" height="6" fill="#5c381c" />
    <rect x="5" y="13" width="4" height="5" fill="#5c381c" />
    <rect x="23" y="13" width="4" height="5" fill="#5c381c" />

    {/* Face hiding behind scarf */}
    <rect x="8" y="13" width="16" height="8" fill="#ffdfba" />

    {/* Sad curled closed eyes */}
    <rect x="9" y="16" width="4" height="1" fill="#1e293b" />
    <rect x="10" y="17" width="2" height="1" fill="#1e293b" />

    <rect x="19" y="16" width="4" height="1" fill="#1e293b" />
    <rect x="20" y="17" width="2" height="1" fill="#1e293b" />

    {/* Blush */}
    <rect x="8" y="18" width="3" height="2" fill="#f87171" />
    <rect x="21" y="18" width="3" height="2" fill="#f87171" />

    {/* Big Red Scarf bundled around body */}
    <rect x="6" y="20" width="20" height="5" fill="#dc2626" />
    <rect x="7" y="21" width="18" height="3" fill="#ef4444" />

    {/* Curled Knees in Green Tunic & Boots */}
    <rect x="7" y="25" width="18" height="4" fill="#16a34a" />
    <rect x="6" y="26" width="5" height="3" fill="#4a2e16" />
    <rect x="21" y="26" width="5" height="3" fill="#4a2e16" />
  </svg>
);

// 1.4 نايم (Sleeping with Zzz and Scarf Blanket)
export const PixelChibiSleep: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 36, className = '', animated = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={`inline-block select-none ${animated ? 'hover:scale-110 transition-transform duration-150' : ''} ${className}`}
  >
    {/* Floating Pixel Zzz */}
    <rect x="24" y="2" width="4" height="1" fill="#38bdf8" />
    <rect x="26" y="3" width="2" height="1" fill="#38bdf8" />
    <rect x="24" y="4" width="4" height="1" fill="#38bdf8" />

    <rect x="21" y="6" width="3" height="1" fill="#818cf8" />
    <rect x="22" y="7" width="2" height="1" fill="#818cf8" />
    <rect x="21" y="8" width="3" height="1" fill="#818cf8" />

    {/* Hair resting */}
    <rect x="7" y="7" width="16" height="3" fill="#4a2e16" />
    <rect x="5" y="10" width="20" height="4" fill="#5c381c" />

    {/* Face */}
    <rect x="6" y="13" width="18" height="8" fill="#ffdfba" />

    {/* Peaceful closed eyes */}
    <rect x="8" y="16" width="4" height="1" fill="#451a03" />
    <rect x="9" y="17" width="2" height="1" fill="#451a03" />

    <rect x="18" y="16" width="4" height="1" fill="#451a03" />
    <rect x="19" y="17" width="2" height="1" fill="#451a03" />

    {/* Soft pink blush */}
    <rect x="7" y="18" width="3" height="2" fill="#fda4af" />
    <rect x="20" y="18" width="3" height="2" fill="#fda4af" />

    {/* Cute Snot Bubble */}
    <circle cx="15" cy="18" r="2.5" fill="#93c5fd" fillOpacity="0.85" />
    <circle cx="14" cy="17" r="0.8" fill="#ffffff" />

    {/* Red Scarf as a blanket */}
    <rect x="5" y="21" width="20" height="5" fill="#dc2626" />
    <rect x="6" y="22" width="18" height="3" fill="#ef4444" />

    {/* Sleeping green tunic body */}
    <rect x="5" y="26" width="20" height="3" fill="#22c55e" />
    <rect x="4" y="27" width="4" height="3" fill="#4a2e16" />
    <rect x="22" y="27" width="4" height="3" fill="#4a2e16" />
  </svg>
);


/* =========================================================================
   2. قلوب البيكسل (Pixel Hearts / Retro Game UI)
   - الستايل: Pixel Heart / Retro Game UI (Zelda Health Bar)
   - الشكل: 3 قلوب حمراء متوهجة على خلفية سوداء كلاسيكية مع إضاءة ولمعة بكسلية
   ========================================================================= */

// 2.1 قلوب البيكسل الثلاثية المتوهجة (3 Glowing Pixel Hearts on Black UI)
export const PixelHeartsTriple: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 48, className = '', animated = true }) => (
  <svg
    width={size}
    height={typeof size === 'number' ? size * 0.48 : size}
    viewBox="0 0 68 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={`inline-block select-none ${animated ? 'hover:scale-105 hover:shadow-lg transition-all duration-200' : ''} ${className}`}
  >
    {/* Retro Black Arcade Screen Container */}
    <rect x="1" y="1" width="66" height="26" rx="4" fill="#050811" stroke="#dc2626" strokeWidth="1.5" />
    <rect x="3" y="3" width="62" height="22" rx="2" fill="#090d16" />

    {/* Heart 1 (Left) */}
    <g transform="translate(6, 5)">
      {/* Glow shadow */}
      <rect x="2" y="2" width="12" height="12" fill="#ef4444" fillOpacity="0.2" />
      {/* Heart pixels */}
      <rect x="2" y="1" width="4" height="2" fill="#ff2e5b" />
      <rect x="8" y="1" width="4" height="2" fill="#ff2e5b" />
      <rect x="1" y="3" width="12" height="4" fill="#ff2e5b" />
      <rect x="2" y="7" width="10" height="3" fill="#dc2626" />
      <rect x="3" y="10" width="8" height="2" fill="#b91c1c" />
      <rect x="5" y="12" width="4" height="2" fill="#991b1b" />
      <rect x="6" y="14" width="2" height="1" fill="#7f1d1d" />
      {/* Crisp White Retro Glare */}
      <rect x="2" y="3" width="2" height="2" fill="#ffffff" />
      <rect x="3" y="5" width="1" height="1" fill="#ffffff" />
    </g>

    {/* Heart 2 (Center - Neon pulse effect) */}
    <g transform="translate(26, 5)">
      <rect x="2" y="2" width="12" height="12" fill="#ff0044" fillOpacity="0.3" />
      <rect x="2" y="1" width="4" height="2" fill="#ff1f5a" />
      <rect x="8" y="1" width="4" height="2" fill="#ff1f5a" />
      <rect x="1" y="3" width="12" height="4" fill="#ff1f5a" />
      <rect x="2" y="7" width="10" height="3" fill="#e11d48" />
      <rect x="3" y="10" width="8" height="2" fill="#be123c" />
      <rect x="5" y="12" width="4" height="2" fill="#9f1239" />
      <rect x="6" y="14" width="2" height="1" fill="#881337" />
      {/* White & Pink Neon Shine */}
      <rect x="2" y="3" width="2" height="2" fill="#ffffff" />
      <rect x="3" y="5" width="1" height="1" fill="#ffffff" />
      <rect x="9" y="3" width="1" height="2" fill="#ffe4e6" />
    </g>

    {/* Heart 3 (Right) */}
    <g transform="translate(46, 5)">
      <rect x="2" y="2" width="12" height="12" fill="#ef4444" fillOpacity="0.2" />
      <rect x="2" y="1" width="4" height="2" fill="#ff2e5b" />
      <rect x="8" y="1" width="4" height="2" fill="#ff2e5b" />
      <rect x="1" y="3" width="12" height="4" fill="#ff2e5b" />
      <rect x="2" y="7" width="10" height="3" fill="#dc2626" />
      <rect x="3" y="10" width="8" height="2" fill="#b91c1c" />
      <rect x="5" y="12" width="4" height="2" fill="#991b1b" />
      <rect x="6" y="14" width="2" height="1" fill="#7f1d1d" />
      {/* White Shine */}
      <rect x="2" y="3" width="2" height="2" fill="#ffffff" />
      <rect x="3" y="5" width="1" height="1" fill="#ffffff" />
    </g>
  </svg>
);

// 2.2 قلب بيسكل منفرد متوهج
export const PixelHeartSingle: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 36, className = '', animated = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={`inline-block select-none ${animated ? 'hover:scale-115 transition-transform duration-150' : ''} ${className}`}
  >
    {/* Dark Retro Backdrop */}
    <rect x="2" y="2" width="28" height="28" rx="4" fill="#090d16" stroke="#ef4444" strokeWidth="1.5" />
    
    {/* Glow outline */}
    <rect x="8" y="5" width="6" height="1" fill="#f43f5e" fillOpacity="0.5" />
    <rect x="18" y="5" width="6" height="1" fill="#f43f5e" fillOpacity="0.5" />

    {/* Heart Body */}
    <rect x="7" y="6" width="6" height="3" fill="#ef4444" />
    <rect x="19" y="6" width="6" height="3" fill="#ef4444" />
    <rect x="5" y="9" width="22" height="6" fill="#ef4444" />
    <rect x="6" y="15" width="20" height="4" fill="#dc2626" />
    <rect x="8" y="19" width="16" height="4" fill="#b91c1c" />
    <rect x="11" y="23" width="10" height="3" fill="#991b1b" />
    <rect x="14" y="26" width="4" height="2" fill="#7f1d1d" />

    {/* Classic Pixel Highlight Glare */}
    <rect x="7" y="8" width="3" height="3" fill="#ffffff" />
    <rect x="8" y="11" width="2" height="2" fill="#ffffff" />
    <rect x="20" y="8" width="2" height="2" fill="#ffe4e6" />
  </svg>
);


/* =========================================================================
   3. الدب الكيوت الكارتوني (Chibi Cartoon Sticker)
   - الستايل: Chibi Cartoon Sticker (ستيكرات ناعمة بألوان متدرجة، مش مبكسل)
   - الشكل: دب أصفر بنظارة شمسية، خدود حمر، جناح صغير
   - الإحساس: لطيف وعصري
   ========================================================================= */

// 3.1 الدب الكشخة (Bear with Sunglasses, Red Cheeks & Angel Wing)
export const CuteBearCool: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 38, className = '', animated = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${animated ? 'hover:scale-115 hover:-rotate-3 transition-all duration-200' : ''} ${className}`}
  >
    <defs>
      <linearGradient id="bearYellowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fff066" />
        <stop offset="60%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#eab308" />
      </linearGradient>
      <linearGradient id="coolShadesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#090d16" />
      </linearGradient>
      <filter id="softGlow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#ca8a04" floodOpacity="0.3" />
      </filter>
    </defs>

    {/* Cute White Angel Wings Behind Bear */}
    {/* Left Wing */}
    <path
      d="M10 20C4 20 2 27 6 32C9 35 14 34 16 30L17 24C17 21 14 20 10 20Z"
      fill="#ffffff"
      stroke="#cbd5e1"
      strokeWidth="1.5"
      filter="url(#softGlow)"
    />
    {/* Right Wing */}
    <path
      d="M42 20C48 20 50 27 46 32C43 35 38 34 36 30L35 24C35 21 38 20 42 20Z"
      fill="#ffffff"
      stroke="#cbd5e1"
      strokeWidth="1.5"
      filter="url(#softGlow)"
    />

    {/* Left Bear Ear */}
    <circle cx="15" cy="14" r="7.5" fill="url(#bearYellowGrad)" stroke="#ca8a04" strokeWidth="1.5" />
    <circle cx="15" cy="14" r="4" fill="#fef08a" />

    {/* Right Bear Ear */}
    <circle cx="37" cy="14" r="7.5" fill="url(#bearYellowGrad)" stroke="#ca8a04" strokeWidth="1.5" />
    <circle cx="37" cy="14" r="4" fill="#fef08a" />

    {/* Bear Chibi Head */}
    <ellipse cx="26" cy="28" rx="17" ry="15" fill="url(#bearYellowGrad)" stroke="#ca8a04" strokeWidth="1.5" />

    {/* Bright Red/Pink Rosy Cheeks */}
    <ellipse cx="14" cy="32" rx="4" ry="2.5" fill="#f43f5e" fillOpacity="0.85" />
    <ellipse cx="38" cy="32" rx="4" ry="2.5" fill="#f43f5e" fillOpacity="0.85" />

    {/* Cute Cream Snout */}
    <ellipse cx="26" cy="33" rx="6.5" ry="5" fill="#fffbeb" />
    {/* Bear Nose */}
    <path d="M23.5 31H28.5C28.5 31 28.5 33.5 26 34.5C23.5 33.5 23.5 31 23.5 31Z" fill="#713f12" />
    {/* Happy curved mouth */}
    <path d="M24 35C25 36 27 36 28 35" stroke="#713f12" strokeWidth="1.5" strokeLinecap="round" />

    {/* Stylish Modern Sunglasses */}
    <rect x="12" y="21" width="12" height="9" rx="3" fill="url(#coolShadesGrad)" stroke="#0f172a" strokeWidth="1.5" />
    <rect x="28" y="21" width="12" height="9" rx="3" fill="url(#coolShadesGrad)" stroke="#0f172a" strokeWidth="1.5" />
    <path d="M24 24H28" stroke="#0f172a" strokeWidth="2.5" />
    
    {/* Glossy White Glare on Glasses */}
    <path d="M14 23L20 28" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
    <path d="M30 23L36 28" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.9" />
  </svg>
);

// 3.2 الدب الكيوت حب وغمزة
export const CuteBearLove: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 38, className = '', animated = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 52 52"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`inline-block select-none ${animated ? 'hover:scale-115 transition-all duration-200' : ''} ${className}`}
  >
    {/* Floating Little Heart */}
    <path
      d="M41 7C38.5 4 35 4 33 6.5C31 4 27.5 4 25 7C22.5 11.5 33 18 33 18C33 18 43.5 11.5 41 7Z"
      fill="#ef4444"
      stroke="#b91c1c"
      strokeWidth="1.2"
    />

    {/* Bear Ears */}
    <circle cx="15" cy="15" r="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
    <circle cx="15" cy="15" r="3.5" fill="#fef08a" />
    <circle cx="37" cy="15" r="7" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />
    <circle cx="37" cy="15" r="3.5" fill="#fef08a" />

    {/* Bear Head */}
    <ellipse cx="26" cy="30" rx="16" ry="14" fill="#facc15" stroke="#ca8a04" strokeWidth="1.5" />

    {/* Rosy Cheeks */}
    <ellipse cx="14" cy="34" rx="4" ry="2.5" fill="#fb7185" />
    <ellipse cx="38" cy="34" rx="4" ry="2.5" fill="#fb7185" />

    {/* Happy Kiss Eyes ( ^ ^ ) */}
    <path d="M16 25C17.5 23 20.5 23 22 25" stroke="#713f12" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M30 25C31.5 23 34.5 23 36 25" stroke="#713f12" strokeWidth="2.5" strokeLinecap="round" />

    {/* Snout with cute kiss mouth */}
    <ellipse cx="26" cy="34" rx="5.5" ry="4.5" fill="#fffbeb" />
    <circle cx="26" cy="32" r="1.5" fill="#713f12" />
    <ellipse cx="26" cy="35.5" rx="1.8" ry="1.2" fill="#ef4444" />
  </svg>
);


/* =========================================================================
   4. وجوه Pac-Man المتحابة (Pixel Sprite Animation)
   - الستايل: Pixel Sprite Animation (أركيد وفلاش)
   - الشكل: دائرتين صفراء، واحدة بفيونكة حمراء + انيميشن تقارب وقبلة وقلوب
   ========================================================================= */

export const PacmanLoveKiss: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 48, className = '', animated = true }) => (
  <svg
    width={size}
    height={typeof size === 'number' ? size * 0.52 : size}
    viewBox="0 0 68 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={`inline-block select-none ${animated ? 'hover:scale-110 transition-transform duration-200' : ''} ${className}`}
  >
    {/* Retro Arcade Blue Box */}
    <rect x="1" y="1" width="66" height="32" rx="4" fill="#090d16" stroke="#3b82f6" strokeWidth="1.5" />

    {/* Floating Pixel Love Hearts */}
    <g transform="translate(30, 4)">
      <rect x="2" y="0" width="2" height="1" fill="#ef4444" />
      <rect x="5" y="0" width="2" height="1" fill="#ef4444" />
      <rect x="1" y="1" width="7" height="2" fill="#ef4444" />
      <rect x="2" y="3" width="5" height="2" fill="#dc2626" />
      <rect x="3" y="5" width="3" height="1" fill="#b91c1c" />
      <rect x="4" y="6" width="1" height="1" fill="#991b1b" />
      <rect x="2" y="1" width="1" height="1" fill="#ffffff" />
    </g>

    {/* Pac-Man (Left Facing Right) */}
    <g transform="translate(7, 7)">
      <rect x="4" y="1" width="11" height="2" fill="#facc15" />
      <rect x="2" y="3" width="15" height="2" fill="#facc15" />
      <rect x="1" y="5" width="17" height="2" fill="#facc15" />
      <rect x="1" y="7" width="15" height="2" fill="#facc15" />
      <rect x="1" y="9" width="13" height="2" fill="#facc15" />
      <rect x="1" y="11" width="15" height="2" fill="#facc15" />
      <rect x="1" y="13" width="17" height="2" fill="#facc15" />
      <rect x="2" y="15" width="15" height="2" fill="#facc15" />
      <rect x="4" y="17" width="11" height="2" fill="#facc15" />

      {/* Cute Arcade Eye */}
      <rect x="7" y="4" width="2" height="3" fill="#000000" />
      {/* Cheek Blush */}
      <rect x="4" y="10" width="3" height="2" fill="#fb7185" />
    </g>

    {/* Ms. Pac-Man with Red Bow & Lipstick (Right Facing Left) */}
    <g transform="translate(42, 6)">
      {/* Red Ribbon / Bow */}
      <rect x="3" y="0" width="3" height="2" fill="#dc2626" />
      <rect x="9" y="0" width="3" height="2" fill="#dc2626" />
      <rect x="7" y="1" width="2" height="2" fill="#ef4444" />
      <rect x="5" y="2" width="6" height="1" fill="#991b1b" />

      {/* Body */}
      <rect x="4" y="3" width="11" height="2" fill="#facc15" />
      <rect x="2" y="5" width="15" height="2" fill="#facc15" />
      <rect x="1" y="7" width="17" height="2" fill="#facc15" />
      <rect x="3" y="9" width="15" height="2" fill="#facc15" />
      <rect x="5" y="11" width="13" height="2" fill="#facc15" />
      <rect x="3" y="13" width="15" height="2" fill="#facc15" />
      <rect x="1" y="15" width="17" height="2" fill="#facc15" />
      <rect x="2" y="17" width="15" height="2" fill="#facc15" />
      <rect x="4" y="19" width="11" height="2" fill="#facc15" />

      {/* Feminine Eye with Eyelash */}
      <rect x="9" y="6" width="2" height="3" fill="#000000" />
      <rect x="11" y="5" width="1" height="2" fill="#000000" />

      {/* Blush & Red Kissing Lips */}
      <rect x="12" y="12" width="3" height="2" fill="#fb7185" />
      <rect x="2" y="11" width="2" height="2" fill="#ef4444" />
    </g>
  </svg>
);


/* =========================================================================
   5. الإيموجي الضاحك المشير (Pixel Emoji / MSN Style)
   - الستايل: Pixel Emoji / MSN Messenger Classic
   - الشكل: وجه أصفر يضحك بأسنان بارزة + إيد تشير من الجنب
   - الإحساس: كوميدي وساخر ونوستالجيا
   ========================================================================= */

// 5.1 إيموجي MSN الضاحك المشير بإصبعه (MSN Pointing Laugh)
export const MsnPointingLaugh: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 38, className = '', animated = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 38 38"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={`inline-block select-none ${animated ? 'hover:scale-120 hover:rotate-6 transition-all duration-150' : ''} ${className}`}
  >
    {/* Yellow Face MSN Retro Body */}
    <rect x="6" y="3" width="18" height="2" fill="#ca8a04" />
    <rect x="4" y="5" width="22" height="2" fill="#eab308" />
    <rect x="3" y="7" width="24" height="2" fill="#facc15" />
    <rect x="2" y="9" width="26" height="17" fill="#fde047" />
    <rect x="3" y="26" width="24" height="2" fill="#facc15" />
    <rect x="4" y="28" width="22" height="2" fill="#eab308" />
    <rect x="6" y="30" width="18" height="2" fill="#ca8a04" />

    {/* MSN Squint Laughing Eyes (> <) */}
    <rect x="6" y="10" width="2" height="2" fill="#713f12" />
    <rect x="8" y="12" width="4" height="2" fill="#713f12" />
    <rect x="6" y="14" width="2" height="2" fill="#713f12" />

    <rect x="18" y="10" width="2" height="2" fill="#713f12" />
    <rect x="20" y="12" width="4" height="2" fill="#713f12" />
    <rect x="18" y="14" width="2" height="2" fill="#713f12" />

    {/* Laughing Big Open Mouth */}
    <rect x="5" y="17" width="20" height="10" fill="#7f1d1d" />
    {/* Big White Teeth Row */}
    <rect x="6" y="18" width="18" height="4" fill="#ffffff" />
    <rect x="10" y="18" width="1" height="4" fill="#cbd5e1" />
    <rect x="15" y="18" width="1" height="4" fill="#cbd5e1" />
    <rect x="19" y="18" width="1" height="4" fill="#cbd5e1" />
    {/* Red Tongue */}
    <rect x="8" y="23" width="14" height="3" fill="#f87171" />

    {/* Side Pointing Hand & Finger (👈 MSN comedy laugh signature) */}
    <rect x="28" y="15" width="7" height="3" fill="#facc15" />
    <rect x="26" y="18" width="10" height="3" fill="#facc15" />
    {/* Finger Tip Pointing to Face */}
    <rect x="24" y="19" width="3" height="2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
    {/* Thumb & Fist Knuckles */}
    <rect x="31" y="14" width="5" height="10" fill="#eab308" stroke="#ca8a04" strokeWidth="0.5" />
  </svg>
);

// 5.2 ضحكة عريضة كلاسيكية مع دموع الضحك MSN
export const MsnLaughWide: React.FC<{ size?: number | string; className?: string; animated?: boolean }> = ({ size = 36, className = '', animated = true }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 34 34"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    shapeRendering="crispEdges"
    className={`inline-block select-none ${animated ? 'hover:scale-120 transition-transform duration-150' : ''} ${className}`}
  >
    {/* Yellow MSN Face */}
    <circle cx="17" cy="17" r="15" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />

    {/* Tears of Joy Pixels */}
    <rect x="3" y="13" width="3" height="4" fill="#38bdf8" />
    <rect x="28" y="13" width="3" height="4" fill="#38bdf8" />

    {/* Closed Laughing Eyes */}
    <path d="M8 12L14 15L8 18" stroke="#713f12" strokeWidth="2.2" strokeLinecap="square" />
    <path d="M26 12L20 15L26 18" stroke="#713f12" strokeWidth="2.2" strokeLinecap="square" />

    {/* Big Laughing Mouth with Full Teeth */}
    <path d="M7 20C7 27 11 29 17 29C23 29 27 27 27 20H7Z" fill="#7f1d1d" />
    <path d="M8 21H26V24H8V21Z" fill="#ffffff" />
    <ellipse cx="17" cy="26" rx="5" ry="2.2" fill="#fb7185" />
  </svg>
);


/* =========================================================================
   قائمة التصاميم الخمسة الكاملة وتصنيفاتها
   ========================================================================= */

export const CUSTOM_EMOJIS_LIST: CustomEmojiDef[] = [
  // 1. شخصية البيكسل تشيبي (4 تعابير)
  { id: 'chibi_stand', name: 'بيكسل تشيبي: واقف', category: 'chibi', categoryLabel: 'شخصية تشيبي 🦸‍♂️', component: PixelChibiStand, tag: ':chibi_stand:' },
  { id: 'chibi_shout', name: 'بيكسل تشيبي: يصرخ', category: 'chibi', categoryLabel: 'شخصية تشيبي 🦸‍♂️', component: PixelChibiShout, tag: ':chibi_shout:' },
  { id: 'chibi_curl', name: 'بيكسل تشيبي: متكور', category: 'chibi', categoryLabel: 'شخصية تشيبي 🦸‍♂️', component: PixelChibiCurl, tag: ':chibi_curl:' },
  { id: 'chibi_sleep', name: 'بيكسل تشيبي: نايم', category: 'chibi', categoryLabel: 'شخصية تشيبي 🦸‍♂️', component: PixelChibiSleep, tag: ':chibi_sleep:' },

  // 2. قلوب البيكسل (Retro UI)
  { id: 'pixel_hearts_triple', name: 'قلوب بيكسل متوهجة', category: 'hearts', categoryLabel: 'قلوب البيكسل 💖', component: PixelHeartsTriple, tag: ':pixel_hearts:' },
  { id: 'pixel_heart_single', name: 'قلب بيكسل ريترو', category: 'hearts', categoryLabel: 'قلوب البيكسل 💖', component: PixelHeartSingle, tag: ':pixel_heart:' },

  // 3. الدب الكيوت الكارتوني (Stickers)
  { id: 'bear_cool', name: 'دب كشخة بالنظارة والجناح', category: 'bear', categoryLabel: 'الدب الكيوت 🐻', component: CuteBearCool, tag: ':bear_cool:' },
  { id: 'bear_love', name: 'دب كيوت حب وقبلة', category: 'bear', categoryLabel: 'الدب الكيوت 🐻', component: CuteBearLove, tag: ':bear_love:' },

  // 4. وجوه Pac-Man المتحابة
  { id: 'pacman_love_kiss', name: 'باكمان حب وقبلة بيكسل', category: 'pacman', categoryLabel: 'باكمان المتحابين 💛', component: PacmanLoveKiss, tag: ':pacman_love:' },

  // 5. الإيموجي الضاحك المشير MSN
  { id: 'msn_laugh_point', name: 'إيموجي ضاحك مشير MSN', category: 'msn', categoryLabel: 'ضحك مشير MSN 😂', component: MsnPointingLaugh, tag: ':msn_laugh:' },
  { id: 'msn_laugh_wide', name: 'ضحكة عريضة كلاسيك', category: 'msn', categoryLabel: 'ضحك مشير MSN 😂', component: MsnLaughWide, tag: ':msn_wide:' },
];

export const CUSTOM_EMOJI_CATEGORIES = [
  { id: 'all', label: 'الكل ✨' },
  { id: 'chibi', label: 'شخصية تشيبي 🦸‍♂️' },
  { id: 'hearts', label: 'قلوب البيكسل 💖' },
  { id: 'bear', label: 'الدب الكيوت 🐻' },
  { id: 'pacman', label: 'باكمان المتحابين 💛' },
  { id: 'msn', label: 'ضحك مشير MSN 😂' },
];

// دالة العرض التفاعلي السريع
export const renderCustomEmojiByTag = (tag: string, size: number | string = 28): React.ReactNode => {
  const match = CUSTOM_EMOJIS_LIST.find(e => e.tag === tag || `:${e.id}:` === tag);
  if (!match) return null;
  const Component = match.component;
  return <Component key={tag} size={size} className="inline-block align-middle mx-1" />;
};

// دالة استبدال الرموز في نصوص الرسائل بالتصاميم التفاعلية
export const renderTextWithCustomEmojis = (text: string, size: number = 28): React.ReactNode => {
  if (!text || typeof text !== 'string') return text;
  const regex = /(:[a-zA-Z0-9_]+:)/g;
  const parts = text.split(regex);
  if (parts.length === 1) return text;

  return parts.map((part, idx) => {
    const match = CUSTOM_EMOJIS_LIST.find(e => e.tag === part || `:${e.id}:` === part);
    if (match) {
      const Comp = match.component;
      return (
        <span key={`ce-${idx}`} className="inline-flex items-center align-middle mx-1" title={match.name}>
          <Comp size={size} animated={true} />
        </span>
      );
    }
    return part;
  });
};
