import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Users, Home, Settings, Play, Volume2, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const {
    currentUser, currentRoom, users,
    isOnlineListOpen, setIsOnlineListOpen,
    isRoomsListOpen, setIsRoomsListOpen,
    setIsProfileSettingsOpen
  } = useChat();

  const [isPlayingRadio, setIsPlayingRadio] = useState(false);

  if (!currentUser) return null;

  // Filter real active users in current room and across all rooms
  const currentRoomOnlineUsers = users.filter(u => {
    if (u.isBanned) return false;
    if (u.role === 'owner' && u.isStealth && currentUser?.role !== 'owner') return false;
    if (u.onlineStatus === 'offline') return false;
    return (u.currentRoomId || 'room-general') === currentRoom.id;
  });

  const allVisibleOnlineUsers = users.filter(u => {
    if (u.isBanned) return false;
    if (u.role === 'owner' && u.isStealth && currentUser?.role !== 'owner') return false;
    if (u.onlineStatus === 'offline') return false;
    return true;
  });

  return (
    <footer className="bg-black text-white border-t border-slate-800 px-3 py-1.5 select-none z-20 shadow-2xl">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Right Side (DOM 1st in RTL): Bottom Navigation Tabs (المتواجدين - الغرف - خيارات) */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Online Users (👥 المتواجدين) - Far Right in RTL */}
          <button
            onClick={() => {
              setIsOnlineListOpen(!isOnlineListOpen);
              if (isRoomsListOpen) setIsRoomsListOpen(false);
            }}
            className={`flex flex-col items-center justify-center text-[11px] font-medium transition-colors cursor-pointer group relative ${
              isOnlineListOpen ? 'text-amber-400' : 'text-slate-300 hover:text-white'
            }`}
            title={`المتواجدين في ${currentRoom.name} (${currentRoomOnlineUsers.length}) | الإجمالي (${allVisibleOnlineUsers.length})`}
          >
            <div className="relative">
              <Users className={`w-5 h-5 transition-colors ${isOnlineListOpen ? 'text-amber-400' : 'text-slate-300 group-hover:text-amber-400'}`} />
              <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[9px] font-black px-1 rounded-full min-w-[16px] text-center">
                {currentRoomOnlineUsers.length}
              </span>
            </div>
            <span>المتواجدين</span>
          </button>

          {/* Rooms (🏠 الغرف) */}
          <button
            onClick={() => {
              setIsRoomsListOpen(!isRoomsListOpen);
              if (isOnlineListOpen) setIsOnlineListOpen(false);
            }}
            className={`flex flex-col items-center justify-center text-[11px] font-medium transition-colors cursor-pointer group ${
              isRoomsListOpen ? 'text-amber-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Home className={`w-5 h-5 transition-colors ${isRoomsListOpen ? 'text-amber-400' : 'text-slate-300 group-hover:text-amber-400'}`} />
            <span>الغرف</span>
          </button>

          {/* Options / Settings (⚙️ خيارات) */}
          <button
            onClick={() => setIsProfileSettingsOpen(true)}
            className="flex flex-col items-center justify-center text-[11px] font-medium text-slate-300 hover:text-white transition-colors cursor-pointer group"
          >
            <Settings className="w-5 h-5 text-slate-300 group-hover:text-amber-400 transition-colors" />
            <span>خيارات</span>
          </button>
        </div>

        {/* Left Side (DOM 2nd in RTL): Radio Station Audio Widget */}
        <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded-full">
          <button
            onClick={() => setIsPlayingRadio(!isPlayingRadio)}
            className="w-6 h-6 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-amber-400 cursor-pointer transition-transform active:scale-90"
            title="تشغيل بث المحطة الصوتية"
          >
            {isPlayingRadio ? <Volume2 className="w-3.5 h-3.5 animate-pulse text-amber-400" /> : <Play className="w-3.5 h-3.5 translate-x-0.5" />}
          </button>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[11px] font-bold text-sky-400">محطة</span>
            <span className="text-[11px] font-semibold text-slate-200 truncate max-w-[100px] sm:max-w-[140px]">
              {currentRoom.name}
            </span>
          </div>

          <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-700 shrink-0 flex items-center justify-center bg-slate-800">
            {currentUser.avatar && currentUser.avatar.trim() !== '' ? (
              <img
                src={currentUser.avatar}
                alt="المحطة"
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <User className="w-3 h-3 text-slate-400" />
            )}
          </div>
        </div>

      </div>
    </footer>
  );
};
