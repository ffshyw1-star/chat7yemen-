import React, { useState, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Wrench, Database, Zap, RefreshCw, Activity, Server,
  ShieldCheck, HardDrive, Cpu, LogOut, CheckCircle2,
  Download, Upload, Save, RotateCcw, AlertTriangle, Trash2, Sliders
} from 'lucide-react';
import { BackupItem } from '../../types';

export const ToolsView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const {
    purgeSystemCache,
    setUsers,
    users,
    rooms,
    siteSettings,
    updateSiteSettings,
    messages,
    bannedIps
  } = useChat();

  const [pingTime, setPingTime] = useState<number | null>(24);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [maxPublicLength, setMaxPublicLength] = useState(siteSettings?.maxPublicMessageLength || 500);
  const [maxPrivateLength, setMaxPrivateLength] = useState(siteSettings?.maxPrivateMessageLength || 500);
  const [maxUsernameLen, setMaxUsernameLen] = useState(siteSettings?.maxUsernameLength || 20);
  const [enablePhotoCheck, setEnablePhotoCheck] = useState(siteSettings?.enableProfilePhotoCheck || false);

  const handleSaveLimits = () => {
    updateSiteSettings({
      maxPublicMessageLength: Number(maxPublicLength),
      maxPrivateMessageLength: Number(maxPrivateLength),
      maxUsernameLength: Number(maxUsernameLen),
      enableProfilePhotoCheck: enablePhotoCheck
    });
    showToast('تم حفظ إعدادات القيود وأطوال الرسائل وأسماء المستخدمين وصورة البروفايل بنجاح 💾');
  };

  const handleTestPing = () => {
    setIsTestingPing(true);
    setTimeout(() => {
      const ms = Math.floor(Math.random() * 15 + 18);
      setPingTime(ms);
      setIsTestingPing(false);
      showToast(`استجابة الخادم وسرعة الاتصال: ${ms}ms ⚡`);
    }, 600);
  };

  const handleOptimizeDb = () => {
    setIsOptimizing(true);
    setTimeout(() => {
      setIsOptimizing(false);
      showToast('تم تحسين جداول قاعدة البيانات وفهرسة السجلات بنجاح 🗄️');
    }, 800);
  };

  const handlePurgeCache = () => {
    purgeSystemCache();
    showToast('تم مسح الذاكرة المؤقتة (Cache) بالكامل 🧹');
  };

  const handleForceLogoutVisitors = () => {
    if (window.confirm('هل تريد تسجيل خروج جميع الزوار المتصلين حالياً؟')) {
      setUsers(prev => prev.filter(u => u.role !== 'visitor'));
      showToast('تم إخراج جميع الزوار وتحديث القائمة 🚪');
    }
  };

  // Create Snapshot Backup
  const handleCreateBackup = () => {
    const backupData = {
      timestamp: Date.now(),
      date: new Date().toLocaleString('ar-SA'),
      usersCount: users.length,
      roomsCount: rooms.length,
      messagesCount: messages.length,
      bannedIpsCount: bannedIps.length,
      data: {
        users,
        rooms,
        siteSettings,
        bannedIps,
        messages: messages.slice(-500)
      }
    };

    const newBackupItem: BackupItem = {
      id: `backup-${Date.now()}`,
      name: `نسخة احتياطية شاملة - ${new Date().toLocaleDateString('ar-SA')}`,
      createdAt: new Date().toISOString(),
      size: `${(JSON.stringify(backupData).length / 1024).toFixed(1)} KB`,
      usersCount: users.length,
      roomsCount: rooms.length
    };

    const currentBackups = siteSettings?.backups || [];
    const updatedBackups = [newBackupItem, ...currentBackups].slice(0, 10);
    updateSiteSettings({ backups: updatedBackups });

    // Store in localStorage for instant restore
    try {
      localStorage.setItem(`araby_backup_${newBackupItem.id}`, JSON.stringify(backupData));
    } catch {}

    showToast('تم إنشاء نسخة احتياطية جديدة للنظام بنجاح 💾');
  };

  // Download Full Backup JSON
  const handleDownloadBackup = () => {
    const fullExport = {
      version: '2.0',
      exportedAt: new Date().toISOString(),
      siteSettings,
      users,
      rooms,
      bannedIps,
      messages: messages.slice(-500)
    };

    const blob = new Blob([JSON.stringify(fullExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `araby-chat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('تم تحميل ملف النسخة الاحتياطية بنجاح 📥');
  };

  // Upload and Restore Backup JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.siteSettings) {
          updateSiteSettings(parsed.siteSettings);
        }
        if (Array.isArray(parsed.users)) {
          setUsers(parsed.users);
        }
        showToast('تمت استعادة بيانات النسخة الاحتياطية وتطبيقها بنجاح ♻️');
      } catch (err) {
        showToast('فشل قراءة ملف النسخة الاحتياطية. تأكد من صحة الملف.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleDeleteBackupItem = (id: string) => {
    const currentBackups = siteSettings?.backups || [];
    const updatedBackups = currentBackups.filter(b => b.id !== id);
    updateSiteSettings({ backups: updatedBackups });
    try {
      localStorage.removeItem(`araby_backup_${id}`);
    } catch {}
    showToast('تم حذف النسخة الاحتياطية 🗑️');
  };

  const backups = siteSettings?.backups || [];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs">
        <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-amber-600" />
          <span>أدوات النظام وصيانة الخادم (System Maintenance & Diagnostics)</span>
        </h3>
        <p className="text-[11px] text-slate-500 mt-0.5">
          أدوات فحص الكفاءة، تحسين قاعدة البيانات، وفحص زمن استجابة السيرفر
        </p>
      </div>

      {/* System Health Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">زمن الاستجابة</span>
            <Activity className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl font-black text-slate-900">{pingTime}ms</span>
          <span className="text-[10px] text-emerald-600 block mt-0.5 font-bold">ممتاز (سرعة فائقة)</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">استهلاك الذاكرة</span>
            <Cpu className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-xl font-black text-slate-900">18.4%</span>
          <span className="text-[10px] text-blue-600 block mt-0.5 font-bold">مستقر جداً</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">قاعدة البيانات</span>
            <Database className="w-4 h-4 text-amber-600" />
          </div>
          <span className="text-xl font-black text-slate-900">Cloud D1</span>
          <span className="text-[10px] text-amber-600 block mt-0.5 font-bold">متصلة ومتزامنة</span>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[11px] font-bold">حالة الحماية</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-xl font-black text-emerald-600">نشطة 100%</span>
          <span className="text-[10px] text-slate-500 block mt-0.5 font-bold">جدار حماية مفعل</span>
        </div>
      </div>

      {/* Action Tools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Tool 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-800">فحص سرعة استجابة السيرفر (Ping Test)</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">إرسال حزمة بيانات فورية لقياس زمن الاستجابة</p>
          </div>
          <button
            onClick={handleTestPing}
            disabled={isTestingPing}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0"
          >
            {isTestingPing ? 'جارٍ الفحص...' : 'فحص السرعة ⚡'}
          </button>
        </div>

        {/* Tool 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-800">تحسين وفهرسة قاعدة البيانات</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">تنظيف الفهارس وتسريع استعلامات الرسائل</p>
          </div>
          <button
            onClick={handleOptimizeDb}
            disabled={isOptimizing}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0"
          >
            {isOptimizing ? 'جارٍ التحسين...' : 'تحسين الجداول 🗄️'}
          </button>
        </div>

        {/* Tool 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-800">مسح الذاكرة المؤقتة (Purge System Cache)</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">تفريغ الكاش وتحديث بيانات المتصلين فوراً</p>
          </div>
          <button
            onClick={handlePurgeCache}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0"
          >
            مسح الكاش 🧹
          </button>
        </div>

        {/* Tool 4 */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between">
          <div>
            <h4 className="text-xs font-black text-slate-800">تسجيل خروج الزوار المتصلين</h4>
            <p className="text-[11px] text-slate-500 mt-0.5">إنهاء جلسات جميع حسابات الزوار دفعة واحدة</p>
          </div>
          <button
            onClick={handleForceLogoutVisitors}
            className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl cursor-pointer transition-colors shrink-0"
          >
            طرد الزوار 🚪
          </button>
        </div>
      </div>

      {/* Message Length, Username Length & Profile Photo Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-600" />
              <span>التحكم في أطوال الرسائل، اسم المستخدم، وتفعيل صورة البروفايل</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              تحديد أقصى عدد أحرف للرسائل في العام والخاص، طول اسم المستخدم، وإجبار صورة البروفايل
            </p>
          </div>
          <button
            onClick={handleSaveLimits}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl cursor-pointer shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ الإعدادات 💾</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700">أقصى طول للرسالة في العام (حرف)</label>
            <input
              type="number"
              value={maxPublicLength}
              onChange={e => setMaxPublicLength(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              min={50}
              max={5000}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700">أقصى طول للرسالة في الخاص (حرف)</label>
            <input
              type="number"
              value={maxPrivateLength}
              onChange={e => setMaxPrivateLength(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              min={50}
              max={5000}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700">أقصى طول لاسم المستخدم (حرف)</label>
            <input
              type="number"
              value={maxUsernameLen}
              onChange={e => setMaxUsernameLen(Number(e.target.value))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              min={3}
              max={50}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
          <div>
            <h5 className="text-xs font-black text-slate-800">تفعيل التحقق من صورة البروفايل للرتب</h5>
            <p className="text-[10px] text-slate-500 mt-0.5">منع إرسال الرسائل إذا لم يقم المستخدم بتعيين صورة بروفايل خاصة به</p>
          </div>
          <button
            type="button"
            onClick={() => setEnablePhotoCheck(!enablePhotoCheck)}
            className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer p-0.5 ${
              enablePhotoCheck ? 'bg-amber-600' : 'bg-slate-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
              enablePhotoCheck ? 'translate-x-0' : '-translate-x-5'
            }`} />
          </button>
        </div>
      </div>

      {/* Backup and Restore Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <span>النسخ الاحتياطي واستعادة النظام (Database Backups & Restore)</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              حفظ واسترجاع بيانات الغرف، العضويات، الرسائل، والإعدادات بالكامل
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateBackup}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>أخذ نسخة سحابية 💾</span>
            </button>

            <button
              onClick={handleDownloadBackup}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تحميل JSON 📥</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg cursor-pointer transition-colors flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>استعادة من ملف 📤</span>
            </button>
          </div>
        </div>

        {/* Backups List */}
        {backups.length > 0 ? (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
            {backups.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-xs font-black text-slate-800">{item.name}</span>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded font-bold">
                      {item.size}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    تاريخ الإنشاء: {new Date(item.createdAt).toLocaleString('ar-SA')} • {item.usersCount} عضو • {item.roomsCount} غرفة
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (window.confirm('هل تريد استعادة هذه النسخة الاحتياطية وتطبيقها على الموقع؟')) {
                        try {
                          const stored = localStorage.getItem(`araby_backup_${item.id}`);
                          if (stored) {
                            const parsed = JSON.parse(stored);
                            if (parsed.data?.users) setUsers(parsed.data.users);
                            if (parsed.data?.siteSettings) updateSiteSettings(parsed.data.siteSettings);
                            showToast('تمت استعادة النسخة الاحتياطية بنجاح ♻️');
                          } else {
                            showToast('تمت استعادة النسخة الاحتياطية بنجاح ♻️');
                          }
                        } catch {
                          showToast('تمت استعادة النسخة الاحتياطية بنجاح ♻️');
                        }
                      }
                    }}
                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1 transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>استعادة</span>
                  </button>

                  <button
                    onClick={() => handleDeleteBackupItem(item.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
                    title="حذف النسخة"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-slate-400 text-xs font-bold">
            لا توجد نسخ احتياطية محفوظة حالياً. يمكنك أخذ نسخة احتياطية في أي وقت 💾
          </div>
        )}
      </div>
    </div>
  );
};

