import React, { useState, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { convertCustomEmojiItemToDef } from '../CustomEmojis';
import {
  Image, Plus, Trash2, Upload, Check, Tag, Eye,
  Crown, AlertCircle, Copy, Search, Loader2
} from 'lucide-react';

export const EmojisView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const { customEmojis, addCustomEmoji, deleteCustomEmoji, clearAllCustomEmojis } = useChat();

  // Form State
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [operatingId, setOperatingId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-generate tag from name
  const handleNameChange = (val: string) => {
    setName(val);
    if (!tag || tag.startsWith(':')) {
      const slug = val
        .trim()
        .toLowerCase()
        .replace(/[\s\-_]+/g, '_')
        .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '');
      if (slug) {
        setTag(`:${slug}:`);
      }
    }
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('⚠️ يرجى اختيار ملف صورة صالح (PNG, GIF, JPG, WEBP, SVG)');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('⚠️ حجم الصورة كبير جداً، يفضل اختيار صورة أقل من 2 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        if (!name) {
          const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '');
          setName(fileNameNoExt);
          const slug = fileNameNoExt
            .trim()
            .toLowerCase()
            .replace(/[\s\-_]+/g, '_')
            .replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '');
          if (slug) {
            setTag(`:${slug}:`);
          }
        }
        showToast('تم تحميل ملف الصورة بنجاح من جهازك 🖼️');
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleAddSticker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || operatingId) return;

    if (!imageUrl.trim()) {
      showToast('⚠️ يرجى رفع صورة أو إدخال رابط الصورة');
      return;
    }

    const cleanTag = tag.trim().replace(/^:+|:+$/g, '');
    if (!cleanTag) {
      showToast('⚠️ يرجى إدخال كلمة مختصرة أو رمز للملصق مثل :warda: أو :وردة:');
      return;
    }

    const finalName = name.trim() || cleanTag;

    setIsSubmitting(true);
    try {
      addCustomEmoji({
        name: finalName,
        tag: `:${cleanTag}:`,
        imageUrl: imageUrl.trim(),
        category: 'custom',
      });

      // Reset Form
      setName('');
      setTag('');
      setImageUrl('');
      showToast('تمت إضافة الملصق بنجاح ونشره لجميع المستخدمين! 🎉');
    } catch (err) {
      console.error('Failed to add sticker:', err);
      showToast('⚠️ حدث خطأ أثناء إضافة الملصق');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSticker = async (id: string, stickerName: string) => {
    if (operatingId || isSubmitting) return;
    setOperatingId(id);
    try {
      deleteCustomEmoji(id);
      showToast(`تم حذف ملصق "${stickerName}" بنجاح 🗑️`);
    } catch (err) {
      console.error('Failed to delete sticker:', err);
      showToast('⚠️ فشل حذف الملصق');
    } finally {
      setOperatingId(null);
    }
  };

  const filteredEmojis = customEmojis.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return item.name.toLowerCase().includes(q) || item.tag.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-5xl mx-auto space-y-4 font-sans text-right" dir="rtl">
      {/* Top Banner Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span>إدارة ورفع ملصقات الموقع</span>
            <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full font-mono">
              {customEmojis.length} ملصق متاح
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            رفع ملصقات جديدة (PNG, GIF متحرك, SVG, WebP) وتحديد كلمة مختصرة (التاق) لتظهر فورياً لجميع المستخدمين في المحادثات.
          </p>
        </div>

        {customEmojis.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('هل أنت متأكد من حذف جميع الملصقات من الموقع؟')) {
                clearAllCustomEmojis();
                showToast('تم حذف جميع الملصقات بنجاح 🗑️');
              }
            }}
            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 shadow-2xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>حذف جميع الملصقات</span>
          </button>
        )}
      </div>

      {/* Main Grid: Upload Form + Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* UPLOAD FORM (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>رفع ملصق جديد ونشره للجميع</span>
            </h4>
            <span className="text-[10px] text-amber-700 bg-amber-50 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              خاص بالمالك
            </span>
          </div>

          <form onSubmit={handleAddSticker} className="space-y-3.5 text-xs">
            {/* Image Upload Input */}
            <div className="space-y-2">
              <label className="font-bold text-slate-700 block">
                ملف الصورة أو رابط الملصق (PNG, GIF متحرك, SVG, WEBP): <span className="text-red-500">*</span>
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl.startsWith('data:') ? 'تم اختيار صورة من جهازك بنجاح' : imageUrl}
                  onChange={(e) => {
                    if (!imageUrl.startsWith('data:')) {
                      setImageUrl(e.target.value);
                    }
                  }}
                  readOnly={imageUrl.startsWith('data:')}
                  placeholder="https://example.com/sticker.png أو اختر من جهازك"
                  className="flex-1 bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-lg p-2 font-mono text-left outline-hidden text-xs"
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
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs text-xs"
                  title="رفع ملف من الجهاز"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>رفع من الجهاز</span>
                </button>

                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-200 cursor-pointer shrink-0"
                    title="مسح الصورة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Sticker Name & Short Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  اسم الملصق: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثال: وردة حمراء، فنجان قهوة"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-lg p-2 font-bold outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  الكلمة المختصرة (التاق): <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="مثال: :warda: أو :وردة:"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-lg p-2 font-mono font-bold outline-hidden text-left"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || Boolean(operatingId)}
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 stroke-[3]" />}
                <span>{isSubmitting ? 'جاري الحفظ والنشر...' : 'حفظ ونشر الملصق لجميع المستخدمين الآن ✨'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* LIVE PREVIEW (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>معاينة حية للملصق</span>
              </h4>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                مباشر
              </span>
            </div>

            {/* In-chat preview */}
            <div className="bg-slate-100/80 rounded-xl p-3 border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold text-slate-500">كيف سيظهر داخل رسائل الدردشة:</div>
              <div className="bg-white rounded-lg p-2.5 shadow-2xs border border-slate-200/80 text-xs flex items-center gap-2">
                <span className="font-bold text-amber-600 shrink-0">المستخدم:</span>
                <span className="text-slate-800 flex items-center flex-wrap gap-1">
                  <span>أهلاً بكم</span>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name || 'ملصق'}
                      className="inline-block object-contain max-h-[32px] max-w-[100px] align-middle mx-1"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="font-mono text-amber-600 font-bold">{tag || ':tag:'}</span>
                  )}
                  <span>نورتوا الشات!</span>
                </span>
              </div>
            </div>

            {/* In-picker preview */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold text-slate-500">كيف سيظهر في صندوق الملصقات:</div>
              <div className="bg-white p-3 rounded-lg border border-slate-200 flex flex-col items-center justify-center min-h-[64px]">
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt={name}
                      className="max-h-[44px] max-w-[120px] object-contain mb-1.5"
                      referrerPolicy="no-referrer"
                    />
                    <span className="font-mono text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      {tag || ':tag:'}
                    </span>
                  </>
                ) : (
                  <span className="text-slate-400 text-xs italic">ارفع صورة لتشاهد المعاينة هنا</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Stickers Grid */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-indigo-600" />
              <span>قائمة الملصقات المرفوعة في الموقع ({customEmojis.length})</span>
            </h4>
          </div>

          {/* Search in uploaded stickers */}
          {customEmojis.length > 0 && (
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الملصقات..."
                className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-lg pr-7 pl-2 py-1 text-xs outline-hidden"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>

        {customEmojis.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Image className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">لا توجد ملصقات مرفوعة حالياً</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              استخدم نموذج الرفع بالأعلى لرفع ملصقات جديدة وسيكون بإمكان جميع المستخدمين استخدامها فوراً.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredEmojis.map((item) => {
              const def = convertCustomEmojiItemToDef(item);
              const Comp = def.component;
              return (
                <div
                  key={item.id}
                  className="bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded-xl p-2.5 flex flex-col items-center justify-between gap-2 transition-all shadow-2xs group"
                >
                  <div className="w-full h-14 flex items-center justify-center p-1 bg-white rounded-lg border border-slate-100">
                    <Comp size={40} />
                  </div>

                  <div className="w-full text-center min-w-0">
                    <div className="font-bold text-slate-800 text-[11px] truncate" title={item.name}>
                      {item.name}
                    </div>
                    <div className="font-mono text-[10px] text-amber-700 font-bold truncate mt-0.5 bg-amber-50 py-0.5 px-1 rounded border border-amber-200">
                      {item.tag}
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={operatingId === item.id || isSubmitting}
                    onClick={() => handleDeleteSticker(item.id, item.name)}
                    className="w-full py-1 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="حذف هذا الملصق"
                  >
                    {operatingId === item.id ? (
                      <Loader2 className="w-3 h-3 animate-spin text-rose-600" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                    <span>{operatingId === item.id ? 'جاري الحذف...' : 'حذف'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
