import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { ShieldAlert, Clock, AlertTriangle } from 'lucide-react';

export const KickedOverlayModal: React.FC = () => {
  const { currentUser } = useChat();
  const [timeLeftMs, setTimeLeftMs] = useState<number>(0);

  useEffect(() => {
    if (!currentUser?.kickUntil) {
      setTimeLeftMs(0);
      return;
    }

    const calculateTimeLeft = () => {
      const kickEndTime = new Date(currentUser.kickUntil!).getTime();
      const diff = Math.max(0, kickEndTime - Date.now());
      setTimeLeftMs(diff);
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [currentUser?.kickUntil]);

  if (!currentUser?.isKicked) return null;

  // Format HH : MM : SS
  const totalSeconds = Math.floor(timeLeftMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className="fixed inset-0 z-[99999] bg-black text-white flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
      
      {/* Dark Ambient Glow & System Emblem */}
      <div className="relative mb-6 flex flex-col items-center">
        <div className="absolute -inset-4 rounded-full bg-amber-500/20 blur-xl animate-pulse"></div>
        <div className="w-20 h-20 rounded-3xl bg-slate-950 border-2 border-amber-500/80 flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.3)] relative z-10">
          <ShieldAlert className="w-10 h-10 text-amber-400" />
        </div>
        <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/40 rounded-full text-amber-400 text-xs font-black tracking-wide">
          <span>System 🛡️</span>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
        </div>
      </div>

      {/* Main Alert Header */}
      <h1 className="text-2xl sm:text-3xl font-black text-amber-400 mb-2">
        تم طردك مؤقتاً من الدردشة
      </h1>
      <p className="text-slate-300 text-xs sm:text-sm max-w-md leading-relaxed mb-6 font-semibold">
        عذراً، تم تطبيق عقوبة الطرد المؤقت على حسابك من قِبل إدارة النظام. يمكنك العودة للدردشة والمراسلة فور انتهاء الوقت المتبقي أدناه.
      </p>

      {/* Real-time Countdown Timer Box */}
      <div className="bg-slate-950/90 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-[0_0_40px_rgba(0,0,0,0.9)] mb-6 relative overflow-hidden">
        <div className="flex items-center justify-center gap-2 text-slate-400 text-xs font-bold mb-4">
          <Clock className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
          <span>الوقت والدقيقة والثانية المتبقية للطرد</span>
        </div>

        {/* Big Digit Counters */}
        <div className="flex items-center justify-center gap-2 sm:gap-3 dir-ltr">
          {/* Hours */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-inner">
              <span className="text-2xl sm:text-4xl font-black font-mono text-amber-400">
                {pad(hours)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-bold mt-1.5">ساعة</span>
          </div>

          <span className="text-xl sm:text-2xl font-black text-amber-500/60 pb-5">:</span>

          {/* Minutes */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-inner">
              <span className="text-2xl sm:text-4xl font-black font-mono text-amber-400">
                {pad(minutes)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-bold mt-1.5">دقيقة</span>
          </div>

          <span className="text-xl sm:text-2xl font-black text-amber-500/60 pb-5">:</span>

          {/* Seconds */}
          <div className="flex flex-col items-center">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center shadow-inner">
              <span className="text-2xl sm:text-4xl font-black font-mono text-red-400 animate-pulse">
                {pad(seconds)}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-bold mt-1.5">ثانية</span>
          </div>
        </div>
      </div>

      {/* System Note */}
      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold bg-slate-900/60 px-4 py-2 rounded-2xl border border-slate-800/80">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
        <span>عند انتهاء العداد ستنفتح الدردشة تلقائياً وتتمكن من المراسلة فوراً.</span>
      </div>

    </div>
  );
};
