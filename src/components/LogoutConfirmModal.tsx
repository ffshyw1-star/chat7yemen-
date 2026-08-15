import React from 'react';
import { useChat } from '../context/ChatContext';
import { Power, X } from 'lucide-react';

export const LogoutConfirmModal: React.FC = () => {
  const { isLogoutConfirmOpen, setIsLogoutConfirmOpen, logout } = useChat();

  if (!isLogoutConfirmOpen) return null;

  const handleConfirm = () => {
    setIsLogoutConfirmOpen(false);
    logout();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 dir-rtl"
      dir="rtl"
    >
      <div className="bg-white rounded-md shadow-2xl w-full max-w-sm overflow-hidden text-center transform transition-all border border-slate-200">
        
        {/* Dark Navy Header Bar with Close Button */}
        <div className="bg-[#131b26] px-4 py-3 flex items-center justify-end">
          <button
            onClick={() => setIsLogoutConfirmOpen(false)}
            className="text-white hover:opacity-80 p-1 transition-opacity cursor-pointer"
            title="إغلاق"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="px-6 py-8 flex flex-col items-center">
          
          {/* Cyan Power Icon */}
          <div className="mb-6 flex justify-center items-center">
            <Power className="w-24 h-24 text-[#00aeeF] stroke-[2.5]" />
          </div>

          {/* Question Text */}
          <h3 className="text-xl font-bold text-slate-800 mb-8 tracking-wide">
            هل تريد الخروج ؟
          </h3>

          {/* Buttons Row */}
          <div className="grid grid-cols-2 gap-4 w-full max-w-[280px]">
            {/* Yes Button (Cyan) */}
            <button
              onClick={handleConfirm}
              className="w-full bg-[#00aeeF] hover:bg-[#0284c7] text-white font-extrabold text-base py-2.5 rounded-md shadow-sm transition-all cursor-pointer active:scale-95 text-center"
            >
              نعم
            </button>

            {/* No Button (Dark Navy) */}
            <button
              onClick={() => setIsLogoutConfirmOpen(false)}
              className="w-full bg-[#131b26] hover:bg-[#0f172a] text-white font-extrabold text-base py-2.5 rounded-md shadow-sm transition-all cursor-pointer active:scale-95 text-center"
            >
              لا
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
