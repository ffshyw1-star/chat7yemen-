import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { AdminAuditLog } from '../../types';
import {
  Terminal, Search, Filter, Trash2, Download, RefreshCw,
  Shield, UserCheck, Key, Coins, AlertTriangle, UserX,
  History, ArrowRight, Settings, CheckCircle2, Clock,
  FileText, Scale, User, Globe, Laptop, ChevronDown, ChevronUp,
  AlertCircle, Sparkles, Ban, ShieldAlert, Hash
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
  const { currentUser } = useChat();

  const [activeTab, setActiveTab] = useState<'disputes' | 'audit' | 'system'>('disputes');
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [isLoadingAudit, setIsLoadingAudit] = useState<boolean>(false);
  const [auditFilter, setAuditFilter] = useState<string>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState<string>('');
  const [selectedDisputeLog, setSelectedDisputeLog] = useState<AdminAuditLog | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [logsList, setLogsList] = useState<LogEntry[]>([
    { id: 'l1', category: 'auth', message: 'تسجيل دخول ناجح للمالك بحساب معتمد', user: 'المالك الرئيسي', time: '10:45:12', level: 'success' },
    { id: 'l2', category: 'economy', message: 'إضافة رصيد تواجد تلقائي (+1 كوين)', user: 'أحمد الصنعاني', time: '10:43:00', level: 'info' },
    { id: 'l3', category: 'moderation', message: 'تطبيق كتم مؤقت لمخالفة القوانين', user: 'مشرف الغرفة', time: '10:38:22', level: 'warn' },
    { id: 'l4', category: 'rooms', message: 'تبديل الغرفة الحالية إلى "غرفة اليمن السعيد"', user: 'سارة خالد', time: '10:35:10', level: 'info' },
    { id: 'l5', category: 'system', message: 'مزامنة قاعدة بيانات D1 وفهرسة السجلات', user: 'النظام', time: '10:30:00', level: 'info' },
    { id: 'l6', category: 'auth', message: 'دخول زائر جديد للدردشة وتعيين الرصيد الافتراضي 0', user: 'زائر_4021', time: '10:28:44', level: 'info' },
    { id: 'l7', category: 'economy', message: 'ترقية عضوية إلى رتبة VIP من المتجر', user: 'البرنس', time: '10:20:15', level: 'success' },
    { id: 'l8', category: 'moderation', message: 'حظر عنوان IP مشبوه من دخول الدردشة', user: 'المالك الرئيسي', time: '10:12:00', level: 'danger' },
  ]);

  // Fetch Authoritative Audit Logs from Server with detailed stats
  const fetchAuditLogs = async () => {
    if (!currentUser) return;
    setIsLoadingAudit(true);
    try {
      const res = await fetch(`/api/admin/audit-logs?requesterId=${currentUser.id}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        setAuditLogs(data.logs);
      }
    } catch (err) {
      console.warn('Failed to fetch audit logs:', err);
    } finally {
      setIsLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
    const interval = setInterval(fetchAuditLogs, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Derived Stats
  const usernameChangesCount = auditLogs.filter(l => l.action === 'USERNAME_CHANGE').length;
  const adminOpsCount = auditLogs.filter(l => l.action !== 'USERNAME_CHANGE').length;
  const last24hCount = auditLogs.filter(l => l.timestamp > Date.now() - 24 * 60 * 60 * 1000).length;

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter(log => {
    // Tab specific filtering
    if (activeTab === 'disputes' && log.action !== 'USERNAME_CHANGE') {
      return false;
    }
    if (activeTab === 'audit' && log.action === 'USERNAME_CHANGE') {
      return false;
    }

    const matchesFilter = auditFilter === 'all' || log.action === auditFilter;
    const q = auditSearchQuery.toLowerCase();
    const matchesSearch = !q ||
      log.targetUsername.toLowerCase().includes(q) ||
      log.targetUserId.toLowerCase().includes(q) ||
      log.performedByUsername.toLowerCase().includes(q) ||
      (log.oldValue && log.oldValue.toLowerCase().includes(q)) ||
      (log.newValue && log.newValue.toLowerCase().includes(q)) ||
      (log.ip && log.ip.includes(q)) ||
      (log.notes && log.notes.toLowerCase().includes(q));
    return matchesFilter && matchesSearch;
  });

  // Filtered System Logs
  const filteredLogs = logsList.filter(log => {
    const matchesCat = categoryFilter === 'all' || log.category === categoryFilter;
    const matchesSearch = !searchQuery || log.message.toLowerCase().includes(searchQuery.toLowerCase()) || log.user?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleClearServerLogs = async (actionFilter: string = 'all') => {
    if (!currentUser) return;
    const promptMsg = actionFilter === 'USERNAME_CHANGE'
      ? 'هل أنت متأكد من رغبتك في تفريغ سجلات تغيير أسماء المستخدمين فقط؟'
      : 'هل أنت متأكد من رغبتك في تفريغ سجل العمليات والنزاعات الإدارية بالكامل من السيرفر وقاعدة البيانات؟';

    if (!window.confirm(promptMsg)) return;

    try {
      const res = await fetch('/api/admin/audit-logs/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterId: currentUser.id,
          actionFilter
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('تم تفريغ السجلات المحددة بنجاح من السيرفر 🧹');
        fetchAuditLogs();
      } else {
        showToast(`❌ فشل التفريغ: ${data.error || 'خطأ'}`);
      }
    } catch (e: any) {
      showToast(`❌ حدث خطأ: ${e?.message || 'تعذر الاتصال بالسيرفر'}`);
    }
  };

  const handleClearSystemLogs = () => {
    if (window.confirm('هل تريد مسح سجلات أحداث النظام الحالية؟')) {
      setLogsList([]);
      showToast('تم تفريغ سجلات الأحداث 🧹');
    }
  };

  const handleExportAuditLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `audit_and_disputes_logs_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('تم تصدير سجل النزاعات والعمليات الإدارية بنجاح 📥');
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

  const getActionBadge = (action: AdminAuditLog['action']) => {
    switch (action) {
      case 'USERNAME_CHANGE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-cyan-50 text-cyan-950 border border-cyan-300">
            <FileText className="w-3 h-3 text-cyan-600" />
            <span>📝 تغيير اسم مستخدم</span>
          </span>
        );
      case 'FORBIDDEN_NAMES_UPDATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-50 text-rose-950 border border-rose-300">
            <Ban className="w-3 h-3 text-rose-600" />
            <span>🚫 تحديث الأسماء المحظورة</span>
          </span>
        );
      case 'CHANGE_PASSWORD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-amber-50 text-amber-900 border border-amber-300">
            <Key className="w-3 h-3 text-amber-600" />
            <span>🔑 تغيير كلمة مرور</span>
          </span>
        );
      case 'CHANGE_RANK':
      case 'PROMOTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-purple-50 text-purple-900 border border-purple-300">
            <Shield className="w-3 h-3 text-purple-600" />
            <span>👑 رفع / تعديل رتبة</span>
          </span>
        );
      case 'DEMOTE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-50 text-rose-900 border border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>تخفيض رتبة</span>
          </span>
        );
      case 'DELETE_ACCOUNT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-red-100 text-red-950 border border-red-400">
            <UserX className="w-3 h-3 text-red-600" />
            <span>حذف حساب نهائي</span>
          </span>
        );
      case 'MODERATION_ACTION':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-orange-50 text-orange-950 border border-orange-300">
            <AlertCircle className="w-3 h-3 text-orange-600" />
            <span>⚡ إجراء إشرافي</span>
          </span>
        );
      case 'UPDATE_SETTINGS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-sky-50 text-sky-900 border border-sky-300">
            <Settings className="w-3 h-3 text-sky-600" />
            <span>إعدادات الموقع</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-300">
            <span>إجراء إداري</span>
          </span>
        );
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Top Stats Overview for Owner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-500 font-bold block">إجمالي السجلات الموثقة</span>
            <span className="text-lg font-black text-slate-900">{auditLogs.length}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <History className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-cyan-200 p-3 shadow-2xs flex items-center justify-between bg-gradient-to-br from-cyan-50/50 to-white">
          <div>
            <span className="text-[10px] text-cyan-800 font-bold block">سجلات تغيير الأسماء</span>
            <span className="text-lg font-black text-cyan-900">{usernameChangesCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700">
            <FileText className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-purple-200 p-3 shadow-2xs flex items-center justify-between bg-gradient-to-br from-purple-50/50 to-white">
          <div>
            <span className="text-[10px] text-purple-800 font-bold block">تعديلات الإدارة والرتب</span>
            <span className="text-lg font-black text-purple-900">{adminOpsCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
            <Shield className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200 p-3 shadow-2xs flex items-center justify-between bg-gradient-to-br from-emerald-50/50 to-white">
          <div>
            <span className="text-[10px] text-emerald-800 font-bold block">عمليات آخر 24 ساعة</span>
            <span className="text-lg font-black text-emerald-900">{last24hCount}</span>
          </div>
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
            <Clock className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Top Tab Bar: Switch between Disputes Log, Admin Audit Log & Live System Events */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-xs flex flex-wrap sm:flex-nowrap items-center gap-2">
        <button
          type="button"
          onClick={() => { setActiveTab('disputes'); setAuditFilter('all'); }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'disputes'
              ? 'bg-[#002f34] text-cyan-300 shadow-md ring-2 ring-cyan-400/40'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Scale className="w-4 h-4 text-cyan-400" />
          <span>⚖️ سجل النزاعات وتغيير الأسماء</span>
          {usernameChangesCount > 0 && (
            <span className="bg-cyan-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full">
              {usernameChangesCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => { setActiveTab('audit'); setAuditFilter('all'); }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-[#0b333e] text-amber-300 shadow-md ring-2 ring-amber-400/40'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Shield className="w-4 h-4 text-amber-400" />
          <span>🛡️ سجل العمليات الإدارية الحساسة</span>
          {adminOpsCount > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
              {adminOpsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'system'
              ? 'bg-[#0b333e] text-white shadow-md'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>⚡ سجلات النظام المباشرة</span>
        </button>
      </div>

      {/* VIEW 1 & 2: DISPUTES & ADMIN AUDIT LOGS */}
      {(activeTab === 'disputes' || activeTab === 'audit') && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/70 via-white to-white">
            <div>
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                {activeTab === 'disputes' ? (
                  <>
                    <Scale className="w-4 h-4 text-cyan-600" />
                    <span>سجل النزاعات وتغييرات أسماء المستخدمين (Disputes & Name Change Audit Trail)</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span>سجل العمليات الإدارية الحساسة (Primary Owner Sovereign Audit Trail)</span>
                  </>
                )}
              </h3>
              <p className="text-[11px] text-slate-600 mt-1">
                {activeTab === 'disputes'
                  ? 'سجل مركزي دائم في السيرفر يوثق كافة عمليات تغيير أسماء الأعضاء مع الاسم السابق والجديد، التوقيت بالثواني، عنوان IP، ومعرف الحساب للرجوع إليها في أي نزاع.'
                  : 'توثيق صارم لجميع العمليات الحصرية للمالك والإدارة (تغيير كلمات المرور، رفع وتنزيل الرتب، حذف الحسابات، وتعديل إعدادات السيرفر).'}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={fetchAuditLogs}
                disabled={isLoadingAudit}
                className="px-3 py-2 bg-[#0099c8] hover:bg-[#0088b3] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingAudit ? 'animate-spin' : ''}`} />
                <span>تحديث السجل</span>
              </button>

              <button
                type="button"
                onClick={handleExportAuditLogs}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all border border-slate-200"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>تصدير JSON</span>
              </button>

              <button
                type="button"
                onClick={() => handleClearServerLogs(activeTab === 'disputes' ? 'USERNAME_CHANGE' : 'all')}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1.5 transition-all border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>مسح السجلات</span>
              </button>
            </div>
          </div>

          {/* Search & Action Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder={
                  activeTab === 'disputes'
                    ? 'بحث بالاسم السابق، الاسم الجديد، معرف العضو، عنوان IP...'
                    : 'بحث بالمستخدم المستهدف، المنفذ، معرف الحساب، أو الملاحظات...'
                }
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {activeTab === 'audit' && (
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { key: 'all', label: 'الكل' },
                  { key: 'CHANGE_RANK', label: '👑 الرتب والترقيات' },
                  { key: 'CHANGE_PASSWORD', label: '🔑 كلمات المرور' },
                  { key: 'DELETE_ACCOUNT', label: '🗑️ حذف الحسابات' },
                  { key: 'FORBIDDEN_NAMES_UPDATE', label: '🚫 الأسماء المحظورة' },
                  { key: 'UPDATE_SETTINGS', label: '⚙️ الإعدادات' },
                  { key: 'MODERATION_ACTION', label: '⚡ الإشراف' },
                ].map(f => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setAuditFilter(f.key)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      auditFilter === f.key
                        ? 'bg-slate-900 text-amber-300 shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Records List */}
          <div className="space-y-3">
            {filteredAuditLogs.length > 0 ? (
              filteredAuditLogs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const isUsernameChange = log.action === 'USERNAME_CHANGE';

                return (
                  <div
                    key={log.id}
                    className={`bg-white rounded-2xl border p-4 shadow-xs transition-all space-y-3 ${
                      isUsernameChange
                        ? 'border-cyan-200 hover:border-cyan-400 bg-gradient-to-r from-cyan-50/20 via-white to-white'
                        : 'border-slate-200 hover:border-amber-300'
                    }`}
                  >
                    {/* Top Row: Action Badge + Time + ID */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action)}
                        <span className="text-xs font-extrabold text-slate-900">
                          {log.actionTitle}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500">
                        <span className="flex items-center gap-1 text-slate-600 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.formattedTime}</span>
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded-md text-[10px] font-mono border border-slate-200">
                          ID: {log.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-cyan-700 hover:text-cyan-900 p-1 cursor-pointer"
                          title="عرض تفاصيل النزاع"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Main Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                      {/* Left / Transition Box */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block">
                          {isUsernameChange ? '📝 انتقال الاسم (الاسم السابق ➔ الجديد):' : '🔄 تفاصيل التغيير:'}
                        </span>
                        <div className="flex items-center gap-2 font-mono text-xs font-black">
                          <span className="text-rose-700 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 line-through">
                            {log.oldValue || '—'}
                          </span>
                          <ArrowRight className="w-4 h-4 text-cyan-600 shrink-0" />
                          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-300">
                            {log.newValue || '—'}
                          </span>
                        </div>
                      </div>

                      {/* Performed By */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block">
                          👤 الطرف المنفذ:
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900 flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            <span>{log.performedByUsername}</span>
                          </span>
                          <span className="text-[10px] font-mono bg-slate-200 text-slate-800 px-2 py-0.5 rounded">
                            {log.performedById}
                          </span>
                        </div>
                        {log.performedByRole && (
                          <span className="text-[10px] text-slate-500 font-bold block">
                            الرتبة: {log.performedByRole}
                          </span>
                        )}
                      </div>

                      {/* Target Member */}
                      <div className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1">
                        <span className="text-[10px] text-slate-500 font-bold block">
                          🎯 العضو المستهدف:
                        </span>
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900">
                            {log.targetUsername}
                          </span>
                          <span className="text-[10px] font-mono bg-cyan-100 text-cyan-950 px-2 py-0.5 rounded border border-cyan-200">
                            {log.targetUserId}
                          </span>
                        </div>
                        {log.targetUserRole && (
                          <span className="text-[10px] text-slate-500 font-bold block">
                            الرتبة الحالية: {log.targetUserRole}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Notes Row */}
                    {log.notes && (
                      <div className="bg-slate-50 rounded-xl p-2.5 text-[11px] font-bold text-slate-700 border border-slate-200/70 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                          <span>{log.notes}</span>
                        </div>
                        {log.ip && (
                          <span className="text-[10px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                            IP: {log.ip}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Expandable Dispute Evidence Section */}
                    {isExpanded && (
                      <div className="p-3.5 bg-gradient-to-r from-cyan-950/5 via-indigo-950/5 to-transparent rounded-xl border border-cyan-200/80 space-y-2.5 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between text-xs font-black text-slate-800 border-b border-cyan-200/60 pb-2">
                          <span className="flex items-center gap-1.5 text-cyan-900">
                            <Scale className="w-4 h-4 text-cyan-700" />
                            <span>تقرير الأدلة الفنية لفض النزاعات (Technical Dispute Evidence):</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Timestamp: {log.timestamp} ({new Date(log.timestamp).toISOString()})
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                              <Globe className="w-3 h-3 text-cyan-600" />
                              <span>عنوان IP المسجل وقت العملية:</span>
                            </span>
                            <span className="font-mono font-bold text-slate-900 block">
                              {log.ip || 'غير مسجل أو محلي (localhost)'}
                            </span>
                          </div>

                          <div className="bg-white p-2 rounded-lg border border-slate-200 space-y-1">
                            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                              <Laptop className="w-3 h-3 text-cyan-600" />
                              <span>معلومات المتصفح والنظام (User-Agent):</span>
                            </span>
                            <span className="font-mono text-[10px] text-slate-700 block truncate" title={log.userAgent || ''}>
                              {log.userAgent || 'متصفح العميل / تطبيق الويب'}
                            </span>
                          </div>
                        </div>

                        {log.disputeData && (
                          <div className="bg-white p-2.5 rounded-lg border border-cyan-200 space-y-1.5">
                            <span className="text-[10px] text-cyan-900 font-black block">
                              📌 تفاصيل إضافية للتحكيم:
                            </span>
                            <p className="text-[11px] text-slate-700 leading-relaxed font-bold">
                              تم توثيق هذا الإجراء وتخزينه بصورة غير قابلة للتعديل لمقارنة انتحال الشخصيات، استرداد الأسماء، أو تسوية شكاوى الأعضاء في سجل السيرفر.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-2">
                <Scale className="w-8 h-8 text-slate-400 mx-auto" />
                <h4 className="text-sm font-black text-slate-800">
                  {isLoadingAudit ? 'جاري تحميل السجلات من السيرفر...' : 'لا توجد سجلات تطابق البحث أو الفلتر المحدد'}
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  {activeTab === 'disputes'
                    ? 'سيتم تسجيل أي عملية تغيير لاسم أي عضو في الدردشة تلقائياً هنا مع الاسم السابق والجديد وتوقيت العملية بالثواني.'
                    : 'يتم تسجيل وتوثيق أي إجراء إداري حساس (تعديل رتب، تغيير كلمات مرور، أو حذف حسابات) تلقائياً هنا.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: SYSTEM EVENT TERMINAL LOGS */}
      {activeTab === 'system' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
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
                type="button"
                onClick={handleExportLogs}
                className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير السجلات</span>
              </button>
              <button
                type="button"
                onClick={handleClearSystemLogs}
                className="flex-1 sm:flex-none px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl cursor-pointer flex items-center justify-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>مسح السجلات 🧹</span>
              </button>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input
                type="text"
                placeholder="بحث في نصوص الأحداث أو أسماء المستخدمين..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-bold"
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
                  type="button"
                  onClick={() => setCategoryFilter(f.key)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
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
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 shadow-xl space-y-2 max-h-96 overflow-y-auto custom-scrollbar font-mono text-xs">
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
              <div className="py-8 text-center text-slate-500">
                لا توجد سجلات تطابق الفلتر الحالي
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
