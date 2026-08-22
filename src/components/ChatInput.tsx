import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { VoiceRecorder } from '../utils/audio';
import { canSendMediaInPublic, getYouTubeVideoId } from '../utils/permissions';
import {
  Send, Mic, Smile, Plus, Image as ImageIcon, X, Square, Youtube, Upload, Video,
  Paperclip, FileText, Music, PenTool, Palette, Check, Search, Type, Camera
} from 'lucide-react';
import { DrawingCanvasModal } from './DrawingCanvasModal';
import { ActionChoiceModal } from './ActionChoiceModal';
import { YouTubeModal } from './YouTubeModal';
import { CUSTOM_EMOJIS_LIST, CUSTOM_EMOJI_CATEGORIES, getAllCustomEmojis } from './CustomEmojis';

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
    currentUser, sendMessage, inputInsertedUsername, setInputInsertedUsername, sendTypingStatus,
    customEmojis, setIsOwnerDashboardOpen
  } = useChat();

  const [text, setText] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  // File Manager & Media Upload States
  const [selectedFile, setSelectedFile] = useState<{ type: 'audio' | 'image'; base64: string; name: string; durationSec?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoCameraInputRef = useRef<HTMLInputElement | null>(null);

  // Text Formatting & Color States
  const [selectedTextColor, setSelectedTextColor] = useState<string>('#000000');
  const [selectedFontSize, setSelectedFontSize] = useState<string>('14px');
  const [selectedFontWeight, setSelectedFontWeight] = useState<string>('normal');

  // Emoji Popover state
  const [emojiCategory, setEmojiCategory] = useState<string>('all');

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<{ blobUrl: string; base64: string; durationSec: number } | null>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);

  // Insert emoji or emoticon into input
  const handleInsertEmoji = (emojiTag: string) => {
    setText((prev) => (prev ? `${prev} ${emojiTag} ` : `${emojiTag} `));
  };

  const allEmojis = getAllCustomEmojis(customEmojis);
  const filteredEmojis = allEmojis.filter((s) =>
    emojiCategory === 'all' ? true : s.category === emojiCategory
  );

  // If username was clicked in main chat, append it to input field
  useEffect(() => {
    if (inputInsertedUsername) {
      setText((prev) => (prev ? `${prev} ${inputInsertedUsername} ` : `${inputInsertedUsername} `));
      setInputInsertedUsername(null);
    }
  }, [inputInsertedUsername, setInputInsertedUsername]);

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
    sendMessage(title || 'مقطع من YouTube', 'youtube', ytId);
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (sendTypingStatus) sendTypingStatus(false);

    if (selectedFile) {
      handleSendSelectedFile();
      return;
    }

    if (recordedAudio) {
      sendMessage(text.trim() || 'رسالة صوتية', 'voice', recordedAudio.base64, recordedAudio.durationSec);
      setRecordedAudio(null);
      setText('');
      return;
    }

    if (!text.trim()) return;

    sendMessage(text.trim(), 'text', undefined, undefined, {
      color: selectedTextColor,
      fontSize: selectedFontSize,
      fontWeight: selectedFontWeight
    });

    setText('');
    setIsEmojiOpen(false);
  };

  // Start voice recording
  const startVoiceRecording = async () => {
    recorderRef.current = new VoiceRecorder();
    const ok = await recorderRef.current.startRecording();
    if (ok) {
      setIsRecording(true);
      setRecordingSeconds(0);
      setRecordedAudio(null);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      alert('تعذر الوصول للميكروفون. يرجى تفعيل إذن الميكروفون في المتصفح.');
    }
  };

  // Stop voice recording
  const stopVoiceRecording = async () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (recorderRef.current && isRecording) {
      try {
        const audioData = await recorderRef.current.stopRecording();
        setRecordedAudio(audioData);
      } catch (err) {
        console.error('Recording stop error:', err);
      } finally {
        setIsRecording(false);
      }
    }
  };

  const openCameraHandler = (mode: 'photo' | 'video' = 'photo') => {
    if (mode === 'video') {
      videoCameraInputRef.current?.click();
    } else {
      cameraInputRef.current?.click();
    }
  };

  return (
    <div className="bg-white border-t border-slate-200/90 p-2 sm:p-2.5 relative select-none shadow-xs dir-rtl">
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

      {/* Popover for Custom Animated Emojis & Retro Stickers - Exact Match with Screenshots 1, 2, 3 */}
      {isEmojiOpen && (
        <div className="absolute bottom-full inset-x-0 mb-1 w-full bg-white border-t-2 border-b border-[#003947] shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-2 duration-150 rounded-t-xl">
          {/* Header Bar - Exactly as in the screenshots */}
          <div className="bg-[#003947] px-2 py-1 flex items-center justify-between select-none shadow-xs">
            {/* Left Cyan Smiley Button & Quick Add for Owner */}
            <div className="flex items-center gap-2">
              <div
                className="w-10 h-8 rounded bg-[#00bcd4] text-slate-950 flex items-center justify-center text-base font-black shadow-xs cursor-default"
                title="ابتسامات وشعارات متحركة"
              >
                😊
              </div>

              {/* Owner quick add button */}
              {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEmojiOpen(false);
                    setIsOwnerDashboardOpen(true);
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] rounded-md shadow-xs flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                  title="فتح لوحة إدارة وإضافة الإيموجيات في لوحة المالك"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>إضافة إيموجي</span>
                </button>
              )}
            </div>

            {/* Right White Close Button */}
            <button
              type="button"
              onClick={() => setIsEmojiOpen(false)}
              className="text-white hover:text-red-300 transition-colors p-1.5 rounded cursor-pointer font-bold flex items-center justify-center"
              title="إغلاق"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Body Content - Pure White Background & Compact Grid */}
          <div className="p-2 sm:p-3 bg-white max-h-64 sm:max-h-72 overflow-y-auto custom-scrollbar select-none">
            {/* Banners Row (سلام عليكم، ولكمووو، وعليكم السلام، اهلا وسهلا + المخصصة) */}
            {allEmojis.some((e) => e.isBanner) && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2">
                {allEmojis.filter((e) => e.isBanner).map((item) => {
                  const Comp = item.component;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleInsertEmoji(item.tag)}
                      className="bg-slate-50 hover:bg-amber-50/70 border border-slate-200 hover:border-amber-400 rounded-lg p-1.5 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs min-h-[36px]"
                      title={`إضافة: ${item.name}`}
                    >
                      <Comp size={22} animated={true} />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Compact High-Density Grid of Animated Retro Smileys */}
            <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-1 bg-white p-1 rounded-lg border border-slate-100">
              {allEmojis.filter((e) => !e.isBanner).map((item) => {
                const EmojiComp = item.component;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleInsertEmoji(item.tag)}
                    className="group bg-transparent hover:bg-slate-100 hover:border-slate-300 border border-transparent rounded-lg p-0.5 flex items-center justify-center transition-all cursor-pointer active:scale-90 h-10 w-full"
                    title={item.name}
                  >
                    <EmojiComp size={28} animated={true} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Popover for Plus (➕) Attachments Menu - Exact layout as Screenshot 2 */}
      {isMediaOpen && (
        <div
          id="plus-action-menu"
          dir="ltr"
          className="absolute bottom-full left-1 sm:left-2 mb-2 bg-white border border-slate-200/90 rounded-2xl shadow-xl p-1.5 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          {/* 4 ROUND COLORFUL BUTTONS MATCHING SCREENSHOT 2 */}
          <div className="flex flex-row items-center gap-2 px-1 py-0.5" dir="ltr">
            
            {/* 1. Cloud Upload Circle Button (سهم سحابي أزرق سماوي - يفتح اختيار إجراء كما في الصورة 3) */}
            <button
              id="cloud-upload-btn"
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                setIsActionChoiceOpen(true);
              }}
              className="w-10 h-10 rounded-full bg-[#38bdf8] hover:bg-[#0284c7] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              title="السهم السحابي - اختيار إجراء (وسائط، مسجل، كاميرا) ☁️"
            >
              <Upload className="w-5 h-5 text-white stroke-[2.4]" />
            </button>

            {/* 2. Text Note / Formatting Circle Button (دفتر الملاحظات والتنسيق) */}
            <button
              id="text-format-btn"
              type="button"
              onClick={() => {
                setIsFormatPanelOpen(!isFormatPanelOpen);
              }}
              className={`w-10 h-10 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer ${
                isFormatPanelOpen ? 'ring-2 ring-sky-300 scale-105' : ''
              }`}
              title="تنسيق النصوص والألوان وحجم وعرض الخط 📝"
            >
              <FileText className="w-5 h-5 text-white stroke-[2.4]" />
            </button>

            {/* 3. Paint Palette Circle Button (لوحة الألوان والرسم) */}
            <button
              id="drawing-palette-btn"
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                setIsDrawingModalOpen(true);
              }}
              className="w-10 h-10 rounded-full bg-[#fce7f3] hover:bg-[#fbcfe8] flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer border border-pink-200"
              title="فتح لوحة الرسم والتخطيط 🎨"
            >
              <Palette className="w-5 h-5 text-pink-600 stroke-[2.4]" />
            </button>

            {/* 4. YouTube Button (يوتيوب - يفتح نافذة YouTube كما في الصورة 4) */}
            <button
              id="youtube-open-btn"
              type="button"
              onClick={() => {
                setIsMediaOpen(false);
                setIsYouTubeModalOpen(true);
              }}
              className="w-12 h-10 rounded-xl bg-white hover:bg-red-50 border border-slate-200/90 flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer px-1"
              title="البحث عن مقاطع وفيديوهات يوتيوب 📺"
            >
              <div className="bg-[#ff0000] text-white rounded-md px-1.5 py-0.5 flex items-center justify-center shadow-xs text-[10px] font-black tracking-tighter">
                <span className="font-sans">YouTube</span>
              </div>
            </button>

          </div>

          {/* Text Formatting Panel when Note/Format is expanded */}
          {isFormatPanelOpen && (
            <div className="mt-2 pt-2 border-t border-slate-100 space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar p-1 min-w-[280px]">
              {/* Colors */}
              <div>
                <span className="text-[11px] font-bold text-slate-700 block mb-1">اللون الأساسي:</span>
                <div className="grid grid-cols-5 gap-1">
                  {STANDARD_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setSelectedTextColor(col.value)}
                      style={{ backgroundColor: col.value }}
                      className={`h-7 rounded-lg border border-slate-300 flex items-center justify-center cursor-pointer ${
                        selectedTextColor === col.value ? 'ring-2 ring-emerald-500 scale-105' : ''
                      }`}
                    >
                      {selectedTextColor === col.value && (
                        <Check className={`w-3.5 h-3.5 ${col.value === '#ffffff' ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Neon Colors */}
              <div>
                <span className="text-[11px] font-bold text-amber-500 block mb-1">ألوان نيون:</span>
                <div className="grid grid-cols-3 gap-1">
                  {NEON_COLORS_PALETTE.map((neon) => (
                    <button
                      key={neon.value}
                      type="button"
                      onClick={() => setSelectedTextColor(neon.value)}
                      style={{
                        backgroundColor: neon.value,
                        boxShadow: `0 0 8px ${neon.value}`
                      }}
                      className={`py-1 px-1 rounded-lg text-[9px] font-black text-slate-950 cursor-pointer truncate ${
                        selectedTextColor === neon.value ? 'scale-105 ring-2 ring-white' : ''
                      }`}
                    >
                      {neon.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size & Weight */}
              <div className="grid grid-cols-2 gap-1 pt-1">
                {FONT_SIZES.map((sz) => (
                  <button
                    key={sz.value}
                    type="button"
                    onClick={() => setSelectedFontSize(sz.value)}
                    className={`py-1 px-1.5 rounded-lg text-[10px] font-bold cursor-pointer ${
                      selectedFontSize === sz.value
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {sz.label}
                  </button>
                ))}
              </div>
            </div>
          )}
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

      {/* Recording Indicator */}
      {isRecording && (
        <div className="mb-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between text-xs text-red-700 animate-pulse">
          <div className="flex items-center gap-2 font-bold">
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
            <span>جارٍ التسجيل الصوتي... ({recordingSeconds} ثانية)</span>
          </div>
          <button
            type="button"
            onClick={stopVoiceRecording}
            className="bg-red-600 text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-red-700 cursor-pointer"
          >
            إيقاف وحفظ
          </button>
        </div>
      )}

      {/* Main Input Controls Row: Send, Mic, Pill Input, Emoji, Plus */}
      <form onSubmit={handleSend} className="flex items-center gap-1.5 sm:gap-2">
        {/* Circular Dark Send Button (➤) on Far Right (DOM 1st in RTL) */}
        <button
          type="submit"
          className="w-9 h-9 sm:w-10 sm:h-10 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-full font-bold shadow-md transition-all shrink-0 cursor-pointer flex items-center justify-center"
          title="إرسال الرسالة"
        >
          <Send className="w-4 h-4 rotate-180 text-white" />
        </button>

        {/* Voice Recorder Button (🎤) */}
        {isRecording ? (
          <button
            type="button"
            onClick={stopVoiceRecording}
            className="bg-red-600 hover:bg-red-500 text-white p-2 sm:p-2.5 rounded-full shrink-0 cursor-pointer animate-pulse flex items-center gap-1 text-xs font-bold"
            title="إيقاف التسجيل الصوتي"
          >
            <Square className="w-4 h-4 fill-white" />
          </button>
        ) : (
          <button
            type="button"
            onClick={startVoiceRecording}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-slate-100 text-slate-600 hover:text-red-500 transition-colors shrink-0 cursor-pointer flex items-center justify-center"
            title="التسجيل الصوتي"
          >
            <Mic className="w-5 h-5" />
          </button>
        )}

        {/* Center Pill Input Text Field */}
        <div className="flex-1 relative">
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

          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder={isRecording ? 'جاري تسجيل مقطعك الصوتي...' : 'اكتب هنا... (أو اكتب /Clear لمسح الدردشة)'}
            disabled={isRecording}
            style={{
              color: selectedTextColor !== '#000000' && selectedTextColor !== '#ffffff' ? selectedTextColor : undefined,
              fontSize: selectedFontSize !== '14px' ? selectedFontSize : undefined,
              fontWeight: selectedFontWeight !== 'normal' ? selectedFontWeight : undefined
            }}
            className="w-full bg-slate-50 border border-slate-300/90 focus:border-slate-400 rounded-full px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none transition-colors shadow-inner"
          />
        </div>

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
          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full transition-colors shrink-0 cursor-pointer flex items-center justify-center ${
            isMediaOpen
              ? 'bg-slate-900 text-white ring-2 ring-slate-400'
              : 'bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900'
          }`}
          title="إرفاق الوسائط، مدير الملفات، اليوتيوب، التنسيق ولوحة الرسم"
        >
          <Plus className={`w-5 h-5 transition-transform duration-150 ${isMediaOpen ? 'rotate-45' : ''}`} />
        </button>
      </form>
    </div>
  );
};

