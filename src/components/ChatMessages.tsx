import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useChat } from '../context/ChatContext';
import { Message, User } from '../types';
import { UserAvatar } from './UserAvatar';
import { getRankEmoji, getRankEmojiClass, getRankTitle, getYouTubeVideoId } from '../utils/permissions';
import { Play, Pause, MoreVertical, MoreHorizontal, Flag, Trash2, Volume2, Smile, Youtube, Sparkles, Clock, Zap } from 'lucide-react';
import { ReportMessageModal } from './ReportMessageModal';
import { NEON_COLORS } from './ProfileEditorModal';
import { toEnglishDigits } from '../utils/dateUtils';

const EMOJI_STICKER_MAP: Record<string, string> = {};

// Helper to parse bracketed user names [ Name ] and render them in a colorful badge
const renderSystemFormattedText = (rawText: string) => {
  const parts = rawText.split(/(\[\s*[^\]]+\s*\])/g);
  return parts.map((part, idx) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      const nameContent = part.slice(1, -1).trim();
      return (
        <span
          key={idx}
          className="inline-flex items-center gap-1 mx-1 px-2.5 py-0.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-black text-xs sm:text-sm shadow-xs ring-2 ring-amber-300/60"
        >
          <span>✨</span>
          <span>{nameContent}</span>
          <span>✨</span>
        </span>
      );
    }
    return part;
  });
};

// Helper to parse bracketed rank tags like [ رتبة زائر ], mentions, and greetings
const renderTextWithHighlightedRanks = (rawText: string) => {
  if (!rawText) return null;

  // Check if text has rank tags
  if (rawText.includes('[') && rawText.includes(']')) {
    const parts = rawText.split(/(\[\s*رتبة\s*[^\]]+\s*\])/g);
    return parts.map((part, idx) => {
      if (/^\[\s*رتبة\s*[^\]]+\s*\]$/.test(part.trim())) {
        return (
          <span
            key={idx}
            className="text-red-600 font-black mx-1 px-1.5 py-0.5 rounded-md bg-red-50 border border-red-200 inline-block shadow-2xs"
          >
            {part}
          </span>
        );
      }
      return part;
    });
  }

  // Highlight blue mentions like "I ibtisām I" at the start
  if (rawText.startsWith('I ibtisām') || rawText.startsWith('ibtisām')) {
    const mention = rawText.startsWith('I ibtisām I') ? 'I ibtisām I' : 'I ibtisām';
    const rest = rawText.replace(mention, '');
    return (
      <>
        <span className="text-[#2563eb] font-black text-sm sm:text-base drop-shadow-[0_0_6px_rgba(37,99,235,0.4)] ml-1">
          {mention}
        </span>
        <span>{rest}</span>
      </>
    );
  }

  return rawText;
};

export const ChatMessages: React.FC = () => {
  const {
    messages, currentRoom, currentUser, users,
    setSelectedUserForCard, setSelectedUserForProfile, deleteMessage,
    setInputInsertedUsername, reactToMessage, setIsProfileSettingsOpen,
    typingUsers
  } = useChat();

  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const [activeMenuMsgId, setActiveMenuMsgId] = useState<string | null>(null);
  const [activeEmojiPickerMsgId, setActiveEmojiPickerMsgId] = useState<string | null>(null);
  const [reportingMsg, setReportingMsg] = useState<Message | null>(null);

  const roomMessages = messages.filter(m => m.roomId === currentRoom.id);

  // Toggle voice playback
  const handleToggleVoice = (msgId: string, mediaUrl?: string) => {
    if (!mediaUrl) return;
    if (playingVoiceId === msgId) {
      setPlayingVoiceId(null);
    } else {
      setPlayingVoiceId(msgId);
      const audio = new Audio(mediaUrl);
      audio.play().catch(() => {});
      audio.onended = () => setPlayingVoiceId(null);
    }
  };

  // Click on username -> inserts name into message input box
  const handleUsernameClick = (name: string) => {
    setInputInsertedUsername(name);
  };

  // Click on avatar -> opens User Card popover
  const handleAvatarClick = (senderId: string) => {
    const foundUser = users.find(u => u.id === senderId);
    if (foundUser) {
      setSelectedUserForCard(foundUser);
    }
  };

  // Click on a user name or profile specifically (e.g., from system mute/kick announcements)
  const handleOpenUserProfileByNameOrId = (usernameOrId: string) => {
    const trimmed = usernameOrId.trim();
    const foundUser = users.find(u => u.id === trimmed || u.username.toLowerCase() === trimmed.toLowerCase());
    if (foundUser) {
      setSelectedUserForProfile(foundUser);
      setSelectedUserForCard(null);
    } else {
      // If user left or temporary, create fallback object so modal still opens
      setSelectedUserForProfile({
        id: `user-temp-${Date.now()}`,
        username: trimmed,
        role: 'member',
        gender: 'female',
        age: 20,
        country: 'اليمن',
        currentRoomId: currentRoom.id,
        joinedDate: '2026/01/01',
        lastSeen: 'الآن',
        coins: 0,
        likes: 0,
        privatePrivacy: 'everyone',
        onlineStatus: 'online'
      });
      setSelectedUserForCard(null);
    }
  };

  const isModOrHigher = currentUser && ['moderator', 'management', 'admin', 'owner'].includes(currentUser.role);

  // Assign distinct aesthetic username colors matching screenshot
  const getUsernameColor = (msg: Message) => {
    if (msg.senderUsernameColor) return msg.senderUsernameColor;
    if (msg.senderName.includes('غزااالة')) return '#e11d48'; // Bright Rose/Red
    if (msg.senderName.includes('زروج')) return '#be123c'; // Dark Rose
    if (msg.senderName.includes('بحر الهوى')) return '#854d0e'; // Brown/Amber
    if (msg.senderName.includes('ibtisām') || msg.senderName.includes('Ibtisām')) return '#475569'; // Slate
    switch (msg.senderRole) {
      case 'owner': return '#e11d48'; // Rose red
      case 'admin': return '#ea580c'; // Orange
      case 'management': return '#d97706'; // Amber/Gold
      case 'moderator': return '#2563eb'; // Royal Blue
      case 'vip': return '#0284c7'; // Cyan
      case 'member': return '#059669'; // Emerald
      default: return '#334155'; // Dark slate
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-white custom-scrollbar text-slate-800 divide-y divide-slate-100 min-h-[400px]">
      {/* Visitor Room Welcome Banner */}
      {currentUser?.role === 'visitor' && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-orange-500/10 border-b border-amber-200 p-3 dir-rtl flex flex-col sm:flex-row items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0 text-sm shadow-xs">
              👤
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">
                مرحباً بك كزائر ({currentUser.username}) في {currentRoom.name} {currentRoom.flag}
              </p>
              <p className="text-[11px] text-amber-900/80 font-semibold">
                يمكنك الدردشة والتفاعل والتعبير عن رأيك. لإنشاء حساب دائم وحفظ رتبتك واسمك، اضغط على زر التسجيل.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsProfileSettingsOpen(true)}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 shrink-0 cursor-pointer flex items-center gap-1.5"
          >
            <span>تسجيل حساب عضو 👑</span>
          </button>
        </div>
      )}

      {roomMessages.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
          <p className="text-sm font-bold">لا توجد رسائل في {currentRoom.name} بعد.</p>
          <p className="text-xs mt-1">كن أول من يبدأ المحادثة الآن! 💬</p>
        </div>
      ) : (
        roomMessages.map((msg) => {
          if (msg.type === 'system') {
            const cleanText = msg.text.replace(/\*\*(.*?)\*\*/g, '$1');
            return (
              <div key={msg.id} className="py-2 px-3 flex justify-center bg-slate-50/50">
                <div className="bg-sky-100/90 border border-sky-200 text-sky-900 text-xs sm:text-sm px-4 py-2 rounded-2xl max-w-xl text-center shadow-2xs font-medium">
                  {cleanText}
                </div>
              </div>
            );
          }

          // Check if message is a System moderation announcement (e.g. System alert for Mute/Kick/Ban)
          const isSystemAnnouncement = msg.senderId === 'user-system' || msg.senderName === 'System';
          
          if (isSystemAnnouncement) {
            // Find target username from msg.targetUserId or parse from text
            let penalizedName = '';
            if (msg.targetUserId) {
              const u = users.find(usr => usr.id === msg.targetUserId);
              if (u) penalizedName = u.username;
            }
            if (!penalizedName) {
              if (msg.text.includes('\n')) {
                penalizedName = msg.text.split('\n')[0].trim();
              } else if (msg.text.includes('العضو:')) {
                const after = msg.text.split('العضو:')[1];
                penalizedName = after.split('|')[0].trim();
              } else if (msg.text.includes('على "')) {
                penalizedName = msg.text.split('على "')[1].split('"')[0].trim();
              }
            }

            const isMuteOrKickOrBan = msg.text.includes('كتم') || msg.text.includes('طرد') || msg.text.includes('حظر');
            const targetUserObj = penalizedName ? (users.find(u => u.username === penalizedName || u.id === msg.targetUserId)) : null;

            return (
              <div
                key={msg.id}
                className="flex items-center justify-between gap-3 p-3 sm:p-3.5 hover:bg-slate-50/70 transition-colors group relative dir-rtl"
              >
                {/* Right Side: Alert Icon / Avatar + System & Target details */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Circular Black Alert/Exclamation Icon or Avatar */}
                  <div
                    onClick={() => {
                      if (targetUserObj) {
                        setSelectedUserForProfile(targetUserObj);
                        setSelectedUserForCard(null);
                      } else if (penalizedName) {
                        handleOpenUserProfileByNameOrId(penalizedName);
                      }
                    }}
                    className="shrink-0 w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-black text-lg border border-slate-700 shadow-xs cursor-pointer hover:scale-105 active:scale-95 transition-transform"
                    title={penalizedName ? `عرض ملف ${penalizedName}` : 'System'}
                  >
                    <span className="text-white text-xl">❗</span>
                  </div>

                  {/* Text Details: Line 1 Red System, Line 2 Target User Name + Site Domain */}
                  <div className="flex flex-col text-right min-w-0 pr-0.5">
                    {/* Line 1: Red System Label */}
                    <span className="font-extrabold text-sm sm:text-base text-[#e11d48] tracking-tight text-right w-fit">
                      System
                    </span>

                    {/* Line 2: Target User Name & domain / action text */}
                    <div className="mt-0.5 text-xs sm:text-sm text-slate-500 font-bold flex items-center gap-1.5 flex-wrap">
                      {penalizedName ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (targetUserObj) {
                              setSelectedUserForProfile(targetUserObj);
                              setSelectedUserForCard(null);
                            } else {
                              handleOpenUserProfileByNameOrId(penalizedName);
                            }
                          }}
                          className="text-slate-800 hover:text-red-600 font-extrabold hover:underline cursor-pointer transition-colors"
                          title={`عرض الملف الشخصي لـ ${penalizedName}`}
                        >
                          {penalizedName}
                        </button>
                      ) : null}
                      <span className="text-slate-400 font-medium">arabsyemen.com</span>
                      {msg.text.includes('تم كتم') && <span className="text-amber-600 font-bold">(تم الكتم)</span>}
                      {msg.text.includes('تم طرد') && <span className="text-red-600 font-bold">(تم الطرد)</span>}
                      {msg.text.includes('تم حظر') && <span className="text-purple-600 font-bold">(تم الحظر)</span>}
                    </div>
                  </div>
                </div>

                {/* Left Side: Timestamp & 3 dots */}
                <div className="flex items-center gap-1.5 text-slate-400 shrink-0 self-start pt-1 dir-ltr">
                  {currentUser && isModOrHigher && (
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                      title="حذف الإشعار"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-[11px] sm:text-xs text-slate-400 font-semibold font-sans">
                    {toEnglishDigits(msg.timestamp)} {toEnglishDigits(msg.date ? msg.date.substring(0, 5) : '15/08')}
                  </span>
                </div>
              </div>
            );
          }

          const isMe = currentUser?.id === msg.senderId;
          const userColor = getUsernameColor(msg);
          const isJoinMessage = msg.text.includes('انضم للغرفة');

          return (
            <div
              key={msg.id}
              className="flex items-start justify-between gap-3 p-3 sm:p-3.5 hover:bg-slate-50/70 transition-colors group relative dir-rtl"
            >
              {/* 1. Right Side (RTL Start): User Avatar & Text Details */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                {/* Far Right: Circular User Avatar */}
                <button
                  onClick={() => handleAvatarClick(msg.senderId)}
                  className="shrink-0 transition-transform active:scale-95 cursor-pointer mt-0.5"
                  title={`عرض كرت ${msg.senderName}`}
                >
                  <UserAvatar
                    avatarUrl={msg.senderAvatar}
                    gender={msg.senderGender}
                    role={msg.senderRole}
                    username={msg.senderName}
                    size="md"
                  />
                </button>

                {/* Text Block aligned to the Right */}
                <div className="flex flex-col text-right min-w-0 pr-0.5">
                  {/* Line 1: Username */}
                  <button
                    onClick={() => handleUsernameClick(msg.senderName)}
                    style={{
                      color: userColor,
                      fontSize: msg.senderUsernameFontSize || undefined,
                      textShadow: NEON_COLORS.some(n => n.value.toLowerCase() === (userColor || '').toLowerCase())
                        ? `0 0 7px ${userColor}, 0 0 2px #000`
                        : 'none'
                    }}
                    className="font-extrabold text-sm sm:text-base hover:underline cursor-pointer tracking-tight text-right w-fit"
                    title="اضغط لإدراج الاسم في خانة الكتابة"
                  >
                    {msg.senderName}
                  </button>

                  {/* Line 2: Message Content or Join Badge */}
                  <div className="mt-0.5">
                    {isJoinMessage ? (
                      /* System User Join Pill/Badge matching Screenshot */
                      <div className="bg-[#e0f2fe] border border-sky-200 text-[#0369a1] text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full shadow-2xs my-0.5 inline-flex items-center gap-1 dir-rtl">
                        <span>هذا المستخدم انضم للغرفة</span>
                        {msg.text.includes('[') && (
                          <span className="text-red-600 font-black">
                            [{msg.text.split('[')[1]}
                          </span>
                        )}
                      </div>
                    ) : (
                      /* Regular Message Text */
                      msg.type === 'text' && (
                        <p
                          style={{
                            color: msg.textColor || undefined,
                            fontSize: msg.textFontSize || undefined,
                            fontWeight: msg.textWeight || undefined,
                            textShadow: msg.textColor && NEON_COLORS.some(n => n.value.toLowerCase() === (msg.textColor || '').toLowerCase())
                              ? `0 0 8px ${msg.textColor}, 0 0 3px #000`
                              : undefined
                          }}
                          className={`text-sm sm:text-base text-slate-800 leading-relaxed break-words dir-rtl ${
                            msg.text.includes('وعليكم السلام') ? 'text-red-600 font-black text-lg' : 'font-medium'
                          }`}
                        >
                          {renderTextWithHighlightedRanks(msg.text)}
                        </p>
                      )
                    )}

                    {/* Media Attachments */}
                    {msg.type === 'image' && msg.mediaUrl && (
                      <div className="mt-1">
                        {msg.mediaUrl.includes('notoemoji') || msg.mediaUrl.endsWith('.webp') || msg.mediaUrl.endsWith('.gif') ? (
                          <div className="inline-block p-1">
                            <img
                              src={msg.mediaUrl}
                              alt="ملصق متحرك"
                              className="w-24 h-24 sm:w-28 sm:h-28 object-contain hover:scale-110 transition-transform cursor-pointer drop-shadow-md"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <img
                            src={msg.mediaUrl}
                            alt="مرفق صورة"
                            className="max-h-60 rounded-xl object-contain bg-slate-100 border border-slate-200 shadow-2xs"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </div>
                    )}

                    {/* Voice Message */}
                    {msg.type === 'voice' && msg.mediaUrl && (
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 my-1 max-w-xs shadow-2xs dir-rtl">
                        <button
                          onClick={() => handleToggleVoice(msg.id, msg.mediaUrl)}
                          className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
                        >
                          {playingVoiceId === msg.id ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 translate-x-0.5" />
                          )}
                        </button>

                        <div className="flex-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                            <span className="flex items-center gap-1 font-bold">
                              <Volume2 className="w-3.5 h-3.5 text-amber-600" />
                              <span>رسالة صوتية</span>
                            </span>
                            <span>{msg.voiceDuration || 3}ث</span>
                          </div>
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full bg-amber-500 transition-all duration-300 ${
                                playingVoiceId === msg.id ? 'w-full animate-pulse' : 'w-0'
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Reactions Pill Display */}
                    {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mt-1.5 justify-start">
                        {Object.entries(msg.reactions).map(([emoji, rawUserIds]) => {
                          const userIds = (rawUserIds as string[]) || [];
                          if (userIds.length === 0) return null;
                          const hasMyReaction = currentUser ? userIds.includes(currentUser.id) : false;
                          const stickerUrl = EMOJI_STICKER_MAP[emoji];
                          return (
                            <button
                              key={emoji}
                              onClick={() => reactToMessage(msg.id, emoji)}
                              className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border transition-all cursor-pointer select-none active:scale-95 ${
                                hasMyReaction
                                  ? 'bg-amber-100 border-amber-300 text-amber-900 font-bold shadow-2xs'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-100'
                              }`}
                              title={`${userIds.length} تفاعل`}
                            >
                              {stickerUrl && stickerUrl.trim() !== '' ? (
                                <img src={stickerUrl} alt={emoji} className="w-4 h-4 object-contain" referrerPolicy="no-referrer" />
                              ) : (
                                <span>{emoji}</span>
                              )}
                              <span className="text-[11px] font-bold">{userIds.length}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Left Side (RTL End): Timestamp & Options (•••) */}
              <div className="flex items-center gap-1.5 text-slate-400 shrink-0 self-start pt-1 dir-ltr">
                {/* 3 Dots Menu Button (Horizontal) */}
                {currentUser && (
                  <div className="relative">
                    <button
                      onClick={() => setActiveMenuMsgId(activeMenuMsgId === msg.id ? null : msg.id)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-300 hover:text-slate-600 transition-colors cursor-pointer font-bold"
                      title="خيارات الرسالة"
                    >
                      <MoreHorizontal className="w-4 h-4 stroke-[2.5]" />
                    </button>

                    {activeMenuMsgId === msg.id && (
                      <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 dir-rtl text-xs animate-in fade-in duration-100">
                        {!isMe && !isModOrHigher && (
                          <button
                            onClick={() => {
                              setActiveMenuMsgId(null);
                              setReportingMsg(msg);
                            }}
                            className="w-full text-right px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-1.5 cursor-pointer font-bold"
                          >
                            <Flag className="w-3.5 h-3.5 text-red-500" />
                            <span>إبلاغ عن المحتوى المسيء 🚩</span>
                          </button>
                        )}

                        {isModOrHigher && (
                          <button
                            onClick={() => {
                              setActiveMenuMsgId(null);
                              if (confirm('هل أنت متأكد من حذف هذه الرسالة؟')) {
                                deleteMessage(msg.id);
                              }
                            }}
                            className="w-full text-right px-3 py-2 hover:bg-red-50 text-red-600 flex items-center gap-1.5 cursor-pointer font-bold"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            <span>حذف</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Date / Timestamp */}
                <span className="text-[11px] sm:text-xs text-slate-400 font-semibold font-sans">
                  {toEnglishDigits(msg.timestamp)} {toEnglishDigits(msg.date ? msg.date.substring(0, 5) : '12/08')}
                </span>
              </div>
            </div>
          );
        })
      )}

      {/* Live Typing Indicator */}
      {(() => {
        const activeRoomTypers = (Object.entries(typingUsers || {}) as [string, { username: string; roomId: string; isTyping: boolean }][])
          .filter(([userId, data]) => data.isTyping && data.roomId === currentRoom.id && userId !== currentUser?.id)
          .map(([_, data]) => data);

        if (activeRoomTypers.length === 0) return null;

        return (
          <div className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200/90 px-3.5 py-1.5 rounded-full w-fit animate-pulse my-2 mx-3 shadow-2xs">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
            <span>✍️ {activeRoomTypers.map(t => t.username).join('، ')} يكتب الآن...</span>
          </div>
        );
      })()}

      {/* Report Message Modal */}
      {reportingMsg && (
        <ReportMessageModal
          message={reportingMsg}
          onClose={() => setReportingMsg(null)}
        />
      )}
    </div>
  );
};
