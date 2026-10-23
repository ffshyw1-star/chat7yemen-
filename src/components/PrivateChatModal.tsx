import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import { VoiceRecorder, playChatSound } from '../utils/audio';
import { ReportMessageModal } from './ReportMessageModal';
import { PrivateMessage, User } from '../types';
import { getRankTitle, canBeIgnored } from '../utils/permissions';
import { toEnglishDigits } from '../utils/dateUtils';
import { renderTextWithCustomEmojis, getAllCustomEmojis } from './CustomEmojis';

export const PrivateChatModal: React.FC = () => {
  const {
    isPrivateChatOpen,
    setIsPrivateChatOpen,
    isPrivateMinimized,
    setIsPrivateMinimized,
    activePrivateUserId,
    setActivePrivateUserId,
    currentUser,
    users,
    privateMessages,
    sendPrivateMessage,
    deletePrivateMessages,
    isUserBlocked,
    setSelectedUserForProfile,
    toggleIgnore,
    updateUserProfile,
    requestBlockConfirm,
    hiddenPrivateUserIds,
    hidePrivateConversation,
    clearAllPrivateConversations,
    audioSettings,
    updateAudioSettings,
    customEmojis,
    openTextContextMenu,
    openImageContextMenu,
    showTopBanner
  } = useChat();

  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [reportingPm, setReportingPm] = useState<PrivateMessage | null>(null);
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPrivateSettingsOpen, setIsPrivateSettingsOpen] = useState(false);
  const [isPaintModalOpen, setIsPaintModalOpen] = useState(false);

  const recorderRef = useRef<VoiceRecorder | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [paintColor, setPaintColor] = useState('#012832');
  const [isDrawing, setIsDrawing] = useState(false);

  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startLongPressText = (textMsg: string, title?: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      openTextContextMenu(textMsg, title);
    }, 450);
  };

  const startLongPressImage = (imgUrl: string, altText?: string) => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      openImageContextMenu(imgUrl, altText);
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const targetUser = users.find(u => u.id === activePrivateUserId);

  // Filter messages between current user and activePrivateUserId
  const chatMessages = privateMessages.filter(
    pm => (pm.senderId === currentUser?.id && pm.receiverId === activePrivateUserId) ||
          (pm.senderId === activePrivateUserId && pm.receiverId === currentUser?.id)
  );

  // List of active private chat partners who are NOT hidden
  const activeChatPartnerIds = Array.from(new Set(
    privateMessages
      .filter(pm => pm.senderId === currentUser?.id || pm.receiverId === currentUser?.id)
      .map(pm => pm.senderId === currentUser?.id ? pm.receiverId : pm.senderId)
  )).filter(id => !hiddenPrivateUserIds.includes(id));

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages.length, activePrivateUserId]);

  // Click outside menu listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && !(e.target as HTMLElement).closest('#private_min')) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isMenuOpen]);

  // Listen to sticker clicks to insert tag into private chat input
  useEffect(() => {
    const handleStickerInsert = (e: Event) => {
      const customEvent = e as CustomEvent<{ tag: string }>;
      const tag = customEvent.detail?.tag;
      if (tag && activePrivateUserId) {
        setText((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
      }
    };
    window.addEventListener('insert-chat-sticker', handleStickerInsert);
    return () => window.removeEventListener('insert-chat-sticker', handleStickerInsert);
  }, [activePrivateUserId]);

  // Send message
  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || !activePrivateUserId) return;
    const ok = sendPrivateMessage(activePrivateUserId, text.trim());
    if (ok) {
      setText('');
      setIsEmojiOpen(false);
    }
  };

  // Image Upload
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

  // Voice recording
  const startVoice = async () => {
    recorderRef.current = new VoiceRecorder();
    const result = await recorderRef.current.startRecording();
    if (result.ok) {
      setIsRecording(true);
    } else {
      showTopBanner?.(result.error || 'تعذر الوصول للميكروفون. يرجى تفعيل إذن الميكروفون في المتصفح.', 'error');
    }
  };

  const stopVoice = async () => {
    if (recorderRef.current && isRecording && activePrivateUserId) {
      const data = await recorderRef.current.stopRecording();
      setIsRecording(false);
      sendPrivateMessage(activePrivateUserId, 'رسالة صوتية', 'voice', data.base64, data.durationSec);
    }
  };

  // Canvas Drawing Handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = paintColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const sendDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activePrivateUserId) return;
    const dataUrl = canvas.toDataURL('image/png');
    sendPrivateMessage(activePrivateUserId, 'لوحة رسم 🎨', 'image', dataUrl);
    setIsPaintModalOpen(false);
  };

  const clearDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Register ArabSyemen global window functions
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. openPrivate(userId, username, avatar)
    (window as any).openPrivate = (userId?: string, _username?: string, _avatar?: string) => {
      setIsPrivateMinimized(false);
      setIsPrivateChatOpen(true);
      if (userId) {
        setActivePrivateUserId(userId);
      }
    };

    // 2. resetPrivate() & resetPrivateBox()
    const handleReset = () => {
      setIsPrivateMinimized(false);
      setActivePrivateUserId(null);
      setIsPrivateChatOpen(false);
      setIsMenuOpen(false);
      setIsEmojiOpen(false);
    };
    (window as any).resetPrivate = handleReset;
    (window as any).resetPrivateBox = handleReset;

    // 3. togglePrivate(mode) -> 1 = minimize, 2 = restore
    (window as any).togglePrivate = (mode: number) => {
      if (mode === 1) {
        setIsPrivateMinimized(true);
        setIsMenuOpen(false);
        setIsEmojiOpen(false);
      } else if (mode === 2) {
        setIsPrivateMinimized(false);
        setIsPrivateChatOpen(true);
      }
    };

    // 4. reportPrivateLog(logId)
    (window as any).reportPrivateLog = (logId: string) => {
      const pm = privateMessages.find(m => m.id === logId);
      if (pm) {
        setReportingPm(pm);
      }
    };

    // 5. getPrivate(userId)
    (window as any).getPrivate = (userId: string) => {
      if (userId) {
        setIsPrivateMinimized(false);
        setIsPrivateChatOpen(true);
        setActivePrivateUserId(userId);
      }
    };

    // 6. privatePlay()
    (window as any).privatePlay = () => {
      playChatSound('private');
      try {
        const audioEl = document.getElementById('private_sound') as HTMLAudioElement;
        if (audioEl) audioEl.play().catch(() => {});
      } catch (err) {
        console.warn('Audio play fallback', err);
      }
    };

    // 7. savePrivateSettings(privacy)
    (window as any).savePrivateSettings = (privacy: 'everyone' | 'members' | 'friends' | 'none') => {
      updateUserProfile({ privatePrivacy: privacy });
      showTopBanner?.('تم حفظ إعدادات الخاص بنجاح', 'success');
      setIsPrivateSettingsOpen(false);
    };

    // 8. getPrivateSettings()
    (window as any).getPrivateSettings = () => {
      setIsMenuOpen(false);
      setIsPrivateSettingsOpen(true);
    };

    // 9. uploadPrivate()
    (window as any).uploadPrivate = () => {
      fileInputRef.current?.click();
    };

    // 10. clearPrivateList()
    (window as any).clearPrivateList = () => {
      clearAllPrivateConversations();
    };

    // 11. confirmClearPrivate()
    (window as any).confirmClearPrivate = () => {
      setIsMenuOpen(false);
      if (activePrivateUserId && window.confirm('هل أنت متأكد من حذف سجل هذه المحادثة الخاصة نهائياً؟')) {
        deletePrivateMessages(activePrivateUserId);
      }
    };

    // 12. hidePrivEmoticon()
    (window as any).hidePrivEmoticon = () => {
      setIsEmojiOpen(false);
    };

    // 13. getPrivSub()
    (window as any).getPrivSub = () => {
      // Toggle extra shortcuts
    };

    // 14. paintIt(mode)
    (window as any).paintIt = (_mode?: number) => {
      setIsPaintModalOpen(true);
    };

    // 15. getYoutube(mode)
    (window as any).getYoutube = (_mode?: number) => {
      const url = window.prompt('أدخل رابط فيديو يوتيوب لمشاركته في المحادثة الخاصة:');
      if (url && url.trim() && activePrivateUserId) {
        sendPrivateMessage(activePrivateUserId, url.trim());
      }
    };

  }, [
    setIsPrivateMinimized,
    setIsPrivateChatOpen,
    setActivePrivateUserId,
    privateMessages,
    updateUserProfile,
    showTopBanner,
    clearAllPrivateConversations,
    deletePrivateMessages,
    activePrivateUserId,
    sendPrivateMessage
  ]);

  if (!currentUser || !isPrivateChatOpen || isPrivateMinimized) {
    return (
      /* Hidden ArabSyemen Private Sound Element */
      <audio id="private_sound" src="/sounds/private.mp3" preload="auto" style={{ display: 'none' }} />
    );
  }

  return (
    <>
      {/* Hidden ArabSyemen Private Sound Element */}
      <audio id="private_sound" src="/sounds/private.mp3" preload="auto" style={{ display: 'none' }} />

      {/* Main ArabSyemen #private_box */}
      <div
        id="private_box"
        className="privelem animate-in fade-in zoom-in-95 duration-150"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label="المحادثة الخاصة"
      >
        {/* ===================================================================
            HEADER: #private_top
           =================================================================== */}
        <div id="private_top" className="private_top select-none">
          {/* User Info (Avatar + Name) */}
          <div
            className="private_user_zone flex items-center gap-2.5 min-w-0"
            onClick={() => {
              if (targetUser) {
                if (typeof (window as any).getProfile === 'function') {
                  (window as any).getProfile(targetUser.id);
                } else {
                  setSelectedUserForProfile(targetUser);
                }
              }
            }}
            title={targetUser ? `الملف الشخصي: ${targetUser.username}` : 'قائمة المحادثات الخاصة'}
          >
            {targetUser ? (
              <>
                <img
                  id="private_av"
                  className="avatar_default"
                  src={targetUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={targetUser.username}
                />
                <div className="min-w-0">
                  <div
                    id="private_name"
                    className="private_name"
                    style={{ color: targetUser.usernameColor || '#ffffff' }}
                  >
                    {targetUser.username}
                  </div>
                  <div className="text-[10px] text-cyan-200/80 leading-none">
                    {getRankTitle(targetUser.role)}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <i className="fa fa-envelope text-[#03ADD8] text-[20px]" />
                <span className="font-bold text-white text-[15px]">الرسائل الخاصة</span>
              </div>
            )}
          </div>

          {/* Controls: Minimize, Options Menu, Close */}
          <div className="private_controls flex items-center gap-1">
            {activePrivateUserId && (
              <>
                {/* 1. Back to conversations list button */}
                <button
                  type="button"
                  onClick={() => {
                    setActivePrivateUserId(null);
                    setIsMenuOpen(false);
                    setIsEmojiOpen(false);
                  }}
                  className="private_control_btn text-slate-300 hover:text-white"
                  title="الرجوع لقائمة المحادثات"
                  aria-label="الرجوع للقائمة"
                >
                  <i className="fa fa-chevron-right text-[12px]" />
                </button>

                {/* 2. Options Dropdown Toggle (#private_min) */}
                <button
                  id="private_min"
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="private_control_btn menutrig text-slate-200 hover:text-white"
                  title="خيارات المحادثة"
                  aria-expanded={isMenuOpen}
                  aria-controls="private_menu"
                >
                  <i className="fa fa-cog text-[15px]" />
                </button>

                {/* 3. Minimize Button (#priv_minimize) */}
                <button
                  id="priv_minimize"
                  type="button"
                  onClick={() => {
                    if (typeof (window as any).togglePrivate === 'function') {
                      (window as any).togglePrivate(1);
                    } else {
                      setIsPrivateMinimized(true);
                    }
                  }}
                  className="private_control_btn text-slate-200 hover:text-amber-400"
                  title="تصغير المحادثة في الشريط السفلي"
                  aria-label="تصغير"
                >
                  <i className="fa fa-minus text-[13px]" />
                </button>
              </>
            )}

            {!activePrivateUserId && (
              <>
                {/* Settings in conversation list */}
                <button
                  type="button"
                  onClick={() => setIsPrivateSettingsOpen(true)}
                  className="private_control_btn text-slate-300 hover:text-white"
                  title="إعدادات استقبال الخاص"
                >
                  <i className="fa fa-cogs text-[14px]" />
                </button>

                {/* Clear all conversations */}
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('هل أنت متأكد من رغبتك في مسح كافة المحادثات من القائمة؟')) {
                      clearAllPrivateConversations();
                    }
                  }}
                  className="private_control_btn text-slate-300 hover:text-red-400"
                  title="مسح كل المحادثات من القائمة"
                >
                  <i className="fa fa-trash text-[13px]" />
                </button>
              </>
            )}

            {/* Exit / Close button */}
            <button
              id="priv_close"
              type="button"
              onClick={() => {
                if (typeof (window as any).resetPrivate === 'function') {
                  (window as any).resetPrivate();
                } else {
                  setIsPrivateChatOpen(false);
                  setActivePrivateUserId(null);
                }
              }}
              className="private_control_btn hover:bg-red-600/80 text-white"
              title="إغلاق الخاص"
              aria-label="إغلاق"
            >
              <i className="fa fa-times text-[15px]" />
            </button>
          </div>

          {/* =================================================================
              OPTIONS MENU: #private_menu
             ================================================================= */}
          {activePrivateUserId && (
            <div
              ref={menuRef}
              id="private_menu"
              className={`sysmenu add_shadow fmenu ${isMenuOpen ? '' : 'hideall'}`}
              style={{ display: isMenuOpen ? 'block' : 'none' }}
              role="menu"
              aria-label="خيارات المحادثة الخاصة"
            >
              {/* Option 1: تجاهل */}
              <div
                role="menuitem"
                tabIndex={0}
                className="fmenu_item"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (targetUser) {
                    if (canBeIgnored(targetUser)) {
                      const isIgnored = currentUser?.ignoredUsers?.includes(targetUser.id);
                      requestBlockConfirm(targetUser, isIgnored ? 'unblock' : 'block', () => {
                        toggleIgnore(targetUser.id);
                        if (!isIgnored) {
                          deletePrivateMessages(targetUser.id);
                        }
                      });
                    } else {
                      alert('عفواً، لا يمكنك تجاهل رتب الإدارة العليا 🛡️');
                    }
                  }
                }}
              >
                <div className="fmenu_icon">
                  <i className="fa fa-ban text-[#03ADD8]" />
                </div>
                <span className="fmenu_text">
                  {currentUser?.ignoredUsers?.includes(targetUser?.id || '') ? 'إلغاء التجاهل' : 'تجاهل'}
                </span>
              </div>

              {/* Option 2: الإعدادات */}
              <div
                role="menuitem"
                tabIndex={0}
                className="fmenu_item"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsPrivateSettingsOpen(true);
                }}
              >
                <div className="fmenu_icon">
                  <i className="fa fa-cogs text-[#03ADD8]" />
                </div>
                <span className="fmenu_text">الإعدادات</span>
              </div>

              {/* Option 3: حذف سجل المحادثة */}
              <div
                role="menuitem"
                tabIndex={0}
                className="fmenu_item text-red-600 hover:bg-red-50"
                onClick={() => {
                  setIsMenuOpen(false);
                  if (targetUser && window.confirm('هل أنت متأكد من رغبتك في حذف سجل هذه المحادثة الخاصة نهائياً؟')) {
                    deletePrivateMessages(targetUser.id);
                  }
                }}
              >
                <div className="fmenu_icon">
                  <i className="fa fa-trash text-red-500" />
                </div>
                <span className="fmenu_text text-red-600">حذف السجل</span>
              </div>
            </div>
          )}
        </div>

        {/* ===================================================================
            BODY: Active Chat OR Conversation List
           =================================================================== */}
        {!activePrivateUserId ? (
          /* Conversation List View */
          <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 custom-scrollbar">
            {activeChatPartnerIds.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-3 select-none">
                <div className="w-14 h-14 rounded-full bg-slate-200 text-[#012832] flex items-center justify-center shadow-inner">
                  <i className="fa fa-envelope-open text-2xl text-[#012832]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">لا توجد رسائل خاصة حالياً</h4>
                  <p className="text-xs text-slate-500 mt-1">عندما تتلقى أو ترسل رسائل خاصة ستظهر المحادثات هنا مباشرة.</p>
                </div>
              </div>
            ) : (
              activeChatPartnerIds.map((userId) => {
                const partner = users.find(u => u.id === userId) || {
                  id: userId,
                  username: `مستخدم (${String(userId).slice(-4)})`,
                  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80',
                  gender: 'male',
                  role: 'member'
                } as User;

                const unread = privateMessages.filter(
                  pm => pm.senderId === partner.id && pm.receiverId === currentUser.id && !pm.isRead
                ).length;

                const lastMsg = [...privateMessages]
                  .reverse()
                  .find(pm => (pm.senderId === partner.id && pm.receiverId === currentUser.id) || (pm.senderId === currentUser.id && pm.receiverId === partner.id));

                return (
                  <div
                    key={userId}
                    onClick={() => setActivePrivateUserId(userId)}
                    className="p-3 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between cursor-pointer transition-all shadow-xs group"
                  >
                    {/* Left: Hide (X) and unread badge */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          hidePrivateConversation(partner.id);
                        }}
                        className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                        title="إخفاء من القائمة"
                      >
                        <i className="fa fa-times text-xs" />
                      </button>

                      {unread > 0 && (
                        <span className="bg-[#d91e18] text-white text-[11px] font-black px-2 py-0.5 rounded-full min-w-[20px] text-center shadow-xs animate-pulse">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                    </div>

                    {/* Right: Avatar, Name, Last message */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="text-right min-w-0">
                        <span
                          className="text-xs font-bold block truncate"
                          style={{ color: partner.usernameColor || '#0f172a' }}
                        >
                          {partner.username}
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate max-w-[170px]">
                          {lastMsg ? (lastMsg.type === 'image' ? '📷 صورة' : lastMsg.type === 'voice' ? '🎤 تسجيل صوتي' : lastMsg.text) : 'بدء المحادثة'}
                        </span>
                      </div>

                      <img
                        src={partner.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={partner.username}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Active Chat View */
          <div className="flex-1 flex flex-col justify-between overflow-hidden bg-white">
            {/* =================================================================
                MESSAGES CONTENT AREA: #private_content.background_box
               ================================================================= */}
            <div id="private_content" className="background_box custom-scrollbar">
              {chatMessages.length === 0 ? (
                <div className="text-center text-slate-400 py-16 text-xs select-none">
                  <div className="w-12 h-12 rounded-full bg-slate-200 mx-auto flex items-center justify-center text-slate-500 mb-2">
                    <i className="fa fa-comment-dots text-xl" />
                  </div>
                  ابدأ المحادثة الخاصة الآن مع <span className="font-bold text-[#012832]">{targetUser?.username}</span>...
                </div>
              ) : (
                <ul id="private_logs" className="ch_logs private_logs">
                  {chatMessages.map((pm) => {
                    const isMe = pm.senderId === currentUser.id;
                    const sender = isMe ? currentUser : targetUser;

                    // Check if message is a YouTube video link
                    const isYoutubeLink = pm.type === 'text' && (
                      pm.text.includes('youtube.com/watch') ||
                      pm.text.includes('youtu.be/') ||
                      pm.text.includes('youtube.com/shorts/')
                    );

                    let youtubeVideoId = '';
                    if (isYoutubeLink) {
                      const match = pm.text.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/|watch\?.+&v=))([\w-]{11})/);
                      if (match && match[1]) {
                        youtubeVideoId = match[1];
                      }
                    }

                    return (
                      <li
                        key={pm.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} my-1`}
                      >
                        <div className="flex items-end gap-2 max-w-[85%]">
                          {/* Sender avatar on non-me */}
                          {!isMe && (
                            <img
                              src={sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                              alt={sender?.username}
                              onClick={() => {
                                if (sender) {
                                  if (typeof (window as any).getProfile === 'function') {
                                    (window as any).getProfile(sender.id);
                                  } else {
                                    setSelectedUserForProfile(sender);
                                  }
                                }
                              }}
                              className="w-7 h-7 rounded-full object-cover cursor-pointer border border-slate-300 shadow-2xs shrink-0"
                            />
                          )}

                          {/* Message Bubble */}
                          <div
                            onContextMenu={(e) => {
                              if (pm.type === 'text') {
                                e.preventDefault();
                                openTextContextMenu(pm.text, 'رسالة خاصة');
                              }
                            }}
                            onTouchStart={() => {
                              if (pm.type === 'text') {
                                startLongPressText(pm.text, 'رسالة خاصة');
                              }
                            }}
                            onTouchEnd={cancelLongPress}
                            onTouchCancel={cancelLongPress}
                            className={`p-2.5 rounded-2xl text-xs shadow-xs relative select-text break-words ${
                              isMe
                                ? 'bg-[#012832] text-white rounded-br-none'
                                : 'bg-white text-slate-900 border border-slate-200 rounded-bl-none shadow-sm'
                            }`}
                          >
                            {/* Text message */}
                            {pm.type === 'text' && !isYoutubeLink && (
                              <div className="leading-relaxed whitespace-pre-wrap">
                                {renderTextWithCustomEmojis(pm.text, 22, customEmojis, (tag) => {
                                  setText(prev => (prev ? `${prev} ${tag} ` : `${tag} `));
                                })}
                              </div>
                            )}

                            {/* YouTube Video Embed Preview */}
                            {isYoutubeLink && (
                              <div className="space-y-1.5">
                                <p className="text-[11px] underline break-all">{pm.text}</p>
                                {youtubeVideoId && (
                                  <div className="w-full max-w-[280px] aspect-video rounded-lg overflow-hidden bg-black shadow-md">
                                    <iframe
                                      src={`https://www.youtube.com/embed/${youtubeVideoId}`}
                                      title="YouTube video"
                                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                      allowFullScreen
                                      className="w-full h-full border-0"
                                    />
                                  </div>
                                )}
                              </div>
                            )}

                            {/* Image attachment */}
                            {pm.type === 'image' && pm.mediaUrl && pm.mediaUrl.trim() !== '' && (
                              <img
                                src={pm.mediaUrl}
                                alt="مرفق صورة"
                                onContextMenu={(e) => {
                                  e.preventDefault();
                                  openImageContextMenu(pm.mediaUrl!, 'صورة خاصة');
                                }}
                                onTouchStart={() => startLongPressImage(pm.mediaUrl!, 'صورة خاصة')}
                                onTouchEnd={cancelLongPress}
                                onTouchCancel={cancelLongPress}
                                className="max-w-xs rounded-lg my-1 max-h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                referrerPolicy="no-referrer"
                              />
                            )}

                            {/* Voice note */}
                            {pm.type === 'voice' && (
                              <div className="flex items-center gap-2 py-1">
                                <i className="fa fa-volume-up text-amber-400 text-sm" />
                                <span className={isMe ? 'text-white' : 'text-slate-900'}>
                                  تسجيل صوتي ({pm.voiceDuration || 3} ث)
                                </span>
                              </div>
                            )}

                            {/* Flag / Report button for non-me messages */}
                            {!isMe && currentUser.role !== 'visitor' && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (typeof (window as any).reportPrivateLog === 'function') {
                                    (window as any).reportPrivateLog(pm.id);
                                  } else {
                                    setReportingPm(pm);
                                  }
                                }}
                                className="absolute -top-2 -left-2 bg-slate-800 text-slate-300 hover:text-red-400 p-1 rounded-full cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                                title="إبلاغ عن هذه الرسالة"
                              >
                                <i className="fa fa-flag text-[9px]" />
                              </button>
                            )}
                          </div>

                          {/* Sender avatar on me */}
                          {isMe && (
                            <img
                              src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                              alt={currentUser.username}
                              className="w-7 h-7 rounded-full object-cover border border-slate-300 shadow-2xs shrink-0"
                            />
                          )}
                        </div>

                        {/* Timestamp */}
                        <span className="text-[9px] text-slate-400 mt-0.5 dir-ltr font-mono px-1">
                          {toEnglishDigits(pm.timestamp)}
                        </span>
                      </li>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </ul>
              )}
            </div>

            {/* =================================================================
                SUB-OPTIONS STRIP: #priv_input_extra
               ================================================================= */}
            <div id="priv_input_extra" className="priv_input_extra">
              <button
                type="button"
                className="psub_options"
                onClick={() => {
                  if (typeof (window as any).paintIt === 'function') {
                    (window as any).paintIt(2);
                  } else {
                    setIsPaintModalOpen(true);
                  }
                }}
                title="رسم ومشاركة لوحة"
              >
                <i className="fa fa-paint-brush text-indigo-500" />
                <span>رسم</span>
              </button>

              <button
                type="button"
                className="psub_options"
                onClick={() => {
                  if (typeof (window as any).getYoutube === 'function') {
                    (window as any).getYoutube(2);
                  } else {
                    const url = window.prompt('أدخل رابط فيديو يوتيوب لمشاركته في المحادثة الخاصة:');
                    if (url && url.trim() && activePrivateUserId) {
                      sendPrivateMessage(activePrivateUserId, url.trim());
                    }
                  }
                }}
                title="مشاركة فيديو يوتيوب"
              >
                <i className="fab fa-youtube text-red-600" />
                <span>يوتيوب</span>
              </button>
            </div>

            {/* =================================================================
                INPUT FORM: #private_input / #message_form
               ================================================================= */}
            {activePrivateUserId && isUserBlocked(activePrivateUserId) ? (
              <div className="p-3 bg-red-100 border-t border-red-300 text-center text-xs text-red-800 font-bold select-none">
                🚫 لا يمكنك التواصل مع هذا العضو بسبب الحظر.
              </div>
            ) : (
              <div id="private_input" className="private_input relative">
                {/* Emoticon Popover (#private_emoticon) */}
                {isEmojiOpen && (
                  <div id="private_emoticon" className="background_box">
                    <div className="emo_head private_emo_head">
                      <div className="flex items-center gap-1.5">
                        <i className="fa fa-smile text-amber-400" />
                        <span>سمايلات ورموز تعبيرية</span>
                      </div>
                      <button
                        type="button"
                        id="emo_close_priv"
                        onClick={() => setIsEmojiOpen(false)}
                        title="إغلاق"
                      >
                        <i className="fa fa-times text-xs" />
                      </button>
                    </div>

                    <div id="private_emo" className="emo_content_priv custom-scrollbar">
                      {/* Banners */}
                      {getAllCustomEmojis(customEmojis).some(item => item.isBanner) && (
                        <div className="grid grid-cols-2 gap-1.5 mb-2">
                          {getAllCustomEmojis(customEmojis).filter(item => item.isBanner).map((item) => {
                            const Comp = item.component;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => {
                                  setText(prev => (prev ? `${prev} ${item.tag} ` : `${item.tag} `));
                                }}
                                className="bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-400 rounded-lg p-1 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs min-h-[34px]"
                                title={item.name}
                              >
                                <Comp size={20} animated={true} />
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {/* Smileys Grid */}
                      <div className="grid grid-cols-6 sm:grid-cols-7 gap-1 bg-white p-1 rounded-lg border border-slate-100">
                        {getAllCustomEmojis(customEmojis).filter(item => !item.isBanner).map((item) => {
                          const Comp = item.component;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => {
                                setText(prev => (prev ? `${prev} ${item.tag} ` : `${item.tag} `));
                              }}
                              className="bg-transparent hover:bg-slate-100 border border-transparent rounded-lg p-0.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-105 active:scale-90 h-9 w-full"
                              title={item.name}
                            >
                              <Comp size={26} animated={true} />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                <form id="message_form" onSubmit={handleSend}>
                  {/* Image attachment button (#send_image_priv) */}
                  <button
                    type="button"
                    id="send_image_priv"
                    className="priv_tool_btn"
                    onClick={() => {
                      if (typeof (window as any).uploadPrivate === 'function') {
                        (window as any).uploadPrivate();
                      } else {
                        fileInputRef.current?.click();
                      }
                    }}
                    title="إرسال صورة"
                  >
                    <i className="fa fa-image" />
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    id="private_file"
                    className="up_input hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />

                  {/* Emoticon Toggle Button (#emo_item_priv) */}
                  <button
                    type="button"
                    id="emo_item_priv"
                    className="priv_tool_btn"
                    onClick={() => setIsEmojiOpen(!isEmojiOpen)}
                    title="سمايلات ورموز تعبيرية"
                  >
                    <i className="fa fa-smile" />
                  </button>

                  {/* Input text wrapper (#private_input_box.td_input) */}
                  <div id="private_input_box" className="td_input">
                    <input
                      type="text"
                      id="message_content"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      maxLength={250}
                      placeholder="اكتب هنا..."
                      autoComplete="off"
                      spellCheck={false}
                    />
                  </div>

                  {/* Mic Button (#record_private) */}
                  {isRecording ? (
                    <button
                      type="button"
                      id="record_private"
                      onClick={stopVoice}
                      className="recording"
                      title="إيقاف التسجيل الصوتي والإرسال"
                    >
                      <i className="fa fa-stop-circle text-red-600 text-lg" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      id="record_private"
                      onClick={startVoice}
                      title="تسجيل صوتي"
                    >
                      <i className="fa fa-microphone record" />
                    </button>
                  )}

                  {/* Send Button (#private_send.default_btn.csend) */}
                  <button
                    type="submit"
                    id="private_send"
                    className="default_btn csend"
                    title="إرسال"
                  >
                    <i className="fa fa-paper-plane" />
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>

      {/* =====================================================================
          REPORT MESSAGE MODAL
         ===================================================================== */}
      {reportingPm && (
        <ReportMessageModal
          message={reportingPm}
          onClose={() => setReportingPm(null)}
        />
      )}

      {/* =====================================================================
          PAINT / DRAWING CANVAS MODAL
         ===================================================================== */}
      {isPaintModalOpen && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-150 dir-rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-slate-900 border border-slate-300">
            <div className="bg-[#012832] px-4 py-3 flex items-center justify-between text-white">
              <span className="text-sm font-bold flex items-center gap-2">
                <i className="fa fa-paint-brush text-indigo-400" />
                <span>لوحة الرسم اليدوي</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPaintModalOpen(false)}
                className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-white"
              >
                <i className="fa fa-times text-xs" />
              </button>
            </div>

            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-1 pb-2 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  {['#012832', '#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setPaintColor(color)}
                      style={{ backgroundColor: color }}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${paintColor === color ? 'scale-125 border-slate-900' : 'border-transparent'}`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={clearDrawing}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg"
                >
                  مسح
                </button>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden bg-white touch-none">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={220}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className="w-full h-[220px] cursor-crosshair bg-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={sendDrawing}
                  className="flex-1 py-2 bg-[#012832] hover:bg-[#023847] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <i className="fa fa-paper-plane" />
                  <span>إرسال الرسم</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPaintModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          PRIVATE SETTINGS MODAL
         ===================================================================== */}
      {isPrivateSettingsOpen && (
        <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 dir-rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-slate-900 border border-slate-300">
            <div className="bg-[#012832] px-4 py-3 flex items-center justify-between text-white">
              <span className="text-sm font-bold flex items-center gap-2">
                <i className="fa fa-cogs text-[#03ADD8]" />
                <span>إعدادات استقبال الرسائل الخاصة</span>
              </span>
              <button
                type="button"
                onClick={() => setIsPrivateSettingsOpen(false)}
                className="w-6 h-6 rounded-md hover:bg-white/10 flex items-center justify-center text-white"
              >
                <i className="fa fa-times text-xs" />
              </button>
            </div>

            <div className="p-4 space-y-2 text-xs font-bold">
              {/* Option 1: تشغيل للجميع */}
              <button
                type="button"
                onClick={() => {
                  if (typeof (window as any).savePrivateSettings === 'function') {
                    (window as any).savePrivateSettings('everyone');
                  } else {
                    updateUserProfile({ privatePrivacy: 'everyone' });
                    setIsPrivateSettingsOpen(false);
                  }
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentUser.privatePrivacy === 'everyone'
                    ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>تشغيل للجميع (الكل يستطيع مراسلتي)</span>
                {currentUser.privatePrivacy === 'everyone' && <i className="fa fa-check text-sky-600 font-bold" />}
              </button>

              {/* Option 2: للأعضاء فقط */}
              <button
                type="button"
                onClick={() => {
                  if (typeof (window as any).savePrivateSettings === 'function') {
                    (window as any).savePrivateSettings('members');
                  } else {
                    updateUserProfile({ privatePrivacy: 'members' });
                    setIsPrivateSettingsOpen(false);
                  }
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentUser.privatePrivacy === 'members'
                    ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>للأعضاء المسجلين فقط</span>
                {currentUser.privatePrivacy === 'members' && <i className="fa fa-check text-sky-600 font-bold" />}
              </button>

              {/* Option 3: للأصدقاء فقط */}
              {currentUser.role !== 'visitor' && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof (window as any).savePrivateSettings === 'function') {
                      (window as any).savePrivateSettings('friends');
                    } else {
                      updateUserProfile({ privatePrivacy: 'friends' });
                      setIsPrivateSettingsOpen(false);
                    }
                  }}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                    currentUser.privatePrivacy === 'friends'
                      ? 'bg-sky-50 border-sky-500 text-sky-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <span>لقائمة أصدقائي فقط 🤝</span>
                  {currentUser.privatePrivacy === 'friends' && <i className="fa fa-check text-sky-600 font-bold" />}
                </button>
              )}

              {/* Option 4: إيقاف عن الجميع */}
              <button
                type="button"
                onClick={() => {
                  if (typeof (window as any).savePrivateSettings === 'function') {
                    (window as any).savePrivateSettings('none');
                  } else {
                    updateUserProfile({ privatePrivacy: 'none' });
                    setIsPrivateSettingsOpen(false);
                  }
                }}
                className={`w-full p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  currentUser.privatePrivacy === 'none'
                    ? 'bg-red-50 border-red-500 text-red-900 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <span>إيقاف الخاص عن الجميع 🔴</span>
                {currentUser.privatePrivacy === 'none' && <i className="fa fa-check text-red-600 font-bold" />}
              </button>

              {/* Sound notification toggle */}
              <div className="pt-3 border-t border-slate-200 mt-2">
                <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2">
                    <i className="fa fa-bell text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">صوت تنبيه الرسائل</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof (window as any).privatePlay === 'function') {
                          (window as any).privatePlay();
                        } else {
                          playChatSound('private');
                        }
                      }}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      title="تجربة صوت التنبيه"
                    >
                      <i className="fa fa-volume-up text-amber-500" />
                      <span>تجربة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateAudioSettings({ privateSound: !(audioSettings?.privateSound !== false) })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer ${
                        audioSettings?.privateSound !== false
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'bg-slate-300 text-slate-600'
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
    </>
  );
};
