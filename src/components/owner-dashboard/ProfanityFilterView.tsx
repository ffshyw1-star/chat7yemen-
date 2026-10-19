import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  ShieldAlert, ShieldCheck, Filter, Plus, Trash2, Search,
  RefreshCw, Copy, Check, AlertTriangle, Eye, Sparkles, Sliders,
  MessageSquare, Lock, Ban, Flame, Settings2
} from 'lucide-react';
import {
  DEFAULT_ARABIC_PROFANITY_LIST,
  DEFAULT_ENGLISH_PROFANITY_LIST,
  DEFAULT_ALL_PROFANITY_LIST,
  filterProfanity
} from '../../utils/profanityFilter';

interface ProfanityFilterViewProps {
  showToast: (msg: string) => void;
}

export const ProfanityFilterView: React.FC<ProfanityFilterViewProps> = ({ showToast }) => {
  const { siteSettings, updateSiteSettings } = useChat();

  const [inputWord, setInputWord] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Live Sandbox Tester
  const [testInput, setTestInput] = useState('أنت شخص غبي ومحتال');
  const [testResult, setTestResult] = useState(() =>
    filterProfanity('أنت شخص غبي ومحتال', siteSettings?.customBadWordsList || [])
  );

  // Words list
  const customBadWords: string[] = siteSettings?.customBadWordsList || DEFAULT_ALL_PROFANITY_LIST;

  // Settings
  const isFilterEnabled = siteSettings?.enableProfanityFilter !== false;
  const filterScope = siteSettings?.profanityFilterScope || 'both';
  const filterAction = siteSettings?.profanityFilterAction || 'block';
  const matchMode = siteSettings?.profanityMatchMode || 'flexible';
  const autoMute = siteSettings?.profanityAutoMute !== false;
  const muteDuration = siteSettings?.profanityMuteDurationMinutes || 1;
  const exemptStaff = siteSettings?.profanityExemptStaff !== false;

  // Filtered view for search
  const displayedWords = customBadWords.filter(w =>
    !searchTerm.trim() || w.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  // Run live test
  const handleRunTest = (text: string) => {
    setTestInput(text);
    const result = filterProfanity(text, customBadWords, matchMode);
    setTestResult(result);
  };

  // Add words (supports single or comma/newline bulk)
  const handleAddWord = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = inputWord.trim();
    if (!raw) return;

    const items = raw.split(/[,،\n]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
    if (items.length === 0) return;

    const currentLower = new Set(customBadWords.map(w => w.toLowerCase()));
    const newItems = items.filter(w => !currentLower.has(w));

    if (newItems.length === 0) {
      showToast('⚠️ الكلمات المدخلة موجودة بالفعل في قائمة الحظر');
      return;
    }

    const updated = [...newItems, ...customBadWords];
    setIsSaving(true);
    try {
      await updateSiteSettings({ customBadWordsList: updated });
      setInputWord('');
      showToast(`تمت إضافة ${newItems.length} كلمة جديدة لقائمة حظر الألفاظ البذيئة بنجاح ✅`);
      // Update sandbox test
      setTestResult(filterProfanity(testInput, updated, matchMode));
    } catch {
      showToast('❌ تعذر حفظ القائمة في السيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  // Remove word
  const handleRemoveWord = async (wordToRemove: string) => {
    const updated = customBadWords.filter(w => w.toLowerCase() !== wordToRemove.toLowerCase());
    setIsSaving(true);
    try {
      await updateSiteSettings({ customBadWordsList: updated });
      showToast(`تمت إزالة (${wordToRemove}) من قائمة الكلمات المحظورة ✅`);
      setTestResult(filterProfanity(testInput, updated, matchMode));
    } catch {
      showToast('❌ تعذر تحديث القائمة في السيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle filter master switch
  const handleToggleFilter = async () => {
    const nextVal = !isFilterEnabled;
    setIsSaving(true);
    try {
      await updateSiteSettings({ enableProfanityFilter: nextVal });
      showToast(nextVal ? 'تم تفعيل فلتر الكلمات البذيئة التلقائي بنجاح 🛡️' : 'تم تعطيل فلتر الكلمات البذيئة ⚠️');
    } catch {
      showToast('❌ تعذر تحديث الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  // Change Scope
  const handleChangeScope = async (scope: 'both' | 'public_only' | 'private_only') => {
    setIsSaving(true);
    try {
      await updateSiteSettings({ profanityFilterScope: scope });
      const label = scope === 'both' ? 'الشات العام والخاص معاً' : scope === 'public_only' ? 'الشات العام فقط' : 'الشات الخاص فقط';
      showToast(`تم ضبط نطاق الفلترة: ${label} ✅`);
    } catch {
      showToast('❌ تعذر تحديث النطاق');
    } finally {
      setIsSaving(false);
    }
  };

  // Change Action
  const handleChangeAction = async (action: 'block' | 'mask') => {
    setIsSaving(true);
    try {
      await updateSiteSettings({ profanityFilterAction: action });
      showToast(
        action === 'block'
          ? 'تم تعيين الإجراء: منع نشر الرسالة فوراً وتحذير المستخدم 🚫'
          : 'تم تعيين الإجراء: تمويه الكلمات البذيئة بنجوم **** 🛡️'
      );
    } catch {
      showToast('❌ تعذر تحديث إجراء الفلتر');
    } finally {
      setIsSaving(false);
    }
  };

  // Change Match Mode
  const handleChangeMatchMode = async (mode: 'flexible' | 'exact') => {
    setIsSaving(true);
    try {
      await updateSiteSettings({ profanityMatchMode: mode });
      showToast(
        mode === 'flexible'
          ? 'تم تفعيل الفحص الذكي المرن (تطبيع الحروف والتكرار والمسافات) 🧠'
          : 'تم تفعيل فحص المطابقة التامة للكلمة 🎯'
      );
      setTestResult(filterProfanity(testInput, customBadWords, mode));
    } catch {
      showToast('❌ تعذر تغيير نمط الفحص');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Auto Mute
  const handleToggleAutoMute = async () => {
    const nextVal = !autoMute;
    setIsSaving(true);
    try {
      await updateSiteSettings({ profanityAutoMute: nextVal });
      showToast(nextVal ? 'تم تفعيل الكتم التلقائي لمستخدمي الألفاظ البذيئة 🔇' : 'تم تعطيل الكتم التلقائي للمخالفين');
    } catch {
      showToast('❌ تعذر تحديث خيار الكتم التلقائي');
    } finally {
      setIsSaving(false);
    }
  };

  // Change Mute Duration
  const handleChangeMuteDuration = async (mins: number) => {
    setIsSaving(true);
    try {
      await updateSiteSettings({ profanityMuteDurationMinutes: mins });
      showToast(`تم تحديد مدة الكتم التلقائي: ${mins} دقيقة ⏱️`);
    } catch {
      showToast('❌ تعذر تحديث مدة الكتم');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle Exempt Staff
  const handleToggleExemptStaff = async () => {
    const nextVal = !exemptStaff;
    setIsSaving(true);
    try {
      await updateSiteSettings({ profanityExemptStaff: nextVal });
      showToast(nextVal ? 'تم استثناء الإدارة والمشرفين من الفلترة والكتم 🛡️' : 'تم شمول جميع الرتب بالفلترة');
    } catch {
      showToast('❌ تعذر تحديث استثناء الإدارة');
    } finally {
      setIsSaving(false);
    }
  };

  // Import Presets
  const handleImportPresets = async (type: 'arabic' | 'english' | 'all') => {
    const presetList =
      type === 'arabic'
        ? DEFAULT_ARABIC_PROFANITY_LIST
        : type === 'english'
        ? DEFAULT_ENGLISH_PROFANITY_LIST
        : DEFAULT_ALL_PROFANITY_LIST;

    const currentLower = new Set(customBadWords.map(w => w.toLowerCase()));
    const missing = presetList.filter(p => !currentLower.has(p.toLowerCase()));

    if (missing.length === 0) {
      showToast('جميع كلمات هذه القائمة موجودة بالفعل في الفلتر ✅');
      return;
    }

    const updated = [...missing, ...customBadWords];
    setIsSaving(true);
    try {
      await updateSiteSettings({ customBadWordsList: updated });
      showToast(`تم استيراد ${missing.length} كلمة محظورة جديدة للفلتر بنجاح 🛡️`);
      setTestResult(filterProfanity(testInput, updated, matchMode));
    } catch {
      showToast('❌ تعذر استيراد القائمة');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy list to clipboard
  const handleCopyList = () => {
    if (customBadWords.length === 0) return;
    navigator.clipboard.writeText(customBadWords.join(', '));
    setCopied(true);
    showToast('تم نسخ قائمة الكلمات المحظورة للحافظة 📋');
    setTimeout(() => setCopied(false), 2000);
  };

  // Clear all
  const handleClearAll = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في مسح كافة الكلمات المحظورة المخصصة؟')) return;
    setIsSaving(true);
    try {
      await updateSiteSettings({ customBadWordsList: [] });
      showToast('تم تفريغ قائمة الكلمات المحظورة 🧹');
      setTestResult(filterProfanity(testInput, [], matchMode));
    } catch {
      showToast('❌ تعذر تفريغ القائمة');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 text-right dir-rtl animate-in fade-in duration-150">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50 rounded-2xl border border-rose-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>نظام فلترة الرسائل التلقائي (Profanity & Bad Words Filter)</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  isFilterEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}>
                  {isFilterEnabled ? 'الفلتر نشط ويعمل 🛡️' : 'الفلتر معطل ⚠️'}
                </span>
              </h3>
              <p className="text-[11px] text-slate-600 font-bold">
                حماية شاملة للمحادثات: يمنع نشر الألفاظ البذيئة والشتائم في الشات العام والشات الخاص فوراً مع فرض عقوبات تلقائية.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleToggleFilter}
          disabled={isSaving}
          className={`px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all shadow-xs flex items-center gap-2 shrink-0 ${
            isFilterEnabled
              ? 'bg-rose-600 hover:bg-rose-700 text-white'
              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
          }`}
        >
          {isFilterEnabled ? (
            <>
              <Ban className="w-4 h-4" />
              <span>إيقاف الفلتر مؤقتاً</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>تفعيل الفلتر التلقائي</span>
            </>
          )}
        </button>
      </div>

      {/* 2. Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[10px] text-slate-500 font-bold block mb-1">إجمالي الكلمات المحظورة</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-rose-600">{customBadWords.length}</span>
            <Filter className="w-4 h-4 text-rose-400" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[10px] text-slate-500 font-bold block mb-1">نطاق الفلترة</span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800">
              {filterScope === 'both' ? 'العام والخاص 💬🔒' : filterScope === 'public_only' ? 'العام فقط 📢' : 'الخاص فقط 🔐'}
            </span>
            <MessageSquare className="w-4 h-4 text-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[10px] text-slate-500 font-bold block mb-1">إجراء الرصد</span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800">
              {filterAction === 'block' ? 'منع النشر فوراً 🚫' : 'تمويه بالنجوم **** 🛡️'}
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-3.5 shadow-2xs">
          <span className="text-[10px] text-slate-500 font-bold block mb-1">الكتم التلقائي</span>
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-800">
              {autoMute ? `مفعل (${muteDuration} دقيقة)` : 'معطل'}
            </span>
            <Flame className="w-4 h-4 text-red-500" />
          </div>
        </div>
      </div>

      {/* 3. Settings Control Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
        <h4 className="text-xs font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
          <Settings2 className="w-4 h-4 text-rose-600" />
          <span>إعدادات وخيارات الفلترة المتقدمة</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
          {/* Scope Selector */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="text-[11px] text-slate-700 font-black block">نطاق تطبيق الفلتر:</label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleChangeScope('both')}
                className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterScope === 'both' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                العام والخاص
              </button>
              <button
                type="button"
                onClick={() => handleChangeScope('public_only')}
                className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterScope === 'public_only' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                العام فقط
              </button>
              <button
                type="button"
                onClick={() => handleChangeScope('private_only')}
                className={`py-2 px-1 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterScope === 'private_only' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                الخاص فقط
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              يحدد أين يتم حظر الكلمات البذيئة (الشات العام أو الرسائل الخاصة).
            </p>
          </div>

          {/* Action on detection */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="text-[11px] text-slate-700 font-black block">إجراء الفلتر عند اكتشاف لفظ بذيء:</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleChangeAction('block')}
                className={`py-2 px-2 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterAction === 'block' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🚫 منع النشر نهائياً
              </button>
              <button
                type="button"
                onClick={() => handleChangeAction('mask')}
                className={`py-2 px-2 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  filterAction === 'mask' ? 'bg-rose-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🛡️ استبدال بنجوم ****
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              «منع النشر» يرفض إرسال الرسالة تماماً ويحذر المستخدم. «الاستبدال» ينشر الرسالة بعد تمويه الكلمة.
            </p>
          </div>

          {/* Match Mode */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <label className="text-[11px] text-slate-700 font-black block">طريقة الفحص والمطابقة:</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleChangeMatchMode('flexible')}
                className={`py-2 px-2 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  matchMode === 'flexible' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🧠 فحص ذكي مرن
              </button>
              <button
                type="button"
                onClick={() => handleChangeMatchMode('exact')}
                className={`py-2 px-2 text-center rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  matchMode === 'exact' ? 'bg-amber-600 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🎯 مطابقة تامة فقط
              </button>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
              الفحص الذكي يكشف التهرب (الهمزات، تكرار الأحرف، التشكيل، المسافات والفواصل بين الأحرف).
            </p>
          </div>

          {/* Auto Mute Penalty */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <label className="text-[11px] text-slate-700 font-black">عقوبة الكتم التلقائي (Auto-Mute):</label>
              <button
                type="button"
                onClick={handleToggleAutoMute}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer ${
                  autoMute ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                {autoMute ? 'مفعلة ✅' : 'معطلة'}
              </button>
            </div>
            {autoMute && (
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-600">مدة الكتم:</span>
                {[1, 5, 15, 60].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => handleChangeMuteDuration(mins)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      muteDuration === mins
                        ? 'bg-rose-600 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {mins === 60 ? '1 ساعة' : `${mins} دقيقة`}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 mt-1">
              <span className="text-[10px] text-slate-600">استثناء طاقم الإدارة والمالك:</span>
              <button
                type="button"
                onClick={handleToggleExemptStaff}
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded cursor-pointer ${
                  exemptStaff ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 bg-slate-200'
                }`}
              >
                {exemptStaff ? 'مستثنون 🛡️' : 'مشمولون'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Live Sandbox Tester Tool (مختبر الفحص المباشر) */}
      <div className="bg-gradient-to-r from-amber-50/60 via-white to-rose-50/60 rounded-2xl border border-amber-200 p-4 sm:p-5 space-y-3 shadow-2xs">
        <h4 className="text-xs font-black text-slate-800 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>مختبر فحص الكلمات المباشر (Live Sandbox Tester)</span>
          </span>
          <span className="text-[10px] text-slate-500 font-bold">جرّب الكلمات والعبارات لاختبار فاعلية الفلتر</span>
        </h4>

        <div className="space-y-2">
          <input
            type="text"
            value={testInput}
            onChange={(e) => handleRunTest(e.target.value)}
            placeholder="اكتب أي جملة أو كلمة هنا لتجربة الفلتر عليها فوراً..."
            className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 shadow-2xs"
          />

          <div className="bg-white/80 rounded-xl p-3 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-slate-500 font-bold block">نتيجة الفحص التلقائي:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                  testResult.hasProfanity ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                }`}>
                  {testResult.hasProfanity ? '🚫 تم اكتشاف ألفاظ بذيئة' : '✅ الجملة سليمة ونظيفة'}
                </span>
                {testResult.badWordsFound.length > 0 && (
                  <span className="text-[11px] text-rose-600 font-bold">
                    الكلمات المرصودة: {testResult.badWordsFound.join(', ')}
                  </span>
                )}
              </div>
            </div>

            {testResult.hasProfanity && (
              <div className="text-left bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-bold">
                <span className="text-[10px] text-slate-400 block">نص النتيجة المموّه:</span>
                <span className="text-slate-800">{testResult.cleanText}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 5. Words List Manager */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
              <Filter className="w-4 h-4 text-rose-600" />
              <span>إدارة قائمة الكلمات والعبارات المحظورة</span>
            </h4>
            <p className="text-[10px] text-slate-500 font-bold">
              يمكنك كتابة كلمة واحدة أو عدة كلمات مفصولة بفاصلة (، أو ,) أو سطر جديد للإضافة دفعة واحدة.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleImportPresets('arabic')}
              disabled={isSaving}
              className="text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all"
            >
              + استيراد القائمة العربية
            </button>
            <button
              type="button"
              onClick={() => handleImportPresets('english')}
              disabled={isSaving}
              className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all"
            >
              + استيراد الإنجليزية
            </button>
            <button
              type="button"
              onClick={handleCopyList}
              className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>نسخ القائمة</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={isSaving || customBadWords.length === 0}
              className="text-[10px] font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-2.5 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>تفريغ</span>
            </button>
          </div>
        </div>

        {/* Add Input Form */}
        <form onSubmit={handleAddWord} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="اكتب كلمة أو عبارة لحظرها (مثال: سب1، سب2، كلمة_مسيئة)..."
              value={inputWord}
              onChange={(e) => setInputWord(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-rose-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSaving || !inputWord.trim()}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white text-xs font-black rounded-xl cursor-pointer transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة للفلتر</span>
          </button>
        </form>

        {/* Search & Counter */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="بحث في الكلمات المحظورة..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-400"
            />
          </div>
          <span className="text-[11px] text-slate-500 font-bold">
            عرض {displayedWords.length} من أصل {customBadWords.length} كلمة
          </span>
        </div>

        {/* Words Tags Display */}
        <div className="flex flex-wrap gap-2 pt-2 max-h-72 overflow-y-auto custom-scrollbar p-1">
          {displayedWords.length === 0 ? (
            <div className="w-full text-center py-8 text-slate-400 text-xs font-bold bg-slate-50 rounded-xl border border-dashed border-slate-200">
              لا توجد كلمات مطابقة للبحث أو أن القائمة فارغة حالياً.
            </div>
          ) : (
            displayedWords.map((word, idx) => (
              <div
                key={`${word}-${idx}`}
                className="bg-rose-50/80 border border-rose-200 text-rose-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs hover:bg-rose-100 transition-all group"
              >
                <span>{word}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWord(word)}
                  title={`حذف (${word}) من الفلتر`}
                  className="text-rose-400 hover:text-rose-700 p-0.5 rounded-full hover:bg-rose-200 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
