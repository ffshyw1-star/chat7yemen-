import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import { User } from '../types';
import { getRankEmoji, getRankEmojiClass, isSystemUser } from '../utils/permissions';
import { NEON_COLORS } from './ProfileEditorModal';
import { UserPlus, Home, Search, X, Users, Check, MapPin } from 'lucide-react';

type SortMode = 'random' | 'new_members' | 'last_seen' | 'username' | 'rank';

export const OnlineList: React.FC = () => {
  const {
    users, currentUser, currentRoom, rooms, setIsOnlineListOpen,
    setSelectedUserForCard, setIsFriendRequestsOpen, setIsRoomsListOpen,
    banList, ipModerations, siteSettings
  } = useChat();

  const [activeTab, setActiveTab] = useState<'online' | 'search'>('online');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'male' | 'female' | 'admin' | 'vip' | 'visitor'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sortMode, setSortMode] = useState<SortMode>('rank');
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);

  // Precise Rank Hierarchy Weight according to user specifications
  const getUserRankWeight = (u: User): number => {
    if (u.role === 'owner') return 100;
    if (isSystemUser(u)) return 90;
    if (u.role === 'admin') return 80;
    if (u.role === 'management') return 70;
    if (u.role === 'moderator') return 60;
    if (u.role === 'vip') return 50;
    if (u.role === 'member') return 40;
    if (u.role === 'visitor') return 10;
    return 0;
  };

  // Helper to determine if user should appear in the online list based on owner timeout setting
  const isUserConsideredOnline = (u: User): boolean => {
    if (u.onlineStatus === 'online') return true;
    const timeoutHours = siteSettings?.onlinePresenceTimeoutHours || 0;
    if (timeoutHours > 0 && u.lastSeenTimestamp) {
      const diffHours = (Date.now() - u.lastSeenTimestamp) / (1000 * 60 * 60);
      return diffHours <= timeoutHours;
    }
    return false;
  };

  // Filter stealth mode owners unless logged in as owner, and filter out banned users
  const baseUsers = users.filter(u => {
    if (u.isBanned) return false;
    if (banList && (banList.includes(u.id) || (u.ip && banList.includes(u.ip)))) return false;
    if (ipModerations && ipModerations.some(rec => rec.type === 'ban' && (rec.targetUserId === u.id || (u.ip && rec.ip === u.ip)))) return false;
    if (u.role === 'owner' && u.isStealth && currentUser?.role !== 'owner') {
      return false;
    }
    return true;
  });

  const allOnlineUsers = baseUsers.filter(u => isUserConsideredOnline(u));

  // Filter users based on search query, type filter, and status filter
  const filteredUsers = baseUsers.filter(u => {
    // In online tab, filter by presence
    if (activeTab === 'online') {
      if (!isUserConsideredOnline(u)) return false;
    }

    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      if (!u.username.toLowerCase().includes(q)) return false;
    }

    // 3. Gender/Role Filter
    if (selectedTypeFilter === 'male') return u.gender === 'male';
    if (selectedTypeFilter === 'female') return u.gender === 'female';
    if (selectedTypeFilter === 'admin') return ['owner', 'admin', 'management', 'moderator'].includes(u.role);
    if (selectedTypeFilter === 'vip') return u.role === 'vip';
    if (selectedTypeFilter === 'visitor') return u.role === 'visitor';

    // 4. Status Filter
    if (statusFilter === 'active') return u.onlineStatus === 'online';
    if (statusFilter === 'inactive') return u.onlineStatus !== 'online';

    return true;
  });

  // Apply Sort Mode
  const getSortedUsers = (): User[] => {
    const list = [...filteredUsers];

    switch (sortMode) {
      case 'random':
        return list.sort((a, b) => {
          const hashA = a.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const hashB = b.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          return (hashA % 17) - (hashB % 17);
        });

      case 'new_members': {
        // Display users who joined within the last 8 hours, sorted newest first
        const EIGHT_HOURS_MS = 8 * 60 * 60 * 1000;
        const now = Date.now();
        const newMembersList = list.filter(u => {
          if (u.joinedTimestamp) {
            return (now - u.joinedTimestamp) <= EIGHT_HOURS_MS;
          }
          return true;
        });
        return newMembersList.sort((a, b) => {
          const timeA = a.joinedTimestamp || 0;
          const timeB = b.joinedTimestamp || 0;
          if (timeA !== timeB) return timeB - timeA;
          return (b.id || '').localeCompare(a.id || '');
        });
      }

      case 'last_seen': {
        // Display users active in the site or within the last 1 hour, sorted latest first
        const ONE_HOUR_MS = 1 * 60 * 60 * 1000;
        const now = Date.now();
        const activeOrRecentList = list.filter(u => {
          if (u.onlineStatus === 'online') return true;
          if (u.lastSeenTimestamp) {
            return (now - u.lastSeenTimestamp) <= ONE_HOUR_MS;
          }
          return false;
        });
        return activeOrRecentList.sort((a, b) => {
          if (a.onlineStatus === 'online' && b.onlineStatus !== 'online') return -1;
          if (a.onlineStatus !== 'online' && b.onlineStatus === 'online') return 1;
          const timeA = a.lastSeenTimestamp || 0;
          const timeB = b.lastSeenTimestamp || 0;
          if (timeA !== timeB) return timeB - timeA;
          return a.username.localeCompare(b.username, 'ar');
        });
      }

      case 'username':
        return list
          .filter(u => u.role !== 'visitor')
          .sort((a, b) => a.username.localeCompare(b.username, 'ar'));

      case 'rank':
      default:
        return list.sort((a, b) => {
          const diff = getUserRankWeight(b) - getUserRankWeight(a);
          if (diff !== 0) return diff;
          return a.username.localeCompare(b.username, 'ar');
        });
    }
  };

  const sortedUsers = getSortedUsers();

  const sortModeLabels: Record<SortMode, string> = {
    random: 'عشوائي',
    new_members: 'اعضاء جدد',
    last_seen: 'اخر ظهور',
    username: 'اسم المستخدم',
    rank: 'مستوى العضو'
  };

  const handleClose = () => {
    if (isSortModalOpen) {
      setIsSortModalOpen(false);
      return;
    }
    if (activeTab === 'search') {
      setActiveTab('online');
      return;
    }
    setIsOnlineListOpen(false);
  };

  return (
    <div className="w-full h-full bg-white flex flex-col select-none relative text-slate-800">
      
      {/* 1. Top Bar Navigation */}
      <div className="p-2.5 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
        
        {/* Right Side in RTL: Action Icons */}
        <div className="flex items-center gap-2">
          {/* Online Users Tab (👥) */}
          <button
            onClick={() => {
              setActiveTab('online');
              setIsSortModalOpen(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'online'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
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

          {/* Rooms List (🏠) */}
          <button
            onClick={() => {
              setIsRoomsListOpen(true);
              setIsOnlineListOpen(false);
            }}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
            title="قائمة الغرف"
          >
            <Home className="w-5 h-5" />
          </button>

          {/* Search Button (🔍) */}
          <button
            onClick={() => {
              setActiveTab(activeTab === 'search' ? 'online' : 'search');
              setIsSortModalOpen(false);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'search'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
            }`}
            title="البحث عن مستخدمين"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Left Side in RTL: X Close Button */}
        <button
          onClick={handleClose}
          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          title="إغلاق X"
        >
          <X className="w-5 h-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 2. Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">

        {/* View A: Online Users Default View ('online') */}
        {activeTab === 'online' && (
          <div>
            {sortedUsers.length === 0 ? (
              <div className="text-center py-12 px-4 text-slate-400 space-y-2">
                <Users className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-xs font-semibold">
                  لا يوجد متواجدون متصلون حالياً
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sortedUsers.map((user) => {
                  const userRoom = rooms.find(r => r.id === (user.currentRoomId || 'room-general')) || currentRoom;
                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUserForCard(user)}
                      className="px-3 py-2.5 hover:bg-sky-50/60 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      {/* Right side in RTL: Avatar + Username & Subtitle */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* User Avatar */}
                        <div className="relative shrink-0">
                          <UserAvatar
                            avatarUrl={user.avatar}
                            gender={user.gender}
                            role={user.role}
                            username={user.username}
                            size="md"
                          />
                        </div>

                        {/* Name & Bio & Location Badge */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              style={{
                                color: user.usernameColor || undefined,
                                fontSize: user.usernameFontSize || undefined,
                                textShadow: NEON_COLORS.some(n => n.value.toLowerCase() === (user.usernameColor || '').toLowerCase())
                                  ? `0 0 6px ${user.usernameColor}`
                                  : 'none'
                              }}
                              className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-sky-600 transition-colors"
                            >
                              {user.username}
                            </span>
                            {user.role === 'owner' && user.isStealth && (
                              <span className="text-[10px] bg-purple-100 text-purple-700 border border-purple-300 px-1.5 py-0.2 rounded font-black">
                                مخفي 🕵️‍♂️
                              </span>
                            )}
                            <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded font-medium flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-sky-600" />
                              {userRoom.name}
                            </span>
                          </div>

                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {user.statusMessage || user.bio || `${user.countryFlag || '🇾🇪'} ${user.country || 'اليمن'}`}
                          </p>
                        </div>
                      </div>

                      {/* Left side in RTL: Rank Icon (Crown 👑, Android 🤖, Shield 🛡️, Diamond 💎) */}
                      <div className="shrink-0 pl-1">
                        {!isSystemUser(user) && (
                          <span className={`text-lg sm:text-xl shrink-0 ${getRankEmojiClass(user.role, user.username)}`}>
                            {getRankEmoji(user.role, user.username)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View B: Search Users View ('search') */}
        {activeTab === 'search' && (
          <div className="p-3 space-y-3">
            <h3 className="text-sm font-black text-slate-800">البحث عن مستخدمين</h3>

            {/* Search Input Box */}
            <div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="اكتب اسم للبحث هنا"
                className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-sky-500 transition-all"
              />
            </div>

            {/* Filter Dropdowns Row */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              
              {/* Left Dropdown: النوع */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">النوع</label>
                <select
                  value={selectedTypeFilter}
                  onChange={(e) => setSelectedTypeFilter(e.target.value as any)}
                  className="w-full bg-slate-100 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:outline-none focus:bg-white cursor-pointer"
                >
                  <option value="all">الجميع</option>
                  <option value="male">ذكور</option>
                  <option value="female">إناث</option>
                  <option value="admin">إدارة</option>
                  <option value="vip">مميز</option>
                  <option value="visitor">زوار</option>
                </select>
              </div>

              {/* Right Dropdown Button: ترتيب حسب */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 block">ترتيب حسب</label>
                <button
                  onClick={() => setIsSortModalOpen(true)}
                  className="w-full bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 font-bold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="truncate">{sortModeLabels[sortMode]}</span>
                  <span className="text-[10px] text-slate-400 mr-1">▼</span>
                </button>
              </div>
            </div>

            {/* Search Results List */}
            <div className="pt-2 divide-y divide-slate-100">
              {sortedUsers.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  لا توجد نتائج مطابقة للبحث
                </div>
              ) : (
                sortedUsers.map((user) => {
                  const userRoom = rooms.find(r => r.id === (user.currentRoomId || 'room-general')) || currentRoom;
                  return (
                    <div
                      key={user.id}
                      onClick={() => setSelectedUserForCard(user)}
                      className="py-2.5 px-2 hover:bg-sky-50/60 transition-colors cursor-pointer flex items-center justify-between gap-2.5 group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {sortMode === 'new_members' && (
                          <span className="text-base shrink-0 animate-bounce text-sky-500" title="عضو جديد">
                            🖐️
                          </span>
                        )}

                        {!isSystemUser(user) && (
                          <span className={`text-base shrink-0 ${getRankEmojiClass(user.role, user.username)}`}>
                            {getRankEmoji(user.role, user.username)}
                          </span>
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span
                              style={{
                                color: user.usernameColor || undefined,
                                fontSize: user.usernameFontSize || undefined,
                              }}
                              className="text-xs sm:text-sm font-bold text-slate-900 truncate group-hover:text-sky-600 transition-colors block"
                            >
                              {user.username}
                            </span>
                            <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded flex items-center gap-0.5">
                              <MapPin className="w-2 h-2 text-sky-600" />
                              {userRoom.name}
                            </span>
                          </div>
                          
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">
                            {user.statusMessage || user.bio || `${user.countryFlag || '🇸🇦'} ${user.country || 'اليمن'}`}
                          </p>
                        </div>
                      </div>

                      <div className="relative shrink-0">
                        <UserAvatar
                          avatarUrl={user.avatar}
                          gender={user.gender}
                          role={user.role}
                          username={user.username}
                          size="sm"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        )}

      </div>

      {/* 4. Sort Mode Picker Modal Overlay */}
      {isSortModalOpen && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl p-4 w-full max-w-xs border border-slate-200 animate-in zoom-in-95 duration-150 text-slate-800">
            
            <div className="space-y-1">
              {(
                [
                  { id: 'random', label: 'عشوائي' },
                  { id: 'new_members', label: 'اعضاء جدد' },
                  { id: 'last_seen', label: 'اخر ظهور' },
                  { id: 'username', label: 'اسم المستخدم' },
                  { id: 'rank', label: 'مستوى العضو' },
                ] as { id: SortMode; label: string }[]
              ).map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    setSortMode(option.id);
                    setIsSortModalOpen(false);
                  }}
                  className={`w-full text-right px-3 py-2.5 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                    sortMode === option.id
                      ? 'bg-sky-50 text-sky-600 font-extrabold'
                      : 'hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{option.label}</span>
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      sortMode === option.id
                        ? 'border-sky-600 bg-sky-600'
                        : 'border-slate-300'
                    }`}
                  >
                    {sortMode === option.id && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                  </div>
                </button>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
