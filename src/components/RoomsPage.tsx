import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  LogOut, Settings, User as UserIcon, LogIn, Sparkles, Home, Gauge, Globe, Users, Shield, Lock, Gem, Star,
  Crown, Flame, Heart, Music, Gamepad2, Coffee, Trophy, MessageSquare
} from 'lucide-react';
import { RoomSettingsModal } from './RoomSettingsModal';
import { LogoutConfirmModal } from './LogoutConfirmModal';
import { OwnerDashboardModal } from './OwnerDashboardModal';
import { RoomPasswordModal } from './RoomPasswordModal';

export const RoomsPage: React.FC = () => {
  const {
    currentUser, rooms, users, switchRoom, logout, setIsLogoutConfirmOpen,
    setSelectedUserForProfile, setIsProfileSettingsOpen,
    isRoomSettingsOpen, setIsRoomSettingsOpen,
    isOwnerDashboardOpen, setIsOwnerDashboardOpen, themeMode, toggleAdminStealth,
    currentLang, isRtl
  } = useChat();

  const isEnglish = currentLang === 'English';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (!currentUser) return null;

  const isManagementOrHigher = ['management', 'admin', 'owner'].includes(currentUser.role);

  const renderRoomIcon = (room: any, isLocked: boolean) => {
    if (room.iconUrl) {
      return (
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-sky-400/80 shadow-xs flex items-center justify-center bg-slate-100 group-hover:scale-105 transition-transform">
          <img
            src={room.iconUrl}
            alt={room.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>
      );
    }

    const iconKey = room.customIcon || (room.roomType === 'diamond' ? 'diamond' : room.roomType === 'admin' ? 'admin_star' : 'globe');

    switch (iconKey) {
      case 'diamond':
        return (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Gem className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
      case 'admin_star':
        return (
          <div className="w-16 h-16 rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Star className="w-9 h-9 text-rose-600 fill-white stroke-[2.5]" />
          </div>
        );
      case 'crown':
        return (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Crown className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
      case 'flame':
        return (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Flame className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
      case 'heart':
        return (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Heart className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
      case 'music':
        return (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Music className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
      case 'game':
        return (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Gamepad2 className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
      case 'coffee':
        return (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Coffee className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
      case 'sparkles':
        return (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Sparkles className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
      case 'trophy':
        return (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Trophy className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
      case 'shield':
        return (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-slate-700 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <Shield className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
      case 'message':
        return (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
            <MessageSquare className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
      default:
        if (room.flag && room.flag.length <= 4 && room.flag !== '🌐') {
          return (
            <div className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-3xl shadow-xs group-hover:scale-105 transition-transform">
              <span>{room.flag}</span>
            </div>
          );
        }
        return (
          <div className={`w-16 h-16 rounded-full ${isLocked ? 'bg-amber-600' : 'bg-[#1e88e5]'} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
            <Globe className="w-9 h-9 text-white stroke-[2]" />
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-[#f4f6f8] text-slate-800 flex flex-col font-sans ${isRtl ? 'dir-rtl' : 'dir-ltr'} theme-${themeMode}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Header matching Image 2 */}
      <header className="bg-[#0e1b26] text-white sticky top-0 z-30 shadow-sm border-b border-slate-800">
        <div className="max-w-xl mx-auto px-4 py-2.5 flex items-center justify-between">
          
          {/* Logo Brand Badge (شات اليمن / Yemen Chat) */}
          <div className="flex items-center gap-2">
            <div className="bg-[#00aeeF] text-white px-2.5 py-1 rounded-md font-black tracking-tight text-sm shadow-xs flex items-center gap-1 select-none">
              <span>{isEnglish ? 'Yemen' : 'شات'}</span>
              <span className="bg-[#e63946] text-white px-1.5 py-0.5 rounded text-xs font-extrabold">{isEnglish ? 'Chat' : 'اليمن'}</span>
            </div>
          </div>

          {/* Right Header Actions: Flag Language Switcher + User Profile Avatar with Dropdown Menu */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher compact />

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
                <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${isRtl ? 'text-right' : 'text-left'}`}>
                  
                  {/* 1. Profile */}
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setSelectedUserForProfile(currentUser);
                    }}
                    className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer transition-colors"
                  >
                    <span>{isEnglish ? 'My Profile' : 'ملفي الشخصي'}</span>
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
                    <span>{isEnglish ? 'Rooms Menu' : 'قائمة'}</span>
                    <Home className="w-4 h-4 text-[#00aeeF]" />
                  </button>

                  {/* Room Settings for Non-owner management */}
                  {isManagementOrHigher && currentUser.role !== 'owner' && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsRoomSettingsOpen(true);
                      }}
                      className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer transition-colors"
                    >
                      <span>{isEnglish ? 'Room Settings' : 'إعدادات الغرفة'}</span>
                      <Settings className="w-4 h-4 text-[#00aeeF]" />
                    </button>
                  )}

                  {/* Stealth Mode (وضع الاختفاء) - للمالك فقط */}
                  {currentUser.role === 'owner' && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        toggleAdminStealth();
                      }}
                      className="w-full px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-between gap-3 border-b border-slate-100 cursor-pointer transition-colors"
                    >
                      <span className={currentUser.isStealth ? 'text-purple-600 font-black' : ''}>
                        {isEnglish 
                          ? (currentUser.isStealth ? 'Stealth Mode (Active 🕵️‍♂️)' : 'Enable Stealth Mode 👁️') 
                          : (currentUser.isStealth ? 'وضع الاختفاء (مفعل 🕵️‍♂️)' : 'تفعيل وضع الاختفاء 👁️')}
                      </span>
                      <Shield className={`w-4 h-4 ${currentUser.isStealth ? 'text-purple-600' : 'text-[#00aeeF]'}`} />
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
                    <span>{isEnglish ? 'Logout' : 'خروج'}</span>
                    <LogOut className="w-4 h-4 text-[#00aeeF]" />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* Main Content: Room Cards List (matching Image 2) */}
      <main className="max-w-xl mx-auto w-full px-4 py-6 flex-1 space-y-4">
        
        {/* Visitor Special Welcome Notice */}
        {currentUser.role === 'visitor' && (
          <div className={`bg-amber-50 border border-amber-200/80 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">👋</span>
              <div>
                <h3 className="text-xs sm:text-sm font-black text-amber-900">
                  {isEnglish ? `Welcome as Guest (${currentUser.username})!` : `مرحباً بك كزائر (${currentUser.username})!`}
                </h3>
                <p className="text-xs text-amber-700 mt-0.5">
                  {isEnglish ? 'Choose a suitable room below to enter and join the conversation.' : 'اختر الغرفة المناسبة أدناه للدخول والتفاعل المباشر.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsProfileSettingsOpen(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEnglish ? 'Register Account' : 'تسجيل عضوية'}</span>
            </button>
          </div>
        )}

        {/* Room List Loop Cards */}
        {rooms.map((room) => {
          const onlineInRoom = users.filter(u => {
            if (u.isBanned) return false;
            if (u.role === 'owner' && u.isStealth && currentUser?.role !== 'owner') return false;
            return (u.currentRoomId || 'room-general') === room.id && u.onlineStatus !== 'offline';
          }).length;
          const totalUsersCount = onlineInRoom;
          const isLocked = Boolean(room.password && room.password.trim() !== '');
          const isDiamond = room.roomType === 'diamond' || room.customIcon === 'diamond';
          const isAdminRoom = room.roomType === 'admin' || room.customIcon === 'admin_star';

          return (
            <div
              key={room.id}
              onClick={() => switchRoom(room.id)}
              className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all p-6 flex flex-col items-center justify-center text-center cursor-pointer active:scale-[0.99] group relative"
            >
              {/* Top Center: Circular Icon / Custom Avatar */}
              <div className="relative mb-3">
                {renderRoomIcon(room, isLocked)}

                {isLocked && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-1 border-2 border-white shadow-xs" title={isEnglish ? 'Password Protected Room' : 'غرفة مقفلة بكلمة مرور'}>
                    <Lock className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>

              {/* Center: Room Name & Badges */}
              <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center justify-center gap-2 flex-wrap">
                <span>{room.name}</span>
                {room.isDefault && (
                  <span className="text-[10px] bg-sky-100 text-[#0284c7] border border-sky-200 px-2 py-0.5 rounded-full font-bold">
                    {isEnglish ? 'Default' : 'الرئيسية'}
                  </span>
                )}
                {isDiamond && (
                  <span className="text-[10px] bg-cyan-50 text-cyan-700 border border-cyan-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Gem className="w-3 h-3 text-cyan-600" />
                    <span>{isEnglish ? 'Diamond Room' : 'غرفة ماسية'}</span>
                  </span>
                )}
                {isAdminRoom && (
                  <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Star className="w-3 h-3 text-rose-600 fill-white stroke-[2]" />
                    <span>{isEnglish ? 'Admin Room' : 'غرفة إدارة'}</span>
                  </span>
                )}
                {isLocked && (
                  <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-xs font-black px-2 py-0.5 rounded-md">
                    <Lock className="w-3 h-3 text-red-600" />
                    <span>{isEnglish ? 'Locked' : 'مقفلة'}</span>
                  </span>
                )}
              </h3>

              {/* Center: Room Description */}
              <p className="text-xs sm:text-sm text-slate-400 mb-3.5 max-w-xs sm:max-w-sm leading-relaxed">
                {room.description || (isEnglish ? 'No description provided' : 'هذه الغرفة لا تحتوي وصف')}
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
        <p>{isEnglish ? '© 2026 Yemen Chat - All rights reserved' : '© 2026 شات اليمن - جميع الحقوق محفوظة'}</p>
      </footer>

      {isRoomSettingsOpen && <RoomSettingsModal />}
      {isOwnerDashboardOpen && <OwnerDashboardModal />}
      <LogoutConfirmModal />
      <RoomPasswordModal />
    </div>
  );
};
