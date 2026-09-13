import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import {
  Users,
  Home,
  Settings,
  Bell,
  User,
  Moon,
  Sun,
  Menu,
  FileText,
  Volume2,
  Play,
  CheckCircle,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { t } from '../utils/translations';
import { isStaff } from '../utils/permissions';

export const BottomNav: React.FC = () => {
  const {
    currentUser,
    currentRoom,
    users,
    rooms,
    notifications,
    unreadPrivateCount,
    isOnlineListOpen,
    setIsOnlineListOpen,
    isRoomsListOpen,
    setIsRoomsListOpen,
    isProfileSettingsOpen,
    setIsProfileSettingsOpen,
    setIsNotificationsOpen,
    setIsRoomLogsOpen,
    setIsSideMenuOpen,
    setIsOwnerDashboardOpen,
    themeMode,
    setThemeMode,
    isRadioPlaying,
    setIsRadioModalOpen
  } = useChat();

  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Close options menu on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target as Node)) {
        setIsOptionsMenuOpen(false);
      }
    };
    if (isOptionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOptionsMenuOpen]);

  if (!currentUser) return null;

  // Filter real active users in current room
  const currentRoomOnlineUsers = users.filter(u => {
    if (u.isBanned) return false;
    if (u.role === 'owner' && u.isStealth && currentUser?.role !== 'owner') return false;
    if (u.onlineStatus === 'offline') return false;
    return (u.currentRoomId || 'room-general') === currentRoom.id;
  });

  // Unread notifications count for current user
  const unreadNotifsCount = notifications.filter(
    n => !n.isRead && (n.userId === currentUser.id || !n.userId)
  ).length;
  const totalUnreadAlerts = unreadNotifsCount + (unreadPrivateCount || 0);

  const isUserStaff = isStaff(currentUser.role);

  return (
    <footer
      id="main-bottom-navigation"
      className="w-full shrink-0 bg-slate-950/95 backdrop-blur-md text-white border-t border-slate-800 select-none shadow-2xl h-[58px] min-h-[58px] flex flex-col justify-center pb-[env(safe-area-inset-bottom,0px)] dir-rtl z-30"
    >
      <div className="max-w-2xl mx-auto w-full px-2 sm:px-4 flex items-center justify-around h-full">
        
        {/* 1. 👥 المتواجدون (People) - Right in RTL */}
        <button
          id="bottom-nav-people-btn"
          type="button"
          onClick={() => {
            setIsOnlineListOpen(!isOnlineListOpen);
            setIsRoomsListOpen(false);
            setIsOptionsMenuOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center h-full py-1 min-h-[55px] cursor-pointer transition-all active:scale-95 group relative ${
            isOnlineListOpen
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-100 font-medium'
          }`}
          title={`المتواجدون في الغرفة (${currentRoomOnlineUsers.length})`}
        >
          <div className="relative flex items-center justify-center">
            <Users
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                isOnlineListOpen ? 'text-amber-400 stroke-[2.4]' : 'text-slate-400 group-hover:text-amber-400'
              }`}
            />
            {/* Small pill badge with online count matching screenshot requirement (👥 24) */}
            <span className="absolute -top-1.5 -right-3 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.2 rounded-full min-w-[18px] text-center shadow-xs">
              {currentRoomOnlineUsers.length}
            </span>
          </div>
          <span className="text-[11px] mt-1 tracking-tight">
            {t('nav.online', 'المتواجدون')}
          </span>
          {isOnlineListOpen && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-amber-400 rounded-full animate-in fade-in duration-150" />
          )}
        </button>

        {/* Divider */}
        <div className="w-[1px] h-6 bg-slate-800/80 shrink-0" />

        {/* 2. 🏠 الغرف (Rooms) - Center in RTL */}
        <button
          id="bottom-nav-rooms-btn"
          type="button"
          onClick={() => {
            setIsRoomsListOpen(!isRoomsListOpen);
            setIsOnlineListOpen(false);
            setIsOptionsMenuOpen(false);
          }}
          className={`flex-1 flex flex-col items-center justify-center h-full py-1 min-h-[55px] cursor-pointer transition-all active:scale-95 group relative ${
            isRoomsListOpen
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-100 font-medium'
          }`}
          title={`الغرف المتاحة (${rooms?.length || 1}) - الغرفة الحالية: ${currentRoom.name}`}
        >
          <div className="relative flex items-center justify-center">
            <Home
              className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                isRoomsListOpen ? 'text-amber-400 stroke-[2.4]' : 'text-slate-400 group-hover:text-amber-400'
              }`}
            />
            {/* Rooms counter badge */}
            <span className="absolute -top-1.5 -right-3 bg-slate-800 text-slate-300 text-[10px] font-bold px-1.5 py-0.2 rounded-full min-w-[16px] text-center border border-slate-700">
              {rooms?.length || 1}
            </span>
          </div>
          <span className="text-[11px] mt-1 tracking-tight">
            {t('nav.rooms', 'الغرف')}
          </span>
          {isRoomsListOpen && (
            <span className="absolute bottom-0 w-8 h-0.5 bg-amber-400 rounded-full animate-in fade-in duration-150" />
          )}
        </button>

        {/* Divider */}
        <div className="w-[1px] h-6 bg-slate-800/80 shrink-0" />

        {/* 3. ⚙️ الخيارات (Options) - Left in RTL */}
        <div className="flex-1 relative flex items-center justify-center h-full" ref={optionsMenuRef}>
          <button
            id="bottom-nav-options-btn"
            type="button"
            onClick={() => {
              setIsOptionsMenuOpen(prev => !prev);
              setIsOnlineListOpen(false);
              setIsRoomsListOpen(false);
            }}
            className={`w-full flex flex-col items-center justify-center h-full py-1 min-h-[55px] cursor-pointer transition-all active:scale-95 group relative ${
              isOptionsMenuOpen || isProfileSettingsOpen
                ? 'text-amber-400 font-bold'
                : 'text-slate-400 hover:text-slate-100 font-medium'
            }`}
            title="الإعدادات والخيارات العامة"
          >
            <div className="relative flex items-center justify-center">
              <Settings
                className={`w-5 h-5 transition-transform group-hover:rotate-45 duration-200 ${
                  isOptionsMenuOpen || isProfileSettingsOpen
                    ? 'text-amber-400 stroke-[2.4]'
                    : 'text-slate-400 group-hover:text-amber-400'
                }`}
              />
              {/* Notification Red Badge if there are unread alerts */}
              {totalUnreadAlerts > 0 && (
                <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-[16px] text-center shadow-md animate-pulse">
                  {totalUnreadAlerts > 9 ? '9+' : totalUnreadAlerts}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-1 tracking-tight">
              {t('nav.options', 'الخيارات')}
            </span>
            {(isOptionsMenuOpen || isProfileSettingsOpen) && (
              <span className="absolute bottom-0 w-8 h-0.5 bg-amber-400 rounded-full animate-in fade-in duration-150" />
            )}
          </button>

          {/* Floating Options Menu Popover */}
          {isOptionsMenuOpen && (
            <div
              id="bottom-nav-options-popup"
              className="absolute bottom-full mb-2 left-0 sm:left-auto right-0 sm:right-auto sm:w-64 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-2 z-50 text-slate-200 animate-in fade-in slide-in-from-bottom-3 duration-150"
            >
              <div className="px-3 py-2 border-b border-slate-800 text-xs font-bold text-slate-400 flex items-center justify-between">
                <span>⚙️ الخيارات والإعدادات</span>
                <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  {currentUser.username}
                </span>
              </div>

              <div className="py-1 space-y-1">
                {/* 1. Profile Settings */}
                <button
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    setIsProfileSettingsOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-right"
                >
                  <User className="w-4 h-4 text-sky-400 shrink-0" />
                  <div className="flex-1">
                    <span>إعدادات الحساب والملف الشخصي</span>
                  </div>
                </button>

                {/* 2. Notifications & Alerts */}
                <button
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    setIsNotificationsOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-right"
                >
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>الإشعارات والتنبيهات</span>
                  </div>
                  {totalUnreadAlerts > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {totalUnreadAlerts}
                    </span>
                  )}
                </button>

                {/* 3. Room Logs */}
                <button
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    setIsRoomLogsOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-right"
                >
                  <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>سجل أحداث الغرفة</span>
                </button>

                {/* 4. Staff / Admin Dashboard if Staff */}
                {isUserStaff && (
                  <button
                    onClick={() => {
                      setIsOptionsMenuOpen(false);
                      setIsOwnerDashboardOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-colors cursor-pointer text-right border border-amber-500/20"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>لوحة إدارة الموقع والمشرفين</span>
                  </button>
                )}

                {/* 5. Theme Toggle */}
                <button
                  onClick={() => {
                    const newMode = themeMode === 'dark' ? 'light' : 'dark';
                    setThemeMode(newMode);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-right"
                >
                  <div className="flex items-center gap-2.5">
                    {themeMode === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-300 shrink-0" />
                    ) : (
                      <Moon className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                    <span>المظهر: {themeMode === 'dark' ? 'الوضع الليلي' : 'الوضع النهاري'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    تبديل
                  </span>
                </button>

                {/* 6. Radio Station Audio Toggle */}
                <button
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    setIsRadioModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl hover:bg-slate-800 hover:text-white transition-colors cursor-pointer text-right"
                >
                  <div className="flex items-center gap-2.5">
                    {isRadioPlaying ? (
                      <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                    ) : (
                      <Radio className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span>إذاعة الراديو والبث الحي</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {isRadioPlaying && (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                    )}
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      isRadioPlaying ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                    }`}>
                      {isRadioPlaying ? 'يعمل الآن' : 'استماع'}
                    </span>
                  </div>
                </button>

                <div className="my-1 border-t border-slate-800" />

                {/* 7. Full Side Menu */}
                <button
                  onClick={() => {
                    setIsOptionsMenuOpen(false);
                    setIsSideMenuOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-amber-400 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer text-right"
                >
                  <Menu className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>☰ المزيد من الخيارات والقائمة الكاملة</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </footer>
  );
};
