import React from 'react';
import { useChat } from '../context/ChatContext';
import {
  X, Users, UserPlus, Home, Globe, User, Lock,
  Crown, Flame, Heart, Music, Gamepad2, Coffee, Sparkles, Trophy, Shield, MessageSquare, Gem, Star
} from 'lucide-react';

export const RoomsListPanel: React.FC = () => {
  const {
    rooms, currentRoom, switchRoom,
    setIsRoomsListOpen, setIsOnlineListOpen, setIsFriendRequestsOpen, users, currentUser
  } = useChat();

  // Calculate real-time active user count for each room
  const roomsWithCounts = rooms.map(room => {
    const activeInRoom = users.filter(u => {
      if (u.isBanned) return false;
      if (u.role === 'owner' && u.isStealth && currentUser?.role !== 'owner') return false;
      return (u.currentRoomId || 'room-general') === room.id && u.onlineStatus !== 'offline';
    }).length;
    return { ...room, totalCount: activeInRoom };
  });

  return (
    <div className="w-full h-full bg-white flex flex-col select-none text-slate-800 dir-rtl">
      
      {/* 1. Top Bar Navigation matching OnlineList */}
      <div className="p-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        
        {/* Right Side in RTL: Action Icons */}
        <div className="flex items-center gap-2">
          {/* Online Users Tab (👥) */}
          <button
            onClick={() => {
              setIsOnlineListOpen(true);
              setIsRoomsListOpen(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="المتواجدين"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Add Friends Modal (👤+) */}
          <button
            onClick={() => setIsFriendRequestsOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="أصدقاء وطلبات"
          >
            <UserPlus className="w-5 h-5 text-emerald-600" />
          </button>

          {/* Rooms List (🏠) - Active */}
          <button
            className="p-2 bg-slate-800 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            title="قائمة الغرف"
          >
            <Home className="w-5 h-5" />
          </button>
        </div>

        {/* Left Side in RTL: Close X button */}
        <button
          onClick={() => setIsRoomsListOpen(false)}
          className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 2. Room List Rows */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 bg-white">
        {roomsWithCounts.map((room) => {
          const isActive = room.id === currentRoom.id;
          const isLocked = Boolean(room.isLocked || (room.password && room.password.trim() !== ''));
          const isDiamond = room.roomType === 'diamond' || room.customIcon === 'diamond';
          const isAdminRoom = room.roomType === 'admin' || room.customIcon === 'admin_star';

          return (
            <div
              key={room.id}
              onClick={() => {
                if (isActive) {
                  setIsRoomsListOpen(false);
                  return;
                }
                const success = switchRoom(room.id);
                if (success) {
                  setIsRoomsListOpen(false);
                }
              }}
              className={`px-3.5 py-3 flex items-center justify-between transition-all cursor-pointer group ${
                isActive
                  ? 'bg-slate-50'
                  : 'bg-white hover:bg-slate-50'
              }`}
            >
              {/* Flag / Icon + Name & Description */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="relative shrink-0 flex items-center justify-center">
                  {room.flag ? (
                    <span className="text-2xl leading-none select-none">
                      {room.flag}
                    </span>
                  ) : room.iconUrl ? (
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-sky-300 shadow-2xs flex items-center justify-center bg-slate-100">
                      <img
                        src={room.iconUrl}
                        alt={room.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : room.customIcon === 'crown' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-2xs">
                      <Crown className="w-4 h-4" />
                    </div>
                  ) : room.customIcon === 'flame' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shadow-2xs">
                      <Flame className="w-4 h-4" />
                    </div>
                  ) : room.customIcon === 'heart' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 text-white flex items-center justify-center shadow-2xs">
                      <Heart className="w-4 h-4" />
                    </div>
                  ) : room.customIcon === 'music' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-2xs">
                      <Music className="w-4 h-4" />
                    </div>
                  ) : room.customIcon === 'game' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-2xs">
                      <Gamepad2 className="w-4 h-4" />
                    </div>
                  ) : room.customIcon === 'coffee' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-700 to-amber-900 text-white flex items-center justify-center shadow-2xs">
                      <Coffee className="w-4 h-4" />
                    </div>
                  ) : room.customIcon === 'sparkles' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white flex items-center justify-center shadow-2xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  ) : room.customIcon === 'trophy' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-500 to-amber-600 text-white flex items-center justify-center shadow-2xs">
                      <Trophy className="w-4 h-4" />
                    </div>
                  ) : room.customIcon === 'shield' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-slate-700 text-white flex items-center justify-center shadow-2xs">
                      <Shield className="w-4 h-4" />
                    </div>
                  ) : room.customIcon === 'message' ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 text-white flex items-center justify-center shadow-2xs">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                  ) : isDiamond ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white flex items-center justify-center shadow-2xs">
                      <Gem className="w-4 h-4" />
                    </div>
                  ) : isAdminRoom ? (
                    <div className="w-8 h-8 rounded-full bg-rose-50 border-2 border-rose-500 flex items-center justify-center shadow-2xs">
                      <Star className="w-4 h-4 text-rose-600 fill-white stroke-[2.2]" />
                    </div>
                  ) : (
                    <div className={`w-8 h-8 rounded-full ${isLocked ? 'bg-amber-600' : 'bg-[#0284c7]'} text-white flex items-center justify-center shadow-2xs`}>
                      <Globe className="w-4.5 h-4.5 stroke-[2.2]" />
                    </div>
                  )}

                  {isLocked && (
                    <span className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full p-0.5 border border-white shadow-2xs" title="غرفة مقفلة">
                      <Lock className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Name and Badges */}
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-sm sm:text-base truncate ${isActive ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>
                      {room.name}
                    </span>

                    {isActive && (
                      <span className="text-[10px] bg-sky-100 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-bold shrink-0">
                        الحالية
                      </span>
                    )}

                    {isDiamond && (
                      <span className="text-[10px] bg-cyan-50 text-cyan-700 border border-cyan-200 px-1 py-0.2 rounded font-bold shrink-0">
                        💎 ماسية
                      </span>
                    )}

                    {isAdminRoom && (
                      <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-1 py-0.2 rounded font-bold shrink-0">
                        ⭐ إدارة
                      </span>
                    )}

                    {isLocked && (
                      <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-1 py-0.2 rounded shrink-0">
                        <Lock className="w-2.5 h-2.5 text-red-600" />
                        <span>مغلقة</span>
                      </span>
                    )}
                  </div>

                  {room.description && (
                    <span className="text-[11px] text-slate-400 truncate max-w-[220px] sm:max-w-[260px]">
                      {room.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Online Count */}
              <div className="flex items-center gap-1.5 text-sky-600 font-bold text-sm shrink-0 bg-sky-50 px-2 py-1 rounded-lg">
                <User className="w-3.5 h-3.5 fill-sky-600 text-sky-600" />
                <span>{room.totalCount}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
