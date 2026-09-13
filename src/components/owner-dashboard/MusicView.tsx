import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  PlayCircle, Plus, Trash2, Volume2, Music, Youtube,
  Radio, Sliders, CheckCircle2, Play, Pause, Save, Loader2
} from 'lucide-react';

export const MusicView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const { siteSettings, updateSiteSettings } = useChat();

  const [isSaving, setIsSaving] = useState(false);
  const [isAddingTrack, setIsAddingTrack] = useState(false);
  const [isDeletingTrackId, setIsDeletingTrackId] = useState<string | null>(null);

  const [playlist, setPlaylist] = useState<{ id: string; title: string; url: string; duration: string }[]>(
    siteSettings.musicPlaylist || [
      { id: 'm1', title: 'شيلة يمنية طرب - تراث صنعاء', url: 'https://youtube.com/watch?v=sample1', duration: '3:45' },
      { id: 'm2', title: 'موسيقى هادئة للاسترخاء والدردشة', url: 'https://youtube.com/watch?v=sample2', duration: '5:10' },
      { id: 'm3', title: 'عزف عود يمني أصيل - روقان', url: 'https://youtube.com/watch?v=sample3', duration: '4:20' },
    ]
  );

  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [autoPlayBackground, setAutoPlayBackground] = useState(siteSettings.autoPlayBackgroundMusic || false);
  const [defaultVolume, setDefaultVolume] = useState(siteSettings.defaultMusicVolume || 70);
  const [allowMemberRequests, setAllowMemberRequests] = useState(siteSettings.allowMusicRequests ?? true);

  const handleAddTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || isAddingTrack || isSaving) return;
    setIsAddingTrack(true);
    try {
      const newTrack = {
        id: `m-${Date.now()}`,
        title: newTitle.trim(),
        url: newUrl.trim() || 'https://youtube.com/watch?v=sample',
        duration: '3:30'
      };
      const updated = [...playlist, newTrack];
      await updateSiteSettings({ musicPlaylist: updated });
      setPlaylist(updated);
      setNewTitle('');
      setNewUrl('');
      showToast('تمت إضافة المقطع إلى قائمة تشغيل الموقع وحفظه في السيرفر 🎵');
    } catch (err) {
      console.error('Failed to add track:', err);
      showToast('⚠️ حدث خطأ أثناء إضافة المقطع في قاعدة البيانات');
    } finally {
      setIsAddingTrack(false);
    }
  };

  const handleDeleteTrack = async (id: string) => {
    if (isDeletingTrackId || isSaving) return;
    setIsDeletingTrackId(id);
    try {
      const updated = playlist.filter(t => t.id !== id);
      await updateSiteSettings({ musicPlaylist: updated });
      setPlaylist(updated);
      showToast('تم حذف المقطع من القائمة وتحديث السيرفر 🗑️');
    } catch (err) {
      console.error('Failed to delete track:', err);
      showToast('⚠️ حدث خطأ أثناء حذف المقطع في قاعدة البيانات');
    } finally {
      setIsDeletingTrackId(null);
    }
  };

  const handleSaveSettings = async () => {
    if (isSaving || isAddingTrack || isDeletingTrackId) return;
    setIsSaving(true);
    try {
      await updateSiteSettings({
        musicPlaylist: playlist,
        autoPlayBackgroundMusic: autoPlayBackground,
        defaultMusicVolume: defaultVolume,
        allowMusicRequests: allowMemberRequests
      });
      showToast('تم حفظ إعدادات مشغلات الموسيقى واليوتيوب في قاعدة البيانات 💾');
    } catch (err) {
      console.error('Failed to save music settings:', err);
      showToast('⚠️ حدث خطأ أثناء حفظ إعدادات الموسيقى في قاعدة البيانات');
    } finally {
      setIsSaving(false);
    }
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
          disabled={isSaving || isAddingTrack || !!isDeletingTrackId}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
          <span>{isSaving ? 'جارٍ الحفظ...' : 'حفظ الإعدادات 💾'}</span>
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
            disabled={isSaving}
            onClick={() => setAutoPlayBackground(!autoPlayBackground)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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
            disabled={isSaving}
            onClick={() => setAllowMemberRequests(!allowMemberRequests)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
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
            disabled={isAddingTrack || isSaving}
            placeholder="عنوان المقطع *"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold disabled:opacity-50"
          />
          <input
            type="text"
            disabled={isAddingTrack || isSaving}
            placeholder="رابط يوتيوب أو MP3 (https://...)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isAddingTrack || isSaving}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingTrack ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
            <span>{isAddingTrack ? 'جارٍ الإضافة...' : 'إضافة للقائمة 🎵'}</span>
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
                disabled={isDeletingTrackId === track.id || isSaving}
                onClick={() => handleDeleteTrack(track.id)}
                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                title="حذف من القائمة"
              >
                {isDeletingTrackId === track.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
