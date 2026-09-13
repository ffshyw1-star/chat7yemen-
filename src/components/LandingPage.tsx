import React, { useState, useEffect } from 'react';
import { useChat } from '../context/ChatContext';
import { Gender } from '../types';
import { formatEnglishTime } from '../utils/dateUtils';
import {
  Send, User, Lock, UserPlus, X, Crown, Globe, Sparkles,
  MessageCircle, Mail, Users, Heart, Mic, Shield, Smartphone,
  Zap, CheckCircle2, ChevronDown, Edit, LogIn, HelpCircle
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const {
    loginAsVisitor, loginAsMember, registerAccount, loginWithFirebaseGoogle,
    siteSettings, showTopBanner, checkIpStatus, clientIp, unbanMyDeviceAndIp,
    currentLang, setAppLanguage, isRtl
  } = useChat();

  const isEnglish = currentLang === 'English';
  const [showLangMenu, setShowLangMenu] = useState(false);

  // Active modal state: null | 'login' | 'visitor' | 'register'
  const [activeModal, setActiveModal] = useState<'login' | 'visitor' | 'register' | null>(null);

  // Member login form fields
  const [memberName, setMemberName] = useState('');
  const [memberPassword, setMemberPassword] = useState('');
  const [memberError, setMemberError] = useState('');

  // Visitor login form fields
  const [visitorName, setVisitorName] = useState('');
  const [visitorAge, setVisitorAge] = useState<number | string>('العمر');
  const [visitorGender, setVisitorGender] = useState<Gender | ''>('');
  const [visitorMode, setVisitorMode] = useState<'chat' | 'silent'>('chat');
  const [visitorError, setVisitorError] = useState('');

  // Register form fields
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAge, setRegAge] = useState<number | string>('العمر');
  const [regGender, setRegGender] = useState<Gender>('male');
  const [regError, setRegError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);

  // Auto unban owner IP on landing load
  useEffect(() => {
    if (clientIp === '197.220.12.89') {
      try {
        localStorage.removeItem('araby_device_banned');
        document.cookie = 'araby_ban=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } catch (e) {}
    }
  }, [clientIp]);

  // Check Cookie / Device Ban or IP Ban
  const isDeviceBanned = () => {
    if (clientIp === '197.220.12.89') {
      try {
        localStorage.removeItem('araby_device_banned');
        document.cookie = 'araby_ban=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } catch (e) {}
      return false;
    }
    const ipCheck = checkIpStatus();
    if (ipCheck.isBanned) return true;
    try {
      return localStorage.getItem('araby_device_banned') === 'true' || document.cookie.includes('araby_ban=1');
    } catch (e) {
      return false;
    }
  };

  const handleUnbanMyDevice = async () => {
    try {
      localStorage.removeItem('araby_device_banned');
      document.cookie = 'araby_ban=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    } catch (e) {}
    await unbanMyDeviceAndIp(clientIp);
    setMemberError('');
    setVisitorError('');
  };

  // Handle member login submit
  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const isOwnerAttempt = memberName.trim().toLowerCase() === 'owner';
    if (isOwnerAttempt) {
      try {
        localStorage.removeItem('araby_device_banned');
        document.cookie = 'araby_ban=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      } catch (e) {}
      unbanMyDeviceAndIp(clientIp).catch(() => {});
    } else if (isDeviceBanned()) {
      setMemberError(`🚫 هذا الجهاز / الآي بي (${clientIp}) محظور نهائياً من الدخول إلى الدردشة`);
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
  const handleVisitorSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVisitorError('');
    const isOwnerIp = clientIp === '197.220.12.89';
    if (!isOwnerIp) {
      const ipCheck = checkIpStatus();
      if (ipCheck.isBanned) {
        setVisitorError(`🚫 هذا الجهاز والآي بي (${clientIp}) محظور نهائياً من الدخول للدردشة.`);
        return;
      }
      if (ipCheck.isKicked) {
        const exp = ipCheck.kickedRecord?.expiresAt ? formatEnglishTime(new Date(ipCheck.kickedRecord.expiresAt)) : 'انتهاء المدة';
        setVisitorError(`🚫 تم طرد هذا الآي بي كزائر حتى ${exp}. لا يمكنك الدخول كزائر، لكن يمكنك الدخول بعضوية مسجلة مسبقاً.`);
        return;
      }
      if (isDeviceBanned()) {
        setVisitorError('🚫 هذا الجهاز محظور من الدخول كزائر');
        return;
      }
    }
    if (siteSettings?.hideVisitorLogin) {
      setVisitorError(isEnglish ? 'Guest login is currently disabled by administration' : '🚫 تم تعطيل دخول الزوار حالياً من قبل إدارة الموقع');
      return;
    }

    const cleanName = visitorName.trim();
    if (!cleanName) {
      setVisitorError(isEnglish ? 'Please enter a nickname' : 'الرجاء إدخال اسم الزائر');
      return;
    }
    if (cleanName.length < 2) {
      setVisitorError(isEnglish ? 'Nickname must be at least 2 characters' : 'يجب أن يتكون اسم الزائر من حرفين على الأقل');
      return;
    }
    const maxUserLen = siteSettings?.maxUsernameLength || 20;
    if (cleanName.length > maxUserLen) {
      setVisitorError(isEnglish ? `Nickname cannot exceed ${maxUserLen} characters` : `🚫 اسم الزائر يتجاوز الحد الأقصى المسموح به (${maxUserLen} حرفاً)`);
      return;
    }

    // Mandatory Gender Check (ذكر، أنثى، آخر)
    if (!visitorGender || (visitorGender !== 'male' && visitorGender !== 'female' && (visitorGender as string) !== 'other')) {
      setVisitorError(isEnglish ? 'Please select your gender (Male, Female, Other)' : 'الرجاء تحديد الجنس (ذكر، أنثى، آخر) لإكمال الدخول');
      return;
    }

    // Mandatory Age Check
    if (visitorAge === 'العمر' || !visitorAge) {
      setVisitorError(isEnglish ? 'Please select your age' : 'الرجاء تحديد العمر لإكمال الدخول كزائر');
      return;
    }

    const ageVal = Number(visitorAge);
    const res = await loginAsVisitor(cleanName, ageVal, visitorGender as Gender);
    if (res && !res.success) {
      setVisitorError(res.error || (isEnglish ? 'Could not enter as guest' : 'تعذر الدخول كزائر'));
      return;
    }
    if (visitorMode === 'silent' || siteSettings.guestChatMode === 'silent') {
      showTopBanner('🔇 دخلت في وضع الزائر الصامت (للمشاهدة وتصفح الغرف فقط)');
    }
    setActiveModal(null);
  };

  // Handle registration submit
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDeviceBanned()) {
      setRegError(`🚫 هذا الجهاز والآي بي (${clientIp}) محظور من تسجيل حسابات جديدة`);
      return;
    }
    const ipCheck = checkIpStatus();
    if (ipCheck.isKicked) {
      setRegError('🚫 لا يمكن تسجيل عضوية جديدة خلال فترة طرد الآي بي المؤقت');
      return;
    }
    setRegError('');

    const maxUserLen = siteSettings?.maxUsernameLength || 20;
    if (regName.trim().length > maxUserLen) {
      setRegError(isEnglish ? `Username cannot exceed ${maxUserLen} characters` : `🚫 اسم المستخدم يتجاوز الحد الأقصى المسموح (${maxUserLen} حرفاً)`);
      return;
    }

    if (regPassword.length < 6) {
      setRegError('كلمة المرور قصيرة جداً، يجب أن تتكون من 6 خانات (أحرف أو أرقام) على الأقل للأمان 🔒');
      return;
    }

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
    <div className={`min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between font-sans ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* TOP HEADER BAR */}
      <header className="bg-[#131b26] text-white py-3 px-4 sm:px-8 border-b border-slate-800 flex items-center justify-between shadow-md relative z-40">
        {/* Left Side: Logo (شات اليمن / Yemen Chat) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center text-lg sm:text-xl font-black tracking-tight select-none">
            <span className="bg-[#0284c7] text-white px-2.5 py-0.5 rounded-l-md text-sm font-extrabold flex items-center gap-1 shadow-xs">
              <MessageCircle className="w-4 h-4" />
              {isEnglish ? 'Yemen' : 'شات'}
            </span>
            <span className="bg-[#dc2626] text-white px-2.5 py-0.5 rounded-r-md text-sm font-extrabold shadow-xs">
              {isEnglish ? 'Chat' : 'اليمن'}
            </span>
          </div>
        </div>

        {/* Right Side: Interactive Flag Dropdown Switcher */}
        <div className="relative">
          <button
            id="country-flag-lang-btn"
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="bg-[#82b400] hover:bg-[#74a000] px-3 py-1.5 rounded-lg text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer border border-lime-400/40 active:scale-95"
            title={isEnglish ? 'Switch Language / تغيير اللغة' : 'تغيير اللغة / Switch Language'}
          >
            <span className="text-base leading-none">{isEnglish ? '🇺🇸' : '🇸🇦'}</span>
            <span className="text-xs font-black">{isEnglish ? 'English' : 'العربية'}</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${showLangMenu ? 'rotate-180' : ''}`} />
          </button>

          {/* Languages Dropdown: Saudi Flag (Arabic) & USA Flag (English) */}
          {showLangMenu && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowLangMenu(false)} 
              />
              <div 
                className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-72 bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-150`}
                dir={isRtl ? 'rtl' : 'ltr'}
              >
                <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                  <span>{isEnglish ? 'Select Site Language' : 'اختر لغة الموقع'}</span>
                  <Globe className="w-4 h-4 text-sky-500" />
                </div>

                <div className="mt-1 space-y-1">
                  {/* Option 1: علم السعودية - اللغة العربية */}
                  <button
                    id="lang-option-saudi-arabic"
                    onClick={() => {
                      setAppLanguage('Arabic');
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      !isEnglish
                        ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-xs'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none">🇸🇦</span>
                      <div className="text-start">
                        <p className="font-extrabold text-slate-900 text-sm">علم السعودية</p>
                        <p className="text-[11px] text-slate-500 font-semibold">اللغة العربية</p>
                      </div>
                    </div>
                    {!isEnglish && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    )}
                  </button>

                  {/* Option 2: علم أمريكا - اللغة الإنجليزية */}
                  <button
                    id="lang-option-usa-english"
                    onClick={() => {
                      setAppLanguage('English');
                      setShowLangMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                      isEnglish
                        ? 'bg-amber-50 text-amber-900 border border-amber-300 shadow-xs'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl leading-none">🇺🇸</span>
                      <div className="text-start">
                        <p className="font-extrabold text-slate-900 text-sm">علم أمريكا</p>
                        <p className="text-[11px] text-slate-500 font-semibold">اللغة الإنجليزية</p>
                      </div>
                    </div>
                    {isEnglish && (
                      <CheckCircle2 className="w-4 h-4 text-amber-600" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      {/* HERO SECTION WITH TEAL/CYAN GRADIENT */}
      <main className="flex-1 flex flex-col items-center justify-center bg-gradient-to-b from-[#0284c7] via-[#0284c7] to-[#0369a1] text-white px-4 py-12 sm:py-16 text-center relative overflow-hidden">
        
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-xl w-full mx-auto relative z-10 flex flex-col items-center">
          
          {/* Main Title: دردشة تعارف / Dating & Chat */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-4 drop-shadow-md text-white">
            {isEnglish ? (siteSettings.landingTitleEn || 'Dating & Chat') : (siteSettings.landingTitle || 'دردشة تعارف')}
          </h1>

          {/* Subtitle / Description */}
          <p className="text-sm sm:text-base md:text-lg text-sky-100 max-w-md font-medium leading-relaxed mb-8 px-2 drop-shadow-xs">
            {isEnglish
              ? (siteSettings.landingSubtitleEn || 'Free online chat rooms for friends to meet and talk in public and private without registration')
              : (siteSettings.landingSubtitle || 'دردشة تعارف هو موقع تعارف شباب وبنات العرب محادثات عامة ومحادثات خاصة بدون تسجيل')}
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
              <LogIn className="w-5 h-5" />
              <span>{isEnglish ? 'Login' : 'دخول'}</span>
            </button>

            {/* BUTTON 2: دخول الزوار (Black Button -> Opens Visitor Modal) */}
            {!siteSettings?.hideVisitorLogin && (
              <button
                onClick={() => {
                  setVisitorError('');
                  setActiveModal('visitor');
                }}
                className="w-full bg-[#131b26] hover:bg-[#0f172a] text-white font-black text-lg py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border border-slate-700/50"
              >
                <span>{isEnglish ? 'Guest Login' : 'دخول الزوار'}</span>
              </button>
            )}

            {/* BUTTON 3: تسجيل سريع عبر Firebase Authentication */}
            <button
              onClick={async () => {
                const res = await loginWithFirebaseGoogle();
                if (!res.success && res.error) {
                  setMemberError(res.error);
                  setActiveModal('login');
                }
              }}
              className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-black text-base py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all transform active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer border border-sky-400/30"
            >
              <span>⚡</span>
              <span>{isEnglish ? 'Quick Sign-in via Firebase' : 'تسجيل سريع عبر Firebase Authentication'}</span>
            </button>

          </div>

          {/* REGISTER LINK BELOW BUTTONS */}
          {!siteSettings?.hideRegisterLink && (
            <button
              onClick={() => {
                setRegError('');
                setActiveModal('register');
              }}
              className="text-white text-sm font-extrabold hover:underline transition-all cursor-pointer opacity-90 hover:opacity-100 flex items-center gap-1 py-1 px-3 rounded-lg hover:bg-white/10"
            >
              <span>{isEnglish ? 'Not registered yet? Register now' : '. لست مسجل لدينا ؟ سجل الآن'}</span>
            </button>
          )}

        </div>
      </main>

      {/* MODAL OVERLAY - RENDERED WHEN ANY MODAL IS ACTIVE */}
      {activeModal && (
        <div className={`fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
          
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 transform transition-all">
            
            {/* MODAL HEADER - DARK NAVY BAR */}
            <div className="bg-[#131b26] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <span className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                {activeModal === 'login' && <LogIn className="w-4 h-4 text-sky-400" />}
                {activeModal === 'visitor' && <User className="w-4 h-4 text-sky-400" />}
                {activeModal === 'register' && <UserPlus className="w-4 h-4 text-sky-400" />}
                {activeModal === 'login' && (isEnglish ? 'Member Login' : 'تسجيل الدخول للأعضاء')}
                {activeModal === 'visitor' && (isEnglish ? 'Quick Guest Login' : 'دخول الزوار السريع')}
                {activeModal === 'register' && (isEnglish ? 'Create New Account' : 'إنشاء حساب جديد')}
              </span>

              {/* CLOSE BUTTON */}
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                title={isEnglish ? 'Close' : 'إغلاق'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* MODAL BODY CONTENT */}
            <div className={`p-5 ${isRtl ? 'text-right' : 'text-left'}`}>

              {/* ----------------- MODAL 1: MEMBER LOGIN ----------------- */}
              {activeModal === 'login' && (
                <form onSubmit={handleMemberSubmit} className="space-y-4">
                  {memberError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg space-y-2">
                      <div>{memberError}</div>
                      {(memberError.includes('محظور') || memberError.includes('banned')) && (
                        <button
                          type="button"
                          onClick={handleUnbanMyDevice}
                          className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                        >
                          <span>🔓 فك حظر هذا الجهاز والـ IP فوراً</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isEnglish ? 'Username / Email' : 'اسم المستخدم / البريد الإلكتروني'}
                    </label>
                    <input
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder={isEnglish ? 'Account username...' : 'اسم الحساب...'}
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00aeeF] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isEnglish ? 'Password' : 'كلمة المرور'}
                    </label>
                    <input
                      type="password"
                      value={memberPassword}
                      onChange={(e) => setMemberPassword(e.target.value)}
                      placeholder={isEnglish ? 'Password...' : 'كلمة المرور...'}
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00aeeF] transition-colors"
                      required
                    />
                  </div>

                  {/* CYAN LOGIN BUTTON */}
                  <button
                    type="submit"
                    className="w-full bg-[#00aeeF] hover:bg-[#0284c7] text-white font-extrabold text-base py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-3"
                  >
                    <span>{isEnglish ? 'Login' : 'دخول'}</span>
                    <LogIn className={`w-4 h-4 ${isRtl ? 'rotate-180' : 'rotate-0'}`} />
                  </button>

                  {/* FORGOT PASSWORD LINK */}
                  <button
                    type="button"
                    onClick={() => alert(isEnglish ? 'Please contact chat administration to reset your password.' : 'الرجاء التواصل مع إدارة الشات لإعادة تعيين كلمة المرور.')}
                    className="block w-full text-center text-xs text-slate-500 hover:text-sky-600 transition-colors pt-1 cursor-pointer"
                  >
                    {isEnglish ? 'Forgot password?' : 'نسيت كلمة المرور ؟'}
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
                      {isEnglish ? 'Not registered yet? Register now' : '. لست مسجل لدينا ؟ سجل الآن'}
                    </button>
                  </div>
                </form>
              )}

              {/* ----------------- MODAL 2: VISITOR LOGIN ----------------- */}
              {activeModal === 'visitor' && (
                <form onSubmit={handleVisitorSubmit} className="space-y-4">
                  {visitorError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-base">⚠️</span>
                        <span>{visitorError}</span>
                      </div>
                      {(visitorError.includes('محظور') || visitorError.includes('banned')) && (
                        <button
                          type="button"
                          onClick={handleUnbanMyDevice}
                          className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-98"
                        >
                          <span>🔓 فك حظر هذا الجهاز والـ IP فوراً</span>
                        </button>
                      )}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-bold text-slate-700">
                        {isEnglish ? 'Guest Nickname' : 'اسم المستخدم (زائر)'} <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {visitorName.length} / {siteSettings?.maxUsernameLength || 20}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={visitorName}
                      maxLength={siteSettings?.maxUsernameLength || 20}
                      onChange={(e) => {
                        setVisitorName(e.target.value);
                        if (visitorError) setVisitorError('');
                      }}
                      placeholder={isEnglish ? 'Choose a unique nickname...' : 'اختر اسماً فريداً للزائر...'}
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00aeeF] transition-colors"
                      required
                      autoFocus
                    />
                  </div>

                  {/* GENDER SELECTOR (ذكر / أنثى / آخر) - MANDATORY */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isEnglish ? 'Gender' : 'الجنس'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setVisitorGender('male');
                          if (visitorError) setVisitorError('');
                        }}
                        className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          visitorGender === 'male'
                            ? 'bg-sky-100 border-sky-500 text-sky-800 ring-2 ring-sky-500 font-black shadow-xs'
                            : 'bg-[#f4f5f7] border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{isEnglish ? '👨 Male' : '👨 ذكر'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVisitorGender('female');
                          if (visitorError) setVisitorError('');
                        }}
                        className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          visitorGender === 'female'
                            ? 'bg-rose-100 border-rose-500 text-rose-800 ring-2 ring-rose-500 font-black shadow-xs'
                            : 'bg-[#f4f5f7] border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{isEnglish ? '👩 Female' : '👩 أنثى'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVisitorGender('other');
                          if (visitorError) setVisitorError('');
                        }}
                        className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                          visitorGender === 'other'
                            ? 'bg-purple-100 border-purple-500 text-purple-800 ring-2 ring-purple-500 font-black shadow-xs'
                            : 'bg-[#f4f5f7] border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <span>{isEnglish ? '⚧️ Other' : '⚧️ آخر'}</span>
                      </button>
                    </div>
                  </div>

                  {/* AGE SELECTOR - MANDATORY */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {isEnglish ? 'Age' : 'العمر'} <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={visitorAge}
                      onChange={(e) => {
                        setVisitorAge(e.target.value === 'العمر' || e.target.value === 'Age' ? 'العمر' : Number(e.target.value));
                        if (visitorError) setVisitorError('');
                      }}
                      className={`w-full bg-[#f4f5f7] border rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00aeeF] cursor-pointer ${
                        visitorAge === 'العمر' ? 'border-slate-200 text-slate-400' : 'border-sky-400 font-bold text-sky-900 bg-sky-50/50'
                      }`}
                      required
                    >
                      <option value="العمر">{isEnglish ? 'Select Age (Required *)' : 'العمر (تحديد مطلوب *)'}</option>
                      {ageOptions.map(age => (
                        <option key={age} value={age}>{age} {isEnglish ? 'years' : 'سنة'}</option>
                      ))}
                    </select>
                  </div>

                  {/* CYAN SUBMIT BUTTON */}
                  <button
                    type="submit"
                    className="w-full bg-[#00aeeF] hover:bg-[#0284c7] text-white font-extrabold text-base py-2.5 px-4 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 active:scale-98"
                  >
                    <span>{isEnglish ? 'Enter Chat' : 'دخول الدردشة'}</span>
                    <LogIn className={`w-4 h-4 ${isRtl ? 'rotate-180' : 'rotate-0'}`} />
                  </button>
                </form>
              )}

              {/* ----------------- MODAL 3: REGISTER ACCOUNT ----------------- */}
              {activeModal === 'register' && (
                <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                  {regError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-lg">
                      {regError}
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {isEnglish ? 'Username' : 'اسم المستخدم'}
                      </label>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {regName.length} / {siteSettings?.maxUsernameLength || 20}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={regName}
                      maxLength={siteSettings?.maxUsernameLength || 20}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder={isEnglish ? 'Your new username...' : 'اسمك الجديد...'}
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00aeeF] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {isEnglish ? 'Password' : 'كلمة المرور'}
                    </label>
                    <input
                      type="password"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder={isEnglish ? 'Password...' : 'كلمة المرور...'}
                      className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00aeeF] transition-colors"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        {isEnglish ? 'Email Address' : 'البريد الإلكتروني'}
                      </label>
                      <span className="text-[11px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                        {siteSettings.requireEmailVerification ? (isEnglish ? 'Required for verification 🔒' : 'مطلوب للتحقق 🔒') : (isEnglish ? 'Optional (account protection)' : 'اختياري (لحماية الحساب)')}
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
                        {isEnglish ? 'Enter the 4-digit verification code (demo: 1234):' : 'أدخل رمز التحقق المكون من 4 أرقام (تجريبي: 1234):'}
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
                    
                    {/* GENDER DROPDOWN */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isEnglish ? 'Gender' : 'الجنس'}
                      </label>
                      <select
                        value={regGender}
                        onChange={(e) => setRegGender(e.target.value as Gender)}
                        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00aeeF] cursor-pointer"
                      >
                        <option value="male">{isEnglish ? 'Male' : 'ذكر'}</option>
                        <option value="female">{isEnglish ? 'Female' : 'أنثى'}</option>
                      </select>
                    </div>

                    {/* AGE DROPDOWN */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        {isEnglish ? 'Age' : 'العمر'}
                      </label>
                      <select
                        value={regAge}
                        onChange={(e) => setRegAge(e.target.value === 'العمر' || e.target.value === 'Age' ? 'العمر' : Number(e.target.value))}
                        className="w-full bg-[#f4f5f7] border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-[#00aeeF] cursor-pointer"
                      >
                        <option value="العمر">{isEnglish ? 'Age' : 'العمر'}</option>
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
                    <span>{codeSent ? (isEnglish ? 'Confirm Registration' : 'تأكيد التسجيل') : (isEnglish ? 'Register Account' : 'تسجيل حساب جديد')}</span>
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* TERMS TEXT */}
                  <p className="text-[11px] text-slate-500 text-center pt-2">
                    {isEnglish ? 'By registering, you agree to the Terms of Service and Chat Rules' : 'بتسجيلك أنت توافق على شروط الاستخدام وقوانين الدردشة'}
                  </p>
                </form>
              )}

            </div>

          </div>

        </div>
      )}

      {/* BOTTOM CONTENT / DESCRIPTIVE SECTION */}
      <section className={`bg-white border-t border-slate-200 py-10 px-4 sm:px-8 ${isRtl ? 'dir-rtl' : 'dir-ltr'}`} dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Main Headline */}
          <div className="text-center border-b border-slate-100 pb-6">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {isEnglish ? 'Yemen Chat | Dating & Social Chat |' : 'شات اليمن | دردشة تعارف |'}
            </h2>
            <p className="text-sm text-slate-600 mt-2 max-w-2xl mx-auto leading-relaxed">
              {isEnglish
                ? 'A modern and secure communication platform for public and private chat without registration with friends from all over the world.'
                : 'منصة تواصل عربية حديثة وآمنة تتيح لك التعارف والدردشة العامة والخاصة مجاناً وبدون تسجيل مع شباب وبنات الوطن العربي.'}
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-center">
              <span className="text-2xl block mb-2">💬</span>
              <h3 className="font-bold text-sm text-slate-800">{isEnglish ? 'Public & Private' : 'محادثات عامة وخاصة'}</h3>
              <p className="text-xs text-slate-500 mt-1">{isEnglish ? '24/7 continuous room interaction' : 'غرف وتفاعل مستمر على مدار الساعة'}</p>
            </div>

            <div className="p-4 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-center">
              <span className="text-2xl block mb-2">🎤</span>
              <h3 className="font-bold text-sm text-slate-800">{isEnglish ? 'Voice Messages' : 'رسائل صوتية ورومات'}</h3>
              <p className="text-xs text-slate-500 mt-1">{isEnglish ? 'Live voice communication' : 'تعبير صريح وتفاعل حي ممتاز'}</p>
            </div>

            <div className="p-4 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-center">
              <span className="text-2xl block mb-2">🌍</span>
              <h3 className="font-bold text-sm text-slate-800">{isEnglish ? 'Auto Country Detection' : 'ربط وتحديد الدول تلقائياً'}</h3>
              <p className="text-xs text-slate-500 mt-1">{isEnglish ? 'Shows country and flag via IP' : 'عرض الدولة والعلم تلقائياً بالـ IP'}</p>
            </div>

            <div className="p-4 bg-[#f8fafc] border border-slate-200/80 rounded-xl text-center">
              <span className="text-2xl block mb-2">🔒</span>
              <h3 className="font-bold text-sm text-slate-800">{isEnglish ? 'Privacy & Security' : 'أمان وحظر التطفل'}</h3>
              <p className="text-xs text-slate-500 mt-1">{isEnglish ? 'Complete privacy protection' : 'تشفير وحماية الخصوصية كاملة'}</p>
            </div>
          </div>

          {/* Site Policy */}
          <div className="p-5 bg-slate-900 text-slate-100 rounded-xl shadow-xs">
            <h3 className="font-bold text-base text-amber-400 mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-amber-400" />
              <span>{isEnglish ? 'Chat Policy & Privacy' : 'سياسة الشات والخصوصية'}</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300 leading-relaxed">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{isEnglish ? 'Respect all members and observe public decency.' : 'احترام الأعضاء والالتزام بالآداب العامة وعدم التجاوز.'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{isEnglish ? 'Commercial advertising and suspicious links are strictly forbidden.' : 'يمنع نشر الإعلانات التجارية أو الروابط المجهولة.'}</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{isEnglish ? 'Immediate review of all reports by our moderation team.' : 'مراجعة فورية للبلاغات من قِبل فريق المشرفين والإدارة.'}</span>
              </li>
            </ul>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#131b26] text-slate-400 border-t border-slate-800 py-4 text-center text-xs space-y-2">
        <div className="flex items-center justify-center gap-4 text-xs">
          <span>{isEnglish ? '© 2026 Yemen Chat - All rights reserved' : '© 2026 شات اليمن - جميع الحقوق محفوظة'}</span>
          <span>•</span>
          <button
            id="open-cookie-policy-btn"
            onClick={() => {
              try {
                localStorage.removeItem('araby_cookies_consented');
                window.location.reload();
              } catch (e) {}
            }}
            className="text-amber-400 hover:text-amber-300 underline cursor-pointer"
          >
            {isEnglish ? 'Cookie Settings & Privacy 🍪' : 'إعدادات ملفات تعريف الارتباط والخصوصية 🍪'}
          </button>
        </div>
        <p className="text-slate-500 text-[11px]">
          {isEnglish
            ? 'Login credentials and preferences are securely stored locally in your browser'
            : 'يتم حفظ بيانات تسجيل الدخول وتفضيلات الدردشة في متصفحك المحلي بأمان'}
        </p>
      </footer>

    </div>
  );
};
