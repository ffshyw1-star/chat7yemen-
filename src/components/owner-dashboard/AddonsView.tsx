import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Code, Bot, Save, Sliders, Webhook, Eye, Play, Bell, UserX, CheckCircle2, AlertCircle, RefreshCw
} from 'lucide-react';

export const AddonsView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const { siteSettings, updateSiteSettings, sendBotWelcomeMessage, cleanupInactiveUsers } = useChat();

  const [customCss, setCustomCss] = useState(
    (siteSettings as any)?.customCss || '/* Custom Owner CSS */\n.custom-glow { filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.4)); }'
  );
  const [customJs, setCustomJs] = useState(
    (siteSettings as any)?.customJs || '// Google Analytics / Meta Pixel Tracker\nconsole.log("[ADDON] Analytics tracking active.");'
  );
  const [welcomeBotActive, setWelcomeBotActive] = useState(
    (siteSettings as any)?.welcomeBotActive !== undefined ? (siteSettings as any).welcomeBotActive : true
  );
  const [welcomeBotName, setWelcomeBotName] = useState(
    (siteSettings as any)?.welcomeBotName || 'بوت الترحيب الآلي 🤖'
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    (siteSettings as any)?.welcomeBotMessage || 'أهلاً وسهلاً بك يا {username} في دردشتنا! نتمنى لك أطيب الأوقات والالتزام بالقوانين 🌹'
  );
  const [webhookUrl, setWebhookUrl] = useState(
    (siteSettings as any)?.webhookUrl || 'https://api.telegram.org/bot12345/sendMessage'
  );
  const [welcomeBotIntervalSeconds, setWelcomeBotIntervalSeconds] = useState<number>(
    (siteSettings as any)?.welcomeBotIntervalSeconds || 60
  );
  const [inactivityTimeoutMinutes, setInactivityTimeoutMinutes] = useState<number>(
    (siteSettings as any)?.userInactivityTimeoutMinutes || 15
  );
  const [announceUserEnterLeave, setAnnounceUserEnterLeave] = useState<boolean>(
    (siteSettings as any)?.announceUserEnterLeave !== undefined ? (siteSettings as any).announceUserEnterLeave : true
  );

  useEffect(() => {
    if (siteSettings) {
      if ((siteSettings as any).customCss !== undefined) setCustomCss((siteSettings as any).customCss);
      if ((siteSettings as any).customJs !== undefined) setCustomJs((siteSettings as any).customJs);
      if ((siteSettings as any).welcomeBotActive !== undefined) setWelcomeBotActive((siteSettings as any).welcomeBotActive);
      if ((siteSettings as any).welcomeBotName !== undefined) setWelcomeBotName((siteSettings as any).welcomeBotName);
      if ((siteSettings as any).welcomeBotMessage !== undefined) setWelcomeMessage((siteSettings as any).welcomeBotMessage);
      if ((siteSettings as any).webhookUrl !== undefined) setWebhookUrl((siteSettings as any).webhookUrl);
      if ((siteSettings as any).welcomeBotIntervalSeconds !== undefined) setWelcomeBotIntervalSeconds((siteSettings as any).welcomeBotIntervalSeconds);
      if ((siteSettings as any).userInactivityTimeoutMinutes !== undefined) setInactivityTimeoutMinutes((siteSettings as any).userInactivityTimeoutMinutes);
      if ((siteSettings as any).announceUserEnterLeave !== undefined) setAnnounceUserEnterLeave((siteSettings as any).announceUserEnterLeave);
    }
  }, [siteSettings]);

  const handleInstantToggleBot = () => {
    const nextVal = !welcomeBotActive;
    setWelcomeBotActive(nextVal);
    updateSiteSettings({ welcomeBotActive: nextVal } as any);
    showToast(nextVal ? 'تم تفعيل بوت الترحيب فورياً 🟢' : 'تم تعطيل بوت الترحيب فورياً 🔴');
  };

  const handleTestSendBot = () => {
    if (sendBotWelcomeMessage) {
      sendBotWelcomeMessage(welcomeMessage);
      showToast('تم إرسال رسالة ترحيبية تجريبية في الدردشة الآن 🚀');
    }
  };

  const handleManualCleanup = () => {
    if (cleanupInactiveUsers) {
      cleanupInactiveUsers();
      showToast('تم تنظيف سجلات الحسابات الخاملة بنجاح 🧹');
    }
  };

  const handleSaveAddons = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings({
      customCss,
      customJs,
      welcomeBotActive,
      welcomeBotName,
      welcomeBotMessage: welcomeMessage,
      webhookUrl,
      welcomeBotIntervalSeconds: Number(welcomeBotIntervalSeconds),
      userInactivityTimeoutMinutes: Number(inactivityTimeoutMinutes),
      announceUserEnterLeave,
    } as any);
    showToast('تم حفظ وتطبيق إضافات البوت وأوقات الخمول في قاعدة البيانات والسيرفر بنجاح 💾');
  };

  // Preview formatted text
  const previewFormattedText = (welcomeMessage || '').replace('{username}', 'أحمد_اليمني');

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans text-right" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-emerald-600" />
            <span>إدارة الإضافات والسكربتات وبوت الترحيب الآلي</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            التحكم ببوت الترحيب الدقيق، تنبيهات الدخول والخروج، وتطهير المستخدمين الخاملين تلقائياً
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAddons}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>حفظ وتفعيل الإعدادات 💾</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Welcome Bot Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${welcomeBotActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-400'}`} />
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-blue-600" />
                <span>بوت الترحيب التلقائي بالأعضاء</span>
              </h4>
            </div>

            {/* Instant Toggle Button */}
            <button
              type="button"
              onClick={handleInstantToggleBot}
              className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                welcomeBotActive
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                  : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
              }`}
              title="انقر لتفعيل أو تعطيل البوت فورياً"
            >
              {welcomeBotActive ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>البوت نشط 🟢 (انقر للإيقاف)</span>
                </>
              ) : (
                <>
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>البوت معطل 🔴 (انقر للتفعيل)</span>
                </>
              )}
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">اسم البوت المستعار في المحادثة:</label>
              <input
                type="text"
                value={welcomeBotName}
                onChange={(e) => setWelcomeBotName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold focus:bg-white transition-colors"
                placeholder="مثال: بوت الترحيب الآلي 🤖"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">نص رسالة الترحيب والاعلان (استخدم {'{username}'}):</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={2}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium focus:bg-white transition-colors"
                placeholder="أهلاً وسهلاً بك يا {username}..."
              />
            </div>

            {/* Message Live Preview Card */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold border-b border-slate-200 pb-1.5">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-blue-600" />
                  معاينة مظهر رسالة البوت داخل الشات:
                </span>
                <span className="text-[10px] text-slate-400">الآن</span>
              </div>
              <div className="flex items-start gap-2.5 pt-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                  🤖
                </div>
                <div className="flex-1 min-w-0 bg-white border border-slate-200/60 rounded-xl p-2.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-black text-[11px] text-blue-900">{welcomeBotName}</span>
                    <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded-full">نظام</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed font-medium break-words">
                    {previewFormattedText}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="font-bold text-slate-600 block mb-1">التكرار الزمني (بالثواني):</label>
                <input
                  type="number"
                  value={welcomeBotIntervalSeconds}
                  onChange={(e) => setWelcomeBotIntervalSeconds(Number(e.target.value))}
                  min={10}
                  max={3600}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">افتراضي: 60 ثانية (كل دقيقة)</span>
              </div>

              <div>
                <label className="font-bold text-slate-600 block mb-1">إرسال تجريبي:</label>
                <button
                  type="button"
                  onClick={handleTestSendBot}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1 transition-colors text-xs shadow-xs"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>إرسال تجريبي الآن</span>
                </button>
                <span className="text-[10px] text-slate-400 mt-0.5 block">يرسل الرسالة للغرفة الحالية</span>
              </div>
            </div>
          </div>
        </div>

        {/* Presence & Enter/Leave Announcements Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Sliders className="w-4 h-4 text-purple-600" />
            <span>نظام التواجد الفعلي وتنبيهات الدردشة</span>
          </h4>

          <div className="space-y-3 text-xs">
            {/* Inactivity timeout setting */}
            <div>
              <label className="font-bold text-slate-600 block mb-1">
                مدة بقاء المستخدمين الغائبين في قائمة المتواجدين (بالدقائق):
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={inactivityTimeoutMinutes}
                  onChange={(e) => setInactivityTimeoutMinutes(Number(e.target.value))}
                  min={1}
                  max={1440}
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                />
                <button
                  type="button"
                  onClick={handleManualCleanup}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg cursor-pointer shadow-xs text-xs flex items-center gap-1 shrink-0 transition-colors"
                  title="تنظيف الحسابات الخاملة الآن"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تنظيف الآن</span>
                </button>
              </div>
              <span className="text-[10px] text-slate-400 mt-0.5 block">
                تحديد وقت الخمول لضمان أن قائمة المتواجدين تعكس المستخدمين الفعليين فقط.
              </span>
            </div>

            {/* Enter/Leave Announcements in Chat */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block text-xs flex items-center gap-1">
                    <Bell className="w-3.5 h-3.5 text-indigo-600" />
                    تنبيهات دخول وخروج الأعضاء في الشات
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    إظهار إشعار فوري عند انضمام أو مغادرة أي مستخدم للغرفة
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !announceUserEnterLeave;
                    setAnnounceUserEnterLeave(nextVal);
                    updateSiteSettings({ announceUserEnterLeave: nextVal } as any);
                    showToast(nextVal ? 'تم تفعيل تنبيهات الدخول والخروج' : 'تم تعطيل تنبيهات الدخول والخروج');
                  }}
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    announceUserEnterLeave ? 'bg-indigo-600' : 'bg-slate-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                    announceUserEnterLeave ? 'right-0.5' : 'left-0.5'
                  }`} />
                </button>
              </div>
            </div>

            {/* Webhook Url setting */}
            <div className="pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-600 block mb-1 flex items-center gap-1">
                <Webhook className="w-3.5 h-3.5 text-purple-600" />
                رابط Webhook خارجي (Telegram / Discord):
              </label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-left"
                dir="ltr"
                placeholder="https://api.telegram.org/bot..."
              />
            </div>
          </div>
        </div>

        {/* Custom CSS Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-emerald-600" />
              <span>تخصيص أنماط CSS للموقع</span>
            </h4>
          </div>
          <textarea
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            rows={3}
            className="w-full bg-slate-900 text-emerald-400 font-mono text-xs p-3 rounded-lg border border-slate-800"
            dir="ltr"
          />
        </div>

        {/* Custom JS Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Code className="w-4 h-4 text-amber-600" />
              <span>أكواد JavaScript المخصصة / سكربتات التتبع</span>
            </h4>
          </div>
          <textarea
            value={customJs}
            onChange={(e) => setCustomJs(e.target.value)}
            rows={3}
            className="w-full bg-slate-900 text-amber-400 font-mono text-xs p-3 rounded-lg border border-slate-800"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
};

