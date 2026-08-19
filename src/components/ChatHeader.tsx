import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import {
  Flag, Heart, UserPlus, Mail, ShoppingCart, Menu, Shield, LogOut,
  User as UserIcon, Home, Bell, Settings, CheckCircle, Gauge
} from 'lucide-react';

export const ChatHeader: React.FC = () => {
  const {
    currentUser, currentRoom,
    reports, friendRequests, notifications, unreadPrivateCount, topBannerMessage,
    setSelectedUserForProfile, setIsStoreOpen,
    setIsSideMenuOpen, setIsReportsOpen, setIsNotificationsOpen,
    setIsFriendRequestsOpen, setIsPrivateChatOpen, setIsRoomSettingsOpen, setIsOwnerDashboardOpen, setCurrentView, logout, setIsLogoutConfirmOpen,
    toggleAdminStealth
  } = useChat();

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  if (!currentUser) return null;

  const isModOrHigher = ['moderator', 'management', 'admin', 'owner'].includes(currentUser.role);
  const isManagementOrHigher = ['management', 'admin', 'owner'].includes(currentUser.role);
  const unreadNotifCount = notifications.filter(n => (!n.userId || n.userId === currentUser.id) && !n.isRead).length;
  const myFriendRequestsCount = friendRequests.filter(fr => fr.receiverId === currentUser.id).length;

  return (
    <header className="bg-slate-950 border-b border-slate-800/80 sticky top-0 z-30 shadow-md select-none">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 flex items-center justify-between gap-1">
        
        {/* Right Side (DOM 1st in RTL): Avatar, Flag, Heart, Friend Requests, Mail */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Far Right: User Circular Avatar & Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              className="flex items-center gap-1 transition-transform active:scale-95 cursor-pointer"
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
              <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in duration-150 dir-rtl text-right">
                
                {/* 1. Profile */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setSelectedUserForProfile(currentUser);
                  }}
                  className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer transition-colors"
                >
                  <span>ملفي الشخصي</span>
                  <UserIcon className="w-4 h-4 text-[#00aeeF]" />
                </button>

                {/* 2. Rooms / List */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setCurrentView('rooms');
                  }}
                  className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer transition-colors"
                >
                  <span>قائمة</span>
                  <Home className="w-4 h-4 text-[#00aeeF]" />
                </button>

                {/* 3. Owner Dashboard / Control Panel (Only for Owner) */}
                {currentUser.role === 'owner' && (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsOwnerDashboardOpen(true);
                    }}
                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer transition-colors"
                  >
                    <span>لوحة التحكم</span>
                    <Gauge className="w-4 h-4 text-[#00aeeF]" />
                  </button>
                )}

                {/* Room Settings for Management, Admin & Owner */}
                {isManagementOrHigher && (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      setIsRoomSettingsOpen(true);
                    }}
                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer transition-colors"
                  >
                    <span>إعدادات الغرفة</span>
                    <Settings className="w-4 h-4 text-[#00aeeF]" />
                  </button>
                )}

                {/* Stealth Mode (وضع الاختفاء) - للمالك فقط */}
                {currentUser.role === 'owner' && (
                  <button
                    onClick={() => {
                      setIsProfileMenuOpen(false);
                      toggleAdminStealth();
                    }}
                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer transition-colors"
                  >
                    <span className={currentUser.isStealth ? 'text-purple-600 font-black' : ''}>
                      {currentUser.isStealth ? 'وضع الاختفاء (مفعل 🕵️‍♂️)' : 'تفعيل وضع الاختفاء 👁️'}
                    </span>
                    <Shield className={`w-4 h-4 ${currentUser.isStealth ? 'text-purple-600' : 'text-[#00aeeF]'}`} />
                  </button>
                )}

                {/* 4. Logout */}
                <button
                  onClick={() => {
                    setIsProfileMenuOpen(false);
                    setIsLogoutConfirmOpen(true);
                  }}
                  className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                >
                  <span>خروج</span>
                  <LogOut className="w-4 h-4 text-[#00aeeF]" />
                </button>
              </div>
            )}
          </div>

          {/* White Flag Icon 🏳️ for Reports (Management & Mods Only: moderator, management, admin, owner) */}
          {isModOrHigher && (
            <button
              onClick={() => setIsReportsOpen(true)}
              className="relative p-2 rounded-xl text-white hover:bg-slate-900 transition-all cursor-pointer group"
              title={reports.length > 0 ? `البلاغات المعلقة للإدارة (${reports.length})` : 'صندوق البلاغات (الإدارة والرقابة)'}
            >
              <Flag className="w-5 h-5 text-white fill-white drop-shadow-xs group-hover:scale-110 transition-transform" />
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

          {/* Likes & Notifications Icon 🤍 (القلب الأبيض) */}
          <button
            onClick={() => setIsNotificationsOpen(true)}
            className="relative p-2 rounded-xl text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="الإعجابات والإشعارات"
          >
            <Heart className="w-5 h-5 text-white fill-white stroke-[2]" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse shadow-md border border-slate-950">
                {unreadNotifCount}
              </span>
            )}
          </button>

          {/* Friend Requests Icon ➕👤 */}
          {currentUser.role !== 'visitor' && (
            <button
              onClick={() => setIsFriendRequestsOpen(true)}
              className="relative p-2 rounded-xl text-white hover:bg-slate-900 transition-colors cursor-pointer"
              title="طلبات الصداقة"
            >
              <UserPlus className={`w-5 h-5 transition-colors stroke-[2.2] ${myFriendRequestsCount > 0 ? 'text-emerald-400 animate-bounce' : 'text-white'}`} />
              {myFriendRequestsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full flex items-center justify-center animate-pulse shadow-md border border-slate-950">
                  {myFriendRequestsCount}
                </span>
              )}
            </button>
          )}

          {/* Private Messages Icon ✉️ matching Screenshot 1 */}
          <button
            onClick={() => setIsPrivateChatOpen(true)}
            className="relative p-1.5 sm:p-2 rounded-xl text-white hover:bg-slate-800/80 transition-all cursor-pointer group"
            title="الرسائل الخاصة"
          >
            <Mail className="w-5 h-5 text-white stroke-[2]" />
            {unreadPrivateCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-md min-w-[18px] flex items-center justify-center border border-slate-950 shadow-md animate-pulse">
                {unreadPrivateCount}
              </span>
            )}
          </button>
        </div>

        {/* Left Side (DOM 2nd in RTL): Store button, Side Menu Drawer Icon (☰) */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Store Button 🛒 with "Store." label as in screenshot 1 */}
          <button
            onClick={() => setIsStoreOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold transition-colors cursor-pointer"
            title="المتجر وشراء الرتب"
          >
            <ShoppingCart className="w-4 h-4 text-white fill-white" />
            <span className="font-bold text-xs tracking-tight text-white">Store.</span>
          </button>

          {/* Menu Drawer Icon ☰ on Far Left */}
          <button
            onClick={() => setIsSideMenuOpen(true)}
            className="p-2 rounded-xl text-slate-200 hover:text-amber-400 hover:bg-slate-800/80 transition-colors cursor-pointer"
            title="القائمة الجانبية"
          >
            <Menu className="w-5 h-5" />
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
