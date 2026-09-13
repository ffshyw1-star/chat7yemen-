import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Radio, Zap, VolumeX, Users, Coins, Lock, Unlock,
  Trash2, RefreshCw, AlertTriangle, CheckCircle2, Shield, Loader2
} from 'lucide-react';

export const ActionsView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const {
    broadcastAudioAlert,
    purgeSystemCache,
    setUsers,
    users,
    setRooms,
    rooms
  } = useChat();

  const [broadcastTitle, setBroadcastTitle] = useState('تنبيه إداري عام 📢');
  const [broadcastText, setBroadcastText] = useState('يرجى من جميع الأعضاء والزوار الالتزام بالقوانين وعدم نشر الإعلانات.');
  const [allRoomsLocked, setAllRoomsLocked] = useState(false);
  const [isOperating, setIsOperating] = useState<string | null>(null);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim() || isOperating) return;
    setIsOperating('broadcast');
    try {
      broadcastAudioAlert(`${broadcastTitle}: ${broadcastText}`);
      showToast('تم بث التنبيه الصوتي والكتابي لجميع المتواجدين 📢');
    } catch (err) {
      console.error('Failed to broadcast alert:', err);
      showToast('⚠️ فشل بث التنبيه');
    } finally {
      setIsOperating(null);
    }
  };

  const handlePurgeCache = async () => {
    if (isOperating) return;
    setIsOperating('cache');
    try {
      purgeSystemCache();
      showToast('تم تفريغ الذاكرة المؤقتة (Cache) بنجاح ⚡');
    } catch (err) {
      console.error('Failed to purge cache:', err);
      showToast('⚠️ فشل تفريغ الذاكرة المؤقتة');
    } finally {
      setIsOperating(null);
    }
  };

  const handleMassKickVisitors = async () => {
    if (isOperating) return;
    if (window.confirm('هل أنت متأكد من طرد جميع الزوار المتصلين حالياً؟')) {
      setIsOperating('kick_visitors');
      try {
        setUsers(prev => prev.filter(u => u.role !== 'visitor'));
        showToast('تم طرد جميع الزوار وإنهاء جلساتهم 🚪');
      } catch (err) {
        console.error('Failed to kick visitors:', err);
        showToast('⚠️ فشل طرد الزوار');
      } finally {
        setIsOperating(null);
      }
    }
  };

  const handleMassMuteVisitors = async () => {
    if (isOperating) return;
    if (window.confirm('هل تريد كتم جميع حسابات الزوار مؤقتاً؟')) {
      setIsOperating('mute_visitors');
      try {
        setUsers(prev => prev.map(u => u.role === 'visitor' ? { ...u, isMuted: true } : u));
        showToast('تم كتم جميع حسابات الزوار 🔇');
      } catch (err) {
        console.error('Failed to mute visitors:', err);
        showToast('⚠️ فشل كتم الزوار');
      } finally {
        setIsOperating(null);
      }
    }
  };

  const handleToggleLockAllRooms = async () => {
    if (isOperating) return;
    setIsOperating('toggle_lock');
    try {
      const nextState = !allRoomsLocked;
      setAllRoomsLocked(nextState);
      setRooms(prev => prev.map(r => ({ ...r, isLocked: nextState })));
      showToast(nextState ? 'تم قفل جميع الغرف 🔒' : 'تم فتح جميع الغرف 🔓');
    } catch (err) {
      console.error('Failed to toggle lock all rooms:', err);
      showToast('⚠️ فشل تعديل قفل الغرف');
    } finally {
      setIsOperating(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <Zap className="w-4 h-4 text-amber-500" />
          <span>لوحة الإجراءات الإدارية السريعة (Quick Admin Actions)</span>
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          تنفيذ أوامر جماعية فورية تؤثر على جميع الغرف والمتصلين
        </p>
      </div>

      {/* Broadcast Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-rose-600" />
          <span>بث تنبيه صوتي وإداري عام (Live Broadcast Alert)</span>
        </h4>

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
            <label className="font-bold text-slate-600 block mb-1">نص الرسالة المنطوقة والمكتوبة لكافة الأعضاء:</label>
            <textarea
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 font-bold"
            />
          </div>

          <button
            type="submit"
            disabled={Boolean(isOperating)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-lg shadow-xs cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isOperating === 'broadcast' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radio className="w-4 h-4" />}
            <span>{isOperating === 'broadcast' ? 'جاري البث...' : 'بث التنبيه الصوتي الآن 📢'}</span>
          </button>
        </form>
      </div>

      {/* Mass Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-800">طرد جماعي للزوار</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">إنهاء جلسات جميع الزوار غير المسجلين فوراً</p>
          </div>
          <button
            onClick={handleMassKickVisitors}
            disabled={Boolean(isOperating)}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isOperating === 'kick_visitors' && <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-700" />}
            <span>طرد الزوار 🚪</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-800">كتم جماعي للزوار</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">منع جميع الزوار من الكتابة مؤقتاً</p>
          </div>
          <button
            onClick={handleMassMuteVisitors}
            disabled={Boolean(isOperating)}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isOperating === 'mute_visitors' && <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-700" />}
            <span>كتم الزوار 🔇</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-800">{allRoomsLocked ? 'فتح جميع الغرف' : 'قفل جميع الغرف'}</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">تغيير حالة الإغلاق لكافة الغرف بضغطة واحدة</p>
          </div>
          <button
            onClick={handleToggleLockAllRooms}
            disabled={Boolean(isOperating)}
            className={`px-3.5 py-2 font-bold text-xs rounded-xl cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ${
              allRoomsLocked
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                : 'bg-purple-50 hover:bg-purple-100 text-purple-700'
            }`}
          >
            {isOperating === 'toggle_lock' && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{allRoomsLocked ? 'فتح الغرف 🔓' : 'قفل الغرف 🔒'}</span>
          </button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-800">مسح كاش السيرفر</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">تفريغ الذاكرة وتحديث حالة المتصلين</p>
          </div>
          <button
            onClick={handlePurgeCache}
            disabled={Boolean(isOperating)}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl cursor-pointer shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {isOperating === 'cache' && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-700" />}
            <span>تفريغ الكاش ⚡</span>
          </button>
        </div>
      </div>
    </div>
  );
};
