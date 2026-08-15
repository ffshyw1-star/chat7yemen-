import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Message, PrivateMessage } from '../types';
import { Flag, X, AlertTriangle, Send, ShieldAlert } from 'lucide-react';

interface ReportMessageModalProps {
  message: Message | PrivateMessage | null;
  onClose: () => void;
}

export const ReportMessageModal: React.FC<ReportMessageModalProps> = ({ message, onClose }) => {
  const { reportUserMessage, currentUser } = useChat();

  const [selectedReason, setSelectedReason] = useState<string>('اساءة');
  const [details, setDetails] = useState<string>('');

  if (!message || !currentUser) return null;

  const senderName = 'senderName' in message ? message.senderName : 'مستخدم';
  const senderId = message.senderId;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;

    reportUserMessage(senderId, message.text || '[محتوى وسائط/صوت]', selectedReason, details);
    onClose();
  };

  const reasonOptions = [
    { id: 'اساءة', label: 'إساءة أو سب وشتم', icon: '🤬' },
    { id: 'محتوى احتيال', label: 'محتوى احتيالي أو روابط مشبوهة', icon: '⚠️' },
    { id: 'محتوى غير لائق', label: 'محتوى غير لائق أو إباحي', icon: '🔞' },
    { id: 'مضايقة', label: 'مضايقة أو إزعاج', icon: '🔕' },
    { id: 'غير ذلك', label: 'غير ذلك', icon: '📝' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 dir-rtl">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative select-none">
        
        {/* Header */}
        <div className="bg-slate-950 px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400">
              <Flag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                الإبلاغ عن رسالة غير لائقة
              </h3>
              <p className="text-[11px] text-slate-400">
                سيتم إرسال البلاغ مباشرة لكادر الإدارة والمشرفين
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Target Message Preview */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold text-amber-400">المرسل: {senderName}</span>
              <span className="text-[10px] text-slate-500 dir-ltr">{message.timestamp}</span>
            </div>
            <p className="text-xs text-slate-200 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800/60 leading-relaxed max-h-24 overflow-y-auto custom-scrollbar">
              {message.text || (message.type === 'image' ? '📷 [صورة مرفقة]' : '🎙️ [رسالة صوتية]')}
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>سبب الإبلاغ:</span>
            </label>

            <div className="grid grid-cols-1 gap-1.5">
              {reasonOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSelectedReason(opt.id)}
                  className={`p-2.5 rounded-xl border text-xs font-medium text-right flex items-center justify-between transition-all cursor-pointer ${
                    selectedReason === opt.id
                      ? 'bg-amber-500/15 border-amber-500/60 text-amber-300 font-bold'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{opt.icon}</span>
                    <span>{opt.label}</span>
                  </span>
                  {selectedReason === opt.id && (
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Extra Details */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              تفاصيل وملاحظات إضافية (اختياري):
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="اكتب توضيحاً إضافياً للإدارة إذا لزم الأمر..."
              rows={2}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 resize-none"
            />
          </div>

          {/* Safety Notice */}
          <div className="flex items-center gap-2 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/60 text-[11px] text-slate-400">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span>البلاغات الكاذبة قد تعرض حسابك للمساءلة. يرجى التثبت قبل الإبلاغ.</span>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Send className="w-4 h-4 rotate-180" />
              <span>إرسال البلاغ للإدارة</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 px-4 rounded-xl text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
