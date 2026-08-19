import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Lock, KeyRound, Eye, EyeOff, X, ArrowRight, ShieldAlert } from 'lucide-react';

export const RoomPasswordModal: React.FC = () => {
  const { passwordPromptRoom, setPasswordPromptRoom, switchRoom, setIsRoomsListOpen } = useChat();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!passwordPromptRoom) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('الرجاء إدخال كلمة المرور لدخول الغرفة');
      return;
    }

    const success = switchRoom(passwordPromptRoom.id, password.trim());
    if (success) {
      setPassword('');
      setErrorMsg('');
      setPasswordPromptRoom(null);
      if (window.innerWidth < 640) {
        setIsRoomsListOpen(false);
      }
    } else {
      setErrorMsg('🚫 كلمة المرور غير صحيحة، حاول مجدداً.');
    }
  };

  const handleClose = () => {
    setPasswordPromptRoom(null);
    setPassword('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150 dir-rtl select-none font-sans">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-slate-200 text-slate-800">
        
        {/* Header */}
        <div className="bg-[#002f34] text-white px-4 py-3.5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black">غرفة مقفلة بكلمة مرور</h3>
              <p className="text-[11px] text-amber-300 font-bold">{passwordPromptRoom.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
            title="إلغاء"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-center space-y-1.5 py-1">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 text-red-600 mx-auto flex items-center justify-center shadow-inner">
              <KeyRound className="w-6 h-6" />
            </div>
            <h4 className="text-xs font-black text-slate-800">
              الدخول لغرفة ({passwordPromptRoom.name}) محمي
            </h4>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              هذه الغرفة خاصة ومقفلة بكلمة سر. الرجاء إدخال الرمز السري للمتابعة.
            </p>
          </div>

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="block text-xs font-black text-slate-700">كلمة المرور:</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errorMsg) setErrorMsg('');
                }}
                placeholder="أدخل كلمة المرور..."
                autoFocus
                className="w-full bg-slate-100 border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#00a6b6] focus:bg-white transition-all text-right font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                title={showPassword ? 'إخفاء' : 'إظهار'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-bold flex items-center gap-1.5 text-right">
              <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="submit"
              className="flex-1 bg-[#00a6b6] hover:bg-[#0092a1] active:bg-[#007f8d] text-white font-black text-xs py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>دخول الغرفة</span>
              <ArrowRight className="w-4 h-4 rotate-180" />
            </button>
            <button
              type="button"
              onClick={handleClose}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-2.5 px-4 rounded-xl transition-all cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
