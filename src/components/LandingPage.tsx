import React, { useState } from 'react';
import { useChat } from '../context/ChatContext';
import { Gender } from '../types';
import {
  Send, User, Lock, UserPlus, X, Crown, Globe, Sparkles,
  MessageCircle, Mail, Users, Heart, Mic, Shield, Smartphone,
  Zap, CheckCircle2, ChevronDown, Edit, LogIn, HelpCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { loginAsVisitor, loginAsMember, registerAccount, loginAsOwner, siteSettings, showTopBanner } = useChat();

  // Active modal state: null | 'login' | 'visitor' | 'register'
  const [activeModal, setActiveModal] = useState<'login' | 'visitor' | 'register' | null>(null);

  // Member login form fields
  const [memberName, setMemberName] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberError, setMemberError] = useState('');

  // Visitor login form fields
  const [visitorName, setVisitorName] = useState('');
  const [visitorAge, setVisitorAge] = useState<number | string>('العمر');
  const [visitorGender, setVisitorGender] = useState<Gender>('male');
  const [visitorMode, setVisitorMode] = useState<'chat' | 'silent'>('chat');

  // Register form fields
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAge, setRegAge] = useState<number | string>('العمر');
  const [regGender, setRegGender] = useState<Gender>('male');
  const [regError, setRegError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // Check Cookie / Device Ban
  const isDeviceBanned = () => {
    try {
      return localStorage.getItem('araby_device_banned') === 'true' || document.cookie.includes('araby_ban=1');
    } catch (e) {
      return false;
    }
  };

  // Handle member login submit
  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeviceBanned()) {
      setMemberError('🚫 هذا الجهاز محظور من الدخول إلى الدردشة');
      return;
    }
    setMemberError('');
    if (!memberName.trim() || !memberPassword) {
      setMemberError('الرجاء إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    const res = loginAsMember(memberName, memberPassword);
    if (!res.success && res.error) {
      setMemberError(res.error);
    } else {
      setActiveModal(null);
    }
  };

  // Handle visitor login submit
  const handleVisitorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeviceBanned()) {
      alert('🚫 هذا الجهاز محظور من الدخول كزائر');
      return;
    }
    const ageVal = visitorAge === 'العمر' ? 'عدم الإظهار' : visitorAge;
    loginAsVisitor(visitorName, ageVal, visitorGender);
    if (visitorMode === 'silent' || siteSettings.guestChatMode === 'silent') {
      showTopBanner('🔇 دخلت في وضع الزائر الصامت (للمشاهدة وتصفح الغرف فقط)');
    }
    setActiveModal(null);
  };

  // Handle registration submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeviceBanned()) {
      setRegError('🚫 هذا الجهاز محظور من تسجيل حسابات جديدة');
      return;
    }
    setRegError('');

    // Optional email verification flow
    if (siteSettings.requireEmailVerification && regEmail.trim() && !codeSent) {
      setCodeSent(true);
      showTopBanner(`📧 تم إرسال رمز التحقق التجريبي إلى: ${regEmail}`);
      return;
    }

    if (codeSent && verificationCode.trim().length < 4) {
      setRegError('يرجى إدخال رمز التحقق المكون من 4 أرقام على الأقل');
      return;
    }

    const ageVal = regAge === 'العمر' ? 'عدم الإظهار' : regAge;
    const res = registerAccount(regName, regPassword, regEmail, ageVal, regGender);
    if (!res.success && res.error) {
      setRegError(res.error);
    } else {
      setActiveModal(null);
    }
  };

  const ageOptions = Array.from({ length: 65 }, (_, i) => i + 16);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between font-sans dir-rtl" dir="rtl">
      
      {/* TOP HEADER BAR */}
      <header className="bg-[#131b26] text-white py-3 px-4 sm:px-8 border-b border-slate-800 flex items-center justify-between shadow-md">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-2">
          <div className="flex items-center text-lg sm:text-xl font-black tracking-tight">
            <span className="bg-[#0284c7] text-white px-2.5 py-0.5 rounded-l-md text-sm font-extrabold flex items-center gap-1 shadow-xs">
              <MessageCircle className="w-4 h-4" />
              Araby
            </span>
            <span className="bg-[#dc2626] text-white px-2.5 py-0.5 rounded-r-md text-sm font-extrabold shadow-xs">
              Chat
            </span>
          </div>
        </div>

        {/* Right Side: Country Flag Icon */}
        <div className="flex items-center gap-2">
          <div className="bg-[#82b400] px-2.5 py-1 rounded-md text-white font-bold text-xs flex items-center gap-1 shadow-xs">
            <span className="text-base leading-none">🇸🇦</span>
          </div>
        </div>
      </header>

      {/* HERO SECTION WITH TEAL/CYAN GRADIENT */}
      <main className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#0284c7] via-[#0284c7] to-[#0369a1] text-white px-4 py-12 sm:py-16 text-center relative overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-xl w-full mx-auto relative z-10 flex flex-col items-center">
          
          {/* Main Title */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-md text-white">
            دردشة تعارف عربي
          </h1>

          {/* Subtitle / Description */}
          <p className="text-sm sm:text-base md:text-lg text-sky-100 max-w-md font-medium leading-relaxed mb-8 px-2 drop-shadow-xs">
            دردشة عربي هو موقع تعارف شباب وبنات العرب محادثات عامة ومحادثات خاصة
          </p>

          {/* MAIN BUTTONS CONTAINER */}
          <div className="w-full max-w-xs sm:max-w-sm space-y-3.5 mb-6">
            
            {/* BUTTON 1: دخول (Green Button -> Opens Member Login Modal) */}
            <button
              onClick={() => {
                setMemberError('');
                setActiveModal('login');
              }}
              className="w-full bg-[#82b400] hover:bg-[#73a000] text-white font-black text-lg py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border border-lime-400/30"
            >
              <Send className="w-5 h-5 -rotate-90 transform" />
              <span>دخول</span>
            </button>

            {/* BUTTON 2: دخول الزوار (Black Button -> Opens Visitor Modal) */}
            <button
              onClick={() => setActiveModal('visitor')}
              className="w-full bg-[#131b26] hover:bg-[#0f172a] text-white font-black text-lg py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border border-slate-700/50"
            >
              <span>دخول الزوار</span>
            </button>

          </div>

          {/* REGISTER LINK BELOW BUTTONS */}
          <button
            onClick={() => {
              setRegError('');
              setActiveModal('register');
            }}
            className="text-white text-sm font-extrabold hover:underline transition-all cursor-pointer opacity-90 hover:opacity-100 flex items-center gap-1 py-1 px-3 rounded-lg hover:bg-white/10"
          >
            <span>. لست مسجل لدينا ؟ سجل الآن</span>
          </button>

          {/* Sub-Option for Testing/Owner */}
          <div className="mt-8 pt-4 border-t border-white/20 w-full max-w-xs flex justify-center">
            <button
              onClick={() => loginAsOwner()}
              className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold px-3 py-1.5 rounded-full border border-amber-300/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>دخول مباشر كمالك الشات 👑 (هيبة ملك)</span>
            </button>
          </div>

        </div>
      </main>

      {/* MODAL OVERLAY - RENDERED WHEN ANY MODAL IS ACTIVE */}
      {activeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 dir-rtl" dir="rtl">
          
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 transform transition-all">
            
            {/* MODAL HEADER - DARK NAVY BAR */}
            <div className="bg-[#131b26] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                {activeModal === 'login' && <LogIn className="w-4 h-4 text-sky-400" />}
                {activeModal === 'visitor' && <User className="w-4 h-4 text-sky-400" />}
                {activeModal === 'register' && <UserPlus className="w-4 h-4 text-sky-400" />}
                {activeModal === 'login' && 'تسجيل الدخول للأعضاء'}
                {activeModal === 'visitor' && 'دخول الزوار السريع'}
                {activeModal === 'register' && 'إنشاء حساب جديد'}
              </span>

              {/* CLOSE BUTTON */}
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY CONTENT */}
            <div className="p-5 text-right">

              {/* ----------------- MODAL 1: MEMBER LOGIN ----------------- */}
              {activeModal === 'login' && (
                <form onSubmit={handleMemberSubmit} className="space-y-4">
                  {memberError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg text-right">
                      {memberError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اسم المستخدم / البريد الإلكتروني
                    </label>
                    <input
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="اسم الحساب..."
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00aeeF] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      value={memberPassword}
                      onChange={(e) => setMemberPassword(e.target.value)}
                      placeholder="كلمة المرور..."
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00aeeF] transition-colors"
                      required
                    />
                  </div>

                  {/* QUICK TEST ACCOUNTS PILLS */}
                  <div className="p-2 bg-slate-50 border border-slate-200/70 rounded-lg text-[11px] text-slate-500">
                    <span className="font-bold text-slate-700 block mb-1">حسابات تجريبية سريعة:</span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => { setMemberName('هيبة ملك'); setMemberPassword('123'); }}
                        className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-300 text-[10px]"
                      >
                        👑 المالك (123)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMemberName('خنجر يماني'); setMemberPassword('123'); }}
                        className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold border border-rose-300 text-[10px]"
                      >
                        ⭐ المدير (123)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMemberName('صنعاني مشرف'); setMemberPassword('123'); }}
                        className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 font-bold border border-sky-300 text-[10px]"
                      >
                        🛡️ المشرف (123)
                      </button>
                    </div>
                  </div>

                  {/* CYAN LOGIN BUTTON */}
                  <button
                    type="submit"
                    className="w-full bg-[#00aeeF] hover:bg-[#0284c7] text-white font-extrabold text-base py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>دخول</span>
                    <LogIn className="w-4 h-4 rotate-180" />
                  </button>

                  {/* FORGOT PASSWORD LINK */}
                  <button
                    type="button"
                    onClick={() => alert('الرجاء التواصل مع إدارة الشات لإعادة تعيين كلمة المرور.')}
                    className="block w-full text-center text-xs text-slate-500 hover:text-sky-600 transition-colors pt-1 cursor-pointer"
                  >
                    نسيت كلمة المرور ؟
                  </button>

                  {/* BOTTOM GRAY CONTAINER LINK */}
                  <div className="-mx-5 -mb-5 mt-4 p-3.5 bg-[#f8fafc] border-t border-slate-200/80 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        setRegError('');
                        setActiveModal('register');
                      }}
                      className="text-xs font-bold text-slate-700 hover:text-sky-600 transition-colors cursor-pointer"
                    >
                      . لست مسجل لدينا ؟ سجل الآن
                    </button>
                  </div>
                </form>
              )}

              {/* ----------------- MODAL 2: VISITOR LOGIN ----------------- */}
              {activeModal === 'visitor' && (
                <form onSubmit={handleVisitorSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      اسم المستخدم (زائر)
                    </label>
                    <input
                      type="text"
                      value={visitorName}
                      onChange={(e) => setVisitorName(e.target.value)}
                      placeholder="اختر اسماً للزائر..."
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00aeeF] transition-colors"
                      required
                    />
                  </div>

                  {/* VISITOR MODE SELECTOR: CHAT OR SILENT */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      نوع دخول الزائر
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setVisitorMode('chat')}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          visitorMode === 'chat'
                            ? 'bg-[#00aeeF]/10 border-[#00aeeF] text-[#0284c7]'
                            : 'bg-[#f4f5f7] border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>مسموح بالدردشة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisitorMode('silent')}
                        className={`p-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                          visitorMode === 'silent'
                            ? 'bg-amber-50 border-amber-400 text-amber-800'
                            : 'bg-[#f4f5f7] border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>🔇 دخول صامت (مشاهدة)</span>
                      </button>
                    </div>
                  </div>

                  {/* TWO DROPDOWNS ROW: GENDER & AGE */}
                  <div className="grid grid-cols-2 gap-3">
                    
                    {/* RIGHT: GENDER DROPDOWN */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        الجنس
                      </label>
                      <select
                        value={visitorGender}
                        onChange={(e) => setVisitorGender(e.target.value as Gender)}
                        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00aeeF] cursor-pointer"
                      >
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </select>
                    </div>

                    {/* LEFT: AGE DROPDOWN */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        العمر
                      </label>
                      <select
                        value={visitorAge}
                        onChange={(e) => setVisitorAge(e.target.value === 'العمر' ? 'العمر' : Number(e.target.value))}
                        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00aeeF] cursor-pointer"
                      >
                        <option value="العمر">العمر</option>
                        {ageOptions.map(age => (
                          <option key={age} value={age}>{age}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* CYAN SUBMIT BUTTON */}
                  <button
                    type="submit"
                    className="w-full bg-[#00aeeF] hover:bg-[#0284c7] text-white font-extrabold text-base py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
                  >
                    <span>دخول</span>
                    <LogIn className="w-4 h-4 rotate-180" />
                  </button>
                </form>
              )}

              {/* ----------------- MODAL 3: REGISTER ACCOUNT ----------------- */}
              {activeModal === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {regError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg text-right">
                      {regError}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      اسم المستخدم
                    </label>
                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="اسمك الجديد..."
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00aeeF] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      كلمة المرور
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="كلمة المرور..."
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00aeeF] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        البريد الإلكتروني
                      </label>
                      <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                        {siteSettings.requireEmailVerification ? 'مطلوب للتحقق 🔒' : 'اختياري (لحماية الحساب)'}
                      </span>
                    </div>
                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="example@mail.com"
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00aeeF] transition-colors"
                    />
                  </div>

                  {codeSent && (
                    <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl space-y-2 animate-in fade-in">
                      <p className="text-xs font-bold text-sky-800">
                        أدخل رمز التحقق المكون من 4 أرقام (تجريبي: 1234):
                      </p>
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        placeholder="1234"
                        className="w-full bg-white border border-sky-300 rounded-lg px-3 py-2 text-center text-sm font-black tracking-widest text-slate-800"
                      />
                    </div>
                  )}

                  {/* TWO DROPDOWNS ROW: GENDER & AGE */}
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    
                    {/* RIGHT: GENDER DROPDOWN */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        الجنس
                      </label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value as Gender)}
                        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00aeeF] cursor-pointer"
                      >
                        <option value="male">ذكر</option>
                        <option value="female">أنثى</option>
                      </select>
                    </div>

                    {/* LEFT: AGE DROPDOWN */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        العمر
                      </label>
                      <select
                        value={regAge}
                        onChange={(e) => setRegAge(e.target.value === 'العمر' ? 'العمر' : Number(e.target.value))}
                        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00aeeF] cursor-pointer"
                      >
                        <option value="العمر">العمر</option>
                        {ageOptions.map(age => (
                          <option key={age} value={age}>{age}</option>
                        ))}
                      </select>
                    </div>

                  </div>

                  {/* CYAN REGISTER BUTTON */}
                  <button
                    type="submit"
                    className="w-full bg-[#00aeeF] hover:bg-[#0284c7] text-white font-extrabold text-base py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
                  >
                    <span>{codeSent ? 'تأكيد التسجيل' : 'تسجيل حساب جديد'}</span>
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* TERMS TEXT */}
                  <p className="text-[11px] text-slate-500 text-center pt-2">
                    بتسجيلك أنت توافق على شروط الاستخدام وقوانين الدردشة
                  </p>
                </form>
              )}

            </div>

          </div>

        </div>
      )}

      {/* BOTTOM CONTENT / DESCRIPTIVE SECTION */}
      <section className="bg-white border-t border-slate-200 py-10 px-4 sm:px-8 dir-rtl" dir="rtl">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Main Headline */}
          <div className="text-center border-b border-slate-100 pb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              دردشة عربية | شات عربي |
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl mx-auto leading-relaxed">
              منصة تواصل عربية حديثة وآمنة تتيح لك التعارف والدردشة العامة والخاصة مجاناً وبدون تسجيل مع شباب وبنات الوطن العربي.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-center">
              <span className="text-2xl block mb-2">💬</span>
              <h3 className="font-bold text-sm text-slate-800">محادثات عامة وخاصة</h3>
              <p className="text-xs text-slate-500 mt-1">غرف وتفاعل مستمر على مدار الساعة</p>
            </div>

            <div className="p-4 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-center">
              <span className="text-2xl block mb-2">🎤</span>
              <h3 className="font-bold text-sm text-slate-800">رسائل صوتية ورومات</h3>
              <p className="text-xs text-slate-500 mt-1">تعبير صريح وتفاعل حي ممتاز</p>
            </div>

            <div className="p-4 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-center">
              <span className="text-2xl block mb-2">🌍</span>
              <h3 className="font-bold text-sm text-slate-800">ربط وتحديد الدول تلقائياً</h3>
              <p className="text-xs text-slate-500 mt-1">عرض الدولة والعلم تلقائياً بالـ IP</p>
            </div>

            <div className="p-4 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-center">
              <span className="text-2xl block mb-2">🔒</span>
              <h3 className="font-bold text-sm text-slate-800">أمان وحظر التطفل</h3>
              <p className="text-xs text-slate-500 mt-1">تشفير وحماية الخصوصية كاملة</p>
            </div>
          </div>

          {/* Site Policy */}
          <div className="p-5 bg-slate-900 text-slate-100 rounded-xl shadow-xs">
            <h3 className="font-bold text-base text-amber-400 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>سياسة الشات والخصوصية</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>احترام الأعضاء والالتزام بالآداب العامة وعدم التجاوز.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>يمنع نشر الإعلانات التجارية أو الروابط المجهولة.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>مراجعة فورية للبلاغات من قِبل فريق المشرفين والإدارة.</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#131b26] text-slate-400 border-t border-slate-800 py-4 text-center text-xs">
        <p>© 2026 Araby Chat - جميع الحقوق محفوظة | شات عربى ودردشة تعارف</p>
      </footer>

    </div>
  );
};
