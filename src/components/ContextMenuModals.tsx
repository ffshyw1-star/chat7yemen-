import React, { useState, useEffect, useRef } from 'react';
import { Copy, Share2, Search, CheckSquare, Download, Link, Image as ImageIcon, X } from 'lucide-react';

export interface TextContextOptions {
  text: string;
  title?: string;
  x?: number;
  y?: number;
}

export interface ImageContextOptions {
  imageUrl: string;
  altText?: string;
  x?: number;
  y?: number;
}

// Helper hook for long press
export function useLongPress(
  onLongPress: (e: React.TouchEvent | React.MouseEvent) => void,
  onClick?: (e: React.MouseEvent) => void,
  { shouldPreventDefault = true, delay = 500 } = {}
) {
  const [longPressTriggered, setLongPressTriggered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const targetRef = useRef<EventTarget | null>(null);

  const start = (e: React.TouchEvent | React.MouseEvent) => {
    if (shouldPreventDefault && e.target) {
      targetRef.current = e.target;
    }
    setLongPressTriggered(false);
    timeoutRef.current = setTimeout(() => {
      onLongPress(e);
      setLongPressTriggered(true);
    }, delay);
  };

  const clear = (e: React.TouchEvent | React.MouseEvent, shouldTriggerClick = true) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (shouldTriggerClick && !longPressTriggered && onClick && 'button' in e && e.button === 0) {
      onClick(e as React.MouseEvent);
    }
    setLongPressTriggered(false);
  };

  return {
    onMouseDown: (e: React.MouseEvent) => start(e),
    onTouchStart: (e: React.TouchEvent) => start(e),
    onMouseUp: (e: React.MouseEvent) => clear(e),
    onMouseLeave: (e: React.MouseEvent) => clear(e, false),
    onTouchEnd: (e: React.TouchEvent) => clear(e),
  };
}

// Global Text Long-Press Context Menu Modal
export const TextContextMenuModal: React.FC<{
  isOpen: boolean;
  options: TextContextOptions | null;
  onClose: () => void;
  showToast: (msg: string) => void;
}> = ({ isOpen, options, onClose, showToast }) => {
  if (!isOpen || !options || !options.text) return null;

  const { text, title } = options;

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast('تم نسخ النص بنجاح 📋');
    } catch (err) {
      showToast('تعذر النسخ ❌');
    }
    onClose();
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: title || 'مشاركة نص',
          text: text,
        });
      } else {
        await handleCopy();
        showToast('تم نسخ النص للمشاركة 📋');
      }
    } catch (err) {
      // User cancelled share
    }
    onClose();
  };

  const handleSelectAll = () => {
    try {
      const selection = window.getSelection();
      const range = document.createRange();
      const activeEl = document.activeElement;
      if (activeEl && (activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement)) {
        activeEl.select();
      } else {
        range.selectNodeContents(document.body);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
      showToast('تم تحديد الكل ✅');
    } catch (e) {
      showToast('تم التحديد');
    }
    onClose();
  };

  const handleWebSearch = () => {
    try {
      const query = encodeURIComponent(text.trim());
      window.open(`https://www.google.com/search?q=${query}`, '_blank');
    } catch (e) {
      showToast('تعذر فتح البحث');
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header with preview */}
        <div className="bg-slate-50 border-b border-slate-100 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-700">{title || 'خيارات النص'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Text Preview Box */}
        <div className="p-3 bg-slate-100/70 border-b border-slate-200/80 max-h-24 overflow-y-auto">
          <p className="text-xs text-slate-700 font-medium line-clamp-3 select-all leading-relaxed whitespace-pre-wrap break-words">
            {text}
          </p>
        </div>

        {/* Actions Menu Grid */}
        <div className="p-2 space-y-1">
          {/* 1. نسخ (Copy) */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors text-right cursor-pointer text-slate-800"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Copy className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold flex-1">نسخ</span>
          </button>

          {/* 2. مشاركة (Share) */}
          <button
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors text-right cursor-pointer text-slate-800"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold flex-1">مشاركة</span>
          </button>

          {/* 3. تحديد الكل (Select All) */}
          <button
            onClick={handleSelectAll}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors text-right cursor-pointer text-slate-800"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold flex-1">تحديد الكل</span>
          </button>

          {/* 4. البحث في الويب (Web Search) */}
          <button
            onClick={handleWebSearch}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors text-right cursor-pointer text-slate-800"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold flex-1">البحث في الويب</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Global Image Context Menu Modal (نسخ عنوان الصورة - مشاركة - تنزيل الصورة)
export const ImageContextMenuModal: React.FC<{
  isOpen: boolean;
  options: ImageContextOptions | null;
  onClose: () => void;
  showToast: (msg: string) => void;
}> = ({ isOpen, options, onClose, showToast }) => {
  if (!isOpen || !options || !options.imageUrl) return null;

  const { imageUrl, altText } = options;

  // 1. نسخ عنوان الصورة (Copy image address / URL)
  const handleCopyImageUrl = async () => {
    try {
      const fullUrl = imageUrl.startsWith('http') || imageUrl.startsWith('data:') 
        ? imageUrl 
        : `${window.location.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
      
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(fullUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = fullUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast('تم نسخ عنوان الصورة بنجاح 🔗');
    } catch (e) {
      showToast('تعذر نسخ عنوان الصورة ❌');
    }
    onClose();
  };

  // 2. مشاركة الصورة (Share image)
  const handleShareImage = async () => {
    try {
      const fullUrl = imageUrl.startsWith('http') || imageUrl.startsWith('data:') 
        ? imageUrl 
        : `${window.location.origin}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;

      if (navigator.share) {
        await navigator.share({
          title: altText || 'مشاركة صورة',
          url: fullUrl,
        });
      } else {
        await handleCopyImageUrl();
      }
    } catch (e) {
      // User cancelled share
    }
    onClose();
  };

  // 3. تنزيل الصورة (Download image)
  const handleDownloadImage = async () => {
    try {
      showToast('جاري بدء التنزيل... 📥');
      if (imageUrl.startsWith('data:')) {
        const a = document.createElement('a');
        a.href = imageUrl;
        a.download = `image_${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        const response = await fetch(imageUrl, { mode: 'cors' }).catch(() => null);
        if (response && response.ok) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = `image_${Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(blobUrl);
        } else {
          // Fallback direct anchor click
          const a = document.createElement('a');
          a.href = imageUrl;
          a.target = '_blank';
          a.download = `image_${Date.now()}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        }
      }
      showToast('تم تنزيل الصورة بنجاح 💾');
    } catch (e) {
      showToast('تعذر تنزيل الصورة ❌');
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-sky-600" />
            <span className="text-xs font-black text-slate-700">{altText || 'خيارات الصورة'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Preview Thumbnail */}
        <div className="p-3 bg-slate-900/90 flex items-center justify-center max-h-48 overflow-hidden">
          <img
            src={imageUrl}
            alt={altText || 'صورة'}
            className="max-h-40 max-w-full object-contain rounded-lg shadow-sm"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Action Options */}
        <div className="p-2 space-y-1">
          {/* 1. نسخ عنوان الصورة */}
          <button
            onClick={handleCopyImageUrl}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors text-right cursor-pointer text-slate-800"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Link className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold flex-1">نسخ عنوان الصورة</span>
          </button>

          {/* 2. مشاركة */}
          <button
            onClick={handleShareImage}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors text-right cursor-pointer text-slate-800"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold flex-1">مشاركة</span>
          </button>

          {/* 3. تنزيل الصورة */}
          <button
            onClick={handleDownloadImage}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 transition-colors text-right cursor-pointer text-slate-800"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold flex-1">تنزيل الصورة</span>
          </button>
        </div>
      </div>
    </div>
  );
};
