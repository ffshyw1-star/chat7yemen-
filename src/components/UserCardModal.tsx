import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import { canPerformModActions, canBeIgnored } from '../utils/permissions';
import { getUserFlagEmoji, getEnglishCountryName } from '../utils/geoip';
import { toEnglishDigits } from '../utils/dateUtils';
import {
  User as UserIcon, MessageSquare, Zap, X, VolumeX, Edit3, Check, CheckCircle2, ChevronDown, MicOff, Ban, Briefcase
} from 'lucide-react';

const DURATION_OPTIONS = [
  { value: 2, label: '2 دقائق' },
  { value: 3, label: '3 دقائق' },
  { value: 4, label: '4 دقائق' },
  { value: 5, label: '5 دقائق' },
  { value: 6, label: '6 دقائق' },
  { value: 7, label: '7 دقائق' },
  { value: 8, label: '8 دقائق' },
  { value: 9, label: '9 دقائق' },
  { value: 10, label: '10 دقائق' },
];

export const UserCardModal: React.FC = () => {
  const {
    selectedUserForCard, setSelectedUserForCard,
    setSelectedUserForProfile, setActivePrivateUserId, setIsPrivateChatOpen,
    setIsProfileSettingsOpen, banList, ipModerations,
    currentUser, users, currentRoom, moderatorAction, muteUserInRoom, unmuteUserInRoom,
    kickUserFromRoom, unkickUserFromRoom, showTopBanner, requestBlockConfirm
  } = useChat();

  const [showModCommands, setShowModCommands] = useState(false);
  const [activeTab, setActiveTab] = useState<'basic' | 'room_options'>('basic');
  const [activeModAction, setActiveModAction] = useState<'none' | 'mute' | 'kick'>('none');
  const [isDurationPickerOpen, setIsDurationPickerOpen] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Mute form state (default 5 minutes from 2-10 min options)
  const [muteDuration, setMuteDuration] = useState<number>(5);

  if (!selectedUserForCard) return null;

  const initialTarget = selectedUserForCard;
  // Get live reactive user data from users array in context
  const target = users.find(u => u.id === initialTarget.id) || initialTarget;

  const isMe = currentUser && target.id === currentUser.id;
  const isSystemTarget = target.id === 'user-system' || target.username === 'System';

  const canPerformModCommands = (!isSystemTarget && target.role !== 'owner')
    ? canPerformModActions(currentUser, target)
    : false;

  // Check if target is currently muted (checking active duration)
  const isTargetMuted = Boolean(
    (target.isMuted && (!target.muteUntil || new Date(target.muteUntil).getTime() > Date.now())) ||
    (currentRoom.mutedUsers || []).includes(target.id)
  );

  // Check if target is currently kicked (checking active duration)
  const isTargetKicked = Boolean(
    (target.isKicked && (!target.kickUntil || new Date(target.kickUntil).getTime() > Date.now())) ||
    (currentRoom.kickedUsers || []).includes(target.id)
  );

  // Check if target is currently banned
  const isTargetBanned = Boolean(
    target && !isSystemTarget && (
      target.isBanned ||
      (banList || []).includes(target.id) ||
      (target.ip && (banList || []).includes(target.ip)) ||
      (ipModerations || []).some(rec => rec.type === 'ban' && (rec.targetUserId === target.id || (target.ip && rec.ip === target.ip)))
    )
  );

  const handleOpenProfile = () => {
    setSelectedUserForProfile(target);
    setSelectedUserForCard(null);
  };

  const handleOpenPrivateChat = () => {
    setActivePrivateUserId(target.id);
    setIsPrivateChatOpen(true);
    setSelectedUserForCard(null);
  };

  const handleOpenEditProfile = () => {
    setIsProfileSettingsOpen(true);
    setSelectedUserForCard(null);
  };

  // Execute Mute with selected duration (2-10 minutes)
  const handleExecuteMute = (duration: number = muteDuration) => {
    muteUserInRoom(currentRoom.id, target.id);
    moderatorAction(target.id, 'mute', duration, 'كتم من الإدارة');
    setActionSuccessMsg('تم تنفيذ الأمر');
    showTopBanner('تم كتم المستخدم بنجاح');
    setTimeout(() => {
      setActionSuccessMsg(null);
      setSelectedUserForCard(null);
    }, 1200);
  };

  // Direct instant mute (for Room Options tab)
  const handleDirectRoomMute = () => {
    muteUserInRoom(currentRoom.id, target.id);
    moderatorAction(target.id, 'mute', 10, 'كتم من الغرفة');
    setActionSuccessMsg('تم تنفيذ الأمر');
    showTopBanner('تم كتم المستخدم من الغرفة');
    setTimeout(() => {
      setActionSuccessMsg(null);
      setSelectedUserForCard(null);
    }, 1200);
  };

  // Execute Unmute (فك الكتم)
  const handleExecuteUnmute = () => {
    unmuteUserInRoom(currentRoom.id, target.id);
    setActionSuccessMsg('تم تنفيذ الأمر');
    showTopBanner('تم فك الكتم بنجاح');
    setTimeout(() => {
      setActionSuccessMsg(null);
      setSelectedUserForCard(null);
    }, 1200);
  };

  // Direct instant kick from Room (طرد مباشر من الروم بدون كتابة سبب أو وقت)
  const handleDirectRoomKick = () => {
    kickUserFromRoom(currentRoom.id, target.id);
    setActionSuccessMsg('تم تنفيذ الأمر');
    showTopBanner('تم طرد المستخدم من الغرفة');
    setTimeout(() => {
      setActionSuccessMsg(null);
      setSelectedUserForCard(null);
    }, 1200);
  };

  // Execute Unkick (فك الطرد)
  const handleExecuteUnkick = () => {
    unkickUserFromRoom(currentRoom.id, target.id);
    setActionSuccessMsg('تم تنفيذ الأمر');
    showTopBanner('تم فك الطرد بنجاح');
    setTimeout(() => {
      setActionSuccessMsg(null);
      setSelectedUserForCard(null);
    }, 1200);
  };

  const handleClose = () => {
    setSelectedUserForCard(null);
    setShowModCommands(false);
    setActiveModAction('none');
    setActionSuccessMsg(null);
    setIsDurationPickerOpen(false);
  };

  const currentDurationLabel = DURATION_OPTIONS.find(o => o.value === muteDuration)?.label || `${muteDuration} دقائق`;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200 select-none dir-rtl font-sans"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full max-w-[290px] sm:max-w-[320px] overflow-hidden shadow-2xl relative select-none border border-slate-200"
      >
        {/* VIEW 1: NORMAL USER CARD (When not in Mod Commands mode) */}
        {!showModCommands ? (
          <>
            {/* TOP HEADER SECTION - DARK TEAL / NAVY #072a32 */}
            <div className="bg-[#072a32] text-white pt-6 pb-4 px-4 text-center relative flex flex-col items-center">
              
              {/* Avatar Container with white circular border */}
              <div className="relative mb-2">
                <UserAvatar
                  avatarUrl={target.avatar}
                  gender={target.gender}
                  role={target.role}
                  username={target.username}
                  size="lg"
                  showRankBadge={false}
                  className="w-20 h-20 rounded-full border-2 border-white shadow-md object-cover bg-slate-800"
                />
              </div>

              {/* Username */}
              <h3 className="text-white font-extrabold text-lg sm:text-xl tracking-tight flex items-center justify-center gap-1.5">
                <span>{target.username}</span>
              </h3>

              {/* Subtitle: سنة أنثى 20 / سنة ذكر 25 */}
              <p className="text-slate-200 font-bold text-xs sm:text-sm mt-0.5 opacity-90 dir-rtl text-center">
                {target.age && target.age !== 'عدم الإظهار'
                  ? `سنة ${target.gender === 'female' ? 'أنثى' : target.gender === 'other' ? 'نوع آخر' : 'ذكر'} ${target.age}`
                  : (target.gender === 'female' ? 'أنثى' : target.gender === 'other' ? 'نوع آخر' : 'ذكر')
                }
              </p>

              {/* Country Flag Emoji (e.g. 🇩🇿, 🇵🇸, 🇾🇪) */}
              {getUserFlagEmoji(target) && (
                <div className="mt-1 flex items-center justify-center">
                  <span className="text-2xl leading-none drop-shadow-md select-none" title={target.country || 'الدولة'}>
                    {getUserFlagEmoji(target)}
                  </span>
                </div>
              )}
            </div>

            {/* BANNED ALERT BANNER MATCHING SCREENSHOT */}
            {isTargetBanned && (
              <div className="bg-[#d32f2f] text-white py-2 px-3 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm select-none">
                <span className="w-3.5 h-3.5 rounded-full bg-white text-[#d32f2f] font-black text-[10px] flex items-center justify-center shrink-0">!</span>
                <span>هذا المستخدم محظور حاليًا</span>
              </div>
            )}

            {/* BOTTOM ACTION LIST SECTION - WHITE BACKGROUND */}
            <div className="bg-white divide-y divide-slate-100">

              {/* 1. عرض الملف الشخصي (Always shown) */}
              <button
                onClick={handleOpenProfile}
                className="w-full py-3.5 px-5 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-between text-right cursor-pointer"
              >
                <span className="font-extrabold text-sm text-slate-700 mx-auto">عرض الملف الشخصي</span>
                <UserIcon className="w-5 h-5 text-slate-800 shrink-0" />
              </button>

              {/* If clicking OWN card: Shows [تعديل] only */}
              {isMe ? (
                <button
                  onClick={handleOpenEditProfile}
                  className="w-full py-3.5 px-5 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-between text-right cursor-pointer"
                >
                  <span className="font-extrabold text-sm text-slate-700 mx-auto">تعديل</span>
                  <Edit3 className="w-5 h-5 text-slate-800 shrink-0" />
                </button>
              ) : (
                /* If clicking OTHER user's card: Shows [رسالة] and [الأمر ⚡] */
                <>
                  {/* 2. رسالة */}
                  <button
                    onClick={handleOpenPrivateChat}
                    className="w-full py-3.5 px-5 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-between text-right cursor-pointer"
                  >
                    <span className="font-extrabold text-sm text-slate-700 mx-auto">رسالة</span>
                    <MessageSquare className="w-5 h-5 text-[#0284c7] shrink-0" />
                  </button>

                  {/* 3. الأمر ⚡ (يظهر فقط لمن يملك الصلاحية الإدارية على العضو المستهدف - لا يظهر للمالك أو System أو عند عدم توفر الصلاحية) */}
                  {canPerformModCommands && (
                    <button
                      onClick={() => {
                        setShowModCommands(true);
                        setActiveTab('room_options');
                        setActiveModAction('none');
                      }}
                      className="w-full py-3.5 px-5 hover:bg-slate-50 active:bg-slate-100 transition-colors flex items-center justify-between text-right cursor-pointer border-t border-slate-100"
                    >
                      <span className="font-extrabold text-sm text-slate-700 mx-auto">الأمر</span>
                      <Zap className="w-5 h-5 text-red-500 fill-red-500 shrink-0" />
                    </button>
                  )}
                </>
              )}

            </div>
          </>
        ) : (
          /* VIEW 2: DEDICATED MODERATION / ROOM OPTIONS MODAL (الأمر) */
          <div className="bg-white text-slate-800">
            
            {/* Top Bar: Target Avatar + Target Username on right, Close X on left */}
            <div className="p-3 bg-[#002f34] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserAvatar
                  avatarUrl={target.avatar}
                  gender={target.gender}
                  role={target.role}
                  username={target.username}
                  size="sm"
                  showRankBadge={false}
                  className="w-8 h-8 rounded-full border border-white/80 object-cover"
                />
                <span className="font-extrabold text-sm text-white">{target.username}</span>
              </div>

              <button
                onClick={handleClose}
                className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 stroke-[2.5]" />
              </button>
            </div>

            {/* Green Success Message Box under Top Bar when executed */}
            {actionSuccessMsg && (
              <div className="bg-emerald-600 text-white font-extrabold text-xs py-2.5 px-4 text-center flex items-center justify-center gap-2 animate-in slide-in-from-top-2 duration-200">
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>{actionSuccessMsg}</span>
              </div>
            )}

            {/* Sub-tabs: [الأساسية] and [خيارات الغرفة] */}
            <div className="flex border-b border-slate-200 text-xs font-black bg-white">
              <button
                onClick={() => {
                  setActiveTab('basic');
                  setActiveModAction('none');
                }}
                className={`py-2.5 px-5 text-center transition-colors cursor-pointer font-black ${
                  activeTab === 'basic'
                    ? 'bg-[#002f34] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                الأساسية
              </button>
              <button
                onClick={() => {
                  setActiveTab('room_options');
                  setActiveModAction('none');
                }}
                className={`py-2.5 px-5 text-center transition-colors cursor-pointer font-black ${
                  activeTab === 'room_options'
                    ? 'bg-[#002f34] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                خيارات الغرفة
              </button>
              <div className="flex-1 bg-white border-b border-slate-200"></div>
            </div>

            {/* Content Area */}
            <div className="p-4 bg-white min-h-[180px] flex flex-col justify-center">
              
              {/* TAB 1: الأساسية (عرض كتم مع خيارات المدة من 2 إلى 10 دقائق، وفك الكتم، وفك الطرد) */}
              {activeTab === 'basic' && (
                <>
                  {activeModAction === 'none' && (
                    <div className="space-y-3">
                      {canPerformModCommands ? (
                        <>
                          {/* Button 1: كتم (أو فك الكتم إذا كان مكتوماً) */}
                          <button
                            onClick={() => {
                              if (isTargetMuted) {
                                handleExecuteUnmute();
                              } else {
                                setActiveModAction('mute');
                              }
                            }}
                            className="w-full bg-[#f4f5f7] hover:bg-[#e9ebef] active:bg-[#dde1e7] border border-slate-200/60 rounded-xl p-3.5 flex items-center justify-between text-right transition-all cursor-pointer group shadow-xs"
                          >
                            <span className="font-extrabold text-sm text-slate-800">
                              {isTargetMuted ? 'فك الكتم' : 'كتم'}
                            </span>
                            <MicOff className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                          </button>

                          {/* Button 2: طرد (أو فك الطرد إذا كان مطروداً) */}
                          <button
                            onClick={() => {
                              if (isTargetKicked) {
                                handleExecuteUnkick();
                              } else {
                                handleDirectRoomKick();
                              }
                            }}
                            className="w-full bg-[#f4f5f7] hover:bg-[#e9ebef] active:bg-[#dde1e7] border border-slate-200/60 rounded-xl p-3.5 flex items-center justify-between text-right transition-all cursor-pointer group shadow-xs"
                          >
                            <span className="font-extrabold text-sm text-slate-800">
                              {isTargetKicked ? 'فك الطرد' : 'طرد'}
                            </span>
                            <Zap className="w-5 h-5 text-slate-800 fill-slate-800 group-hover:scale-110 transition-transform shrink-0" />
                          </button>

                          {/* Button 3: حظر نهائي من الشات (للمالك والأدمن) */}
                          {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && target.role !== 'owner' && (
                            <button
                              onClick={() => {
                                const actionType = isTargetBanned ? 'unban' : 'ban';
                                requestBlockConfirm(target, actionType, () => {
                                  if (isTargetBanned) {
                                    moderatorAction(target.id, 'unban', 0, 'فك حظر من الإدارة');
                                    showTopBanner(`🔓 تم فك حظر العضو (${target.username}) بنجاح`);
                                  } else {
                                    moderatorAction(target.id, 'ban', 0, 'حظر دائم من الإدارة');
                                    showTopBanner(`🚫 تم حظر العضو (${target.username}) نهائياً من الشات`);
                                  }
                                  handleClose();
                                });
                              }}
                              className={`w-full border rounded-xl p-3.5 flex items-center justify-between text-right transition-all cursor-pointer group shadow-xs ${
                                isTargetBanned
                                  ? 'bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-800'
                                  : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-800'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="font-extrabold text-sm">
                                  {isTargetBanned ? 'إلغاء وفك الحظر 🔓' : 'حظر نهائي من الشات 🚫'}
                                </span>
                                <span className="text-[10px] opacity-75 font-medium">
                                  {isTargetBanned ? 'السماح للعضو بالدخول مجدداً' : 'منع العضو من الدخول للشات نهائياً'}
                                </span>
                              </div>
                              <Ban className={`w-5 h-5 group-hover:scale-110 transition-transform shrink-0 ${isTargetBanned ? 'text-emerald-600' : 'text-red-600'}`} />
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-6 text-xs text-slate-500 font-bold leading-relaxed">
                          ليس لديك صلاحية لتنفيذ أوامر الإشراف على هذا المستخدم.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Form for Mute Duration Picker (من 2 دقائق إلى 10 دقائق) */}
                  {activeModAction === 'mute' && (
                    <div className="space-y-3">
                      {/* Duration Selector */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 text-right">
                          مدة الكتم
                        </label>
                        <button
                          type="button"
                          onClick={() => setIsDurationPickerOpen(true)}
                          className="w-full bg-[#f4f5f7] border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:border-amber-500 transition-colors"
                        >
                          <span>{currentDurationLabel}</span>
                          <ChevronDown className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>

                      {/* Quick duration selection pills (2 to 10 min) */}
                      <div className="grid grid-cols-5 gap-1 pt-1">
                        {[2, 3, 5, 8, 10].map((mins) => (
                          <button
                            key={mins}
                            type="button"
                            onClick={() => setMuteDuration(mins)}
                            className={`py-1.5 text-center text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                              muteDuration === mins
                                ? 'bg-[#002f34] text-white shadow-xs'
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            {mins}د
                          </button>
                        ))}
                      </div>

                      {/* Action Buttons: [كتم (Red)] and [إلغاء (Slate)] */}
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleExecuteMute()}
                          className="bg-[#cc0000] hover:bg-[#b30000] active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                        >
                          كتم ({muteDuration} د)
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveModAction('none')}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 font-extrabold text-xs py-2.5 rounded-xl transition-all cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: خيارات الغرفة (كتم مباشر بدون وقت أو سبب، وطرد مباشر من الروم بدون كتابة سبب أو وقت) */}
              {activeTab === 'room_options' && (
                <div className="space-y-3">
                  {canPerformModCommands ? (
                    <>
                      {/* زر الكتم المباشر */}
                      <button
                        onClick={() => {
                          if (isTargetMuted) {
                            handleExecuteUnmute();
                          } else {
                            handleDirectRoomMute();
                          }
                        }}
                        className="w-full bg-[#f4f5f7] hover:bg-[#e9ebef] active:bg-[#dde1e7] border border-slate-200/60 rounded-xl p-3.5 flex items-center justify-between text-right transition-all cursor-pointer group shadow-xs"
                      >
                        <div className="flex flex-col text-right">
                          <span className="font-extrabold text-sm text-slate-800">
                            {isTargetMuted ? 'فك الكتم' : 'كتم مباشر'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {isTargetMuted ? 'إلغاء الكتم عن العضو فوراً' : 'كتم فوري للعضو في هذه الغرفة'}
                          </span>
                        </div>
                        <MicOff className="w-5 h-5 text-amber-500 group-hover:scale-110 transition-transform shrink-0" />
                      </button>

                      {/* زر الطرد المباشر */}
                      <button
                        onClick={() => {
                          if (isTargetKicked) {
                            handleExecuteUnkick();
                          } else {
                            handleDirectRoomKick();
                          }
                        }}
                        className="w-full bg-[#f4f5f7] hover:bg-[#e9ebef] active:bg-[#dde1e7] border border-slate-200/60 rounded-xl p-3.5 flex items-center justify-between text-right transition-all cursor-pointer group shadow-xs"
                      >
                        <div className="flex flex-col text-right">
                          <span className="font-extrabold text-sm text-slate-800">
                            {isTargetKicked ? 'فك الطرد' : 'طرد مباشر من الغرفة'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {isTargetKicked ? 'السماح للعضو بدخول الغرفة' : 'طرد فوري ومباشر بدون إدخال وقت أو سبب'}
                          </span>
                        </div>
                        <Zap className="w-5 h-5 text-red-600 fill-red-600 group-hover:scale-110 transition-transform shrink-0" />
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-6 text-xs text-slate-500 font-bold leading-relaxed">
                      ليس لديك صلاحية لتنفيذ أوامر الإشراف على هذا المستخدم.
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

        {/* DURATION PICKER MODAL POPUP (من 2 إلى 10 دقائق) */}
        {isDurationPickerOpen && (
          <div
            onClick={() => setIsDurationPickerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-[#002f34] text-white rounded-2xl p-4 w-full max-w-[240px] border border-[#064e56] shadow-2xl space-y-2 text-right"
            >
              <div className="font-extrabold text-xs text-amber-400 pb-1 border-b border-[#064e56]">
                اختر مدة الكتم (2 - 10 دقائق):
              </div>

              <div className="space-y-1 max-h-[220px] overflow-y-auto custom-scrollbar">
                {DURATION_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setMuteDuration(opt.value);
                      setIsDurationPickerOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                      muteDuration === opt.value
                        ? 'bg-[#001f22] text-amber-400'
                        : 'hover:bg-[#002529] text-slate-200'
                    }`}
                  >
                    <span>{opt.label}</span>
                    <div
                      className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                        muteDuration === opt.value
                          ? 'border-amber-400 bg-amber-400'
                          : 'border-slate-400'
                      }`}
                    >
                      {muteDuration === opt.value && (
                        <Check className="w-2.5 h-2.5 text-slate-900 stroke-[3]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
