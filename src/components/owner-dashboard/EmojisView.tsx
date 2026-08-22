import React, { useState, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { CustomEmojiItem } from '../../types';
import {
  CUSTOM_EMOJIS_LIST,
  CUSTOM_EMOJI_CATEGORIES,
  convertCustomEmojiItemToDef,
  getAllCustomEmojis
} from '../CustomEmojis';
import {
  Smile, Plus, Trash2, Image, Sparkles, Upload, Link, Check,
  Layers, Palette, Tag, Eye, RefreshCw, AlertCircle, ShieldAlert,
  Send, ExternalLink
} from 'lucide-react';

export const EmojisView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const { customEmojis, addCustomEmoji, deleteCustomEmoji, clearAllCustomEmojis, currentUser } = useChat();

  // Form State
  const [emojiType, setEmojiType] = useState<'image' | 'banner' | 'unicode'>('image');
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [category, setCategory] = useState<'greetings' | 'drinks' | 'emotions' | 'actions' | 'love' | 'custom'>('custom');
  const [imageUrl, setImageUrl] = useState('');
  const [emojiChar, setEmojiChar] = useState('✨');
  const [bannerText, setBannerText] = useState('');
  const [bannerBg, setBannerBg] = useState('linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%)');
  const [isBanner, setIsBanner] = useState(false);
  const [filterCategory, setFilterCategory] = useState('all');

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
      showToast('⚠️ حجم الصورة كبير جداً، يفضل أقل من 2 ميجابايت');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        if (!name) {
          const fileNameNoExt = file.name.replace(/\.[^/.]+$/, '');
          setName(fileNameNoExt);
          setTag(`:${fileNameNoExt.toLowerCase().replace(/\s+/g, '_')}:`);
        }
        showToast('تم تحميل الصورة بنجاح من جهازك 🖼️');
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Handler
  const handleAddEmoji = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('⚠️ يرجى إدخال اسم الإيموجي');
      return;
    }

    const cleanTag = tag.trim().replace(/^:+|:+$/g, '');
    if (!cleanTag) {
      showToast('⚠️ يرجى إدخال رمز تاق صالح مثل :my_emoji:');
      return;
    }

    if (emojiType === 'image' && !imageUrl.trim()) {
      showToast('⚠️ يرجى إدخال رابط الصورة أو رفع ملف صورة');
      return;
    }

    if (emojiType === 'banner' && !bannerText.trim()) {
      showToast('⚠️ يرجى كتابة نص العبارة الترحيبية');
      return;
    }

    addCustomEmoji({
      name: name.trim(),
      tag: `:${cleanTag}:`,
      category,
      imageUrl: emojiType === 'image' ? imageUrl.trim() : undefined,
      emojiChar: emojiType === 'unicode' ? emojiChar.trim() : undefined,
      bannerText: emojiType === 'banner' ? bannerText.trim() : undefined,
      bannerBg: emojiType === 'banner' ? bannerBg : undefined,
      isBanner: isBanner || emojiType === 'banner',
    });

    // Reset Form
    setName('');
    setTag('');
    setImageUrl('');
    setBannerText('');
    showToast('تمت إضافة الإيموجي بنجاح إلى شريط الكتابة! 🎉✨');
  };

  // Preset packs
  const handleAddPresetPack = (packType: 'greetings' | 'luxury' | 'coffee') => {
    if (packType === 'greetings') {
      addCustomEmoji({
        name: 'صباح الخير والورد',
        tag: ':sabah_ward:',
        category: 'greetings',
        bannerText: '🌸 صباح الخير والورد 🌸',
        bannerBg: 'linear-gradient(135deg, #ec4899 0%, #f43f5e 50%, #be123c 100%)',
        isBanner: true
      });
      addCustomEmoji({
        name: 'مساء النور والسرور',
        tag: ':masaa_noor:',
        category: 'greetings',
        bannerText: '🌙 مساء النور والسرور 🌙',
        bannerBg: 'linear-gradient(135deg, #1e1b4b 0%, #4338ca 50%, #312e81 100%)',
        isBanner: true
      });
      addCustomEmoji({
        name: 'نورتوا الشات يا غوالي',
        tag: ':nawarto:',
        category: 'greetings',
        bannerText: '👑 نورتوا الشات يا غوالي 👑',
        bannerBg: 'linear-gradient(135deg, #854d0e 0%, #eab308 50%, #ca8a04 100%)',
        isBanner: true
      });
      showToast('تمت إضافة حزمة العبارات الترحيبية بنجاح 💌');
    } else if (packType === 'luxury') {
      addCustomEmoji({
        name: 'تاج ملكي ذهبي',
        tag: ':royal_crown:',
        category: 'love',
        emojiChar: '👑',
        isBanner: false
      });
      addCustomEmoji({
        name: 'ماسة متلألئة',
        tag: ':sparkle_diamond:',
        category: 'love',
        emojiChar: '💎',
        isBanner: false
      });
      addCustomEmoji({
        name: 'نار مشتعلة كشخة',
        tag: ':vip_flame:',
        category: 'emotions',
        emojiChar: '🔥',
        isBanner: false
      });
      showToast('تمت إضافة حزمة الرموز الفاخرة بنجاح 💎');
    } else if (packType === 'coffee') {
      addCustomEmoji({
        name: 'دلة قهوة عربية',
        tag: ':dallah_coffee:',
        category: 'drinks',
        emojiChar: '🫖',
        isBanner: false
      });
      addCustomEmoji({
        name: 'تمر وفاكهة',
        tag: ':dates_fruit:',
        category: 'drinks',
        emojiChar: '🌴',
        isBanner: false
      });
      showToast('تمت إضافة حزمة القهوة والجلسات بنجاح ☕');
    }
  };

  const totalCustomCount = customEmojis.length;
  const totalBuiltinCount = CUSTOM_EMOJIS_LIST.length;

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Top Banner Info */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-slate-800 flex items-center gap-2">
            <Smile className="w-5 h-5 text-amber-500" />
            <span>إدارة الإيموجي والسمايلات في شريط الكتابة</span>
            <span className="text-[11px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full font-mono">
              {totalBuiltinCount + totalCustomCount} إيموجي متاح
            </span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-1">
            إضافة رموز تعبيرية جديدة، ملصقات متحركة (GIF / PNG / WebP / SVG)، وعبارات ترحيبية ثلاثية الأبعاد تظهر فوراً في شريط الدردشة العامة والخاصة.
          </p>
        </div>

        {/* Quick Presets Dropdown/Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => handleAddPresetPack('greetings')}
            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-[11px] font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
            title="إضافة عبارات ترحيب جاهزة"
          >
            <span>+ حزمة الترحيب 💌</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPresetPack('luxury')}
            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 text-[11px] font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
            title="إضافة رموز فاخرة"
          >
            <span>+ حزمة فاخرة 💎</span>
          </button>

          <button
            type="button"
            onClick={() => handleAddPresetPack('coffee')}
            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 text-[11px] font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1 shadow-2xs"
            title="إضافة مشروبات وجلسات"
          >
            <span>+ جلسات وقهوة ☕</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Add Form (Right) + Live Preview & Stats (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* ADD EMOJI FORM (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-emerald-600" />
              <span>إضافة إيموجي / سمايل جديد إلى شريط الكتابة</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-bold">لوحة المالك</span>
          </div>

          <form onSubmit={handleAddEmoji} className="space-y-3.5 text-xs">
            
            {/* 1. Emoji Type Tabs */}
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">نوع الإيموجي أو المحتوى:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => { setEmojiType('image'); setIsBanner(false); }}
                  className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    emojiType === 'image'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>صورة / GIF متحرك</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setEmojiType('banner'); setIsBanner(true); }}
                  className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    emojiType === 'banner'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>عبارة ترحيبية 3D</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setEmojiType('unicode'); setIsBanner(false); }}
                  className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    emojiType === 'unicode'
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>رمز تعبيري نصي</span>
                </button>
              </div>
            </div>

            {/* 2. Basic Info: Name & Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  اسم الإيموجي: <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="مثال: فنجان قهوة مميز"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-lg p-2 font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  الرمز المختصر (التاق): <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="مثال: :my_coffee:"
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-lg p-2 font-mono font-bold outline-none text-left"
                  dir="ltr"
                  required
                />
              </div>
            </div>

            {/* 3. Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold text-slate-700 block mb-1">التصنيف في قائمة الإيموجيات:</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-amber-500 rounded-lg p-2 font-bold outline-none cursor-pointer"
                >
                  <option value="greetings">عبارات وترحيب 💌</option>
                  <option value="drinks">شيشة ومشروبات ☕</option>
                  <option value="emotions">سمايلات وتفاعل 😂</option>
                  <option value="actions">حركات ورقص 💃</option>
                  <option value="love">قلوب ومحبة 💖</option>
                  <option value="custom">مخصصة 🌟</option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={isBanner}
                    onChange={(e) => setIsBanner(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4 cursor-pointer"
                  />
                  <span className="font-bold text-slate-700 text-[11px]">
                    عرض كعبارة عريضة (Banner) في الصف الأول
                  </span>
                </label>
              </div>
            </div>

            {/* 4. TYPE SPECIFIC FIELDS */}
            {emojiType === 'image' && (
              <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1 flex items-center justify-between">
                    <span>رابط الصورة أو ملصق GIF:</span>
                    <span className="text-[10px] text-slate-500 font-normal">يدعم (GIF, PNG, SVG, WEBP, JPG)</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://example.com/sticker.gif"
                      className="flex-1 bg-white border border-slate-200 focus:border-amber-500 rounded-lg p-2 font-mono text-left outline-none text-xs"
                      dir="ltr"
                    />
                    
                    {/* Hidden file input */}
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
                      className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
                      title="رفع صورة من الكمبيوتر أو الهاتف"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>رفع ملف</span>
                    </button>
                  </div>
                </div>

                {/* Quick test presets for links */}
                <div>
                  <span className="text-[10px] font-bold text-slate-500 block mb-1">أمثلة لصور وملصقات جاهزة للتجربة:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?w=60&h=60&fit=crop&crop=faces');
                        setName('كتاب ومعرفة');
                        setTag(':book_study:');
                      }}
                      className="px-2 py-1 bg-white hover:bg-amber-100 border border-slate-200 rounded text-[10px] font-bold text-slate-700 cursor-pointer"
                    >
                      📖 كتاب ومعرفة
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setImageUrl('https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=60&h=60&fit=crop');
                        setName('فنجان لاتيه');
                        setTag(':latte_art:');
                      }}
                      className="px-2 py-1 bg-white hover:bg-amber-100 border border-slate-200 rounded text-[10px] font-bold text-slate-700 cursor-pointer"
                    >
                      ☕ فنجان لاتيه
                    </button>
                  </div>
                </div>
              </div>
            )}

            {emojiType === 'banner' && (
              <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-3">
                <div>
                  <label className="font-bold text-slate-800 block mb-1">
                    نص العبارة الترحيبية المصممة: <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={bannerText}
                    onChange={(e) => setBannerText(e.target.value)}
                    placeholder="مثال: ✨ حيّاكم الله وبياكم في شاتنا ✨"
                    className="w-full bg-white border border-slate-200 focus:border-amber-500 rounded-lg p-2 font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-800 block mb-1">نمط التدرج والخلفية:</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {[
                      { name: 'أزرق ملكي', bg: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1d4ed8 100%)' },
                      { name: 'أحمر فاخر', bg: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 50%, #b91c1c 100%)' },
                      { name: 'ذهبي لامع', bg: 'linear-gradient(135deg, #854d0e 0%, #eab308 50%, #ca8a04 100%)' },
                      { name: 'زمردي راقي', bg: 'linear-gradient(135deg, #064e3b 0%, #10b981 50%, #047857 100%)' },
                      { name: 'بنفسجي VIP', bg: 'linear-gradient(135deg, #581c87 0%, #a855f7 50%, #7e22ce 100%)' },
                      { name: 'وردي لطيف', bg: 'linear-gradient(135deg, #831843 0%, #ec4899 50%, #be185d 100%)' },
                      { name: 'داكن ميتاليك', bg: 'linear-gradient(135deg, #0f172a 0%, #334155 50%, #1e293b 100%)' },
                      { name: 'تركواز بحري', bg: 'linear-gradient(135deg, #164e63 0%, #06b6d4 50%, #0891b2 100%)' },
                    ].map((item, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setBannerBg(item.bg)}
                        className={`p-1.5 rounded-lg text-white font-bold text-[10px] shadow-2xs border transition-transform cursor-pointer active:scale-95 ${
                          bannerBg === item.bg ? 'ring-2 ring-slate-900 border-white scale-105' : 'border-transparent opacity-90 hover:opacity-100'
                        }`}
                        style={{ background: item.bg }}
                      >
                        {item.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {emojiType === 'unicode' && (
              <div className="p-3 bg-amber-50/50 border border-amber-200/80 rounded-xl space-y-2">
                <label className="font-bold text-slate-800 block mb-1">الرمز التعبيري (Unicode Emoji):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={emojiChar}
                    onChange={(e) => setEmojiChar(e.target.value)}
                    placeholder="👑"
                    className="w-20 text-center text-2xl bg-white border border-slate-200 focus:border-amber-500 rounded-lg p-2 outline-none"
                  />
                  <div className="flex-1 flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-slate-200 rounded-lg">
                    {['👑', '🌟', '💎', '🔥', '🎉', '🌹', '☕', '💃', '🚀', '🎁', '🏆', '🕊️'].map((em, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEmojiChar(em)}
                        className="w-8 h-8 rounded hover:bg-amber-100 flex items-center justify-center text-lg cursor-pointer transition-transform active:scale-90"
                      >
                        {em}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 active:scale-[0.99]"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>إضافة الإيموجي إلى شريط الكتابة الآن ✨</span>
              </button>
            </div>
          </form>
        </div>

        {/* LIVE PREVIEW & SUMMARY CARD (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Live Preview Box */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-blue-600" />
                <span>معاينة حية للإيموجي</span>
              </h4>
              <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                مباشر
              </span>
            </div>

            {/* In-chat preview simulation */}
            <div className="bg-slate-100/80 rounded-xl p-3 border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold text-slate-500">كيف سيظهر داخل رسائل الدردشة:</div>
              <div className="bg-white rounded-lg p-2.5 shadow-2xs border border-slate-200/80 text-xs flex items-center gap-2">
                <span className="font-bold text-amber-600 shrink-0">المستخدم:</span>
                <span className="text-slate-800">
                  أهلاً بالجميع {tag || ':emoji:'}{' '}
                  {emojiType === 'image' && imageUrl && (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="inline-block object-contain max-h-[32px] max-w-[100px] align-middle mx-1"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {emojiType === 'banner' && bannerText && (
                    <span
                      className="inline-flex items-center justify-center font-black select-none px-2 py-0.5 rounded-lg shadow-xs align-middle mx-1 text-white text-[12px]"
                      style={{ background: bannerBg }}
                    >
                      {bannerText}
                    </span>
                  )}
                  {emojiType === 'unicode' && (
                    <span className="text-xl align-middle mx-1">{emojiChar}</span>
                  )}
                  نتمنى لكم وقتاً ممتعاً!
                </span>
              </div>
            </div>

            {/* In-picker preview simulation */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
              <div className="text-[10px] font-bold text-slate-500">كيف سيظهر داخل قائمة الإيموجيات:</div>
              <div className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-center min-h-[48px]">
                {emojiType === 'image' && imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="max-h-[36px] max-w-[120px] object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : emojiType === 'banner' && bannerText ? (
                  <span
                    className="inline-flex items-center justify-center font-black select-none px-2.5 py-0.5 rounded-lg shadow-xs text-white text-xs"
                    style={{ background: bannerBg }}
                  >
                    {bannerText}
                  </span>
                ) : emojiType === 'unicode' ? (
                  <span className="text-2xl">{emojiChar}</span>
                ) : (
                  <span className="text-slate-400 text-xs italic">يرجى ملء بيانات الإيموجي للمعاينة</span>
                )}
              </div>
              <div className="text-center font-mono text-[10px] text-slate-500 font-bold">
                التاق: <span className="text-amber-600">{tag || ':emoji:'}</span>
              </div>
            </div>
          </div>

          {/* Quick instructions box */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5 text-xs text-slate-700 space-y-1.5">
            <h5 className="font-black text-amber-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>ميزات الإيموجيات المخصصة</span>
            </h5>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-600 leading-relaxed">
              <li>أي إيموجي يضاف هنا يظهر فوراً لجميع المستخدمين في قائمة الإيموجيات.</li>
              <li>يمكن إدراج الإيموجي بالضغط عليه أو بكتابة الرمز المختصر مثل <code className="bg-white px-1 py-0.5 rounded border border-amber-200 font-mono">:salam:</code>.</li>
              <li>الصور المتحركة (GIF / WebP) تعمل تلقائياً مع المحافظة على دقتها وسرعتها.</li>
            </ul>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* CUSTOM EMOJIS LIST TABLE & MANAGEMENT */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>الإيموجيات المخصصة المضافة ({customEmojis.length})</span>
            </h4>
          </div>

          {/* Filter & Clear All */}
          <div className="flex items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">جميع التصنيفات</option>
              <option value="greetings">عبارات وترحيب 💌</option>
              <option value="drinks">شيشة ومشروبات ☕</option>
              <option value="emotions">سمايلات وتفاعل 😂</option>
              <option value="actions">حركات ورقص 💃</option>
              <option value="love">قلوب ومحبة 💖</option>
              <option value="custom">مخصصة 🌟</option>
            </select>

            {customEmojis.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('هل أنت متأكد من حذف جميع الإيموجيات المخصصة؟')) {
                    clearAllCustomEmojis();
                    showToast('تم مسح جميع الإيموجيات المخصصة 🗑️');
                  }
                }}
                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="مسح الكل"
              >
                <Trash2 className="w-3 h-3" />
                <span>مسح المخصص</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Emojis Grid / Table */}
        {customEmojis.length === 0 ? (
          <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Smile className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-600">لا توجد إيموجيات مخصصة مضافة حالياً</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              يمكنك إضافة إيموجيات وصور جديدة أو الضغط على أزرار الحزم الجاهزة بالأعلى لإضافتها بنقرة واحدة.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {customEmojis
              .filter(e => filterCategory === 'all' || e.category === filterCategory)
              .map((item) => {
                const def = convertCustomEmojiItemToDef(item);
                const Comp = def.component;
                return (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-50 hover:bg-amber-50/40 border border-slate-200 hover:border-amber-300 rounded-xl flex items-center justify-between gap-2 transition-all shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-11 h-11 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs p-1">
                        <Comp size={28} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-slate-800 text-xs truncate" title={item.name}>
                          {item.name}
                        </div>
                        <div className="font-mono text-[11px] text-amber-700 font-bold truncate">
                          {item.tag}
                        </div>
                        <div className="text-[9px] text-slate-400 mt-0.5">
                          {item.createdAt || 'اليوم'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        deleteCustomEmoji(item.id);
                        showToast(`تم حذف إيموجي "${item.name}" بنجاح 🗑️`);
                      }}
                      className="w-8 h-8 rounded-lg bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-300 text-slate-400 hover:text-rose-600 flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="حذف هذا الإيموجي"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* BUILT-IN SYSTEM EMOJIS OVERVIEW */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>الإيموجيات الافتراضية المدمجة بالنظام ({CUSTOM_EMOJIS_LIST.length})</span>
          </h4>
          <span className="text-[10px] text-slate-500 font-bold">متحركة وكلاسيكية</span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
          {CUSTOM_EMOJIS_LIST.map((item) => {
            const Comp = item.component;
            return (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-lg p-1.5 flex flex-col items-center justify-center gap-1 hover:border-amber-400 transition-all shadow-2xs group"
                title={`${item.name} (${item.tag})`}
              >
                <div className="h-8 flex items-center justify-center">
                  <Comp size={26} animated={true} />
                </div>
                <span className="text-[9px] font-mono text-slate-500 truncate w-full text-center group-hover:text-amber-700">
                  {item.tag}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
