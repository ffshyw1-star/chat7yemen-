import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { RoomActivityType } from '../types';
import { isStaff, isManagementOrHigher, isAdminOrOwner, getRankEmoji, getRankTitle } from '../utils/permissions';
import { toEnglishDigits } from '../utils/dateUtils';
import {
  X, Search, Shield, Filter, RotateCcw, Trash2, Calendar,
  MessageSquareX, UserCheck, UserX, AlertTriangle, ShieldCheck,
  BookOpen, Users, VolumeX, Ban
} from 'lucide-react';

export const RoomLogsModal: React.FC = () => {
  const {
    currentUser,
    rooms,
    roomActivityLogs,
    setIsRoomLogsOpen,
    clearRoomActivityLogs
  } = useChat();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const hasManagementAccess = isManagementOrHigher(currentUser);

  // Filter logs based on search, room, and category
  const filteredLogs = roomActivityLogs.filter((log) => {
    // Room filter
    if (selectedRoomId !== 'all' && log.roomId !== selectedRoomId) {
      return false;
    }

    // Category filter
    if (selectedCategory === 'join_leave') {
      if (log.actionType !== 'join' && log.actionType !== 'leave') return false;
    } else if (selectedCategory === 'deleted') {
      if (log.actionType !== 'delete_message' && log.actionType !== 'clear_chat') return false;
    } else if (selectedCategory === 'rules') {
      if (log.actionType !== 'update_rules' && log.actionType !== 'room_created') return false;
    } else if (selectedCategory === 'mod') {
      if (!['mute', 'unmute', 'kick', 'unkick', 'ban', 'role_change'].includes(log.actionType)) return false;
    }

    // Search query match
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      const matchActor = log.actorName.toLowerCase().includes(q);
      const matchTarget = log.targetName?.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchRoom = log.roomName.toLowerCase().includes(q);
      if (!matchActor && !matchTarget && !matchDetails && !matchRoom) {
        return false;
      }
    }

    return true;
  });

  // Calculate stats
  const totalEvents = roomActivityLogs.length;
  const deletedCount = roomActivityLogs.filter(l => l.actionType === 'delete_message' || l.actionType === 'clear_chat').length;
  const modCount = roomActivityLogs.filter(l => ['mute', 'kick', 'ban'].includes(l.actionType)).length;

  const getActionBadge = (type: RoomActivityType) => {
    switch (type) {
      case 'join':
        return { label: 'انضمام 🟢', bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40', icon: UserCheck };
      case 'leave':
        return { label: 'مغادرة 🚪', bg: 'bg-slate-800/80 text-slate-300 border-slate-700', icon: UserX };
      case 'delete_message':
        return { label: 'حذف رسالة 🗑️', bg: 'bg-rose-950/80 text-rose-300 border-rose-500/40', icon: MessageSquareX };
      case 'clear_chat':
        return { label: 'تنظيف العام 🧹', bg: 'bg-purple-950/80 text-purple-300 border-purple-500/40', icon: Trash2 };
      case 'update_rules':
        return { label: 'تحديث القوانين 📜', bg: 'bg-amber-950/80 text-amber-300 border-amber-500/40', icon: BookOpen };
      case 'mute':
        return { label: 'كتم 🔇', bg: 'bg-yellow-950/80 text-yellow-300 border-yellow-500/40', icon: VolumeX };
      case 'kick':
        return { label: 'طرد 👢', bg: 'bg-orange-950/80 text-orange-300 border-orange-500/40', icon: AlertTriangle };
      case 'ban':
        return { label: 'حظر 🚫', bg: 'bg-red-950/80 text-red-300 border-red-500/40', icon: Ban };
      case 'role_change':
        return { label: 'تغيير رتبة 👑', bg: 'bg-blue-950/80 text-blue-300 border-blue-500/40', icon: ShieldCheck };
      default:
        return { label: 'نشاط 📋', bg: 'bg-slate-800 text-slate-300 border-slate-700', icon: Shield };
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Modal Header */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>سجل نشاطات الغرفة للمشرفين</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  حصري للمشرفين 🛡️
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                متابعة حركة الغرف، الرسائل المحذوفة، انضمام ومغادرة الأعضاء، وتوثيق الإجراءات الإدارية.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsRoomLogsOpen(false)}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Access Gate Check */}
        {!hasManagementAccess ? (
          <div className="flex-1 p-6 flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-4 rounded-full bg-red-950/60 text-red-400 border border-red-500/30">
              <AlertTriangle className="w-12 h-12" />
            </div>
            <div className="max-w-md">
              <h3 className="text-base font-bold text-red-400 mb-1">وصول محظور ⛔</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                سجل نشاطات الغرفة متاح حصرياً لرتب الإدارة فما فوق (إدارة، أدمن ⭐، مالك 👑).
                يرجى الترقية أو التواصل مع مالك الشات للحصول على صلاحيات الإدارة.
              </p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0">
            {/* Top Stats Overview Bar */}
            <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/50 border-b border-slate-800 text-center text-xs">
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">إجمالي الأنشطة المسجلة</span>
                <span className="text-sm font-extrabold text-amber-400">{totalEvents}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">الرسائل المحذوفة</span>
                <span className="text-sm font-extrabold text-rose-400">{deletedCount}</span>
              </div>
              <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">إجراءات الرقابة والكتم</span>
                <span className="text-sm font-extrabold text-amber-300">{modCount}</span>
              </div>
            </div>

            {/* Filter and Search Bar Controls */}
            <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2">
                {/* Search Input */}
                <div className="flex-1 relative">
                  <Search className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="بحث باسم المشرف، العضو، أو التفاصيل..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Room Filter Dropdown */}
                <div className="w-full sm:w-48 relative">
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="all">جميع الغرف (الكل)</option>
                    {rooms.map(room => (
                      <option key={room.id} value={room.id}>
                        {room.flag} {room.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action Category Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  الكل ({roomActivityLogs.length})
                </button>

                <button
                  onClick={() => setSelectedCategory('join_leave')}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1 ${
                    selectedCategory === 'join_leave'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>انضمام / مغادرة</span>
                </button>

                <button
                  onClick={() => setSelectedCategory('deleted')}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1 ${
                    selectedCategory === 'deleted'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <MessageSquareX className="w-3.5 h-3.5" />
                  <span>الرسائل المحذوفة</span>
                </button>

                <button
                  onClick={() => setSelectedCategory('rules')}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1 ${
                    selectedCategory === 'rules'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>القوانين والتعليمات</span>
                </button>

                <button
                  onClick={() => setSelectedCategory('mod')}
                  className={`px-3 py-1 rounded-lg font-bold shrink-0 transition-colors flex items-center gap-1 ${
                    selectedCategory === 'mod'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>الإشراف والعقوبات</span>
                </button>
              </div>
            </div>

            {/* Log Entries Main List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {filteredLogs.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-slate-500 text-xs">
                  <Filter className="w-8 h-8 mb-2 opacity-50" />
                  <span>لا توجد سجلات تطابق معايير البحث المحددة.</span>
                </div>
              ) : (
                filteredLogs.map((log) => {
                  const badge = getActionBadge(log.actionType);
                  const IconComp = badge.icon;

                  return (
                    <div
                      key={log.id}
                      className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-3 rounded-xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-sm"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Type Icon Badge */}
                        <div className={`p-2 rounded-xl border shrink-0 mt-0.5 ${badge.bg}`}>
                          <IconComp className="w-4 h-4" />
                        </div>

                        {/* Log Info Body */}
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Actor Username */}
                            <span className="font-bold text-xs text-slate-100 flex items-center gap-1">
                              <span>{getRankEmoji(log.actorRole)}</span>
                              <span>{log.actorName}</span>
                            </span>

                            {/* Action Type Badge */}
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${badge.bg}`}>
                              {badge.label}
                            </span>

                            {/* Room Name */}
                            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-lg border border-slate-700">
                              {log.roomName}
                            </span>

                            {log.targetName && (
                              <span className="text-[10px] text-amber-400 bg-amber-950/40 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                المستهدف: {log.targetName}
                              </span>
                            )}
                          </div>

                          {/* Details Content */}
                          <p className="text-xs text-slate-300 leading-relaxed break-words">
                            {log.details}
                          </p>
                        </div>
                      </div>

                      {/* Timestamp & Date */}
                      <div className="text-[10px] text-slate-500 shrink-0 self-end sm:self-center font-mono bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        <span>{toEnglishDigits(log.timestamp)}</span>
                        <span>•</span>
                        <span>{toEnglishDigits(log.date)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom Actions Footer */}
            <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                يعرض <strong className="text-amber-400">{filteredLogs.length}</strong> من إجمالي <strong className="text-slate-200">{roomActivityLogs.length}</strong> سجلاً
              </span>

              <div className="flex items-center gap-2">
                {isAdminOrOwner(currentUser) && roomActivityLogs.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('هل أنت تأكد من مسح جميع سجلات الغرف؟ لا يمكن التراجع.')) {
                        clearRoomActivityLogs();
                      }
                    }}
                    className="bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-500/30 text-xs px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>مسح السجل</span>
                  </button>
                )}

                <button
                  onClick={() => setIsRoomLogsOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-4 py-1.5 rounded-xl transition-colors"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
