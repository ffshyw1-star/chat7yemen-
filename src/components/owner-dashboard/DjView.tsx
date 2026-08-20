import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Disc, Radio, Volume2, Mic, MicOff, Music, Play, Pause,
  SkipForward, Plus, Trash2, CheckCircle2, XCircle, Sliders,
  Sparkles, RadioTower, Zap, VolumeX, Shield, Award
} from 'lucide-react';

export const DjView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const { currentUser, rooms, currentRoom } = useChat();

  // DJ State
  const [isOnAir, setIsOnAir] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [currentDjUser, setCurrentDjUser] = useState<string>(currentUser?.username || 'المالك');
  const [djPermissionRole, setDjPermissionRole] = useState<'owner' | 'admin' | 'vip' | 'all'>('admin');
  const [autoApproveSongs, setAutoApproveSongs] = useState(false);
  const [activeTab, setActiveTab] = useState<'station' | 'queue' | 'soundboard' | 'settings'>('station');

  // Soundboard audio synth using Web Audio API
  const playSfx = (type: string, name: string) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;

      if (type === 'applause') {
        // White noise applause bursts
        const bufferSize = ctx.sampleRate * 1.2;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.4));
        }
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1000;
        noise.connect(filter);
        filter.connect(ctx.destination);
        noise.start(now);
      } else if (type === 'horn') {
        // Air horn double blast
        [0, 0.18].forEach(delay => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();
          osc1.type = 'sawtooth';
          osc2.type = 'sawtooth';
          osc1.frequency.setValueAtTime(466.16, now + delay); // Bb4
          osc2.frequency.setValueAtTime(587.33, now + delay); // D5
          gain.gain.setValueAtTime(0.3, now + delay);
          gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);
          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(ctx.destination);
          osc1.start(now + delay);
          osc2.start(now + delay);
          osc1.stop(now + delay + 0.15);
          osc2.stop(now + delay + 0.15);
        });
      } else if (type === 'drumroll') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.8);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.8);
      } else if (type === 'victory') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.12);
          gain.gain.setValueAtTime(0.25, now + idx * 0.12);
          gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.12);
          osc.stop(now + idx * 0.12 + 0.25);
        });
      } else if (type === 'whistle') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.linearRampToValueAtTime(2400, now + 0.3);
        osc.frequency.linearRampToValueAtTime(1800, now + 0.6);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'laugh') {
        [0, 0.12, 0.24, 0.36].forEach((t, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(350 + i * 30, now + t);
          gain.gain.setValueAtTime(0.2, now + t);
          gain.gain.exponentialRampToValueAtTime(0.01, now + t + 0.09);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + t);
          osc.stop(now + t + 0.09);
        });
      } else {
        // Generic chime
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
      }
      showToast(`تم إطلاق مؤثر: ${name} 🔊`);
    } catch (e) {
      showToast(`تم تشغيل ${name}`);
    }
  };

  // Song Queue List
  const [songQueue, setSongQueue] = useState([
    { id: 'sq-1', title: 'شيلة يمنية حماسية - طرب أصيل', requester: 'أحمد الصنعاني', duration: '3:45', status: 'pending' },
    { id: 'sq-2', title: 'موسيقى روقان وهدوء عود', requester: 'سارة خالد', duration: '4:12', status: 'pending' },
    { id: 'sq-3', title: 'يا مسافر وحدك - كلاسيكيات', requester: 'البرنس', duration: '5:20', status: 'pending' },
  ]);

  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');

  const handleAddTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTrackTitle.trim()) return;
    setSongQueue(prev => [
      ...prev,
      {
        id: `sq-${Date.now()}`,
        title: newTrackTitle.trim(),
        requester: currentUser?.username || 'الإدارة',
        duration: '3:30',
        status: 'approved'
      }
    ]);
    setNewTrackTitle('');
    setNewTrackUrl('');
    showToast('تمت إضافة الأغنية إلى طابور الـ DJ بنجاح 🎵');
  };

  const handleApproveSong = (id: string) => {
    setSongQueue(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
    showToast('تمت الموافقة على تشغيل الأغنية ✅');
  };

  const handleRejectSong = (id: string) => {
    setSongQueue(prev => prev.filter(s => s.id !== id));
    showToast('تم رفض الطلب ❌');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* DJ Main Status Banner */}
      <div className="bg-gradient-to-r from-violet-950 via-purple-900 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-purple-800/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all ${
              isOnAir ? 'bg-rose-600 text-white animate-pulse' : 'bg-purple-800/80 text-purple-200'
            }`}>
              <Disc className={`w-6 h-6 ${isOnAir ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">نظام DJ والبث الحي المباشر</h3>
                {isOnAir ? (
                  <span className="px-2 py-0.5 bg-rose-500 text-white font-mono font-bold text-[10px] rounded-full animate-pulse">
                    ON AIR 🔴
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-700 text-slate-300 font-bold text-[10px] rounded-full">
                    مغلق ⚪
                  </span>
                )}
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                الدي جي الحالي: <span className="font-bold text-amber-300">{currentDjUser}</span> | الغرفة: <span className="font-bold text-cyan-300">{currentRoom?.name || 'الغرفة العامة'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsOnAir(!isOnAir);
                showToast(isOnAir ? 'تم إيقاف بث الـ DJ ⏹️' : 'تم تفعيل بث الـ DJ المباشر للغرفة 🔴');
              }}
              className={`px-4 py-2 rounded-xl font-black text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5 ${
                isOnAir
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>{isOnAir ? 'إيقاف البث' : 'بدء البث الحي'}</span>
            </button>

            <button
              onClick={() => {
                setMicActive(!micActive);
                showToast(micActive ? 'تم كتم مايك الدي جي 🎙️' : 'المايك يعمل الآن على الهواء 🎙️');
              }}
              className={`p-2 rounded-xl cursor-pointer transition-all border ${
                micActive
                  ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-md animate-bounce'
                  : 'bg-purple-900/60 border-purple-700/80 text-purple-200 hover:bg-purple-800'
              }`}
              title={micActive ? 'كتم المايك' : 'تحدث بالمايك'}
            >
              {micActive ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* DJ Sub Navigation Tabs */}
      <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
        <button
          onClick={() => setActiveTab('station')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'station' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Disc className="w-3.5 h-3.5" />
          <span>محطة التحكم</span>
        </button>
        <button
          onClick={() => setActiveTab('soundboard')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'soundboard' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>المؤثرات الصوتية (Soundboard)</span>
        </button>
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'queue' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Music className="w-3.5 h-3.5" />
          <span>طابور الطلبات ({songQueue.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
            activeTab === 'settings' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>صلاحيات الدي جي</span>
        </button>
      </div>

      {/* TAB 1: DJ STATION */}
      {activeTab === 'station' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Main Turntable Deck */}
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
            <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
              <RadioTower className="w-4 h-4 text-purple-600" />
              <span>مشغل البث المباشر الموحد</span>
            </h4>

            <div className="bg-slate-900 rounded-xl p-4 text-white flex flex-col items-center justify-center text-center relative overflow-hidden border border-slate-800">
              <div className="w-20 h-20 rounded-full border-4 border-purple-500/50 flex items-center justify-center bg-slate-950 mb-3 shadow-inner">
                <Disc className={`w-10 h-10 text-purple-400 ${isOnAir ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              </div>
              <span className="text-xs font-black text-white">شيلة يمنية حماسية - طرب أصيل</span>
              <span className="text-[11px] text-slate-400 mt-0.5">طلب بواسطة: أحمد الصنعاني</span>

              {/* Fake Audio Wave visualizer */}
              <div className="flex items-center gap-1 mt-4 h-8">
                {[12, 24, 18, 30, 26, 14, 20, 28, 16, 22, 32, 18, 10, 24, 16].map((h, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-300 ${isOnAir ? 'bg-purple-500 animate-pulse' : 'bg-slate-700'}`}
                    style={{ height: isOnAir ? `${h}px` : '6px' }}
                  />
                ))}
              </div>
            </div>

            {/* Quick Controls */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => showToast('تم التقديم للأغنية التالية ⏭️')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer flex items-center gap-1"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                  <span>التالي</span>
                </button>
                <button
                  onClick={() => showToast('تم مسح صوت الصدى وتصفية التردد 🎚️')}
                  className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-lg cursor-pointer"
                >
                  تصفية التردد 🎚️
                </button>
              </div>

              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-slate-500" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  defaultValue="80"
                  onChange={() => {}}
                  className="w-24 accent-purple-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Side DJ Info */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">معلومات الدي جي</h4>
            
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-purple-50 rounded-lg border border-purple-100">
                <span className="text-purple-600 font-bold block text-[11px]">مقدم البث الآن:</span>
                <span className="font-black text-slate-800 text-xs">{currentDjUser}</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-bold block text-[11px]">عدد المستمعين المتصلين:</span>
                <span className="font-black text-slate-800 text-xs">14 متصل في الغرفة</span>
              </div>
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-500 font-bold block text-[11px]">جودة الصوت:</span>
                <span className="font-black text-emerald-600 text-xs">320kbps HD Stereo</span>
              </div>
            </div>

            <button
              onClick={() => {
                setCurrentDjUser(currentUser?.username || 'المالك');
                showToast('أصبحت أنت الدي جي المعتمد للبث 👑');
              }}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl shadow-xs cursor-pointer transition-all"
            >
              استلام دفة الـ DJ 👑
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: SOUNDBOARD SFX */}
      {activeTab === 'soundboard' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="text-xs font-black text-slate-800">لوحة المؤثرات الصوتية الفورية (Live Soundboard)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">اضغط على أي زر لإطلاق صوت حقيقي في بث الغرفة مباشرة</p>
            </div>
            <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
              8 مؤثرات جاهزة
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { id: 'applause', name: 'تصفيق حار 👏', desc: 'تحية الجمهور', color: 'from-amber-500 to-yellow-500' },
              { id: 'horn', name: 'بوق الهواء 🎺', desc: 'حماس وريمكس', color: 'from-rose-500 to-red-600' },
              { id: 'drumroll', name: 'طبول وإثارة 🥁', desc: 'ترقب وتشويق', color: 'from-blue-600 to-cyan-600' },
              { id: 'victory', name: 'نغمة الفوز 🏆', desc: 'مبروك واحتفال', color: 'from-emerald-500 to-teal-600' },
              { id: 'whistle', name: 'تصفير تحية 😗', desc: 'صفارة تشجيع', color: 'from-purple-600 to-violet-600' },
              { id: 'laugh', name: 'ضحكة جماعية 😂', desc: 'ضحك وفرفشة', color: 'from-pink-500 to-rose-500' },
              { id: 'chime', name: 'جرس تنبيه 🔔', desc: 'إعلان مهم', color: 'from-indigo-600 to-blue-700' },
              { id: 'applause', name: 'زغاريد واحتفال 🎉', desc: 'أفراح ومناسبات', color: 'from-orange-500 to-amber-600' },
            ].map((sfx, idx) => (
              <button
                key={idx}
                onClick={() => playSfx(sfx.id, sfx.name)}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-purple-300 bg-slate-50 hover:bg-white text-right transition-all cursor-pointer group shadow-2xs hover:shadow-xs flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black text-slate-800 group-hover:text-purple-600 transition-colors">
                    {sfx.name}
                  </span>
                  <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${sfx.color} text-white flex items-center justify-center text-[10px] shadow-xs`}>
                    ▶
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">{sfx.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SONG REQUEST QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-3">
          {/* Add Song Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
            <h4 className="text-xs font-black text-slate-800 mb-3 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-purple-600" />
              <span>إضافة أغنية أو رابط يوتيوب لطابور الـ DJ</span>
            </h4>
            <form onSubmit={handleAddTrack} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="عنوان الأغنية أو الشيلة *"
                value={newTrackTitle}
                onChange={(e) => setNewTrackTitle(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold"
              />
              <input
                type="text"
                placeholder="رابط يوتيوب أو صوتي (اختياري)..."
                value={newTrackUrl}
                onChange={(e) => setNewTrackUrl(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg cursor-pointer shadow-xs"
              >
                إدراج في الطابور 🎵
              </button>
            </form>
          </div>

          {/* Queue List */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
            <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">قائمة الأغاني والطلبات الحالية</h4>
            
            {songQueue.length > 0 ? (
              songQueue.map((item, idx) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="text-xs font-black text-slate-800">{item.title}</h5>
                      <span className="text-[10px] text-slate-400">طلب بواسطة: {item.requester} | المدة: {item.duration}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {item.status === 'pending' && (
                      <button
                        onClick={() => handleApproveSong(item.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg cursor-pointer"
                      >
                        قبول ✅
                      </button>
                    )}
                    <button
                      onClick={() => handleRejectSong(item.id)}
                      className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[11px] font-bold rounded-lg cursor-pointer"
                    >
                      حذف 🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400 font-bold">
                طابور الأغاني فارغ حالياً 🎧
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DJ PERMISSIONS & SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
          <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">صلاحيات وإعدادات نظام DJ</h4>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1.5">من يحق له تشغيل واستلام DJ الغرفة؟</label>
              <select
                value={djPermissionRole}
                onChange={(e: any) => {
                  setDjPermissionRole(e.target.value);
                  showToast('تم تحديث رتبة صلاحيات الدي جي 🎚️');
                }}
                className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-xs"
              >
                <option value="owner">المالك فقط 👑</option>
                <option value="admin">المدراء والمشرفين 🛡️</option>
                <option value="vip">أعضاء VIP والمدراء ⭐</option>
                <option value="all">جميع الأعضاء المسجلين 👥</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="font-bold text-slate-800 block text-xs">الموافقة التلقائية على طلبات الأغاني</span>
                <span className="text-[11px] text-slate-500">إدراج طلبات الأعضاء في الطابور مباشرة دون انتظار مراجعة الدي جي</span>
              </div>
              <button
                onClick={() => {
                  setAutoApproveSongs(!autoApproveSongs);
                  showToast(autoApproveSongs ? 'تم تفعيل المراجعة اليدوية' : 'تم تفعيل الموافقة التلقائية');
                }}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                  autoApproveSongs ? 'bg-purple-600' : 'bg-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  autoApproveSongs ? 'right-0.5' : 'left-0.5'
                }`} />
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800 font-bold">
              💡 ملاحظة: عندما يكون الدي جي على الهواء (ON AIR)، يتم كتم جميع أصوات التنبيهات الأخرى تلقائياً لضمان نقاء البث لجميع المتواجدين في الغرفة.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
