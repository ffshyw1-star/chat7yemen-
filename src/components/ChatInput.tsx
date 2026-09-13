import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { VoiceRecorder } from '../utils/audio';
import { canSendMediaInPublic, getYouTubeVideoId } from '../utils/permissions';
import {
  Send, Mic, Smile, Plus, Image as ImageIcon, X, Square, Youtube, Upload, Video,
  Paperclip, FileText, Music, PenTool, Palette, Check, Search, Type, Camera, HardDrive,
  Loader2, Trash2
} from 'lucide-react';
import { DrawingCanvasModal } from './DrawingCanvasModal';
import { ActionChoiceModal } from './ActionChoiceModal';
import { YouTubeModal } from './YouTubeModal';
import { StickerPicker } from './StickerPicker';
import { TextFormatModal } from './TextFormatModal';
import { t } from '../utils/translations';

const STANDARD_COLORS = [
  { name: 'أسود', value: '#000000' },
  { name: 'أحمر', value: '#ef4444' },
  { name: 'أزرق', value: '#2563eb' },
  { name: 'أخضر', value: '#059669' },
  { name: 'ذهبي', value: '#d97706' },
  { name: 'بنفسجي', value: '#7c3aed' },
  { name: 'وردي', value: '#db2777' },
  { name: 'تركوازي', value: '#0891b2' },
  { name: 'برتقالي', value: '#ea580c' },
  { name: 'أبيض', value: '#ffffff' },
];

const NEON_COLORS_PALETTE = [
  { name: 'وردي نيون 💖', value: '#ff007f' },
  { name: 'سماوي نيون ⚡', value: '#00f3ff' },
  { name: 'أخضر نيون 🟢', value: '#39ff14' },
  { name: 'أصفر نيون 🌟', value: '#ffff00' },
  { name: 'بنفسجي نيون 🟣', value: '#bf00ff' },
  { name: 'برتقالي نيون 🔥', value: '#ff5e00' },
];

const FONT_SIZES = [
  { label: 'صغير (12px)', value: '12px' },
  { label: 'متوسط (14px)', value: '14px' },
  { label: 'كبير (16px)', value: '16px' },
  { label: 'ضخم (18px)', value: '18px' },
];

const FONT_WEIGHTS = [
  { label: 'خط عادي (Normal)', value: 'normal' },
  { label: 'خط عريض (Bold)', value: 'bold' },
  { label: 'خط عريض جداً (Extrabold)', value: '900' },
];

export const ChatInput: React.FC = () => {
  const {
    currentUser, currentRoom, users, sendMessage, inputInsertedUsername, setInputInsertedUsername,
    targetedUserForMessage, setTargetedUserForMessage, sendTypingStatus,
    customEmojis, setIsOwnerDashboardOpen, setIsGoogleDriveOpen, showTopBanner, currentUserCan, siteSettings
  } = useChat();

  const isMutedInCurrentRoom = Boolean(
    currentUser && (
      currentUser.isMuted ||
      (currentRoom?.mutedUsers || []).includes(currentUser.id)
    )
  );

  const [text, setText] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Focus input whenever a user is targeted from room events
  useEffect(() => {
    if (targetedUserForMessage && inputRef.current) {
      inputRef.current.focus();
    }
  }, [targetedUserForMessage]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isMutedInCurrentRoom) return;
    const val = e.target.value;
    setText(val);
    if (sendTypingStatus) {
      sendTypingStatus(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        sendTypingStatus(false);
      }, 2500);
    }
  };

  const [isEmojiOpen, setIsEmojiOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);

  // Modals & Panels states
  const [isActionChoiceOpen, setIsActionChoiceOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);
  const [isFormatPanelOpen, setIsFormatPanelOpen] = useState(false);
  const [isTextFormatModalOpen, setIsTextFormatModalOpen] = useState(false);

  // File Manager & Media Upload States
  const [selectedFile, setSelectedFile] = useState<{ type: 'audio' | 'image'; base64: string; name: string; durationSec?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Text Formatting & Color States
  const [selectedTextColor, setSelectedTextColor] = useState<string>(currentUser?.chatTextColor || '#000000');
  const [selectedFontSize, setSelectedFontSize] = useState<string>(currentUser?.chatTextFontSize || '14px');
  const [selectedFontWeight, setSelectedFontWeight] = useState<string>(currentUser?.chatTextWeight || 'normal');

  // Sync format states whenever currentUser updates
  useEffect(() => {
    if (currentUser?.chatTextColor) {
      setSelectedTextColor(currentUser.chatTextColor);
    }
    if (currentUser?.chatTextFontSize) {
      setSelectedFontSize(currentUser.chatTextFontSize);
    }
    if (currentUser?.chatTextWeight) {
      setSelectedFontWeight(currentUser.chatTextWeight);
    }
  }, [currentUser?.chatTextColor, currentUser?.chatTextFontSize, currentUser?.chatTextWeight]);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isSendingVoice, setIsSendingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recordingSecondsRef = useRef<number>(0);
  const recordingStartTimeRef = useRef<number>(0);
  const [recordedAudio, setRecordedAudio] = useState<{ blobUrl: string; base64: string; durationSec: number } | null>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recorderRef.current) recorderRef.current.cancelRecording();
    };
  }, []);

  // Insert emoji or emoticon tag into input
  const handleInsertEmoji = (emojiTag: string) => {
    setText((prev) => (prev ? `${prev} ${emojiTag} ` : `${emojiTag} `));
  };

  // If a username was selected, target the user AND insert @username directly into "اكتب هنا" input box
  useEffect(() => {
    if (inputInsertedUsername) {
      const found = (users || []).find(u => u.username.toLowerCase() === inputInsertedUsername.toLowerCase());
      setTargetedUserForMessage({
        userId: found?.id || `user-${inputInsertedUsername}`,
        username: inputInsertedUsername,
        role: found?.role,
        avatar: found?.avatar
      });
      // Place the username into the "اكتب هنا" input box
      setText((prev) => {
        const prefix = `@${inputInsertedUsername} `;
        if (prev.startsWith(prefix)) return prev;
        return `${prefix}${prev.trimStart()}`;
      });
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setInputInsertedUsername(null);
    }
  }, [inputInsertedUsername, setInputInsertedUsername, users, setTargetedUserForMessage]);

  // Listen to external username insert events
  useEffect(() => {
    const handleInsertUser = (e: Event) => {
      const customEvent = e as CustomEvent<{ username: string }>;
      const uname = customEvent.detail?.username;
      if (uname) {
        const found = (users || []).find(u => u.username.toLowerCase() === uname.toLowerCase());
        setTargetedUserForMessage({
          userId: found?.id || `user-${uname}`,
          username: uname,
          role: found?.role,
          avatar: found?.avatar
        });
        setText((prev) => {
          const prefix = `@${uname} `;
          if (prev.startsWith(prefix)) return prev;
          return `${prefix}${prev.trimStart()}`;
        });
        setTimeout(() => {
          inputRef.current?.focus();
        }, 50);
      }
    };
    window.addEventListener('insert-username-to-input', handleInsertUser);
    return () => window.removeEventListener('insert-username-to-input', handleInsertUser);
  }, [users, setTargetedUserForMessage]);


  // Listen to sticker clicks from chat messages
  useEffect(() => {
    const handleStickerInsert = (e: Event) => {
      const customEvent = e as CustomEvent<{ tag: string }>;
      const tag = customEvent.detail?.tag;
      if (tag) {
        setText((prev) => (prev ? `${prev} ${tag} ` : `${tag} `));
      }
    };
    window.addEventListener('insert-chat-sticker', handleStickerInsert);
    return () => window.removeEventListener('insert-chat-sticker', handleStickerInsert);
  }, []);

  // Handle File Upload (Image or Audio)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى 15 ميجابايت.');
      return;
    }

    const isAudio = file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a');
    const isImage = file.type.startsWith('image/');

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (!result) return;

      if (isAudio) {
        setSelectedFile({
          type: 'audio',
          base64: result,
          name: file.name,
          durationSec: 5
        });
      } else {
        setSelectedFile({
          type: 'image',
          base64: result,
          name: file.name
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendSelectedFile = () => {
    if (!selectedFile) return;
    if (isMutedInCurrentRoom) {
      showTopBanner('🚫 عذراً، أنت مكتوم عن إرسال الوسائط في هذه الغرفة');
      return;
    }
    if (!currentUserCan('send_media')) {
      showTopBanner('🚫 ليس لديك صلاحية إرسال الوسائط والملفات حسب رتبتك');
      return;
    }
    if (selectedFile.type === 'image') {
      sendMessage(text.trim() || 'صورة من الوسائط', 'image', selectedFile.base64);
    } else {
      sendMessage(text.trim() || 'مقطع صوتي', 'voice', selectedFile.base64, selectedFile.durationSec || 5);
    }
    setSelectedFile(null);
    setIsMediaOpen(false);
    setText('');
  };

  // YouTube Song / Video selection
  const handleSelectYouTubeVideo = (ytId: string, title: string) => {
    if (isMutedInCurrentRoom) {
      showTopBanner('🚫 عذراً، أنت مكتوم في هذه الغرفة');
      return;
    }
    if (!currentUserCan('send_media')) {
      showTopBanner('🚫 ليس لديك صلاحية إرسال مقاطع اليوتيوب حسب رتبتك');
      return;
    }
    sendMessage(title || 'مقطع من YouTube', 'youtube', ytId);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isMutedInCurrentRoom) {
      showTopBanner('🚫 عذراً، أنت مكتوم عن الكتابة في هذه الغرفة (مشاهدة فقط)');
      return;
    }

    if (!currentUserCan('send_text')) {
      showTopBanner('🚫 ليس لديك صلاحية إرسال الرسائل النصية حسب رتبتك');
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (sendTypingStatus) sendTypingStatus(false);

    if (selectedFile) {
      handleSendSelectedFile();
      return;
    }

    if (recordedAudio) {
      if (!currentUserCan('send_voice')) {
        showTopBanner('🚫 ليس لديك صلاحية إرسال الرسائل الصوتية حسب رتبتك');
        return;
      }
      sendMessage(text.trim() || 'رسالة صوتية', 'voice', recordedAudio.base64, recordedAudio.durationSec);
      setRecordedAudio(null);
      setText('');
      return;
    }

    if (!text.trim()) return;

    const trimmed = text.trim();

    sendMessage(
      trimmed,
      'text',
      undefined,
      undefined,
      {
        color: currentUser?.chatTextColor || (selectedTextColor !== '#000000' ? selectedTextColor : undefined),
        fontSize: currentUser?.chatTextFontSize || selectedFontSize,
        fontWeight: currentUser?.chatTextWeight || selectedFontWeight,
        fontFamily: currentUser?.chatFontFamily,
        fontStyle: currentUser?.chatFontStyle,
        bgGradient: currentUser?.chatTextBgGradient,
        isNeon: currentUser?.chatIsNeon
      },
      targetedUserForMessage ? { id: targetedUserForMessage.userId, username: targetedUserForMessage.username } : undefined
    );

    setText('');
    setTargetedUserForMessage(null);
    setIsEmojiOpen(false);
  };

  // Start voice recording
  const startVoiceRecording = async () => {
    if (isSendingVoice || isRecording) return;

    if (isMutedInCurrentRoom) {
      showTopBanner('🚫 عذراً، أنت مكتوم عن المشاركة الصوتية في هذه الغرفة');
      return;
    }
    if (siteSettings?.enableVoiceNotes === false || (siteSettings as any)?.modulesState?.voice === false) {
      showTopBanner('🔒 الرسائل الصوتية معطلة حالياً في الموقع');
      return;
    }
    if (!currentUserCan('send_voice')) {
      showTopBanner('🚫 ليس لديك صلاحية إرسال الرسائل الصوتية حسب رتبتك');
      return;
    }

    try {
      recorderRef.current = new VoiceRecorder();
      const result = await recorderRef.current.startRecording();
      if (result.ok) {
        setIsRecording(true);
        setIsSendingVoice(false);
        setRecordingSeconds(0);
        recordingSecondsRef.current = 0;
        recordingStartTimeRef.current = Date.now();

        if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - recordingStartTimeRef.current) / 1000);
          recordingSecondsRef.current = elapsed;
          setRecordingSeconds(elapsed);

          // Auto stop and send at 120 seconds limit
          if (elapsed >= 120) {
            if (recordingTimerRef.current) {
              clearInterval(recordingTimerRef.current);
              recordingTimerRef.current = null;
            }
            showTopBanner('⏱️ تم بلوغ الحد الأقصى للتسجيل (120 ثانية) وجارٍ الإرسال...');
            handleFinishAndSendVoice();
          }
        }, 500);
      } else {
        showTopBanner(result.error || 'تعذر الوصول للميكروفون. يرجى تفعيل إذن الميكروفون في المتصفح.', 'error');
      }
    } catch (err: any) {
      console.error('Error starting voice recording:', err);
      showTopBanner('تعذر بدء التسجيل الصوتي.');
    }
  };

  // Finish and send recording to public chat
  const handleFinishAndSendVoice = async () => {
    if (isSendingVoice) return;

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const currentDuration = recordingSecondsRef.current;

    // Validate duration: strictly 1 to 120 seconds
    if (currentDuration < 1) {
      if (recorderRef.current) {
        recorderRef.current.cancelRecording();
      }
      setIsRecording(false);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
      showTopBanner('⚠️ مدة التسجيل الصوتي قصيرة جداً (أقل من ثانية واحدة). مسموح تسجيل الصوت من ثانية إلى 120 ثانية فقط.');
      return;
    }

    // Enter sending state: show rotating spinner in the circle until sent
    setIsRecording(false);
    setIsSendingVoice(true);

    try {
      if (!recorderRef.current) {
        throw new Error('مسجل الصوت غير متوفر');
      }

      const audioData = await recorderRef.current.stopRecording();
      const finalDuration = Math.min(120, Math.max(1, audioData.durationSec || currentDuration));

      if (isMutedInCurrentRoom) {
        showTopBanner('🚫 عذراً، أنت مكتوم عن المشاركة الصوتية في هذه الغرفة');
        return;
      }
      if (!currentUserCan('send_voice')) {
        showTopBanner('🚫 ليس لديك صلاحية إرسال الرسائل الصوتية حسب رتبتك');
        return;
      }

      // Send to public chat and wait for it to be persisted
      await sendMessage('رسالة صوتية 🎙️', 'voice', audioData.base64, finalDuration);
    } catch (err: any) {
      console.error('Recording stop/send error:', err);
      showTopBanner(`❌ تعذر إرسال التسجيل: ${err?.message || 'خطأ غير متوقع'}`);
    } finally {
      setIsSendingVoice(false);
      setIsRecording(false);
      setRecordingSeconds(0);
      recordingSecondsRef.current = 0;
    }
  };

  // Cancel voice recording without sending
  const cancelVoiceRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recorderRef.current) {
      recorderRef.current.cancelRecording();
    }
    setIsRecording(false);
    setIsSendingVoice(false);
    setRecordingSeconds(0);
    recordingSecondsRef.current = 0;
    showTopBanner('تم إلغاء التسجيل الصوتي 🗑️');
  };

  const openCameraHandler = (mode: 'photo' | 'video' = 'photo') => {
    if (mode === 'video') {
      videoCameraInputRef.current?.click();
    } else {
      cameraInputRef.current?.click();
    }
  };

  return (
    <div className="shrink-0 z-20 bg-white border-t border-slate-200/90 p-2 sm:p-2.5 relative select-none shadow-xs dir-rtl">
      {/* Hidden Native File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,audio/*,.mp3,.wav,.m4a"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />
      <input
        type="file"
        ref={videoCameraInputRef}
        accept="video/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* StickerPicker Component displaying Owner's custom emojis & stickers */}
      <StickerPicker
        isOpen={isEmojiOpen}
        onClose={() => setIsEmojiOpen(false)}
        onSelectSticker={handleInsertEmoji}
      />

      {/* Popover for Plus (➕) Attachments Menu - 6 Essential Tools */}
      {isMediaOpen && (
        <div
          id="plus-action-menu"
          dir="rtl"
          className="absolute bottom-full left-1 sm:left-2 mb-2 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-2.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150 w-[270px] sm:w-[300px]"
        >
          <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-100 px-1">
            <span className="text-xs font-black text-slate-800">أدوات إضافية</span>
            <button
              type="button"
              onClick={() => setIsMediaOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* 1. الكاميرا 📷 */}
            <button
              id="camera-open-btn"
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                cameraInputRef.current?.click();
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all hover:scale-102 active:scale-95 cursor-pointer group"
              title="التقاط صورة بالكاميرا 📷"
            >
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1 group-hover:bg-emerald-100 transition-colors">
                <Camera className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold">الكاميرا</span>
            </button>

            {/* 2. الوسائط والملفات 🖼️ */}
            <button
              id="media-upload-btn"
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                fileInputRef.current?.click();
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all hover:scale-102 active:scale-95 cursor-pointer group"
              title="رفع صور وملفات صوتية 🖼️"
            >
              <div className="w-9 h-9 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-1 group-hover:bg-sky-100 transition-colors">
                <ImageIcon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold">الوسائط</span>
            </button>

            {/* 3. خلفية ولون الرسالة 🎨 */}
            <button
              id="text-format-btn"
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                setIsTextFormatModalOpen(true);
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all hover:scale-102 active:scale-95 cursor-pointer group"
              title="تنسيق لون ومربع الرسالة والخلفيات اللامعة 🎨"
            >
              <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-1 group-hover:bg-amber-100 transition-colors">
                <Palette className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold">خلفية ولون</span>
            </button>

            {/* 4. لوحة الرسم والتخطيط 📝 */}
            <button
              id="drawing-palette-btn"
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                setIsDrawingModalOpen(true);
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all hover:scale-102 active:scale-95 cursor-pointer group"
              title="لوحة الرسم والتخطيط 📝"
            >
              <div className="w-9 h-9 rounded-full bg-pink-50 text-pink-600 flex items-center justify-center mb-1 group-hover:bg-pink-100 transition-colors">
                <PenTool className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold">لوحة الرسم</span>
            </button>

            {/* 5. يوتيوب 📺 */}
            <button
              id="youtube-open-btn"
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                setIsYouTubeModalOpen(true);
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all hover:scale-102 active:scale-95 cursor-pointer group"
              title="البحث عن مقاطع وفيديوهات يوتيوب 📺"
            >
              <div className="w-9 h-9 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-1 group-hover:bg-red-100 transition-colors">
                <Youtube className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold">يوتيوب</span>
            </button>

            {/* 6. Google Drive 📁 */}
            <button
              id="google-drive-open-btn"
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                setIsGoogleDriveOpen(true);
              }}
              className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition-all hover:scale-102 active:scale-95 cursor-pointer group"
              title="Google Drive والمستندات السحابية 📁"
            >
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-1 group-hover:bg-blue-100 transition-colors">
                <HardDrive className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-bold">Drive</span>
            </button>
          </div>
        </div>
      )}

      {/* Action Choice Modal (السهم السحابي - اختيار إجراء كما في الصورة 3) */}
      <ActionChoiceModal
        isOpen={isActionChoiceOpen}
        onClose={() => setIsActionChoiceOpen(false)}
        onSelectMedia={() => fileInputRef.current?.click()}
        onStartRecorder={() => startVoiceRecording()}
        onOpenCamera={(mode) => openCameraHandler(mode)}
      />

      {/* YouTube Search Modal (نافذة يوتيوب كما في الصورة 4) */}
      <YouTubeModal
        isOpen={isYouTubeModalOpen}
        onClose={() => setIsYouTubeModalOpen(false)}
        onSelectVideo={handleSelectYouTubeVideo}
      />

      {/* Drawing Canvas Modal (لوحة الرسم والتخطيط) */}
      {isDrawingModalOpen && (
        <DrawingCanvasModal onClose={() => setIsDrawingModalOpen(false)} />
      )}

      {/* File Preview Bar (صورة أو ملف صوتي تم اختياره) */}
      {selectedFile && (
        <div className="mb-2 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-2 text-xs text-slate-800 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 truncate">
            {selectedFile.type === 'image' ? (
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0">
                <img src={selectedFile.base64} alt="معاينة" className="w-full h-full object-cover" />
              </div>
            ) : (
              <Music className="w-6 h-6 text-sky-600 shrink-0" />
            )}
            <span className="font-bold truncate">{selectedFile.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSendSelectedFile}
              className="bg-slate-900 text-white px-3 py-1.5 rounded-xl font-bold text-xs hover:bg-slate-800 cursor-pointer shadow-xs"
            >
              إرسال ✈️
            </button>
            <button
              onClick={() => setSelectedFile(null)}
              className="p-1 hover:bg-slate-200 rounded-full text-slate-500 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Voice Recorded Audio Preview Bar */}
      {recordedAudio && (
        <div className="mb-2 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs text-amber-900 animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <Mic className="w-4 h-4 text-amber-600 animate-pulse" />
            <span className="font-bold">تم تسجيل مقطع صوتي ({recordedAudio.durationSec} ثانية)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSend()}
              className="bg-slate-900 text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-slate-800 cursor-pointer shadow-xs"
            >
              إرسال الصوت ✈️
            </button>
            <button
              onClick={() => setRecordedAudio(null)}
              className="p-1 hover:bg-amber-100 rounded text-amber-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Input Controls Row: Send, Mic / Red Circle / Spinner, Pill Input, Emoji, Plus */}
      <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2">
        {/* Circular Send Button (➤) on Far Right (DOM 1st in RTL) */}
        {!isRecording && (
          <button
            type="submit"
            disabled={isSendingVoice || (!text.trim() && !selectedFile && !recordedAudio)}
            className={`chat-send-btn w-9 h-9 sm:w-10 sm:h-10 rounded-full font-bold transition-all shrink-0 flex items-center justify-center cursor-pointer ${
              text.trim().length > 0 || selectedFile || recordedAudio
                ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900 hover:bg-slate-800 active:scale-95 text-white/90 shadow-xs'
            }`}
            title="إرسال الرسالة"
          >
            <Send className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 -translate-x-0.5" />
          </button>
        )}

        {/* Voice Recorder Button: Idle Mic -> Recording Red Circle with Seconds -> Sending Spinning Loader -> Mic */}
        {isSendingVoice ? (
          /* 1. Sending State: Red Circle with Rotating Spinner */
          <div className="relative shrink-0 flex items-center justify-center">
            <span className="absolute -inset-1 rounded-full bg-red-500/30 animate-pulse pointer-events-none" />
            <button
              type="button"
              disabled
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 text-white flex items-center justify-center shadow-lg shadow-red-500/40 border-2 border-white cursor-wait shrink-0 select-none"
              title="جارٍ إرسال التسجيل الصوتي في العام..."
            >
              <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin text-white stroke-[2.8]" />
            </button>
          </div>
        ) : isRecording ? (
          /* 2. Recording State: Red Circle counting seconds (1 to 120s) with Progress Ring */
          <div className="relative shrink-0 flex items-center justify-center">
            {/* Pulsating radar ping rings */}
            <span className="absolute -inset-1 rounded-full bg-red-500/40 animate-ping pointer-events-none" />
            <span className="absolute -inset-0.5 rounded-full bg-red-600/30 animate-pulse pointer-events-none" />

            {/* Circular Progress Track towards 120s */}
            <svg className="absolute -inset-1 w-12 h-12 sm:w-13 sm:h-13 -rotate-90 pointer-events-none" viewBox="0 0 52 52">
              <circle
                cx="26"
                cy="26"
                r="22"
                className="stroke-red-200/60"
                strokeWidth="2.5"
                fill="transparent"
              />
              <circle
                cx="26"
                cy="26"
                r="22"
                className="stroke-red-600 transition-all duration-300 ease-linear"
                strokeWidth="2.5"
                strokeDasharray={2 * Math.PI * 22}
                strokeDashoffset={2 * Math.PI * 22 * (1 - Math.min(recordingSeconds, 120) / 120)}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>

            {/* Interactive Red Circle Button: Pressing it sends the recording */}
            <button
              type="button"
              onClick={handleFinishAndSendVoice}
              className="relative z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-rose-500 hover:from-red-600 hover:to-rose-400 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-red-600/50 border-2 border-white cursor-pointer transition-transform group"
              title="اضغط على الدائرة الحمراء لإرسال التسجيل الصوتي في العام"
            >
              <div className="flex flex-col items-center justify-center leading-none text-white select-none">
                <span className="text-[11px] sm:text-xs font-black font-mono tracking-tight drop-shadow-xs">
                  {recordingSeconds < 60
                    ? `${recordingSeconds}ث`
                    : `${Math.floor(recordingSeconds / 60)}:${(recordingSeconds % 60).toString().padStart(2, '0')}`
                  }
                </span>
              </div>
            </button>
          </div>
        ) : (
          /* 3. Idle State: Clean Modern Microphone Icon */
          <button
            type="button"
            onClick={startVoiceRecording}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-red-50 text-slate-600 hover:text-red-600 border border-transparent hover:border-red-200 transition-all shrink-0 cursor-pointer flex items-center justify-center hover:scale-105 active:scale-95"
            title="تسجيل صوتي (اضغط للتسجيل - من ثانية إلى 120 ثانية)"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}

        {/* Center Field: Recording Strip with Wave & Cancel OR Sending Bar OR Regular Input */}
        {isRecording ? (
          <div className="flex-1 bg-red-50 border border-red-200 rounded-full px-3 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 text-xs shadow-inner animate-in fade-in duration-150">
            <div className="flex items-center gap-2 text-red-700 font-bold truncate">
              {/* Sound wave animated equalizer bars */}
              <div className="flex items-center gap-0.5 shrink-0">
                <span className="w-1 h-3 bg-red-500 rounded-full animate-pulse" style={{ animationDuration: '600ms', animationDelay: '0ms' }} />
                <span className="w-1 h-5 bg-red-600 rounded-full animate-pulse" style={{ animationDuration: '500ms', animationDelay: '150ms' }} />
                <span className="w-1 h-2 bg-red-500 rounded-full animate-pulse" style={{ animationDuration: '700ms', animationDelay: '300ms' }} />
                <span className="w-1 h-4 bg-red-600 rounded-full animate-pulse" style={{ animationDuration: '550ms', animationDelay: '100ms' }} />
              </div>
              <span className="truncate text-[11px] sm:text-xs">
                {recordingSeconds < 1
                  ? 'تحدث الآن... (مسموح من ثانية إلى 120 ثانية)'
                  : `اضغط على الدائرة الحمراء للإرسال (${recordingSeconds}/120 ثانية)`}
              </span>
            </div>

            {/* Cancel Button */}
            <button
              type="button"
              onClick={cancelVoiceRecording}
              className="shrink-0 text-red-600 hover:text-red-800 bg-red-100 hover:bg-red-200 rounded-full px-2.5 py-1 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer active:scale-95 border border-red-200"
              title="إلغاء التسجيل الصوتي بدون إرسال"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إلغاء</span>
            </button>
          </div>
        ) : isSendingVoice ? (
          <div className="flex-1 bg-red-50/90 border border-red-200 rounded-full px-4 py-2 flex items-center gap-2 text-xs text-red-700 font-bold shadow-inner animate-pulse">
            <Loader2 className="w-4 h-4 animate-spin text-red-600 shrink-0" />
            <span className="text-xs">جارٍ إرسال التسجيل الصوتي في العام...</span>
          </div>
        ) : (
          /* Center Pill Input Text Field */
          <div className={`flex-1 relative flex items-center bg-slate-50 border ${
            isMutedInCurrentRoom
              ? 'border-dashed border-red-300 bg-slate-100/90'
              : 'border-slate-300/90 focus-within:border-sky-500 focus-within:bg-white'
          } rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 shadow-inner transition-colors min-h-[38px] sm:min-h-[42px]`}>
            {/* Command Suggestion Box when typing / */}
            {text.startsWith('/') && (
              <div
                id="command-suggestions-menu"
                className="absolute bottom-full mb-2 left-0 right-0 bg-slate-900 text-white rounded-xl shadow-xl border border-slate-700 p-1.5 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150"
              >
                <div
                  onClick={() => {
                    sendMessage('/Clear');
                    setText('');
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-500/20 text-amber-300 font-mono text-xs px-2 py-0.5 rounded font-bold">
                      /Clear
                    </span>
                    <span className="text-xs text-slate-200 font-bold">
                      مسح الدردشة العامة للغرفة 🧹
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 group-hover:text-amber-300">
                    اضغط للتنفيذ ⏎
                  </span>
                </div>
              </div>
            )}

            {/* Targeted User Tag directly INSIDE the input bar */}
            {targetedUserForMessage && (
              <div className="inline-flex items-center gap-1.5 bg-sky-100/90 hover:bg-sky-200/90 text-sky-950 border border-sky-300/90 rounded-full px-2.5 py-0.5 text-xs font-bold shrink-0 ml-1.5 animate-in fade-in select-none">
                <span className="truncate max-w-[110px]">{targetedUserForMessage.username}</span>
                <button
                  type="button"
                  onClick={() => setTargetedUserForMessage(null)}
                  className="w-3.5 h-3.5 rounded-full hover:bg-sky-300/60 text-sky-700 flex items-center justify-center cursor-pointer transition-colors"
                  title="إلغاء التحديد"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            )}

            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={handleTextChange}
              onFocus={() => {
                window.dispatchEvent(new CustomEvent('chat-scroll-bottom'));
              }}
              placeholder={
                isMutedInCurrentRoom
                  ? '🔇 أنت مكتوم عن الكتابة في هذه الغرفة (مشاهدة فقط)...'
                  : t('input.placeholder', 'اكتب هنا... (أو اكتب /Clear لمسح الدردشة)')
              }
              disabled={isMutedInCurrentRoom}
              style={{
                color: currentUser?.chatTextColor || (selectedTextColor !== '#000000' && selectedTextColor !== '#ffffff' ? selectedTextColor : undefined),
                fontSize: currentUser?.chatTextFontSize || (selectedFontSize !== '14px' ? selectedFontSize : undefined),
                fontWeight: currentUser?.chatTextWeight === 'heavy' || currentUser?.chatTextWeight === '900' ? 900 : currentUser?.chatTextWeight === 'bold' || currentUser?.chatTextWeight === '700' ? 700 : undefined,
                fontFamily: currentUser?.chatFontFamily || undefined,
                fontStyle: currentUser?.chatFontStyle === 'italic' ? 'italic' : undefined,
              }}
              className="flex-1 bg-transparent border-0 px-1 py-1 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0 min-w-0"
            />
          </div>
        )}

        {/* Retro Emoticons Button (😊) */}
        <button
          type="button"
          onClick={() => {
            setIsEmojiOpen(!isEmojiOpen);
            setIsMediaOpen(false);
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-slate-100 text-slate-600 hover:text-amber-600 transition-colors shrink-0 cursor-pointer flex items-center justify-center"
          title="قائمة الإيموجي"
        >
          <Smile className="w-5 h-5" />
        </button>

        {/* Plus Media & Formatting Button (➕) on Far Left (DOM last in RTL) */}
        <button
          id="plus-main-btn"
          type="button"
          onClick={() => {
            setIsMediaOpen(!isMediaOpen);
            setIsEmojiOpen(false);
          }}
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-all shrink-0 cursor-pointer flex items-center justify-center active:scale-95 ${
            isMediaOpen
              ? 'bg-slate-900 text-white ring-2 ring-slate-400'
              : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
          title="أدوات إضافية: الكاميرا، الوسائط، خلفية الرسالة، لوحة الرسم، يوتيوب، Drive"
        >
          <Plus className={`w-5 h-5 transition-transform duration-150 ${isMediaOpen ? 'rotate-45' : ''}`} />
        </button>
      </form>

      {/* Text Format & Shiny Backgrounds Modal (نافذة تنسيق الخط والألوان والخلفيات اللامعة) */}
      <TextFormatModal
        isOpen={isTextFormatModalOpen}
        onClose={() => setIsTextFormatModalOpen(false)}
        onApplyFormat={(format) => {
          if (format.color) setSelectedTextColor(format.color);
          if (format.fontSize) setSelectedFontSize(format.fontSize);
          if (format.fontWeight) setSelectedFontWeight(format.fontWeight);
        }}
      />
    </div>
  );
};

