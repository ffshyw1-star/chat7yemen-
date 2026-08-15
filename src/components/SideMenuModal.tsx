import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { UserAvatar } from './UserAvatar';
import { OnlineStatus, NewsPost, WallPost } from '../types';
import { isStaff } from '../utils/permissions';
import {
  X, Newspaper, Users, CreditCard, Ban, Radio, Send, Heart,
  ChevronDown, ChevronUp, ClipboardList, ShieldAlert, Sparkles,
  UserCheck, Check, Lock, Plus, Trash2, Coins, MoreHorizontal,
  ThumbsUp, ThumbsDown, Smile, MessageSquare, Home, Search,
  UserPlus, Monitor, AlertTriangle, PhoneCall, Image as ImageIcon, LogOut, Gauge
} from 'lucide-react';

export const SideMenuModal: React.FC = () => {
  const {
    setIsSideMenuOpen, setIsOwnerDashboardOpen, setIsStoreOpen,
    currentUser, users, news, wallPosts,
    addNewsPost, deleteNewsPost, reactToNews, addNewsComment,
    addWallPost, deleteWallPost, reactToWallPost, addWallComment,
    updateUserProfile, banList, banUser, unbanUser, setIsLogoutConfirmOpen
  } = useChat();

  // Active view level:
  // 'menu': Side menu drawer (Image 1)
  // 'status': Status modal (Image 2)
  // 'wall': Friends wall screen (Image 3)
  // 'news': News feed screen (Image 4 & 5)
  // 'recharge': Recharge / Store view
  // 'bans': Ban management view
  const [activeSubView, setActiveSubView] = useState<'menu' | 'status' | 'wall' | 'news' | 'recharge' | 'bans'>('menu');

  // Popover state for 3-dots post menu
  const [activePostMenu, setActivePostMenu] = useState<{ id: string; type: 'news' | 'wall' } | null>(null);

  // Likes list modal state ("مشاهدة الاعجابات")
  const [viewLikesPost, setViewLikesPost] = useState<{ id: string; type: 'news' | 'wall'; likesList: { user: string; emoji?: string }[] } | null>(null);

  // New Ban Input state
  const [newBanUserId, setNewBanUserId] = useState('');

  // News creation state
  const [newsTitle, setNewsTitle] = useState('');
  const [newsContent, setNewsContent] = useState('');
  const [newsImage, setNewsImage] = useState('');
  const [newsCommentTexts, setNewsCommentTexts] = useState<{ [id: string]: string }>({});

  // Wall creation state
  const [wallContent, setWallContent] = useState('');
  const [wallImage, setWallImage] = useState('');
  const [wallCommentTexts, setWallCommentTexts] = useState<{ [id: string]: string }>({});

  if (!currentUser) return null;

  const isManagementOrHigher = ['management', 'admin', 'owner'].includes(currentUser.role);
  const isOwner = currentUser.role === 'owner';

  const handleStatusChange = (status: OnlineStatus) => {
    updateUserProfile({ onlineStatus: status });
    setActiveSubView('menu');
  };

  const handlePublishNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsTitle.trim() || !newsContent.trim()) return;
    addNewsPost(newsTitle, newsContent, newsImage || undefined);
    setNewsTitle('');
    setNewsContent('');
    setNewsImage('');
    alert('تم نشر الخبر بنجاح في قائمة الأخبار 📰');
  };

  const handlePublishWall = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallContent.trim()) return;
    addWallPost(wallContent, wallImage || undefined);
    setWallContent('');
    setWallImage('');
  };

  const handleAddBanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBanUserId.trim()) return;
    banUser(newBanUserId.trim());
    setNewBanUserId('');
  };

  // Helper to collect liked users for a post
  const openLikesList = (postId: string, type: 'news' | 'wall') => {
    setActivePostMenu(null);
    const resultList: { user: string; emoji?: string }[] = [];

    if (type === 'news') {
      const post = news.find(n => n.id === postId);
      if (post && post.reactions) {
        Object.entries(post.reactions).forEach(([emoji, uIds]) => {
          (uIds as string[]).forEach(uId => {
            const foundUser = users.find(u => u.id === uId || u.username === uId);
            resultList.push({
              user: foundUser ? foundUser.username : uId,
              emoji
            });
          });
        });
      }
    } else {
      const post = wallPosts.find(w => w.id === postId);
      if (post && post.likes) {
        post.likes.forEach(uId => {
          const foundUser = users.find(u => u.id === uId || u.username === uId);
          resultList.push({
            user: foundUser ? foundUser.username : uId,
            emoji: '❤️'
          });
        });
      }
    }

    setViewLikesPost({
      id: postId,
      type,
      likesList: resultList
    });
  };

  // Helper to handle deleting post
  const handleDeletePost = (postId: string, type: 'news' | 'wall') => {
    setActivePostMenu(null);
    if (!confirm('هل انت أحدث ترغب في حذف هذا المنشور؟')) return;
    if (type === 'news') {
      deleteNewsPost(postId);
    } else {
      deleteWallPost(postId);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-start animate-in fade-in duration-150 dir-rtl">
      
      {/* -------------------------------------------------------------
          VIEW 1: SIDE MENU DRAWER (IMAGE 1)
         ------------------------------------------------------------- */}
      {activeSubView === 'menu' && (
        <div className="bg-white text-slate-900 w-72 sm:w-80 h-full flex flex-col shadow-2xl relative animate-in slide-in-from-right duration-200 border-l border-slate-200">
          
          {/* Header Close X */}
          <div className="p-3 border-b border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setIsSideMenuOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center cursor-pointer transition-colors"
              title="إغلاق X"
            >
              <X className="w-5 h-5 font-bold" />
            </button>
          </div>

          {/* Vertical Menu Options List Matching Screenshot Image 1 */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs font-extrabold text-slate-800">
            
            {/* 1. Status Choice (بعيد 🟡) */}
            <button
              onClick={() => setActiveSubView('status')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-xs">
                  🟡
                </span>
                <span className="text-sm font-bold text-slate-800">
                  {currentUser.onlineStatus === 'online' ? 'متصل' :
                   currentUser.onlineStatus === 'busy' ? 'مشغول' : 'بعيد'}
                </span>
              </div>
            </button>

            {/* 2. Group Call (مكالمة جماعية) */}
            <button
              onClick={() => {
                alert('المكالمة الجماعية قيد البث حالياً 📹');
              }}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <PhoneCall className="w-5 h-5 text-slate-600" />
                <span className="text-sm font-bold text-slate-800">مكالمة جماعية</span>
              </div>
            </button>

            {/* 3. Friends Wall (حائط الأصدقاء) */}
            <button
              onClick={() => setActiveSubView('wall')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-sky-500" />
                <span className="text-sm font-bold text-slate-800">حائط الأصدقاء</span>
              </div>
            </button>

            {/* 4. News (الأخبار) */}
            <button
              onClick={() => setActiveSubView('news')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Newspaper className="w-5 h-5 text-sky-500" />
                <span className="text-sm font-bold text-slate-800">الأخبار</span>
              </div>
            </button>

            {/* 5. Recharge (شراء رصيد) */}
            <button
              onClick={() => setActiveSubView('recharge')}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-sky-500" />
                <span className="text-sm font-bold text-slate-800">شراء رصيد</span>
              </div>
            </button>

            {/* 6. Control Panel / Owner Dashboard (لوحة التحكم - تظهر للمالك فقط) */}
            {currentUser.role === 'owner' && (
              <button
                onClick={() => {
                  setIsSideMenuOpen(false);
                  setIsOwnerDashboardOpen(true);
                }}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-sky-50 transition-colors cursor-pointer border-t border-slate-100 text-slate-800"
              >
                <div className="flex items-center gap-3">
                  <Gauge className="w-5 h-5 text-[#00aeeF]" />
                  <span className="text-sm font-bold text-slate-800">لوحة التحكم</span>
                </div>
              </button>
            )}

            {/* 7. Logout Option */}
            <button
              onClick={() => {
                setIsSideMenuOpen(false);
                setIsLogoutConfirmOpen(true);
              }}
              className="w-full px-5 py-4 flex items-center justify-between hover:bg-rose-50 transition-colors cursor-pointer border-t border-slate-100 text-rose-600"
            >
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-rose-500" />
                <span className="text-sm font-bold">تسجيل الخروج</span>
              </div>
            </button>

          </div>

          {/* Plus Button Icon at Bottom */}
          <div className="p-4 border-t border-slate-100 flex items-center justify-start">
            <button
              onClick={() => setActiveSubView('wall')}
              className="w-9 h-9 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md hover:bg-sky-600 cursor-pointer transition-transform active:scale-95"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW 2: STATUS MODAL (IMAGE 2)
         ------------------------------------------------------------- */}
      {activeSubView === 'status' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden text-slate-900 border border-slate-200">
            
            {/* Header matching Image 2 */}
            <div className="bg-[#0b333e] px-4 py-3 flex items-center justify-between text-white">
              <button
                onClick={() => setActiveSubView('menu')}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5 font-bold" />
              </button>
              <span className="text-sm font-black">الحالة الشخصية</span>
            </div>

            {/* Options List matching Image 2 */}
            <div className="p-4 space-y-3">
              
              {/* Option 1: متصل */}
              <button
                onClick={() => handleStatusChange('online')}
                className={`w-full p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  currentUser.onlineStatus === 'online'
                    ? 'bg-slate-50 border-emerald-500 shadow-xs'
                    : 'bg-slate-50/50 border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-black">✓</span>
                  <span className="font-bold text-sm text-slate-700">متصل</span>
                </div>
              </button>

              {/* Option 2: بعيد */}
              <button
                onClick={() => handleStatusChange('away')}
                className={`w-full p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  currentUser.onlineStatus === 'away'
                    ? 'bg-slate-50 border-amber-500 shadow-xs'
                    : 'bg-slate-50/50 border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-black">🟡</span>
                  <span className="font-bold text-sm text-slate-700">بعيد</span>
                </div>
              </button>

              {/* Option 3: مشغول */}
              <button
                onClick={() => handleStatusChange('busy')}
                className={`w-full p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                  currentUser.onlineStatus === 'busy'
                    ? 'bg-slate-50 border-red-500 shadow-xs'
                    : 'bg-slate-50/50 border-slate-100 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-black">⛔</span>
                  <span className="font-bold text-sm text-slate-700">مشغول</span>
                </div>
              </button>

            </div>

          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW 3: FRIENDS WALL (IMAGE 3)
         ------------------------------------------------------------- */}
      {activeSubView === 'wall' && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-150">
          
          {/* Header Bar with icons matching Image 3 */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white text-slate-700 shadow-xs">
            <button
              onClick={() => setActiveSubView('menu')}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5 font-bold" />
            </button>

            <div className="flex items-center gap-6 text-slate-700">
              <button className="hover:text-sky-500 cursor-pointer" title="الأصدقاء">
                <Users className="w-5 h-5" />
              </button>
              <button className="hover:text-sky-500 cursor-pointer" title="إضافة">
                <UserPlus className="w-5 h-5" />
              </button>
              <button onClick={() => setIsSideMenuOpen(false)} className="hover:text-sky-500 cursor-pointer" title="الرئيسية">
                <Home className="w-5 h-5" />
              </button>
              <button className="hover:text-sky-500 cursor-pointer" title="بحث">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Wall Main Body */}
          <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-4">
            
            {/* Publisher Box matching Image 3 */}
            <form onSubmit={handlePublishWall} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 shadow-xs space-y-3">
              <textarea
                value={wallContent}
                onChange={(e) => setWallContent(e.target.value)}
                rows={3}
                placeholder="كتابة منشور جديد..."
                className="w-full bg-transparent border-none text-slate-800 text-sm focus:outline-none resize-none placeholder:text-slate-400 font-medium"
              />

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/80">
                <label className="cursor-pointer text-slate-500 hover:text-sky-500 transition-colors p-1" title="إرفاق صورة">
                  <ImageIcon className="w-5 h-5" />
                  <input
                    type="url"
                    value={wallImage}
                    onChange={(e) => setWallImage(e.target.value)}
                    className="hidden"
                  />
                </label>

                <button
                  type="submit"
                  className="bg-sky-500 hover:bg-sky-600 text-white font-black px-5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <span>نشر</span>
                  <Send className="w-3.5 h-3.5 rotate-180" />
                </button>
              </div>
            </form>

            {/* Posts Feed or Empty Illustration matching Image 3 */}
            {wallPosts.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-24 h-20 bg-slate-100 rounded-2xl border-2 border-slate-300 flex items-center justify-center relative shadow-inner">
                  <Monitor className="w-12 h-12 text-slate-400" />
                  <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
                    <AlertTriangle className="w-4 h-4 fill-white text-red-500" />
                  </div>
                </div>
                <p className="text-slate-600 font-bold text-sm">لا يوجد منشور لعرضه</p>
              </div>
            ) : (
              <div className="space-y-4">
                {wallPosts.map((post) => (
                  <div key={post.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 relative">
                    
                    {/* Author & Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar
                          avatarUrl={post.authorAvatar}
                          gender="female"
                          role="vip"
                          username={post.authorName}
                          size="sm"
                        />
                        <div>
                          <p className="font-extrabold text-xs text-sky-600">{post.authorName}</p>
                          <p className="text-[10px] text-slate-400">{post.timestamp}</p>
                        </div>
                      </div>

                      {/* 3 Dots Menu Button */}
                      <div className="relative">
                        <button
                          onClick={() => setActivePostMenu(activePostMenu?.id === post.id ? null : { id: post.id, type: 'wall' })}
                          className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                        >
                          <MoreHorizontal className="w-5 h-5" />
                        </button>

                        {/* Popover Menu matching Image 5 */}
                        {activePostMenu?.id === post.id && activePostMenu?.type === 'wall' && (
                          <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-xs font-bold animate-in fade-in zoom-in-95 duration-100">
                            <button
                              onClick={() => openLikesList(post.id, 'wall')}
                              className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 cursor-pointer"
                            >
                              مشاهدة الاعجابات
                            </button>

                            {(isOwner || post.authorId === currentUser.id) && (
                              <button
                                onClick={() => handleDeletePost(post.id, 'wall')}
                                className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 border-t border-slate-100 cursor-pointer"
                              >
                                حذف
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 leading-relaxed font-medium">{post.content}</p>

                    {post.imageUrl && post.imageUrl.trim() !== '' && (
                      <img
                        src={post.imageUrl}
                        alt="مرفق منشور"
                        className="w-full h-48 object-cover rounded-xl border border-slate-100"
                        referrerPolicy="no-referrer"
                      />
                    )}

                    {/* Reactions Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => reactToWallPost(post.id)}
                        className="flex items-center gap-1.5 px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl font-bold cursor-pointer transition-colors"
                      >
                        <Heart className={`w-4 h-4 ${post.likes.includes(currentUser.id) ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                        <span>{post.likes.length} إعجاب</span>
                      </button>

                      <span className="text-[10px] text-slate-400">{post.comments.length} تعليق</span>
                    </div>

                    {/* Comment Input */}
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={wallCommentTexts[post.id] || ''}
                        onChange={(e) => setWallCommentTexts({ ...wallCommentTexts, [post.id]: e.target.value })}
                        placeholder="اكتب تعليقك..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          if (wallCommentTexts[post.id]) {
                            addWallComment(post.id, wallCommentTexts[post.id]);
                            setWallCommentTexts({ ...wallCommentTexts, [post.id]: '' });
                          }
                        }}
                        className="p-1.5 bg-sky-500 text-white rounded-xl cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW 4: NEWS FEED (IMAGE 4 & 5)
         ------------------------------------------------------------- */}
      {activeSubView === 'news' && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col overflow-hidden text-slate-900 animate-in fade-in duration-150">
          
          {/* Header Bar matching Image 4 */}
          <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-white text-slate-700 shadow-xs">
            <button
              onClick={() => setActiveSubView('menu')}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-700 cursor-pointer"
              title="إغلاق"
            >
              <X className="w-5 h-5 font-bold" />
            </button>

            <div className="flex items-center gap-6 text-slate-700">
              <button className="hover:text-sky-500 cursor-pointer" title="الأصدقاء">
                <Users className="w-5 h-5" />
              </button>
              <button className="hover:text-sky-500 cursor-pointer" title="إضافة">
                <UserPlus className="w-5 h-5" />
              </button>
              <button onClick={() => setIsSideMenuOpen(false)} className="hover:text-sky-500 cursor-pointer" title="الرئيسية">
                <Home className="w-5 h-5" />
              </button>
              <button className="hover:text-sky-500 cursor-pointer" title="بحث">
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Main Feed Scroll Container */}
          <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-4">
            
            {/* News Creation Form for Management/Owner */}
            {isManagementOrHigher && (
              <form onSubmit={handlePublishNews} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2 text-xs">
                <span className="font-bold text-sky-700 block">نشر خبر جديد (الإدارة):</span>
                <input
                  type="text"
                  required
                  value={newsTitle}
                  onChange={(e) => setNewsTitle(e.target.value)}
                  placeholder="عنوان الخبر..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none"
                />
                <textarea
                  required
                  value={newsContent}
                  onChange={(e) => setNewsContent(e.target.value)}
                  rows={2}
                  placeholder="محتوى الخبر..."
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-slate-800 focus:outline-none resize-none"
                />
                <button
                  type="submit"
                  className="w-full bg-sky-500 hover:bg-sky-600 text-white font-black py-2 rounded-xl transition-all cursor-pointer"
                >
                  نشر الخبر 📰
                </button>
              </form>
            )}

            {/* News Posts Feed matching Image 4 & 5 */}
            <div className="space-y-4">
              {news.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3 relative">
                  
                  {/* Post Header: Avatar, Name, Time, 3-dots Menu */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        avatarUrl={item.authorAvatar}
                        gender="female"
                        role="management"
                        username={item.authorName}
                        size="sm"
                      />
                      <div>
                        <p className="font-extrabold text-xs text-purple-700">{item.authorName}</p>
                        <p className="text-[10px] text-slate-400">{item.timestamp}</p>
                      </div>
                    </div>

                    {/* 3-dots Menu Button */}
                    <div className="relative">
                      <button
                        onClick={() => setActivePostMenu(activePostMenu?.id === item.id ? null : { id: item.id, type: 'news' })}
                        className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 cursor-pointer"
                      >
                        <MoreHorizontal className="w-5 h-5" />
                      </button>

                      {/* Popover Menu matching Image 5 */}
                      {activePostMenu?.id === item.id && activePostMenu?.type === 'news' && (
                        <div className="absolute left-0 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1 text-xs font-bold animate-in fade-in zoom-in-95 duration-100">
                          <button
                            onClick={() => openLikesList(item.id, 'news')}
                            className="w-full text-right px-4 py-2 hover:bg-slate-50 text-slate-700 cursor-pointer"
                          >
                            مشاهدة الاعجابات
                          </button>

                          {(isOwner || item.authorName === currentUser.username) && (
                            <button
                              onClick={() => handleDeletePost(item.id, 'news')}
                              className="w-full text-right px-4 py-2 hover:bg-red-50 text-red-600 border-t border-slate-100 cursor-pointer"
                            >
                              حذف
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Post Content matching Screenshot 4 */}
                  <div className="space-y-1">
                    {item.title && <h4 className="font-extrabold text-xs text-slate-900">{item.title}</h4>}
                    <p className="text-xs text-slate-800 leading-relaxed font-medium whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>

                  {item.imageUrl && item.imageUrl.trim() !== '' && (
                    <img
                      src={item.imageUrl}
                      alt="صورة الخبر"
                      className="w-full h-48 object-cover rounded-xl border border-slate-100"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Reaction Bar matching Image 4 (💬 18, 😂 19, 💖 89, 👎 7, 👍 41) */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                    {[
                      { emoji: '👍', bg: 'bg-blue-50 hover:bg-blue-100 text-blue-600' },
                      { emoji: '👎', bg: 'bg-red-50 hover:bg-red-100 text-red-600' },
                      { emoji: '💖', bg: 'bg-pink-50 hover:bg-pink-100 text-pink-600' },
                      { emoji: '😂', bg: 'bg-amber-50 hover:bg-amber-100 text-amber-600' },
                    ].map(({ emoji, bg }) => {
                      const count = (item.reactions[emoji] || []).length;
                      return (
                        <button
                          key={emoji}
                          onClick={() => reactToNews(item.id, emoji)}
                          className={`px-3 py-1 rounded-xl border border-slate-200/60 font-bold flex items-center gap-1.5 cursor-pointer transition-colors ${bg}`}
                        >
                          <span className="text-xs">{count}</span>
                          <span className="text-sm">{emoji}</span>
                        </button>
                      );
                    })}

                    <div className="mr-auto text-slate-400 font-bold text-xs flex items-center gap-1">
                      <span>{item.comments.length}</span>
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Comment Input Box matching Image 4 */}
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    {item.comments.length > 0 && (
                      <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                        {item.comments.map((c) => (
                          <div key={c.id} className="bg-slate-50 p-2 rounded-xl text-[11px]">
                            <span className="font-extrabold text-sky-600 block">{c.authorName}:</span>
                            <p className="text-slate-700">{c.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newsCommentTexts[item.id] || ''}
                        onChange={(e) => setNewsCommentTexts({ ...newsCommentTexts, [item.id]: e.target.value })}
                        placeholder="اكتب تعليقك..."
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
                      />
                      <button
                        onClick={() => {
                          if (newsCommentTexts[item.id]) {
                            addNewsComment(item.id, newsCommentTexts[item.id]);
                            setNewsCommentTexts({ ...newsCommentTexts, [item.id]: '' });
                          }
                        }}
                        className="p-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl cursor-pointer transition-colors"
                      >
                        <Send className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>

          </div>

        </div>
      )}

      {/* -------------------------------------------------------------
          VIEW 5: RECHARGE VIEW (شراء رصيد)
         ------------------------------------------------------------- */}
      {activeSubView === 'recharge' && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden text-slate-900 border border-slate-200">
            <div className="bg-[#0b333e] px-4 py-3 flex items-center justify-between text-white">
              <button
                onClick={() => setActiveSubView('menu')}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5 font-bold" />
              </button>
              <span className="text-sm font-black">شراء الرصيد والشحن 💵</span>
            </div>

            <div className="p-4 space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">باقة الشحن الفضي 💵</p>
                  <p className="text-[10px] text-emerald-600 font-mono">50,000 كوينز = 50$</p>
                </div>
                <button
                  onClick={() => {
                    updateUserProfile({ coins: (currentUser.coins || 0) + 50000 });
                    alert('تم شراء باقة الشحن الفضي (50,000 💵) بنجاح!');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                >
                  شراء 💳
                </button>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-800">باقة الشحن الذهبي 💵</p>
                  <p className="text-[10px] text-emerald-600 font-mono">100,000 كوينز = 100$</p>
                </div>
                <button
                  onClick={() => {
                    updateUserProfile({ coins: (currentUser.coins || 0) + 100000 });
                    alert('تم شراء باقة الشحن الذهبي (100,000 💵) بنجاح!');
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                >
                  شراء 💳
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------
          MODAL: "مشاهدة الاعجابات" LIKES LIST MODAL
         ------------------------------------------------------------- */}
      {viewLikesPost && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-slate-900 border border-slate-200">
            
            <div className="bg-[#0b333e] px-4 py-3 flex items-center justify-between text-white">
              <button
                onClick={() => setViewLikesPost(null)}
                className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white cursor-pointer"
              >
                <X className="w-5 h-5 font-bold" />
              </button>
              <span className="text-sm font-black">الأعضاء المعجبون بالمنشور ({viewLikesPost.likesList.length})</span>
            </div>

            <div className="p-4 max-h-80 overflow-y-auto space-y-2">
              {viewLikesPost.likesList.length === 0 ? (
                <p className="text-center text-xs text-slate-500 py-6 font-bold">لا يوجد إعجابات حتى الآن على هذا المنشور</p>
              ) : (
                viewLikesPost.likesList.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        gender="male"
                        role="user"
                        username={item.user}
                        size="xs"
                      />
                      <span className="font-extrabold text-xs text-slate-800">{item.user}</span>
                    </div>
                    {item.emoji && (
                      <span className="text-base bg-white p-1 rounded-lg border border-slate-200 shadow-xs">
                        {item.emoji}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
