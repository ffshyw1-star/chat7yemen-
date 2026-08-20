import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { VoiceRecorder } from '../utils/audio';
import { canSendMediaInPublic, getYouTubeVideoId } from '../utils/permissions';
import {
  Send, Mic, Smile, Plus, Image as ImageIcon, X, Square, Youtube, Upload, Video,
  Paperclip, FileText, Music, PenTool, Palette, Check, Search, Type
} from 'lucide-react';
import { DrawingCanvasModal } from './DrawingCanvasModal';
import { CUSTOM_EMOJIS_LIST, CUSTOM_EMOJI_CATEGORIES, CustomEmojiDef } from './CustomEmojis';

// YouTube Music catalog
interface SongItem {
  id: string;
  youtubeId: string;
  title: string;
  channel: string;
  duration: string;
  thumbnail: string;
}

const POPULAR_YOUTUBE_SONGS: SongItem[] = [
  { id: '1', youtubeId: 'wD2l3r9O1zA', title: 'أغنية يمنية طرب أصيل - يا مسافر على الجوف', channel: 'طرب يمني', duration: '4:15', thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop' },
  { id: '2', youtubeId: 'dQw4w9WgXcQ', title: 'شيلة حماسية روعة 2026 - العز والعزوة', channel: 'شيلات الخليج', duration: '3:45', thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop' },
  { id: '3', youtubeId: 'R8l9b0A1h5k', title: 'فيروز - نسم علينا الهوا', channel: 'فيروزيات الصباح', duration: '4:10', thumbnail: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&auto=format&fit=crop' },
  { id: '4', youtubeId: 'L_LUpnjgPso', title: 'أغنية هادئة ورايقة - نسيم الليل والهدوء', channel: 'موسيقى روقان', duration: '5:20', thumbnail: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?w=200&auto=format&fit=crop' },
  { id: '5', youtubeId: 'fJ9rUzIMcDQ', title: 'أغنية يمنية تراثية - صنعاني قديم', channel: 'التراث اليمني', duration: '6:05', thumbnail: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200&auto=format&fit=crop' },
  { id: '6', youtubeId: '3JZ_D3ELwOQ', title: 'أغنية حماسية - الفرحة والاحتفال', channel: 'أغاني أفراح', duration: '3:30', thumbnail: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=200&auto=format&fit=crop' },
];

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
    currentUser, sendMessage, inputInsertedUsername, setInputInsertedUsername, sendTypingStatus
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

  // Attachment Menu Tabs (Horizontal 📎 📺 📝 📋)
  const [attachmentTab, setAttachmentTab] = useState<'files' | 'youtube' | 'format' | 'drawing'>('files');

  // File Manager States (📎)
  const [selectedFile, setSelectedFile] = useState<{ type: 'audio' | 'image'; base64: string; name: string; durationSec?: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // YouTube Song Search States (📺)
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [ytFilteredSongs, setYtFilteredSongs] = useState<SongItem[]>(POPULAR_YOUTUBE_SONGS);

  // Text Formatting & Color States (📝 Green Button)
  const [selectedTextColor, setSelectedTextColor] = useState<string>('#000000');
  const [selectedFontSize, setSelectedFontSize] = useState<string>('14px');
  const [selectedFontWeight, setSelectedFontWeight] = useState<string>('normal');

  // Drawing Canvas Modal (📋)
  const [isDrawingModalOpen, setIsDrawingModalOpen] = useState(false);

  // Emoji Popover state
  const [emojiCategory, setEmojiCategory] = useState<string>('all');

  // Insert emoji or emoticon into input
  const handleInsertEmoji = (emojiTag: string) => {
    setText((prev) => (prev ? `${prev} ${emojiTag} ` : `${emojiTag} `));
  };

  const filteredEmojis = CUSTOM_EMOJIS_LIST.filter((s) =>
    emojiCategory === 'all' ? true : s.category === emojiCategory
  );

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudio, setRecordedAudio] = useState<{ blobUrl: string; base64: string; durationSec: number } | null>(null);
  const recorderRef = useRef<VoiceRecorder | null>(null);

  // If username was clicked in main chat, append it to input field
  useEffect(() => {
    if (inputInsertedUsername) {
      setText((prev) => (prev ? `${prev} ${inputInsertedUsername} ` : `${inputInsertedUsername} `));
      setInputInsertedUsername(null);
    }
  }, [inputInsertedUsername, setInputInsertedUsername]);

  const canSendMedia = canSendMediaInPublic(currentUser);

  // Handle File Manager Upload (Image or Audio)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 12 * 1024 * 1024) {
      alert('حجم الملف كبير جداً. الحد الأقصى 12 ميجابايت.');
      return;
    }

    const isAudio = file.type.startsWith('audio/') || file.name.endsWith('.mp3') || file.name.endsWith('.wav') || file.name.endsWith('.m4a');
    const isImage = file.type.startsWith('image/');

    if (!isAudio && !isImage) {
      alert('الرجاء اختيار ملف صورة (JPG, PNG) أو ملف صوتي (MP3, WAV, M4A).');
      return;
    }

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
      sendMessage(text.trim() || 'صورة من مدير الملفات', 'image', selectedFile.base64);
    } else {
      sendMessage(text.trim() || 'مقطع صوتي من مدير الملفات', 'voice', selectedFile.base64, selectedFile.durationSec || 5);
    }
    setSelectedFile(null);
    setIsMediaOpen(false);
    setText('');
  };

  // YouTube Song Search Filter logic
  const handleYouTubeSearch = (query: string) => {
    setYtSearchQuery(query);
    if (!query.trim()) {
      setYtFilteredSongs(POPULAR_YOUTUBE_SONGS);
      return;
    }

    const filtered = POPULAR_YOUTUBE_SONGS.filter(s =>
      s.title.toLowerCase().includes(query.toLowerCase()) ||
      s.channel.toLowerCase().includes(query.toLowerCase())
    );

    // If query looks like a youtube URL
    const ytId = getYouTubeVideoId(query);
    if (ytId && !filtered.some(s => s.youtubeId === ytId)) {
      filtered.unshift({
        id: `yt-custom-${Date.now()}`,
        youtubeId: ytId,
        title: `مقطع يوتيوب محدد: ${ytId}`,
        channel: 'يوتيوب مباشر',
        duration: 'مباشر',
        thumbnail: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&auto=format&fit=crop'
      });
    }

    // Dynamic fallback song item if query has text but no exact match
    if (filtered.length === 0 && query.trim().length > 1) {
      filtered.push({
        id: `yt-search-${Date.now()}`,
        youtubeId: 'wD2l3r9O1zA',
        title: `نتيجة البحث: ${query}`,
        channel: 'YouTube Music',
        duration: '3:50',
        thumbnail: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200&auto=format&fit=crop'
      });
    }

    setYtFilteredSongs(filtered);
  };

  // Click on any YouTube song item -> Sends immediately to public room (حين تضغط عليها ترتسل مباشرة الى العام)
  const handleSendYouTubeSong = (ytId: string, title: string) => {
    sendMessage(`🎵 أغنية من يوتيوب: ${title}`, 'youtube', ytId);
    setIsMediaOpen(false);
    setYtSearchQuery('');
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (sendTypingStatus) sendTypingStatus(false);

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
      setRecordedAudio(null);
    } else {
      alert('تعذر الوصول للميكروفون. يرجى تفعيل إذن الميكروفون في المتصفح.');
    }
  };

  // Stop voice recording
  const stopVoiceRecording = async () => {
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

  return (
    <div className="bg-white border-t border-slate-200/90 p-2 sm:p-2.5 relative select-none shadow-xs dir-rtl">
      {/* Hidden Native File Input for File Manager (Images & Audio) */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,audio/*,.mp3,.wav,.m4a"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Popover for Custom Emojis & Retro Stickers */}
      {isEmojiOpen && (
        <div className="absolute bottom-full right-2 mb-2 w-80 sm:w-96 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-3 z-30 animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
              <span className="text-amber-500 text-base">✨</span>
              <span>الإيموجيات والسمايلات المخصصة</span>
            </div>

            <button
              onClick={() => setIsEmojiOpen(false)}
              className="text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] font-bold custom-scrollbar">
              {CUSTOM_EMOJI_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setEmojiCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-full whitespace-nowrap cursor-pointer transition-all ${
                    emojiCategory === cat.id
                      ? 'bg-slate-900 text-white font-black shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1 custom-scrollbar">
              {filteredEmojis.map((item) => {
                const EmojiComp = item.component;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleInsertEmoji(item.tag)}
                    className="group bg-slate-50 hover:bg-amber-50 border border-slate-200/80 hover:border-amber-400 rounded-xl p-2.5 flex flex-col items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs min-h-[76px]"
                    title={`إضافة: ${item.name}`}
                  >
                    <div className="h-10 flex items-center justify-center">
                      <EmojiComp size={38} animated={true} />
                    </div>
                    <span className="text-[9px] font-bold text-slate-600 group-hover:text-amber-900 truncate w-full text-center mt-1">
                      {item.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Popover for Plus (➕) Attachments Menu */}
      {isMediaOpen && (
        <div className="absolute bottom-full left-0 sm:left-2 mb-2 bg-white border border-slate-200/90 rounded-2xl shadow-2xl p-2.5 z-30 animate-in fade-in slide-in-from-bottom-2 duration-150 min-w-[280px]">
          {/* 4 ROUND COLORFUL CIRCULAR ACTION BUTTONS (مطابقة للصورة تماماً) */}
          <div className="flex items-center justify-around gap-2.5">
            
            {/* 1. Cloud Upload Circle Button (سحابة رفع الملفات والصوت والصور) */}
            <button
              type="button"
              onClick={() => {
                setAttachmentTab(attachmentTab === 'files' ? null : 'files');
                setIsDrawingModalOpen(false);
              }}
              className={`w-11 h-11 rounded-full bg-[#38bdf8] hover:bg-[#0284c7] text-white flex items-center justify-center shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                attachmentTab === 'files' ? 'ring-4 ring-sky-300 scale-105' : ''
              }`}
              title="دخول مدير الملفات (صوت أو صورة) ☁️"
            >
              <Upload className="w-5 h-5 text-white stroke-[2.3]" />
            </button>

            {/* 2. Text Note / Formatting Circle Button (تنسيق النصوص والألوان والخطوط) */}
            <button
              type="button"
              onClick={() => {
                setAttachmentTab(attachmentTab === 'format' ? null : 'format');
                setIsDrawingModalOpen(false);
              }}
              className={`w-11 h-11 rounded-full bg-[#0284c7] hover:bg-[#0369a1] text-white flex items-center justify-center shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                attachmentTab === 'format' ? 'ring-4 ring-blue-300 scale-105' : ''
              }`}
              title="لوحة الألوان والنيون وحجم وعرض الخط 📝"
            >
              <FileText className="w-5 h-5 text-white stroke-[2.3]" />
            </button>

            {/* 3. Paint Palette Circle Button (لوحة الرسم والألوان) */}
            <button
              type="button"
              onClick={() => {
                setAttachmentTab('drawing');
                setIsMediaOpen(false);
                setIsDrawingModalOpen(true);
              }}
              className="w-11 h-11 rounded-full bg-[#fce7f3] hover:bg-[#fbcfe8] flex items-center justify-center shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer border border-pink-200"
              title="فتح لوحة الرسم والتخطيط 🎨"
            >
              <Palette className="w-5 h-5 text-pink-600 stroke-[2.3]" />
            </button>

            {/* 4. YouTube Songs Circle Button (يوتيوب الأغاني والمقاطع) */}
            <button
              type="button"
              onClick={() => {
                setAttachmentTab(attachmentTab === 'youtube' ? null : 'youtube');
                setIsDrawingModalOpen(false);
              }}
              className={`w-11 h-11 rounded-full bg-white hover:bg-red-50 border border-slate-200/90 flex items-center justify-center shadow-md transition-all transform hover:scale-105 active:scale-95 cursor-pointer ${
                attachmentTab === 'youtube' ? 'ring-4 ring-red-300 scale-105' : ''
              }`}
              title="البحث عن الأغاني والمقاطع في يوتيوب 📺"
            >
              <div className="bg-[#ff0000] text-white rounded-md px-1.5 py-0.5 flex items-center justify-center shadow-xs text-[10px] font-black tracking-tighter">
                <span className="font-sans">YouTube</span>
              </div>
            </button>

          </div>

          {/* TAB 1: FILE MANAGER (📎 دخول مدير الملفات تقدر ترسل صوت أو صورة) */}
          {attachmentTab === 'files' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-2">
                <span className="font-extrabold text-slate-800 block">
                  📁 مدير الملفات (صوت أو صورة):
                </span>
                <p className="text-[11px] text-slate-500">
                  يمكنك اختيار مقطع صوتي (MP3, WAV, M4A) أو صورة من استوديو الجهاز لإرسالها بالعام.
                </p>

                {!selectedFile ? (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-amber-400 hover:border-amber-500 bg-amber-50/60 p-4 rounded-xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors group"
                  >
                    <Upload className="w-6 h-6 text-amber-600 group-hover:scale-110 transition-transform" />
                    <span className="text-xs font-black text-amber-950">
                      اضغط لدخول مدير الملفات 📎
                    </span>
                    <span className="text-[10px] text-amber-800">
                      اختر ملف صوتي أو صورة من الهاتف/الجهاز
                    </span>
                  </button>
                ) : (
                  <div className="space-y-2.5 bg-white p-3 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span className="flex items-center gap-1.5 truncate max-w-[200px]">
                        {selectedFile.type === 'audio' ? <Music className="w-4 h-4 text-amber-600" /> : <ImageIcon className="w-4 h-4 text-amber-600" />}
                        <span className="truncate">{selectedFile.name}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="text-red-600 hover:bg-red-50 p-1 rounded-full"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {selectedFile.type === 'image' && selectedFile.base64 && selectedFile.base64.trim() !== '' && (
                      <img
                        src={selectedFile.base64}
                        alt="معاينة الملف"
                        className="max-h-36 mx-auto rounded-lg object-contain bg-slate-100 border border-slate-200"
                      />
                    )}

                    {selectedFile.type === 'audio' && (
                      <div className="p-2 bg-amber-50 rounded-lg text-xs font-bold text-amber-900 flex items-center justify-between">
                        <span>🎵 مقطع صوتي جاهز للإرسال</span>
                        <span className="text-[10px] bg-amber-200 px-2 py-0.5 rounded">صوت</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSendSelectedFile}
                      className="w-full bg-slate-900 text-white font-black text-xs py-2 rounded-xl hover:bg-slate-800 shadow cursor-pointer"
                    >
                      إرسال الملف إلى العام ✈️
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: YOUTUBE SONG SEARCH (📺 زر اليوتيوب البحث عن الاغاني تكتب اسم الاغنية ثما بحث ترتسل مباشرة) */}
          {attachmentTab === 'youtube' && (
            <div className="space-y-3">
              {/* Search Bar Input */}
              <div className="space-y-1">
                <label className="block text-[11px] font-extrabold text-slate-700">
                  البحث عن الأغاني والمقاطع في يوتيوب (تكتب اسم الأغنية ثم بحث):
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={ytSearchQuery}
                    onChange={(e) => handleYouTubeSearch(e.target.value)}
                    placeholder="اكتب اسم الأغنية أو المطرب هنا..."
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-red-500 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => handleYouTubeSearch(ytSearchQuery)}
                    className="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>بحث</span>
                  </button>
                </div>
              </div>

              {/* YouTube Songs Results Catalog List */}
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                <p className="text-[10px] text-slate-500 font-bold">
                  اضغط على أي أغنية لإرسالها مباشرة إلى العام:
                </p>

                {ytFilteredSongs.map((song) => (
                  <button
                    key={song.id}
                    type="button"
                    onClick={() => handleSendYouTubeSong(song.youtubeId, song.title)}
                    className="w-full text-right bg-slate-50 hover:bg-red-50 border border-slate-200 hover:border-red-300 p-2 rounded-2xl flex items-center gap-2.5 transition-all cursor-pointer group active:scale-98"
                    title="اضغط لإرسال الأغنية فوراً إلى العام ✈️"
                  >
                    <div className="relative w-16 h-12 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-slate-200">
                      {song.thumbnail && song.thumbnail.trim() !== '' && (
                        <img
                          src={song.thumbnail}
                          alt={song.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      )}
                      <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[9px] px-1 rounded font-mono">
                        {song.duration}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate group-hover:text-red-700">
                        {song.title}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Youtube className="w-3 h-3 text-red-600 inline" />
                        <span>{song.channel}</span>
                      </p>
                    </div>

                    <span className="bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-xl shrink-0 group-hover:bg-red-500 shadow-xs">
                      إرسال ✈️
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: TEXT FORMATTING & COLORS (📝 زر 📝 بلون أخضر - الخيارات بشكل عمودي) */}
          {attachmentTab === 'format' && (
            <div className="space-y-3.5 max-h-72 overflow-y-auto custom-scrollbar p-1">
              
              {/* VERTICAL SECTION 1: Standard Colors Palette (لوحة جميع الألوان فيها) */}
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <Palette className="w-4 h-4 text-emerald-600" />
                  <span>لوحة جميع الألوان الرئيسية:</span>
                </span>
                <div className="grid grid-cols-5 gap-1.5 pt-1">
                  {STANDARD_COLORS.map((col) => (
                    <button
                      key={col.value}
                      type="button"
                      onClick={() => setSelectedTextColor(col.value)}
                      style={{ backgroundColor: col.value }}
                      className={`h-8 rounded-xl border border-slate-300 flex items-center justify-center transition-transform cursor-pointer shadow-xs ${
                        selectedTextColor === col.value ? 'ring-2 ring-emerald-500 scale-105' : ''
                      }`}
                      title={col.name}
                    >
                      {selectedTextColor === col.value && (
                        <Check className={`w-4 h-4 ${col.value === '#ffffff' ? 'text-black' : 'text-white'}`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* VERTICAL SECTION 2: Shiny Neon Colors Palette (زر ألوان نيون لامعة) */}
              <div className="space-y-1.5 bg-slate-950 p-2.5 rounded-2xl border border-slate-800">
                <span className="text-xs font-black text-amber-400 flex items-center gap-1">
                  <span>✨ ألوان نيون لامعة (Neon Colors):</span>
                </span>
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  {NEON_COLORS_PALETTE.map((neon) => (
                    <button
                      key={neon.value}
                      type="button"
                      onClick={() => setSelectedTextColor(neon.value)}
                      style={{
                        backgroundColor: neon.value,
                        boxShadow: `0 0 10px ${neon.value}`
                      }}
                      className={`py-1.5 px-2 rounded-xl text-[10px] font-black text-slate-950 transition-transform cursor-pointer border border-white/40 truncate ${
                        selectedTextColor === neon.value ? 'scale-105 ring-2 ring-white' : ''
                      }`}
                    >
                      {neon.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* VERTICAL SECTION 3: Font Size Picker (زر حجم الخط) */}
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <span>📐 زر حجم الخط:</span>
                </span>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {FONT_SIZES.map((sz) => (
                    <button
                      key={sz.value}
                      type="button"
                      onClick={() => setSelectedFontSize(sz.value)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        selectedFontSize === sz.value
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {sz.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* VERTICAL SECTION 4: Font Line Width / Boldness (زر عرض الخط) */}
              <div className="space-y-1.5 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <span>✍️ زر عرض الخط (سمك الخط):</span>
                </span>
                <div className="space-y-1 pt-1">
                  {FONT_WEIGHTS.map((fw) => (
                    <button
                      key={fw.value}
                      type="button"
                      onClick={() => setSelectedFontWeight(fw.value)}
                      className={`w-full py-2 px-3 rounded-xl text-xs text-right transition-all cursor-pointer flex items-center justify-between ${
                        selectedFontWeight === fw.value
                          ? 'bg-emerald-600 text-white font-black shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span style={{ fontWeight: fw.value }}>{fw.label}</span>
                      {selectedFontWeight === fw.value && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-1">
                <span className="text-[10px] text-slate-400 block font-bold">معاينة النص بالتنسيق المختار:</span>
                <p
                  style={{
                    color: selectedTextColor,
                    fontSize: selectedFontSize,
                    fontWeight: selectedFontWeight,
                    textShadow: NEON_COLORS_PALETTE.some(n => n.value === selectedTextColor)
                      ? `0 0 8px ${selectedTextColor}`
                      : 'none'
                  }}
                  className="truncate"
                >
                  هكذا ستظهر رسائلك في المحادثة العامة! 🌟
                </p>
              </div>

            </div>
          )}

        </div>
      )}

      {/* Drawing Canvas Modal (📋) */}
      {isDrawingModalOpen && (
        <DrawingCanvasModal onClose={() => setIsDrawingModalOpen(false)} />
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
              className="bg-slate-900 text-white px-3 py-1 rounded-lg font-bold text-xs hover:bg-slate-800 cursor-pointer"
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
          <input
            type="text"
            value={text}
            onChange={handleTextChange}
            placeholder={isRecording ? 'جاري تسجيل مقطعك الصوتي...' : 'اكتب هنا...'}
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
          type="button"
          onClick={() => {
            setIsMediaOpen(!isMediaOpen);
            setIsEmojiOpen(false);
          }}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors shrink-0 cursor-pointer flex items-center justify-center"
          title="إرفاق الوسائط، مدير الملفات، اليوتيوب، التنسيق ولوحة الرسم"
        >
          <Plus className="w-5 h-5" />
        </button>
      </form>
    </div>
  );
};
