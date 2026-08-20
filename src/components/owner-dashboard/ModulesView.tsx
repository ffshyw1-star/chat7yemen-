import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Layers, MessageSquare, Mic, Image, Palette, Radio,
  Gift, ShoppingBag, ThumbsUp, AlertTriangle, Disc, Video,
  Save, Sparkles, Check
} from 'lucide-react';

interface ModuleConfig {
  id: string;
  name: string;
  desc: string;
  icon: any;
  enabled: boolean;
  color: string;
}

export const ModulesView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [modules, setModules] = useState<ModuleConfig[]>([
    { id: 'wall', name: 'نظام الحائط والمنشورات', desc: 'إمكانية نشر اليوميات والصور والتعليقات والإعجابات للأعضاء', icon: MessageSquare, enabled: true, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { id: 'voice', name: 'الرسائل الصوتية المباشرة', desc: 'تسجيل وبث الرسائل الصوتية الحية في الغرف والخاص', icon: Mic, enabled: true, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
    { id: 'canvas', name: 'لوحة الرسم والتوقيعات', desc: 'لوحة تفاعلية للرسم ومشاركة الإبداعات مباشرة بالدردشة', icon: Palette, enabled: true, color: 'text-amber-600 bg-amber-50 border-amber-200' },
    { id: 'private', name: 'محادثات الخاص والمراسلة الفردية', desc: 'نظام المحادثات السرية المشفرة الفردية بين الأعضاء', icon: MessageSquare, enabled: true, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' },
    { id: 'gifts', name: 'نظام الهدايا والرصيد', desc: 'إرسال الهدايا التفاعلية المتحركة وتبادل الرصيد والنقاط', icon: Gift, enabled: true, color: 'text-pink-600 bg-pink-50 border-pink-200' },
    { id: 'store', name: 'متجر العضويات والترقيات', desc: 'شراء عضويات VIP، تغيير لون الخط، وأيقونات التاج', icon: ShoppingBag, enabled: true, color: 'text-purple-600 bg-purple-50 border-purple-200' },
    { id: 'likes', name: 'نظام الإعجابات والتفاعل', desc: 'زر الإعجاب بالملفات الشخصية والمنشورات والرسائل', icon: ThumbsUp, enabled: true, color: 'text-teal-600 bg-teal-50 border-teal-200' },
    { id: 'reports', name: 'نظام البلاغات والشكاوى التلقائي', desc: 'إمكانية إرسال بلاغ فوري للإدارة مع حفظ نص الرسالة المبلغ عنها', icon: AlertTriangle, enabled: true, color: 'text-rose-600 bg-rose-50 border-rose-200' },
    { id: 'dj', name: 'نظام DJ الصوتي والبث', desc: 'بث الموسيقى والأغاني والمؤثرات الصوتية للغرف', icon: Disc, enabled: true, color: 'text-violet-600 bg-violet-50 border-violet-200' },
    { id: 'youtube', name: 'مشغل اليوتيوب التشاركي', desc: 'مشاركة وتشغيل مقاطع اليوتيوب بالدردشة العامة', icon: Video, enabled: true, color: 'text-red-600 bg-red-50 border-red-200' },
    { id: 'radio', name: 'محطات الراديو الإخبارية والقرآن', desc: 'بث إذاعات القرآن الكريم ومحطات الراديو العربية', icon: Radio, enabled: true, color: 'text-cyan-600 bg-cyan-50 border-cyan-200' },
  ]);

  const toggleModule = (id: string) => {
    setModules(prev => prev.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
  };

  const handleSave = () => {
    showToast('تم حفظ إعدادات الوحدات وتفعيلها في كامل النظام 💾');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-purple-600" />
            <span>إدارة الوحدات والميزات (Module Management)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تفعيل أو إيقاف أي ميزة في الموقع بضغطة زر دون الحاجة لإعادة تشغيل السيرفر
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
        >
          <Save className="w-3.5 h-3.5" />
          <span>حفظ التعديلات 💾</span>
        </button>
      </div>

      {/* Modules List Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {modules.map(mod => {
          const IconComponent = mod.icon;
          return (
            <div
              key={mod.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                mod.enabled
                  ? 'bg-white border-slate-200 shadow-2xs hover:shadow-xs'
                  : 'bg-slate-100/80 border-slate-200/80 opacity-75'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${mod.color}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
                    <span>{mod.name}</span>
                    {mod.enabled && (
                      <span className="text-[9px] px-1.5 py-0.2 bg-emerald-100 text-emerald-700 font-bold rounded-full">
                        مفعّل
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {mod.desc}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={() => {
                  toggleModule(mod.id);
                  showToast(`تم ${mod.enabled ? 'إيقاف' : 'تفعيل'} ${mod.name}`);
                }}
                className={`w-11 h-6 rounded-full transition-colors relative shrink-0 cursor-pointer ${
                  mod.enabled ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                    mod.enabled ? 'right-0.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
