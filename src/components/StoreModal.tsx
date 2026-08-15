import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { X, ShoppingCart, UserPlus, Info, Coins, Clock } from 'lucide-react';

export const StoreModal: React.FC = () => {
  const {
    setIsStoreOpen, storeItems, currentUser, setCurrentView, showTopBanner, updateUserProfile
  } = useChat();

  const [activeTab, setActiveTab] = useState<'vip' | 'admin'>('vip');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!currentUser) return null;

  const currentItem = activeTab === 'vip' 
    ? storeItems.find(i => i.role === 'vip') || storeItems[0]
    : storeItems.find(i => i.role === 'moderator') || storeItems[1] || storeItems[0];

  const handleBuy = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (activeTab === 'vip') {
      // 1. Visitor check
      if (currentUser.role === 'visitor') {
        setErrorMessage('قم في تسجيل عضوية لاجل شراء رتبة');
        return;
      }

      // 2. Higher role check (moderator, management, admin, owner)
      const higherRoles = ['moderator', 'management', 'admin', 'owner'];
      if (higherRoles.includes(currentUser.role)) {
        setErrorMessage('عضويتك الحالية اعلى من هذه العضوية');
        return;
      }

      // 3. Already VIP check
      if (currentUser.role === 'vip') {
        setErrorMessage('خطأ في الأمر');
        return;
      }

      // 4. Insufficient coins for member
      const price = currentItem?.price || 150;
      if (currentUser.coins < price) {
        setErrorMessage('خطأ في الأمر');
        return;
      }

      // 5. Successful purchase for registered member with enough coins
      const newCoins = currentUser.coins - price;
      updateUserProfile({ coins: newCoins, role: 'vip' });
      setSuccessMessage('تهانينا! تم شراء رتبة مميز بنجاح وترقية حسابك 💎');
      showTopBanner('تهانينا! تم شراء رتبة مميز بنجاح');
      return;
    }

    // For Admin / Moderator memberships:
    if (activeTab === 'admin') {
      if (currentUser.role === 'visitor') {
        setErrorMessage('قم في تسجيل عضوية لاجل شراء رتبة');
        return;
      }
      if (['management', 'admin', 'owner'].includes(currentUser.role)) {
        setErrorMessage('عضويتك الحالية اعلى من هذه العضوية');
        return;
      }
      const price = currentItem?.price || 500;
      if (currentUser.coins < price) {
        setErrorMessage('خطأ في الأمر');
        return;
      }
      alert('تم إرسال طلب شراء الرتبة الإدارية للإدارة والمالك للموافقة عليها 🛡️');
      setSuccessMessage('تم تقديم طلبك للإدارة للمراجعة والموافقة.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 dir-rtl font-sans select-none">
      <div className="bg-[#18191c] border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]">
        
        {/* RED ERROR BANNER AT THE TOP OF STORE (Matching Screenshot 10) */}
        {errorMessage && (
          <div className="bg-[#cc0000] text-white px-4 py-3 text-xs sm:text-sm font-extrabold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-150 z-30 shrink-0 border-b border-red-700">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="p-1 text-white hover:bg-black/20 rounded-full transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* GREEN SUCCESS BANNER */}
        {successMessage && (
          <div className="bg-emerald-600 text-white px-4 py-3 text-xs sm:text-sm font-extrabold flex items-center justify-between shadow-lg animate-in slide-in-from-top-2 duration-150 z-30 shrink-0 border-b border-emerald-700">
            <span>{successMessage}</span>
            <button
              onClick={() => setSuccessMessage(null)}
              className="p-1 text-white hover:bg-black/20 rounded-full transition-colors cursor-pointer"
              title="إغلاق"
            >
              <X className="w-4 h-4 stroke-[3]" />
            </button>
          </div>
        )}

        {/* 1. TOP HEADER BAR WITH CLOSE (X) BUTTON */}
        <div className="bg-[#111214] px-4 py-3 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              setIsStoreOpen(false);
              setCurrentView('chat');
            }}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5 font-black stroke-[2.5]" />
          </button>

          <div className="flex items-center gap-2 text-amber-400 font-extrabold text-xs sm:text-sm">
            <Coins className="w-4 h-4" />
            <span>رصيدك الحالي: {currentUser.coins} 💵</span>
          </div>
        </div>

        {/* 2. STORE BANNER (متجر الدردشة) */}
        <div className="bg-white py-6 px-4 text-center border-b border-slate-200 shrink-0">
          <div className="flex flex-col items-center justify-center">
            <span className="text-5xl sm:text-6xl font-black tracking-wide text-[#8b5cf6] drop-shadow-xs">
              متجر
            </span>
            <span className="text-5xl sm:text-6xl font-black tracking-wide text-[#ea580c] -mt-2 drop-shadow-xs">
              الدردشة
            </span>
          </div>
        </div>

        {/* 3. CATEGORY NAVIGATION TABS */}
        <div className="bg-[#202225] border-b border-slate-800 flex items-center justify-around shrink-0">
          <button
            onClick={() => {
              setActiveTab('vip');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-sm font-black transition-all cursor-pointer border-b-2 ${
              activeTab === 'vip'
                ? 'bg-[#2b2d31] text-amber-400 border-amber-500 shadow-inner'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#282b30]'
            }`}
          >
            مميز ✨
          </button>

          <button
            onClick={() => {
              setActiveTab('admin');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`flex-1 py-3 text-sm font-black transition-all cursor-pointer border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'admin'
                ? 'bg-[#2b2d31] text-amber-400 border-amber-500 shadow-inner'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-[#282b30]'
            }`}
          >
            <span>عضويات ادارية</span>
            <UserPlus className="w-4 h-4" />
          </button>
        </div>

        {/* 4. PRODUCT ITEM CARD AREA */}
        <div className="p-4 sm:p-5 overflow-y-auto custom-scrollbar bg-[#18191c]">
          <div className="bg-[#2d2e32] border-t-4 border-amber-500 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3.5 border-x border-b border-slate-800/80">
            
            {/* Card Header Title */}
            <div className="text-center pb-2 border-b border-slate-700/80">
              <h3 className="text-2xl font-black text-[#f43f5e] tracking-wide">
                {activeTab === 'vip' ? 'مميز' : 'عضوية إدارية'}
              </h3>
            </div>

            {/* Row 1: Earn Free Info Box */}
            <div className="bg-[#cbd5e1] text-[#0f172a] p-3 rounded-xl text-center text-xs sm:text-sm font-black shadow-xs flex items-center justify-center gap-1.5 leading-relaxed">
              <Info className="w-4 h-4 text-slate-800 shrink-0" />
              <span>
                تريد شراء مجانا {currentItem?.price || 150} يمكنك تجميع الرصيد المطلوب فقط اجلس معنا ساعتين
              </span>
            </div>

            {/* Row 2: Price Box */}
            <div className="bg-[#cbd5e1] text-[#0f172a] p-3 rounded-xl text-center text-xs sm:text-sm font-black shadow-xs flex items-center justify-center gap-1.5">
              <span>🪙 السعر : {currentItem?.price || 150}</span>
            </div>

            {/* Row 3: PayPal / Top-up Info Box */}
            <div className="bg-[#cbd5e1] text-[#0f172a] p-3 rounded-xl text-center text-xs sm:text-sm font-black shadow-xs leading-relaxed">
              <span>🏆 لا تمتلك رصيد كافي ؟ يمكنك شراء رصيد من خلال باى بال </span>
              <button
                onClick={() => alert('لشراء الرصيد يرجى التواصل مع إدراة الشات')}
                className="text-red-600 font-black underline cursor-pointer hover:text-red-700 px-1"
              >
                من هنا
              </button>
            </div>

            {/* Row 4: Duration Box */}
            <div className="bg-[#cbd5e1] text-[#0f172a] p-3 rounded-xl text-center text-xs sm:text-sm font-black shadow-xs flex items-center justify-center gap-1.5">
              <Clock className="w-4 h-4 text-slate-800" />
              <span>مدة بقاء العضوية : 1 شهر</span>
            </div>

            {/* Row 5: Buy Now Button (Green Pill Button) */}
            <div className="pt-2">
              <button
                onClick={handleBuy}
                className="w-full bg-[#70a800] hover:bg-[#82b440] active:scale-[0.98] text-white font-black text-base sm:text-lg py-3 px-4 rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5 fill-white text-white" />
                <span>شراء الان</span>
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
