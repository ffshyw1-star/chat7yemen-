import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  FileText, Save, Eye, Shield, Scale, Info, Phone,
  CheckCircle2, Sparkles, Edit3
} from 'lucide-react';

interface PageItem {
  id: string;
  title: string;
  slug: string;
  icon: any;
  content: string;
}

export const PagesView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const { siteSettings, updateSiteSettings } = useChat();

  const [pages, setPages] = useState<PageItem[]>([
    {
      id: 'terms',
      title: 'شروط الاستخدام',
      slug: 'terms-of-service',
      icon: Scale,
      content: siteSettings.customPages?.['terms'] || 'مرحباً بكم في شات اليمن المطور.\nباستخدامك لهذا الموقع، فإنك توافق على الالتزام بجميع القوانين واللوائح المعمول بها، والاحترام المتبادل لجميع الأعضاء والزوار، وعدم استخدام أي لغة غير لائقة أو مشاركة محتوى محظور.'
    },
    {
      id: 'privacy',
      title: 'سياسة الخصوصية',
      slug: 'privacy-policy',
      icon: Shield,
      content: siteSettings.customPages?.['privacy'] || 'نحن نولي خصوصية بياناتك اهتماماً فائقاً.\nلا يتم مشاركة أي معلومات خاصة أو عناوين IP مع أي جهة خارجية. جميع المحادثات الخاصة مشفرة وتتم في بيئة آمنة تماماً.'
    },
    {
      id: 'rules',
      title: 'قوانين الدردشة العامة',
      slug: 'chat-rules',
      icon: FileText,
      content: siteSettings.customPages?.['rules'] || '1. يمنع منعاً باتاً نشر الإعلانات وروابط المواقع الأخرى.\n2. يمنع السب والشتم والحديث في الأمور السياسية والطائفية.\n3. احترام طاقم الإدارة والمشرفين والاستجابة للتوجيهات.'
    },
    {
      id: 'about',
      title: 'نبذة عن الموقع',
      slug: 'about-us',
      icon: Info,
      content: siteSettings.customPages?.['about'] || 'شات اليمن المطور هو المنصة العربية الأولى للتواصل الصوتي والكتابي، تأسس لتقديم تجربة تواصل عصرية وممتعة تجمع الأصدقاء من كافة أرجاء الوطن العربي في غرف تفاعلية حماسية.'
    },
    {
      id: 'contact',
      title: 'اتصل بنا والدعم الفني',
      slug: 'contact-us',
      icon: Phone,
      content: siteSettings.customPages?.['contact'] || `للشكاوى والاستفسارات والاقتراحات أو لطلب عضويات خاصة وإعلانات:\nالبريد الإلكتروني: ${siteSettings.supportEmail || 'support@yemenchat.dev'}\nرقم الواتساب الإداري: ${siteSettings.whatsappNumber || '+967700000000'}`
    },
  ]);

  const [selectedPageId, setSelectedPageId] = useState<string>('terms');
  const [previewMode, setPreviewMode] = useState<boolean>(false);

  const selectedPage = pages.find(p => p.id === selectedPageId) || pages[0];

  const handleUpdateContent = (text: string) => {
    setPages(prev => prev.map(p => p.id === selectedPageId ? { ...p, content: text } : p));
  };

  const handleSavePage = () => {
    const updatedCustomPages: Record<string, string> = { ...(siteSettings.customPages || {}) };
    pages.forEach(p => {
      updatedCustomPages[p.id] = p.content;
    });
    updateSiteSettings({ customPages: updatedCustomPages });
    showToast(`تم حفظ وتحديث صفحة "${selectedPage.title}" وحفظها في السيرفر بنجاح 💾`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>إدارة الصفحات والشروط والسياسات (Custom Pages)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تعديل ونشر نصوص القوانين، الشروط، سياسة الخصوصية، وصفحة اتصل بنا
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{previewMode ? 'وضع التعديل ✍️' : 'معاينة مباشرة 👁️'}</span>
          </button>
          <button
            onClick={handleSavePage}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ ونشر الصفحة 💾</span>
          </button>
        </div>
      </div>

      {/* Pages Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {pages.map(page => {
          const IconComp = page.icon;
          return (
            <button
              key={page.id}
              onClick={() => setSelectedPageId(page.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border shrink-0 ${
                selectedPageId === page.id
                  ? 'bg-blue-600 border-blue-700 text-white shadow-xs font-black'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{page.title}</span>
            </button>
          );
        })}
      </div>

      {/* Page Editor & Live Preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-black text-slate-800">
              {selectedPage.title}
            </h4>
            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
              /{selectedPage.slug}
            </span>
          </div>
          <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>منشورة ونشطة</span>
          </span>
        </div>

        {previewMode ? (
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 min-h-64 whitespace-pre-line text-xs font-medium text-slate-800 leading-relaxed">
            {selectedPage.content}
          </div>
        ) : (
          <textarea
            value={selectedPage.content}
            onChange={(e) => handleUpdateContent(e.target.value)}
            rows={10}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs font-medium text-slate-800 leading-relaxed focus:bg-white transition-colors custom-scrollbar"
            placeholder="اكتب محتوى الصفحة هنا..."
          />
        )}
      </div>
    </div>
  );
};
