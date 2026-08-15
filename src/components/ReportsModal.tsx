import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Report, User } from '../types';
import { UserAvatar } from './UserAvatar';
import { playChatSound } from '../utils/audio';
import { toEnglishDigits } from '../utils/dateUtils';
import {
  X, Flag, VolumeX, UserX, Trash2, CheckCircle, BellRing, Clock, ShieldAlert, Zap,
  Users, UserPlus, Home, Search
} from 'lucide-react';

export const ReportsModal: React.FC = () => {
  const {
    reports, setIsReportsOpen, currentUser, users,
    deleteReport, moderatorAction, deleteMessage,
    setSelectedUserForCard, setSelectedUserForProfile,
    showTopBanner, audioSettings, updateAudioSettings
  } = useChat();

  // Selected report for detail popup (Matching Image 2 / Detail view)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // State when clicking "حذف" in Chat Report to reveal Mute & Kick action buttons
  const [showModerationActions, setShowModerationActions] = useState(false);
  const [muteDuration, setMuteDuration] = useState<number>(15); // Default 15 minutes
  const [kickDuration, setKickDuration] = useState<number>(60); // Default 60 minutes (1 hour)

  if (!currentUser) return null;

  // Strict role requirement: Only visible to management/moderators
  const isAllowed = ['moderator', 'management', 'admin', 'owner'].includes(currentUser.role);
  if (!isAllowed) return null;

  const getReportTypeLabel = (rep: Report): string => {
    if (rep.type === 'profile' || rep.reason?.includes('بروفايل') || rep.details?.includes('بروفايل')) {
      return 'ابلاغ بروفايل';
    }
    if (rep.type === 'private' || rep.reason?.includes('خاص') || rep.details?.includes('خاص')) {
      return 'ابلاغ رسالة خاص';
    }
    return 'تقرير عن منشور في الدردشة';
  };

  const getReportedUser = (rep: Report): User | null => {
    return users.find(u => u.id === rep.reportedUserId || u.username === rep.reportedUserName) || null;
  };

  // Handler for "لا شيء" button (Deletes report & removes from white flag)
  const handleCancelReport = (reportId: string) => {
    deleteReport(reportId);
    showTopBanner('🕊️ تم حذف البلاغ ومحوه من القائمة');
    setSelectedReport(null);
    setShowModerationActions(false);
  };

  // Handler for "الأمر" button (Private report action - opens target user card for execution)
  const handleExecuteCommandOnUser = (rep: Report) => {
    const targetUser = getReportedUser(rep);
    if (targetUser) {
      setSelectedUserForCard(targetUser);
    } else {
      showTopBanner(`👤 أداء الأمر على المستخدم (${rep.reportedUserName})`);
    }
    deleteReport(rep.id);
    setSelectedReport(null);
    setShowModerationActions(false);
  };

  // Handler for "حذف" button in Chat Post Report
  const handleDeleteChatPost = (rep: Report) => {
    if (rep.details && rep.details.startsWith('msg-')) {
      deleteMessage(rep.details);
    }
    setShowModerationActions(true);
    showTopBanner('🗑️ تم حذف الرسالة وتفعيل خيارات الكتم والطرد');
  };

  // Handler for Mute action
  const handleExecuteMute = (rep: Report) => {
    moderatorAction(
      rep.reportedUserId,
      'mute',
      muteDuration,
      `بلاغ (${rep.reason}): ${rep.messageText}`
    );
    deleteReport(rep.id);
    showTopBanner(`🔇 تم كتم المستخدم "${rep.reportedUserName}" لمدة ${muteDuration} دقيقة وإغلاق البلاغ`);
    setSelectedReport(null);
    setShowModerationActions(false);
  };

  // Handler for Kick/Ban action
  const handleExecuteKick = (rep: Report) => {
    const isBan = kickDuration > 100000;
    moderatorAction(
      rep.reportedUserId,
      isBan ? 'ban' : 'kick',
      kickDuration,
      `بلاغ (${rep.reason}): ${rep.messageText}`
    );
    deleteReport(rep.id);
    showTopBanner(
      isBan
        ? `⛔ تم حظر المستخدم "${rep.reportedUserName}" دائمًا وإغلاق البلاغ`
        : `🛑 تم طرد المستخدم "${rep.reportedUserName}" لمدة ${kickDuration === 60 ? 'ساعة' : '24 ساعة'} وإغلاق البلاغ`
    );
    setSelectedReport(null);
    setShowModerationActions(false);
  };

  // Handler for Profile Report click
  const handleProfileReportClick = (rep: Report) => {
    const targetUser = getReportedUser(rep);
    if (targetUser) {
      setSelectedUserForProfile(targetUser);
      deleteReport(rep.id);
      showTopBanner(`👤 فتح الملف الشخصي للمبلغ عنه (${targetUser.username})`);
    } else {
      setSelectedReport(rep);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-150 dir-rtl font-sans select-none text-slate-800">
      
      {/* MAIN "العلم الأبيض" LIST MODAL (Exact Replica of Provided Screenshot) */}
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* HEADER TOOLBAR (Matching Screenshot Header Bar) */}
        <div className="bg-white px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
          {/* Top Left (RTL end): Close (✕) button */}
          <button
            onClick={() => setIsReportsOpen(false)}
            className="text-slate-800 hover:text-red-600 transition-colors cursor-pointer p-1"
            title="إغلاق"
          >
            <X className="w-6 h-6 stroke-[3]" />
          </button>

          {/* Top Right (RTL start): Action Icons (👥 👤+ 🏠 🔍) */}
          <div className="flex items-center gap-4 text-slate-800">
            <Users className="w-5 h-5 stroke-[2.2] hover:text-sky-600 transition-colors cursor-pointer" title="المتواجدون" />
            <UserPlus className="w-5 h-5 stroke-[2.2] hover:text-sky-600 transition-colors cursor-pointer" title="إضافة صديق" />
            <Home className="w-5 h-5 stroke-[2.2] hover:text-sky-600 transition-colors cursor-pointer" title="الغرف" />
            <Search className="w-5 h-5 stroke-[2.2] hover:text-sky-600 transition-colors cursor-pointer" title="بحث" />
          </div>
        </div>

        {/* REPORTS LIST AREA (Matching Screenshot Exact Layout) */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar bg-white min-h-[300px]">
          {reports.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-emerald-600 flex items-center justify-center mx-auto border border-slate-200">
                <CheckCircle className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-600">
                لا توجد بلاغات حالياً في العلم الأبيض! الغرفة آمنة 🕊️
              </p>
            </div>
          ) : (
            reports.map((rep) => {
              const reportedUser = getReportedUser(rep);
              const reportTypeLabel = getReportTypeLabel(rep);
              const isTom = rep.reportedUserName === 'Tom33';

              return (
                <div
                  key={rep.id}
                  onClick={() => {
                    if (reportTypeLabel === 'ابلاغ بروفايل') {
                      handleProfileReportClick(rep);
                    } else {
                      setSelectedReport(rep);
                      setShowModerationActions(false);
                    }
                  }}
                  className="p-4 hover:bg-slate-50/80 transition-colors cursor-pointer flex items-center justify-end gap-3.5 group"
                >
                  {/* Text Details Area (Aligned to the Right) */}
                  <div className="flex-1 min-w-0 space-y-0.5 text-right">
                    {/* Line 1: User Name (Orange for Tom33, Dark Slate for others) */}
                    <p className={`text-base font-black truncate transition-colors ${
                      isTom ? 'text-[#ea580c]' : 'text-slate-800 group-hover:text-sky-700'
                    }`}>
                      {rep.reportedUserName || rep.reporterName}
                    </p>

                    {/* Line 2: Report Type Label (تقرير عن منشور في الدردشة / ابلاغ بروفايل / ابلاغ رسالة خاص) */}
                    <p className="text-sm text-slate-700 font-bold leading-snug">
                      {reportTypeLabel}
                    </p>

                    {/* Line 3: Reason (السبب - محتوى غير مناسب / احتيال / كلام مسيء) */}
                    <p className="text-xs text-slate-500 font-medium pt-0.5">
                      السبب - {rep.reason || 'محتوى غير مناسب'}
                    </p>

                    {/* Line 4: Date & Time (21:01 11/08) */}
                    <p className="text-xs text-slate-400 font-semibold pt-1 font-sans text-center sm:text-right">
                      {toEnglishDigits(rep.timestamp)}
                    </p>
                  </div>

                  {/* Far Right (RTL start): User Avatar Circle */}
                  <div className="shrink-0 self-start mt-1">
                    <UserAvatar
                      avatarUrl={reportedUser?.avatar || (rep.reportedUserName === '_...........' ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' : undefined)}
                      gender={reportedUser?.gender || 'female'}
                      role={reportedUser?.role || 'user'}
                      username={rep.reportedUserName || rep.reporterName}
                      size="md"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* DETAILED REPORT ACTION MODAL OVERLAY ( Matching Image 2 ) */}
      {selectedReport && (
        <div className="fixed inset-0 z-60 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in zoom-in-95 duration-150">
          <div className="bg-[#18191c] border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl relative dir-rtl text-slate-100">
            
            {/* Modal Header Bar with Close (X) */}
            <div className="bg-[#111214] px-4 py-3 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-300 flex items-center gap-1.5">
                <Flag className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>{getReportTypeLabel(selectedReport)}</span>
              </span>

              {/* Top Right Close X Button */}
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setShowModerationActions(false);
                }}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-4 h-4 font-black" />
              </button>
            </div>

            {/* CONTENT AREA FOR PRIVATE MESSAGE REPORT (Matching Image 2) */}
            {getReportTypeLabel(selectedReport) === 'ابلاغ رسالة خاص' ? (
              <div className="p-5 space-y-6">
                
                {/* Reported Message Bubble with Avatar on Left (Matching Image 2) */}
                <div className="space-y-2">
                  <div className="flex items-start gap-3">
                    {/* User Avatar Circle */}
                    <div className="shrink-0 pt-0.5">
                      <UserAvatar
                        avatarUrl={getReportedUser(selectedReport)?.avatar}
                        gender={getReportedUser(selectedReport)?.gender || 'male'}
                        role={getReportedUser(selectedReport)?.role || 'user'}
                        username={selectedReport.reportedUserName}
                        size="md"
                      />
                    </div>

                    {/* Dark Rounded Chat Bubble */}
                    <div className="bg-[#24272c] border border-slate-700/80 p-3.5 rounded-2xl max-w-[260px] text-xs sm:text-sm text-slate-100 font-medium leading-relaxed shadow-md text-right">
                      {selectedReport.messageText}
                    </div>
                  </div>

                  {/* Time & Date below speech bubble (Matching Image 2: 19:47 11/08) */}
                  <div className="text-[11px] text-slate-400 font-mono text-center pt-1">
                    {toEnglishDigits(selectedReport.timestamp)}
                  </div>
                </div>

                {/* ACTION BUTTONS (Matching Image 2: [ الأمر ]  [ لا شيء ] ) */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  {/* Button 1: "الأمر" (Red button - Opens User Card to Execute Order) */}
                  <button
                    onClick={() => handleExecuteCommandOnUser(selectedReport)}
                    className="bg-[#c51318] hover:bg-[#d8191e] active:scale-95 text-white font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>الأمر</span>
                  </button>

                  {/* Button 2: "لا شيء" (Dark Navy button - Dismisses / Removes Report) */}
                  <button
                    onClick={() => handleCancelReport(selectedReport.id)}
                    className="bg-[#112d37] hover:bg-[#183a47] active:scale-95 text-slate-100 font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm border border-slate-700/80 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>لا شيء</span>
                  </button>
                </div>

              </div>
            ) : getReportTypeLabel(selectedReport) === 'تقرير عن منشور في الدردشة' ? (
              /* CONTENT AREA FOR CHAT POST REPORT (تقرير عن منشور في الدردشة) */
              <div className="p-5 space-y-4">
                
                {/* User Photo & Name on Right, Date & Time on Left */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  {/* Left Side: Time and Date */}
                  <div className="text-[11px] text-slate-400 font-mono dir-ltr flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{toEnglishDigits(selectedReport.timestamp)}</span>
                  </div>

                  {/* Right Side: User Name and Photo */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">
                      {selectedReport.reportedUserName}
                    </span>
                    <UserAvatar
                      avatarUrl={getReportedUser(selectedReport)?.avatar}
                      gender={getReportedUser(selectedReport)?.gender || 'male'}
                      role={getReportedUser(selectedReport)?.role || 'user'}
                      username={selectedReport.reportedUserName}
                      size="md"
                    />
                  </div>
                </div>

                {/* Reported Message Content */}
                <div className="bg-[#202225] border border-slate-800 p-3.5 rounded-2xl text-xs sm:text-sm text-slate-100 font-medium leading-relaxed max-h-36 overflow-y-auto custom-scrollbar text-right shadow-inner">
                  {selectedReport.messageText}
                </div>

                {/* MODERATION ACTION BUTTONS AFTER CLICKING "حذف" */}
                {showModerationActions ? (
                  <div className="bg-[#202225] border border-red-900/40 p-3 rounded-2xl space-y-3 animate-in fade-in duration-150">
                    <p className="text-xs font-black text-red-400">
                      اختر عقوبة الكتم أو الطرد ضد ({selectedReport.reportedUserName}):
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      {/* Mute Button */}
                      <div className="space-y-1.5">
                        <select
                          value={muteDuration}
                          onChange={(e) => setMuteDuration(Number(e.target.value))}
                          className="w-full bg-[#18191c] border border-slate-700 text-slate-200 text-[11px] rounded-xl px-2 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value={15}>15 دقيقة</option>
                          <option value={60}>1 ساعة</option>
                          <option value={1440}>24 ساعة</option>
                        </select>
                        <button
                          onClick={() => handleExecuteMute(selectedReport)}
                          className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-black py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                        >
                          <VolumeX className="w-3.5 h-3.5" />
                          <span>كتم</span>
                        </button>
                      </div>

                      {/* Kick Button */}
                      <div className="space-y-1.5">
                        <select
                          value={kickDuration}
                          onChange={(e) => setKickDuration(Number(e.target.value))}
                          className="w-full bg-[#18191c] border border-slate-700 text-slate-200 text-[11px] rounded-xl px-2 py-1 focus:outline-none cursor-pointer"
                        >
                          <option value={60}>طرد (1 ساعة)</option>
                          <option value={1440}>طرد (24 ساعة)</option>
                          <option value={999999}>حظر دائم ⛔</option>
                        </select>
                        <button
                          onClick={() => handleExecuteKick(selectedReport)}
                          className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-sm"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>طرد</span>
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCancelReport(selectedReport.id)}
                      className="w-full text-center text-xs text-slate-400 hover:text-white pt-1 cursor-pointer"
                    >
                      إغلاق البلاغ
                    </button>
                  </div>
                ) : (
                  /* Action Buttons: [ حذف ]  [ لا شيء ] */
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {/* Button 1: "حذف" (Deletes message and shows Mute/Kick buttons) */}
                    <button
                      onClick={() => handleDeleteChatPost(selectedReport)}
                      className="bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>حذف</span>
                    </button>

                    {/* Button 2: "لا شيء" (Deletes report from white flag) */}
                    <button
                      onClick={() => handleCancelReport(selectedReport.id)}
                      className="bg-[#112d37] hover:bg-[#183a47] active:scale-95 text-slate-100 font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm border border-slate-700 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>لا شيء</span>
                    </button>
                  </div>
                )}

              </div>
            ) : (
              /* CONTENT AREA FOR PROFILE REPORT (ابلاغ بروفايل) */
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-[11px] text-slate-400 font-mono">{selectedReport.timestamp}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-white">{selectedReport.reportedUserName}</span>
                    <UserAvatar
                      avatarUrl={getReportedUser(selectedReport)?.avatar}
                      gender={getReportedUser(selectedReport)?.gender || 'male'}
                      role={getReportedUser(selectedReport)?.role || 'user'}
                      username={selectedReport.reportedUserName}
                      size="md"
                    />
                  </div>
                </div>

                <div className="bg-[#202225] p-3 rounded-2xl text-xs text-slate-200">
                  <p className="font-bold text-amber-400 mb-1">سبب الإبلاغ عن البروفايل:</p>
                  <p>{selectedReport.reason} - {selectedReport.messageText}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={() => {
                      const targetUser = getReportedUser(selectedReport);
                      if (targetUser) setSelectedUserForProfile(targetUser);
                      setSelectedReport(null);
                    }}
                    className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer"
                  >
                    عرض الملف الشخصي
                  </button>

                  <button
                    onClick={() => handleCancelReport(selectedReport.id)}
                    className="bg-[#112d37] hover:bg-[#183a47] text-slate-100 font-black py-2.5 px-4 rounded-xl text-xs sm:text-sm border border-slate-700 shadow-md transition-all cursor-pointer"
                  >
                    لا شيء
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
