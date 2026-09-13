import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { X, Check, Save } from 'lucide-react';
import { hasRolePermission } from '../utils/permissions';

// 36 Vibrant Solid Colors matching Screenshot 1 (6 columns x 6 rows)
export const FORMAT_SOLID_COLORS = [
  '#ff2a2a', '#ff6d00', '#ff9100', '#ffc400', '#c6d900', '#99cc00',
  '#55b300', '#73854d', '#008000', '#00e640', '#00e676', '#00e6a8',
  '#00bcd4', '#00a2d6', '#2979ff', '#0e7596', '#004ba0', '#651fff',
  '#8e24aa', '#d500f9', '#ff00e6', '#ff00a0', '#ff1744', '#f50057',
  '#4e342e', '#6d4c41', '#9e7762', '#bcaaa4', '#9e9e9e', '#78909c',
  '#607d8b', '#37474f'
];

// 36 Neon Electric Glowing Colors
export const FORMAT_NEON_COLORS = [
  '#00f3ff', '#ff007f', '#39ff14', '#b026ff', '#ffff00', '#ff5f1f',
  '#ff073a', '#00ffff', '#ffd700', '#f0f9ff', '#ff6b6b', '#4d4dff',
  '#00ff9d', '#ff1493', '#76ff03', '#d500f9', '#ffea00', '#ff3d00',
  '#ff0055', '#18ffff', '#ffab00', '#e0f7fa', '#ff80ab', '#8c9eff',
  '#69f0ae', '#ea80fc', '#b2ff59', '#b388ff', '#ffff8d', '#ff6e40',
  '#ff5252', '#84ffff', '#ffe57f', '#ffffff', '#ff4081', '#536dfe'
];

// 42 Glossy and Gradient Backgrounds matching Screenshot 2 (6 columns x 7 rows)
export const SHINY_BACKGROUNDS = [
  'linear-gradient(135deg, #ff7a18 0%, #af002d 100%)',
  'linear-gradient(135deg, #00c9a7 0%, #92fe9d 100%)',
  'linear-gradient(135deg, #b06ab3 0%, #4568dc 100%)',
  'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
  'linear-gradient(135deg, #f857a6 0%, #ff5858 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',

  'linear-gradient(135deg, #9b51e0 0%, #e056fd 100%)',
  'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)',
  'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)',
  'linear-gradient(135deg, #7f00ff 0%, #e100ff 100%)',
  'linear-gradient(135deg, #f12711 0%, #f5af19 100%)',
  'linear-gradient(135deg, #606c88 0%, #3f4c6b 100%)',

  'linear-gradient(135deg, #2b5876 0%, #4e4376 100%)',
  'linear-gradient(135deg, #870000 0%, #190a05 100%)',
  'linear-gradient(135deg, #ec008c 0%, #fc6767 100%)',
  'linear-gradient(135deg, #8a7356 0%, #483d3f 100%)',
  'linear-gradient(135deg, #3a7bd5 0%, #3a6073 100%)',
  'linear-gradient(135deg, #d38312 0%, #a83279 100%)',

  'linear-gradient(135deg, #0052d4 0%, #4364f7 50%, #6fb1fc 100%)',
  'linear-gradient(135deg, #30e8bf 0%, #ff8235 100%)',
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)',
  'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)',
  'linear-gradient(135deg, #cc2b5e 0%, #753a88 100%)',

  'linear-gradient(135deg, #48c6ef 0%, #6f86d6 100%)',
  'linear-gradient(135deg, #f85032 0%, #e73827 100%)',
  'linear-gradient(135deg, #1d2671 0%, #c33764 100%)',
  'linear-gradient(135deg, #e65c00 0%, #f9d423 100%)',
  'linear-gradient(135deg, #536976 0%, #292e49 100%)',
  'linear-gradient(135deg, #4b1248 0%, #f0c27b 100%)',

  'linear-gradient(135deg, #134e5e 0%, #71b280 100%)',
  'linear-gradient(135deg, #8e9eab 0%, #eef2f3 100%)',
  'linear-gradient(135deg, #f3904f 0%, #3b4371 100%)',
  'linear-gradient(135deg, #24c6dc 0%, #514a9d 100%)',
  'linear-gradient(135deg, #00c6ff 0%, #0072ff 100%)',
  'linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%)',

  'linear-gradient(135deg, #ffe259 0%, #ffa751 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #0ba360 0%, #3cba92 100%)',
  'linear-gradient(135deg, #c084fc 0%, #9333ea 100%)',
  'linear-gradient(135deg, #38bdf8 0%, #0284c7 100%)',
  'linear-gradient(135deg, #bf953f 0%, #fcf6ba 50%, #aa771c 100%)'
];

// Font styles matching Screenshot 3
export const FONT_STYLE_OPTIONS = [
  { id: 'normal', name: 'Normal', weight: 'normal', italic: false },
  { id: 'bold', name: 'Bold', weight: 'bold', italic: false },
  { id: 'heavy', name: 'Heavy', weight: 'heavy', italic: false },
  { id: 'italic', name: 'Italic', weight: 'normal', italic: true },
  { id: 'bold-italic', name: 'Bold italic', weight: 'bold', italic: true },
  { id: 'heavy-italic', name: 'Heavy italic', weight: 'heavy', italic: true }
];

// Font families matching Screenshot 4
export const FONT_FAMILY_OPTIONS = [
  { id: 'Normal', name: 'Normal', cssFamily: 'inherit' },
  { id: 'Kalam', name: 'Kalam', cssFamily: "'Kalam', cursive" },
  { id: 'Signika', name: 'Signika', cssFamily: "'Signika', sans-serif" },
  { id: 'Grandmaster', name: 'Grandmaster', cssFamily: "'Lemonada', cursive" },
  { id: 'Comic neue', name: 'Comic neue', cssFamily: "'Comic Neue', cursive" },
  { id: 'Quicksand', name: 'Quicksand', cssFamily: "'Quicksand', sans-serif" },
  { id: 'Orbitron', name: 'Orbitron', cssFamily: "'Orbitron', sans-serif" },
  { id: 'Lemonada', name: 'Lemonada', cssFamily: "'Lemonada', cursive" },
  { id: 'Grenze Gotisch', name: 'Grenze Gotisch', cssFamily: "'Grenze Gotisch', cursive" },
  { id: 'Merienda', name: 'Merienda', cssFamily: "'Merienda', cursive" },
  { id: 'Amita', name: 'Amita', cssFamily: "'Amita', cursive" },
  { id: 'Averia Libre', name: 'Averia Libre', cssFamily: "'Averia Libre', cursive" },
  { id: 'Turret Road', name: 'Turret Road', cssFamily: "'Turret Road', sans-serif" },
  { id: 'Sansita', name: 'Sansita', cssFamily: "'Sansita', sans-serif" },
  { id: 'Comfortaa', name: 'Comfortaa', cssFamily: "'Comfortaa', cursive" },
  { id: 'Charm', name: 'Charm', cssFamily: "'Charm', cursive" },
  { id: 'Lobster Two', name: 'Lobster Two', cssFamily: "'Lobster Two', cursive" },
  { id: 'Cairo', name: 'Cairo', cssFamily: "'Cairo', sans-serif" },
  { id: 'Amiri', name: 'Amiri', cssFamily: "'Amiri', serif" },
  { id: 'Tajawal', name: 'Tajawal', cssFamily: "'Tajawal', sans-serif" },
  { id: 'Reem Kufi', name: 'Reem Kufi', cssFamily: "'Reem Kufi', sans-serif" },
  { id: 'Aref Ruqaa', name: 'Aref Ruqaa', cssFamily: "'Aref Ruqaa', serif" },
  { id: 'El Messiri', name: 'El Messiri', cssFamily: "'El Messiri', sans-serif" },
  { id: 'Changa', name: 'Changa', cssFamily: "'Changa', sans-serif" },
];

interface TextFormatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFormat?: (format: {
    color?: string;
    bgGradient?: string;
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string;
    fontStyle?: string;
    isNeon?: boolean;
  }) => void;
}

export const TextFormatModal: React.FC<TextFormatModalProps> = ({
  isOpen,
  onClose,
  onApplyFormat
}) => {
  const {
    currentUser,
    updateUserProfile,
    siteSettings,
    showTopBanner
  } = useChat();

  // Active tab: 'color' (لون) | 'neon' (نيون) | 'background' (خلفية)
  const [activeTab, setActiveTab] = useState<'color' | 'neon' | 'background'>('color');

  // Helper to read format from localStorage
  const getStoredFormat = () => {
    try {
      if (currentUser?.id) {
        const userSpecific = localStorage.getItem(`araby_chat_format_${currentUser.id}`);
        if (userSpecific) return JSON.parse(userSpecific);
      }
      const globalFormat = localStorage.getItem('araby_chat_text_format');
      if (globalFormat) return JSON.parse(globalFormat);
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  // Selected format states
  const [selectedColor, setSelectedColor] = useState<string>(() => {
    const stored = getStoredFormat();
    return currentUser?.chatTextColor || stored?.color || '#000000';
  });

  const [selectedBgGradient, setSelectedBgGradient] = useState<string | null>(() => {
    const stored = getStoredFormat();
    return currentUser?.chatTextBgGradient || stored?.bgGradient || null;
  });

  const [selectedFontOption, setSelectedFontOption] = useState<string>(() => {
    const stored = getStoredFormat();
    return currentUser?.chatFontFamily || stored?.fontFamily || 'Normal';
  });

  const [selectedStyleOption, setSelectedStyleOption] = useState<string>(() => {
    const stored = getStoredFormat();
    const isItalic = currentUser?.chatFontStyle === 'italic' || stored?.style === 'italic';
    const weight = currentUser?.chatTextWeight || stored?.weight;
    if (weight === '900' || weight === 'heavy') return isItalic ? 'heavy-italic' : 'heavy';
    if (weight === 'bold' || weight === '700') return isItalic ? 'bold-italic' : 'bold';
    return isItalic ? 'italic' : 'normal';
  });

  const [isNeon, setIsNeon] = useState<boolean>(() => {
    const stored = getStoredFormat();
    return currentUser?.chatIsNeon !== undefined ? Boolean(currentUser?.chatIsNeon) : Boolean(stored?.isNeon);
  });

  // Re-sync states whenever modal is opened
  useEffect(() => {
    if (isOpen) {
      const stored = getStoredFormat();
      const color = currentUser?.chatTextColor || stored?.color || '#000000';
      setSelectedColor(color);

      const bg = currentUser?.chatTextBgGradient || stored?.bgGradient || null;
      setSelectedBgGradient(bg);

      const font = currentUser?.chatFontFamily || stored?.fontFamily || 'Normal';
      setSelectedFontOption(font);

      const isItalic = currentUser?.chatFontStyle === 'italic' || stored?.style === 'italic';
      const weight = currentUser?.chatTextWeight || stored?.weight;
      let styleOpt = 'normal';
      if (weight === '900' || weight === 'heavy') styleOpt = isItalic ? 'heavy-italic' : 'heavy';
      else if (weight === 'bold' || weight === '700') styleOpt = isItalic ? 'bold-italic' : 'bold';
      else styleOpt = isItalic ? 'italic' : 'normal';
      setSelectedStyleOption(styleOpt);

      const neon = currentUser?.chatIsNeon !== undefined ? Boolean(currentUser?.chatIsNeon) : Boolean(stored?.isNeon);
      setIsNeon(neon);
    }
  }, [isOpen, currentUser]);

  // Modals for Font Family and Font Style popups
  const [isFontFamilyModalOpen, setIsFontFamilyModalOpen] = useState(false);
  const [isFontStyleModalOpen, setIsFontStyleModalOpen] = useState(false);

  // Top saved notification bar
  const [showSavedNotification, setShowSavedNotification] = useState<boolean>(false);

  // Permissions for background tab
  const canAccessBackgroundTab = currentUser?.role !== 'visitor' || hasRolePermission(currentUser?.role, 'chat_background', siteSettings?.rolePermissions);

  useEffect(() => {
    if (!canAccessBackgroundTab && activeTab === 'background') {
      setActiveTab('color');
    }
  }, [canAccessBackgroundTab, activeTab]);

  if (!isOpen) return null;

  // Selected font object
  const currentFontObj = FONT_FAMILY_OPTIONS.find(f => f.id === selectedFontOption) || FONT_FAMILY_OPTIONS[0];
  // Selected style object
  const currentStyleObj = FONT_STYLE_OPTIONS.find(s => s.id === selectedStyleOption) || FONT_STYLE_OPTIONS[0];

  const handleSaveAndApply = async () => {
    const weightVal = currentStyleObj.weight === 'heavy' ? '900' : currentStyleObj.weight === 'bold' ? 'bold' : 'normal';
    const styleVal = currentStyleObj.italic ? 'italic' : 'normal';
    const bgToSave = canAccessBackgroundTab ? (selectedBgGradient || undefined) : undefined;
    const fontToSave = currentFontObj.id;

    const formatPayload = {
      color: selectedColor,
      bgGradient: bgToSave,
      fontFamily: fontToSave,
      weight: weightVal,
      style: styleVal,
      isNeon: isNeon
    };

    // 1. Persist in localStorage (both global & user-specific)
    try {
      localStorage.setItem('araby_chat_text_format', JSON.stringify(formatPayload));
      if (currentUser?.id) {
        localStorage.setItem(`araby_chat_format_${currentUser.id}`, JSON.stringify(formatPayload));
      }
    } catch (err) {
      console.error('Error saving format preferences in localStorage:', err);
    }

    // 2. Update currentUser via updateUserProfile (saves to Firestore & backend D1)
    if (currentUser) {
      await updateUserProfile({
        chatTextColor: selectedColor,
        chatTextBgGradient: bgToSave,
        chatFontFamily: fontToSave,
        chatFontStyle: styleVal,
        chatTextWeight: weightVal,
        chatIsNeon: isNeon
      });
    }

    // 3. Callback
    if (onApplyFormat) {
      onApplyFormat({
        color: selectedColor,
        bgGradient: bgToSave,
        fontFamily: fontToSave,
        fontWeight: weightVal,
        fontStyle: styleVal,
        isNeon: isNeon
      });
    }

    // 4. Show top green notification banner
    setShowSavedNotification(true);
    showTopBanner('✅ تم حفظ إعدادات الخط وتنسيق النص بنجاح');

    setTimeout(() => {
      setShowSavedNotification(false);
      onClose();
    }, 700);
  };

  return (
    <div
      id="text-format-modal-backdrop"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150"
      dir="rtl"
    >
      <div
        id="text-format-modal-card"
        className="bg-white text-slate-800 rounded-lg w-full max-w-md shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[95vh] relative animate-in zoom-in-95 duration-150"
      >
        {/* Top Green Notification Bar (الشريط الأخضر عند الحفظ مكتوب تم الحفظ في وسطه) */}
        {showSavedNotification && (
          <div className="absolute top-0 inset-x-0 z-50 bg-[#4caf50] text-white py-2.5 px-4 font-black text-sm text-center shadow-lg animate-in slide-in-from-top duration-200 flex items-center justify-center gap-2 select-none">
            <Check className="w-4 h-4 stroke-[3]" />
            <span>تم الحفظ</span>
          </div>
        )}

        {/* Modal Top Header (مطابق للصور: شريط علوي داكن مع زر الإغلاق ✕ على الجهة اليمنى) */}
        <div className="bg-[#0b333e] text-white px-4 py-3.5 flex items-center justify-between shadow-xs select-none">
          {/* زر الإغلاق الأبيض ✕ على الجهة اليمنى */}
          <button
            type="button"
            onClick={onClose}
            className="text-white hover:text-slate-200 transition-colors p-1 cursor-pointer flex items-center justify-center mr-0"
            title="إغلاق"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5 stroke-[3] text-white" />
          </button>
          <div />
        </div>

        {/* Modal Body Container */}
        <div className="p-4 sm:p-5 flex flex-col flex-1 overflow-y-auto space-y-4">
          
          {/* 1. Preview Box (عرض مربع الرسالة) */}
          <div className="space-y-1.5">
            <div className="text-right text-xs font-bold text-slate-700 pr-1 flex items-center justify-between">
              <span>معاينة مربع الرسالة والنص</span>
              {selectedBgGradient && (
                <button
                  type="button"
                  onClick={() => setSelectedBgGradient(null)}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-bold cursor-pointer"
                >
                  إلغاء الخلفية ✕
                </button>
              )}
            </div>
            <div className="bg-slate-100/70 p-3 sm:p-4 rounded-xl flex items-center justify-center min-h-[75px] text-center border border-slate-200">
              <div
                id="format-preview-message-box"
                className="message-box transition-all select-text"
                style={{
                  backgroundColor: selectedBgGradient && !selectedBgGradient.startsWith('linear-gradient') ? selectedBgGradient : undefined,
                  backgroundImage: selectedBgGradient && selectedBgGradient.startsWith('linear-gradient') ? selectedBgGradient : undefined,
                  borderRadius: selectedBgGradient ? '12px' : undefined,
                  padding: selectedBgGradient ? '8px 16px' : '3px 8px',
                  border: selectedBgGradient ? '1px solid rgba(0,0,0,0.12)' : '1px dashed #cbd5e1',
                  boxShadow: selectedBgGradient ? '0 2px 8px rgba(0,0,0,0.1)' : undefined,
                  display: 'inline-block',
                  maxWidth: '100%'
                }}
              >
                <div
                  id="format-preview-message-text"
                  style={{
                    color: selectedColor,
                    fontFamily: currentFontObj.cssFamily !== 'inherit' ? currentFontObj.cssFamily : undefined,
                    fontWeight: currentStyleObj.weight === 'heavy' ? 900 : currentStyleObj.weight === 'bold' ? 700 : 400,
                    fontStyle: currentStyleObj.italic ? 'italic' : 'normal',
                    textShadow: isNeon || activeTab === 'neon'
                      ? `0 0 8px ${selectedColor}, 0 0 16px ${selectedColor}, 0 0 2px #000`
                      : undefined
                  }}
                  className="message-text text-sm sm:text-base select-text break-words transition-all"
                >
                  .Lorem ipsum dolor sit amet
                </div>
              </div>
            </div>
          </div>

          {/* 2. Tabs Row (مطابق للصور: لون | نيون | خلفية) */}
          <div className="flex items-center justify-end gap-1.5 pt-1">
            {/* خلفية Tab */}
            {canAccessBackgroundTab && (
              <button
                type="button"
                onClick={() => setActiveTab('background')}
                className={`px-4 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                  activeTab === 'background'
                    ? 'bg-slate-200 text-slate-900 shadow-xs'
                    : 'bg-transparent text-slate-700 hover:bg-slate-100'
                }`}
              >
                خلفية
              </button>
            )}

            {/* نيون Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('neon');
                setIsNeon(true);
              }}
              className={`px-4 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'neon'
                  ? 'bg-slate-200 text-slate-900 shadow-xs'
                  : 'bg-transparent text-slate-700 hover:bg-slate-100'
              }`}
            >
              نيون
            </button>

            {/* لون Tab */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('color');
                setIsNeon(false);
              }}
              className={`px-4 py-1.5 rounded-sm text-xs font-bold transition-colors cursor-pointer ${
                activeTab === 'color'
                  ? 'bg-slate-200 text-slate-900 shadow-xs'
                  : 'bg-transparent text-slate-700 hover:bg-slate-100'
              }`}
            >
              لون
            </button>
          </div>

          {/* 3. Color Grids / Background Grid Area */}
          <div className="pt-1">
            {/* Tab 1: Solid Colors (مطابق للصورة 1: شبكة 6 أعمدة) */}
            {activeTab === 'color' && (
              <div className="grid grid-cols-6 gap-1 bg-white p-0.5 rounded border border-slate-200">
                {FORMAT_SOLID_COLORS.map((color, idx) => {
                  const isSelected = selectedColor.toLowerCase() === color.toLowerCase() && !isNeon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        setIsNeon(false);
                      }}
                      style={{ backgroundColor: color }}
                      className={`h-11 sm:h-12 w-full transition-transform cursor-pointer border border-black/10 relative ${
                        isSelected ? 'ring-2 ring-blue-600 scale-95 z-10' : 'hover:opacity-90'
                      }`}
                      title={color}
                    />
                  );
                })}
              </div>
            )}

            {/* Tab 2: Neon Colors (شبكة 6 أعمدة ألوان نيون مشعة) */}
            {activeTab === 'neon' && (
              <div className="grid grid-cols-6 gap-1 bg-slate-900 p-1.5 rounded border border-slate-700">
                {FORMAT_NEON_COLORS.map((color, idx) => {
                  const isSelected = selectedColor.toLowerCase() === color.toLowerCase() && isNeon;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setSelectedColor(color);
                        setIsNeon(true);
                      }}
                      style={{
                        backgroundColor: color,
                        boxShadow: isSelected ? `0 0 12px ${color}` : `0 0 4px ${color}88`
                      }}
                      className={`h-11 sm:h-12 w-full transition-transform cursor-pointer border border-white/20 relative rounded-xs ${
                        isSelected ? 'ring-2 ring-white scale-105 z-10' : 'hover:scale-102'
                      }`}
                      title={color}
                    />
                  );
                })}
              </div>
            )}

            {/* Tab 3: Background Gradients (مطابق للصورة 2: شبكة خلفيات متدرجة ولامعة 6 أعمدة) */}
            {activeTab === 'background' && canAccessBackgroundTab && (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-500">اختر لون الخلفية:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedBgGradient(null)}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 underline cursor-pointer"
                  >
                    إلغاء الخلفية ✕
                  </button>
                </div>

                <div className="grid grid-cols-6 gap-1 bg-white p-0.5 rounded border border-slate-200 max-h-56 overflow-y-auto custom-scrollbar">
                  {SHINY_BACKGROUNDS.map((bg, idx) => {
                    const isSelected = selectedBgGradient === bg;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedBgGradient(bg)}
                        style={{ background: bg }}
                        className={`h-11 sm:h-12 w-full transition-transform cursor-pointer border border-black/10 relative ${
                          isSelected ? 'ring-2 ring-blue-600 scale-95 z-10' : 'hover:opacity-90'
                        }`}
                        title={`خلفية ${idx + 1}`}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Dropdown Buttons Row (مطابق للصور: الخط | اسم الخط) */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Left: الخط Button */}
            <div className="space-y-1 text-center">
              <label className="text-xs font-bold text-slate-700 block">
                الخط
              </label>
              <button
                type="button"
                onClick={() => setIsFontStyleModalOpen(true)}
                className="w-full bg-[#f8fafc] hover:bg-[#f1f5f9] border border-slate-300 rounded px-3 py-2 text-xs font-medium text-slate-800 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                {/* Downward triangle arrow */}
                <span className="text-slate-500 text-[10px]">▼</span>
                <span>{currentStyleObj.name}</span>
              </button>
            </div>

            {/* Right: اسم الخط Button */}
            <div className="space-y-1 text-center">
              <label className="text-xs font-bold text-slate-700 block">
                اسم الخط
              </label>
              <button
                type="button"
                onClick={() => setIsFontFamilyModalOpen(true)}
                className="w-full bg-[#f8fafc] hover:bg-[#f1f5f9] border border-slate-300 rounded px-3 py-2 text-xs font-medium text-slate-800 flex items-center justify-between transition-colors cursor-pointer shadow-2xs"
              >
                {/* Downward triangle arrow */}
                <span className="text-slate-500 text-[10px]">▼</span>
                <span className="truncate">{currentFontObj.name}</span>
              </button>
            </div>
          </div>

          {/* 5. Bottom Save Button (مطابق للصور: زر حفظ باللون السماوي) */}
          <div className="pt-3 flex items-center justify-start">
            <button
              type="button"
              onClick={handleSaveAndApply}
              className="bg-[#0099c8] hover:bg-[#0088b3] text-white font-bold px-7 py-2 rounded text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>حفظ</span>
            </button>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* POPUP 1: Font Style Modal (مطابق للصورة 3: نافذة راديو خيارات سُمك الخط) */}
      {/* ========================================================================= */}
      {isFontStyleModalOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsFontStyleModalOpen(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl w-full max-w-xs shadow-2xl p-5 space-y-3 animate-in zoom-in-95 duration-100 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="space-y-2">
              {FONT_STYLE_OPTIONS.map((style) => {
                const isSelected = selectedStyleOption === style.id;
                return (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => {
                      setSelectedStyleOption(style.id);
                      setIsFontStyleModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group text-right"
                  >
                    {/* Radio circle */}
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-slate-400 group-hover:border-purple-600 transition-colors">
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#5c2d91]" />
                      )}
                    </div>

                    <span className="text-sm font-medium text-slate-800">
                      {style.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP 2: Font Family Modal (مطابق للصورة 4: نافذة راديو قائمة أسماء الخطوط) */}
      {/* ========================================================================= */}
      {isFontFamilyModalOpen && (
        <div
          className="fixed inset-0 z-60 bg-black/50 flex items-center justify-center p-4 animate-in fade-in duration-100"
          onClick={() => setIsFontFamilyModalOpen(false)}
        >
          <div
            className="bg-white text-slate-900 rounded-3xl w-full max-w-xs max-h-[80vh] shadow-2xl p-5 flex flex-col animate-in zoom-in-95 duration-100 border border-slate-100"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            <div className="overflow-y-auto custom-scrollbar space-y-1 flex-1 pr-1">
              {FONT_FAMILY_OPTIONS.map((font) => {
                const isSelected = selectedFontOption === font.id;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => {
                      setSelectedFontOption(font.id);
                      setIsFontFamilyModalOpen(false);
                    }}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer group text-right"
                  >
                    {/* Radio circle */}
                    <div className="flex items-center justify-center w-5 h-5 rounded-full border-2 border-slate-400 group-hover:border-purple-600 transition-colors">
                      {isSelected && (
                        <div className="w-2.5 h-2.5 rounded-full bg-[#5c2d91]" />
                      )}
                    </div>

                    <span
                      style={{
                        fontFamily: font.cssFamily !== 'inherit' ? font.cssFamily : undefined
                      }}
                      className="text-sm font-medium text-slate-800"
                    >
                      {font.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
