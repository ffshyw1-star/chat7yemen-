import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  PlayCircle, Plus, Trash2, Volume2, Music, Youtube,
  Radio, Sliders, CheckCircle2, Play, Pause, Save
} from 'lucide-react';

export const MusicView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [playlist, setPlaylist] = useState([
    { id: 'm1', title: 'شيلة يمنية طرب - تراث صنعاء', url: 'https://youtube.com/watch?v=sample1', duration: '3:45' },
    { id: 'm2', title: 'موسيقى هادئة للاسترخاء والدردشة', url: 'https://youtube.com/watch?v=sample2', duration: '5:10' },
    { id: 'm3', title: 'عزف عود يمني أصيل - روقان', url: 'https://youtube.com/watch?v=sample3', duration: '4:20' },
  ]);

  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [autoPlayBackground, setAutoPlayBackground] = useState(false);
  const [defaultVolume, setDefaultVolume] = useState(70);
  const [allowMemberRequests, setAllowMemberRequests] = useState(true);

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setPlaylist(prev => [
      ...prev,
      {
        id: `m-${Date.now()}`,
        title: newTitle.trim(),
        url: newUrl.trim() || 'https://youtube.com/watch?v=sample',
        duration: '3:30'
      }
    ]);
    setNewTitle('');
    setNewUrl('');
    showToast('تمت إضافة المقطع إلى قائمة تشغيل الموقع 🎵');
  };

  const handleDeleteTrack = (id: string) => {
    setPlaylist(prev => prev.filter(t => t.id !== id));
    showToast('تم حذف المقطع من القائمة 🗑️');
  };

  const handleSaveSettings = () => {
    showToast('تم حفظ إعدادات مشغلات الموسيقى واليوتيوب 💾');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <PlayCircle className="w-4 h-4 text-emerald-600" />
            <span>مشغلات الموسيقى وقوائم اليوتيوب التشاركية</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            إدارة الأغاني التلقائية في الغرف، وخيارات مشغل الخلفية ومستوى الصوت الافتراضي
          </p>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>حفظ الإعدادات 💾</span>
        </button>
      </div>

      {/* Settings Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="font-bold text-slate-800 block text-xs">تشغيل تلقائي في الخلفية عند الدخول</span>
            <span className="text-[11px] text-slate-500">بدء تشغيل القائمة تلقائياً للأعضاء الجدد</span>
          </div>
          <button
            onClick={() => setAutoPlayBackground(!autoPlayBackground)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              autoPlayBackground ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
              autoPlayBackground ? 'right-0.5' : 'left-0.5'
            }`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div>
            <span className="font-bold text-slate-800 block text-xs">السماح للأعضاء باقتراح مقاطع</span>
            <span className="text-[11px] text-slate-500">إظهار زر طلب مقطع يوتيوب بالدردشة</span>
          </div>
          <button
            onClick={() => setAllowMemberRequests(!allowMemberRequests)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
              allowMemberRequests ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
              allowMemberRequests ? 'right-0.5' : 'left-0.5'
            }`} />
          </button>
        </div>
      </div>

      {/* Add Track Form */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <h4 className="text-xs font-black text-slate-800 mb-3 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>إضافة مقطع صوتي أو رابط يوتيوب جديد</span>
        </h4>
        <form onSubmit={handleAddTrack} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            placeholder="عنوان المقطع *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold"
          />
          <input
            type="text"
            placeholder="رابط يوتيوب أو MP3 (https://...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-xs"
          >
            إضافة للقائمة 🎵
          </button>
        </form>
      </div>

      {/* Tracks List */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
        <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">قائمة المقاطع المعتمدة ({playlist.length})</h4>
        
        {playlist.map((track, idx) => (
          <div key={track.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                {idx + 1}
              </div>
              <div>
                <h5 className="text-xs font-black text-slate-800">{track.title}</h5>
                <span className="text-[10px] text-slate-400 font-mono">{track.url} | {track.duration}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => showToast(`جارٍ تشغيل: ${track.title} 🎵`)}
                className="px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[11px] rounded-lg cursor-pointer"
              >
                تشغيل تجريبي ▶
              </button>
              <button
                onClick={() => handleDeleteTrack(track.id)}
                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                title="حذف من القائمة"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
