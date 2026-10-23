import React from 'react';
import { useChat } from '../context/ChatContext';
import { TopAvatarDropdown } from './TopAvatarDropdown';
import {
  Flag, Heart, UserPlus, Mail, ShoppingBasket, Menu, Shield, LogOut,
  User as UserIcon, Home, Settings, CheckCircle, MessageSquare, MessageCircle
} from 'lucide-react';

export const ChatHeader: React.FC = () => {
  const {
    currentUser, currentRoom, siteSettings,
    reports, friendRequests, notifications, unreadPrivateCount, topBannerMessage,
    setIsStoreOpen, setIsSideMenuOpen, setIsReportsOpen, setIsNotificationsOpen,
    setIsFriendRequestsOpen, setIsPrivateChatOpen, setCurrentView,
    currentUserCan
  } = useChat();

  if (!currentUser) return null;

  // Strict role check for moderation tools (White Flag 🚩)
  const canViewReports = currentUser.role === 'owner' || (
    ['moderator', 'management', 'admin'].includes(currentUser.role) &&
    (currentUserCan('kick_user') || currentUserCan('mute_user') || currentUserCan('delete_messages'))
  );

  const canViewFriendRequests = currentUser.role !== 'visitor';
  const isManagementOrHigher = ['management', 'admin', 'owner'].includes(currentUser.role);
  const unreadNotifCount = notifications.filter(n => (!n.userId || n.userId === currentUser.id) && !n.isRead).length;
  const myFriendRequestsCount = friendRequests.filter(fr => fr.receiverId === currentUser.id).length;

  return (
    <>
      <header id="chat_head" className="select-none shadow-md" dir="rtl">
        {/* Right Side in RTL: Avatar, Reports (Staff), Heart/Notifications, Friends, Private */}
        <div className="flex items-center gap-0 shrink-0">
          {/* 1. ArabSyemen Top Avatar Dropdown Menu (#main_mob_menu / #mobile_main_menu) */}
          <TopAvatarDropdown />

          {/* 2. Flag Icon (fa fa-flag) - Reports & Moderation (Staff Only) */}
          {canViewReports && (
            <button
              id="get_report"
              onClick={() => setIsReportsOpen(true)}
              className="head_option group"
              title={reports.length > 0 ? `البلاغات المعلقة للإدارة (${reports.length})` : 'صندوق البلاغات (الإدارة والرقابة)'}
              type="button"
            >
              <i className="fa fa-flag text-white text-[17px] group-hover:scale-110 transition-transform"></i>
              {reports.length > 0 && (
                <span className="head_badge animate-pulse">
                  {reports.length > 99 ? '99+' : reports.length}
                </span>
              )}
            </button>
          )}

          {/* 3. Heart Icon (fa fa-heart) - Likes & Notifications */}
          <button
            id="get_notification"
            onClick={() => setIsNotificationsOpen(true)}
            className="head_option group"
            title="الإعجابات والإشعارات"
            type="button"
          >
            <i className="fa fa-heart text-white text-[17px] group-hover:scale-110 transition-transform"></i>
            {unreadNotifCount > 0 && (
              <span className="head_badge animate-pulse">
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </span>
            )}
          </button>

          {/* 4. User Plus Icon (fa fa-user-plus) - Friend Requests (Members and higher) */}
          {canViewFriendRequests && (
            <button
              id="friend_request"
              onClick={() => setIsFriendRequestsOpen(true)}
              className="head_option group"
              title="طلبات الصداقة"
              type="button"
            >
              <i className={`fa fa-user-plus text-[17px] group-hover:scale-110 transition-transform ${myFriendRequestsCount > 0 ? 'text-emerald-400 animate-bounce' : 'text-white'}`}></i>
              {myFriendRequestsCount > 0 && (
                <span className="head_badge !bg-emerald-600 animate-pulse">
                  {myFriendRequestsCount > 99 ? '99+' : myFriendRequestsCount}
                </span>
              )}
            </button>
          )}

          {/* 5. Envelope Icon (fa fa-envelope) - Private Messages */}
          <button
            id="get_private"
            onClick={() => setIsPrivateChatOpen(true)}
            className="head_option group"
            title="الرسائل الخاصة"
            type="button"
          >
            <i className="fa fa-envelope text-white text-[17px] group-hover:scale-110 transition-transform"></i>
            {unreadPrivateCount > 0 && (
              <span className="head_badge animate-pulse">
                {unreadPrivateCount > 99 ? '99+' : unreadPrivateCount}
              </span>
            )}
          </button>
        </div>

        {/* Left Side in RTL: Store, Site Logo, Mobile Menu (fa-bars) */}
        <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
          {/* Store Basket Icon (fa fa-shopping-basket) */}
          <button
            id="chat_store_btn"
            onClick={() => setIsStoreOpen(true)}
            className="head_option group"
            title="المتجر وشراء الرتب"
            type="button"
          >
            <i className="fa fa-shopping-basket text-white text-[17px] group-hover:scale-110 transition-transform"></i>
          </button>

          {/* Main Logo Container (#main_logo) */}
          <div
            id="main_logo"
            className="flex items-center gap-1.5 px-2 h-[34px] rounded-lg bg-white/10 hover:bg-white/15 transition-colors cursor-pointer select-none"
            onClick={() => setCurrentView('rooms')}
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

          {/* Side Menu Drawer Button (fa fa-bars) */}
          <button
            id="btn_side_menu"
            onClick={() => setIsSideMenuOpen(true)}
            className="head_option group"
            title="القائمة الجانبية"
            type="button"
          >
            <i className="fa fa-bars text-white text-[18px] group-hover:scale-110 transition-transform"></i>
          </button>
        </div>
      </header>

      {topBannerMessage && (
        <div className="bg-emerald-600 text-white font-black text-xs py-2 px-4 text-center shadow-lg border-t border-emerald-400 flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-200" />
          <span>{topBannerMessage}</span>
        </div>
      )}
    </>
  );
};
