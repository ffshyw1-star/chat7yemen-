import React, { useState, useEffect } from 'react';
import { Cookie, Shield, Check, X, Sliders, ChevronDown, ChevronUp } from 'lucide-react';

interface CookiePreferences {
  essential: boolean; // session & authentication in browser
  audio: boolean;     // sound effects preferences
  theme: boolean;     // theme & UI visual preferences
  analytics: boolean; // basic anonymous usage
}

export const CookieConsentBanner: React.FC = () => {
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showCustomize, setShowCustomize] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    essential: true, // Always true (required for browser session)
    audio: true,
    theme: true,
    analytics: false,
  });

  useEffect(() => {
    try {
      const consented = localStorage.getItem('araby_cookies_consented');
      if (!consented) {
        // Small delay for smooth entry
        const timer = setTimeout(() => {
          setShowBanner(true);
        }, 600);
        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      const allTrue: CookiePreferences = {
        essential: true,
        audio: true,
        theme: true,
        analytics: true,
      };
      localStorage.setItem('araby_cookies_consented', 'true');
      localStorage.setItem('araby_cookie_preferences', JSON.stringify(allTrue));
      document.cookie = "araby_cookies_allowed=1; path=/; max-age=31536000; SameSite=Lax";
      setShowBanner(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem('araby_cookies_consented', 'true');
      localStorage.setItem('araby_cookie_preferences', JSON.stringify(preferences));
      document.cookie = "araby_cookies_allowed=1; path=/; max-age=31536000; SameSite=Lax";
      setShowBanner(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectOptional = () => {
    try {
      const onlyEssential: CookiePreferences = {
        essential: true,
        audio: false,
        theme: true,
        analytics: false,
      };
      localStorage.setItem('araby_cookies_consented', 'true');
      localStorage.setItem('araby_cookie_preferences', JSON.stringify(onlyEssential));
      document.cookie = "araby_cookies_allowed=1; path=/; max-age=31536000; SameSite=Lax";
      setShowBanner(false);
    } catch (e) {
      console.error(e);
    }
  };

  if (!showBanner) return null;

  return (
    <div
      id="cookie-consent-banner"
      dir="rtl"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-slate-900/95 backdrop-blur-md border-t border-amber-500/30 text-slate-100 shadow-2xl animate-in slide-in-from-bottom duration-300"
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Text and Icon */}
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5">
              <Cookie className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1 text-right">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-sm sm:text-base text-amber-400 flex items-center gap-1.5">
                  <span>إشعار ملفات تعريف الارتباط وتخزين الجلسة (Cookies & Storage)</span>
                  <Shield className="w-4 h-4 text-emerald-400" />
                </h4>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                يستخدم الموقع التخزين المحلي في متصفحك (<span className="text-amber-300 font-semibold">Local Browser Storage</span>) لحفظ جلسة تسجيل الدخول وتفضيلات الدردشة والصوتيات الخاصة بك على هذا المتصفح فقط. لا نقوم بتثبيت جلساتك على أجهزة أخرى تلقائياً حفاظاً على أمانك وخصوصيتك.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto justify-end">
            <button
              id="cookie-customize-toggle-btn"
              onClick={() => setShowCustomize(!showCustomize)}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>تخصيص الإعدادات</span>
              {showCustomize ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              id="cookie-reject-optional-btn"
              onClick={handleRejectOptional}
              className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              الضرورية فقط
            </button>

            <button
              id="cookie-accept-all-btn"
              onClick={handleAcceptAll}
              className="px-5 py-2 rounded-lg text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>الموافقة والمتابعة</span>
            </button>
          </div>

        </div>

        {/* Customized Preferences Panel */}
        {showCustomize && (
          <div
            id="cookie-customization-panel"
            className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs"
          >
            {/* Essential */}
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-400">تخزين الجلسة (ضروري)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">إلزامي</span>
              </div>
              <p className="text-slate-400 text-[11px]">حفظ تسجيل الدخول والحساب في متصفحك الحالي.</p>
            </div>

            {/* Audio */}
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">أصوات وتنبيهات الدردشة</span>
                <input
                  type="checkbox"
                  checked={preferences.audio}
                  onChange={(e) => setPreferences({ ...preferences, audio: e.target.checked })}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4 accent-amber-500 cursor-pointer"
                />
              </div>
              <p className="text-slate-400 text-[11px]">تخزين تفضيلات نغمات الرسائل والإشعارات.</p>
            </div>

            {/* Theme */}
            <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-200">المظهر والثيم</span>
                <input
                  type="checkbox"
                  checked={preferences.theme}
                  onChange={(e) => setPreferences({ ...preferences, theme: e.target.checked })}
                  className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 h-4 w-4 accent-amber-500 cursor-pointer"
                />
              </div>
              <p className="text-slate-400 text-[11px]">حفظ تفضيلات المظهر (ليلي / نهاري / ألوان).</p>
            </div>

            {/* Save Preferences Button */}
            <div className="p-2 flex items-center justify-center">
              <button
                id="cookie-save-preferences-btn"
                onClick={handleSavePreferences}
                className="w-full h-full py-2 px-3 rounded-lg font-bold bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/40 transition-all text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>حفظ اختياراتي</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
