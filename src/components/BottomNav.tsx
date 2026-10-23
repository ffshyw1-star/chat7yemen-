import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { RADIO_STATIONS } from '../utils/radioStations';
import { isPrimaryOwner } from '../utils/permissions';
import { ThemeMode } from '../types';

export const BottomNav: React.FC = () => {
  const {
    currentUser,
    currentRoom,
    users,
    rooms,
    isOnlineListOpen,
    setIsOnlineListOpen,
    isRoomsListOpen,
    setIsRoomsListOpen,
    isRadioPlaying,
    toggleRadio,
    radioStationId,
    setRadioStationId,
    radioVolume,
    setRadioVolume,
    setIsRadioModalOpen,
    setIsProfileSettingsOpen,
    setIsStoreOpen,
    setIsRoomLogsOpen,
    setIsRoomSettingsOpen,
    setIsOwnerDashboardOpen,
    setIsSideMenuOpen,
    setSideMenuInitialView,
    themeMode,
    setThemeMode,
    setIsLogoutConfirmOpen,
    currentUserCan,
    isPrivateMinimized,
    setIsPrivateMinimized,
    isPrivateChatOpen,
    setIsPrivateChatOpen,
    activePrivateUserId,
    privateMessages
  } = useChat();

  const [isPlayerOptionsOpen, setIsPlayerOptionsOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);

  const playerMenuRef = useRef<HTMLDivElement>(null);
  const optionsMenuRef = useRef<HTMLDivElement>(null);

  // Close popovers when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        playerMenuRef.current &&
        !playerMenuRef.current.contains(target) &&
        !target.closest('#player_menu_btn') &&
        !target.closest('#current_player')
      ) {
        setIsPlayerOptionsOpen(false);
      }
      if (
        optionsMenuRef.current &&
        !optionsMenuRef.current.contains(target) &&
        !target.closest('#btn_options')
      ) {
        setIsOptionsMenuOpen(false);
      }
    };

    if (isPlayerOptionsOpen || isOptionsMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isPlayerOptionsOpen, isOptionsMenuOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).editProfile = () => {
        setIsProfileSettingsOpen(true);
      };
    }
  }, [setIsProfileSettingsOpen]);

  if (!currentUser) return null;

  // Filter active users in current room
  const currentRoomOnlineUsers = users.filter((u) => {
    if (u.isBanned) return false;
    if (u.role === 'owner' && u.isStealth && currentUser?.role !== 'owner') return false;
    if (u.onlineStatus === 'offline') return false;
    return (u.currentRoomId || 'room-general') === currentRoom.id;
  });

  const currentStation =
    RADIO_STATIONS.find((s) => s.id === radioStationId) || RADIO_STATIONS[0];

  const minimizedUser = activePrivateUserId
    ? users.find((u) => u.id === activePrivateUserId)
    : null;

  const minimizedUnreadCount =
    activePrivateUserId && currentUser
      ? privateMessages.filter(
          (pm) =>
            pm.senderId === activePrivateUserId &&
            pm.receiverId === currentUser.id &&
            !pm.isRead
        ).length
      : 0;

  const handleStationSelect = (stationId: string) => {
    setRadioStationId(stationId);
    if (!isRadioPlaying) {
      toggleRadio();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setRadioVolume(vol);
  };

  const toggleMute = () => {
    if (radioVolume > 0) {
      setRadioVolume(0);
    } else {
      setRadioVolume(0.8);
    }
  };

  return (
    <>
      {/* Dimmed backdrop when player or options popover is open on mobile */}
      {(isPlayerOptionsOpen || isOptionsMenuOpen) && (
        <div
          className="fixed inset-0 z-[440] bg-black/40 backdrop-blur-2xs transition-opacity"
          onClick={() => {
            setIsPlayerOptionsOpen(false);
            setIsOptionsMenuOpen(false);
          }}
          aria-hidden="true"
        />
      )}

      {/* Main Bottom Footer Bar */}
      <footer
        id="wrap_footer"
        className="fixed bottom-0 inset-x-0 w-full z-[450] select-none bg-[#012832] border-t border-white/10"
        dir="ltr"
        role="navigation"
        aria-label="الشريط السفلي للتحكم والتنقل"
      >
        <div id="menu_container" className="w-full h-[46px] max-w-[1200px] mx-auto px-1 sm:px-2 flex items-center justify-between">
          <div id="menu_container_inside" className="w-full h-full flex items-center justify-between flex-nowrap">
            
            {/* ========================================================
                ZONE 1: LEFT AREA (Radio Station Player)
               ======================================================== */}
            <div className="custom-player-area flex items-center h-[46px] shrink-0 min-w-0 relative">
              
              {/* 1.1 Volume Menu Button */}
              <button
                id="player_menu_btn"
                type="button"
                onClick={() => {
                  setIsPlayerOptionsOpen((prev) => !prev);
                  setIsOptionsMenuOpen(false);
                }}
                className="player_elem player_menu menutrig w-[40px] min-w-[40px] h-[46px] flex items-center justify-center text-white hover:text-[#03ADD8] transition-colors cursor-pointer"
                title="إعدادات الصوت والمحطات الإذاعية"
                aria-expanded={isPlayerOptionsOpen}
                aria-controls="player_options"
              >
                <i
                  className={`fa ${
                    radioVolume === 0
                      ? 'fa-volume-mute text-amber-400'
                      : radioVolume < 0.5
                      ? 'fa-volume-down'
                      : 'fa-volume-up'
                  } text-[18px]`}
                />
              </button>

              {/* 1.2 Play / Pause Button */}
              <button
                id="player_actual_status"
                type="button"
                onClick={toggleRadio}
                className="player_elem w-[36px] min-w-[36px] h-[46px] flex items-center justify-center text-white hover:text-emerald-400 transition-colors cursor-pointer"
                title={isRadioPlaying ? 'إيقاف تشغيل المحطة' : 'تشغيل المحطة الحالية'}
                aria-label={isRadioPlaying ? 'إيقاف المحطة' : 'تشغيل المحطة'}
              >
                <i
                  className={`fa ${
                    isRadioPlaying
                      ? 'fa-pause-circle text-emerald-400 animate-pulse'
                      : 'fa-play-circle text-white'
                  } text-[30px]`}
                />
              </button>

              {/* 1.3 Current Station Info (Two lines: "محطة" in #03ADD8, Station name in White) */}
              <div
                id="current_player"
                onClick={() => {
                  setIsPlayerOptionsOpen((prev) => !prev);
                  setIsOptionsMenuOpen(false);
                }}
                className="h-[46px] flex flex-col justify-center px-[5px] cursor-pointer hover:opacity-90 transition-opacity min-w-0 max-w-[110px] sm:max-w-[170px] md:max-w-[240px]"
                dir="rtl"
                title={`المحطة الحالية: ${currentStation.name} (انقر لتغيير المحطة)`}
              >
                <span className="player_tag text-[11px] font-bold text-[#03ADD8] leading-tight select-none">
                  محطة
                </span>
                <span className="player_name text-[13px] font-bold text-white leading-tight truncate select-none">
                  {currentStation.name}
                </span>
              </div>

              {/* 1.4 Radio Options Popover (#player_options) */}
              {isPlayerOptionsOpen && (
                <div
                  ref={playerMenuRef}
                  id="player_options"
                  className="absolute bottom-[52px] left-0 sm:left-1 w-[310px] max-w-[calc(100vw-16px)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-3.5 z-[500] text-right dir-rtl animate-in slide-in-from-bottom-2 duration-150"
                  dir="rtl"
                >
                  {/* Popover Header */}
                  <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#012832] flex items-center justify-center text-[#03ADD8]">
                        <i className="fa fa-broadcast-tower text-xs" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-white">المحطات الإذاعية والصوت</h4>
                        <p className="text-[10px] text-slate-400">تحكم بالبث المباشر ومستوى الصوت</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPlayerOptionsOpen(false)}
                      className="w-6 h-6 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors text-xs cursor-pointer"
                      title="إغلاق"
                    >
                      <i className="fa fa-times" />
                    </button>
                  </div>

                  {/* Volume Slider Control */}
                  <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 mb-3">
                    <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 mb-1.5">
                      <span className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={toggleMute}
                          className="text-[#03ADD8] hover:text-cyan-300 transition-colors cursor-pointer"
                          title={radioVolume === 0 ? 'إلغاء الكتم' : 'كتم الصوت'}
                        >
                          <i
                            className={`fa ${
                              radioVolume === 0
                                ? 'fa-volume-mute text-amber-400'
                                : radioVolume < 0.5
                                ? 'fa-volume-down'
                                : 'fa-volume-up'
                            }`}
                          />
                        </button>
                        <span>مستوى الصوت:</span>
                      </span>
                      <span className="text-[#03ADD8] font-mono">{Math.round(radioVolume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.02"
                      value={radioVolume}
                      onChange={handleVolumeChange}
                      className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#03ADD8]"
                    />
                  </div>

                  {/* Stations List */}
                  <div className="space-y-1 max-h-[190px] overflow-y-auto pr-0.5 custom-scrollbar">
                    <span className="text-[10px] font-bold text-slate-400 px-1 mb-1 block">اختر محطة للبث المباشر:</span>
                    {RADIO_STATIONS.map((station) => {
                      const isSelected = station.id === radioStationId;
                      return (
                        <button
                          key={station.id}
                          type="button"
                          onClick={() => handleStationSelect(station.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-xl text-right transition-colors cursor-pointer border ${
                            isSelected
                              ? 'bg-[#012832] border-[#03ADD8]/60 text-white shadow-xs'
                              : 'bg-slate-800/40 border-transparent text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? 'bg-[#03ADD8] text-[#012832]'
                                  : 'bg-slate-700/60 text-slate-400'
                              }`}
                            >
                              <i
                                className={`fa ${
                                  isSelected && isRadioPlaying ? 'fa-play text-xs animate-pulse' : 'fa-music text-xs'
                                }`}
                              />
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-bold block truncate">{station.name}</span>
                              <span className="text-[10px] text-slate-400 block truncate">{station.category}</span>
                            </div>
                          </div>
                          {isSelected && isRadioPlaying && (
                            <span className="flex h-2 w-2 relative shrink-0 mr-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Open Extended Radio Modal Action */}
                  <div className="pt-2.5 mt-2 border-t border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setIsPlayerOptionsOpen(false);
                        setIsRadioModalOpen(true);
                      }}
                      className="text-[11px] font-bold text-[#03ADD8] hover:text-cyan-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <i className="fa fa-expand text-[10px]" />
                      <span>عرض المشغل الكامل</span>
                    </button>
                    <span className="text-[10px] text-slate-500">جودة البث: 128kbps</span>
                  </div>
                </div>
              )}

            </div>

            {/* ========================================================
                ZONE 2: RIGHT AREA (Navigation Buttons - #my_menu)
               ======================================================== */}
            <div className="flex items-center shrink-0 relative">
              <ul id="my_menu" className="flex items-center list-none p-0 m-0 h-[46px]" dir="ltr">
                
                {/* 2.1 خيارات (Options Button - 45px - ArabSyemen Reference: calls editProfile()) */}
                <li className="w-[45px] h-[46px]">
                  <div
                    id="btn_options"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setIsPlayerOptionsOpen(false);
                      setIsRoomsListOpen(false);
                      setIsOnlineListOpen(false);
                      if (typeof window !== 'undefined' && typeof (window as any).editProfile === 'function') {
                        (window as any).editProfile();
                      } else {
                        setIsProfileSettingsOpen(true);
                      }
                    }}
                    className="chat_footer_item nav_menu_btn w-[45px] h-[46px] cursor-pointer"
                    title="خيارات الحساب والتعديل"
                  >
                    <i className="i_btm fa fa-cog text-[20px]" />
                    <p style={{ fontSize: '12px' }} className="m-0 leading-tight">خيارات</p>
                  </div>
                </li>

                {/* 2.2 الغرف (Rooms Button - 45px) */}
                <li className="w-[45px] h-[46px]">
                  <button
                    id="btn_rooms"
                    type="button"
                    onClick={() => {
                      setIsRoomsListOpen(!isRoomsListOpen);
                      setIsOnlineListOpen(false);
                      setIsOptionsMenuOpen(false);
                      setIsPlayerOptionsOpen(false);
                    }}
                    className={`nav_menu_btn w-[45px] h-[46px] ${isRoomsListOpen ? 'active' : ''}`}
                    title={`قائمة الغرف المتاحة (${rooms?.length || 1}) - الحالية: ${currentRoom.name}`}
                    aria-label="قائمة الغرف"
                  >
                    <div className="relative flex items-center justify-center">
                      <i className="fa fa-home text-[18px]" />
                      <span className="nav_badge bg-sky-600 text-white border border-sky-400/40">
                        {rooms?.length || 1}
                      </span>
                    </div>
                    <span className="nav_btn_label text-[11px] leading-tight font-bold">الغرف</span>
                  </button>
                </li>

                {/* 2.3 المتواجدين (Online Users Button - 45px) */}
                <li className="w-[45px] h-[46px]">
                  <button
                    id="btn_users"
                    type="button"
                    onClick={() => {
                      setIsOnlineListOpen(!isOnlineListOpen);
                      setIsRoomsListOpen(false);
                      setIsOptionsMenuOpen(false);
                      setIsPlayerOptionsOpen(false);
                    }}
                    className={`nav_menu_btn w-[45px] h-[46px] ${isOnlineListOpen ? 'active' : ''}`}
                    title={`المتواجدون في الغرفة (${currentRoomOnlineUsers.length})`}
                    aria-label="المتواجدون في الغرفة"
                  >
                    <div className="relative flex items-center justify-center">
                      <i className="fa fa-users text-[18px]" />
                      <span className="nav_badge bg-amber-500 text-slate-950 font-black">
                        {currentRoomOnlineUsers.length}
                      </span>
                    </div>
                    <span className="nav_btn_label text-[11px] leading-tight font-bold">المتواجدين</span>
                  </button>
                </li>

              </ul>

              {/* 2.4 Options Popover (#options_menu_popover) */}
              {isOptionsMenuOpen && (
                <div
                  ref={optionsMenuRef}
                  id="options_menu_popover"
                  className="absolute bottom-[52px] right-0 sm:right-1 w-[260px] max-w-[calc(100vw-16px)] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2.5 z-[500] text-right dir-rtl animate-in slide-in-from-bottom-2 duration-150"
                  dir="rtl"
                >
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <i className="fa fa-sliders-h text-[#03ADD8]" />
                      <span>خيارات سريعة</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsOptionsMenuOpen(false)}
                      className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center text-[10px] cursor-pointer"
                      title="إغلاق"
                    >
                      <i className="fa fa-times" />
                    </button>
                  </div>

                  <div className="space-y-1">
                    {/* الملف الشخصي */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileSettingsOpen(true);
                        setIsOptionsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-right cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0">
                        <i className="fa fa-user text-xs" />
                      </div>
                      <span className="text-xs font-bold">الملف الشخصي والحساب</span>
                    </button>

                    {/* سجل رسائل الغرفة */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsRoomLogsOpen(true);
                        setIsOptionsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-right cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
                        <i className="fa fa-history text-xs" />
                      </div>
                      <span className="text-xs font-bold">سجل رسائل الغرفة</span>
                    </button>

                    {/* المتجر والرموز التعبيرية */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsStoreOpen(true);
                        setIsOptionsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-right cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                        <i className="fa fa-shopping-basket text-xs" />
                      </div>
                      <span className="text-xs font-bold">المتجر والرموز التعبيرية</span>
                    </button>

                    {/* الحائط والأخبار */}
                    <button
                      type="button"
                      onClick={() => {
                        setSideMenuInitialView('news');
                        setIsSideMenuOpen(true);
                        setIsOptionsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-right cursor-pointer"
                    >
                      <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center shrink-0">
                        <i className="fa fa-newspaper text-xs" />
                      </div>
                      <span className="text-xs font-bold">الحائط ونشرات الأخبار</span>
                    </button>

                    {/* تبديل الوضع الليلي / الفاتح */}
                    <button
                      type="button"
                      onClick={() => {
                        const nextTheme: ThemeMode = themeMode === 'dark' ? 'light' : 'dark';
                        setThemeMode(nextTheme);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-200 hover:bg-slate-800 hover:text-white transition-colors text-right cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center shrink-0">
                          <i className={`fa ${themeMode === 'dark' ? 'fa-moon' : 'fa-sun'} text-xs`} />
                        </div>
                        <span className="text-xs font-bold">المظهر (ليلي / فاتح)</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 font-mono">
                        {themeMode === 'dark' ? 'ليلي' : 'فاتح'}
                      </span>
                    </button>

                    {/* إعدادات الغرفة (للمشرفين) */}
                    {currentUserCan('manage_rooms') && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsRoomSettingsOpen(true);
                          setIsOptionsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-amber-200 hover:bg-amber-950/40 transition-colors text-right cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                          <i className="fa fa-door-open text-xs" />
                        </div>
                        <span className="text-xs font-bold">إعدادات الغرفة الحالية</span>
                      </button>
                    )}

                    {/* لوحة تحكم المالك */}
                    {isPrimaryOwner(currentUser) && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOwnerDashboardOpen(true);
                          setIsOptionsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-200 bg-rose-950/30 hover:bg-rose-950/60 transition-colors text-right cursor-pointer border border-rose-900/40"
                      >
                        <div className="w-6 h-6 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                          <i className="fa fa-shield-alt text-xs" />
                        </div>
                        <span className="text-xs font-black">لوحة تحكم المالك 👑</span>
                      </button>
                    )}

                    {/* تسجيل الخروج */}
                    <div className="pt-1 mt-1 border-t border-slate-800/80">
                      <button
                        type="button"
                        onClick={() => {
                          setIsLogoutConfirmOpen(true);
                          setIsOptionsMenuOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 transition-colors text-right cursor-pointer"
                      >
                        <div className="w-6 h-6 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
                          <i className="fa fa-sign-out-alt text-xs" />
                        </div>
                        <span className="text-xs font-bold">تسجيل الخروج</span>
                      </button>
                    </div>

                  </div>
                </div>
              )}

            </div>

            {/* ========================================================
                3. ARABSYEMEN MINIMIZED PRIVATE CHAT: #dpriv
               ======================================================== */}
            <div
              id="dpriv"
              role="button"
              tabIndex={0}
              onClick={() => {
                if (typeof window !== 'undefined' && typeof (window as any).togglePrivate === 'function') {
                  (window as any).togglePrivate(2);
                } else {
                  setIsPrivateMinimized(false);
                  setIsPrivateChatOpen(true);
                }
              }}
              className={`chat_footer_item cursor-pointer select-none transition-transform active:scale-95 ${
                !isPrivateMinimized ? 'privhide' : ''
              }`}
              title={`محادثة خاصة مصغرة مع ${minimizedUser?.username || 'العضو'} (انقر للفتح)`}
              style={{ display: isPrivateMinimized ? 'flex' : 'none' }}
              aria-label="محادثة خاصة مصغرة"
            >
              <img
                id="dpriv_av"
                className="avatar_default"
                src={minimizedUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                alt={minimizedUser?.username || 'محادثة خاصة'}
              />
              {minimizedUnreadCount > 0 && (
                <span id="dpriv_notify" className="dpriv_notify">
                  {minimizedUnreadCount > 99 ? '99+' : minimizedUnreadCount}
                </span>
              )}
            </div>

          </div>
        </div>
      </footer>
    </>
  );
};
