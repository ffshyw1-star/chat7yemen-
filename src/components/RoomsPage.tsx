import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import { LogOut, Settings, User as UserIcon, LogIn, Sparkles, Home, Gauge, Globe, Users } from 'lucide-react';
import { RoomSettingsModal } from './RoomSettingsModal';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { OwnerDashboardModal } from './OwnerDashboardModal';

export const RoomsPage: React.FC = () => {
  const {
    currentUser, rooms, users, switchRoom, logout, setIsLogoutConfirmOpen,
    setSelectedUserForProfile, setIsProfileSettingsOpen,
    isRoomSettingsOpen, setIsRoomSettingsOpen,
    isOwnerDashboardOpen, setIsOwnerDashboardOpen, themeMode
  } = useChat();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!currentUser) return null;

  const isManagementOrHigher = ['management', 'admin', 'owner'].includes(currentUser.role);

  return (
    <div className={`min-h-screen bg-[#f4f6f8] text-slate-800 flex flex-col font-sans dir-rtl theme-${themeMode}`} dir="rtl">
      {/* Top Header matching Image 2 */}
      <header className="bg-[#0e1b26] text-white sticky top-0 z-30 shadow-sm border-b border-slate-800">
        <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between">
          
          {/* Logo Brand Badge (Araby Chat) */}
          <div className="flex items-center gap-2">
            <div className="bg-[#00aeeF] text-white px-2.5 py-1 rounded-md font-black tracking-tight text-sm shadow-xs flex items-center gap-1">
              <span>Araby</span>
              <span className="bg-[#e63946] text-white px-1.5 py-0.5 rounded text-xs font-extrabold">Chat</span>
            </div>
          </div>

          {/* User Profile Avatar with Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center justify-center p-0.5 rounded-full border-2 border-white/80 hover:border-white transition-all cursor-pointer shadow-sm active:scale-95"
              title={currentUser.username}
            >
              <UserAvatar
                avatarUrl={currentUser.avatar}
                gender={currentUser.gender}
                role={currentUser.role}
                username={currentUser.username}
                size="md"
                showRankBadge={false}
              />
            </button>

            {/* Dropdown Menu */}
            {isMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 text-right">
                
                {/* 1. Profile */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setSelectedUserForProfile(currentUser);
                  }}
                  className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer transition-colors"
                >
                  <span>ملفي الشخصي</span>
                  <UserIcon className="w-4 h-4 text-[#00aeeF]" />
                </button>

                {/* 2. List */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    setIsProfileSettingsOpen(true);
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
                      setIsMenuOpen(false);
                      setIsOwnerDashboardOpen(true);
                    }}
                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer transition-colors"
                  >
                    <span>لوحة التحكم</span>
                    <Gauge className="w-4 h-4 text-[#00aeeF]" />
                  </button>
                )}

                {/* Room Settings for Non-owner management */}
                {isManagementOrHigher && currentUser.role !== 'owner' && (
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsRoomSettingsOpen(true);
                    }}
                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer transition-colors"
                  >
                    <span>إعدادات الغرفة</span>
                    <Settings className="w-4 h-4 text-[#00aeeF]" />
                  </button>
                )}

                {/* 4. Logout */}
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
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

        </div>
      </header>

      {/* Main Content: Room Cards List (matching Image 2) */}
      <main className="max-w-xl mx-auto w-full px-4 py-6 flex-1 space-y-4">
        
        {/* Visitor Special Welcome Notice */}
        {currentUser.role === 'visitor' && (
          <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-right">
            <div className="flex items-center gap-3">
              <span className="text-2xl">👋</span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-amber-900">
                  مرحباً بك كزائر ({currentUser.username})!
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  اختر الغرفة المناسبة أدناه للدخول والتفاعل المباشر.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsProfileSettingsOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تسجيل عضوية</span>
            </button>
          </div>
        )}

        {/* Room List Loop Cards */}
        {rooms.map((room) => {
          const onlineInRoom = users.filter(u => u.currentRoomId === room.id && u.onlineStatus !== 'offline').length;
          const totalUsersCount = (room.baseUserCount || 0) + onlineInRoom;

          return (
            <div
              key={room.id}
              onClick={() => switchRoom(room.id)}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.99] group"
            >
              {/* Top Center: Circular Globe Icon in Blue Badge */}
              <div className="w-16 h-16 rounded-full bg-[#1e88e5] text-white flex items-center justify-center shadow-xs mb-3 group-hover:scale-105 transition-transform">
                <Globe className="w-9 h-9 text-white stroke-[2]" />
              </div>

              {/* Center: Room Name */}
              <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center justify-center gap-2">
                <span>{room.name}</span>
                {room.isDefault && (
                  <span className="text-[10px] bg-sky-100 text-[#0284c7] border border-sky-200 px-2 py-0.5 rounded-full font-bold">
                    الرئيسية
                  </span>
                )}
              </h3>

              {/* Center: Room Description */}
              <p className="text-xs sm:text-sm text-slate-400 mb-3.5 max-w-xs sm:max-w-sm leading-relaxed">
                {room.description || 'هذه الغرفة لا تحتوي وصف'}
              </p>

              {/* Center: Users Count */}
              <div className="flex items-center justify-center gap-2 text-slate-800 font-extrabold text-base sm:text-lg">
                <Users className="w-5 h-5 text-slate-700 fill-slate-700/20" />
                <span>{totalUsersCount}</span>
              </div>
            </div>
          );
        })}

      </main>

      {/* Clean Light Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-center text-xs text-slate-400 mt-auto">
        <p>© 2026 Araby Chat - جميع الحقوق محفوظة</p>
      </footer>

      {isRoomSettingsOpen && <RoomSettingsModal />}
      {isOwnerDashboardOpen && <OwnerDashboardModal />}
      <LogoutConfirmModal />
    </div>
  );
};
