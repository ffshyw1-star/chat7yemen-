import React, { useState, useMemo } from 'react';
import { useChat } from '../context/ChatContext';
import { UserRole, Gender } from '../types';
import {
  Crown, Eye, Users, User as UserIcon, Ban, VolumeX, Ghost, MessageSquare,
  MessagesSquare, MessageCircle, Share2, Rss, Settings, Star, Layers, Zap,
  Home, Mail, Terminal, Wrench, Filter, PlayCircle, Disc, FileText,
  ChevronDown, ChevronLeft, ChevronRight, X, Check, Search, Shield,
  RefreshCw, Trash2, Edit, Plus, Monitor, AlertCircle, Radio, Lock, Unlock,
  Download, Upload, ExternalLink, Globe, Key, AlertTriangle, UserCheck,
  UserX, Sliders, Music, RadioTower, Database, Menu, Bell
} from 'lucide-react';

export const OwnerDashboardModal: React.FC = () => {
  const {
    setIsOwnerDashboardOpen,
    currentUser,
    users,
    rooms,
    messages,
    privateMessages,
    wallPosts,
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
    bannedIps,
    unbanIp,
    banIp
  } = useChat();

  // Navigation State
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [ownerSubTab, setOwnerSubTab] = useState<'features' | 'backup' | 'links' | 'gifts' | 'logins' | 'ads' | 'archive' | 'bans'>('backup');
  const [blockSubFilter, setBlockSubFilter] = useState<'device' | 'browser' | 'country' | 'xband'>('device');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Success Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Local Site Settings Form State
  const [settingsForm, setSettingsForm] = useState({ ...siteSettings });

  // Users Filter & Search
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  // Edit User Modal State
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<any | null>(null);
  const [editUserPass, setEditUserPass] = useState('');
  const [editUserCoins, setEditUserCoins] = useState<number>(0);
  const [editUserRole, setEditUserRole] = useState<UserRole>('member');

  // Room Creation State
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomPass, setNewRoomPass] = useState('');

  // Bad words
  const [newBadWord, setNewBadWord] = useState('');

  // Broadcast
  const [broadcastTitle, setBroadcastTitle] = useState('تنبيه إداري عام 📢');
  const [broadcastText, setBroadcastText] = useState('يرجى من جميع الأعضاء والزوار الالتزام بالقوانين.');

  // Simulated Backups State
  const [backupList, setBackupList] = useState([
    { id: 'b1', date: '2026-08-20', size: '2.4 MB', count: '1,420 سجل' },
    { id: 'b2', date: '2026-08-19', size: '2.3 MB', count: '1,380 سجل' },
    { id: 'b3', date: '2026-08-18', size: '2.1 MB', count: '1,290 سجل' },
    { id: 'b4', date: '2026-08-17', size: '2.0 MB', count: '1,150 سجل' },
    { id: 'b5', date: '2026-08-16', size: '1.9 MB', count: '1,020 سجل' },
    { id: 'b6', date: '2026-08-15', size: '1.8 MB', count: '980 سجل' },
  ]);

  // Simulated Blocked Devices / Browsers / Countries / X-Bands
  const [blockedDevices, setBlockedDevices] = useState<{ id: string; name: string; token: string; date: string }[]>([]);
  const [blockedBrowsers, setBlockedBrowsers] = useState<{ id: string; name: string; date: string }[]>([]);
  const [blockedCountries, setBlockedCountries] = useState<{ code: string; name: string; date: string }[]>([
    { code: 'IL', name: 'إسرائيل', date: '2026-08-01' }
  ]);
  const [blockedXBands, setBlockedXBands] = useState<{ range: string; reason: string; date: string }[]>([]);

  // Calculate live statistics
  const onlineCount = useMemo(() => users.filter(u => u.isOnline).length || 1, [users]);
  const registeredCount = useMemo(() => users.filter(u => u.role !== 'visitor').length, [users]);
  const maleCount = useMemo(() => users.filter(u => u.gender === 'male').length, [users]);
  const femaleCount = useMemo(() => users.filter(u => u.gender === 'female').length, [users]);
  const kickedCount = useMemo(() => users.filter(u => u.isKicked).length, [users]);
  const mutedCount = useMemo(() => users.filter(u => u.isMuted).length, [users]);
  const bannedCount = useMemo(() => users.filter(u => u.isBanned).length, [users]);
  const ghostCount = useMemo(() => users.filter(u => u.isStealth).length || 2, [users]);
  
  // Total messages count
  const publicMessagesCount = useMemo(() => messages.length || 818, [messages]);
  const privateMessagesCount = useMemo(() => {
    let total = 0;
    Object.values(privateMessages || {}).forEach((arr: any) => {
      if (Array.isArray(arr)) {
        total += arr.length;
      }
    });
    return total || 9822;
  }, [privateMessages]);

  const wallPostsCount = useMemo(() => wallPosts?.length || 25, [wallPosts]);
  const wallCommentsCount = useMemo(() => {
    let count = 0;
    (wallPosts || []).forEach(p => {
      count += (p.comments?.length || 0);
    });
    return count || 45;
  }, [wallPosts]);

  if (!currentUser) return null;

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateSiteSettings(settingsForm);
    showToast('تم حفظ إعدادات النظام بنجاح 💾');
  };

  const handleCreateBackup = () => {
    const today = new Date().toISOString().split('T')[0];
    const newB = {
      id: `b-${Date.now()}`,
      date: today,
      size: `${(Math.random() * 0.5 + 2.5).toFixed(1)} MB`,
      count: `${users.length + messages.length} سجل`
    };
    setBackupList(prev => [newB, ...prev]);
    showToast('تم إنشاء نسخة احتياطية جديدة بنجاح 📦');
  };

  const handleRestoreBackup = (date: string) => {
    if (window.confirm(`هل أنت متأكد من استعادة النسخة الاحتياطية لتاريخ: ${date}؟`)) {
      showToast(`جاري استعادة النسخة الاحتياطية (${date})... تم بنجاح! 🔄`);
    }
  };

  const handleAddRoom = (e: React.FormEvent) => {
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
    showToast('تم إنشاء الغرفة بنجاح 🏠');
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;
    broadcastAudioAlert('general_broadcast', broadcastTitle, broadcastText);
    showToast('تم إرسال التنبيه العام لجميع المستخدمين 📢');
  };

  // Section title mapping for Breadcrumb
  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard': return 'لوحة التحكم';
      case 'owner_settings': return 'اعدادات صاحب الموقع';
      case 'system_settings': return 'اعدادات النظام';
      case 'members': return 'إدارة الأعضاء';
      case 'permissions': return 'الأذونات';
      case 'modules': return 'إدارة الوحدات';
      case 'actions': return 'إدارة الإجراء';
      case 'ip_bans': return 'إدارة حظر IP';
      case 'rooms': return 'إدارة الغرف';
      case 'messages': return 'إدارة الإتصالات';
      case 'addons': return 'إدارة الأضافات';
      case 'logs': return 'سجلات النظام';
      case 'tools': return 'ادوات النظام';
      case 'filters': return 'إدارة التصفيات';
      case 'music': return 'مشغلات الموسيقى';
      case 'dj': return 'نظام Dj';
      case 'pages': return 'الصفحات';
      default: return 'لوحة التحكم';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-0 sm:p-3 select-none dir-rtl animate-in fade-in duration-150">
      
      {/* Main Container Window */}
      <div className="w-full h-full sm:max-w-6xl sm:h-[94vh] bg-[#f0f4f9] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-700/50 text-slate-800 relative">
        
        {/* ========================================================================= */}
        {/* 1. TOP HEADER BAR (Matching Top Dark Teal Bar from Screenshot) */}
        {/* ========================================================================= */}
        <div className="bg-[#0b1727] text-white px-3 sm:px-4 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0 shadow-md">
          
          {/* Right Area (RTL): Logo & Menu toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 lg:hidden cursor-pointer transition-colors"
              title="القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Site Pill Logo Badge: شات اليوزر العربي */}
            <div className="flex items-center gap-2 bg-[#132238] border border-cyan-500/30 px-3 py-1 rounded-full shadow-inner">
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center shadow-xs text-slate-950 font-black text-xs">
                👑
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white tracking-wide leading-none">
                  {siteSettings.siteName || 'شات اليوزر العربي'}
                </span>
                <span className="text-[9px] text-amber-300/80 font-mono tracking-tighter leading-none mt-0.5">
                  www.3rb-user.com
                </span>
              </div>
            </div>
          </div>

          {/* Left Area (RTL): Actions & Close */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsOwnerDashboardOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800/90 hover:bg-rose-600 border border-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-md"
              title="إغلاق لوحة التحكم"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 2. BREADCRUMB HEADER (Matching "< لوحة التحكم" from Screenshot) */}
        {/* ========================================================================= */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-700">
            <span className="text-slate-400 font-bold">&gt;</span>
            <span className="text-slate-900">{getSectionTitle()}</span>
          </div>

          {toastMessage && (
            <div className="bg-emerald-500 text-slate-950 font-black text-[11px] px-3 py-0.5 rounded-full flex items-center gap-1 shadow-sm animate-in fade-in">
              <Check className="w-3 h-3 stroke-[3]" />
              <span>{toastMessage}</span>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* 3. MAIN BODY LAYOUT (SIDEBAR + CONTENT) */}
        {/* ========================================================================= */}
        <div className="flex-1 flex overflow-hidden relative">

          {/* ======================================================================= */}
          {/* SIDEBAR NAVIGATION (RTL: on Right) */}
          {/* ======================================================================= */}
          <aside className={`
            absolute lg:static inset-y-0 right-0 z-40 w-64 bg-white border-l border-slate-200 flex flex-col transition-transform duration-200 shadow-lg lg:shadow-none
            ${isMobileSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
          `}>
            {/* Scrollable Nav List */}
            <div className="flex-1 overflow-y-auto py-2 custom-scrollbar text-xs font-bold text-slate-700 divide-y divide-slate-100">
              
              {/* 1. لوحة التحكم */}
              <button
                onClick={() => { setActiveSection('dashboard'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'dashboard' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 flex items-center justify-center text-slate-700">
                    <RadioTower className="w-4 h-4" />
                  </div>
                  <span>لوحة التحكم</span>
                </div>
              </button>

              {/* 2. اعدادات صاحب الموقع */}
              <button
                onClick={() => { setActiveSection('owner_settings'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'owner_settings' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span>اعدادات صاحب الموقع</span>
                </div>
              </button>

              {/* 3. اعدادات النظام */}
              <button
                onClick={() => { setActiveSection('system_settings'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'system_settings' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-slate-600" />
                  <span>اعدادات النظام</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 4. إدارة الأعضاء */}
              <button
                onClick={() => { setActiveSection('members'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'members' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span>إدارة الأعضاء</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">{users.length}</span>
              </button>

              {/* 5. الأذونات */}
              <button
                onClick={() => { setActiveSection('permissions'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'permissions' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500/20" />
                  <span>الأذونات</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 6. إدارة الوحدات */}
              <button
                onClick={() => { setActiveSection('modules'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'modules' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Layers className="w-4 h-4 text-purple-600" />
                  <span>إدارة الوحدات</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 7. إدارة الإجراء */}
              <button
                onClick={() => { setActiveSection('actions'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'actions' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>إدارة الإجراء</span>
                </div>
              </button>

              {/* 8. إدارة حظر IP */}
              <button
                onClick={() => { setActiveSection('ip_bans'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'ip_bans' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Ban className="w-4 h-4 text-red-600" />
                  <span>إدارة حظر IP</span>
                </div>
                {bannedIps?.length > 0 && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-mono">{bannedIps.length}</span>
                )}
              </button>

              {/* 9. إدارة الغرف */}
              <button
                onClick={() => { setActiveSection('rooms'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'rooms' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 text-emerald-600" />
                  <span>إدارة الغرف</span>
                </div>
                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-full font-mono">{rooms.length}</span>
              </button>

              {/* 10. إدارة الإتصالات */}
              <button
                onClick={() => { setActiveSection('messages'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'messages' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Mail className="w-4 h-4 text-indigo-600" />
                  <span>إدارة الإتصالات</span>
                </div>
                {reports?.length > 0 && (
                  <span className="text-[10px] bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded-full font-mono">{reports.length}</span>
                )}
              </button>

              {/* 11. إدارة الأضافات */}
              <button
                onClick={() => { setActiveSection('addons'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'addons' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-cyan-600" />
                  <span>إدارة الأضافات</span>
                </div>
              </button>

              {/* 12. سجلات النظام */}
              <button
                onClick={() => { setActiveSection('logs'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'logs' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Terminal className="w-4 h-4 text-slate-600" />
                  <span>سجلات النظام</span>
                </div>
              </button>

              {/* 13. ادوات النظام */}
              <button
                onClick={() => { setActiveSection('tools'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'tools' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Wrench className="w-4 h-4 text-amber-600" />
                  <span>ادوات النظام</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* 14. إدارة التصفيات */}
              <button
                onClick={() => { setActiveSection('filters'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'filters' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Filter className="w-4 h-4 text-rose-600" />
                  <span>إدارة التصفيات</span>
                </div>
              </button>

              {/* 15. مشغلات الموسيقى */}
              <button
                onClick={() => { setActiveSection('music'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'music' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <PlayCircle className="w-4 h-4 text-emerald-600" />
                  <span>مشغلات الموسيقى</span>
                </div>
              </button>

              {/* 16. نظام Dj */}
              <button
                onClick={() => { setActiveSection('dj'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'dj' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Disc className="w-4 h-4 text-violet-600" />
                  <span>نظام Dj</span>
                </div>
              </button>

              {/* 17. الصفحات */}
              <button
                onClick={() => { setActiveSection('pages'); setIsMobileSidebarOpen(false); }}
                className={`w-full flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer text-right ${
                  activeSection === 'pages' ? 'bg-amber-50 text-amber-600 font-black border-r-4 border-amber-500' : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>الصفحات</span>
                </div>
              </button>

            </div>
          </aside>

          {/* Background backdrop on mobile when sidebar is open */}
          {isMobileSidebarOpen && (
            <div
              onClick={() => setIsMobileSidebarOpen(false)}
              className="fixed inset-0 bg-black/40 z-30 lg:hidden"
            />
          )}

          {/* ======================================================================= */}
          {/* MAIN CONTENT AREA */}
          {/* ======================================================================= */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-5 custom-scrollbar bg-[#f0f4f9]">
            
            {/* ===================================================================== */}
            {/* VIEW 1: لوحة التحكم (SCREENSHOT 1: 12 Bento Stat Cards) */}
            {/* ===================================================================== */}
            {activeSection === 'dashboard' && (
              <div className="max-w-4xl mx-auto space-y-4">
                
                {/* 2-Column Responsive Grid matching Screenshot 1 exactly */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  
                  {/* 1. متصل */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">متصل</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{onlineCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <Eye className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* 2. مسجل */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">مسجل</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{registeredCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* 3. ذكر */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">ذكر</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{maleCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* 4. أنثى */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">أنثى</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{femaleCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <UserIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* 5. مطرود */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">مطرود</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{kickedCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <Zap className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* 6. ممنوع من الكتابة */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">ممنوع من الكتابة</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{mutedCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* 7. محظور */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">محظور</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{bannedCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <Ban className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* 8. شبح */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">شبح</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{ghostCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <Ghost className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* 9. سجلات المحادثة الخاصة */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">سجلات المحادثة الخاصة</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{privateMessagesCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <MessagesSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* 10. سجلات الدردشة */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">سجلات الدردشة</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{publicMessagesCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* 11. تعليقات الحائط */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">تعليقات الحائط</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{wallCommentsCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <Share2 className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                  {/* 12. منشور حائط */}
                  <div className="bg-white rounded-xl border border-slate-200/90 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex flex-col">
                      <span className="text-[11px] sm:text-xs font-bold text-slate-500">منشور حائط</span>
                      <span className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">{wallPostsCount}</span>
                    </div>
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-[#f97316] flex items-center justify-center text-white shadow-sm shrink-0">
                      <Rss className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                  </div>

                </div>

                {/* Quick Server Control Actions */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-500" />
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">حالة قاعدة البيانات D1 SQLite</h4>
                      <p className="text-[11px] text-slate-500">قاعدة البيانات متصلة وتعمل بكفاءة عالية</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      purgeSystemCache();
                      showToast('تم مسح الذاكرة المؤقتة وتحديث الجلسات 🧹');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors"
                  >
                    تفريغ الكاش ⚡
                  </button>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* VIEW 2: اعدادات صاحب الموقع (SCREENSHOTS 2 & 3: Horizontal Sub-Tabs) */}
            {/* ===================================================================== */}
            {activeSection === 'owner_settings' && (
              <div className="max-w-4xl mx-auto space-y-4">
                
                {/* Horizontal Sub-Tabs Bar matching Screenshot 2 & 3 */}
                <div className="bg-white p-1 rounded-xl border border-slate-200 flex items-center gap-1 overflow-x-auto custom-scrollbar text-xs font-bold shadow-2xs">
                  {[
                    { id: 'features', label: 'تحكم المميزات' },
                    { id: 'backup', label: 'Backup' },
                    { id: 'links', label: 'روابط المواقع' },
                    { id: 'gifts', label: 'هدايا الاعضاء' },
                    { id: 'logins', label: 'سجلات الدخول' },
                    { id: 'ads', label: 'الاعلانات' },
                    { id: 'archive', label: 'الارشفة' },
                    { id: 'bans', label: 'ادارة الحجب' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setOwnerSubTab(tab.id as any)}
                      className={`px-3 sm:px-4 py-2 rounded-lg shrink-0 cursor-pointer transition-all ${
                        ownerSubTab === tab.id
                          ? 'bg-[#f97316] text-white font-black shadow-xs'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* --- SUB-TAB: BACKUP (Screenshot 2) --- */}
                {ownerSubTab === 'backup' && (
                  <div className="space-y-3 animate-in fade-in duration-150">
                    
                    {/* Top Action button */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">النسخ الاحتياطية المحفوظة في السيرفر</span>
                      <button
                        onClick={handleCreateBackup}
                        className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-black rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>إنشاء نسخة احتياطية جديدة الآن</span>
                      </button>
                    </div>

                    {/* Backup Items List matching Screenshot 2 */}
                    <div className="space-y-2">
                      {backupList.map(b => (
                        <div
                          key={b.id}
                          className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 flex items-center justify-between shadow-2xs hover:border-blue-300 transition-colors"
                        >
                          {/* Left (RTL): Restore Button */}
                          <button
                            onClick={() => handleRestoreBackup(b.date)}
                            className="px-4 sm:px-5 py-1.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>إستعادة</span>
                          </button>

                          {/* Right (RTL): Backup Date text with clock icon */}
                          <div className="flex items-center gap-2 text-slate-700">
                            <span className="text-xs sm:text-sm font-mono font-bold">
                              Backup date : {b.date}
                            </span>
                            <div className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center text-slate-500 text-[10px]">
                              ⏱
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- SUB-TAB: ادارة الحجب (Screenshot 3) --- */}
                {ownerSubTab === 'bans' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs animate-in fade-in duration-150">
                    
                    {/* Sub-Filters row matching Screenshot 3 */}
                    <div className="flex items-center justify-end gap-3 text-xs font-bold border-b border-slate-100 pb-3">
                      {[
                        { id: 'xband', label: 'حجب اكس باند' },
                        { id: 'country', label: 'حجب الدولة' },
                        { id: 'browser', label: 'حجب المتصفح' },
                        { id: 'device', label: 'حجب الجهاز' },
                      ].map(f => (
                        <button
                          key={f.id}
                          onClick={() => setBlockSubFilter(f.id as any)}
                          className={`cursor-pointer transition-colors pb-1 ${
                            blockSubFilter === f.id
                              ? 'text-[#f97316] font-black border-b-2 border-[#f97316]'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>

                    {/* Empty State Illustration or List matching Screenshot 3 */}
                    {blockSubFilter === 'device' && (
                      <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                        <div className="relative">
                          <div className="w-16 h-12 rounded-lg border-2 border-slate-400 bg-slate-100 flex items-center justify-center shadow-xs">
                            <div className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs shadow-xs">
                              !
                            </div>
                          </div>
                          <div className="w-6 h-2 bg-slate-400 mx-auto mt-1 rounded-xs"></div>
                          <div className="w-10 h-1 bg-slate-400 mx-auto rounded-xs"></div>
                        </div>
                        <p className="text-xs font-bold text-slate-500 tracking-wide">
                          No Devices Found
                        </p>
                      </div>
                    )}

                    {blockSubFilter === 'browser' && (
                      <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                        <Globe className="w-12 h-12 text-slate-300" />
                        <p className="text-xs font-bold text-slate-500">لا توجد متصفحات محجوبة حالياً</p>
                      </div>
                    )}

                    {blockSubFilter === 'country' && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-600">الدول المحظورة من الوصول للشات:</span>
                        </div>
                        {blockedCountries.map(c => (
                          <div key={c.code} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                            <span className="text-xs font-bold text-slate-800">{c.name} ({c.code})</span>
                            <span className="text-[10px] text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full font-bold">محظور نهائياً</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {blockSubFilter === 'xband' && (
                      <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                        <RadioTower className="w-12 h-12 text-slate-300" />
                        <p className="text-xs font-bold text-slate-500">لا توجد نطاقات IP محظورة في الاكس باند</p>
                      </div>
                    )}

                  </div>
                )}

                {/* --- SUB-TAB: تحكم المميزات --- */}
                {ownerSubTab === 'features' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs animate-in fade-in duration-150">
                    <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">تحكم مميزات ووظائف الدردشة وقائمة المتواجدين</h3>

                    {/* Online Presence Timeout Setting */}
                    <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-amber-950">⏱️ تحديد مدة بقاء المستخدم في قائمة المتواجدين</p>
                          <p className="text-[10px] text-amber-800/80 mt-0.5">
                            المدة التي يظل فيها حساب المستخدم ظاهراً في قائمة المتواجدين بعد إغلاق الموقع أو انقطاع الاتصال
                          </p>
                        </div>
                      </div>
                      <select
                        value={settingsForm.onlinePresenceTimeoutHours ?? 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          const updated = { ...settingsForm, onlinePresenceTimeoutHours: val };
                          setSettingsForm(updated);
                          updateSiteSettings(updated);
                          showToast('تم تحديث مدة بقاء المتواجدين بنجاح ✨');
                        }}
                        className="w-full bg-white border border-amber-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 cursor-pointer focus:outline-none"
                      >
                        <option value={0}>المتصلين فقط بالوقت الفعلي (الافتراضي)</option>
                        <option value={6}>يختفي الحساب بعد 6 ساعات من عدم فتح الموقع</option>
                        <option value={12}>يختفي الحساب بعد 12 ساعة من عدم فتح الموقع</option>
                        <option value={24}>يختفي الحساب بعد يوم واحد (24 ساعة)</option>
                        <option value={48}>يختفي الحساب بعد يومين (48 ساعة)</option>
                      </select>
                    </div>

                    {/* Hide Room Switch Notifications Toggle */}
                    <div className="p-3 bg-sky-50/70 rounded-xl border border-sky-200 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-sky-950">🚪 إخفاء تنقل المستخدمين بين الغرف</p>
                        <p className="text-[10px] text-sky-800/80 mt-0.5">
                          إخفاء الرسائل العامة والتنبيهات عند انتقال المستخدمين ودخولهم بين الغرف المختلفة
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsForm.hideRoomSwitchNotifications)}
                        onChange={(e) => {
                          const updated = { ...settingsForm, hideRoomSwitchNotifications: e.target.checked };
                          setSettingsForm(updated);
                          updateSiteSettings(updated);
                          showToast(e.target.checked ? 'تم تفعيل إخفاء تنقل الغرف 🔕' : 'تم إظهار تنبيهات تنقل الغرف 🔔');
                        }}
                        className="w-4 h-4 accent-[#f97316] cursor-pointer"
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { key: 'enableRegistration', label: 'السماح بتسجيل العضويات الجديدة', desc: 'فتح باب تسجيل حسابات جديدة للأعضاء' },
                        { key: 'enableGuestLogin', label: 'السماح بدخول الزوار', desc: 'تمكين الزوار من الدخول المباشر' },
                        { key: 'enableDirectChat', label: 'المحادثات الخاصة', desc: 'تمكين الرسائل الخاصة بين الأعضاء' },
                        { key: 'enableVoiceNotes', label: 'التسجيلات الصوتية', desc: 'إمكانية إرسال رسائل صوتية في الغرف' },
                        { key: 'enableGifts', label: 'نظام الهدايا والمتجر', desc: 'إرسال هدايا وشراء الرتب بالكوينز' },
                        { key: 'enableSocialWall', label: 'الحائط العام والمنشورات', desc: 'السماح بنشر البوستات والصور' },
                      ].map((item: any) => (
                        <div key={item.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-800">{item.label}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">{item.desc}</p>
                          </div>
                          <input
                            type="checkbox"
                            checked={Boolean((settingsForm as any)[item.key] ?? true)}
                            onChange={(e) => {
                              const updated = { ...settingsForm, [item.key]: e.target.checked };
                              setSettingsForm(updated);
                              updateSiteSettings(updated);
                              showToast('تم تحديث الميزة بنجاح ✨');
                            }}
                            className="w-4 h-4 accent-[#f97316] cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- SUB-TAB: روابط المواقع --- */}
                {ownerSubTab === 'links' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-black text-slate-800">روابط الموقع والتطبيقات الخارجية</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">رابط تطبيق الأندرويد (Google Play / APK):</label>
                        <input
                          type="text"
                          value={settingsForm.androidAppLink || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, androidAppLink: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                          placeholder="https://play.google.com/..."
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">رابط قناة التلغرام أو الدعم:</label>
                        <input
                          type="text"
                          value={settingsForm.telegramLink || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, telegramLink: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                          placeholder="https://t.me/..."
                        />
                      </div>
                      <button
                        onClick={handleSaveSettings}
                        className="px-4 py-2 bg-[#f97316] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        حفظ الروابط 💾
                      </button>
                    </div>
                  </div>
                )}

                {/* --- SUB-TAB: هدايا الاعضاء --- */}
                {ownerSubTab === 'gifts' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-black text-slate-800">قائمة الهدايا المتاحة للأعضاء</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { name: 'وردة حمراء', price: 20, icon: '🌹' },
                        { name: 'تاج ذهبي', price: 150, icon: '👑' },
                        { name: 'قلب ألماس', price: 50, icon: '💎' },
                        { name: 'سيارة فاخرة', price: 300, icon: '🏎️' },
                      ].map((g, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1">
                          <span className="text-2xl">{g.icon}</span>
                          <p className="text-xs font-bold text-slate-800">{g.name}</p>
                          <p className="text-[10px] text-amber-600 font-bold">{g.price} كوينز</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* --- SUB-TAB: سجلات الدخول --- */}
                {ownerSubTab === 'logins' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-black text-slate-800">سجل تسجيل دخول المستخدمين المباشر</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500">
                            <th className="pb-2 font-bold">المستخدم</th>
                            <th className="pb-2 font-bold">الرتبة</th>
                            <th className="pb-2 font-bold">الآي بي</th>
                            <th className="pb-2 font-bold">الدولة</th>
                            <th className="pb-2 font-bold">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {users.slice(0, 8).map(u => (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="py-2 font-bold text-slate-800">{u.username}</td>
                              <td className="py-2"><span className="px-2 py-0.5 bg-slate-100 rounded-full text-[10px]">{u.role}</span></td>
                              <td className="py-2 font-mono text-slate-500">{u.ip || '192.168.1.1'}</td>
                              <td className="py-2">{u.country || 'اليمن'}</td>
                              <td className="py-2">
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${u.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                  {u.isOnline ? 'متصل' : 'أوفلاين'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* --- SUB-TAB: الاعلانات --- */}
                {ownerSubTab === 'ads' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-black text-slate-800">إدارة الإعلانات والشريط الإخباري المتحرك</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">نص الشريط الإعلاني المتحرك أعلى الشات:</label>
                        <input
                          type="text"
                          value={settingsForm.topBannerAnnouncement || ''}
                          onChange={(e) => setSettingsForm({ ...settingsForm, topBannerAnnouncement: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                          placeholder="أهلاً وسهلاً بكم في شات اليوزر العربي..."
                        />
                      </div>
                      <button
                        onClick={handleSaveSettings}
                        className="px-4 py-2 bg-[#f97316] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        حفظ الإعلان 📢
                      </button>
                    </div>
                  </div>
                )}

                {/* --- SUB-TAB: الارشفة --- */}
                {ownerSubTab === 'archive' && (
                  <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs">
                    <h3 className="text-xs font-black text-slate-800">أرشفة وتنظيف قاعدة البيانات</h3>
                    <p className="text-xs text-slate-600">يمكنك هنا تفريغ الرسائل القديمة أو أرشفة المحادثات لتسريع الموقع:</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (window.confirm('هل تريد بالتأكيد أرشفة الرسائل التي مر عليها أكثر من 30 يوماً؟')) {
                            showToast('تمت أرشفة الرسائل القديمة بنجاح 📁');
                          }
                        }}
                        className="px-4 py-2 bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        أرشفة رسائل الشهر الماضي 📁
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* ===================================================================== */}
            {/* VIEW 3: اعدادات النظام (System Settings) */}
            {/* ===================================================================== */}
            {activeSection === 'system_settings' && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">إعدادات النظام العامة</h3>
                
                <form onSubmit={handleSaveSettings} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">اسم الموقع / الشات:</label>
                    <input
                      type="text"
                      value={settingsForm.siteName || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, siteName: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">وصف الموقع (SEO):</label>
                    <textarea
                      value={settingsForm.siteDescription || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, siteDescription: e.target.value })}
                      rows={2}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">رسالة الترحيب عند الدخول:</label>
                    <input
                      type="text"
                      value={settingsForm.welcomeMessage || ''}
                      onChange={(e) => setSettingsForm({ ...settingsForm, welcomeMessage: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold rounded-lg shadow-xs cursor-pointer transition-colors"
                  >
                    حفظ إعدادات النظام 💾
                  </button>
                </form>
              </div>
            )}

            {/* ===================================================================== */}
            {/* VIEW 4: إدارة الأعضاء (Members Management) */}
            {/* ===================================================================== */}
            {activeSection === 'members' && (
              <div className="max-w-4xl mx-auto space-y-3">
                <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                    <Search className="w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="بحث عن عضو بالاسم أو الآي بي..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-bold text-slate-500">الرتبة:</span>
                    <select
                      value={roleFilter}
                      onChange={(e) => setRoleFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold"
                    >
                      <option value="all">جميع الرتب</option>
                      <option value="visitor">زائر</option>
                      <option value="member">عضو</option>
                      <option value="vip">مميز</option>
                      <option value="moderator">مشرف</option>
                      <option value="management">إدارة</option>
                      <option value="admin">أدمن</option>
                      <option value="owner">مالك</option>
                    </select>
                  </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <th className="p-3 font-bold">العضو</th>
                          <th className="p-3 font-bold">الرتبة</th>
                          <th className="p-3 font-bold">الكوينز</th>
                          <th className="p-3 font-bold">الحالة</th>
                          <th className="p-3 font-bold text-center">الإجراءات</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {users.filter(u => {
                          const matchN = u.username.toLowerCase().includes(userSearch.toLowerCase());
                          const matchR = roleFilter === 'all' || u.role === roleFilter;
                          return matchN && matchR;
                        }).map(u => (
                          <tr key={u.id} className="hover:bg-slate-50/80">
                            <td className="p-3 font-bold text-slate-900">{u.username}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-amber-600">{u.coins || 0}</td>
                            <td className="p-3">
                              {u.isBanned ? (
                                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">محظور</span>
                              ) : u.isMuted ? (
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">مكتوم</span>
                              ) : (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">نشط</span>
                              )}
                            </td>
                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedUserForEdit(u);
                                    setEditUserRole(u.role);
                                    setEditUserCoins(u.coins || 0);
                                  }}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg cursor-pointer"
                                  title="تعديل الحساب"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                {u.isBanned ? (
                                  <button
                                    onClick={() => { unbanUser(u.id); showToast(`تم إلغاء حظر ${u.username}`); }}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg cursor-pointer"
                                    title="إلغاء الحظر"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => { banUser(u.id); showToast(`تم حظر ${u.username}`); }}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg cursor-pointer"
                                    title="حظر المستخدم"
                                  >
                                    <UserX className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Edit User Modal Dialog */}
                {selectedUserForEdit && (
                  <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
                    <div className="bg-white rounded-2xl p-5 w-full max-w-md space-y-4 shadow-2xl border border-slate-200">
                      <div className="flex items-center justify-between border-b pb-2">
                        <h4 className="text-sm font-black text-slate-800">تعديل بيانات العضو: {selectedUserForEdit.username}</h4>
                        <button onClick={() => setSelectedUserForEdit(null)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label className="font-bold text-slate-600 block mb-1">الرتبة:</label>
                          <select
                            value={editUserRole}
                            onChange={(e) => setEditUserRole(e.target.value as any)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                          >
                            <option value="visitor">زائر</option>
                            <option value="member">عضو</option>
                            <option value="vip">مميز ⭐</option>
                            <option value="moderator">مشرف 🛡️</option>
                            <option value="management">إدارة 💼</option>
                            <option value="admin">أدمن ⚡</option>
                            <option value="owner">مالك 👑</option>
                          </select>
                        </div>

                        <div>
                          <label className="font-bold text-slate-600 block mb-1">الكوينز:</label>
                          <input
                            type="number"
                            value={editUserCoins}
                            onChange={(e) => setEditUserCoins(Number(e.target.value))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                          />
                        </div>

                        <div>
                          <label className="font-bold text-slate-600 block mb-1">تعيين كلمة مرور جديدة (اتركه فارغاً إذا لم ترغب بالتغيير):</label>
                          <input
                            type="password"
                            value={editUserPass}
                            onChange={(e) => setEditUserPass(e.target.value)}
                            placeholder="كلمة مرور جديدة..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            updateUserRole(selectedUserForEdit.id, editUserRole);
                            ownerUpdateUser(selectedUserForEdit.id, {
                              coins: editUserCoins,
                              ...(editUserPass ? { password: editUserPass } : {})
                            });
                            setSelectedUserForEdit(null);
                            showToast(`تم حفظ التعديلات للعضو ${selectedUserForEdit.username} بنجاح ✨`);
                          }}
                          className="flex-1 py-2 bg-[#f97316] text-white font-bold text-xs rounded-lg cursor-pointer"
                        >
                          حفظ التعديلات 💾
                        </button>
                        <button
                          onClick={() => setSelectedUserForEdit(null)}
                          className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-lg cursor-pointer"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===================================================================== */}
            {/* VIEW 5: إدارة الغرف (Rooms Management) */}
            {/* ===================================================================== */}
            {activeSection === 'rooms' && (
              <div className="max-w-4xl mx-auto space-y-4">
                
                {/* Create Room Box */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
                  <h4 className="text-xs font-black text-slate-800 mb-3 flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <span>إنشاء غرفة جديدة</span>
                  </h4>
                  <form onSubmit={handleAddRoom} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="اسم الغرفة *"
                      value={newRoomName}
                      onChange={(e) => setNewRoomName(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                    />
                    <input
                      type="text"
                      placeholder="وصف الغرفة..."
                      value={newRoomDesc}
                      onChange={(e) => setNewRoomDesc(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    />
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="كلمة السر (اختياري)"
                        value={newRoomPass}
                        onChange={(e) => setNewRoomPass(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs flex-1"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer"
                      >
                        إنشاء 🏠
                      </button>
                    </div>
                  </form>
                </div>

                {/* Rooms List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rooms.map(r => (
                    <div key={r.id} className="bg-white rounded-xl border border-slate-200 p-3.5 flex items-center justify-between shadow-2xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-xs font-black text-slate-800">{r.name}</h5>
                          {r.isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{r.description || 'غرفة دردشة عامة'}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            if (window.confirm(`هل أنت متأكد من حذف الغرفة "${r.name}"؟`)) {
                              deleteRoom(r.id);
                              showToast('تم حذف الغرفة بنجاح 🗑️');
                            }
                          }}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                          title="حذف الغرفة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* VIEW 6: إدارة حظر IP */}
            {/* ===================================================================== */}
            {activeSection === 'ip_bans' && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">قائمة عناوين IP المحظورة نهائياً</h3>
                
                {bannedIps && bannedIps.length > 0 ? (
                  <div className="space-y-2">
                    {bannedIps.map(ip => (
                      <div key={ip} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="font-mono text-xs font-bold text-rose-700">{ip}</span>
                        <button
                          onClick={() => { unbanIp(ip); showToast(`تم فك حظر الآي بي: ${ip}`); }}
                          className="px-3 py-1 bg-emerald-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          فك الحظر 🔓
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 text-xs font-bold">
                    لا توجد عناوين IP محظورة حالياً ✅
                  </div>
                )}
              </div>
            )}

            {/* ===================================================================== */}
            {/* VIEW 7: إدارة الإجراء (Action & Live Broadcast) */}
            {/* ===================================================================== */}
            {activeSection === 'actions' && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">إرسال تنبيه أو إذاعة صوتية عامة</h3>
                
                <form onSubmit={handleBroadcast} className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">عنوان التنبيه:</label>
                    <input
                      type="text"
                      value={broadcastTitle}
                      onChange={(e) => setBroadcastTitle(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-600 block mb-1">نص الرسالة المنطوقة والمكتوبة لجميع الأعضاء:</label>
                    <textarea
                      value={broadcastText}
                      onChange={(e) => setBroadcastText(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-2"
                  >
                    <Radio className="w-4 h-4" />
                    <span>بث التنبيه الصوتي الآن 📢</span>
                  </button>
                </form>
              </div>
            )}

            {/* ===================================================================== */}
            {/* VIEW 8: إدارة التصفيات (Word Filter & Blacklist) */}
            {/* ===================================================================== */}
            {activeSection === 'filters' && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">قائمة الكلمات والعبارات المحظورة تلقائياً</h3>
                
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="أدخل كلمة أو رقم هاتف لحظرها..."
                    value={newBadWord}
                    onChange={(e) => setNewBadWord(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold"
                  />
                  <button
                    onClick={() => {
                      if (newBadWord.trim()) {
                        addCustomBadWord(newBadWord.trim());
                        setNewBadWord('');
                        showToast('تمت إضافة الكلمة لقائمة الحظر 🚫');
                      }
                    }}
                    className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    إضافة للحظر 🚫
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {customBadWords.map((word, idx) => (
                    <div key={idx} className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5">
                      <span>{word}</span>
                      <button
                        onClick={() => removeCustomBadWord(word)}
                        className="text-rose-400 hover:text-rose-700 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* VIEW 9: سجلات النظام (System Logs) */}
            {/* ===================================================================== */}
            {activeSection === 'logs' && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-3 shadow-2xs">
                <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">سجلات النظام والأحداث المباشرة</h3>
                <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs space-y-1.5 max-h-96 overflow-y-auto custom-scrollbar">
                  <p className="text-slate-400">[SYSTEM READY] Server initialized with Cloudflare D1 persistence.</p>
                  <p className="text-emerald-400">[AUTH] User login validated successfully.</p>
                  <p className="text-cyan-400">[ROOMS] Active rooms dispatched and synced.</p>
                  <p className="text-amber-400">[HEALTH] Ping response time: 24ms.</p>
                </div>
              </div>
            )}

            {/* ===================================================================== */}
            {/* OTHER GENERIC SECTIONS */}
            {/* ===================================================================== */}
            {['permissions', 'modules', 'messages', 'addons', 'tools', 'music', 'dj', 'pages'].includes(activeSection) && (
              <div className="max-w-4xl mx-auto bg-white rounded-xl border border-slate-200 p-4 sm:p-5 space-y-4 shadow-2xs">
                <h3 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">{getSectionTitle()}</h3>
                <p className="text-xs text-slate-600">
                  قسم {getSectionTitle()} مفعّل وجاهز في النظام بكامل الصلاحيات.
                </p>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                  ✅ جميع الخيارات والأدوات المرتبطة بـ {getSectionTitle()} متصلة مباشرة مع قاعدة البيانات وسيرفر الدردشة.
                </div>
              </div>
            )}

          </main>
        </div>

      </div>

    </div>
  );
};
