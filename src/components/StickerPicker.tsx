import React, { useState, useMemo, useRef } from 'react';
import { useChat } from '../context/ChatContext';
import { getAllCustomEmojis, CustomEmojiDef } from './CustomEmojis';
import {
  Search, X, Sparkles, Image as ImageIcon, Crown,
  Plus, Tag, Check, Trash2, Upload, Link, AlertCircle
} from 'lucide-react';

interface StickerPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSticker: (tag: string) => void;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({
  isOpen,
  onClose,
  onSelectSticker,
}) => {
  const { customEmojis, addCustomEmoji, deleteCustomEmoji, currentUser } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Owner upload form modal / inline toggle
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [stickerName, setStickerName] = useState('');
  const [stickerTag, setStickerTag] = useState('');
  const [stickerImageUrl, setStickerImageUrl] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isOwner = currentUser?.role === 'owner';

  // Convert customEmojis to usable definitions
  const allStickers: CustomEmojiDef[] = useMemo(() => {
    return getAllCustomEmojis(customEmojis);
  }, [customEmojis]);

  // Filtered Stickers List
  const filteredStickers = useMemo(() => {
    if (!searchQuery.trim()) return allStickers;
    const q = searchQuery.toLowerCase().trim();
    return allStickers.filter((sticker) => {
      const matchName = sticker.name.toLowerCase().includes(q);
      const matchTag = sticker.tag.toLowerCase().includes(q);
      return matchName || matchTag;
    });
  }, [allStickers, searchQuery]);

  if (!isOpen) return null;

  const handlePick = (tag: string) => {
    onSelectSticker(tag);
    setCopiedTag(tag);
    setTimeout(() => {
      setCopiedTag(null);
    }, 1500);
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('يرجى اختيار ملف صورة صالح (PNG, GIF, JPG, WEBP, SVG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setUploadError('حجم الصورة كبير جداً، يفضل اختيار صورة أقل من 2 ميجابايت');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        const base64 = event.target.result as string;
        setStickerImageUrl(base64);
        if (!stickerName) {
          const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '');
          setStickerName(fileNameNoExt);
          const slug = fileNameNoExt
            .trim()
            .replace(/[\s\-_]+/g, '_')
            .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '');
          if (slug) {
            setStickerTag(`:${slug}:`);
          }
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleNameChange = (val: string) => {
    setStickerName(val);
    if (!stickerTag || stickerTag === `:${val.trim()}:`) {
      const slug = val
        .trim()
        .replace(/[\s\-_]+/g, '_')
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '');
      if (slug) {
        setStickerTag(`:${slug}:`);
      }
    }
  };

  const handleSaveSticker = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    if (!stickerImageUrl.trim()) {
      setUploadError('يرجى رفع صورة الملصق أو وضع رابط الصورة');
      return;
    }

    const cleanTag = stickerTag.trim().replace(/^:+|:+$/g, '');
    if (!cleanTag) {
      setUploadError('يرجى إدخال رمز أو كلمة مختصرة للملصق (مثل :warda: أو :وردة:)');
      return;
    }

    const finalName = stickerName.trim() || cleanTag;

    addCustomEmoji({
      name: finalName,
      tag: `:${cleanTag}:`,
      imageUrl: stickerImageUrl.trim(),
      category: 'custom',
    });

    // Reset Form
    setStickerName('');
    setStickerTag('');
    setStickerImageUrl('');
    setShowUploadForm(false);
    setUploadError(null);
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (window.confirm(`هل أنت متأكد من حذف ملصق "${name}" لجميع المستخدمين؟`)) {
      deleteCustomEmoji(id);
    }
  };

  return (
    <div
      id="sticker-picker-container"
      className="absolute bottom-full left-0 right-0 sm:left-auto sm:right-auto sm:w-[420px] md:w-[460px] mb-2 bg-white border border-slate-200/90 rounded-2xl shadow-2xl overflow-hidden z-40 animate-in fade-in slide-in-from-bottom-2 duration-150 text-right dir-rtl font-sans"
      dir="rtl"
    >
      {/* 1. Header Bar (Dark Navy Theme) */}
      <div className="bg-[#0e1b26] text-white px-3 py-2.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xs sm:text-sm tracking-tight text-white">
                ملصقات الموقع
              </span>
              <span className="bg-amber-500/30 text-amber-300 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {allStickers.length}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              انقر على أي ملصق لإدراجه في المحادثة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Dedicated Owner Upload Button */}
          {isOwner && (
            <button
              type="button"
              onClick={() => {
                setShowUploadForm(!showUploadForm);
                setUploadError(null);
              }}
              className={`text-xs font-black px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                showUploadForm
                  ? 'bg-slate-700 hover:bg-slate-600 text-white'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950'
              }`}
              title="رفع ملصق جديد للموقع"
            >
              {showUploadForm ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  <span>إلغاء</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>رفع ملصق</span>
                </>
              )}
            </button>
          )}

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white hover:bg-slate-800 p-1 rounded-lg transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>

      {/* 2. OWNER UPLOAD FORM (Shows when Owner clicks "رفع ملصق") */}
      {isOwner && showUploadForm && (
        <div className="p-3 bg-amber-50/60 border-b border-amber-200 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between mb-2">
            <span className="font-black text-xs text-amber-950 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>رفع ملصق جديد ونشره لجميع المستخدمين</span>
            </span>
          </div>

          <form onSubmit={handleSaveSticker} className="space-y-2.5 text-xs">
            {uploadError && (
              <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] font-bold flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Image Source (Upload or URL) */}
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                صورة الملصق (PNG, GIF متحرك, WEBP, SVG): <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={stickerImageUrl.startsWith('data:') ? 'تم اختيار صورة من جهازك' : stickerImageUrl}
                  onChange={(e) => {
                    if (!stickerImageUrl.startsWith('data:')) {
                      setStickerImageUrl(e.target.value);
                    }
                  }}
                  readOnly={stickerImageUrl.startsWith('data:')}
                  placeholder="https://example.com/sticker.png أو ارفع من جهازك"
                  className="flex-1 bg-white border border-slate-200 focus:border-amber-500 rounded-lg p-2 font-mono text-left outline-hidden text-[11px]"
                  dir="ltr"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold flex items-center gap-1 cursor-pointer shrink-0 shadow-xs text-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع من الجهاز</span>
                </button>

                {stickerImageUrl && (
                  <button
                    type="button"
                    onClick={() => setStickerImageUrl('')}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 cursor-pointer shrink-0"
                    title="مسح الصورة"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Name & Tag Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  اسم الملصق: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={stickerName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثال: وردة حمراء"
                  className="w-full bg-white border border-slate-200 focus:border-amber-500 rounded-lg p-1.5 font-bold outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  الكلمة المختصرة (التاق): <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={stickerTag}
                  onChange={(e) => setStickerTag(e.target.value)}
                  placeholder="مثال: :warda: أو :وردة:"
                  className="w-full bg-white border border-slate-200 focus:border-amber-500 rounded-lg p-1.5 font-mono font-bold outline-hidden text-left"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {/* Thumbnail Preview */}
            {stickerImageUrl && (
              <div className="flex items-center gap-3 p-2 bg-white rounded-lg border border-slate-200">
                <div className="w-12 h-12 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center p-1 shrink-0">
                  <img
                    src={stickerImageUrl}
                    alt="معاينة"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-slate-800 font-black text-xs truncate">
                    {stickerName || 'معاينة الملصق'}
                  </div>
                  <div className="font-mono text-[11px] text-amber-600 font-bold">
                    {stickerTag || ':tag:'}
                  </div>
                </div>
              </div>
            )}

            {/* Submit & Cancel */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg shadow-xs cursor-pointer flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>حفظ ونشر الملصق للجميع ✨</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowUploadForm(false);
                  setUploadError(null);
                }}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Search Bar */}
      <div className="p-2 bg-slate-50 border-b border-slate-200">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث في الملصقات باسم الملصق أو الكلمة المختصرة..."
            className="w-full bg-white border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl px-8 py-1.5 text-xs text-slate-800 placeholder-slate-400 transition-all outline-hidden font-medium"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Stickers Grid View */}
      <div className="p-2.5 sm:p-3 bg-white max-h-72 sm:max-h-80 overflow-y-auto custom-scrollbar select-none">
        {filteredStickers.length === 0 ? (
          <div className="text-center py-10 px-4 text-slate-400 space-y-2">
            <ImageIcon className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
            <p className="text-xs font-bold text-slate-600">
              {searchQuery ? 'لا توجد ملصقات مطابقة للبحث' : 'لا توجد ملصقات مرفوعة حالياً'}
            </p>
            <p className="text-[11px] text-slate-400">
              {isOwner
                ? 'يمكنك رفع ملصقات جديدة وتحديد كلمة مختصرة لتظهر لجميع المستخدمين'
                : 'ستظهر هنا الملصقات التي يرفعها المالك لاستخدامها في الدردشة'}
            </p>
            {isOwner && !showUploadForm && (
              <button
                type="button"
                onClick={() => setShowUploadForm(true)}
                className="mt-2 text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>رفع ملصق جديد الآن</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 bg-slate-50/60 p-2 rounded-xl border border-slate-100">
            {filteredStickers.map((item) => {
              const Comp = item.component;
              const isJustCopied = copiedTag === item.tag;
              return (
                <div
                  key={item.id}
                  className="group relative bg-white hover:bg-amber-50/60 border border-slate-200 hover:border-amber-400 rounded-xl p-1.5 flex flex-col items-center justify-between transition-all cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs aspect-square"
                  onClick={() => handlePick(item.tag)}
                  title={`${item.name} (${item.tag})`}
                >
                  {/* Sticker Display */}
                  <div className="w-full flex-1 flex items-center justify-center p-1 group-hover:scale-110 transition-transform overflow-hidden">
                    <Comp size={36} animated={true} />
                  </div>

                  {/* Short Tag Label */}
                  <div className="w-full text-center truncate font-mono text-[9px] text-slate-500 font-bold group-hover:text-amber-700 bg-slate-100 group-hover:bg-amber-100 rounded px-1 py-0.5 mt-1">
                    {item.tag}
                  </div>

                  {/* Copy check indicator */}
                  {isJustCopied && (
                    <span className="absolute top-1 right-1 bg-emerald-500 text-white p-0.5 rounded-full shadow-xs z-10">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}

                  {/* Owner Delete Button */}
                  {isOwner && (
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, item.id, item.name)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity absolute top-1 left-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md shadow-xs z-10 cursor-pointer"
                      title="حذف هذا الملصق من الموقع"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Footer Bar */}
      <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1 text-slate-600">
          <Tag className="w-3.5 h-3.5 text-amber-600" />
          <span>تظهر الملصقات فورياً عند كتابة كلمتها المختصرة</span>
        </div>
        {copiedTag && (
          <span className="text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
            <Check className="w-3 h-3" />
            <span>تم إدراج {copiedTag}</span>
          </span>
        )}
      </div>
    </div>
  );
};
