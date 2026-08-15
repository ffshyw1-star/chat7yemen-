import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Gender } from '../types';
import { UserAvatar } from './UserAvatar';
import {
  X, Check, Camera, Image, Palette, User, MessageSquare,
  Sparkles, Upload, Link, AlertCircle, RefreshCw
} from 'lucide-react';

export interface DefaultAvatar {
  id: string;
  url: string;
  title: string;
  category: 'men' | 'women' | 'royal' | 'cute';
}

export interface NeonColorOption {
  name: string;
  value: string;
}

export const NEON_COLORS: NeonColorOption[] = [
  { name: 'نيون أزرق ⚡', value: '#00f3ff' },
  { name: 'نيون وردي 💖', value: '#ff007f' },
  { name: 'نيون أخضر ❇️', value: '#39ff14' },
  { name: 'نيون أصفر ⚡', value: '#ffee00' },
  { name: 'نيون بنفسجي 🔮', value: '#bf00ff' },
  { name: 'نيون برتقالي 🔥', value: '#ff5500' },
  { name: 'نيون ماجنتا 🌸', value: '#ff00aa' },
  { name: 'نيون فيروزي 🌊', value: '#00ffcc' },
  { name: 'نيون ذهبي 🪙', value: '#ffd700' },
  { name: 'أبيض وهاج 🤍', value: '#ffffff' },
];

export const USERNAME_FONT_SIZES = [
  { label: 'صغير جداً', value: '12px' },
  { label: 'عادي', value: '14px' },
  { label: 'كبير', value: '16px' },
  { label: 'كبير جداً', value: '18px' },
  { label: 'ضخم ⚡', value: '20px' },
];

export const DEFAULT_AVATARS: DefaultAvatar[] = [
  // Men 🧔
  { id: 'm1', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=250&q=80', title: 'شاب أنيق', category: 'men' },
  { id: 'm2', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=250&q=80', title: 'شاب كلاسيكي', category: 'men' },
  { id: 'm3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=250&q=80', title: 'ابتسامة ووقار', category: 'men' },
  { id: 'm4', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80', title: 'نظارة هيبة', category: 'men' },
  { id: 'm5', url: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=250&q=80', title: 'شاب عصري', category: 'men' },
  { id: 'm6', url: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=250&q=80', title: 'صاحب أسلوب', category: 'men' },

  // Women 👩
  { id: 'w1', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=250&q=80', title: 'فتاة مبتسمة', category: 'women' },
  { id: 'w2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80', title: 'أناقة وجمال', category: 'women' },
  { id: 'w3', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=250&q=80', title: 'إطلالة جذابة', category: 'women' },
  { id: 'w4', url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=250&q=80', title: 'هدوء ورقة', category: 'women' },
  { id: 'w5', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=250&q=80', title: 'ذوق رفيع', category: 'women' },
  { id: 'w6', url: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=250&q=80', title: 'مظهر متألق', category: 'women' },

  // Royal & Cool 👑
  { id: 'r1', url: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&w=250&q=80', title: 'ملك الفخامة', category: 'royal' },
  { id: 'r2', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=250&q=80', title: 'فن وتجريد', category: 'royal' },
  { id: 'r3', url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=250&q=80', title: 'أنيمي ورقمي', category: 'royal' },
  { id: 'r4', url: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=250&q=80', title: 'سماء ونجوم', category: 'royal' },
  { id: 'r5', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f9d4_1f3fb/512.webp', title: 'رمز هيبة', category: 'royal' },
  { id: 'r6', url: 'https://fonts.gstatic.com/s/e/notoemoji/latest/1f9b8/512.webp', title: 'رمز بطل', category: 'royal' },

  // Cute & Pets 🐾
  { id: 'c1', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=250&q=80', title: 'جرو مرح', category: 'cute' },
  { id: 'c2', url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=250&q=80', title: 'قطة لطيفة', category: 'cute' },
  { id: 'c3', url: 'https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?auto=format&fit=crop&w=250&q=80', title: 'كلب وفي', category: 'cute' },
  { id: 'c4', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=250&q=80', title: 'مرح ولعب', category: 'cute' },
];

interface ProfileEditorModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const ProfileEditorModal: React.FC<ProfileEditorModalProps> = ({
  onClose
}) => {
  const { currentUser, updateUserProfile } = useChat();

  const [username, setUsername] = useState(currentUser?.username || '');
  const [statusMessage, setStatusMessage] = useState(currentUser?.statusMessage || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [wallCover, setWallCover] = useState(currentUser?.wallCover || '');
  const [gender, setGender] = useState<Gender>(currentUser?.gender || 'male');
  const [age, setAge] = useState<number | string>(currentUser?.age || 'عدم الإظهار');
  const [hideCountry, setHideCountry] = useState<boolean>(currentUser?.hideCountry || false);
  const [usernameColor, setUsernameColor] = useState(currentUser?.usernameColor || '#f59e0b');
  const [usernameFontSize, setUsernameFontSize] = useState(currentUser?.usernameFontSize || '14px');

  // Avatar Selection State
  const [avatarCategory, setAvatarCategory] = useState<'men' | 'women' | 'royal' | 'cute'>('men');
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);

  // Wall Cover State
  const [customWallUrl, setCustomWallUrl] = useState('');
  const [showWallUrlInput, setShowWallUrlInput] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  if (!currentUser) return null;

  const isVipOrHigher = ['vip', 'moderator', 'management', 'admin', 'owner'].includes(currentUser.role);
  const ageOptions = Array.from({ length: 84 }, (_, i) => i + 16);

  const filteredAvatars = DEFAULT_AVATARS.filter(a => a.category === avatarCategory);

  // Handle local image file upload for avatar
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('حجم الصورة كبير جداً! يُرجى اختيار صورة أقل من 5 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setAvatar(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle local image file upload for wall cover (static image or animated GIF)
  const handleWallFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('حجم ملف الغلاف كبير جداً! يُرجى اختيار ملف أقل من 10 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setWallCover(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Profile Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      alert('الرجاء إدخال اسم العرض الشخصي');
      return;
    }

    updateUserProfile({
      username: username.trim(),
      statusMessage: statusMessage.trim(),
      bio: bio.trim(),
      avatar,
      wallCover,
      gender,
      age,
      hideCountry,
      usernameColor,
      usernameFontSize
    });

    setSaveSuccess('تم حفظ الملف الشخصي والصور بنجاح في السيرفر ✨');
    setTimeout(() => {
      setSaveSuccess('');
      if (onClose) onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg max-h-[92vh] flex flex-col overflow-hidden shadow-2xl relative select-none">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-base">
              ✏️
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-amber-400">
                محرر الملف الشخصي والرمزية
              </h3>
              <p className="text-[10px] text-slate-400">تعديل اسم العرض، الحالة، واختيار الصورة الرمزية</p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          
          {saveSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-extrabold flex items-center justify-center gap-2 animate-bounce">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {/* Section 1: Live Avatar Preview & Avatar Gallery */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                <Camera className="w-4 h-4" />
                <span>الصورة الرمزية والمعرض الافتراضي</span>
              </span>
              <span className="text-[10px] text-slate-400">اختر صورة تعبر عنك</span>
            </div>

            {/* Live Preview Box */}
            <div className="flex items-center gap-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
              <UserAvatar
                avatarUrl={avatar}
                gender={gender}
                role={currentUser.role}
                username={username || currentUser.username}
                size="lg"
                showRankBadge
                className="shadow-xl"
              />

              <div className="flex-1 space-y-1">
                <p className="text-xs font-bold text-slate-200">معاينة الصورة الرمزية الحالية</p>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  انقر على أي صورة من المعرض أدناه لاختيارها فوراً، أو قم برفع صورتك الخاصة.
                </p>

                {avatar && (
                  <button
                    type="button"
                    onClick={() => setAvatar('')}
                    className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer flex items-center gap-1 mt-1"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>إزالة الصورة والعودة للافتراضي</span>
                  </button>
                )}
              </div>
            </div>

            {/* Avatar Gallery Categories Bar */}
            <div className="flex items-center gap-1 bg-slate-900 p-1.5 rounded-xl text-xs font-bold overflow-x-auto custom-scrollbar">
              {[
                { id: 'men', label: 'رجال 👨🏽' },
                { id: 'women', label: 'نساء 👩🏽' },
                { id: 'royal', label: 'فخامة 👑' },
                { id: 'cute', label: 'أليفة 🐾' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setAvatarCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-lg shrink-0 cursor-pointer transition-all ${
                    avatarCategory === cat.id
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Avatars Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto p-1 custom-scrollbar">
              {filteredAvatars.map((a) => {
                const isSelected = avatar === a.url;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setAvatar(a.url)}
                    className={`group relative rounded-2xl overflow-hidden border-2 transition-all cursor-pointer aspect-square bg-slate-900 flex flex-col items-center justify-center ${
                      isSelected
                        ? 'border-amber-400 ring-2 ring-amber-500/50 scale-105 shadow-lg'
                        : 'border-slate-800 hover:border-amber-500/50 hover:scale-100'
                    }`}
                    title={a.title}
                  >
                    {a.url && a.url.trim() !== '' && (
                      <img
                        src={a.url}
                        alt={a.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-amber-500/30 flex items-center justify-center">
                        <span className="bg-amber-500 text-slate-950 p-1 rounded-full text-xs font-black shadow-md">
                          ✓
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Custom File Upload & URL Input Controls */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
              <label className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 py-2 px-3 rounded-xl font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-[11px]">
                <Upload className="w-3.5 h-3.5 text-amber-400" />
                <span>رفع صورة من جهازك 📁</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 py-2 px-3 rounded-xl font-bold text-slate-300 flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
              >
                <Link className="w-3.5 h-3.5 text-blue-400" />
                <span>رابط مباشر</span>
              </button>
            </div>

            {showUrlInput && (
              <div className="flex items-center gap-2 animate-in fade-in duration-150 pt-1">
                <input
                  type="url"
                  placeholder="ضع رابط الصورة المباشر هنا (https://...)"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customAvatarUrl.trim()) {
                      setAvatar(customAvatarUrl.trim());
                      setCustomAvatarUrl('');
                      setShowUrlInput(false);
                    }
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  تطبيق
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Wall Cover Photo (صورة الحائط / الغلاف) */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-black text-teal-400 flex items-center gap-1.5">
                <Image className="w-4 h-4" />
                <span>صورة الحائط والغلاف (Wall Cover)</span>
              </span>
              <span className="text-[10px] text-slate-400">تدعم الصور الثابتة والمتحركة GIF</span>
            </div>

            {/* Wall Cover Preview Box */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 h-28 flex items-center justify-center">
              {wallCover && wallCover.trim() !== '' ? (
                <img
                  src={wallCover}
                  alt="معاينة الغلاف"
                  className="w-full h-full object-cover brightness-90"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="text-slate-500 text-xs font-bold flex flex-col items-center gap-1">
                  <span>🌄 لا توجد صورة حائط مخصصة</span>
                  <span className="text-[10px] text-slate-600">سيتم استخدام الخلفية الافتراضية للدردشة</span>
                </div>
              )}

              {wallCover && (
                <button
                  type="button"
                  onClick={() => setWallCover('')}
                  className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>إزالة الغلاف</span>
                </button>
              )}
            </div>

            {/* Wall Cover Controls */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <label className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-teal-500/50 py-2 px-3 rounded-xl font-bold text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors text-[11px]">
                <Upload className="w-3.5 h-3.5 text-teal-400" />
                <span>رفع غلاف من جهازك (صورة أو GIF) 🌄</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleWallFileUpload}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={() => setShowWallUrlInput(!showWallUrlInput)}
                className="bg-slate-900 hover:bg-slate-800 border border-slate-700 py-2 px-3 rounded-xl font-bold text-slate-300 flex items-center gap-1 cursor-pointer transition-colors text-[11px]"
              >
                <Link className="w-3.5 h-3.5 text-teal-400" />
                <span>رابط غلاف مباشر</span>
              </button>
            </div>

            {showWallUrlInput && (
              <div className="flex items-center gap-2 animate-in fade-in duration-150 pt-1">
                <input
                  type="url"
                  placeholder="ضع رابط صورة الغلاف أو GIF (https://...)"
                  value={customWallUrl}
                  onChange={(e) => setCustomWallUrl(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-teal-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customWallUrl.trim()) {
                      setWallCover(customWallUrl.trim());
                      setCustomWallUrl('');
                      setShowWallUrlInput(false);
                    }
                  }}
                  className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs cursor-pointer"
                >
                  تطبيق
                </button>
              </div>
            )}
          </div>

          {/* Section 3: Personal Profile Info Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name (اسم العرض) */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>اسم العرض المستعار (Display Name):</span>
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="أدخل اسمك الجديد هنا..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-bold focus:outline-none transition-colors"
              />
            </div>

            {/* Custom Name Color & Neon Colors & Font Size */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800/90 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <label className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Palette className="w-4 h-4 text-amber-400" />
                  <span>تغيير لون اسم العرض وألوان نيون ⚡</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">مخصص:</span>
                  <input
                    type="color"
                    value={usernameColor}
                    onChange={(e) => setUsernameColor(e.target.value)}
                    className="w-8 h-7 rounded-lg bg-slate-900 border border-slate-700 cursor-pointer"
                    title="اختر لوناً مخصصاً"
                  />
                </div>
              </div>

              {/* Neon Colors Buttons Swatches */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-extrabold text-slate-300 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>تغيير لون الاسم - ألوان نيون (Neon Glow):</span>
                </span>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
                  {NEON_COLORS.map((neon) => {
                    const isSelected = usernameColor.toLowerCase() === neon.value.toLowerCase();
                    return (
                      <button
                        key={neon.value}
                        type="button"
                        onClick={() => setUsernameColor(neon.value)}
                        className={`h-8 rounded-xl flex items-center justify-center transition-all cursor-pointer relative border ${
                          isSelected
                            ? 'ring-2 ring-white scale-110 border-white shadow-lg z-10'
                            : 'border-slate-800 hover:scale-105 opacity-85 hover:opacity-100'
                        }`}
                        style={{
                          backgroundColor: neon.value,
                          boxShadow: `0 0 10px ${neon.value}80`
                        }}
                        title={neon.name}
                      >
                        {isSelected && <span className="text-slate-950 font-black text-xs">✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Username Font Size Buttons */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                    <span>📏</span>
                    <span>زر حجم الاسم (Username Size):</span>
                  </span>
                  <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
                    {usernameFontSize}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1.5">
                  {USERNAME_FONT_SIZES.map((size) => {
                    const isSelected = usernameFontSize === size.value;
                    return (
                      <button
                        key={size.value}
                        type="button"
                        onClick={() => setUsernameFontSize(size.value)}
                        className={`py-1.5 px-1 rounded-xl font-bold text-[11px] transition-all cursor-pointer border text-center ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md scale-105'
                            : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        {size.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name Preview Box with Neon Glow */}
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-bold">معاينة شكل وحجم الاسم:</span>
                <span
                  style={{
                    color: usernameColor,
                    fontSize: usernameFontSize,
                    textShadow: NEON_COLORS.some(n => n.value.toLowerCase() === usernameColor.toLowerCase())
                      ? `0 0 8px ${usernameColor}, 0 0 2px #000`
                      : 'none',
                    fontWeight: 900
                  }}
                  className="tracking-wide truncate max-w-[220px]"
                >
                  {username || 'اسم العرض'}
                </span>
              </div>
            </div>

            {/* Short Status Message (رسالة الحالة) */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>رسالة الحالة القصيرة (Status):</span>
              </label>
              <input
                type="text"
                value={statusMessage}
                onChange={(e) => setStatusMessage(e.target.value)}
                placeholder="مثال: يسعد أوقاتكم بكل خير في شات اليمن... 🌸"
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none transition-colors"
              />
            </div>

            {/* Bio (النبذة التعريفية) */}
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1 flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                <span>النبذة التعريفية (Bio):</span>
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                placeholder="اكتب نبذة عن نفسك أو هواياتك هنا..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl p-3 text-xs text-slate-100 focus:outline-none transition-colors resize-none"
              />
            </div>

            {/* Age & Gender Selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">العمر</label>
                <select
                  value={age}
                  onChange={(e) => setAge(e.target.value === 'عدم الإظهار' ? 'عدم الإظهار' : Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-bold focus:outline-none"
                >
                  <option value="عدم الإظهار">عدم الإظهار</option>
                  {ageOptions.map((a) => (
                    <option key={a} value={a}>{a} سنة</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الجنس</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-100 font-bold focus:outline-none"
                >
                  <option value="male">ذكر ♂</option>
                  <option value="female">أنثى ♀</option>
                  <option value="other">آخر ⚥</option>
                </select>
              </div>
            </div>

            {/* Hide Country Flag Option */}
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-2xl border border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-slate-200 block">إخفاء علم الدولة من البطاقة الشخصية</span>
                <span className="text-[10px] text-slate-400 block">عند التفعيل، لن يظهر علم بلدك في الكرت السريع</span>
              </div>
              <input
                type="checkbox"
                checked={hideCountry}
                onChange={(e) => setHideCountry(e.target.checked)}
                className="w-5 h-5 rounded text-amber-500 bg-slate-900 border-slate-700 focus:ring-amber-500 cursor-pointer"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                className="flex-1 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black py-3 rounded-2xl text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>حفظ التعديلات في الملف الشخصي</span>
              </button>

              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-3 px-5 rounded-2xl text-xs transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
