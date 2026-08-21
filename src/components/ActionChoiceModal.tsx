import React, { useRef } from 'react';
import { Image as ImageIcon, Mic, Camera, Video, X } from 'lucide-react';

interface ActionChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: () => void;
  onStartRecorder: () => void;
  onOpenCamera: (mode?: 'photo' | 'video') => void;
}

export const ActionChoiceModal: React.FC<ActionChoiceModalProps> = ({
  isOpen,
  onClose,
  onSelectMedia,
  onStartRecorder,
  onOpenCamera,
}) => {
  if (!isOpen) return null;

  return (
    <div
      id="action-choice-backdrop"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        id="action-choice-modal"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
        className="bg-[#242933] text-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-700/80 animate-in zoom-in-95 duration-200 select-none"
      >
        {/* Title */}
        <h3 className="text-center text-lg font-bold text-slate-100 mb-7">
          اختيار إجراء
        </h3>

        {/* 4 Action Grid Options matching Android Screenshot */}
        <div className="grid grid-cols-4 gap-3 mb-7">
          
          {/* 1. Media Selector (أداة اختيار الوسائط) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectMedia();
            }}
            className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-lg group-hover:bg-slate-100 group-hover:scale-105 transition-all">
              <div className="p-1 border-2 border-slate-900 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-slate-900 stroke-[2.2]" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">
              أداة اختيار الوسائط
            </span>
          </button>

          {/* 2. Recorder (المسجل) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onStartRecorder();
            }}
            className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-lg group-hover:bg-slate-100 group-hover:scale-105 transition-all">
              <div className="w-9 h-9 rounded-full border-2 border-slate-900 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-red-600 animate-pulse" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">
              المسجل
            </span>
          </button>

          {/* 3. Camera (الكاميرا) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCamera('photo');
            }}
            className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-lg group-hover:bg-slate-100 group-hover:scale-105 transition-all">
              <div className="w-9 h-9 rounded-full border-2 border-slate-900 flex items-center justify-center p-1">
                <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">
              الكاميرا
            </span>
          </button>

          {/* 4. Video / Camera 2 (الكاميرا) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCamera('video');
            }}
            className="flex flex-col items-center gap-2 group cursor-pointer active:scale-95 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-white text-slate-900 flex items-center justify-center shadow-lg group-hover:bg-slate-100 group-hover:scale-105 transition-all">
              <div className="w-9 h-9 rounded-full border-2 border-slate-900 flex items-center justify-center p-1">
                <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-200 text-center leading-tight">
              الكاميرا
            </span>
          </button>

        </div>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full bg-[#374151] hover:bg-[#4b5563] text-slate-100 py-3.5 rounded-2xl font-bold text-sm text-center transition-colors shadow-md active:scale-98 cursor-pointer"
        >
          إلغاء
        </button>
      </div>
    </div>
  );
};
