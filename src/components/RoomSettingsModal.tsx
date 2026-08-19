import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import {
  X, Save, ShieldAlert, Key, UserCheck, VolumeX, UserX,
  Plus, Trash2, Shield, Crown, Star, CheckCircle, Unlock, Lock
} from 'lucide-react';
import { RoomRole } from '../types';
import { getRankEmoji, getRankTitle } from '../utils/permissions';

export const RoomSettingsModal: React.FC = () => {
  const {
    currentUser,
    rooms,
    currentRoom,
    users,
    isRoomSettingsOpen,
    setIsRoomSettingsOpen,
    updateRoomDetails,
    assignRoomStaff,
    removeRoomStaff,
    muteUserInRoom,
    unmuteUserInRoom,
    kickUserFromRoom,
    unkickUserFromRoom,
    showTopBanner
  } = useChat();

  const [selectedRoomId, setSelectedRoomId] = useState<string>(currentRoom.id);
  const [activeTab, setActiveTab] = useState<'options' | 'users' | 'mutes' | 'kicks'>('options');

  // Tab 1 (خيارات) Form State
  const [defaultServer, setDefaultServer] = useState('Araby.Chat');
  const [roomName, setRoomName] = useState('');
  const [roomPassword, setRoomPassword] = useState('');
  const [roomDescription, setRoomDescription] = useState('');
  const [saveMessage, setSaveMessage] = useState('');

  // Tab 2 (المستخدمين - الرتب الفخرية) State
  const [staffUserId, setStaffUserId] = useState('');
  const [staffRole, setStaffRole] = useState<RoomRole>('room_moderator');

  // Tab 3 (ممنوع من الكتابة) State
  const [userToMuteId, setUserToMuteId] = useState('');

  // Tab 4 (محظور) State
  const [userToKickId, setUserToKickId] = useState('');

  const targetRoom = rooms.find(r => r.id === selectedRoomId) || currentRoom;

  useEffect(() => {
    if (targetRoom) {
      setRoomName(targetRoom.name || '');
      setRoomPassword(targetRoom.password || '');
      setRoomDescription(targetRoom.description || '');
    }
  }, [selectedRoomId, targetRoom]);

  if (!isRoomSettingsOpen || !currentUser) return null;

  const isManagementOrHigher = ['management', 'admin', 'owner'].includes(currentUser.role);

  if (!isManagementOrHigher) {
    return (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 dir-rtl">
        <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl border border-slate-200">
          <ShieldAlert className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">غير مصرح لك بالوصول</h3>
          <p className="text-xs text-slate-600">خاصية إعدادات الغرفة مخصصة لرتب الإدارة والمالك فقط.</p>
          <button
            type="button"
            onClick={() => setIsRoomSettingsOpen(false)}
            className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold py-2 px-6 rounded-xl transition-all cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    );
  }

  // Handle Save Room Options (Tab 1: خيارات)
  const handleSaveOptions = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      showTopBanner('🚫 اسم الغرفة لا يمكن أن يكون فارغاً');
      return;
    }

    updateRoomDetails(selectedRoomId, {
      name: roomName.trim(),
      password: roomPassword.trim(),
      description: roomDescription.trim(),
      isLocked: Boolean(roomPassword.trim())
    });

    setSaveMessage('تم حفظ خيارات الغرفة بنجاح ✅');
    showTopBanner(`✅ تم حفظ إعدادات ${roomName} بنجاح`);
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Honorary room staff list for Tab 2
  const roomStaffList = targetRoom.roomStaff || [];

  // Muted users list for Tab 3
  const mutedUserIds = targetRoom.mutedUsers || [];
  const mutedUsers = users.filter(u => mutedUserIds.includes(u.id));

  // Kicked users list for Tab 4
  const kickedUserIds = targetRoom.kickedUsers || [];
  const kickedUsers = users.filter(u => kickedUserIds.includes(u.id));

  // Available users in chat to assign roles or moderate
  const availableUsers = users.filter(
    u => u.id !== currentUser.id && u.role !== 'owner'
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 dir-rtl select-none">
      <div className="bg-[#f8fafc] w-full max-w-xl rounded-2xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Dark Teal Header Matching Screenshot 1 */}
        <div className="bg-[#002f34] text-white px-3 sm:px-4 py-3 flex items-center justify-between shrink-0 shadow-md">
          {/* Right in RTL: Room Title & Room Switcher */}
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-black flex items-center gap-2">
              <span>إعدادات الغرفة:</span>
              <span className="text-[#38bdf8] font-bold">({targetRoom.name})</span>
            </h2>
            {rooms.length > 1 && (
              <select
                value={selectedRoomId}
                onChange={(e) => setSelectedRoomId(e.target.value)}
                className="bg-[#073f45] border border-[#0ea5b6] text-white text-[11px] font-bold rounded-lg px-2 py-0.5 focus:outline-none cursor-pointer"
                title="تغيير الغرفة المحددة"
              >
                {rooms.map(r => (
                  <option key={r.id} value={r.id} className="bg-slate-900 text-white">
                    {r.name} {r.password ? '🔒' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Left in RTL: Close 'X' Button */}
          <button
            type="button"
            onClick={() => setIsRoomSettingsOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Horizontal Tabs Bar Matching Screenshot 1 */}
        <div className="grid grid-cols-4 bg-white border-b border-slate-300 text-center text-xs font-black shrink-0">
          
          {/* Tab 1: خيارات */}
          <button
            type="button"
            onClick={() => setActiveTab('options')}
            className={`py-3 transition-colors cursor-pointer border-l border-slate-200 flex items-center justify-center gap-1 ${
              activeTab === 'options'
                ? 'bg-[#002f34] text-white shadow-inner font-extrabold'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>خيارات</span>
          </button>

          {/* Tab 2: المستخدمين (الرتب الفخرية) */}
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-3 transition-colors cursor-pointer border-l border-slate-200 flex items-center justify-center gap-1 ${
              activeTab === 'users'
                ? 'bg-[#002f34] text-white shadow-inner font-extrabold'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>المستخدمين</span>
            {roomStaffList.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'users' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-800'
              }`}>
                {roomStaffList.length}
              </span>
            )}
          </button>

          {/* Tab 3: ممنوع من الكتابة */}
          <button
            type="button"
            onClick={() => setActiveTab('mutes')}
            className={`py-3 transition-colors cursor-pointer border-l border-slate-200 flex items-center justify-center gap-1 ${
              activeTab === 'mutes'
                ? 'bg-[#002f34] text-white shadow-inner font-extrabold'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>ممنوع من الكتابة</span>
            {mutedUsers.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'mutes' ? 'bg-amber-400 text-slate-950' : 'bg-red-100 text-red-700'
              }`}>
                {mutedUsers.length}
              </span>
            )}
          </button>

          {/* Tab 4: محظور */}
          <button
            type="button"
            onClick={() => setActiveTab('kicks')}
            className={`py-3 transition-colors cursor-pointer flex items-center justify-center gap-1 ${
              activeTab === 'kicks'
                ? 'bg-[#002f34] text-white shadow-inner font-extrabold'
                : 'bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <span>محظور</span>
            {kickedUsers.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'kicks' ? 'bg-amber-400 text-slate-950' : 'bg-red-100 text-red-700'
              }`}>
                {kickedUsers.length}
              </span>
            )}
          </button>

        </div>

        {/* Tab Body Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar bg-slate-50">

          {/* ===================== TAB 1: خيارات (OPTIONS) EXACTLY LIKE SCREENSHOT 1 ===================== */}
          {activeTab === 'options' && (
            <form onSubmit={handleSaveOptions} className="space-y-4">
              
              {/* 1. المشغل الإفتراضي */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 text-right">
                  المشغل الإفتراضي
                </label>
                <div className="relative">
                  <select
                    value={defaultServer}
                    onChange={(e) => setDefaultServer(e.target.value)}
                    className="w-full bg-[#f1f5f9] border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0ea5b6] focus:bg-white transition-all cursor-pointer text-right appearance-none"
                  >
                    <option value="Araby.Chat">Araby.Chat</option>
                    <option value="Server-Yemen-01">Server-Yemen-01</option>
                    <option value="Server-Live-Main">Server-Live-Main</option>
                  </select>
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* 2. اسم الغرفة */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 text-right">
                  اسم الغرفة
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="اسم الغرفة..."
                  className="w-full bg-[#f1f5f9] border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#0ea5b6] focus:bg-white transition-all text-right"
                  required
                />
              </div>

              {/* 3. كلمة المرور */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-black text-slate-800 text-right">
                    كلمة المرور
                  </label>
                  {roomPassword ? (
                    <span className="text-[10px] text-red-600 font-bold flex items-center gap-1">
                      <Lock className="w-3 h-3" /> مقفلة بكلمة مرور
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> مفتوحة للجميع (بدون كلمة مرور)
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={roomPassword}
                    onChange={(e) => setRoomPassword(e.target.value)}
                    placeholder="اتركها فارغة إذا كانت الغرفة مفتوحة للجميع..."
                    className="w-full bg-[#f1f5f9] border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold font-mono text-slate-900 focus:outline-none focus:border-[#0ea5b6] focus:bg-white transition-all text-right"
                  />
                  {roomPassword && (
                    <button
                      type="button"
                      onClick={() => setRoomPassword('')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] bg-red-100 hover:bg-red-200 text-red-600 px-2 py-0.5 rounded font-bold transition-colors cursor-pointer"
                    >
                      مسح
                    </button>
                  )}
                </div>
              </div>

              {/* 4. الوصف */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-800 text-right">
                  الوصف
                </label>
                <textarea
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                  placeholder="أهلاً وسهلاً بكم في الغرفة..."
                  rows={4}
                  className="w-full bg-[#f1f5f9] border border-slate-300 rounded-lg p-3 text-xs font-medium text-slate-900 focus:outline-none focus:border-[#0ea5b6] focus:bg-white transition-all text-right custom-scrollbar"
                />
              </div>

              {/* Success Notification */}
              {saveMessage && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-300 rounded-lg text-emerald-700 text-xs font-bold text-center flex items-center justify-center gap-1.5">
                  <CheckCircle className="w-4 h-4" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {/* Bottom Action Save Button Matching Screenshot 1 */}
              <div className="pt-2 flex justify-start">
                <button
                  type="submit"
                  className="bg-[#00a6b6] hover:bg-[#0092a1] active:bg-[#007f8d] text-white font-black text-xs px-6 py-2 rounded-md shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ</span>
                </button>
              </div>

            </form>
          )}

          {/* ===================== TAB 2: المستخدمين (HONORARY STAFF: مشرف غرفة / مدير غرفة / مالك غرفة) ===================== */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              
              {/* Info banner */}
              <div className="bg-sky-50 border border-sky-200 p-3 rounded-xl text-sky-900 text-xs space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#00a6b6]" />
                  <span>الرتب الفخرية المعينة لغرفة ({targetRoom.name}):</span>
                </p>
                <p className="text-[11px] text-sky-800">
                  يمكن تعيين المستخدمين في الرتب الفخرية التالية: [ مشرف غرفة 🛡️ ] • [ مدير غرفة 🌟 ] • [ مالك غرفة 👑 ]
                </p>
              </div>

              {/* Assign New Room Honorary Role Form */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs space-y-3">
                <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-[#00a6b6]" />
                  <span>تعيين رتبة فخرية لعضو:</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Select User */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">اختر العضو:</label>
                    <select
                      value={staffUserId}
                      onChange={(e) => setStaffUserId(e.target.value)}
                      className="w-full bg-[#f1f5f9] border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00a6b6] cursor-pointer"
                    >
                      <option value="">-- اختر عضواً من الدردشة --</option>
                      {availableUsers.map(u => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({getRankTitle(u.role)})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Honorary Role */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">الرتبة الفخرية:</label>
                    <select
                      value={staffRole}
                      onChange={(e) => setStaffRole(e.target.value as RoomRole)}
                      className="w-full bg-[#f1f5f9] border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00a6b6] cursor-pointer"
                    >
                      <option value="room_moderator">🛡️ مشرف غرفة</option>
                      <option value="room_supervisor">🌟 مدير غرفة</option>
                      <option value="room_owner">👑 مالك غرفة</option>
                    </select>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (!staffUserId) {
                      showTopBanner('🚫 الرجاء اختيار عضو لتعيين الرتبة الفخرية');
                      return;
                    }
                    assignRoomStaff(selectedRoomId, staffUserId, staffRole);
                    const assignedUser = users.find(u => u.id === staffUserId);
                    const roleTitle = staffRole === 'room_owner' ? 'مالك غرفة 👑' : staffRole === 'room_supervisor' ? 'مدير غرفة 🌟' : 'مشرف غرفة 🛡️';
                    showTopBanner(`✅ تم تعيين (${assignedUser?.username}) برتبة [ ${roleTitle} ] في الغرفة`);
                    setStaffUserId('');
                  }}
                  disabled={!staffUserId}
                  className="w-full bg-[#00a6b6] hover:bg-[#0092a1] disabled:opacity-50 text-white font-black text-xs py-2 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>تعيين الرتبة الفخرية</span>
                </button>
              </div>

              {/* List of Assigned Honorary Users */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>المستخدمين ذوي الرتب الفخرية المعينين:</span>
                  <span className="text-[#00a6b6] font-mono">({roomStaffList.length})</span>
                </h4>

                {roomStaffList.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-1">
                    <p className="font-bold">لا يوجد مستخدمون برتب فخرية معينة في هذه الغرفة حالياً.</p>
                    <p className="text-[11px] text-slate-400">يمكنك استخدام النموذج أعلاه لتعيين مشرفين ومدراء للغرفة.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {roomStaffList.map(staff => {
                      const userObj = users.find(u => u.id === staff.userId);
                      const isOwnerRole = staff.role === 'room_owner';
                      const isSuperRole = staff.role === 'room_supervisor';

                      return (
                        <div
                          key={staff.userId}
                          className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-[#00a6b6] transition-all shadow-xs"
                        >
                          <div className="flex items-center gap-3">
                            <UserAvatar
                              avatarUrl={staff.avatar || userObj?.avatar}
                              gender={userObj?.gender || 'male'}
                              role={userObj?.role || 'member'}
                              username={staff.username}
                              size="sm"
                            />
                            <div>
                              <p className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                                <span>{staff.username}</span>
                                {userObj && <span className="text-[10px] text-slate-400">({getRankEmoji(userObj.role)})</span>}
                              </p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 ${
                                  isOwnerRole
                                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                    : isSuperRole
                                    ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                }`}>
                                  {isOwnerRole ? <Crown className="w-3 h-3 text-amber-600" /> : isSuperRole ? <Star className="w-3 h-3 text-purple-600" /> : <Shield className="w-3 h-3 text-emerald-600" />}
                                  <span>{isOwnerRole ? 'مالك غرفة' : isSuperRole ? 'مدير غرفة' : 'مشرف غرفة'}</span>
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Remove staff role button */}
                          <button
                            type="button"
                            onClick={() => {
                              removeRoomStaff(selectedRoomId, staff.userId);
                              showTopBanner(`🗑️ تم إزالة الرتبة الفخرية من (${staff.username})`);
                            }}
                            className="bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            title="حذف الرتبة الفخرية"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>حذف الرتبة</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ===================== TAB 3: ممنوع من الكتابة (MUTED USERS) ===================== */}
          {activeTab === 'mutes' && (
            <div className="space-y-4">
              
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-900 text-xs space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <VolumeX className="w-4 h-4 text-amber-600" />
                  <span>الممنوعون عن الكتابة في غرفة ({targetRoom.name}):</span>
                </p>
                <p className="text-[11px] text-amber-800">
                  المستخدم المكتوم في هذه الغرفة يمنع من إرسال أي رسائل نصية أو وسائط بداخلها.
                </p>
              </div>

              {/* Quick Mute Form */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs space-y-2">
                <label className="block text-xs font-black text-slate-800">كتم مستخدم جديد في هذه الغرفة:</label>
                <div className="flex gap-2">
                  <select
                    value={userToMuteId}
                    onChange={(e) => setUserToMuteId(e.target.value)}
                    className="flex-1 bg-[#f1f5f9] border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="">-- اختر مستخدماً من الدردشة --</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({getRankTitle(u.role)})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!userToMuteId) return;
                      muteUserInRoom(selectedRoomId, userToMuteId);
                      const targetU = users.find(u => u.id === userToMuteId);
                      showTopBanner(`🔇 تم كتم (${targetU?.username}) عن الكتابة في الغرفة`);
                      setUserToMuteId('');
                    }}
                    disabled={!userToMuteId}
                    className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs px-4 py-2 rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    كتم العضو 🔇
                  </button>
                </div>
              </div>

              {/* Muted Users List */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>المكتومون حالياً في الغرفة:</span>
                  <span className="text-amber-600 font-mono font-black">({mutedUsers.length})</span>
                </h4>

                {mutedUsers.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-1">
                    <p className="font-bold">لا يوجد أعضاء ممنوعين عن الكتابة في هذه الغرفة حالياً 👍</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {mutedUsers.map(user => (
                      <div
                        key={user.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-amber-400 transition-all shadow-xs"
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
                            <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                              <span>{user.username}</span>
                              <span className="text-[10px] text-slate-400">({getRankTitle(user.role)})</span>
                            </p>
                            <p className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-0.5">
                              <VolumeX className="w-3 h-3" />
                              <span>ممنوع عن الكتابة في هذه الغرفة</span>
                            </p>
                          </div>
                        </div>

                        {/* Unmute Button */}
                        <button
                          type="button"
                          onClick={() => {
                            unmuteUserInRoom(selectedRoomId, user.id);
                            showTopBanner(`🔊 تم فك الكتم عن (${user.username})`);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                          title="فك الكتم"
                        >
                          <span>🔊 فك الكتم</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ===================== TAB 4: محظور (KICKED / BANNED USERS) ===================== */}
          {activeTab === 'kicks' && (
            <div className="space-y-4">
              
              <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-900 text-xs space-y-1">
                <p className="font-extrabold flex items-center gap-1.5">
                  <UserX className="w-4 h-4 text-red-600" />
                  <span>المطرودون والمحظورون من غرفة ({targetRoom.name}):</span>
                </p>
                <p className="text-[11px] text-red-800">
                  المستخدم المطرود يمنع من دخول هذه الغرفة نهائياً حتى يتم إلغاء الحظر عنه.
                </p>
              </div>

              {/* Quick Kick Form */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs space-y-2">
                <label className="block text-xs font-black text-slate-800">طرد مستخدم من هذه الغرفة:</label>
                <div className="flex gap-2">
                  <select
                    value={userToKickId}
                    onChange={(e) => setUserToKickId(e.target.value)}
                    className="flex-1 bg-[#f1f5f9] border border-slate-300 rounded-lg p-2 text-xs font-bold text-slate-800 focus:outline-none focus:border-red-500 cursor-pointer"
                  >
                    <option value="">-- اختر مستخدماً من الدردشة --</option>
                    {availableUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.username} ({getRankTitle(u.role)})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      if (!userToKickId) return;
                      kickUserFromRoom(selectedRoomId, userToKickId);
                      const targetU = users.find(u => u.id === userToKickId);
                      showTopBanner(`🚫 تم طرد (${targetU?.username}) من الغرفة`);
                      setUserToKickId('');
                    }}
                    disabled={!userToKickId}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-black text-xs px-4 py-2 rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    طرد من الغرفة 🥾
                  </button>
                </div>
              </div>

              {/* Kicked Users List */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-slate-800 flex items-center justify-between">
                  <span>المحظورون حالياً من دخول الغرفة:</span>
                  <span className="text-red-600 font-mono font-black">({kickedUsers.length})</span>
                </h4>

                {kickedUsers.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-xl border border-slate-200 text-slate-500 text-xs space-y-1">
                    <p className="font-bold">لا يوجد أعضاء مطرودين أو محظورين من هذه الغرفة حالياً 👍</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {kickedUsers.map(user => (
                      <div
                        key={user.id}
                        className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-3 hover:border-red-400 transition-all shadow-xs"
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
                            <p className="text-xs font-black text-slate-800 flex items-center gap-1">
                              <span>{user.username}</span>
                              <span className="text-[10px] text-slate-400">({getRankTitle(user.role)})</span>
                            </p>
                            <p className="text-[10px] text-red-600 font-bold flex items-center gap-1 mt-0.5">
                              <ShieldAlert className="w-3 h-3" />
                              <span>مطرود ومحظور من دخول الغرفة</span>
                            </p>
                          </div>
                        </div>

                        {/* Unkick Button */}
                        <button
                          type="button"
                          onClick={() => {
                            unkickUserFromRoom(selectedRoomId, user.id);
                            showTopBanner(`🔓 تم فك حظر الغرفة عن (${user.username})`);
                          }}
                          className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 text-xs font-black px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer shrink-0"
                          title="فك الحظر"
                        >
                          <span>🔓 فك الحظر</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
