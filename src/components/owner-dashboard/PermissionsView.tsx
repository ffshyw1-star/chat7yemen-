import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Check, X, RotateCcw, Save, Key
} from 'lucide-react';
import { UserRole } from '../../types';
import { PERMISSIONS_LIST, DEFAULT_PERMISSIONS } from '../../utils/permissions';

const ROLES: { key: UserRole; name: string; color: string; badge: string; desc: string }[] = [
  { key: 'owner', name: 'المالك (Owner)', color: 'text-amber-600 bg-amber-50 border-amber-200', badge: '👑', desc: 'يمتلك كامل الصلاحيات غير قابلة للتعطيل' },
  { key: 'management', name: 'الإدارة العليا', color: 'text-rose-600 bg-rose-50 border-rose-200', badge: '🛡️', desc: 'إدارة الموقع العامة والرقابة الشاملة' },
  { key: 'admin', name: 'مدير (Admin)', color: 'text-orange-600 bg-orange-50 border-orange-200', badge: '⭐', desc: 'إدارة الغرف والمستخدمين والرقابة' },
  { key: 'moderator', name: 'مشرف (Mod)', color: 'text-blue-600 bg-blue-50 border-blue-200', badge: '⚡', desc: 'حفظ النظام وطرد وكتم المخالفين' },
  { key: 'vip', name: 'عضو VIP', color: 'text-purple-600 bg-purple-50 border-purple-200', badge: '💎', desc: 'مميزات إضافية وتخصيصات متقدمة' },
  { key: 'member', name: 'عضو مسجل', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', badge: '👤', desc: 'العضويات العادية المسجلة' },
  { key: 'visitor', name: 'زائر', color: 'text-slate-500 bg-slate-50 border-slate-200', badge: '🌐', desc: 'الزوار غير المسجلين' },
];

const CATEGORIES = [
  { id: 'all', name: 'جميع الصلاحيات' },
  { id: 'chat', name: 'المحادثة والدردشة' },
  { id: 'moderation', name: 'الإشراف والرقابة' },
  { id: 'rooms', name: 'إدارة الغرف' },
  { id: 'customization', name: 'التخصيص والمظهر' },
];

export const PermissionsView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const { siteSettings, updateSiteSettings } = useChat();
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Matrix State: map of role -> Array of permission IDs
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(() => {
    return siteSettings?.rolePermissions || DEFAULT_PERMISSIONS;
  });

  useEffect(() => {
    if (siteSettings?.rolePermissions) {
      setRolePermissions(siteSettings.rolePermissions);
    }
  }, [siteSettings]);

  const togglePermission = (role: string, permId: string) => {
    if (role === 'owner') {
      showToast('لا يمكن تعطيل صلاحيات المالك الأساسية 👑');
      return;
    }
    const currentList = rolePermissions[role] || DEFAULT_PERMISSIONS[role] || [];
    const exists = currentList.includes(permId);
    const nextList = exists ? currentList.filter(id => id !== permId) : [...currentList, permId];
    const updated = { ...rolePermissions, [role]: nextList };
    setRolePermissions(updated);
    updateSiteSettings({ rolePermissions: updated });
    showToast(exists ? 'تم تعطيل الصلاحية لهذه الرتبة ❌' : 'تم تفعيل الصلاحية لهذه الرتبة ✅');
  };

  const handleGrantAll = () => {
    if (selectedRole === 'owner') return;
    const allIds = PERMISSIONS_LIST.map(p => p.id);
    const updated = { ...rolePermissions, [selectedRole]: allIds };
    setRolePermissions(updated);
    updateSiteSettings({ rolePermissions: updated });
    showToast(`تم تفعيل جميع الصلاحيات لرتبة ${ROLES.find(r => r.key === selectedRole)?.name} ✅`);
  };

  const handleRevokeAll = () => {
    if (selectedRole === 'owner') {
      showToast('لا يمكن تجريد المالك من الصلاحيات 👑');
      return;
    }
    const updated = { ...rolePermissions, [selectedRole]: [] };
    setRolePermissions(updated);
    updateSiteSettings({ rolePermissions: updated });
    showToast(`تم تعطيل جميع الصلاحيات لرتبة ${ROLES.find(r => r.key === selectedRole)?.name} ❌`);
  };

  const handleSavePermissions = () => {
    updateSiteSettings({ rolePermissions });
    showToast('تم حفظ مصفوفة الصلاحيات وتطبيقها على جميع الرتب وتخزينها بنجاح 💾');
  };

  const handleResetPermissions = () => {
    setRolePermissions(DEFAULT_PERMISSIONS);
    updateSiteSettings({ rolePermissions: DEFAULT_PERMISSIONS });
    showToast('تم استعادة الصلاحيات الافتراضية للنظام 🔄');
  };

  const filteredPermissions = selectedCategory === 'all'
    ? PERMISSIONS_LIST
    : PERMISSIONS_LIST.filter(p => p.category === selectedCategory);

  const currentRoleObj = ROLES.find(r => r.key === selectedRole) || ROLES[0];
  const activeCount = (rolePermissions[selectedRole] || DEFAULT_PERMISSIONS[selectedRole] || []).length;

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans text-right" dir="rtl">
      
      {/* Header Info Box */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <Key className="w-4 h-4 text-amber-600" />
            <span>مصفوفة الصلاحيات والأذونات حسب الرتب</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            حدد الرتبة وتحكم بالصلاحيات الممنوعة والمسموحة لكل دور بدقة، ويتم تطبيق التغيير فورياً على كافة المستخدمين.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetPermissions}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            title="استعادة الافتراضي"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleSavePermissions}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ الصلاحيات 💾</span>
          </button>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2 shadow-2xs flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {ROLES.map(r => {
          const isActive = selectedRole === r.key;
          const count = (rolePermissions[r.key] || DEFAULT_PERMISSIONS[r.key] || []).length;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setSelectedRole(r.key)}
              className={`px-3 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-md'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <span>{r.badge}</span>
              <span>{r.name}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {count}/{PERMISSIONS_LIST.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Role Status & Bulk Actions Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl">{currentRoleObj.badge}</span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-slate-800">
                صلاحيات {currentRoleObj.name}
              </h4>
              <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
                {activeCount} من أصل {PERMISSIONS_LIST.length} مفعّلة
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{currentRoleObj.desc}</p>
          </div>
        </div>

        {selectedRole !== 'owner' && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleGrantAll}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>تفعيل الكل</span>
            </button>
            <button
              type="button"
              onClick={handleRevokeAll}
              className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              <span>تعطيل الكل</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Permissions Matrix Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
        {filteredPermissions.map(p => {
          const isGranted = (rolePermissions[selectedRole] || DEFAULT_PERMISSIONS[selectedRole] || []).includes(p.id);
          const isOwnerRole = selectedRole === 'owner';
          return (
            <div
              key={p.id}
              onClick={() => !isOwnerRole && togglePermission(selectedRole, p.id)}
              className={`p-3.5 rounded-xl border flex items-center justify-between transition-all select-none ${
                isOwnerRole
                  ? 'bg-amber-50/50 border-amber-200 cursor-not-allowed opacity-90'
                  : 'cursor-pointer hover:shadow-xs'
              } ${
                isGranted
                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold'
                  : 'bg-slate-50/70 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs">
                <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                  isGranted ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-slate-200 text-slate-400'
                }`}>
                  {isGranted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3 h-3" />}
                </div>
                <span className="leading-snug">{p.name}</span>
              </div>

              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                isGranted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
              }`}>
                {isGranted ? 'مفعّل' : 'معطل'}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
};
