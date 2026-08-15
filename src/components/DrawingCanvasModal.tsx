import React, { useRef, useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { X, Eraser, RotateCcw, Send, Palette, PenTool } from 'lucide-react';

interface DrawingCanvasModalProps {
  onClose: () => void;
}

const PEN_COLORS = [
  { name: 'أسود', hex: '#000000' },
  { name: 'أحمر', hex: '#ef4444' },
  { name: 'أزرق', hex: '#2563eb' },
  { name: 'أخضر', hex: '#10b981' },
  { name: 'أصفر', hex: '#eab308' },
  { name: 'بنفسجي', hex: '#9333ea' },
  { name: 'وردي', hex: '#ec4899' },
  { name: 'نيون سماوي', hex: '#00f3ff' },
  { name: 'نيون أخضر', hex: '#39ff14' },
  { name: 'أبيض', hex: '#ffffff' },
];

const BRUSH_SIZES = [
  { label: 'رفيع', size: 2 },
  { label: 'وسط', size: 5 },
  { label: 'عريض', size: 10 },
  { label: 'ضخم', size: 18 },
];

export const DrawingCanvasModal: React.FC<DrawingCanvasModalProps> = ({ onClose }) => {
  const { sendMessage } = useChat();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [penColor, setPenColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);

  // Initialize Canvas Background to White
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = isEraser ? '#ffffff' : penColor;
    ctx.lineWidth = brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.closePath();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const handleSendDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    sendMessage('🎨 رسمة جديدة من لوحة الرسم', 'image', dataUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-200 dir-rtl">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-sm">
            <PenTool className="w-5 h-5 text-amber-400" />
            <span>📋 لوحة الرسم والتخطيط التفاعلية</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Canvas Body */}
        <div className="p-4 space-y-3 bg-slate-950/60">
          <div className="relative border-2 border-slate-700 rounded-2xl overflow-hidden bg-white shadow-inner touch-none flex justify-center">
            <canvas
              ref={canvasRef}
              width={400}
              height={260}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="cursor-crosshair w-full h-[240px] object-contain"
            />
          </div>

          {/* Color Palette Row */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-300 font-bold">
              <span className="flex items-center gap-1">
                <Palette className="w-4 h-4 text-amber-400" />
                <span>اختر لون القلم:</span>
              </span>
              <button
                type="button"
                onClick={() => setIsEraser(!isEraser)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                  isEraser
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Eraser className="w-3.5 h-3.5" />
                <span>{isEraser ? 'ممحاة (مفعلة)' : 'ممحاة'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {PEN_COLORS.map((c) => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => {
                    setPenColor(c.hex);
                    setIsEraser(false);
                  }}
                  style={{ backgroundColor: c.hex }}
                  className={`w-7 h-7 rounded-full shrink-0 border-2 transition-transform cursor-pointer ${
                    !isEraser && penColor === c.hex ? 'scale-125 border-amber-400 shadow-lg ring-2 ring-amber-400/50' : 'border-slate-700'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Brush Sizes */}
          <div className="flex items-center justify-between bg-slate-900 p-2 rounded-2xl border border-slate-800 text-xs">
            <span className="text-slate-300 font-bold">سمك القلم:</span>
            <div className="flex items-center gap-1.5">
              {BRUSH_SIZES.map((b) => (
                <button
                  key={b.size}
                  type="button"
                  onClick={() => setBrushSize(b.size)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    brushSize === b.size
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Action Buttons */}
        <div className="bg-slate-950 px-4 py-3 border-t border-slate-800 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={clearCanvas}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>مسح اللوحة</span>
          </button>

          <button
            type="button"
            onClick={handleSendDrawing}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 shadow-lg cursor-pointer transition-transform active:scale-95"
          >
            <Send className="w-4 h-4" />
            <span>إرسال الرسمة إلى العام ✈️</span>
          </button>
        </div>
      </div>
    </div>
  );
};
