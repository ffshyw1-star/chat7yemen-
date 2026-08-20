import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Code, Bot, Save, Sparkles, Sliders, Globe, Webhook,
  Terminal, CheckCircle, AlertTriangle
} from 'lucide-react';

export const AddonsView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [customCss, setCustomCss] = useState('/* Custom Owner CSS */\n.custom-glow { filter: drop-shadow(0 0 8px rgba(234, 179, 8, 0.4)); }');
  const [customJs, setCustomJs] = useState('// Google Analytics / Meta Pixel Tracker\nconsole.log("[ADDON] Analytics tracking active.");');
  const [welcomeBotActive, setWelcomeBotActive] = useState(true);
  const [welcomeBotName, setWelcomeBotName] = useState('بوت الترحيب الآلي 🤖');
  const [welcomeMessage, setWelcomeMessage] = useState('أهلاً وسهلاً بك يا {username} في دردشتنا! نتمنى لك أطيب الأوقات والالتزام بالقوانين 🌹');
  const [webhookUrl, setWebhookUrl] = useState('https://api.telegram.org/bot12345/sendMessage');

  const handleSaveAddons = (e: React.FormEvent) => {
    e.preventDefault();
    showToast('تم حفظ وتطبيق الإضافات والسكربتات بنجاح 💾');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-emerald-600" />
            <span>إدارة الإضافات والسكربتات (Addons & Integrations)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تضمين أكواد CSS مخصصة، سكربتات تتبع الإحصائيات، وبوت الترحيب الآلي
          </p>
        </div>

        <button
          onClick={handleSaveAddons}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
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
              onClick={() => {
                setWelcomeBotActive(!welcomeBotActive);
                showToast(welcomeBotActive ? 'تم تعطيل بوت الترحيب' : 'تم تفعيل بوت الترحيب');
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
                placeholder="https://..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px]"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              يتم إرسال تقارير التسجيلات الجديدة والبلاغات الإدارية تلقائياً إلى هذا الرابط.
            </p>
          </div>
        </div>

        {/* Custom CSS Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Code className="w-4 h-4 text-amber-600" />
            <span>كود CSS مخصص (Custom Styling)</span>
          </h4>
          <textarea
            value={customCss}
            onChange={(e) => setCustomCss(e.target.value)}
            rows={5}
            className="w-full bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-xs custom-scrollbar"
          />
        </div>

        {/* Custom JS / Analytics Box */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-2">
          <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-cyan-600" />
            <span>أكواد التتبع المخصصة (Google Analytics / Pixel)</span>
          </h4>
          <textarea
            value={customJs}
            onChange={(e) => setCustomJs(e.target.value)}
            rows={5}
            className="w-full bg-slate-900 text-cyan-400 p-3 rounded-lg font-mono text-xs custom-scrollbar"
          />
        </div>
      </div>
    </div>
  );
};
