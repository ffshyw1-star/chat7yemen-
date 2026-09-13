import React from 'react';
import { useChat } from '../context/ChatContext';
import { RADIO_STATIONS } from '../utils/radioStations';
import { Radio, Play, Pause, Volume2, VolumeX, X, RadioTower, Sparkles } from 'lucide-react';

export const RadioPlayerModal: React.FC = () => {
  const {
    isRadioPlaying,
    toggleRadio,
    radioStationId,
    setRadioStationId,
    radioVolume,
    setRadioVolume,
    isRadioModalOpen,
    setIsRadioModalOpen,
  } = useChat();

  if (!isRadioModalOpen) return null;

  const currentStation = RADIO_STATIONS.find((s) => s.id === radioStationId) || RADIO_STATIONS[0];

  return (
    <div
      id="radio-player-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 dir-rtl select-none"
      onClick={() => setIsRadioModalOpen(false)}
    >
      <div
        id="radio-player-card"
        className="w-full sm:max-w-md bg-slate-900 border border-slate-700/90 rounded-t-3xl sm:rounded-3xl shadow-2xl p-4 sm:p-5 text-slate-100 animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isRadioPlaying ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
              <Radio className={`w-4 h-4 ${isRadioPlaying ? 'animate-pulse' : ''}`} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black text-white">الراديو والبث الصوتي المباشر</span>
                {isRadioPlaying && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-400">إذاعات ومحطات البث الحي على مدار الساعة</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsRadioModalOpen(false)}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Stream Status Card */}
        <div className="my-4 p-3.5 bg-gradient-to-br from-slate-950 to-slate-900 rounded-2xl border border-slate-800 text-center relative overflow-hidden shadow-inner">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
              isRadioPlaying
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}>
              {isRadioPlaying ? '🔴 بث مباشر مستمر' : '⏸️ البث متوقف مؤقتاً'}
            </span>
            <span className="text-[10px] bg-slate-800/80 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-slate-700">
              {currentStation.category}
            </span>
          </div>

          <h3 className="text-base font-black text-white tracking-tight mb-1 truncate px-2">
            {currentStation.name}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed line-clamp-2">
            {currentStation.description}
          </p>

          {/* Dynamic Audio Visualizer Waves */}
          <div className="flex items-center justify-center gap-1 mt-4 h-9">
            {[10, 22, 14, 28, 20, 32, 18, 26, 12, 30, 24, 16, 28, 14, 22, 12].map((height, idx) => (
              <div
                key={idx}
                className={`w-1 rounded-full transition-all duration-300 ${
                  isRadioPlaying ? 'bg-gradient-to-t from-emerald-500 to-teal-300 animate-pulse' : 'bg-slate-700'
                }`}
                style={{
                  height: isRadioPlaying ? `${height}px` : '4px',
                  animationDelay: `${idx * 0.08}s`
                }}
              />
            ))}
          </div>
        </div>

        {/* Main Controls: Play/Pause and Volume */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={toggleRadio}
              className={`px-6 py-2.5 rounded-full font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer ${
                isRadioPlaying
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-900/30'
                  : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-900/30'
              }`}
            >
              {isRadioPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" />
                  <span>إيقاف الراديو</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>تشغيل البث الآن</span>
                </>
              )}
            </button>
          </div>

          {/* Volume Slider */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setRadioVolume(radioVolume > 0 ? 0 : 70)}
              className="text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
              title={radioVolume === 0 ? 'تشغيل الصوت' : 'كتم الصوت'}
            >
              {radioVolume === 0 ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>
            <input
              type="range"
              min="0"
              max="100"
              value={radioVolume}
              onChange={(e) => setRadioVolume(Number(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
            />
            <span className="text-[11px] font-mono text-slate-400 min-w-[32px] text-left">
              {radioVolume}%
            </span>
          </div>
        </div>

        {/* Stations Selection */}
        <div className="mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-300">المحطات الإذاعية المتاحة</span>
            <span className="text-[10px] text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              بث مجاني
            </span>
          </div>

          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5 custom-scrollbar">
            {RADIO_STATIONS.map((station) => {
              const isSelected = station.id === radioStationId;
              return (
                <button
                  key={station.id}
                  type="button"
                  onClick={() => setRadioStationId(station.id)}
                  className={`w-full text-right p-2.5 rounded-xl transition-all flex items-center justify-between cursor-pointer border ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950/40 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <RadioTower className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <div className="truncate text-right">
                      <span className="text-xs font-bold block truncate">{station.name}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{station.description}</span>
                    </div>
                  </div>

                  <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold shrink-0 mr-2 ${
                    isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isSelected ? 'المحطة الحالية' : 'اختيار'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
