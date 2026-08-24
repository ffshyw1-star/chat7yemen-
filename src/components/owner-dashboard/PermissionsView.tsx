import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import { Shield, Check, X, RotateCcw, Save, Key, Lock, Sparkles, UserCheck, AlertCircle } from 'lucide-react';
import { UserRole } from '../../types';

interface PermissionItem {
  id: string;
  name: string;
  category: 'chat' | 'moderation' | 'customization' | 'rooms';
}

const PERMISSIONS_LIST: PermissionItem[] = [
  { id: 'send_text', name: 'إرسال الرسائل النصية', category: 'chat' },
  { id: 'send_media', name: 'إرسال الصور والوسائط', category: 'chat' },
  { id: 'send_voice', name: 'إرسال الرسائل الصوتية', category: 'chat' },
  { id: 'send_canvas', name: 'استخدام لوحة الرسم', category: 'chat' },
  { id: 'private_chat', name: 'محادثات الخاص', category: 'chat' },
  { id: 'kick_user', name: 'طرد الأعضاء والزوار', category: 'moderation' },
  { id: 'mute_user', name: 'كتم الأعضاء والزوار', category: 'moderation' },
  { id: 'ban_user', name: 'حظر الحساب نهائياً', category: 'moderation' },
  { id: 'ban_ip', name: 'حظر الآي بي والشبكة', category: 'moderation' },
  { id: 'delete_messages', name: 'مسح رسائل الآخرين', category: 'moderation' },
  { id: 'create_rooms', name: 'إنشاء وإدارة الغرف', category: 'rooms' },
  { id: 'lock_rooms', name: 'قفل الغرف بكلمة سر', category: 'rooms' },
  { id: 'use_dj', name: 'تشغيل DJ والمايك', category: 'rooms' },
  { id: 'custom_font', name: 'تخصيص لون وحجم الخط', category: 'customization' },
  { id: 'stealth_mode', name: 'وضع التخفي (الشبح)', category: 'customization' },
  { id: 'broadcast_alert', name: 'إرسال تنبيه عام', category: 'moderation' },
];

const ROLES: { key: UserRole; name: string; color: string; badge: string }[] = [
  { key: 'owner', name: 'المالك', color: 'text-amber-600 bg-amber-50 border-amber-200', badge: '🏆' },
  { key: 'management', name: 'الإدارة العليا', color: 'text-rose-600 bg-rose-50 border-rose-200', badge: '🛡️' },
  { key: 'admin', name: 'مدير', color: 'text-blue-600 bg-blue-50 border-blue-200', badge: '⭐' },
  { key: 'moderator', name: 'مشرف', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', badge: '⚡' },
  { key: 'vip', name: 'عضو VIP', color: 'text-purple-600 bg-purple-50 border-purple-200', badge: '💎' },
  { key: 'member', name: 'عضو مسجل', color: 'text-slate-700 bg-slate-50 border-slate-200', badge: '👤' },
  { key: 'visitor', name: 'زائر', color: 'text-slate-500 bg-slate-50 border-slate-200', badge: '🌐' },
];

const DEFAULT_PERMISSIONS: Record<string, string[]> = {
  owner: PERMISSIONS_LIST.map(p => p.id),
  management: PERMISSIONS_LIST.filter(p => p.id !== 'ban_ip').map(p => p.id),
  admin: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat', 'kick_user', 'mute_user', 'delete_messages', 'create_rooms', 'use_dj', 'custom_font'],
  moderator: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat', 'kick_user', 'mute_user', 'delete_messages', 'custom_font'],
  vip: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat', 'use_dj', 'custom_font'],
  member: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat'],
  visitor: ['send_text', 'private_chat'],
};

export const PermissionsView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const { siteSettings, updateSiteSettings } = useChat();
  const [selectedRole, setSelectedRole] = useState<UserRole>('moderator');
  
  // Matrix State: map of role -> Set of permission IDs
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>(() => {
    return (siteSettings as any)?.rolePermissions || DEFAULT_PERMISSIONS;
  });

  useEffect(() => {
    if ((siteSettings as any)?.rolePermissions) {
      setRolePermissions((siteSettings as any).rolePermissions);
    }
  }, [siteSettings]);

  const togglePermission = (role: string, permId: string) => {
    if (role === 'owner') {
      showToast('لا يمكن تعطيل صلاحيات المالك الأساسية 👑');
      return;
    }
    setRolePermissions(prev => {
      const currentList = prev[role] || [];
      const exists = currentList.includes(permId);
      const nextList = exists ? currentList.filter(id => id !== permId) : [...currentList, permId];
      const updated = { ...prev, [role]: nextList };
      updateSiteSettings({ rolePermissions: updated } as any);
      return updated;
    });
  };

  const handleSave = () => {
    updateSiteSettings({ rolePermissions } as any);
    showToast('تم حفظ مصفوفة الصلاحيات وتطبيقها على جميع الرتب وتخزينها في قاعدة البيانات 💾');
  };

  const handleResetDefaults = () => {
    setRolePermissions(DEFAULT_PERMISSIONS);
    updateSiteSettings({ rolePermissions: DEFAULT_PERMISSIONS } as any);
    showToast('تم استعادة الصلاحيات الافتراضية للنظام 🔄');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 font-sans text-right" dir="rtl">
      {/* Header with Save & Reset */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-amber-600" />
            <span>مصفوفة الأذونات والصلاحيات الإدارية</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تحكم دقيق بصلاحيات كل رتبة وتخزين التعديلات في قاعدة البيانات والسيرفر
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer transition-colors flex items-center justify-center gap-1.5"
            title="استعادة الافتراضي"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-lg cursor-pointer shadow-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ الصلاحيات 💾</span>
          </button>
        </div>
      </div>

      {/* Role Selection Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 p-2 shadow-2xs flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {ROLES.map(r => {
          const isActive = selectedRole === r.key;
          return (
            <button
              key={r.key}
              type="button"
              onClick={() => setSelectedRole(r.key)}
              className={`px-3 py-2 rounded-lg text-xs font-black flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-xs'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/60'
              }`}
            >
              <span>{r.badge}</span>
              <span>{r.name}</span>
            </button>
          );
        })}
      </div>

      {/* Permissions Grid for Selected Role */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
            <span>صلاحيات رتبة:</span>
            <span className="text-amber-600 font-bold underline decoration-amber-300">
              {ROLES.find(r => r.key === selectedRole)?.name}
            </span>
          </h4>
          <span className="text-[10px] text-slate-400 font-mono">
            {(rolePermissions[selectedRole] || []).length} من أصل {PERMISSIONS_LIST.length} مفعّلة
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {PERMISSIONS_LIST.map(p => {
            const isGranted = (rolePermissions[selectedRole] || []).includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => togglePermission(selectedRole, p.id)}
                className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer select-none ${
                  isGranted
                    ? 'bg-emerald-50/70 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 text-xs">
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center ${
                    isGranted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {isGranted ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <X className="w-3 h-3" />}
                  </div>
                  <span>{p.name}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
