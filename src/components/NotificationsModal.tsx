import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { X, User, ShieldAlert, Heart, UserCheck, Bell, BellRing, CheckCircle2 } from 'lucide-react';
import { UserAvatar } from './UserAvatar';
import { toEnglishDigits } from '../utils/dateUtils';
import {
  isBrowserNotificationSupported,
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission
} from '../utils/browserNotifications';

export const NotificationsModal: React.FC = () => {
  const {
    notifications, setIsNotificationsOpen, markNotificationsAsRead, deleteNotification,
    currentUser, setNotifications, setActivePrivateUserId, setIsPrivateChatOpen, setCurrentView
  } = useChat();
  const [selectedNotifId, setSelectedNotifId] = useState<string | null>(null);
  const [browserPerm, setBrowserPerm] = useState<NotificationPermission | 'unsupported'>('default');

  useEffect(() => {
    markNotificationsAsRead();
    setBrowserPerm(getBrowserNotificationPermission());
  }, []);

  const handleEnableBrowserNotifications = async () => {
    const granted = await requestBrowserNotificationPermission();
    setBrowserPerm(granted ? 'granted' : getBrowserNotificationPermission());
  };

  const myNotifications = notifications.filter(n => !n.userId || n.userId === currentUser?.id || n.userId === 'all');

  const handleDeleteNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteNotification(id);
    setSelectedNotifId(null);
  };

  const handleItemClick = (notif: any) => {
    if (notif.type === 'private_message' && notif.senderId) {
      setIsNotificationsOpen(false);
      setActivePrivateUserId(notif.senderId);
      setIsPrivateChatOpen(true);
      return;
    }
    if (notif.type === 'mention') {
      setIsNotificationsOpen(false);
      setCurrentView('chat');
      return;
    }
    if (selectedNotifId === notif.id) {
      setSelectedNotifId(null);
    } else {
      setSelectedNotifId(notif.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 dir-rtl font-sans select-none">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
        
        {/* 1. Dark Top Header Bar (#0B252E matching Screenshot 3) */}
        <div className="bg-[#0B252E] px-4 py-3 flex items-center justify-between shrink-0 border-b border-[#081d24]">
          <span className="text-white font-black text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            <span>الإشعارات والتنبيهات</span>
          </span>

          {/* Close (X) button */}
          <button
            onClick={() => setIsNotificationsOpen(false)}
            className="text-white hover:text-slate-300 transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Browser Desktop Notification Quick Permission Banner */}
        {isBrowserNotificationSupported() && browserPerm !== 'granted' && (
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border-b border-sky-200 px-3.5 py-2.5 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-sky-950 font-bold">
              <BellRing className="w-4 h-4 text-[#00aeeF] shrink-0 animate-bounce" />
              <span>تفعيل إشعارات المتصفح للرسائل والمنشن</span>
            </div>
            <button
              onClick={handleEnableBrowserNotifications}
              className="bg-[#00aeeF] hover:bg-[#0096ce] text-white px-3 py-1 rounded-xl font-black text-xs shadow-xs cursor-pointer transition-colors shrink-0"
            >
              تفعيل الآن
            </button>
          </div>
        )}

        {/* 2. Notifications List Content (White Canvas matching Screenshot 3) */}
        <div className="flex-1 overflow-y-auto bg-white custom-scrollbar min-h-[220px]">
          {myNotifications.length === 0 ? (
            <div className="py-16 px-4 text-center text-slate-400 text-sm font-medium">
              لا توجد إشعارات أو إعجابات حالياً
            </div>
          ) : (
            myNotifications.map((notif) => {
              const isSelected = selectedNotifId === notif.id;

              return (
                <div
                  key={notif.id}
                  onClick={() => handleItemClick(notif)}
                  className="relative p-4 border-b border-slate-100 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-start justify-between gap-3"
                >
                  {/* Context Menu Popup with "حذف" (Exact Match to Screenshot 3 Popup) */}
                  {isSelected && (
                    <div className="absolute left-6 bottom-4 z-20 bg-[#d8dfe8] border border-slate-300 rounded-lg shadow-xl px-7 py-2.5 animate-in fade-in zoom-in-95 duration-150">
                      <button
                        onClick={(e) => handleDeleteNotif(notif.id, e)}
                        className="text-slate-800 hover:text-red-600 font-black text-base transition-colors cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  )}

                  {/* Text Details & Avatar Layout matching Screenshot 3 */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Far Right: User Avatar Circle */}
                    <div className="shrink-0 mt-0.5">
                      {notif.senderName === 'System' || notif.type === 'mute' || notif.type === 'kick' || notif.type === 'ban' || notif.type === 'role_change' || notif.type === 'name_change' ? (
                        <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 shadow-xs">
                          <ShieldAlert className="w-6 h-6 text-red-500" />
                        </div>
                      ) : notif.senderAvatar ? (
                        <img
                          src={notif.senderAvatar}
                          alt={notif.senderName || 'user'}
                          className="w-12 h-12 rounded-full object-cover border border-slate-200"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400">
                          <User className="w-7 h-7 stroke-[1.8]" />
                        </div>
                      )}
                    </div>

                    {/* Left side of avatar: Text Stack */}
                    <div className="flex flex-col text-right min-w-0 pr-1">
                      {/* Line 1: Sender Name in Coral / Red-Orange */}
                      <span className={`font-black text-base leading-snug truncate ${
                        notif.senderName === 'System' ? 'text-red-600' : 'text-[#e05244]'
                      }`}>
                        {notif.senderName || notif.title || 'System'}
                      </span>

                      {/* Line 2: Message Text */}
                      <span className="text-slate-700 font-bold text-sm leading-relaxed mt-0.5 break-words">
                        {notif.message}
                      </span>

                      {/* Line 3: Timestamp */}
                      <span className="text-slate-400 font-semibold text-xs mt-1.5 dir-ltr text-right font-sans">
                        {toEnglishDigits(notif.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
