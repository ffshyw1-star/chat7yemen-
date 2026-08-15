import React from 'react';
import { useChat } from '../context/ChatContext';
import { ToastNotification } from '../types';
import { UserAvatar } from './UserAvatar';
import { MessageSquare, LogIn, X, Bell, ChevronLeft } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast, setActivePrivateUserId, setIsPrivateChatOpen } = useChat();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none dir-rtl">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-xl p-3.5 flex items-start justify-between gap-3 animate-in slide-in-from-top-3 fade-in duration-200 transition-all text-right cursor-pointer hover:border-[#00aeeF]/50 group relative overflow-hidden`}
          onClick={() => {
            if (toast.type === 'private_message' && toast.senderId) {
              setActivePrivateUserId(toast.senderId);
              setIsPrivateChatOpen(true);
            }
            removeToast(toast.id);
          }}
        >
          {/* Side Color Bar */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-1.5 ${
              toast.type === 'private_message'
                ? 'bg-[#00aeeF]'
                : toast.type === 'user_join'
                ? 'bg-emerald-500'
                : 'bg-amber-500'
            }`}
          />

          {/* Avatar or Icon */}
          <div className="shrink-0 mr-1.5 pt-0.5">
            {toast.avatar || toast.senderName ? (
              <UserAvatar
                avatarUrl={toast.avatar}
                gender={toast.gender || 'male'}
                role={toast.role || 'member'}
                username={toast.senderName || 'مستخدم'}
                size="md"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-sky-50 text-[#00aeeF] flex items-center justify-center">
                {toast.type === 'private_message' ? (
                  <MessageSquare className="w-5 h-5" />
                ) : toast.type === 'user_join' ? (
                  <LogIn className="w-5 h-5 text-emerald-600" />
                ) : (
                  <Bell className="w-5 h-5 text-amber-500" />
                )}
              </div>
            )}
          </div>

          {/* Message Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <span className="text-xs font-black text-slate-800 truncate flex items-center gap-1.5">
                {toast.type === 'private_message' && (
                  <span className="bg-sky-100 text-[#0284c7] text-[10px] px-1.5 py-0.2 rounded font-bold">خاص</span>
                )}
                {toast.type === 'user_join' && (
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] px-1.5 py-0.2 rounded font-bold">انضمام</span>
                )}
                {toast.title}
              </span>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">{toast.timestamp}</span>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
              {toast.message}
            </p>

            {toast.type === 'private_message' && (
              <div className="mt-1.5 text-[11px] font-bold text-[#00aeeF] flex items-center gap-1 group-hover:translate-x-[-2px] transition-transform">
                <span>انقر بالضغط للرد المباشر</span>
                <ChevronLeft className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors shrink-0"
            title="إغلاق"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
