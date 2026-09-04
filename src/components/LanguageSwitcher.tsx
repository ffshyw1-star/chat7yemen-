import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Globe, CheckCircle2, ChevronDown } from 'lucide-react';

interface LanguageSwitcherProps {
  compact?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { currentLang, setAppLanguage, isRtl } = useChat();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const isEnglish = currentLang === 'English';

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* Trigger Button: Saudi flag or USA flag */}
      <button
        id="app-language-switcher-btn"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#82b400] hover:bg-[#74a000] text-white px-2.5 py-1.5 rounded-lg font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer border border-lime-400/40 active:scale-95"
        title={isEnglish ? 'Switch Language / تغيير اللغة' : 'تغيير اللغة / Switch Language'}
      >
        <span className="text-base leading-none select-none">{isEnglish ? '🇺🇸' : '🇸🇦'}</span>
        {!compact && (
          <span className="text-xs font-bold">{isEnglish ? 'English' : 'العربية'}</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-64 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-150`}
          dir={isRtl ? 'rtl' : 'ltr'}
        >
          <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
            <span>{isEnglish ? 'Select Language' : 'اختر لغة الموقع'}</span>
            <Globe className="w-4 h-4 text-sky-500" />
          </div>

          <div className="mt-1 space-y-1">
            {/* Option 1: علم السعودية - اللغة العربية */}
            <button
              id="lang-option-saudi-arabic"
              type="button"
              onClick={() => {
                setAppLanguage('Arabic');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                !isEnglish
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl leading-none select-none">🇸🇦</span>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <p className="font-extrabold text-slate-900 text-xs">علم السعودية</p>
                  <p className="text-[11px] text-slate-500 font-semibold">اللغة العربية</p>
                </div>
              </div>
              {!isEnglish && (
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              )}
            </button>

            {/* Option 2: علم أمريكا - اللغة الإنجليزية */}
            <button
              id="lang-option-usa-english"
              type="button"
              onClick={() => {
                setAppLanguage('English');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
                isEnglish
                  ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-xs'
                  : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl leading-none select-none">🇺🇸</span>
                <div className={isRtl ? 'text-right' : 'text-left'}>
                  <p className="font-extrabold text-slate-900 text-xs">علم أمريكا</p>
                  <p className="text-[11px] text-slate-500 font-semibold">اللغة الإنجليزية</p>
                </div>
              </div>
              {isEnglish && (
                <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
