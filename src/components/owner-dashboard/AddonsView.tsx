import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Code, Bot, Save, Sliders, Webhook
} from 'lucide-react';

export const AddonsView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const { siteSettings, updateSiteSettings } = useChat();

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

  useEffect(() => {
    if (siteSettings) {
      if ((siteSettings as any).customCss !== undefined) setCustomCss((siteSettings as any).customCss);
      if ((siteSettings as any).customJs !== undefined) setCustomJs((siteSettings as any).customJs);
      if ((siteSettings as any).welcomeBotActive !== undefined) setWelcomeBotActive((siteSettings as any).welcomeBotActive);
      if ((siteSettings as any).welcomeBotName !== undefined) setWelcomeBotName((siteSettings as any).welcomeBotName);
      if ((siteSettings as any).welcomeBotMessage !== undefined) setWelcomeMessage((siteSettings as any).welcomeBotMessage);
      if ((siteSettings as any).webhookUrl !== undefined) setWebhookUrl((siteSettings as any).webhookUrl);
    }
  }, [siteSettings]);

  const handleSaveAddons = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings({
      customCss,
      customJs,
      welcomeBotActive,
      welcomeBotName,
      welcomeBotMessage: welcomeMessage,
      webhookUrl,
    } as any);
    showToast('تم حفظ وتطبيق الإضافات في قاعدة البيانات والسيرفر بنجاح 💾');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans text-right" dir="rtl">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-emerald-600" />
            <span>إدارة الإضافات والسكربتات (Addons & Integrations)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تضمين أكواد CSS مخصصة، سكربتات تتبع الإحصائيات، وبوت الترحيب الآلي مع الحفظ الدائم
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAddons}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Save className="w-3.5 h-3.5" />
          <span>حفظ وتفعيل الإضافات 💾</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Welcome Bot Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-blue-600" />
              <span>بوت الترحيب التلقائي بالأعضاء</span>
            </h4>
            <button
              type="button"
              onClick={() => {
                const nextVal = !welcomeBotActive;
                setWelcomeBotActive(nextVal);
                updateSiteSettings({ welcomeBotActive: nextVal } as any);
                showToast(nextVal ? 'تم تفعيل بوت الترحيب' : 'تم تعطيل بوت الترحيب');
              }}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                welcomeBotActive ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform ${
                welcomeBotActive ? 'right-0.5' : 'left-0.5'
              }`} />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">اسم البوت:</label>
              <input
                type="text"
                value={welcomeBotName}
                onChange={(e) => setWelcomeBotName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-600 block mb-1">نص رسالة الترحيب (استخدم {'{username}'}):</label>
              <textarea
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium"
              />
            </div>
          </div>
        </div>

        {/* Webhooks Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-1.5">
            <Webhook className="w-4 h-4 text-purple-600" />
            <span>ربط Webhooks والإشعارات الخارجية</span>
          </h4>

          <div className="space-y-2 text-xs">
            <div>
              <label className="font-bold text-slate-600 block mb-1">رابط Webhook (Telegram / Discord):</label>
              <input
                type="text"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-left"
                dir="ltr"
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
            rows={4}
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
            rows={4}
            className="w-full bg-slate-900 text-amber-400 font-mono text-xs p-3 rounded-lg border border-slate-800"
            dir="ltr"
          />
        </div>
      </div>
    </div>
  );
};
