import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import {
  X, Check, AlertCircle, Loader2, Sparkles, User, ShieldAlert, CheckCircle2
} from 'lucide-react';

interface ChangeUsernameModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: { id: string; username: string; role?: string } | null;
  onSuccess?: (newUsername: string) => void;
}

export const ChangeUsernameModal: React.FC<ChangeUsernameModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  onSuccess
}) => {
  const {
    currentUser,
    users,
    setCurrentUser,
    setUsers,
    showTopBanner,
    siteSettings,
    currentUserCan
  } = useChat();

  const effectiveTarget = targetUser || currentUser;
  const isSelf = currentUser && effectiveTarget && currentUser.id === effectiveTarget.id;

  const [newUsername, setNewUsername] = useState<string>('');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [checkStatus, setCheckStatus] = useState<'idle' | 'available' | 'taken' | 'invalid' | 'forbidden'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewUsername('');
      setCheckStatus('idle');
      setStatusMessage('');
      setIsChecking(false);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // Check username availability against backend API
  const performCheck = useCallback(async (nameToCheck: string) => {
    const trimmed = nameToCheck.trim();
    if (!trimmed) {
      setCheckStatus('idle');
      setStatusMessage('');
      return;
    }

    if (trimmed.length < 2) {
      setCheckStatus('invalid');
      setStatusMessage('يجب أن يتكون الاسم من حرفين على الأقل');
      return;
    }

    const maxLen = siteSettings?.maxUsernameLength || 20;
    if (trimmed.length > maxLen) {
      setCheckStatus('invalid');
      setStatusMessage(`أقصى طول مسموح به للاسم هو ${maxLen} حرفاً`);
      return;
    }

    if (effectiveTarget && trimmed === effectiveTarget.username) {
      setCheckStatus('invalid');
      setStatusMessage('هذا هو اسم المستخدم الحالي بالفعل');
      return;
    }

    // Client-side quick filter
    const existsLocally = users.some(
      u => u.id !== effectiveTarget?.id && u.username.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (existsLocally) {
      setCheckStatus('taken');
      setStatusMessage('هذا الاسم مستخدم بالفعل لعضو آخر');
      return;
    }

    // Instant check against forbidden usernames / reserved words
    const forbiddenWords = [
      ...(siteSettings?.forbiddenUsernames || []),
      'admin', 'administrator', 'system', 'root', 'support', 'owner',
      'الادمن', 'المالك', 'الدعم', 'مدير', 'مشرف عام', 'مؤسس', 'بوت', 'bot'
    ];
    const matchMode = siteSettings?.forbiddenNameMatchMode || 'contains';
    const isOwner = currentUser?.role === 'owner' || (currentUser as any)?.isPrimaryOwner;

    if (!isOwner) {
      for (const bw of forbiddenWords) {
        if (!bw || !bw.trim()) continue;
        const cleanBw = bw.trim().toLowerCase();
        const lowerTrimmed = trimmed.toLowerCase();
        const isMatched = matchMode === 'exact'
          ? lowerTrimmed === cleanBw
          : lowerTrimmed.includes(cleanBw);

        if (isMatched) {
          setCheckStatus('forbidden');
          setStatusMessage(`🚫 الاسم "${trimmed}" محظور أو محجوز للإدارة بقرار المالك (${bw})`);
          return;
        }
      }
    }

    setIsChecking(true);
    setStatusMessage('جاري التحقق من السيرفر...');

    try {
      const res = await fetch('/api/users/check-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newUsername: trimmed,
          targetUserId: effectiveTarget?.id,
          requesterId: currentUser?.id
        })
      });

      const data = await res.json();
      if (res.ok && data.available) {
        setCheckStatus('available');
        setStatusMessage(data.message || 'الاسم متاح ويمكنك استخدامه ✅');
      } else {
        if (res.status === 403) {
          setCheckStatus('forbidden');
          setStatusMessage(data.error || 'ميزة تغيير الاسم معطلة حالياً من قِبل إدارة الموقع 🚫');
        } else {
          setCheckStatus('taken');
          setStatusMessage(data.error || 'الاسم غير متاح أو مستخدم بالفعل');
        }
      }
    } catch (err: any) {
      console.warn('Username check network error:', err);
      // Fallback: if server check network error, assume available if passed local check
      setCheckStatus('available');
      setStatusMessage('الاسم متاح محلياً');
    } finally {
      setIsChecking(false);
    }
  }, [effectiveTarget, users, currentUser, siteSettings]);

  // Handle typing with debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setNewUsername(val);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      performCheck(val);
    }, 450);
  };

  // Submit username change to server
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newUsername.trim();
    if (!cleanName || !effectiveTarget || !currentUser) return;

    if (checkStatus === 'taken' || checkStatus === 'forbidden' || checkStatus === 'invalid') {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/users/change-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: effectiveTarget.id,
          newUsername: cleanName,
          requesterId: currentUser.id
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setCheckStatus('forbidden');
        setStatusMessage(data.error || 'فشل تحديث الاسم في السيرفر');
        showTopBanner(`❌ ${data.error || 'فشل تغيير الاسم'}`);
        return;
      }

      // Update local state instantly
      const updatedUser = data.user;
      if (isSelf && updatedUser) {
        setCurrentUser(prev => prev ? { ...prev, username: cleanName } : null);
      }
      setUsers(prev => prev.map(u => u.id === effectiveTarget.id ? { ...u, username: cleanName } : u));

      showTopBanner(`✨ تم تغيير اسم المستخدم إلى (${cleanName}) بنجاح`);
      if (onSuccess) onSuccess(cleanName);
      onClose();
    } catch (err: any) {
      console.error('Failed to change username:', err);
      showTopBanner(`❌ حدث خطأ في الاتصال: ${err?.message || 'يرجى المحاولة مجدداً'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !effectiveTarget) return null;

  // Check if changing username is currently forbidden
  const isGloballyDisabled = siteSettings?.allowChangeUsernameForMembers === false || siteSettings?.disableUsernameChangeAll === true;
  const isForbiddenForUser = isSelf && !currentUserCan('change_username');

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[150] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 dir-rtl font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-slate-200 text-right animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="bg-[#0b333e] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black">
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">تغيير اسم المستخدم</h3>
              <p className="text-[11px] text-slate-300">التحقق من توفر الاسم وصلاحية الاستخدام</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Current Name Card */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <User className="w-4 h-4 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">اسم المستخدم الحالي</span>
                <span className="text-xs font-black text-slate-800">{effectiveTarget.username}</span>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded-lg">
              {effectiveTarget.role || 'عضو'}
            </span>
          </div>

          {/* If disabled by Owner */}
          {isForbiddenForUser || (isGloballyDisabled && !currentUser?.role?.includes('owner')) ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2 text-right">
              <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>ميزة تغيير اسم المستخدم معطلة حالياً 🚫</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed font-bold">
                قام المالك الرئيسي بتعطيل إمكانية تغيير الاسم المستعار للأعضاء في إعدادات الموقع. لا يمكنك تعديل الاسم حالياً.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-700 mb-1.5">
                  اسم المستخدم الجديد المطلوب:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={handleInputChange}
                    placeholder="اكتب الاسم الجديد هنا..."
                    maxLength={siteSettings?.maxUsernameLength || 20}
                    className={`w-full bg-[#f8fafc] border rounded-2xl p-3 text-xs font-black text-slate-900 focus:outline-none transition-all pl-10 ${
                      checkStatus === 'available'
                        ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-400 bg-emerald-50/20'
                        : checkStatus === 'taken' || checkStatus === 'forbidden' || checkStatus === 'invalid'
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-400 bg-rose-50/20'
                        : 'border-slate-200 focus:ring-2 focus:ring-[#0b333e]'
                    }`}
                  />
                  <div className="absolute left-3 top-3 flex items-center">
                    {isChecking ? (
                      <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                    ) : checkStatus === 'available' ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : checkStatus === 'taken' || checkStatus === 'forbidden' || checkStatus === 'invalid' ? (
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center justify-between mt-1.5 text-[11px] px-1">
                  <span
                    className={`font-bold transition-colors ${
                      checkStatus === 'available'
                        ? 'text-emerald-600'
                        : checkStatus === 'taken' || checkStatus === 'forbidden' || checkStatus === 'invalid'
                        ? 'text-rose-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {statusMessage || 'اكتب اسماً فريداً للتحقق من توفره في السيرفر'}
                  </span>
                  <span className="text-slate-400 font-mono text-[10px]">
                    {newUsername.trim().length} / {siteSettings?.maxUsernameLength || 20}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  disabled={
                    isSubmitting ||
                    isChecking ||
                    !newUsername.trim() ||
                    checkStatus === 'taken' ||
                    checkStatus === 'forbidden' ||
                    checkStatus === 'invalid'
                  }
                  className="flex-1 bg-[#0099c8] hover:bg-[#0088b3] text-white py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري الحفظ والتحديث...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>تأكيد وحفظ الاسم الجديد</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs cursor-pointer transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
