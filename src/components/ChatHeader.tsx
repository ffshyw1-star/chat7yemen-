import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import {
  Flag, Heart, UserPlus, Mail, ShoppingCart, Menu, Shield, LogOut,
  User as UserIcon, Home, Bell, Settings, CheckCircle, Gauge, MessageSquare, MessageCircle
} from 'lucide-react';
import { t } from '../utils/translations';

export const ChatHeader: React.FC = () => {
  const {
    currentUser, currentRoom, siteSettings,
    reports, friendRequests, notifications, unreadPrivateCount, topBannerMessage,
    setSelectedUserForProfile, setIsStoreOpen,
    setIsSideMenuOpen, setIsReportsOpen, setIsNotificationsOpen,
    setIsFriendRequestsOpen, setIsPrivateChatOpen, setIsRoomSettingsOpen, setIsOwnerDashboardOpen, setIsGoogleChatOpen, setCurrentView, logout, setIsLogoutConfirmOpen,
    toggleAdminStealth, currentUserCan
  } = useChat();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  if (!currentUser) return null;

  // Strict role check for moderation tools (White Flag 🚩)
  // Visitor: HIDDEN
  // Member: HIDDEN
  // VIP: HIDDEN
  // Owner & Management & Admins: SHOWN if role has actual moderation privilege
  const canViewReports = currentUser.role === 'owner' || (
    ['moderator', 'management', 'admin'].includes(currentUser.role) &&
    (currentUserCan('kick_user') || currentUserCan('mute_user') || currentUserCan('delete_messages'))
  );

  const canViewFriendRequests = currentUser.role !== 'visitor';
  const isManagementOrHigher = ['management', 'admin', 'owner'].includes(currentUser.role);
  const unreadNotifCount = notifications.filter(n => (!n.userId || n.userId === currentUser.id) && !n.isRead).length;
  const myFriendRequestsCount = friendRequests.filter(fr => fr.receiverId === currentUser.id).length;

  return (
    <header className="app-chat-header bg-slate-950 border-b border-slate-800/80 sticky top-0 z-30 shadow-md select-none shrink-0 w-full">
      <div className="max-w-7xl mx-auto px-1.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-1">
        
        {/* Right Side in RTL: Avatar, White Flag (Staff only), Heart, Friend Requests, Mail */}
        <div className="flex items-center gap-0.5 sm:gap-1.5 shrink-0">
          {/* 1. Far Right: User Circular Avatar & Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1 transition-transform active:scale-95 cursor-pointer p-0.5 rounded-full hover:ring-2 hover:ring-slate-700"
              title="ملفي الشخصي"
            >
              <UserAvatar
                avatarUrl={currentUser.avatar}
                gender={currentUser.gender}
                role={currentUser.role}
                username={currentUser.username}
                size="sm"
                showRankBadge
              />
            </button>

            {/* Profile Dropdown Menu */}
            {isProfileMenuOpen && (
              <>
                {/* Backdrop to close on click outside */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setIsProfileMenuOpen(false)}
                />

                <div className="absolute right-0 top-full mt-2 w-64 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 dir-rtl text-right ring-1 ring-black/40">
                  
                  {/* User Profile Mini Header Card */}
                  <div
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setSelectedUserForProfile(currentUser);
                    }}
                    className="p-3 bg-gradient-to-l from-slate-800/90 to-slate-900 border-b border-slate-700/80 cursor-pointer hover:bg-slate-800 transition-colors flex items-center gap-2.5 group"
                    title="انقر لفتح ملفك الشخصي بالكامل"
                  >
                    <UserAvatar
                      avatarUrl={currentUser.avatar}
                      gender={currentUser.gender}
                      role={currentUser.role}
                      username={currentUser.username}
                      size="md"
                      showRankBadge
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-sm text-white truncate group-hover:text-cyan-400 transition-colors">
                          {currentUser.username}
                        </span>
                        <span className="text-[10px] text-cyan-400 font-bold bg-cyan-950/80 border border-cyan-800/60 px-1.5 py-0.5 rounded-md shrink-0">
                          عرض الملف
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] text-slate-400 truncate">
                          {currentUser.role === 'owner' ? '👑 مالك الموقع' : currentUser.role}
                        </span>
                        {currentUser.country && (
                          <span className="text-[10px] text-slate-500">
                            • {currentUser.country}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-1 space-y-0.5">
                    {/* 1. Profile */}
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setSelectedUserForProfile(currentUser);
                      }}
                      className="w-full px-3 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-sky-500/15 flex items-center justify-center text-sky-400">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <span>ملفي الشخصي</span>
                      </div>
                    </button>

                    {/* 2. Rooms / List */}
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setCurrentView('rooms');
                      }}
                      className="w-full px-3 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-400">
                          <Home className="w-4 h-4" />
                        </div>
                        <span>قائمة الغرف</span>
                      </div>
                    </button>

                    {/* Room Settings for Management, Admin & Owner */}
                    {isManagementOrHigher && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          setIsRoomSettingsOpen(true);
                        }}
                        className="w-full px-3 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-indigo-500/15 flex items-center justify-center text-indigo-400">
                            <Settings className="w-4 h-4" />
                          </div>
                          <span>إعدادات الغرفة</span>
                        </div>
                      </button>
                    )}

                    {/* Google Chat Integration */}
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsGoogleChatOpen(true);
                      }}
                      className="w-full px-3 py-2.5 text-xs font-bold text-emerald-300 hover:bg-emerald-950/40 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <span className="flex items-center gap-1.5">
                          Google Chat
                          <span className="text-[10px] bg-emerald-900/60 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.2 rounded font-bold">مساحات</span>
                        </span>
                      </div>
                    </button>

                    {/* Stealth Mode - للمالك فقط */}
                    {currentUser.role === 'owner' && (
                      <button
                        onClick={() => {
                          setIsProfileMenuOpen(false);
                          toggleAdminStealth();
                        }}
                        className="w-full px-3 py-2.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-white rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-lg ${currentUser.isStealth ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-400'} flex items-center justify-center`}>
                            <Shield className="w-4 h-4" />
                          </div>
                          <span className={currentUser.isStealth ? 'text-purple-400 font-black' : ''}>
                            {currentUser.isStealth ? 'وضع الاختفاء (مفعل 🕵️‍♂️)' : 'تفعيل وضع الاختفاء 👁️'}
                          </span>
                        </div>
                      </button>
                    )}

                    <div className="h-[1px] bg-slate-800/90 my-1" />

                    {/* Logout */}
                    <button
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        setIsLogoutConfirmOpen(true);
                      }}
                      className="w-full px-3 py-2.5 text-xs font-bold text-red-400 hover:bg-red-950/30 rounded-xl flex items-center justify-between gap-3 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center text-red-400">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span>تسجيل الخروج</span>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 2. White Flag Icon 🚩 (Reports & Moderation) - STRICTLY HIDDEN for Visitor, Member, and VIP */}
          {canViewReports && (
            <button
              onClick={() => setIsReportsOpen(true)}
              className="header-action-btn relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white hover:bg-slate-800/80 transition-all cursor-pointer group active:scale-95"
              title={reports.length > 0 ? `البلاغات المعلقة للإدارة (${reports.length})` : 'صندوق البلاغات (الإدارة والرقابة)'}
            >
              <Flag className="header-icon w-5 h-5 text-white fill-white drop-shadow-xs group-hover:scale-110 transition-transform" />
              {reports.length > 0 && (
                <>
                  <span className="animate-ping absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 opacity-75"></span>
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center border border-slate-950 shadow-md">
                    {reports.length}
                  </span>
                </>
              )}
            </button>
          )}

          {/* 3. Likes & Notifications Icon ❤️ */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="header-action-btn relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white hover:bg-slate-800/80 transition-all cursor-pointer active:scale-95"
            title="الإعجابات والإشعارات"
          >
            <Heart className="header-icon w-5 h-5 text-white fill-white stroke-[2]" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse shadow-md border border-slate-950">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* 4. Friend Requests Icon 👤 / 👤+ - HIDDEN for Visitor, Visible for Member & VIP & Admins */}
          {canViewFriendRequests && (
            <button
              onClick={() => setIsFriendRequestsOpen(true)}
              className="header-action-btn relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white hover:bg-slate-800/80 transition-all cursor-pointer active:scale-95"
              title="طلبات الصداقة"
            >
              <UserPlus className={`header-icon w-5 h-5 transition-colors stroke-[2.2] ${myFriendRequestsCount > 0 ? 'text-emerald-400 animate-bounce' : 'text-white'}`} />
              {myFriendRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse shadow-md border border-slate-950">
                  {myFriendRequestsCount}
                </span>
              )}
            </button>
          )}

          {/* 5. Private Messages Icon ✉️ */}
          <button
            onClick={() => setIsPrivateChatOpen(true)}
            className="header-action-btn relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-white hover:bg-slate-800/80 transition-all cursor-pointer group active:scale-95"
            title="الرسائل الخاصة"
          >
            <Mail className="header-icon w-5 h-5 text-white stroke-[2]" />
            {unreadPrivateCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-md min-w-[18px] flex items-center justify-center border border-slate-950 shadow-md animate-pulse">
                {unreadPrivateCount}
              </span>
            )}
          </button>
        </div>

        {/* Left Side in RTL: Store, Site Logo, Menu Drawer ☰ */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Store Button 🛒 with "Store." label */}
          <button
            onClick={() => setIsStoreOpen(true)}
            className="header-store-btn relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/90 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shrink-0"
            title="المتجر وشراء الرتب"
          >
            <ShoppingCart className="w-4 h-4 text-white fill-white shrink-0" />
            <span className="font-bold text-xs tracking-tight text-white hidden xs:inline">Store.</span>
          </button>

          {/* Site Logo */}
          <div
            className="flex items-center gap-1.5 px-1.5 sm:px-2 py-1 rounded-xl bg-slate-900/90 border border-slate-700/80 select-none shadow-2xs shrink-0"
            title={siteSettings?.siteName || "شات اليمن المطور"}
          >
            {siteSettings?.siteLogo ? (
              <img
                src={siteSettings.siteLogo}
                alt="Logo"
                className="w-5 h-5 object-contain rounded"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex items-center text-xs font-black tracking-tight select-none rounded overflow-hidden">
                <span className="bg-[#0284c7] text-white px-1.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold flex items-center gap-0.5">
                  <MessageCircle className="w-3 h-3" />
                  {siteSettings?.siteName ? siteSettings.siteName.split(' ')[0] : 'شات'}
                </span>
                <span className="bg-[#dc2626] text-white px-1.5 py-0.5 text-[10px] sm:text-[11px] font-extrabold">
                  {siteSettings?.siteName ? siteSettings.siteName.split(' ').slice(1).join(' ') || 'اليمن' : 'اليمن'}
                </span>
              </div>
            )}
          </div>

          {/* Menu Drawer Icon ☰ on Far Left */}
          <button
            onClick={() => setIsSideMenuOpen(true)}
            className="header-action-btn w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-slate-200 hover:text-amber-400 hover:bg-slate-800/80 transition-all active:scale-95 cursor-pointer shrink-0"
            title="القائمة الجانبية"
          >
            <Menu className="header-icon w-5 h-5 text-slate-200" />
          </button>
        </div>

      </div>

      {topBannerMessage && (
        <div className="bg-emerald-600 text-white font-black text-xs py-2 px-4 text-center shadow-lg border-t border-emerald-400 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{topBannerMessage}</span>
        </div>
      )}
    </header>
  );
};
