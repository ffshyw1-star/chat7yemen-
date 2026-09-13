import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Calendar, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  History, 
  ShieldAlert, 
  Crown,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { User, MembershipHistoryItem } from '../types';
import { getRankTitle, getRankColor, getRankEmoji } from '../utils/roleBadges';
import { getMembershipHistoryFromFirestore } from '../lib/firebase';

interface UserMembershipStatusCardProps {
  user: User;
  showFullDetails?: boolean;
  onUpgradeClick?: () => void;
}

export const UserMembershipStatusCard: React.FC<UserMembershipStatusCardProps> = ({
  user,
  showFullDetails = false,
  onUpgradeClick
}) => {
  const [history, setHistory] = useState<MembershipHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistorySection, setShowHistorySection] = useState(false);

  const membership = user.membership;
  const isPrimary = Boolean(user.isPrimaryOwner || user.id === 'user-owner' || user.email === 'alzymasd9@gmail.com');
  const isOwner = isPrimary || user.role === 'owner' || (user as any).is_super_admin;
  const isPermanent = isOwner || Boolean(membership?.permanent);
  const now = Date.now();


  const isExpired = !isPermanent && membership?.expiresAt ? now >= membership.expiresAt : false;
  const isActive = isPermanent || (membership?.status === 'active' && !isExpired);

  // Calculate remaining days and percentage
  let remainingDays = 0;
  let remainingHours = 0;
  let progressPercent = 100;

  if (isPermanent) {
    remainingDays = 999;
    progressPercent = 100;
  } else if (membership?.expiresAt && membership.startAt) {
    const totalDuration = Math.max(1, membership.expiresAt - membership.startAt);
    const elapsed = Math.max(0, now - membership.startAt);
    const timeLeft = Math.max(0, membership.expiresAt - now);
    
    remainingDays = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60 * 24)));
    remainingHours = Math.max(0, Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    progressPercent = Math.min(100, Math.max(0, Math.round(((totalDuration - elapsed) / totalDuration) * 100)));
  }

  // Load audit history from Firestore sub-collection
  useEffect(() => {
    if (user.id && (showFullDetails || showHistorySection)) {
      setLoadingHistory(true);
      getMembershipHistoryFromFirestore(user.id)
        .then((items) => {
          if (items && items.length > 0) {
            setHistory(items);
          } else if (user.membershipHistory && user.membershipHistory.length > 0) {
            setHistory(user.membershipHistory);
          }
        })
        .catch(() => {
          if (user.membershipHistory) {
            setHistory(user.membershipHistory);
          }
        })
        .finally(() => setLoadingHistory(false));
    }
  }, [user.id, showFullDetails, showHistorySection, user.membershipHistory]);

  const effectiveRole = isOwner ? 'owner' : (isActive ? (membership?.rank || user.role) : 'member');
  const rankTitle = getRankTitle(effectiveRole);
  const rankEmoji = getRankEmoji(effectiveRole as any);
  const rankColor = getRankColor(effectiveRole);

  const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return 'غير محدد';
    try {
      const d = new Date(timestamp);
      return d.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return new Date(timestamp).toLocaleDateString('en-GB');
    }
  };

  const formatAssignedBy = (assignedBy?: string) => {
    switch (assignedBy) {
      case 'owner':
        return 'مالك الموقع';
      case 'admin':
        return 'إدارة الموقع';
      case 'store':
        return 'شراء من المتجر';
      case 'system':
        return 'النظام الآلي';
      default:
        return assignedBy || 'الإدارة';
    }
  };

  return (
    <div
      id="user-membership-status-card"
      className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden p-4 sm:p-5 transition-all dir-rtl"
    >
      {/* Top Header: Current Rank & Status Badge */}
      <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
            style={{ backgroundColor: `${rankColor}15`, color: rankColor }}
          >
            {isOwner ? <Crown className="w-5 h-5" /> : <Award className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-500">الرتبة الحالية:</span>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-1">
                <span>{rankTitle}</span>
                {rankEmoji && <span className="text-sm">{rankEmoji}</span>}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {isPrimary ? 'صاحب الموقع الأساسي — رتبة سيادية محمية بشكل دائم ومطلق' : isOwner ? 'صاحب صلاحيات المالك' : 'عضوية موثقة ومعتمدة في النظام'}
            </span>
          </div>
        </div>

        {/* Status Indicator (فعالة / منتهية) */}
        <div>
          {isPrimary ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-900 border border-amber-300 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>محمية بشكل دائم ومطلق 👑</span>
            </span>
          ) : isPermanent ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-purple-50 text-purple-700 border border-purple-200/80 shadow-2xs">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>دائمة ♾️</span>
            </span>
          ) : isActive ? (

            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>فعالة</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>منتهية</span>
            </span>
          )}
        </div>
      </div>

      {/* Expiry and Remaining Days Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3.5">
        {/* Box 1: Remaining Days */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-slate-400 block">الأيام المتبقية</span>
            <div className="text-sm sm:text-base font-extrabold text-slate-800 truncate">
              {isPermanent ? (
                <span className="text-purple-700">غير محدودة (مدى الحياة)</span>
              ) : isActive ? (
                <span>
                  {remainingDays} يوم <span className="text-xs font-medium text-slate-500">({remainingHours} ساعة)</span>
                </span>
              ) : (
                <span className="text-rose-600">0 يوم (انتهت الصلاحية)</span>
              )}
            </div>
          </div>
        </div>

        {/* Box 2: Expiration Date */}
        <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-bold text-slate-400 block">تاريخ الانتهاء</span>
            <div className="text-xs sm:text-sm font-bold text-slate-800 truncate">
              {isPermanent ? (
                <span className="text-purple-700">لا يوجد انتهاء (دائمة)</span>
              ) : membership?.expiresAt ? (
                <span className={isExpired ? 'text-rose-600 line-through' : 'text-slate-800'}>
                  {formatDate(membership.expiresAt)}
                </span>
              ) : (
                <span className="text-slate-400">غير محدد</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar for Duration (if temporary and active) */}
      {!isPermanent && membership?.expiresAt && (
        <div className="my-3 space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500">
            <span>المدة المستهلكة من الاشتراك</span>
            <span className="font-mono font-bold text-slate-700">{100 - progressPercent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isActive ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-rose-400'
              }`}
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>
        </div>
      )}

      {/* Notice box if expired */}
      {isExpired && (
        <div className="p-3 bg-amber-50/80 border border-amber-200/70 rounded-xl text-amber-900 text-xs font-semibold flex items-start gap-2 my-2">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span>انتهت فترة عضويتك السابقة، وتم تحويل حسابك تلقائياً إلى رتبة [عضو مسجل]. يمكنك تجديد عضويتك أو الترقية من المتجر الإلكتروني أو التواصل مع الإدارة.</span>
          </div>
        </div>
      )}

      {/* Detailed Meta (Assigned by, Start date) */}
      <div className="pt-2 text-xs text-slate-500 space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">تاريخ بدء العضوية:</span>
          <span className="font-semibold text-slate-700">
            {formatDate(membership?.startAt || (user as any).joinedTimestamp || Date.now())}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-slate-400">جهة المنح والاعتماد:</span>
          <span className="font-semibold text-slate-700">
            {formatAssignedBy(membership?.assignedBy)}
          </span>
        </div>
        {membership?.notes && (
          <div className="flex items-center justify-between">
            <span className="text-slate-400">ملاحظات:</span>
            <span className="font-semibold text-slate-700">{membership.notes}</span>
          </div>
        )}
      </div>

      {/* Historical Audit Sub-collection Toggle */}
      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          type="button"
          onClick={() => setShowHistorySection(!showHistorySection)}
          className="w-full flex items-center justify-between text-xs font-black text-slate-700 hover:text-slate-900 transition-colors py-1 cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <History className="w-4 h-4 text-slate-500" />
            <span>سجل تغييرات الرتب والعضويات التاريخية (Audit Log)</span>
          </span>
          {showHistorySection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showHistorySection && (
          <div className="mt-3 space-y-2 animate-in fade-in duration-200">
            {loadingHistory ? (
              <div className="text-center py-4 text-xs text-slate-400">
                جاري تحميل سجل العضويات...
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-3 px-2 bg-slate-50 rounded-xl text-xs text-slate-400 border border-slate-100">
                لا توجد سجلات تاريخية مسجلة بعد لهذا الحساب.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                {history.map((item, idx) => {
                  const itemRankTitle = getRankTitle(item.rank);
                  const isItemActive = item.status === 'active';
                  return (
                    <div
                      key={item.id || idx}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isItemActive ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <div>
                          <div className="font-bold text-slate-800 flex items-center gap-1">
                            <span>{itemRankTitle}</span>
                            {item.permanent && <span className="text-[10px] text-purple-600 font-bold">(دائمة)</span>}
                          </div>
                          <span className="text-[10px] text-slate-400">
                            بواسطة: {formatAssignedBy(item.assignedBy)}
                          </span>
                        </div>
                      </div>

                      <div className="text-left text-[10px] text-slate-400 font-mono dir-ltr">
                        {formatDate(item.startAt)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
