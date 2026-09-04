import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Layout, Eye, EyeOff, UserCheck, CheckCircle2, ShieldAlert,
  Sliders, Globe, Sparkles, Hash, AlertCircle, Save, Smartphone,
  Users, Lock, RefreshCw
} from 'lucide-react';

interface LandingSettingsViewProps {
  showToast: (msg: string) => void;
}

export const LandingSettingsView: React.FC<LandingSettingsViewProps> = ({ showToast }) => {
  const { siteSettings, updateSiteSettings } = useChat();

  const [form, setForm] = useState({
    hideVisitorLogin: Boolean(siteSettings?.hideVisitorLogin),
    hideRegisterLink: Boolean(siteSettings?.hideRegisterLink),
    maxUsernameLength: siteSettings?.maxUsernameLength || 20,
    landingTitle: siteSettings?.landingTitle || 'دردشة تعارف',
    landingTitleEn: siteSettings?.landingTitleEn || 'Dating & Chat',
    landingSubtitle: siteSettings?.landingSubtitle || 'دردشة تعارف هو موقع تعارف شباب وبنات العرب محادثات عامة ومحادثات خاصة بدون تسجيل',
    landingSubtitleEn: siteSettings?.landingSubtitleEn || 'Free online chat rooms for friends to meet and talk in public and private without registration',
    siteName: siteSettings?.siteName || 'شات اليوزر العربي'
  });

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSiteSettings({
      ...siteSettings,
      hideVisitorLogin: form.hideVisitorLogin,
      hideRegisterLink: form.hideRegisterLink,
      maxUsernameLength: Number(form.maxUsernameLength) || 20,
      landingTitle: form.landingTitle.trim() || 'دردشة تعارف',
      landingTitleEn: form.landingTitleEn.trim() || 'Dating & Chat',
      landingSubtitle: form.landingSubtitle.trim(),
      landingSubtitleEn: form.landingSubtitleEn.trim(),
      siteName: form.siteName.trim() || 'شات اليوزر العربي'
    });
    showToast('تم حفظ إعدادات الواجهة الرئيسية بنجاح 💾✨');
  };

  const handleToggleVisitorLogin = (checked: boolean) => {
    const updated = { ...form, hideVisitorLogin: checked };
    setForm(updated);
    updateSiteSettings({
      ...siteSettings,
      hideVisitorLogin: checked
    });
    showToast(checked ? 'تم إخفاء زر دخول الزوار من الواجهة الرئيسية 🚫' : 'تم إظهار زر دخول الزوار في الواجهة الرئيسية ✅');
  };

  const handleToggleRegisterLink = (checked: boolean) => {
    const updated = { ...form, hideRegisterLink: checked };
    setForm(updated);
    updateSiteSettings({
      ...siteSettings,
      hideRegisterLink: checked
    });
    showToast(checked ? 'تم إخفاء رابط التسجيل من الواجهة الرئيسية 🔒' : 'تم إظهار رابط التسجيل في الواجهة الرئيسية ✅');
  };

  const handleSetMaxUsernameLength = (len: number) => {
    const safeLen = Math.max(3, Math.min(50, len));
    const updated = { ...form, maxUsernameLength: safeLen };
    setForm(updated);
    updateSiteSettings({
      ...siteSettings,
      maxUsernameLength: safeLen
    });
    showToast(`تم ضبط الحد الأقصى لأحرف الاسم على ${safeLen} حرفاً 💾`);
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-teal-900 via-sky-900 to-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm border border-teal-700/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center shrink-0">
            <Layout className="w-6 h-6 text-teal-300" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
              <span>ربط وتحكم إعدادات الواجهة الرئيسية</span>
              <span className="text-[10px] bg-teal-400/20 text-teal-200 border border-teal-300/30 px-2 py-0.5 rounded-full font-mono">
                Live Sync
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              تحكم كامل ومباشر في عناصر الصفحة الرئيسية: إخفاء أزرار الزوار، إخفاء رابط التسجيل، وتحديد طول أسماء المستخدمين
            </p>
          </div>
        </div>

        <button
          onClick={() => handleSave()}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white text-xs font-black rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer transition-all self-end sm:self-center shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>حفظ جميع التغييرات</span>
        </button>
      </div>

      {/* Grid: 2 Primary Toggle Switches (Visitor Button & Register Link) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* Toggle 1: Hide Visitor Login Button */}
        <div className={`p-4 rounded-2xl border transition-all ${
          form.hideVisitorLogin
            ? 'bg-rose-50/80 border-rose-200 shadow-2xs'
            : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                form.hideVisitorLogin
                  ? 'bg-rose-100 text-rose-700'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {form.hideVisitorLogin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-900">
                    زر إخفاء دخول الزوار من الصفحة الرئيسية
                  </h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    form.hideVisitorLogin
                      ? 'bg-rose-200 text-rose-900 border border-rose-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {form.hideVisitorLogin ? 'مخفي حالياً 🚫' : 'ظاهر في الواجهة ✅'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  إخفاء الزر الأسود (دخول الزوار) من الصفحة الرئيسية تماماً ومنع أي زائر من الدخول عبرها.
                </p>
              </div>
            </div>

            {/* Switch Toggle */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.hideVisitorLogin}
                onChange={(e) => handleToggleVisitorLogin(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600" />
            </label>
          </div>
        </div>

        {/* Toggle 2: Hide Register Link */}
        <div className={`p-4 rounded-2xl border transition-all ${
          form.hideRegisterLink
            ? 'bg-amber-50/80 border-amber-200 shadow-2xs'
            : 'bg-white border-slate-200 shadow-2xs hover:border-slate-300'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                form.hideRegisterLink
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-700'
              }`}>
                {form.hideRegisterLink ? <Lock className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-slate-900">
                    زر إخفاء رابط "لست مسجل لدينا ؟ سجل الآن"
                  </h3>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    form.hideRegisterLink
                      ? 'bg-amber-200 text-amber-900 border border-amber-300'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {form.hideRegisterLink ? 'مخفي حالياً 🔒' : 'ظاهر في الواجهة ✅'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                  إخفاء الرابط الموجود أسفل أزرار الدخول في الصفحة الرئيسية ("لست مسجل لدينا ؟ سجل الان").
                </p>
              </div>
            </div>

            {/* Switch Toggle */}
            <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-1">
              <input
                type="checkbox"
                checked={form.hideRegisterLink}
                onChange={(e) => handleToggleRegisterLink(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600" />
            </label>
          </div>
        </div>

      </div>

      {/* Max Username Length Setting Card */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-700 shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <span>تحديد عدد أحرف اسم المستخدم المسموح بها</span>
                <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-md">
                  {form.maxUsernameLength} حرفاً
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                الحد الأقصى لطول الاسم المسموح بكتابته عند الدخول كزائر أو تسجيل حساب جديد
              </p>
            </div>
          </div>

          {/* Direct Numeric Input */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-bold text-slate-600">العدد:</span>
            <input
              type="number"
              min={3}
              max={50}
              value={form.maxUsernameLength}
              onChange={(e) => handleSetMaxUsernameLength(Number(e.target.value))}
              className="w-20 bg-slate-50 border border-purple-300 rounded-lg px-2.5 py-1.5 text-xs font-black text-purple-900 text-center focus:outline-none focus:border-purple-500"
            />
            <span className="text-xs text-slate-500 font-bold">أحرف</span>
          </div>
        </div>

        {/* Quick Select Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-bold text-slate-500 ml-1">خيارات سريعة:</span>
          {[
            { len: 10, label: '10 أحرف' },
            { len: 15, label: '15 حرفاً' },
            { len: 20, label: '20 حرفاً (الافتراضي)' },
            { len: 25, label: '25 حرفاً' },
            { len: 30, label: '30 حرفاً' },
            { len: 40, label: '40 حرفاً' },
          ].map((item) => (
            <button
              key={item.len}
              type="button"
              onClick={() => handleSetMaxUsernameLength(item.len)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                Number(form.maxUsernameLength) === item.len
                  ? 'bg-purple-600 text-white border-purple-700 shadow-xs scale-102'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Enforced Visitor Rules Confirmation Box */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-emerald-950">
              الشروط المطبقة فورياً والمؤكدة لدخول الزوار
            </h3>
            <p className="text-[11px] text-emerald-800/90 mt-0.5">
              تم ضبط نظام الزائر بالكامل للامتثال لطلبك ولا يمكن تجاوزه برمجياً:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Rule 1: Hide entry mode */}
          <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-3xs space-y-1">
            <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>🚫</span>
              <span>إخفاء نوع دخول الزائر</span>
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              تم إخفاء خيارات (مسموح بالدردشة / دخول صامت للمشاهدة) من النافذة نهائياً.
            </p>
          </div>

          {/* Rule 2: Strict Gender Validation */}
          <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-3xs space-y-1">
            <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>🚻</span>
              <span>التحقق الإلزامي من الجنس</span>
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              لا يمكن الدخول إطلاقاً إلا باختيار الجنس من الخيارات الثلاثة: (ذكر 👨 / أنثى 👩 / آخر ⚧️).
            </p>
          </div>

          {/* Rule 3: Strict Age Selection */}
          <div className="p-3 bg-white rounded-xl border border-emerald-200/80 shadow-3xs space-y-1">
            <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>🎂</span>
              <span>التحديد الإلزامي للعمر</span>
            </p>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              لا يسمح للزائر بالدخول حتى يقوم باختيار عمره الفعلي من القائمة المنسدلة.
            </p>
          </div>
        </div>
      </div>

      {/* Live Preview Box of the Landing Page Buttons */}
      <div className="bg-gradient-to-b from-[#0284c7] to-[#0369a1] text-white p-5 rounded-2xl shadow-sm border border-sky-400/30 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-sky-200" />
            <span className="text-xs font-black text-white">معاينة مباشرة لشكل الأزرار في الواجهة الرئيسية الآن</span>
          </div>
          <span className="text-[10px] bg-white/20 text-sky-100 px-2 py-0.5 rounded-full font-mono">
            Preview
          </span>
        </div>

        <div className="max-w-xs mx-auto bg-sky-950/40 p-4 rounded-xl border border-white/10 text-center space-y-2.5">
          <h4 className="text-base font-black text-white">
            {form.landingTitle || 'دردشة تعارف'}
          </h4>
          <p className="text-[11px] text-sky-200 line-clamp-2">
            {form.landingSubtitle || 'دردشة تعارف هو موقع تعارف شباب وبنات العرب محادثات عامة ومحادثات خاصة بدون تسجيل'}
          </p>

          <div className="space-y-2 pt-2">
            {/* Member Login Button (Always Visible) */}
            <div className="w-full bg-[#82b400] text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-1.5">
              <span>دخول (الأعضاء)</span>
            </div>

            {/* Visitor Button (Preview based on toggle) */}
            {!form.hideVisitorLogin ? (
              <div className="w-full bg-[#202020] border border-white/20 text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-sm flex items-center justify-center gap-1.5">
                <span>دخول الزوار</span>
              </div>
            ) : (
              <div className="p-2 rounded-lg bg-rose-950/60 border border-rose-500/40 text-[10px] text-rose-200 font-bold">
                🚫 زر دخول الزوار مخفي عن الزوار
              </div>
            )}

            {/* Register Link (Preview based on toggle) */}
            {!form.hideRegisterLink ? (
              <div className="pt-1 text-[11px] text-sky-200 font-bold underline">
                لست مسجل لدينا ؟ سجل الان
              </div>
            ) : (
              <div className="p-1 rounded bg-amber-950/50 border border-amber-500/30 text-[10px] text-amber-200 font-bold">
                🔒 رابط التسجيل مخفي عن المستخدمين
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Landing Page Texts Form */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2">
          <Globe className="w-4 h-4 text-sky-600" />
          <span>تعديل نصوص وعناوين الواجهة الرئيسية</span>
        </h3>

        <form onSubmit={handleSave} className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                عنوان الواجهة الرئيسية (العربية):
              </label>
              <input
                type="text"
                value={form.landingTitle}
                onChange={(e) => setForm({ ...form, landingTitle: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                placeholder="دردشة تعارف"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                عنوان الواجهة الرئيسية (English):
              </label>
              <input
                type="text"
                value={form.landingTitleEn}
                onChange={(e) => setForm({ ...form, landingTitleEn: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
                placeholder="Dating & Chat"
              />
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              الوصف والرسالة الترحيبية (العربية):
            </label>
            <textarea
              value={form.landingSubtitle}
              onChange={(e) => setForm({ ...form, landingSubtitle: e.target.value })}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              placeholder="دردشة تعارف هو موقع تعارف شباب وبنات العرب..."
            />
          </div>

          <div>
            <label className="font-bold text-slate-700 block mb-1">
              الوصف والرسالة الترحيبية (English):
            </label>
            <textarea
              value={form.landingSubtitleEn}
              onChange={(e) => setForm({ ...form, landingSubtitleEn: e.target.value })}
              rows={2}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none focus:border-sky-500"
              placeholder="Free online chat rooms for friends..."
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-[#00aeeF] hover:bg-[#0284c7] text-white text-xs font-black rounded-xl shadow-md flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>حفظ جميع إعدادات الواجهة الرئيسية 💾</span>
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};
