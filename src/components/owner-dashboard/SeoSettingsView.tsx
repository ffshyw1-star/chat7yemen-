import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Search, Globe, FileText, CheckCircle2, AlertTriangle, Copy, Check,
  ExternalLink, Sparkles, RefreshCw, Smartphone, Monitor, ShieldCheck,
  Tag, Compass, Info, ArrowUpRight
} from 'lucide-react';

export const SeoSettingsView: React.FC = () => {
  const { siteSettings, updateSiteSettings, showTopBanner, rooms } = useChat();

  const [seoTitle, setSeoTitle] = useState(
    siteSettings?.seoTitle || siteSettings?.siteName || 'شات اليمن المطور | منصة الدردشة العربية الأولى وغرف المحادثات الصوتية والكتابية'
  );
  const [seoDescription, setSeoDescription] = useState(
    siteSettings?.seoDescription || siteSettings?.landingSubtitle || 'شات اليمن المطور - أفضل موقع شات عربي ومحادثات يمنية وعربية مباشرة بدون تسجيل. غرف دردشة عامة وخاصة، مكالمات صوتية، وراديو تفاعلي.'
  );
  const [seoKeywords, setSeoKeywords] = useState(
    siteSettings?.seoKeywords || 'شات اليمن المطور, شات اليمن, دردشة اليمن, شات عربي, شات صنعاء, شات عدن, شات تعز, غرف دردشة صوتية, دردشة كتابية بدون تسجيل'
  );
  const [seoCanonicalUrl, setSeoCanonicalUrl] = useState(
    siteSettings?.seoCanonicalUrl || window.location.origin
  );
  const [googleSiteVerification, setGoogleSiteVerification] = useState(
    siteSettings?.googleSiteVerification || ''
  );
  const [bingSiteVerification, setBingSiteVerification] = useState(
    siteSettings?.bingSiteVerification || ''
  );
  const [enableDynamicRoomSEO, setEnableDynamicRoomSEO] = useState(
    siteSettings?.enableDynamicRoomSEO !== false
  );
  const [sitemapAutoIncludeRooms, setSitemapAutoIncludeRooms] = useState(
    siteSettings?.sitemapAutoIncludeRooms !== false
  );
  const [seoAuthor, setSeoAuthor] = useState(
    siteSettings?.seoAuthor || 'إدارة شات اليمن المطور'
  );

  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile');
  const [copiedSitemap, setCopiedSitemap] = useState(false);
  const [copiedRobots, setCopiedRobots] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const sitemapFullUrl = `${seoCanonicalUrl.replace(/\/$/, '')}/sitemap.xml`;
  const robotsFullUrl = `${seoCanonicalUrl.replace(/\/$/, '')}/robots.txt`;

  const handleCopy = (text: string, type: 'sitemap' | 'robots') => {
    navigator.clipboard.writeText(text);
    if (type === 'sitemap') {
      setCopiedSitemap(true);
      setTimeout(() => setCopiedSitemap(false), 2000);
    } else {
      setCopiedRobots(true);
      setTimeout(() => setCopiedRobots(false), 2000);
    }
    showTopBanner('📋 تم نسخ الرابط إلى الحافظة بنجاح');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSiteSettings({
        seoTitle: seoTitle.trim(),
        seoDescription: seoDescription.trim(),
        seoKeywords: seoKeywords.trim(),
        seoCanonicalUrl: seoCanonicalUrl.trim(),
        googleSiteVerification: googleSiteVerification.trim(),
        bingSiteVerification: bingSiteVerification.trim(),
        enableDynamicRoomSEO,
        sitemapAutoIncludeRooms,
        seoAuthor: seoAuthor.trim()
      });
      showTopBanner('✅ تم حفظ إعدادات محركات البحث (SEO) والميتا تاق بنجاح وتحديث خريطة الموقع');
    } catch (err) {
      console.error(err);
      showTopBanner('⚠️ فشل حفظ إعدادات السيو');
    } finally {
      setIsSaving(false);
    }
  };

  // SEO Score calculation
  const titleLen = seoTitle.length;
  const descLen = seoDescription.length;
  const hasKeywords = seoKeywords.trim().length > 10;
  const hasGoogleVerification = googleSiteVerification.trim().length > 5;
  const isTitleOptimal = titleLen >= 30 && titleLen <= 70;
  const isDescOptimal = descLen >= 100 && descLen <= 170;

  const scoreChecks = [
    isTitleOptimal,
    isDescOptimal,
    hasKeywords,
    hasGoogleVerification,
    enableDynamicRoomSEO,
    sitemapAutoIncludeRooms
  ];
  const passedCount = scoreChecks.filter(Boolean).length;
  const seoScorePercentage = Math.round((passedCount / scoreChecks.length) * 100);

  return (
    <div className="space-y-6 dir-rtl text-right" dir="rtl">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-700 to-sky-700 text-white p-5 rounded-2xl shadow-sm border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-xl bg-white/10 backdrop-blur-xs">
              <Search className="w-5 h-5 text-emerald-200" />
            </span>
            <h2 className="text-xl font-black">إعدادات محركات البحث المتقدمة (SEO) وعناكب Google</h2>
          </div>
          <p className="text-xs text-emerald-100 max-w-xl font-medium leading-relaxed">
            التحكم في الميتا تاق (Meta Tags) الديناميكية، بطاقات السوشيال ميديا، خريطة الموقع (Sitemap.xml)، وملف robots.txt لتحسين ترتيب موقع «شات اليمن المطور» وسرعة أرشفة غرفه في جوجل.
          </p>
        </div>

        {/* SEO HEALTH SCORE BADGE */}
        <div className="bg-slate-900/60 border border-emerald-400/40 px-4 py-3 rounded-2xl text-center shrink-0 w-full sm:w-auto">
          <div className="text-[11px] font-bold text-emerald-300 mb-1 flex items-center justify-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>مؤشر جودة السيو (SEO Score)</span>
          </div>
          <div className="text-2xl font-black text-white flex items-center justify-center gap-1.5">
            <span className={seoScorePercentage >= 80 ? 'text-emerald-400' : 'text-amber-400'}>
              {seoScorePercentage}%
            </span>
            <span className="text-xs text-slate-300 font-normal">/ 100%</span>
          </div>
        </div>
      </div>

      {/* QUICK LINKS / GOOGLE TOOLS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Sitemap.xml Link Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-sky-600" />
              <span>خريطة الموقع (Sitemap.xml)</span>
            </span>
            <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">
              {rooms.length + 6} صفحات وغرف
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3 font-mono truncate dir-ltr text-left">
            {sitemapFullUrl}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(sitemapFullUrl, 'sitemap')}
              className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedSitemap ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSitemap ? 'تم النسخ!' : 'نسخ الرابط لجوجل'}</span>
            </button>
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2.5 bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              title="عرض خريطة الموقع"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* robots.txt Link Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>ملف الأوامر (robots.txt)</span>
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
              جاهز ومفعل ✅
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3 font-mono truncate dir-ltr text-left">
            {robotsFullUrl}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(robotsFullUrl, 'robots')}
              className="flex-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedRobots ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedRobots ? 'تم النسخ!' : 'نسخ الرابط'}</span>
            </button>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-2.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
              title="عرض ملف robots.txt"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Google Search Console Direct Link Card */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-amber-600" />
              <span>أدوات مشرفي المواقع</span>
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
              Google Console
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">
            لإرسال خريطة الموقع وطلب الأرشفة الفورية من خوادم Google.
          </p>
          <a
            href="https://search.google.com/search-console"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>فتح Google Search Console</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* GOOGLE SEARCH RESULTS PREVIEW SIMULATOR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-black text-slate-900">
              معاينة المظهر المباشر لنتائج محرك بحث Google
            </h3>
          </div>
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                previewDevice === 'mobile' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>جوال</span>
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-bold transition-all cursor-pointer ${
                previewDevice === 'desktop' ? 'bg-white text-sky-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>كمبيوتر</span>
            </button>
          </div>
        </div>

        {/* GOOGLE SNIPPET BOX */}
        <div className={`p-4 bg-slate-50 border border-slate-200/80 rounded-xl transition-all ${
          previewDevice === 'mobile' ? 'max-w-md mx-auto shadow-sm' : 'w-full'
        }`}>
          {/* Breadcrumb URL */}
          <div className="flex items-center gap-2 text-xs text-slate-600 mb-1.5 font-sans dir-ltr text-left">
            <div className="w-4 h-4 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] text-white font-bold">
              🇾🇪
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-slate-800 text-[11px]">شات اليمن المطور</span>
              <span className="text-[10px] text-slate-500 truncate">{seoCanonicalUrl}</span>
            </div>
          </div>

          {/* Clickable Title (Blue) */}
          <h4 className="text-base sm:text-lg font-bold text-[#1a0dab] hover:underline cursor-pointer leading-tight mb-1.5 font-['Arial',sans-serif]">
            {seoTitle || 'شات اليمن المطور | منصة الدردشة العربية الأولى'}
          </h4>

          {/* Meta Description */}
          <p className="text-xs text-[#4d5156] leading-relaxed line-clamp-2 font-['Arial',sans-serif]">
            {seoDescription || 'انضم الآن إلى شات اليمن المطور واستمتع بالمحادثات العامة والخاصة وغرف الصوت.'}
          </p>

          {/* Sitelinks / Sub-links preview */}
          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-xs">
            <div className="bg-white p-2 rounded-lg border border-slate-200/50">
              <span className="font-bold text-[#1a0dab] text-[11px] block truncate">الغرفة العامة 🇾🇪</span>
              <span className="text-[10px] text-slate-500 block truncate">غرفة الدردشة الرئيسية لجميع الأعضاء</span>
            </div>
            <div className="bg-white p-2 rounded-lg border border-slate-200/50">
              <span className="font-bold text-[#1a0dab] text-[11px] block truncate">غرف المحافظات 🏛️</span>
              <span className="text-[10px] text-slate-500 block truncate">صنعاء، عدن، تعز، حضرموت</span>
            </div>
          </div>
        </div>
      </div>

      {/* SEO CONFIGURATION FORM */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Tag className="w-4 h-4 text-emerald-600" />
          <h3 className="text-sm font-black text-slate-900">تخصيص وسوم الميتا تاق (Meta Tags) الأساسية</h3>
        </div>

        {/* 1. Meta Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">
              عنوان الموقع لمحركات البحث (Meta Title)
            </label>
            <span className={`text-[11px] font-bold ${
              isTitleOptimal ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {titleLen} / 60 حرف (المثالي: 30-60)
            </span>
          </div>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
            placeholder="اكتب عنوان الموقع الذي يظهر في بحث جوجل..."
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-semibold"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            العنوان الرئيسي الذي يظهر كعنوان أزرق عريض في نتائج بحث Google وبطاقات المشاركة في الواتساب وفيسبوك.
          </p>
        </div>

        {/* 2. Meta Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-slate-700">
              الوصف الدقيق في محركات البحث (Meta Description)
            </label>
            <span className={`text-[11px] font-bold ${
              isDescOptimal ? 'text-emerald-600' : 'text-amber-600'
            }`}>
              {descLen} / 160 حرف (المثالي: 120-160)
            </span>
          </div>
          <textarea
            rows={3}
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
            placeholder="اكتب وصفاً جذاباً يشجع الزوار على النقر والدخول للدردشة..."
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-semibold resize-none"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            السطور التي تظهر تحت العنوان في نتائج جوجل لتوضيح ميزات الشات وغرفه.
          </p>
        </div>

        {/* 3. Focus Keywords */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1.5">
            الكلمات المفتاحية والدلالية (Keywords) — مفصولة بفاصلة
          </label>
          <input
            type="text"
            value={seoKeywords}
            onChange={(e) => setSeoKeywords(e.target.value)}
            placeholder="شات اليمن, دردشة يمنية, شات صوتي, تعارف شباب وبنات..."
            className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-semibold"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['شات اليمن المطور', 'دردشة اليمن', 'شات صنعاء', 'شات عدن', 'شات تعز', 'شات عربي مجاني', 'غرف دردشة بدون تسجيل'].map((kw) => (
              <button
                key={kw}
                type="button"
                onClick={() => {
                  if (!seoKeywords.includes(kw)) {
                    setSeoKeywords(prev => prev ? `${prev}, ${kw}` : kw);
                  }
                }}
                className="text-[10px] bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer"
              >
                + {kw}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Canonical URL & Author */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              رابط النطاق الأساسي (Canonical Domain URL)
            </label>
            <input
              type="text"
              value={seoCanonicalUrl}
              onChange={(e) => setSeoCanonicalUrl(e.target.value)}
              placeholder="https://yemen-chat.app"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-semibold font-mono dir-ltr text-left"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              الرابط المعتمد لمنع مشاكل الروابط المكررة عند الزحف.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              المؤلف / إدارة الموقع (Author / Publisher)
            </label>
            <input
              type="text"
              value={seoAuthor}
              onChange={(e) => setSeoAuthor(e.target.value)}
              placeholder="إدارة شات اليمن المطور"
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-semibold"
            />
          </div>
        </div>

        {/* 5. Search Console Verifications */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
              <span>كود التحقق من Google Search Console</span>
            </label>
            <input
              type="text"
              value={googleSiteVerification}
              onChange={(e) => setGoogleSiteVerification(e.target.value)}
              placeholder="مثال: google-site-verification=xxxx..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-semibold font-mono dir-ltr text-left"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              يُحقن تلقائياً في وسوم &lt;head&gt; لإثبات ملكية الموقع فورياً في جوجل.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>كود التحقق من Bing Webmaster Tools</span>
            </label>
            <input
              type="text"
              value={bingSiteVerification}
              onChange={(e) => setBingSiteVerification(e.target.value)}
              placeholder="مثال: msvalidate.01=xxxx..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 font-semibold font-mono dir-ltr text-left"
            />
          </div>
        </div>

        {/* 6. Dynamic Room SEO Toggles */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 block">
                تفعيل السيو الديناميكي للغرف (Dynamic Room SEO)
              </span>
              <span className="text-[11px] text-slate-500 block">
                تحديث عنوان الصفحة ووصفها والبيانات المهيكلة تلقائياً عند دخول أي غرفة باسمها ووصفها.
              </span>
            </div>
            <input
              type="checkbox"
              checked={enableDynamicRoomSEO}
              onChange={(e) => setEnableDynamicRoomSEO(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100/70 transition-colors">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-slate-800 block">
                تضمين غرف الدردشة في خريطة الموقع التلقائية (Sitemap Auto-inclusion)
              </span>
              <span className="text-[11px] text-slate-500 block">
                توليد روابط جميع الغرف العامة داخل `sitemap.xml` لسرعة زحف عناكب جوجل إليها.
              </span>
            </div>
            <input
              type="checkbox"
              checked={sitemapAutoIncludeRooms}
              onChange={(e) => setSitemapAutoIncludeRooms(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500 cursor-pointer"
            />
          </label>
        </div>

        {/* SAVE BUTTON */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 active:scale-95"
          >
            {isSaving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            <span>{isSaving ? 'جارِ الحفظ والمزامنة...' : 'حفظ إعدادات الميتا تاق والسيو ✅'}</span>
          </button>
        </div>

      </div>

    </div>
  );
};
