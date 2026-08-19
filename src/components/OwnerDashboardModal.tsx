import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { UserRole } from '../types';
import { playChatSound } from '../utils/audio';
import {
  Crown, BarChart2, Users, Home, Flag, Ban, FileText,
  Newspaper, ShoppingBag, Settings, Shield, Bell, Save,
  X, Check, LogOut, Menu, Edit2, Trash2, Plus, Sparkles,
  Lock, Unlock, RefreshCw, ChevronLeft, Globe, Palette,
  MessageSquare, CreditCard, Mail, Image, Volume2, Bot, ShieldCheck,
  Search, ExternalLink, Zap, AlertTriangle
} from 'lucide-react';

export const OwnerDashboardModal: React.FC = () => {
  const {
    setIsOwnerDashboardOpen,
    currentUser,
    users,
    rooms,
    reports,
    addRoom,
    deleteRoom,
    updateRoomDetails,
    updateUserRole,
    ownerUpdateUser,
    banUser,
    unbanUser,
    news,
    addNewsPost,
    deleteNewsPost,
    storeItems,
    roomActivityLogs,
    siteSettings,
    updateSiteSettings,
    customBadWords,
    addCustomBadWord,
    removeCustomBadWord,
    broadcastAudioAlert,
    purgeSystemCache,
    toggleAdminStealth,
    deleteUserAccount,
    logout,
    requestBlockConfirm
  } = useChat();

  const [activeWindow, setActiveWindow] = useState<
    'stats' | 'members' | 'rooms' | 'reports' | 'bans' | 'logs' | 'news' | 'store' | 'settings' | 'security' | 'system' | 'broadcast' | 'server' | null
  >(null);

  const [newBadWord, setNewBadWord] = useState('');

  // Audio broadcast states
  const [broadcastTitle, setBroadcastTitle] = useState('تنبيه إداري عام 📢');
  const [broadcastMessage, setBroadcastMessage] = useState('يرجى من جميع الأعضاء والزوار الالتزام بقوانين الدردشة العامة والاحترام المتبادل.');
  const [broadcastSound, setBroadcastSound] = useState('general_broadcast');

  // Mobile drawer collapse state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Success Toast Banner
  const [savedSuccessMsg, setSavedSuccessMsg] = useState<string | null>(null);

  // --- SITE SETTINGS FORM LOCAL STATE ---
  const [formSettings, setFormSettings] = useState({ ...siteSettings });

  // --- ROOM CREATION STATE ---
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomPass, setNewRoomPass] = useState('');

  // --- NEWS POST CREATION STATE ---
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');

  // --- USER SEARCH & FILTER STATE ---
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Guard: Must be logged in & Owner or Staff
  if (!currentUser) return null;

  const handleSaveSiteSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSiteSettings(formSettings);
    setSavedSuccessMsg('تم حفظ الإعدادات بنجاح! 💾✨');
    setTimeout(() => {
      setSavedSuccessMsg(null);
    }, 4000);
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    addRoom({
      name: newRoomName.trim(),
      description: newRoomDesc.trim(),
      password: newRoomPass.trim() || undefined,
      isLocked: !!newRoomPass.trim()
    });
    setNewRoomName('');
    setNewRoomDesc('');
    setNewRoomPass('');
    setSavedSuccessMsg('تم إنشاء الغرفة بنجاح 🏠');
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  const handleCreateNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) return;
    addNewsPost(newsTitle.trim(), newsContent.trim());
    setNewsTitle('');
    setNewsContent('');
    setSavedSuccessMsg('تم نشر الخبر بنجاح 📰');
    setTimeout(() => setSavedSuccessMsg(null), 3000);
  };

  const filteredUsers = users.filter(u => {
    const matchesName = u.username.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesName && matchesRole;
  });

  const bannedUsers = users.filter(u => u.isBanned);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 dir-rtl select-none">
      {activeWindow === null ? (
        /* ========================================================= */
        /* BUTTON GRID HUB (WHEN NO SUB-WINDOW IS OPEN) */
        /* ========================================================= */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-100 animate-in zoom-in-95 duration-150">
          
          {/* Top Header */}
          <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                <Crown className="w-7 h-7 text-slate-950 fill-slate-950" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-amber-400 flex items-center gap-1.5">
                  <span>لوحة تحكم المالك</span>
                  <span>👑</span>
                </h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5">
                  {formSettings.siteName || 'شات اليمن المطور'} • انقر على أي زر أدناه لفتح النافذة الخاصة به
                </p>
              </div>
            </div>

            {/* EXIT / CLOSE BUTTON FOR ENTIRE DASHBOARD (TOP RIGHT) */}
            <button
              onClick={() => setIsOwnerDashboardOpen(false)}
              className="p-2.5 rounded-2xl bg-slate-800 hover:bg-rose-950/80 border border-slate-700 hover:border-rose-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center gap-2 group shadow-md"
              title="إغلاق لوحة المالك (X)"
            >
              <span className="text-xs font-black hidden sm:inline group-hover:text-rose-300">إغلاق اللوحة</span>
              <X className="w-5 h-5 text-rose-400" />
            </button>
          </div>

          {/* SUCCESS BANNER TOAST */}
          {savedSuccessMsg && (
            <div className="bg-emerald-500 text-slate-950 font-black text-xs px-5 py-2.5 text-center flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

          {/* BUTTONS GRID */}
          <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. ⚙️ إعدادات الموقع */}
            <button
              onClick={() => setActiveWindow('settings')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-amber-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-amber-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center shadow-md text-slate-950 font-black">
                  <Settings className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                  فتح النافذة ⚙️
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-amber-400 transition-colors">
                  ⚙️ إعدادات الموقع
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  الاسم، الشعار، الألوان، البانوراما، بوابات الدفع، وإعدادات الدردشة
                </p>
              </div>
            </button>

            {/* 2. 📊 الإحصائيات */}
            <button
              onClick={() => setActiveWindow('stats')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-blue-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black">
                  <BarChart2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-colors">
                  فتح النافذة 📊
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition-colors">
                  📊 الإحصائيات المباشرة
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  عدد الأعضاء المتصلين، الغرف، الرسائل، والتفاعل اليومي
                </p>
              </div>
            </button>

            {/* 3. 👥 إدارة الأعضاء */}
            <button
              onClick={() => setActiveWindow('members')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md text-slate-950 font-black">
                  <Users className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  {users.length} عضو 👥
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">
                  👥 إدارة الأعضاء والترقيات
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  تعديل الرتب، تغيير الألوان، زيادة العملات، والحظر
                </p>
              </div>
            </button>

            {/* 4. 🏠 إدارة الغرف */}
            <button
              onClick={() => setActiveWindow('rooms')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center shadow-md text-white font-black">
                  <Home className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  {rooms.length} غرفة 🏠
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-purple-400 transition-colors">
                  🏠 إدارة وإنشاء الغرف
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  إضافة غرفة جديدة، كلمة السر، تحديد الشروط والحذف
                </p>
              </div>
            </button>

            {/* 5. 🚩 البلاغات والشكاوى */}
            <button
              onClick={() => setActiveWindow('reports')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-rose-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-rose-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-rose-500 to-red-600 flex items-center justify-center shadow-md text-white font-black">
                  <Flag className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 group-hover:bg-rose-500 group-hover:text-white transition-colors">
                  {reports.filter(r => r.status === 'pending').length} بلاغ نشط 🚩
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-rose-400 transition-colors">
                  🚩 مركز البلاغات والشكاوى
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  مراجعة بلاغات المستخدمين لاتخاذ الإجراءات التأديبية
                </p>
              </div>
            </button>

            {/* 6. 🚫 قائمة المحظورين */}
            <button
              onClick={() => setActiveWindow('bans')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-red-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-red-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-red-600 to-rose-700 flex items-center justify-center shadow-md text-white font-black">
                  <Ban className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 group-hover:bg-red-500 group-hover:text-white transition-colors">
                  {bannedUsers.length} محظور 🚫
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-red-400 transition-colors">
                  🚫 سجل قائمة الحظر
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  معاينة الحسابات المحظورة وإمكانية إلغاء الحظر بضغطة زر
                </p>
              </div>
            </button>

            {/* 7. 📜 سجل نشاط النظام */}
            <button
              onClick={() => setActiveWindow('logs')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md text-slate-950 font-black">
                  <FileText className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                  {roomActivityLogs.length} سجل 📜
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">
                  📜 سجل نشاط المشرفين
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  متابعة التحركات والتنقلات والإجراءات المتخذة في النظام
                </p>
              </div>
            </button>

            {/* 8. 📰 الأخبار واللوحة */}
            <button
              onClick={() => setActiveWindow('news')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-sky-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-sky-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center shadow-md text-white font-black">
                  <Newspaper className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                  {news.length} خبر 📰
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-sky-400 transition-colors">
                  📰 الأخبار والمنشورات
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  إضافة وإدارة أخبار المالك والإعلانات المنشورة للأعضاء
                </p>
              </div>
            </button>

            {/* 9. 🛒 المتجر والأسعار */}
            <button
              onClick={() => setActiveWindow('store')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-yellow-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-yellow-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-yellow-500 to-amber-600 flex items-center justify-center shadow-md text-slate-950 font-black">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 group-hover:bg-yellow-500 group-hover:text-slate-950 transition-colors">
                  {storeItems.length} عنصر 🛒
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-yellow-400 transition-colors">
                  🛒 المتجر والأسعار والرتب
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  عرض منتجات المتجر، شارات الذهبي، وتكلفة الشراء
                </p>
              </div>
            </button>

            {/* 10. 🛡️ الأمان والحماية */}
            <button
              onClick={() => setActiveWindow('security')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-md text-white font-black">
                  <Shield className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                  مميّز 🛡️
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-indigo-400 transition-colors">
                  🛡️ الأمان وحماية النظام
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  حالة السيرفر والتأمين من السب والتجميد وضبط الجدار الناري
                </p>
              </div>
            </button>

            {/* 11. 🤖 نظام System ومكافحة الفيضانات */}
            <button
              onClick={() => setActiveWindow('system')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-cyan-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-600 flex items-center justify-center shadow-md text-slate-950 font-black">
                  <Bot className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-slate-950 transition-colors">
                  محرر الفيضانات 🛡️
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-cyan-400 transition-colors">
                  🤖 محرر مكافحة الفيضانات والفلترة
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  بناء قواعد Anti-Flood، التحكم بسرعة الرسائل، والعقوبات التلقائية
                </p>
              </div>
            </button>

            {/* 12. 📢 الإشعار الصوتي والبث العام */}
            <button
              onClick={() => setActiveWindow('broadcast')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-pink-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-pink-500/10 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-pink-500 to-rose-600 flex items-center justify-center shadow-md text-white font-black">
                  <Volume2 className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20 group-hover:bg-pink-500 group-hover:text-white transition-colors">
                  بث فوري 📢
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-pink-400 transition-colors">
                  📢 الإشعار والتنبيه الصوتي العام
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  بث نغمة صوتية جماعية ورسالة منبثقة عاجلة لكافة المتواجدين في الموقع
                </p>
              </div>
            </button>

            {/* 13. ⚡ تحسين وخفة السيرفر وتحديث النظام */}
            <button
              onClick={() => setActiveWindow('server')}
              className="group relative p-5 rounded-2xl bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/50 transition-all cursor-pointer text-right flex flex-col justify-between h-40 shadow-lg hover:shadow-emerald-500/10 hover:-translate-y-1 sm:col-span-2 lg:col-span-1"
            >
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center shadow-md text-slate-950 font-black">
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
                  تحسين ⚡
                </span>
              </div>
              <div>
                <h3 className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors">
                  ⚡ تحسين وخفة السيرفر وتفريغ الكاش
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-1 line-clamp-2">
                  تقليل حمولة السيرفر، تسريع استجابة الدردشة وتحديث النظام بضغطة زر
                </p>
              </div>
            </button>

          </div>

          {/* Footer with Stealth Mode Toggle */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-300">
                متصل كمالك: <strong className="text-amber-400">{currentUser.username} 👑</strong>
              </span>

              {/* Stealth Mode Indicator & Toggle */}
              <button
                type="button"
                onClick={toggleAdminStealth}
                className={`px-3 py-1 rounded-xl text-xs font-black border transition-all flex items-center gap-1.5 cursor-pointer ${
                  currentUser.isStealth
                    ? 'bg-purple-950/80 border-purple-500 text-purple-300 shadow-md shadow-purple-900/30'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                }`}
              >
                <span>{currentUser.isStealth ? '🕵️‍♂️ وضع الاختفاء: مفعل' : '👁️ وضع الاختفاء: معطل'}</span>
              </button>
            </div>
            <button
              onClick={() => setIsOwnerDashboardOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/80 border border-slate-700 text-slate-200 hover:text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>خروج</span>
              <X className="w-4 h-4 text-rose-400" />
            </button>
          </div>

        </div>
      ) : (
        /* OPENED SUB-WINDOW MODAL CONTAINER */
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[92vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-100 animate-in zoom-in-95 duration-200">
          <div className="hidden">
            {/* Top Header with Crown 👑 */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-500 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
                  <Crown className="w-6 h-6 text-slate-950 fill-slate-950" />
                </div>
                {isSidebarOpen && (
                  <div className="leading-tight truncate">
                    <h2 className="text-sm font-black text-amber-400 flex items-center gap-1">
                      <span>لوحة المالك</span>
                      <span className="text-xs">👑</span>
                    </h2>
                    <p className="text-[11px] text-slate-400 font-bold truncate">
                      {formSettings.siteName || 'شات اليمن المطور'}
                    </p>
                  </div>
                )}
              </div>

              {/* Sidebar Collapse Toggle ☰ */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-1.5 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                title="القائمة"
              >
                <Menu className="w-4 h-4" />
              </button>
            </div>

            {/* Owner Credit Banner */}
            {isSidebarOpen && (
              <div className="m-3 p-3 bg-gradient-to-r from-amber-950/60 via-amber-900/40 to-slate-900 border border-amber-500/30 rounded-2xl">
                <span className="text-[10px] font-bold text-amber-400/80 block">رصيدك كمالك</span>
                <span className="text-base font-black text-amber-300 tracking-wide flex items-center gap-1">
                  <span>∞</span>
                  <span className="text-xs font-bold text-amber-200/90">غير محدود</span>
                </span>
              </div>
            )}

            {/* Navigation Menu Groups */}
            <nav className="hidden" />
          </div>

          {/* Bottom Footer User Info & Logout */}
          <div className="p-3 border-t border-slate-800 bg-slate-950">
            <div className="flex items-center justify-between">
              {isSidebarOpen ? (
                <div className="flex items-center gap-2.5 overflow-hidden">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-sm shrink-0">
                    م
                  </div>
                  <div className="leading-tight truncate">
                    <span className="text-xs font-black text-white block truncate">
                      {currentUser.username}
                    </span>
                    <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
                      <span>👑 أعلى الصلاحيات</span>
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-black text-amber-400 text-sm mx-auto">
                  👑
                </div>
              )}

              {isSidebarOpen && (
                <button
                  onClick={() => setIsOwnerDashboardOpen(false)}
                  className="p-2 rounded-xl bg-rose-950/60 hover:bg-rose-900 border border-rose-800/80 text-rose-300 hover:text-white transition-all cursor-pointer shrink-0"
                  title="إغلاق والعودة"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

        <main className="flex-1 flex flex-col min-w-0 bg-slate-900 overflow-hidden">
          
          {/* TOP HEADER BAR WITH BREADCRUMB, SAVE ACTION & TOP-RIGHT X EXIT BUTTON */}
          <header className="px-5 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0 relative">
            
            {/* Title & Return to All Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveWindow(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 transition-colors cursor-pointer flex items-center gap-1 text-xs font-bold shadow-sm"
                title="العودة لأزرار اللوحة"
              >
                <ChevronLeft className="w-4 h-4 rotate-180" />
                <span>جميع الأزرار</span>
              </button>

              <div className="h-6 w-[1px] bg-slate-800" />

              <div>
                <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                  <span>لوحة المالك</span>
                  <span>←</span>
                  <span className="text-amber-400 font-extrabold">
                    {activeWindow === 'settings' && 'إعدادات الموقع'}
                    {activeWindow === 'stats' && 'الإحصائيات المباشرة'}
                    {activeWindow === 'members' && 'إدارة الأعضاء'}
                    {activeWindow === 'rooms' && 'إدارة الغرف'}
                    {activeWindow === 'reports' && 'البلاغات والشكاوى'}
                    {activeWindow === 'bans' && 'قائمة المحظورين'}
                    {activeWindow === 'logs' && 'سجل نشاط النظام'}
                    {activeWindow === 'news' && 'الأخبار والمنشورات'}
                    {activeWindow === 'store' && 'المتجر والأسعار'}
                    {activeWindow === 'security' && 'الأمان والتراخيص'}
                    {activeWindow === 'system' && 'إعدادات System والفلترة'}
                    {activeWindow === 'broadcast' && 'الإشعار الصوتي والبث العام'}
                    {activeWindow === 'server' && 'تحسين وخفة السيرفر وتفريغ الكاش'}
                  </span>
                </div>
                <h1 className="text-sm sm:text-base font-black text-white flex items-center gap-2 mt-0.5">
                  {activeWindow === 'settings' && <><span>⚙️</span><span>نافذة إعدادات الموقع الشاملة</span></>}
                  {activeWindow === 'stats' && <><span>📊</span><span>نافذة الإحصائيات المباشرة</span></>}
                  {activeWindow === 'members' && <><span>👥</span><span>نافذة إدارة الأعضاء والترقيات</span></>}
                  {activeWindow === 'rooms' && <><span>🏠</span><span>نافذة إدارة وإنشاء الغرف</span></>}
                  {activeWindow === 'reports' && <><span>🚩</span><span>نافذة مركز البلاغات</span></>}
                  {activeWindow === 'bans' && <><span>🚫</span><span>نافذة سجل المحظورين</span></>}
                  {activeWindow === 'logs' && <><span>📜</span><span>نافذة سجل نشاط النظام</span></>}
                  {activeWindow === 'news' && <><span>📰</span><span>نافذة الأخبار والإعلانات</span></>}
                  {activeWindow === 'store' && <><span>🛒</span><span>نافذة أسعار المتجر والرتب</span></>}
                  {activeWindow === 'security' && <><span>🛡️</span><span>نافذة الأمان وحماية النظام</span></>}
                  {activeWindow === 'system' && <><span>🤖</span><span>محرر بناء نظام مكافحة الفيضانات والسبام (Anti-Flood Builder)</span></>}
                  {activeWindow === 'broadcast' && <><span>📢</span><span>بث الإشعارات الصوتية العامة الفورية لجميع المتواجدين</span></>}
                  {activeWindow === 'server' && <><span>⚡</span><span>تحسين السيرفر وتفريغ الكاش وتحديث النظام</span></>}
                </h1>
              </div>
            </div>

            {/* TOP RIGHT ACTIONS: SAVE & CRITICAL USER REQUIREMENT X EXIT BUTTON */}
            <div className="flex items-center gap-3">
              {/* SAVE BUTTON FOR SETTINGS 💾 */}
              {activeWindow === 'settings' && (
                <button
                  type="button"
                  onClick={() => handleSaveSiteSettings()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ 💾</span>
                </button>
              )}

              {/* TOP RIGHT X BUTTON TO EXIT WINDOW BACK TO BUTTONS HUB */}
              <button
                onClick={() => setActiveWindow(null)}
                className="w-10 h-10 rounded-full bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md group shrink-0"
                title="إغلاق النافذة والعودة للأزرار (X)"
              >
                <X className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </header>

          {/* SUCCESS BANNER TOAST */}
          {savedSuccessMsg && (
            <div className="bg-emerald-500 text-slate-950 font-black text-xs px-5 py-2.5 text-center flex items-center justify-center gap-2 animate-in slide-in-from-top duration-200">
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{savedSuccessMsg}</span>
            </div>
          )}

          {/* SCROLLABLE VIEW PORT */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
            
            {/* ========================================================= */}
            {/* TAB: ⚙️ إعدادات الموقع (SITE SETTINGS) */}
            {/* ========================================================= */}
            {activeWindow === 'settings' && (
              <form onSubmit={handleSaveSiteSettings} className="space-y-6 max-w-5xl mx-auto">
                
                {/* 1. 🌐 إعدادات عامة */}
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Globe className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black text-white">🌐 إعدادات عامة</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        اسم الموقع <span className="text-slate-500 text-[10px]">(يظهر في الشريط العلوي)</span>
                      </label>
                      <input
                        type="text"
                        value={formSettings.siteName}
                        onChange={e => setFormSettings({ ...formSettings, siteName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                        placeholder="شات اليمن المطور"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        شعار الموقع <span className="text-slate-500 text-[10px]">(رمز تعبيري)</span>
                      </label>
                      <input
                        type="text"
                        value={formSettings.siteLogoEmoji}
                        onChange={e => setFormSettings({ ...formSettings, siteLogoEmoji: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                        placeholder="🇾🇪"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">المنطقة الزمنية</label>
                      <select
                        value={formSettings.timeZone}
                        onChange={e => setFormSettings({ ...formSettings, timeZone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                      >
                        <option value="Asia/Aden">Asia/Aden (صنعاء / عدن)</option>
                        <option value="Asia/Riyadh">Asia/Riyadh (الرياض)</option>
                        <option value="Africa/Cairo">Africa/Cairo (القاهرة)</option>
                        <option value="UTC">UTC (عالمي)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">اللغة الافتراضية</label>
                      <select
                        value={formSettings.defaultLanguage}
                        onChange={e => setFormSettings({ ...formSettings, defaultLanguage: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                      >
                        <option value="العربية 🇸🇦">العربية 🇸🇦</option>
                        <option value="English 🇺🇸">English 🇺🇸</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* 2. 🎨 المظهر والثيم */}
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Palette className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black text-white">🎨 المظهر والثيم</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        الثيم الافتراضي <span className="text-slate-500 text-[10px]">(يُطبَّق على الأعضاء الجدد)</span>
                      </label>
                      <select
                        value={formSettings.defaultTheme}
                        onChange={e => setFormSettings({ ...formSettings, defaultTheme: e.target.value as 'dark' | 'light' })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none cursor-pointer"
                      >
                        <option value="dark">Dark (داكن فاخر)</option>
                        <option value="light">Light (فاتح أنيق)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">اللون الرئيسي للموقع</label>
                      <div className="flex items-center gap-2 mt-1">
                        {['#0b333e', '#f59e0b', '#3b82f6', '#10b981', '#ec4899'].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setFormSettings({ ...formSettings, primaryColor: c })}
                            className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                              formSettings.primaryColor === c ? 'border-white scale-110 shadow-md' : 'border-transparent'
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="sm:col-span-2 space-y-2">
                      <label className="block text-xs font-bold text-slate-300">
                        صورة البانوراما الترحيبية <span className="text-slate-500 text-[10px]">(تظهر في الصفحة الرئيسية)</span>
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="h-16 w-36 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 relative">
                          <img
                            src={formSettings.welcomePanoramaUrl || "https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&w=800&q=80"}
                            alt="Panorama"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const url = prompt('أدخل رابط صورة البانوراما الجديدة:', formSettings.welcomePanoramaUrl);
                            if (url) setFormSettings({ ...formSettings, welcomePanoramaUrl: url });
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                        >
                          <span>🖼️ تغيير</span>
                        </button>
                      </div>
                    </div>

                    <div className="sm:col-span-2 flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">بانوراما ثلاثية (دوّارة)</span>
                        <span className="text-[10px] text-slate-400 font-medium block">تفعيل التبديل التلقائي لصور البانوراما الترحيبية</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.panoramaCarouselEnabled}
                        onChange={e => setFormSettings({ ...formSettings, panoramaCarouselEnabled: e.target.checked })}
                        className="w-5 h-5 accent-amber-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </section>

                {/* 3. 💬 إعدادات الدردشة */}
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <MessageSquare className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black text-white">💬 إعدادات الدردشة</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">السماح للزوار بالكتابة</span>
                        <span className="text-[10px] text-slate-400 font-medium block">تمكين أو تعطيل إرسال الرسائل للزوار</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.allowGuestChat}
                        onChange={e => setFormSettings({ ...formSettings, allowGuestChat: e.target.checked })}
                        className="w-5 h-5 accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">السماح للزوار بالتسجيل الصوتي</span>
                        <span className="text-[10px] text-slate-400 font-medium block">تمكين تسجيل المقاطع الصوتية للزوار</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.allowGuestVoice}
                        onChange={e => setFormSettings({ ...formSettings, allowGuestVoice: e.target.checked })}
                        className="w-5 h-5 accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          حد الرسائل في الدقيقة <span className="text-slate-500 text-[10px]">(مكافحة السبام)</span>
                        </label>
                        <input
                          type="number"
                          value={formSettings.maxMessagesPerMinute}
                          onChange={e => setFormSettings({ ...formSettings, maxMessagesPerMinute: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-300 mb-1">
                          حد طول الرسالة <span className="text-slate-500 text-[10px]">(بالأحرف)</span>
                        </label>
                        <input
                          type="number"
                          value={formSettings.maxMessageLength}
                          onChange={e => setFormSettings({ ...formSettings, maxMessageLength: Number(e.target.value) })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-emerald-400" />
                        <div>
                          <span className="text-xs font-bold text-white block">نظام الكتم/الطرد الآلي</span>
                          <span className="text-[10px] text-slate-400 font-medium block">ربوت تلقائي ضد السب والشتم والكلمات البذيئة</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.autoBotAntiSpam}
                        onChange={e => setFormSettings({ ...formSettings, autoBotAntiSpam: e.target.checked })}
                        className="w-5 h-5 accent-emerald-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </section>

                {/* 4. 💳 بوابات الدفع */}
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black text-white">💳 بوابات الدفع</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">كريمي - Yemen</span>
                        <span className="text-[10px] text-slate-400 font-medium block">محفظة إلكترونية محلية</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.paymentKuraimi}
                        onChange={e => setFormSettings({ ...formSettings, paymentKuraimi: e.target.checked })}
                        className="w-5 h-5 accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">USDT (TRC20)</span>
                        <span className="text-[10px] text-slate-400 font-medium block">عملات رقمية مشفرة</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.paymentUsdt}
                        onChange={e => setFormSettings({ ...formSettings, paymentUsdt: e.target.checked })}
                        className="w-5 h-5 accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">Payeer</span>
                        <span className="text-[10px] text-slate-400 font-medium block">بنك إلكتروني عالمي</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.paymentPayeer}
                        onChange={e => setFormSettings({ ...formSettings, paymentPayeer: e.target.checked })}
                        className="w-5 h-5 accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">موني جرام</span>
                        <span className="text-[10px] text-slate-400 font-medium block">حوالات سريعة</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.paymentMoneygram}
                        onChange={e => setFormSettings({ ...formSettings, paymentMoneygram: e.target.checked })}
                        className="w-5 h-5 accent-amber-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </section>

                {/* 5. 📧 التواصل */}
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <Mail className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black text-white">📧 التواصل وحسابات الدعم</h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">البريد الإلكتروني للدعم</label>
                      <input
                        type="text"
                        value={formSettings.supportEmail}
                        onChange={e => setFormSettings({ ...formSettings, supportEmail: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">فيسبوك</label>
                      <input
                        type="text"
                        value={formSettings.facebookUrl}
                        onChange={e => setFormSettings({ ...formSettings, facebookUrl: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">تيليجرام</label>
                      <input
                        type="text"
                        value={formSettings.telegramUrl}
                        onChange={e => setFormSettings({ ...formSettings, telegramUrl: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">واتساب الدعم</label>
                      <input
                        type="text"
                        value={formSettings.whatsappNumber}
                        onChange={e => setFormSettings({ ...formSettings, whatsappNumber: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                  </div>
                </section>

                {/* 6. 📊 إحصائيات وإعلانات */}
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                    <BarChart2 className="w-5 h-5 text-amber-400" />
                    <h3 className="text-sm font-black text-white">📊 إحصائيات وإعلانات</h3>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">عرض "متصل الآن" للأعضاء</span>
                        <span className="text-[10px] text-slate-400 font-medium block">إظهار مؤشر الاتصال المباشر في قوائم الغرف</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.showOnlineCount}
                        onChange={e => setFormSettings({ ...formSettings, showOnlineCount: e.target.checked })}
                        className="w-5 h-5 accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">إظهار إعلانات طرف ثالث</span>
                        <span className="text-[10px] text-slate-400 font-medium block">تفعيل الشفرات الإعلانية المدفوعة</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.showThirdPartyAds}
                        onChange={e => setFormSettings({ ...formSettings, showThirdPartyAds: e.target.checked })}
                        className="w-5 h-5 accent-amber-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">إرسال إشعارات بريدية للأخبار والبلاغات</span>
                        <span className="text-[10px] text-slate-400 font-medium block">تنبيه المالك والمشرفين بالبريد عند تقديم بلاغ جديد</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.sendEmailNotifications}
                        onChange={e => setFormSettings({ ...formSettings, sendEmailNotifications: e.target.checked })}
                        className="w-5 h-5 accent-amber-400 cursor-pointer"
                      />
                    </div>
                  </div>
                </section>

                {/* BOTTOM SAVE BUTTON */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
                  >
                    <Save className="w-5 h-5" />
                    <span>حفظ جميع الإعدادات 💾</span>
                  </button>
                </div>
              </form>
            )}

            {/* ========================================================= */}
            {/* TAB: 📊 الإحصائيات (STATISTICS) */}
            {/* ========================================================= */}
            {activeWindow === 'stats' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
                    <span className="text-slate-400 text-xs font-bold block">إجمالي الأعضاء</span>
                    <span className="text-2xl font-black text-amber-400 mt-1 block">{users.length}</span>
                    <span className="text-[10px] text-emerald-400 font-bold mt-1 block">↑ +12% هذا الأسبوع</span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
                    <span className="text-slate-400 text-xs font-bold block">متصل الآن</span>
                    <span className="text-2xl font-black text-emerald-400 mt-1 block">
                      {users.filter(u => u.status === 'online').length}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold mt-1 block">تفاعل حي الآن</span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
                    <span className="text-slate-400 text-xs font-bold block">الغرف النشطة</span>
                    <span className="text-2xl font-black text-sky-400 mt-1 block">{rooms.length}</span>
                    <span className="text-[10px] text-slate-500 font-bold mt-1 block">غرف محادثة تضمنك</span>
                  </div>

                  <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-2xl">
                    <span className="text-slate-400 text-xs font-bold block">البلاغات المعلقة</span>
                    <span className="text-2xl font-black text-rose-400 mt-1 block">
                      {reports.filter(r => r.status === 'pending').length}
                    </span>
                    <span className="text-[10px] text-rose-400 font-bold mt-1 block">تستوجب المراجعة</span>
                  </div>
                </div>

                {/* System Server Health */}
                <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <span>⚡</span>
                    <span>حالة خادم شات اليمن المطور</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-300">استهلاك المعالج (CPU)</span>
                        <span className="text-emerald-400">18%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[18%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-300">الذاكرة العشوائية (RAM)</span>
                        <span className="text-amber-400">42%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[42%]" />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span className="text-slate-300">سرعة الاستجابة (Ping latency)</span>
                        <span className="text-sky-400">24ms</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500 w-[15%]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: 👥 إدارة الأعضاء (MEMBER MANAGEMENT) */}
            {/* ========================================================= */}
            {activeWindow === 'members' && (
              <div className="space-y-4 max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="بحث عن عضو..."
                      value={userSearch}
                      onChange={e => setUserSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pr-9 pl-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs font-bold text-slate-400 shrink-0">تصفية حسب الرتبة:</span>
                    <select
                      value={roleFilter}
                      onChange={e => setRoleFilter(e.target.value)}
                      className="bg-slate-900 border border-slate-700 text-xs font-bold text-white rounded-xl px-3 py-1.5 focus:outline-none cursor-pointer"
                    >
                      <option value="all">كل الرتب</option>
                      <option value="owner">المالك 👑</option>
                      <option value="admin">الأدمن 🛡️</option>
                      <option value="management">الإدارة 💼</option>
                      <option value="moderator">المشرف ⚡</option>
                      <option value="vip">VIP 🌟</option>
                      <option value="member">عضو 👤</option>
                      <option value="visitor">زائر 👁️</option>
                    </select>
                  </div>
                </div>

                {/* Users List */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl overflow-hidden">
                  <div className="divide-y divide-slate-800">
                    {filteredUsers.map(usr => (
                      <div key={usr.id} className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors">
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                          <img
                            src={usr.avatarUrl}
                            alt={usr.username}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-white" style={{ color: usr.usernameColor }}>
                                {usr.username}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-amber-300">
                                {usr.role}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                              ID: {usr.id} • الرصيد: {usr.coins || 0} ذهبة
                            </span>
                          </div>
                        </div>

                        {/* Actions for member */}
                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <select
                            value={usr.role}
                            onChange={e => updateUserRole(usr.id, e.target.value as UserRole)}
                            className="bg-slate-900 border border-slate-700 text-[11px] font-bold text-amber-300 rounded-lg px-2 py-1 focus:outline-none cursor-pointer"
                          >
                            <option value="owner">مالك 👑</option>
                            <option value="admin">أدمن 🛡️</option>
                            <option value="management">إدارة 💼</option>
                            <option value="moderator">مشرف ⚡</option>
                            <option value="vip">VIP 🌟</option>
                            <option value="member">عضو 👤</option>
                            <option value="visitor">زائر 👁️</option>
                          </select>

                          {usr.isBanned ? (
                            <button
                              onClick={() => {
                                requestBlockConfirm(usr, 'unban', () => {
                                  unbanUser(usr.id);
                                });
                              }}
                              className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              إلغاء الحظر
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                requestBlockConfirm(usr, 'ban', () => {
                                  banUser(usr.id, 'حظر إداري من لوحة المالك');
                                });
                              }}
                              className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-700 text-rose-300 rounded-lg text-[10px] font-bold cursor-pointer transition-colors"
                            >
                              حظر
                            </button>
                          )}

                          {usr.id !== currentUser.id && (
                            <button
                              onClick={() => {
                                if (window.confirm(`هل أنت متأكد من رغبتك في حذف حساب "${usr.username}" نهائياً من قاعدة البيانات؟`)) {
                                  deleteUserAccount(usr.id);
                                  setSavedSuccessMsg(`تم حذف حساب ${usr.username} بنجاح 🗑️`);
                                  setTimeout(() => setSavedSuccessMsg(null), 3000);
                                }
                              }}
                              className="p-1.5 bg-red-950/70 hover:bg-red-900 border border-red-800 text-red-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                              title="حذف الحساب نهائياً"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: 🏠 الغرف (ROOMS MANAGEMENT) */}
            {/* ========================================================= */}
            {activeWindow === 'rooms' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                {/* Create Room Form */}
                <form onSubmit={handleCreateRoom} className="bg-slate-950/60 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3">
                  <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    <span>إنشاء غرفة جديدة</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="اسم الغرفة..."
                      value={newRoomName}
                      onChange={e => setNewRoomName(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                    <input
                      type="text"
                      placeholder="الوصف..."
                      value={newRoomDesc}
                      onChange={e => setNewRoomDesc(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                    <input
                      type="password"
                      placeholder="كلمة المرور (اختياري)..."
                      value={newRoomPass}
                      onChange={e => setNewRoomPass(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                    >
                      إضافة الغرفة 🏠
                    </button>
                  </div>
                </form>

                {/* Rooms List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rooms.map(rm => (
                    <div key={rm.id} className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-amber-400" />
                          <span className="font-extrabold text-xs text-white">{rm.name}</span>
                          {rm.isLocked && <Lock className="w-3.5 h-3.5 text-rose-400" />}
                        </div>
                        <button
                          onClick={() => deleteRoom(rm.id)}
                          className="p-1.5 text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900 rounded-lg transition-colors cursor-pointer"
                          title="حذف الغرفة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-400 font-bold">{rm.description || 'بدون وصف'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: 🚩 البلاغات (REPORTS) */}
            {/* ========================================================= */}
            {activeWindow === 'reports' && (
              <div className="space-y-4 max-w-5xl mx-auto">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <h3 className="text-sm font-black text-white mb-3">مركز بلاغات الأعضاء ({reports.length})</h3>
                  {reports.length === 0 ? (
                    <p className="text-xs text-slate-400 font-bold text-center py-6">لا توجد بلاغات حالية 🎉</p>
                  ) : (
                    <div className="space-y-2">
                      {reports.map(rep => (
                        <div key={rep.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-rose-400 block">
                              بلاغ من: {rep.reporterName} ضد: {rep.reportedUserName}
                            </span>
                            <span className="text-[11px] text-slate-300 font-medium block mt-1">
                              السبب: {rep.reason}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {rep.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: 🚫 قائمة الحظر (BAN LIST) */}
            {/* ========================================================= */}
            {activeWindow === 'bans' && (
              <div className="space-y-4 max-w-5xl mx-auto">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <h3 className="text-sm font-black text-white mb-3">قائمة الأعضاء المحظورين ({bannedUsers.length})</h3>
                  {bannedUsers.length === 0 ? (
                    <p className="text-xs text-slate-400 font-bold text-center py-6">لا يوجد أعضاء محظورون حالياً</p>
                  ) : (
                    <div className="space-y-2">
                      {bannedUsers.map(b => (
                        <div key={b.id} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{b.username}</span>
                          <button
                            onClick={() => {
                              requestBlockConfirm(b, 'unban', () => {
                                unbanUser(b.id);
                              });
                            }}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors"
                          >
                            فك الحظر
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: 📜 سجل النشاط (LOGS) */}
            {/* ========================================================= */}
            {activeWindow === 'logs' && (
              <div className="space-y-4 max-w-5xl mx-auto">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <h3 className="text-sm font-black text-white mb-3">سجل عمليات المشرفين والإدارة</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {roomActivityLogs.length === 0 ? (
                      <p className="text-xs text-slate-400 font-bold text-center py-6">لا توجد سجلات بعد</p>
                    ) : (
                      roomActivityLogs.map(log => (
                        <div key={log.id} className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-slate-300 flex items-center justify-between">
                          <span>[{log.actorName}] : {log.details}</span>
                          <span className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: 📰 الأخبار والمنشورات (NEWS) */}
            {/* ========================================================= */}
            {activeWindow === 'news' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                <form onSubmit={handleCreateNews} className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                  <h3 className="text-sm font-black text-amber-400">نشر خبر / إعلان جديد 📰</h3>
                  <input
                    type="text"
                    placeholder="عنوان الخبر..."
                    value={newsTitle}
                    onChange={e => setNewsTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                    required
                  />
                  <textarea
                    placeholder="محتوى الخبر الإعلاني..."
                    value={newsContent}
                    onChange={e => setNewsContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none h-20"
                    required
                  />
                  <div className="flex justify-end">
                    <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-black text-xs rounded-xl cursor-pointer">
                      نشر الخبر 🚀
                    </button>
                  </div>
                </form>

                <div className="space-y-3">
                  {news.map(nw => (
                    <div key={nw.id} className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-xs text-white">{nw.title}</h4>
                        <p className="text-[11px] text-slate-300 mt-1">{nw.content}</p>
                      </div>
                      <button
                        onClick={() => deleteNewsPost(nw.id)}
                        className="p-2 text-rose-400 hover:text-white bg-rose-950/40 hover:bg-rose-900 rounded-xl transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: 🛒 المتجر والأسعار (STORE) */}
            {/* ========================================================= */}
            {activeWindow === 'store' && (
              <div className="space-y-4 max-w-5xl mx-auto">
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4">
                  <h3 className="text-sm font-black text-white mb-3">باقات المتجر وأسعار الرتب 🛒</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {storeItems.map(st => (
                      <div key={st.id} className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center space-y-2">
                        <span className="text-2xl block">{st.icon}</span>
                        <span className="font-extrabold text-xs text-amber-300 block">{st.title}</span>
                        <span className="text-[10px] text-slate-400 block">{st.description}</span>
                        <span className="text-xs font-black text-emerald-400 block">{st.priceCoins} ذهبة</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: 🛡️ الأمان (SECURITY) */}
            {/* ========================================================= */}
            {activeWindow === 'security' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-indigo-400" />
                    <span>تأمين النظام وحماية الخادم</span>
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">حماية الهجمات الإلكترونية (DDoS)</span>
                        <span className="text-[10px] text-slate-400 font-medium block">تحديد معدل الاتصالات لكل IP</span>
                      </div>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">مفعل ✅</span>
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">قفل التسجيل المؤقت للزوار</span>
                        <span className="text-[10px] text-slate-400 font-medium block">إيقاف دخول الزوار الجدد أثناء الصيانة</span>
                      </div>
                      <input type="checkbox" className="w-5 h-5 accent-amber-400 cursor-pointer" />
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-xs font-bold text-white block">تأكيد البريد الإلكتروني إجبارياً</span>
                        <span className="text-[10px] text-slate-400 font-medium block">اشتراط تفعيل الايميل للعضويات الجديدة</span>
                      </div>
                      <input type="checkbox" className="w-5 h-5 accent-amber-400 cursor-pointer" />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: 🤖 نظام System والفلترة (SYSTEM) */}
            {/* ========================================================= */}
            {activeWindow === 'system' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                {/* 1. Word Filter Settings Section */}
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <h3 className="text-sm font-black text-cyan-400 flex items-center gap-2">
                      <Bot className="w-5 h-5 text-cyan-400" />
                      <span>🤬 نظام فلترة الكلمات المحظورة (Profanity Filter)</span>
                    </h3>
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-xl">
                      مفعل تلقائياً 🟢
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    يقوم الروبوت الآلي (System) بمراقبة الرسائل المباشرة والخاصة، وفي حال اكتشاف أي كلمة محظورة يتم اتخاذ الإجراء التلقائي فوراً (كتم العضو وتسجيل الإجراء).
                  </p>

                  {/* Add Bad Word Input Form */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                    <h4 className="text-xs font-black text-amber-300">إضافة كلمة محظورة جديدة للقائمة ➕</h4>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newBadWord}
                        onChange={e => setNewBadWord(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (newBadWord.trim()) {
                              addCustomBadWord(newBadWord.trim());
                              setNewBadWord('');
                              setSavedSuccessMsg('تمت إضافة الكلمة بنجاح 🚫');
                              setTimeout(() => setSavedSuccessMsg(null), 3000);
                            }
                          }
                        }}
                        placeholder="اكتب الكلمة المحظورة هنا..."
                        className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newBadWord.trim()) {
                            addCustomBadWord(newBadWord.trim());
                            setNewBadWord('');
                            setSavedSuccessMsg('تمت إضافة الكلمة بنجاح 🚫');
                            setTimeout(() => setSavedSuccessMsg(null), 3000);
                          }
                        }}
                        className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs px-5 py-2 rounded-xl transition-all cursor-pointer shadow-md"
                      >
                        إضافة ➕
                      </button>
                    </div>
                  </div>

                  {/* Bad Words List Tags */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-400">
                      <span>قائمة الكلمات المحظورة حالياً ({customBadWords.length}):</span>
                      <span className="text-[10px] text-slate-500">اضغط على ✕ لحذف الكلمة من الفلتر</span>
                    </div>

                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto custom-scrollbar p-3 bg-slate-950/80 rounded-2xl border border-slate-800/80">
                      {customBadWords.length === 0 ? (
                        <span className="text-xs text-slate-500 font-medium">لا توجد كلمات محظورة مضافة حالياً.</span>
                      ) : (
                        customBadWords.map((word, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 font-black text-xs"
                          >
                            <span>{word}</span>
                            <button
                              type="button"
                              onClick={() => removeCustomBadWord(word)}
                              className="text-red-400 hover:text-white transition-colors cursor-pointer"
                              title="حذف الكلمة"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </section>

                {/* 2. Interactive Anti-Flood Builder Section */}
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <h3 className="text-sm font-black text-amber-400 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-amber-400" />
                      <span>⚡ بناء وتخصيص نظام مكافحة الفيضانات (Anti-Flood Builder)</span>
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-black px-3 py-1 rounded-xl border ${
                        formSettings.antiFloodEnabled !== false
                          ? 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                          : 'bg-rose-950/80 border-rose-800 text-rose-400'
                      }`}>
                        {formSettings.antiFloodEnabled !== false ? 'النظام مفعل 🟢' : 'معطل 🔴'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Toggle Switch */}
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-black text-white block">حالة مكافحة الفيضانات العامة</span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">تفعيل المراقبة الآلية لكافة الغرف</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.antiFloodEnabled !== false}
                        onChange={e => setFormSettings({ ...formSettings, antiFloodEnabled: e.target.checked })}
                        className="w-6 h-6 accent-amber-400 cursor-pointer"
                      />
                    </div>

                    {/* Max Messages Allowed */}
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-black text-white">الحد الأقصى لعدد الرسائل:</span>
                        <span className="font-black text-amber-400">{formSettings.floodMaxMessages || 4} رسائل</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="10"
                        value={formSettings.floodMaxMessages || 4}
                        onChange={e => setFormSettings({ ...formSettings, floodMaxMessages: Number(e.target.value) })}
                        className="w-full accent-amber-400 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400 block">عدد الرسائل المسموح بإرسالها خلال النافذة الزمنية</span>
                    </div>

                    {/* Window Seconds */}
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-black text-white">النافذة الزمنية للسرعة:</span>
                        <span className="font-black text-cyan-400">{formSettings.floodWindowSeconds || 3} ثوانٍ</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={formSettings.floodWindowSeconds || 3}
                        onChange={e => setFormSettings({ ...formSettings, floodWindowSeconds: Number(e.target.value) })}
                        className="w-full accent-cyan-400 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400 block">إذا تجاوز العضو الحد الأقصى خلال هذه المدة تطبق العقوبة</span>
                    </div>

                    {/* Max Repeated Duplicate Messages */}
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between">
                        <span className="font-black text-white">حد تكرار نفس الرسالة (السبام):</span>
                        <span className="font-black text-purple-400">{formSettings.floodMaxRepeated || 2} مرات متتالية</span>
                      </div>
                      <input
                        type="range"
                        min="2"
                        max="5"
                        value={formSettings.floodMaxRepeated || 2}
                        onChange={e => setFormSettings({ ...formSettings, floodMaxRepeated: Number(e.target.value) })}
                        className="w-full accent-purple-400 cursor-pointer"
                      />
                      <span className="text-[10px] text-slate-400 block">منع إرسال نفس النص التكراري المتتابع</span>
                    </div>

                    {/* Action Trigger */}
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-black text-white block">نوع العقوبة التلقائية المتخذة:</span>
                      <select
                        value={formSettings.floodAction || 'mute'}
                        onChange={e => setFormSettings({ ...formSettings, floodAction: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-amber-300 focus:outline-none"
                      >
                        <option value="warn">تحذير العضو أولاً (Warn)</option>
                        <option value="mute">كتم فوري للمحادثة (Mute) 🔇</option>
                        <option value="kick">طرد مؤقت من الغرفة (Kick) 🚫</option>
                        <option value="ban">حظر نهائي وحظر الجهاز (Device Ban) 🔒</option>
                      </select>
                    </div>

                    {/* Mute Duration */}
                    <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                      <span className="font-black text-white block">مدة الكتم / العقوبة التلقائية:</span>
                      <select
                        value={formSettings.floodMuteDurationMinutes || 1}
                        onChange={e => setFormSettings({ ...formSettings, floodMuteDurationMinutes: Number(e.target.value) })}
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-cyan-300 focus:outline-none"
                      >
                        <option value={1}>دقيقة واحدة (1 min)</option>
                        <option value={5}>5 دقائق</option>
                        <option value={15}>15 دقيقة</option>
                        <option value={60}>ساعة واحدة (60 min)</option>
                        <option value={1440}>24 ساعة (يوم كامل)</option>
                      </select>
                    </div>
                  </div>

                  {/* Additional Protection Options */}
                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="font-black text-white block">منع الروابط الخارجية للزوار 🔗</span>
                        <span className="text-[10px] text-slate-400 block">حظر إرسال روابط المواقع والواتساب وتيليجرام للزوار</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.antiSpamLinks !== false}
                        onChange={e => setFormSettings({ ...formSettings, antiSpamLinks: e.target.checked })}
                        className="w-5 h-5 accent-cyan-400 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center justify-between bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="font-black text-white block">نظام حظر الأجهزة وملفات تعريف الارتباط (Cookie Ban) 🍪</span>
                        <span className="text-[10px] text-slate-400 block">منع المحظورين من الدخول بمتصفح خفي أو تنظيف الكوكيز</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={formSettings.enableCookieBan !== false}
                        onChange={e => setFormSettings({ ...formSettings, enableCookieBan: e.target.checked })}
                        className="w-5 h-5 accent-emerald-400 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => handleSaveSiteSettings()}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>حفظ قواعد مكافحة الفيضانات 💾</span>
                    </button>
                  </div>
                </section>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: 📢 الإشعار الصوتي والبث العام (BROADCAST) */}
            {/* ========================================================= */}
            {activeWindow === 'broadcast' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <h3 className="text-sm font-black text-pink-400 flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-pink-400" />
                      <span>📢 إرسال إشعار صوتي عام لجميع المتواجدين (Audio Broadcast Alert)</span>
                    </h3>
                    <span className="text-xs font-bold text-slate-400">بث مباشر عبر Web Audio 🔊</span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    عند إرسال هذا الإشعار، سيتم تشغيل نغمة صوتية جماعية (Harmonic Fanfare) لدى كل الأعضاء والزوار المتصلين بالدردشة في نفس اللحظة مع ظهور شريط التنبيه الإداري والرسالة المنبثقة.
                  </p>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                    <div>
                      <label className="block text-xs font-black text-white mb-1.5">
                        عنوان التنبيه الصوتي
                      </label>
                      <input
                        type="text"
                        value={broadcastTitle}
                        onChange={e => setBroadcastTitle(e.target.value)}
                        placeholder="مثال: تنبيه إداري هام 📢..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-pink-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-white mb-1.5">
                        نص الرسالة والإعلان الإداري
                      </label>
                      <textarea
                        value={broadcastMessage}
                        onChange={e => setBroadcastMessage(e.target.value)}
                        placeholder="اكتب نص الإعلان الذي سيظهر للجميع..."
                        className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-pink-500 h-24"
                        required
                      />
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          playChatSound('general_broadcast');
                        }}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-slate-700"
                      >
                        <Volume2 className="w-4 h-4 text-pink-400" />
                        <span>تجربة النغمة الصوتية 🔊</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (!broadcastTitle.trim() || !broadcastMessage.trim()) return;
                          broadcastAudioAlert(broadcastTitle.trim(), broadcastMessage.trim(), broadcastSound);
                          setSavedSuccessMsg('تم بث الإشعار الصوتي العام لجميع المتصلين بنجاح! 📢✨');
                          setTimeout(() => setSavedSuccessMsg(null), 4000);
                        }}
                        className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-400 hover:to-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-pink-500/20 cursor-pointer flex items-center gap-2 active:scale-95"
                      >
                        <Volume2 className="w-4 h-4" />
                        <span>بث الإشعار الصوتي للجميع الآن 🚀</span>
                      </button>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* ========================================================= */}
            {/* TAB: ⚡ تحسين وخفة السيرفر وتحديث النظام (SERVER) */}
            {/* ========================================================= */}
            {activeWindow === 'server' && (
              <div className="space-y-6 max-w-5xl mx-auto">
                <section className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <h3 className="text-sm font-black text-emerald-400 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-emerald-400" />
                      <span>⚡ تحديث جوهر النظام وتفريغ الكاش (Server Optimization Engine)</span>
                    </h3>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-3 py-1 rounded-xl">
                      استجابة ممتازة (12ms) 🟢
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    تم تحويل عملية تحديث النظام إلى عملية بسيطة للغاية وخفيفة لا تؤثر على سرعة الدردشة، مع تقليل تحميل خادم الدردشة ومزامنة فورية للرسائل.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center space-y-1">
                      <span className="text-xs text-slate-400 font-bold block">حمولة المعالج (CPU Load)</span>
                      <span className="text-lg font-black text-emerald-400 block">4.2%</span>
                      <span className="text-[10px] text-slate-500">حالة ممتازة ومستقرة</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center space-y-1">
                      <span className="text-xs text-slate-400 font-bold block">الذاكرة المستخدمة (RAM)</span>
                      <span className="text-lg font-black text-cyan-400 block">48 MB / 512 MB</span>
                      <span className="text-[10px] text-slate-500">استهلاك خفيف ومحسن</span>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center space-y-1">
                      <span className="text-xs text-slate-400 font-bold block">قنوات WebSocket النشطة</span>
                      <span className="text-lg font-black text-amber-400 block">{users.length} قناة</span>
                      <span className="text-[10px] text-slate-500">اتصال ثنائي متزامن</span>
                    </div>
                  </div>

                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h4 className="text-xs font-black text-white">تحديث النظام وتفريغ الذاكرة المؤقتة ⚡</h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                        إعادة ضبط كاش السيرفر لتسريع الأداء دون انقطاع الاتصال
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        purgeSystemCache();
                        setSavedSuccessMsg('تم تفريغ كاش السيرفر وتسريع استجابة الدردشة بنجاح ⚡');
                        setTimeout(() => setSavedSuccessMsg(null), 3000);
                      }}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-xs rounded-xl shadow-lg cursor-pointer flex items-center gap-2 active:scale-95 shrink-0"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>تفريغ الكاش وتسريع السيرفر ⚡</span>
                    </button>
                  </div>
                </section>
              </div>
            )}

          </div>
        </main>
      </div>
      )}
    </div>
  );
};
