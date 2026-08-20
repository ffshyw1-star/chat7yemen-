import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Terminal, Search, Filter, Trash2, Download, RefreshCw,
  Shield, UserCheck, Key, Coins, AlertTriangle
} from 'lucide-react';

interface LogEntry {
  id: string;
  category: 'auth' | 'moderation' | 'economy' | 'rooms' | 'system';
  message: string;
  user?: string;
  time: string;
  level: 'info' | 'warn' | 'success' | 'danger';
}

export const LogsView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [logsList, setLogsList] = useState<LogEntry[]>([
    { id: 'l1', category: 'auth', message: 'تسجيل دخول ناجح للمالك بحساب معتمد', user: 'المالك', time: '10:45:12', level: 'success' },
    { id: 'l2', category: 'economy', message: 'إضافة رصيد تواجد تلقائي (+1 كوين)', user: 'أحمد الصنعاني', time: '10:43:00', level: 'info' },
    { id: 'l3', category: 'moderation', message: 'تطبيق كتم مؤقت لمدة 15 دقيقة لمخالفة القوانين', user: 'مشرف الغرفة', time: '10:38:22', level: 'warn' },
    { id: 'l4', category: 'rooms', message: 'تبديل الغرفة الحالية إلى "غرفة اليمن السعيد"', user: 'سارة خالد', time: '10:35:10', level: 'info' },
    { id: 'l5', category: 'system', message: 'مزامنة قاعدة بيانات Cloudflare D1 وفهرسة السجلات', user: 'النظام', time: '10:30:00', level: 'info' },
    { id: 'l6', category: 'auth', message: 'دخول زائر جديد للدردشة وتعيين الرصيد الافتراضي 0', user: 'زائر_4021', time: '10:28:44', level: 'info' },
    { id: 'l7', category: 'economy', message: 'ترقية عضوية إلى رتبة VIP من المتجر', user: 'البرنس', time: '10:20:15', level: 'success' },
    { id: 'l8', category: 'moderation', message: 'حظر عنوان IP مشبوه من دخول الدردشة', user: 'المالك', time: '10:12:00', level: 'danger' },
  ]);

  const filteredLogs = logsList.filter(log => {
    const matchesCat = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesSearch = !searchQuery || log.message.toLowerCase().includes(searchQuery.toLowerCase()) || log.user?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleClearLogs = () => {
    if (window.confirm('هل تريد مسح سجلات النظام الحالية؟')) {
      setLogsList([]);
      showToast('تم تفريغ سجلات الأحداث 🧹');
    }
  };

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logsList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `system_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تصدير سجلات النظام بنجاح 📥');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Terminal className="w-4 h-4 text-slate-700" />
            <span>سجلات النظام والأحداث المباشرة (System Event Logs)</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            متابعة فورية لعمليات تسجيل الدخول، الإجراءات الإدارية، وتداول الرصيد
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportLogs}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>تصدير السجلات</span>
          </button>
          <button
            onClick={handleClearLogs}
            className="flex-1 sm:flex-none px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>مسح السجلات 🧹</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          <input
            type="text"
            placeholder="بحث في نصوص الأحداث أو أسماء المستخدمين..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pr-9 pl-3 py-2 text-xs font-bold"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', label: 'الكل' },
            { key: 'auth', label: 'دخول/خروج' },
            { key: 'moderation', label: 'إدارية' },
            { key: 'economy', label: 'رصيد' },
            { key: 'rooms', label: 'غرف' },
            { key: 'system', label: 'نظام' },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setCategoryFilter(f.key)}
              className={`px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                categoryFilter === f.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live Logs Terminal View */}
      <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 shadow-xl space-y-2 max-h-96 overflow-y-auto custom-scrollbar font-mono text-xs">
        {filteredLogs.length > 0 ? (
          filteredLogs.map(log => {
            let color = 'text-slate-300';
            if (log.level === 'success') color = 'text-emerald-400';
            if (log.level === 'warn') color = 'text-amber-400';
            if (log.level === 'danger') color = 'text-rose-400';

            return (
              <div key={log.id} className="flex items-start justify-between gap-3 py-1 border-b border-slate-900/80 hover:bg-slate-900/50 px-1 rounded transition-colors">
                <div className="flex items-start gap-2">
                  <span className="text-slate-500 text-[11px] font-bold">[{log.time}]</span>
                  <span className="text-cyan-400 font-bold uppercase text-[10px] bg-cyan-950/80 px-1.5 py-0.2 rounded border border-cyan-800/40">
                    {log.category}
                  </span>
                  <span className={color}>{log.message}</span>
                </div>
                {log.user && (
                  <span className="text-purple-300 text-[11px] shrink-0 font-bold">
                    @{log.user}
                  </span>
                )}
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-500 font-bold">
            لا توجد سجلات مطابقة للبحث حالياً
          </div>
        )}
      </div>
    </div>
  );
};
