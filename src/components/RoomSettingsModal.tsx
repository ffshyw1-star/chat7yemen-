import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import {
  X, Settings, VolumeX, ShieldAlert, Key, Edit3, Check,
  UserX, Search, Sparkles, Lock, Unlock, AlertCircle
} from 'lucide-react';
import { getRankEmoji } from '../utils/permissions';

export const RoomSettingsModal: React.FC = () => {
  const {
    currentUser,
    rooms,
    currentRoom,
    users,
    isRoomSettingsOpen,
    setIsRoomSettingsOpen,
    updateRoomDetails,
    muteUserInRoom,
    unmuteUserInRoom,
    kickUserFromRoom,
    unkickUserFromRoom
  } = useChat();

  const [selectedRoomId, setSelectedRoomId] = useState<string>(currentRoom.id);
  const [activeTab, setActiveTab] = useState<'settings' | 'mutes' | 'kicks'>('settings');

  // Form State for General Settings
  const [roomName, setRoomName] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');

  // Quick action selectors for Mute & Kick
  const [userToMuteId, setUserToMuteId] = useState('');
  const [userToKickId, setUserToKickId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const targetRoom = rooms.find(r => r.id === selectedRoomId) || currentRoom;

  useEffect(() => {
    if (targetRoom) {
      setRoomName(targetRoom.name || '');
      setRoomDescription(targetRoom.description || '');
      setRoomPassword(targetRoom.password || '');
    }
  }, [selectedRoomId, targetRoom]);

  if (!isRoomSettingsOpen || !currentUser) return null;

  const isManagementOrHigher = ['management', 'admin', 'owner'].includes(currentUser.role);

  if (!isManagementOrHigher) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-red-500/30 rounded-3xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
          <ShieldAlert className="w-12 h-12 text-red-400 mx-auto" />
          <h3 className="text-lg font-bold text-slate-100">غير مصرح لك بالوصول</h3>
          <p className="text-xs text-slate-400">خاصية إعدادات الغرفة مخصصة لرتب الإدارة والمالك فقط.</p>
          <button
            onClick={() => setIsRoomSettingsOpen(false)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold py-2 px-6 rounded-xl transition-all"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  // Handle Save Room General Details
  const handleSaveGeneralDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      alert('الرجاء إدخال اسم الغرفة');
      return;
    }

    updateRoomDetails(selectedRoomId, {
      name: roomName.trim(),
      description: roomDescription.trim(),
      password: roomPassword.trim(),
      isLocked: Boolean(roomPassword.trim())
    });

    setSaveSuccess('تم حفظ إعدادات الغرفة بنجاح 🔒✨');
    setTimeout(() => setSaveSuccess(''), 3000);
  };

  // Muted users list
  const mutedUserIds = targetRoom.mutedUsers || [];
  const mutedUsers = users.filter(u => mutedUserIds.includes(u.id));

  // Kicked users list
  const kickedUserIds = targetRoom.kickedUsers || [];
  const kickedUsers = users.filter(u => kickedUserIds.includes(u.id));

  // Online users available to mute or kick in this room
  const availableUsersInRoom = users.filter(
    u => u.currentRoomId === targetRoom.id && u.id !== currentUser.id && u.role !== 'owner'
  );

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full flex flex-col max-h-[90vh] shadow-2xl overflow-hidden text-slate-100">
        
        {/* Top Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-amber-400 flex items-center gap-2">
                <span>إعدادات الغرفة</span>
                <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  {targetRoom.flag} {targetRoom.name}
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">التحكم بالاسم والرمز وقوائم الكتم والحظر</p>
            </div>
          </div>

          <button
            onClick={() => setIsRoomSettingsOpen(false)}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Room Selector Banner */}
        <div className="bg-slate-950/60 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-slate-300">اختر الغرفة للتعديل:</span>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-xs text-amber-300 font-bold rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-400 cursor-pointer"
          >
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.flag} {r.name} {r.password ? '🔐' : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Tabs Bar */}
        <div className="grid grid-cols-3 bg-slate-950 border-b border-slate-800 p-1.5 gap-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>إعدادات الغرفة</span>
          </button>

          <button
            onClick={() => setActiveTab('mutes')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'mutes'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <VolumeX className="w-4 h-4 text-amber-400" />
            <span>زر الكتم ({mutedUsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kicks')}
            className={`py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'kicks'
                ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <UserX className="w-4 h-4 text-red-400" />
            <span>الطرد من الغرفة ({kickedUsers.length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">

          {/* TAB 1: General Room Settings */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveGeneralDetails} className="space-y-4">
              
              {/* Room Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4" />
                  <span>مربع اسم الغرفة:</span>
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="اكتب اسم الغرفة..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-2.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-400 transition-colors"
                />
              </div>

              {/* Room Description Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  <span>مربع وصف الغرفة:</span>
                </label>
                <textarea
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  placeholder="اكتب وصفاً للغرفة يظهر للأعضاء..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-xs text-slate-100 focus:outline-none focus:border-amber-400 transition-colors custom-scrollbar"
                />
              </div>

              {/* Room Password / Lock */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <label className="text-xs font-extrabold text-amber-400 flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-400" />
                    <span>إقفال الغرفة بكلمة سر (رمز الدخول):</span>
                  </label>
                  {roomPassword ? (
                    <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> مقفلة برمز
                    </span>
                  ) : (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> مفتوحة للجميع
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  تكتب الرمز الذي تريده للغرفة هنا عشان ما حد يقدر يدخل للغرفة بدون كتابة الرمز المطلوب. (إذا تركت الخانة فارغة تصبح الغرفة مفتوحة للجميع).
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="أدخل رمز القفل هنا (مثال: 1234)..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                  />
                  {roomPassword && (
                    <button
                      type="button"
                      onClick={() => setRoomPassword('')}
                      className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-bold py-2 px-3 rounded-xl transition-all cursor-pointer"
                    >
                      إلغاء القفل
                    </button>
                  )}
                </div>
              </div>

              {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-xs font-bold text-center flex items-center justify-center gap-2">
                  <Check className="w-4 h-4" />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {/* Submit Save Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm py-3 rounded-2xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>حفظ التغييرات وإعدادات الغرفة</span>
              </button>
            </form>
          )}

          {/* TAB 2: Muted Users (زر الكتم) */}
          {activeTab === 'mutes' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs text-amber-300 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <VolumeX className="w-4 h-4 text-amber-400" />
                  <span>زر الكتم (المكتومين عام في الغرفة):</span>
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  المستخدم الذي تم كتمه عام في الغرفة لا يستطيع كتابة أي رسالة، فقط يستطيع مشاهدة الدردشة والتفاعل.
                </p>
              </div>

              {/* Add User to Mute Form */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-200">كتم مستخدم جديد في هذه الغرفة:</label>
                <div className="flex gap-2">
                  <select
                    value={userToMuteId}
                    onChange={(e) => setUserToMuteId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- اختر مستخدماً متواجداً للغرفة --</option>
                    {availableUsersInRoom.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({getRankEmoji(u.role)})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!userToMuteId) return;
                      muteUserInRoom(selectedRoomId, userToMuteId);
                      setUserToMuteId('');
                    }}
                    disabled={!userToMuteId}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    كتم في الغرفة 🔇
                  </button>
                </div>
              </div>

              {/* Muted Users List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>قائمة المكتومين حالياً:</span>
                  <span className="text-amber-400 font-mono">({mutedUsers.length})</span>
                </h4>

                {mutedUsers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800 text-slate-500 text-xs space-y-1">
                    <p>لا يوجد مستخدمون مكتومون في هذه الغرفة حالياً 👍</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mutedUsers.map(user => (
                      <div
                        key={user.id}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-amber-500/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            avatarUrl={user.avatar}
                            gender={user.gender}
                            role={user.role}
                            username={user.username}
                            size="sm"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-100 flex items-center gap-1">
                              <span>{user.username}</span>
                              <span className="text-[10px] text-amber-400">({getRankEmoji(user.role)})</span>
                            </p>
                            <p className="text-[10px] text-red-400 font-semibold">مكتوم عن الكتابة (مشاهدة فقط)</p>
                          </div>
                        </div>

                        {/* Unmute button ❌ */}
                        <button
                          type="button"
                          onClick={() => unmuteUserInRoom(selectedRoomId, user.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
                          title="إلغاء الكتم"
                        >
                          <span className="font-black">❌</span>
                          <span>إلغاء الكتم</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Kicked Users (الطرد من الغرفة) */}
          {activeTab === 'kicks' && (
            <div className="space-y-4">
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-2xl text-xs text-red-300 space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-red-400" />
                  <span>الطرد من الغرفة (المطرودين من الغرفة):</span>
                </p>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  المستخدم الذي تم طرده لا يستطيع دخول هذه الغرفة نهائياً إلا إذا قام أحد أفراد الإدارة بفك الطرد عنه بضغط زر ❌.
                </p>
              </div>

              {/* Add User to Kick Form */}
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-200">طرد مستخدم من هذه الغرفة:</label>
                <div className="flex gap-2">
                  <select
                    value={userToKickId}
                    onChange={(e) => setUserToKickId(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-slate-100 font-bold focus:outline-none focus:border-red-400"
                  >
                    <option value="">-- اختر مستخدماً متواجداً للغرفة --</option>
                    {availableUsersInRoom.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({getRankEmoji(u.role)})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!userToKickId) return;
                      kickUserFromRoom(selectedRoomId, userToKickId);
                      setUserToKickId('');
                    }}
                    disabled={!userToKickId}
                    className="bg-red-500 hover:bg-red-400 disabled:opacity-50 text-slate-950 font-black text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    طرد من الغرفة 🥾
                  </button>
                </div>
              </div>

              {/* Kicked Users List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>قائمة المطرودين حالياً:</span>
                  <span className="text-red-400 font-mono">({kickedUsers.length})</span>
                </h4>

                {kickedUsers.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800 text-slate-500 text-xs space-y-1">
                    <p>لا يوجد مستخدمون مطرودون من هذه الغرفة حالياً 👍</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {kickedUsers.map(user => (
                      <div
                        key={user.id}
                        className="bg-slate-950 border border-slate-800 rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-red-500/30 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            avatarUrl={user.avatar}
                            gender={user.gender}
                            role={user.role}
                            username={user.username}
                            size="sm"
                          />
                          <div>
                            <p className="text-xs font-bold text-slate-100 flex items-center gap-1">
                              <span>{user.username}</span>
                              <span className="text-[10px] text-amber-400">({getRankEmoji(user.role)})</span>
                            </p>
                            <p className="text-[10px] text-red-400 font-semibold">مطرود وممنوع من دخول الغرفة</p>
                          </div>
                        </div>

                        {/* Unkick button ❌ */}
                        <button
                          type="button"
                          onClick={() => unkickUserFromRoom(selectedRoomId, user.id)}
                          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-400 text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer shrink-0"
                          title="إلغاء الطرد"
                        >
                          <span className="font-black">❌</span>
                          <span>إلغاء الطرد</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center text-[10px] text-slate-500">
          <span>شات اليمن المطور - لوحة إعدادات الغرفة للإدارة والمالك</span>
        </div>

      </div>
    </div>
  );
};
