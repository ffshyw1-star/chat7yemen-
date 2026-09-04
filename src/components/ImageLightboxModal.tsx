import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ZoomIn, ZoomOut, RotateCw, Download, Maximize2, Minimize2, ExternalLink, Image as ImageIcon } from 'lucide-react';

interface ImageLightboxModalProps {
  imageUrl: string | null;
  altText?: string;
  senderName?: string;
  timestamp?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  imageUrl,
  altText,
  senderName,
  timestamp,
  onClose
}) => {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Reset controls when image changes
  useEffect(() => {
    if (imageUrl) {
      setScale(1);
      setRotation(0);
      setIsLoading(true);
      setHasError(false);
    }
  }, [imageUrl]);

  // Keyboard accessibility (ESC to close, +/- for zoom, R for rotate)
  useEffect(() => {
    if (!imageUrl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        setScale(s => Math.min(4, s + 0.25));
      } else if (e.key === '-' || e.key === '_') {
        setScale(s => Math.max(0.5, s - 0.25));
      } else if (e.key.toLowerCase() === 'r') {
        setRotation(r => (r + 90) % 360);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [imageUrl, onClose]);

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(s => Math.min(4, Number((s + 0.25).toFixed(2))));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(s => Math.max(0.5, Number((s - 0.25).toFixed(2))));
  };

  const handleRotate = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRotation(r => (r + 90) % 360);
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setScale(1);
    setRotation(0);
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!imageUrl) return;
    try {
      const a = document.createElement('a');
      a.href = imageUrl;
      a.download = `image_${Date.now()}.${imageUrl.includes('.png') ? 'png' : imageUrl.includes('.webp') ? 'webp' : 'jpg'}`;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(imageUrl, '_blank');
    }
  };

  const handleToggleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!imageUrl) return null;

  return (
    <AnimatePresence>
      <div
        id="image_lightbox_backdrop"
        onClick={onClose}
        className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-md flex flex-col justify-between select-none animate-in fade-in duration-200"
      >
        {/* Top Control Bar */}
        <div
          id="image_lightbox_topbar"
          onClick={(e) => e.stopPropagation()}
          className="w-full px-4 py-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-white z-10 shrink-0"
        >
          {/* Sender / Details Header */}
          <div className="flex items-center gap-2.5 text-right min-w-0 pr-2 dir-rtl">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-sky-400 shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-black text-slate-100 truncate">
                {senderName ? `صورة مرسلة من: ${senderName}` : altText || 'عرض الصورة بالحجم الكامل'}
              </span>
              {timestamp && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {timestamp}
                </span>
              )}
            </div>
          </div>

          {/* Action Toolbar on Top Left */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Download Button */}
            <button
              id="lightbox_download_btn"
              type="button"
              onClick={handleDownload}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-white/10"
              title="تحميل / حفظ الصورة"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">تحميل</span>
            </button>

            {/* Open Original in New Tab */}
            <a
              id="lightbox_original_link"
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-slate-200 hover:text-white transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-white/10"
              title="فتح الصورة في نافذة جديدة"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">فتح الأصل</span>
            </a>

            {/* Close Button */}
            <button
              id="lightbox_close_btn"
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-red-600/80 hover:bg-red-600 active:scale-95 text-white transition-all cursor-pointer shadow-lg ml-1"
              title="إغلاق (Esc)"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        </div>

        {/* Center Main Stage (Zoomable & Pannable Image Area) */}
        <div
          id="image_lightbox_stage"
          className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-6 overflow-hidden relative"
          onClick={onClose}
        >
          {isLoading && !hasError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white pointer-events-none">
              <div className="w-10 h-10 border-4 border-sky-400/30 border-t-sky-400 rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-300">جارٍ تحميل الصورة بأعلى دقة...</span>
            </div>
          )}

          {hasError ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900/90 border border-slate-700 p-6 rounded-2xl text-center max-w-sm text-slate-300 space-y-3 shadow-2xl"
            >
              <p className="text-sm font-bold text-rose-400">تعذر تحميل الصورة أو انتهت صلاحية الرابط ⚠️</p>
              <a
                href={imageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold"
              >
                محاولة فتح الرابط المباشر
              </a>
            </div>
          ) : (
            <motion.div
              onClick={(e) => e.stopPropagation()}
              animate={{
                scale,
                rotate: rotation
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
              className="max-w-full max-h-full flex items-center justify-center cursor-default"
            >
              <img
                id="lightbox_preview_img"
                src={imageUrl}
                alt={altText || 'صورة مكبرة'}
                onLoad={() => setIsLoading(false)}
                onError={() => {
                  setIsLoading(false);
                  setHasError(true);
                }}
                className="max-h-[75vh] sm:max-h-[82vh] max-w-[94vw] sm:max-w-[88vw] object-contain rounded-xl shadow-2xl transition-all select-none drop-shadow-2xl"
                referrerPolicy="no-referrer"
                draggable={false}
              />
            </motion.div>
          )}
        </div>

        {/* Bottom Floating Control Dock */}
        <div
          id="image_lightbox_bottom_dock"
          onClick={(e) => e.stopPropagation()}
          className="w-full pb-4 sm:pb-6 pt-2 flex items-center justify-center z-10 shrink-0"
        >
          <div className="bg-slate-900/85 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3 py-1.5 shadow-2xl flex items-center gap-1 sm:gap-2 text-white">
            {/* Zoom Out Button */}
            <button
              id="lightbox_zoom_out_btn"
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-2 hover:bg-white/10 active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-all cursor-pointer"
              title="تصغير (-)"
            >
              <ZoomOut className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
            </button>

            {/* Current Zoom Level / Reset Button */}
            <button
              id="lightbox_zoom_reset_btn"
              type="button"
              onClick={handleResetZoom}
              className="px-2.5 py-1 text-xs font-mono font-black text-sky-400 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              title="إعادة الحجم الافتراضي"
            >
              {Math.round(scale * 100)}%
            </button>

            {/* Zoom In Button */}
            <button
              id="lightbox_zoom_in_btn"
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="p-2 hover:bg-white/10 active:scale-95 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-all cursor-pointer"
              title="تكبير (+)"
            >
              <ZoomIn className="w-4 h-4 sm:w-5 sm:h-5 text-slate-200" />
            </button>

            <div className="w-px h-5 bg-slate-700 mx-0.5" />

            {/* Rotate Button */}
            <button
              id="lightbox_rotate_btn"
              type="button"
              onClick={handleRotate}
              className="p-2 hover:bg-white/10 active:scale-95 rounded-xl transition-all text-slate-200 hover:text-white cursor-pointer"
              title="تدوير 90 درجة (R)"
            >
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Fullscreen Button */}
            <button
              id="lightbox_fullscreen_btn"
              type="button"
              onClick={handleToggleFullscreen}
              className="p-2 hover:bg-white/10 active:scale-95 rounded-xl transition-all text-slate-200 hover:text-white cursor-pointer hidden sm:block"
              title="ملء الشاشة"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <Maximize2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>
    </AnimatePresence>
  );
};
