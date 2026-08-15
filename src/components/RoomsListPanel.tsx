import React from 'react';
import { useChat } from '../context/ChatContext';
import { X, Users, UserPlus, Home, Search, Globe, User } from 'lucide-react';

export const RoomsListPanel: React.FC = () => {
  const {
    rooms, currentRoom, switchRoom,
    setIsRoomsListOpen, setIsOnlineListOpen, setIsFriendRequestsOpen, users
  } = useChat();

  // Calculate user count for each room & sort descending
  const roomsWithCounts = rooms.map(room => {
    const activeInRoom = users.filter(u => u.currentRoomId === room.id).length;
    const totalCount = (room.baseUserCount || 0) + activeInRoom;
    return { ...room, totalCount };
  }).sort((a, b) => b.totalCount - a.totalCount);

  return (
    <div className="w-full h-full bg-white flex flex-col select-none text-slate-800">
      
      {/* 1. Top Navigation Bar (matching arabsyemen.com header in Screenshot 2) */}
      <div className="p-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        
        {/* Right Side in RTL: Navigation Action Icons */}
        <div className="flex items-center gap-2">
          {/* Online Users Button (👥) */}
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

          {/* Add Friends Button (👤+) */}
          <button
            onClick={() => setIsFriendRequestsOpen(true)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="أصدقاء وطلبات"
          >
            <UserPlus className="w-5 h-5 text-emerald-600" />
          </button>

          {/* Rooms List Button (🏠) - Active State */}
          <button
            className="p-2 bg-slate-800 text-white rounded-xl shadow-xs transition-all cursor-pointer"
            title="قائمة الغرف"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Search Button (🔍) */}
          <button
            onClick={() => {
              setIsOnlineListOpen(true);
              setIsRoomsListOpen(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="بحث عن مستخدمين"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Left Side in RTL: X Close Button */}
        <button
          onClick={() => setIsRoomsListOpen(false)}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          title="إغلاق X"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. Room List Rows (matching Screenshot 2) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100 bg-white">
        {roomsWithCounts.map((room) => {
          const isActive = room.id === currentRoom.id;
          return (
            <div
              key={room.id}
              onClick={() => {
                switchRoom(room.id);
                if (window.innerWidth < 640) setIsRoomsListOpen(false);
              }}
              className={`px-4 py-3 flex items-center justify-between transition-colors cursor-pointer ${
                isActive
                  ? 'bg-sky-50/90 hover:bg-sky-100/90'
                  : 'bg-white hover:bg-slate-50'
              }`}
            >
              {/* Right Side in RTL: Blue Globe Icon & Room Name */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-full bg-[#0284c7] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Globe className="w-4.5 h-4.5 stroke-[2.2]" />
                </div>
                <span className="text-slate-800 font-bold text-sm sm:text-base truncate">
                  {room.name}
                </span>
              </div>

              {/* Left Side in RTL: Sky Blue User Icon & Member Count */}
              <div className="flex items-center gap-1.5 text-[#0284c7] font-extrabold text-sm sm:text-base shrink-0">
                <User className="w-4 h-4 fill-[#0284c7] text-[#0284c7]" />
                <span>{room.totalCount}</span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};
