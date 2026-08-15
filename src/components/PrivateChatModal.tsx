import React, { useState, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import { VoiceRecorder, playChatSound } from '../utils/audio';
import {
  X, Settings, Minus, Send, Mic, Square, Volume2, Volume1, VolumeX, Flag,
  Plus, Image as ImageIcon, Smile, MoreHorizontal, UserX,
  Ban, Trash2, Check, MessageSquare, Bell
} from 'lucide-react';
import { ReportMessageModal } from './ReportMessageModal';
import { PrivateMessage, User } from '../types';
import { getRankTitle, canBeIgnored } from '../utils/permissions';
import { toEnglishDigits } from '../utils/dateUtils';

export const PrivateChatModal: React.FC = () => {
  const {
    setIsPrivateChatOpen, activePrivateUserId, setActivePrivateUserId,
    currentUser, users, privateMessages, sendPrivateMessage, deletePrivateMessages,
    isUserBlocked, setSelectedUserForProfile, toggleIgnore, updateUserProfile,
    hiddenPrivateUserIds, hidePrivateConversation, clearAllPrivateConversations,
    audioSettings, updateAudioSettings
  } = useChat();

  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [reportingPm, setReportingPm] = useState<PrivateMessage | null>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [emojiCategory, setEmojiCategory] = useState('all');

  // Header Dropdown Popover & Private Settings state
  const [isGearMenuOpen, setIsGearMenuOpen] = useState(false);
  const [isPrivateSettingsOpen, setIsPrivateSettingsOpen] = useState(false);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!currentUser) return null;

  const targetUser = users.find(u => u.id === activePrivateUserId);

  // Filter messages between current user and activePrivateUserId
  const chatMessages = privateMessages.filter(
    pm => (pm.senderId === currentUser.id && pm.receiverId === activePrivateUserId) ||
          (pm.senderId === activePrivateUserId && pm.receiverId === currentUser.id)
  );

  // List of active private chat partners who are NOT hidden
  const activeChatPartnerIds = Array.from(new Set(
    privateMessages
      .filter(pm => pm.senderId === currentUser.id || pm.receiverId === currentUser.id)
      .map(pm => pm.senderId === currentUser.id ? pm.receiverId : pm.senderId)
  )).filter(id => !hiddenPrivateUserIds.includes(id));

  // Other room users not hidden
  const otherUsers = users
    .filter(u => u.id !== currentUser.id && !activeChatPartnerIds.includes(u.id) && !hiddenPrivateUserIds.includes(u.id));

  const displayUserIds = activeChatPartnerIds;

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !activePrivateUserId) return;
    const ok = sendPrivateMessage(activePrivateUserId, text.trim());
    if (ok) {
      setText('');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && activePrivateUserId) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sendPrivateMessage(activePrivateUserId, 'صورة', 'image', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startVoice = async () => {
    recorderRef.current = new VoiceRecorder();
    const ok = await recorderRef.current.startRecording();
    if (ok) setIsRecording(true);
  };

  const stopVoice = async () => {
    if (recorderRef.current && isRecording && activePrivateUserId) {
      const data = await recorderRef.current.stopRecording();
      setIsRecording(false);
      sendPrivateMessage(activePrivateUserId, 'رسالة صوتية', 'voice', data.base64, data.durationSec);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-[#0B1328] text-white border border-slate-800 rounded-3xl w-full max-w-md h-[85vh] flex flex-col overflow-hidden shadow-2xl relative select-none">
        
        {/* Header Bar */}
        {!activePrivateUserId ? (
          /* List Header matching user request & Screenshot 2 */
          <div className="bg-[#0B252E] px-4 py-3 border-b border-[#081d24] flex items-center justify-between select-none">
            {/* Left side (RTL end): Exit/Close Button (✖) */}
            <button
              onClick={() => {
                setIsPrivateChatOpen(false);
                setActivePrivateUserId(null);
              }}
              className="w-8 h-8 rounded-full bg-slate-800/60 hover:bg-red-600/80 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="إغلاق القائمة"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Right side (RTL start): Clear Button 🗑️ & Settings Button ⚙️ */}
            <div className="flex items-center gap-3">
              <button
                onClick={clearAllPrivateConversations}
                className="text-white hover:text-red-300 font-extrabold text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                title="حذف وإخفاء الكل من القائمة"
              >
                <span>Clear</span>
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsPrivateSettingsOpen(true)}
                className="w-7 h-7 rounded-lg text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="إعدادات الخاص"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Active Chat Header - Controls on left (✖ ⚙ ➖), User Info on right */
          <div className="bg-[#0B1328] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between relative">
            
            {/* Header Control Buttons on Left (✖ ⚙ ➖) */}
            <div className="flex items-center gap-2">
              
              {/* Close Button (✖): Exits private chat completely */}
              <button
                onClick={() => {
                  setIsPrivateChatOpen(false);
                  setActivePrivateUserId(null);
                }}
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-red-600/80 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="إغلاق المحادثة الخاصة الخروج"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Settings / Options Gear Button (⚙): Toggles popup menu matching Screenshot 2 */}
              <button
                onClick={() => setIsGearMenuOpen(!isGearMenuOpen)}
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                title="خيارات المحادثة والإعدادات"
              >
                <Settings className="w-4 h-4" />
              </button>

              {/* Back to List Button (➖) */}
              <button
                onClick={() => setActivePrivateUserId(null)}
                className="w-7 h-7 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
                title="تصغير / الرجوع للقائمة"
              >
                <Minus className="w-4 h-4" />
              </button>

              {/* Header Gear Popover Menu matching Screenshot 2 */}
              {isGearMenuOpen && (
                <div className="absolute left-2 top-11 w-48 bg-white text-slate-900 border border-slate-200 rounded-xl shadow-2xl z-50 py-1 font-extrabold text-xs animate-in fade-in zoom-in-95 duration-100">
                  
                  {/* 1. تجاهل */}
                  <button
                    onClick={() => {
                      setIsGearMenuOpen(false);
                      if (targetUser) {
                        if (canBeIgnored(targetUser)) {
                          toggleIgnore(targetUser.id);
                          deletePrivateMessages(targetUser.id);
                        } else {
                          alert('عفواً، لا يمكنك تجاهل رتب الإدارة العليا 🛡️');
                        }
                      }
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 text-slate-800 cursor-pointer transition-colors"
                  >
                    <span>تجاهل</span>
                    <Ban className="w-4 h-4 text-sky-500" />
                  </button>

                  <div className="border-t border-slate-100" />

                  {/* 2. الإعدادات */}
                  <button
                    onClick={() => {
                      setIsGearMenuOpen(false);
                      setIsPrivateSettingsOpen(true);
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-slate-50 text-slate-800 cursor-pointer transition-colors"
                  >
                    <span>الإعدادات</span>
                    <Settings className="w-4 h-4 text-sky-500" />
                  </button>

                  {/* 3. حذف سجل المحادثة الخاصة */}
                  <div className="border-t border-slate-100" />
                  <button
                    onClick={() => {
                      setIsGearMenuOpen(false);
                      if (targetUser && window.confirm('هل أنت متأكد من رغبتك في حذف سجل هذه المحادثة الخاصة نهائياً؟')) {
                        deletePrivateMessages(targetUser.id);
                      }
                    }}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-red-50 text-red-600 cursor-pointer transition-colors"
                  >
                    <span>حذف سجل المحادثة</span>
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>

                </div>
              )}

            </div>

            {/* Target User Info on Right (Avatar + Name) */}
            <div
              onClick={() => {
                if (targetUser) setSelectedUserForProfile(targetUser);
              }}
              className="flex items-center gap-2.5 cursor-pointer hover:opacity-90"
            >
              <span className="text-base font-black text-white">{targetUser?.username}</span>
              <UserAvatar
                avatarUrl={targetUser?.avatar}
                gender={targetUser?.gender}
                role={targetUser?.role}
                username={targetUser?.username}
                size="sm"
              />
            </div>

          </div>
        )}

        {/* Content Body */}
        {!activePrivateUserId ? (
          /* Vertical List of Conversations / Users - Light Canvas matching Screenshot 2 */
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#f0f4f7] custom-scrollbar dir-rtl">
            {displayUserIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center border border-slate-300">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">لا توجد رسائل خاصة حالياً</p>
                  <p className="text-xs text-slate-500 mt-1">عند تلقي أو إرسال أي رسالة خاصة ستظهر المحادثة هنا.</p>
                </div>
              </div>
            ) : (
              displayUserIds.map((userId) => {
                const partner = users.find(u => u.id === userId) || {
                  id: userId,
                  username: `مستخدم (${String(userId).slice(-4)})`,
                  avatar: '',
                  gender: 'male',
                  role: 'member'
                } as User;

                const unread = privateMessages.filter(
                  pm => pm.senderId === partner.id && pm.receiverId === currentUser.id && !pm.isRead
                ).length;

                return (
                  <div
                    key={userId}
                    onClick={() => setActivePrivateUserId(userId)}
                    className="p-3 bg-white text-slate-900 hover:bg-slate-50/90 border border-slate-200/90 rounded-2xl flex items-center justify-between cursor-pointer transition-all shadow-2xs group"
                  >
                    {/* Left side (RTL end): X Button to hide user + Unread count badge */}
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          hidePrivateConversation(partner.id);
                        }}
                        className="p-1 rounded-lg hover:bg-red-50 text-[#334155] hover:text-red-600 transition-colors cursor-pointer"
                        title="إخفاء من القائمة"
                      >
                        <X className="w-4 h-4 stroke-[2.5]" />
                      </button>

                      {unread > 0 && (
                        <span className="bg-[#d91e18] text-white text-xs font-black px-2 py-0.5 rounded-md min-w-[20px] text-center shadow-2xs animate-pulse">
                          {unread}
                        </span>
                      )}
                    </div>

                    {/* Right side (RTL start): Username & Avatar */}
                    <div className="flex items-center gap-3">
                      <span
                        className="text-sm font-extrabold transition-colors"
                        style={{ color: partner.usernameColor || '#1e293b' }}
                      >
                        {partner.username}
                      </span>

                      <UserAvatar
                        avatarUrl={partner.avatar}
                        gender={partner.gender}
                        role={partner.role}
                        username={partner.username}
                        size="md"
                        showRankBadge={false}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Direct Message Chat View */
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-[#090d16]">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="text-center text-slate-500 py-12 text-xs">
                  ابدأ المحادثة الخاصة مع <span className="text-white font-bold">{targetUser?.username}</span>...
                </div>
              ) : (
                chatMessages.map((pm) => {
                  const isMe = pm.senderId === currentUser.id;

                  return (
                    <div
                      key={pm.id}
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                    >
                      <div className="flex items-end gap-2 max-w-[85%]">
                        {!isMe && (
                          <UserAvatar
                            avatarUrl={targetUser?.avatar}
                            gender={targetUser?.gender}
                            role={targetUser?.role}
                            username={targetUser?.username}
                            size="xs"
                          />
                        )}

                        <div
                          className={`p-3 rounded-2xl text-xs shadow-md relative ${
                            isMe
                              ? 'bg-[#222222] text-white border border-neutral-700/80 rounded-br-none'
                              : 'bg-[#00a2e8] text-white font-medium rounded-bl-none'
                          }`}
                        >
                          {pm.type === 'text' && (
                            <p className="leading-relaxed whitespace-pre-wrap break-words">{pm.text}</p>
                          )}

                          {pm.type === 'image' && pm.mediaUrl && pm.mediaUrl.trim() !== '' && (
                            <img
                              src={pm.mediaUrl}
                              alt="مرفق"
                              className="max-w-xs rounded-lg my-1 max-h-48 object-cover"
                            />
                          )}

                          {pm.type === 'voice' && (
                            <div className="flex items-center gap-2">
                              <Volume2 className="w-4 h-4 text-amber-300" />
                              <span>رسالة صوتية</span>
                            </div>
                          )}

                          {!isMe && currentUser.role !== 'visitor' && (
                            <button
                              onClick={() => setReportingPm(pm)}
                              className="absolute -top-2 -left-2 bg-slate-900 border border-slate-700 text-slate-400 hover:text-red-400 p-1 rounded-full cursor-pointer opacity-80 hover:opacity-100 transition-opacity"
                              title="إبلاغ"
                            >
                              <Flag className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>

                        {isMe && (
                          <UserAvatar
                            avatarUrl={currentUser.avatar}
                            gender={currentUser.gender}
                            role={currentUser.role}
                            username={currentUser.username}
                            size="xs"
                          />
                        )}
                      </div>

                      {/* Timestamp displayed below message bubble */}
                      <span className="text-[9px] text-slate-500 mt-1 dir-ltr font-mono px-1">
                        {toEnglishDigits(pm.timestamp)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Bar */}
            {activePrivateUserId && isUserBlocked(activePrivateUserId) ? (
              <div className="p-3 bg-red-950/80 border-t border-red-800 text-center text-xs text-red-300 font-bold">
                🚫 لا يمكنك التواصل مع هذا العضو بسبب الحظر.
              </div>
            ) : (
              <form
                onSubmit={handleSend}
                className="p-2.5 bg-[#0d1628] border-t border-slate-800 flex items-center gap-2"
              >
                {/* Left Action Icons (+ image) */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="إرسال صورة"
                  >
                    <ImageIcon className="w-4 h-4" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />

                  <button
                    type="button"
                    onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                    className="p-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="إيموجي وسمايلات"
                  >
                    <Smile className="w-4 h-4" />
                  </button>
                </div>

                {/* Emoji Popover in Private Chat */}
                {isEmojiOpen && (
                  <div className="absolute bottom-full right-2 mb-2 w-72 sm:w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2.5 z-50 animate-in fade-in duration-150 text-white">
                    <div className="flex items-center justify-between pb-1.5 border-b border-slate-800 mb-2">
                      <div className="flex items-center gap-1 text-xs font-black text-amber-400">
                        <span>😊</span>
                        <span>قائمة الإيموجيات والسمايلات</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEmojiOpen(false)}
                        className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px] font-bold custom-scrollbar mb-2">
                      {[
                        { id: 'all', label: 'الكل 😊' },
                        { id: 'smileys', label: 'وجوه 😊' },
                        { id: 'emoticons', label: 'سمايلات 💬' },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setEmojiCategory(cat.id)}
                          className={`px-2 py-0.5 rounded-full whitespace-nowrap cursor-pointer transition-all ${
                            emojiCategory === cat.id
                              ? 'bg-amber-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-4 gap-1.5 max-h-52 overflow-y-auto p-1 custom-scrollbar">
                      {[
                        { id: '1', emoji: '😊', name: 'ابتسامة', category: 'smileys' },
                        { id: '2', emoji: '😂', name: 'ضحك', category: 'smileys' },
                        { id: '3', emoji: '🤣', name: 'كركرة', category: 'smileys' },
                        { id: '4', emoji: '🥰', name: 'حب', category: 'smileys' },
                        { id: '5', emoji: '😍', name: 'عشق', category: 'smileys' },
                        { id: '6', emoji: '😎', name: 'هيبة', category: 'smileys' },
                        { id: '7', emoji: '🥳', name: 'احتفال', category: 'smileys' },
                        { id: '8', emoji: '🫡', name: 'تحية', category: 'smileys' },
                        { id: '23', emoji: ':1:', name: 'سمايل 1', category: 'emoticons' },
                        { id: '24', emoji: ':love:', name: 'حب وقلب', category: 'emoticons' },
                        { id: '25', emoji: ':haha3:', name: 'كركرة', category: 'emoticons' },
                        { id: '26', emoji: ':وردة:', name: 'وردة', category: 'emoticons' },
                        { id: '27', emoji: ':تيم:', name: 'تيم', category: 'emoticons' },
                        { id: '28', emoji: ':النصر:', name: 'النصر', category: 'emoticons' },
                      ]
                        .filter(item => emojiCategory === 'all' || item.category === emojiCategory)
                        .map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setText(prev => prev + item.emoji);
                            }}
                            className="bg-slate-800 hover:bg-slate-700 border border-slate-700/80 rounded-lg p-1.5 flex flex-col items-center justify-center cursor-pointer transition-transform hover:scale-110 active:scale-95"
                            title={item.name}
                          >
                            <span className="text-xl leading-none">{item.emoji}</span>
                            <span className="text-[8px] text-slate-400 mt-0.5 truncate w-full text-center">{item.name}</span>
                          </button>
                        ))}
                    </div>
                  </div>
                )}

                {/* Rounded Pill Text Input */}
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="اكتب هنا ..."
                  className="flex-1 bg-slate-100 text-slate-900 placeholder-slate-500 rounded-full px-4 py-2 text-xs font-semibold focus:outline-none"
                />

                {/* Mic & Send Buttons */}
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopVoice}
                    className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center cursor-pointer shrink-0"
                  >
                    <Square className="w-3.5 h-3.5 fill-white" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startVoice}
                    className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors cursor-pointer shrink-0"
                    title="تسجيل صوتي"
                  >
                    <Mic className="w-4 h-4" />
                  </button>
                )}

                <button
                  type="submit"
                  className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 text-white flex items-center justify-center hover:bg-slate-800 cursor-pointer shrink-0"
                  title="إرسال"
                >
                  <Send className="w-4 h-4 rotate-180" />
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Report Modal */}
      {reportingPm && (
        <ReportMessageModal
          message={reportingPm}
          onClose={() => setReportingPm(null)}
        />
      )}

      {/* Private Settings Options Modal */}
      {isPrivateSettingsOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 dir-rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-slate-900 border border-slate-200">
            
            <div className="bg-[#0b333e] px-4 py-3 flex items-center justify-between text-white">
              <button
                onClick={() => setIsPrivateSettingsOpen(false)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5 font-bold" />
              </button>
              <span className="text-sm font-black">إعدادات استقبال الخاص</span>
            </div>

            <div className="p-4 space-y-2.5 text-xs font-extrabold">
              
              {/* Option 1: تشغيل للجميع */}
              <button
                onClick={() => {
                  updateUserProfile({ privatePrivacy: 'everyone' });
                  alert('تم إعداد الخاص: تشغيل للجميع 🟢');
                  setIsPrivateSettingsOpen(false);
                }}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentUser.privatePrivacy === 'everyone'
                    ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>تشغيل للجميع</span>
                {currentUser.privatePrivacy === 'everyone' && <Check className="w-4 h-4 text-sky-600 font-black" />}
              </button>

              {/* Option 2: للأعضاء */}
              <button
                onClick={() => {
                  updateUserProfile({ privatePrivacy: 'members' });
                  alert('تم إعداد الخاص: للأعضاء فقط 👥');
                  setIsPrivateSettingsOpen(false);
                }}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentUser.privatePrivacy === 'members'
                    ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>للأعضاء</span>
                {currentUser.privatePrivacy === 'members' && <Check className="w-4 h-4 text-sky-600 font-black" />}
              </button>

              {/* Option 3: للأصدقاء فقط (Hidden for Visitor rank!) */}
              {currentUser.role !== 'visitor' && (
                <button
                  onClick={() => {
                    updateUserProfile({ privatePrivacy: 'friends' });
                    alert('تم إعداد الخاص: للأصدقاء فقط 🤝');
                    setIsPrivateSettingsOpen(false);
                  }}
                  className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    currentUser.privatePrivacy === 'friends'
                      ? 'bg-sky-50 border-sky-500 text-sky-700 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>للأصدقاء فقط</span>
                  {currentUser.privatePrivacy === 'friends' && <Check className="w-4 h-4 text-sky-600 font-black" />}
                </button>
              )}

              {/* Option 4: إيقاف عن الجميع */}
              <button
                onClick={() => {
                  updateUserProfile({ privatePrivacy: 'none' });
                  alert('تم إعداد الخاص: إيقاف عن الجميع 🔴');
                  setIsPrivateSettingsOpen(false);
                }}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentUser.privatePrivacy === 'none'
                    ? 'bg-red-50 border-red-500 text-red-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>إيقاف عن الجميع</span>
                {currentUser.privatePrivacy === 'none' && <Check className="w-4 h-4 text-red-600 font-black" />}
              </button>

              {/* Sound Notification for Private Messages */}
              <div className="pt-2 border-t border-slate-100 mt-2">
                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#0b333e]" />
                    <span className="text-xs font-bold text-slate-800">التنبيه الصوتي للرسائل</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => playChatSound('private')}
                      className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      title="تجربة صوت التنبيه"
                    >
                      <Volume1 className="w-3 h-3 text-[#0b333e]" />
                      <span>تجربة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAudioSettings({ privateSound: !(audioSettings?.privateSound !== false) })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        audioSettings?.privateSound !== false
                          ? 'bg-[#0b333e] text-white shadow-xs'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {audioSettings?.privateSound !== false ? 'مفعل 🔊' : 'معطل 🔇'}
                    </button>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
