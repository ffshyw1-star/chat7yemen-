import React from 'react';
import { useChat } from '../context/ChatContext';
import { Ban, Unlock, ShieldAlert, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

export const BlockConfirmModal: React.FC = () => {
  const { blockConfirmState, closeBlockConfirm } = useChat();

  if (!blockConfirmState.isOpen || !blockConfirmState.targetUser) return null;

  const { targetUser, actionType, onConfirm } = blockConfirmState;

  const isBlockOrBan = actionType === 'block' || actionType === 'ban';
  const isBanAction = actionType === 'ban' || actionType === 'unban';

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    closeBlockConfirm();
  };

  const getTitle = () => {
    switch (actionType) {
      case 'block':
        return 'تأكيد حظر العضو 🚫';
      case 'unblock':
        return 'تأكيد فك الحظر 🔓';
      case 'ban':
        return 'تأكيد الحظر النهائي من الشات 🚫';
      case 'unban':
        return 'تأكيد رفع الحظر النهائي 🔓';
    }
  };

  const getMessage = () => {
    switch (actionType) {
      case 'block':
        return `هل أنت متأكد من رغبتك في حظر وتجاهل «${targetUser.username}»؟`;
      case 'unblock':
        return `هل تريد بالتأكيد إلغاء حظر «${targetUser.username}»؟`;
      case 'ban':
        return `تحذير: هل أنت متأكد من حظر حساب وجهاز «${targetUser.username}» نهائياً؟`;
      case 'unban':
        return `هل تريد رفع الحظر والسماح لـ «${targetUser.username}» بالدخول للشات مجدداً؟`;
    }
  };

  const getDetails = () => {
    switch (actionType) {
      case 'block':
        return 'عند الحظر، لن تظهر رسائل هذا العضو في الدردشة العامة، ولن يتمكن من إرسال رسائل خاصة لك أو التفاعل معك.';
      case 'unblock':
        return 'سيتمكن العضو من رؤية رسائلك والتواصل معك في الخاص وتبادل الرسائل بشكل طبيعي.';
      case 'ban':
        return 'سيتم طرد العضو فوراً من جميع الغرف ومنع جهازه وحسابه من الدخول إلى الموقع نهائياً.';
      case 'unban':
        return 'سيتم مسح الحظر وتمكين العضو من تسجيل الدخول والمشاركة في المحادثات مجدداً.';
    }
  };

  const getConfirmButtonText = () => {
    switch (actionType) {
      case 'block':
        return 'نعم، حظر وتجاهل 🚫';
      case 'unblock':
        return 'نعم، فك الحظر 🔓';
      case 'ban':
        return 'نعم، حظر نهائي 🚫';
      case 'unban':
        return 'نعم، رفع الحظر 🔓';
    }
  };

  return (
    <div
      onClick={closeBlockConfirm}
      className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 dir-rtl select-none font-sans"
      dir="rtl"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-center transform transition-all border border-slate-200 animate-in zoom-in-95 duration-150"
      >
        {/* Top Header Bar */}
        <div className={`px-4 py-3 flex items-center justify-between text-white ${
          isBlockOrBan ? 'bg-[#0b252e]' : 'bg-[#064e3b]'
        }`}>
          <div className="flex items-center gap-2 font-black text-sm">
            {isBlockOrBan ? (
              <ShieldAlert className="w-5 h-5 text-red-400" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            )}
            <span>{getTitle()}</span>
          </div>

          <button
            onClick={closeBlockConfirm}
            className="text-white hover:text-slate-300 transition-colors p-1 cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col items-center">
          {/* Action Icon / Avatar Center */}
          <div className="relative mb-4 flex items-center justify-center">
            <div className={`p-3 rounded-full border-4 shadow-md ${
              isBlockOrBan
                ? 'bg-red-50 border-red-200 text-red-500'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}>
              {isBlockOrBan ? (
                <Ban className="w-12 h-12 stroke-[2.2]" />
              ) : (
                <Unlock className="w-12 h-12 stroke-[2.2]" />
              )}
            </div>

            {/* Target Avatar overlay badge */}
            <div className="absolute -bottom-2 -left-2 bg-white rounded-full p-0.5 border-2 border-slate-200 shadow-sm">
              <UserAvatar
                avatarUrl={targetUser.avatar}
                gender={targetUser.gender}
                role={targetUser.role}
                username={targetUser.username}
                size="sm"
              />
            </div>
          </div>

          {/* Target Username */}
          <div className="mb-2">
            <span className="font-black text-lg text-slate-900 block">
              {targetUser.username}
            </span>
          </div>

          {/* Question / Confirmation Prompt */}
          <h4 className="text-sm font-extrabold text-slate-800 mb-2 leading-relaxed px-2">
            {getMessage()}
          </h4>

          {/* Details / Warning Box */}
          <div className={`w-full p-3 rounded-xl text-xs font-semibold leading-relaxed mb-6 text-right border ${
            isBlockOrBan
              ? 'bg-amber-50/90 text-amber-900 border-amber-200'
              : 'bg-emerald-50/90 text-emerald-900 border-emerald-200'
          }`}>
            <div className="flex items-start gap-2">
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                isBlockOrBan ? 'text-amber-600' : 'text-emerald-600'
              }`} />
              <p className="flex-1">{getDetails()}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 w-full">
            {/* Confirm Button */}
            <button
              onClick={handleConfirm}
              className={`w-full font-black text-sm py-2.5 px-3 rounded-xl shadow-md transition-all cursor-pointer active:scale-95 text-center flex items-center justify-center gap-1.5 ${
                isBlockOrBan
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <span>{getConfirmButtonText()}</span>
            </button>

            {/* Cancel Button */}
            <button
              onClick={closeBlockConfirm}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm py-2.5 px-3 rounded-xl transition-all cursor-pointer active:scale-95 text-center border border-slate-300"
            >
              تراجع وإلغاء
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
