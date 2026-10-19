import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Ban, Plus, Trash2, Search, CheckCircle2, AlertTriangle,
  ShieldAlert, Sparkles, RefreshCw, X, Check, Lock, ShieldCheck
} from 'lucide-react';

interface ForbiddenUsernamesViewProps {
  showToast: (msg: string) => void;
}

const COMMON_RESERVED_PRESETS = [
  'admin', 'administrator', 'system', 'root', 'support', 'owner', 'superadmin',
  'master', 'moderator', 'mod', 'management', 'staff', 'help', 'security',
  'الادمن', 'المالك', 'الدعم', 'مدير الموقع', 'مشرف عام', 'مؤسس', 'بوت', 'bot',
  'إدارة', 'ادارة', 'خدمة_العملاء', 'المشرف', 'المدير', 'مدير_عام', 'شات_اليمن', 'الدعم_الفني'
];

export const ForbiddenUsernamesView: React.FC<ForbiddenUsernamesViewProps> = ({ showToast }) => {
  const { siteSettings, updateSiteSettings } = useChat();

  const [inputWord, setInputWord] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const forbiddenList: string[] = siteSettings?.forbiddenUsernames || [
    'admin', 'administrator', 'system', 'root', 'support', 'owner',
    'الادمن', 'المالك', 'الدعم', 'مدير الموقع', 'مشرف عام', 'مؤسس', 'بوت', 'bot',
    'superadmin', 'إدارة', 'ادارة'
  ];

  const matchMode: 'contains' | 'exact' = siteSettings?.forbiddenNameMatchMode || 'contains';

  // Filtered view
  const displayedWords = forbiddenList.filter(w =>
    !searchTerm.trim() || w.toLowerCase().includes(searchTerm.trim().toLowerCase())
  );

  const handleAddWord = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = inputWord.trim();
    if (!raw) return;

    // Support comma or whitespace separated entries
    const items = raw.split(/[,،\n]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
    if (items.length === 0) return;

    const currentLower = new Set(forbiddenList.map(w => w.toLowerCase()));
    const newItems = items.filter(w => !currentLower.has(w));

    if (newItems.length === 0) {
      showToast('⚠️ الأسماء المدخلة موجودة بالفعل في القائمة المحظورة');
      return;
    }

    const updated = [...newItems, ...forbiddenList];
    setIsSaving(true);
    try {
      await updateSiteSettings({ forbiddenUsernames: updated });
      setInputWord('');
      showToast(`تمت إضافة ${newItems.length} اسم/كلمة لقائمة الحظر والحجز بنجاح ✅`);
    } catch (err) {
      showToast('❌ تعذر حفظ القائمة في السيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveWord = async (wordToRemove: string) => {
    const updated = forbiddenList.filter(w => w.toLowerCase() !== wordToRemove.toLowerCase());
    setIsSaving(true);
    try {
      await updateSiteSettings({ forbiddenUsernames: updated });
      showToast(`تمت إزالة (${wordToRemove}) من قائمة الحظر ✅`);
    } catch (err) {
      showToast('❌ تعذر تحديث القائمة في السيرفر');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleMatchMode = async (mode: 'contains' | 'exact') => {
    if (mode === matchMode) return;
    setIsSaving(true);
    try {
      await updateSiteSettings({ forbiddenNameMatchMode: mode });
      showToast(
        mode === 'contains'
          ? 'تم تفعيل نمط التطابق الجزئي (حظر أي اسم يحتوي على الكلمة) 🛡️'
          : 'تم تفعيل نمط التطابق التام (حظر الاسم المطابق بالضبط فقط) 🎯'
      );
    } catch (err) {
      showToast('❌ تعذر تغيير نمط الفحص');
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyPresets = async () => {
    const currentLower = new Set(forbiddenList.map(w => w.toLowerCase()));
    const missing = COMMON_RESERVED_PRESETS.filter(p => !currentLower.has(p.toLowerCase()));

    if (missing.length === 0) {
      showToast('جميع الكلمات الإدارية الشائعة مضافة بالفعل ✅');
      return;
    }

    const updated = [...missing, ...forbiddenList];
    setIsSaving(true);
    try {
      await updateSiteSettings({ forbiddenUsernames: updated });
      showToast(`تم استيراد ${missing.length} كلمة إدارية شائعة لقائمة الحظر 🛡️`);
    } catch (err) {
      showToast('❌ فشل حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('هل أنت متأكد من رغبتك في تفريغ قائمة الأسماء المحظورة بالكامل؟')) return;
    setIsSaving(true);
    try {
      await updateSiteSettings({ forbiddenUsernames: [] });
      showToast('تم تفريغ قائمة الأسماء المحظورة 🧹');
    } catch (err) {
      showToast('❌ تعذر تفريغ القائمة');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 text-right dir-rtl animate-in fade-in duration-150">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-rose-50 via-white to-amber-50 rounded-2xl border border-rose-200 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-rose-600 text-white shadow-xs">
              <Ban className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-black text-slate-900">
                قائمة أسماء المستخدمين المحظورة والمحجوزة (Forbidden Usernames & Reserved Words)
              </h3>
              <p className="text-[11px] text-slate-600 font-bold">
                حماية السيادة ومنع انتحال الشخصيات: تمنع أي عضو أو زائر من اختيار هذه الكلمات كاسم مستخدم له.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="bg-rose-100 text-rose-900 border border-rose-300 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-rose-600" />
            <span>{forbiddenList.length} اسم محظور</span>
          </span>
          <button
            type="button"
            onClick={handleApplyPresets}
            disabled={isSaving}
            className="bg-slate-900 hover:bg-slate-800 text-amber-300 text-xs font-black px-3 py-1.5 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>استيراد الكلمات الشائعة ⚡</span>
          </button>
        </div>
      </div>

      {/* Match Mode Settings Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span>نمط فحص الكلمات المحظورة (Matching Strategy):</span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            Mode: {matchMode}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleToggleMatchMode('contains')}
            className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-start gap-3 ${
              matchMode === 'contains'
                ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/40'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className={`mt-0.5 p-1 rounded-full ${matchMode === 'contains' ? 'bg-rose-600 text-white' : 'bg-slate-300 text-transparent'}`}>
              <Check className="w-3 h-3" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block mb-0.5">
                تطابق جزئي (Contains Substring) — موصى به 🛡️
              </span>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                يمنع الاسم إذا كان يحتوي على الكلمة المحظورة في أي موضع (مثال: حظر "admin" سيمنع "SuperAdmin" و "admin_123").
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleToggleMatchMode('exact')}
            className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex items-start gap-3 ${
              matchMode === 'exact'
                ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/40'
                : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <div className={`mt-0.5 p-1 rounded-full ${matchMode === 'exact' ? 'bg-amber-600 text-white' : 'bg-slate-300 text-transparent'}`}>
              <Check className="w-3 h-3" />
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block mb-0.5">
                تطابق تام فقط (Exact Match) 🎯
              </span>
              <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                يمنع الاسم فقط إذا كان مطابقاً تماماً للكلمة المحظورة دون سوابق أو لواحق (مثال: حظر "admin" يمنع "admin" فقط).
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* Add New Word Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <h4 className="text-xs font-black text-slate-800">
          إضافة أسماء أو كلمات جديدة إلى قائمة الحظر:
        </h4>

        <form onSubmit={handleAddWord} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={inputWord}
            onChange={(e) => setInputWord(e.target.value)}
            placeholder="اكتب اسماً أو كلمات مفصولة بفواصل (مثال: مدير_العام, المالك_الرئيسي, دعم_فني, vip_bot)..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
          <button
            type="submit"
            disabled={isSaving || !inputWord.trim()}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة للحظر 🚫</span>
          </button>
        </form>
      </div>

      {/* Words List Card with Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800">
              الأسماء المحظورة حالياً في السيرفر:
            </span>
            <span className="text-[10px] font-bold text-slate-500">
              (يتم الفحص تلقائياً عند طلب التغيير ولحظياً أثناء الكتابة)
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
              <input
                type="text"
                placeholder="تصفية في الأسماء المحظورة..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-8 pl-2 py-1.5 text-[11px] font-bold"
              />
            </div>

            {forbiddenList.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                disabled={isSaving}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-800 px-2 py-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              >
                مسح الكل
              </button>
            )}
          </div>
        </div>

        {/* Badges Flow */}
        <div className="flex flex-wrap gap-2 pt-1 max-h-80 overflow-y-auto custom-scrollbar">
          {displayedWords.length > 0 ? (
            displayedWords.map((word, idx) => (
              <div
                key={`${word}-${idx}`}
                className="bg-rose-50/80 border border-rose-200 text-rose-900 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-2xs hover:bg-rose-100 transition-colors"
              >
                <Ban className="w-3 h-3 text-rose-600" />
                <span className="font-mono">{word}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveWord(word)}
                  disabled={isSaving}
                  className="text-rose-400 hover:text-rose-700 p-0.5 rounded-md hover:bg-rose-200/50 cursor-pointer transition-colors"
                  title="إلغاء حظر هذه الكلمة"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : (
            <div className="w-full py-8 text-center text-slate-400 text-xs font-bold">
              {searchTerm ? 'لا توجد كلمات محظورة تطابق البحث' : 'قائمة الأسماء المحظورة فارغة حالياً'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
