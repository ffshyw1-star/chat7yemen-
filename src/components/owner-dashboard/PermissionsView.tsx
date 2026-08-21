import React, { useState } from 'react';
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
  { key: 'owner', name: 'المالك', color: 'text-amber-600 bg-amber-50 border-amber-200', badge: '👑' },
  { key: 'management', name: 'الإدارة العليا', color: 'text-rose-600 bg-rose-50 border-rose-200', badge: '🛡️' },
  { key: 'admin', name: 'مدير', color: 'text-blue-600 bg-blue-50 border-blue-200', badge: '⭐' },
  { key: 'moderator', name: 'مشرف', color: 'text-emerald-600 bg-emerald-50 border-emerald-200', badge: '⚡' },
  { key: 'vip', name: 'عضو VIP', color: 'text-purple-600 bg-purple-50 border-purple-200', badge: '💎' },
  { key: 'member', name: 'عضو مسجل', color: 'text-slate-700 bg-slate-50 border-slate-200', badge: '👤' },
  { key: 'visitor', name: 'زائر', color: 'text-slate-500 bg-slate-50 border-slate-200', badge: '🌐' },
];

export const PermissionsView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('moderator');
  
  // Matrix State: map of role -> Set of permission IDs
  const [rolePermissions, setRolePermissions] = useState<Record<string, string[]>>({
    owner: PERMISSIONS_LIST.map(p => p.id),
    super_admin: PERMISSIONS_LIST.filter(p => p.id !== 'ban_ip').map(p => p.id),
    admin: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat', 'kick_user', 'mute_user', 'delete_messages', 'create_rooms', 'use_dj', 'custom_font'],
    moderator: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat', 'kick_user', 'mute_user', 'delete_messages', 'custom_font'],
    vip: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat', 'use_dj', 'custom_font'],
    member: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat'],
    visitor: ['send_text', 'private_chat'],
  });

  const togglePermission = (role: string, permId: string) => {
    if (role === 'owner') {
      showToast('لا يمكن تعطيل صلاحيات المالك الأساسية 👑');
      return;
    }
    setRolePermissions(prev => {
      const currentList = prev[role] || [];
      const exists = currentList.includes(permId);
      const nextList = exists ? currentList.filter(id => id !== permId) : [...currentList, permId];
      return { ...prev, [role]: nextList };
    });
  };

  const handleSave = () => {
    showToast('تم حفظ مصفوفة الصلاحيات وتطبيقها على جميع الرتب فوراً 💾');
  };

  const handleResetDefaults = () => {
    setRolePermissions({
      owner: PERMISSIONS_LIST.map(p => p.id),
      super_admin: PERMISSIONS_LIST.filter(p => p.id !== 'ban_ip').map(p => p.id),
      admin: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat', 'kick_user', 'mute_user', 'delete_messages', 'create_rooms', 'use_dj', 'custom_font'],
      moderator: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat', 'kick_user', 'mute_user', 'delete_messages', 'custom_font'],
      vip: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat', 'use_dj', 'custom_font'],
      member: ['send_text', 'send_media', 'send_voice', 'send_canvas', 'private_chat'],
      visitor: ['send_text', 'private_chat'],
    });
    showToast('تم استعادة الصلاحيات الافتراضية للنظام 🔄');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Header with Save & Reset */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
            <Key className="w-4 h-4 text-amber-600" />
            <span>مصفوفة الأذونات والصلاحيات الإدارية</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            تحكم دقيق بصلاحيات كل رتبة من إرسال الوسائط، الطرد، الكتم، إدارة الغرف وحتى التخفي
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleResetDefaults}
            className="flex-1 sm:flex-none px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer flex items-center justify-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>الافتراضي</span>
          </button>
          <button
            onClick={handleSave}
            className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>حفظ الصلاحيات 💾</span>
          </button>
        </div>
      </div>

      {/* Role Selector Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
        {ROLES.map(role => (
          <button
            key={role.key}
            onClick={() => setSelectedRole(role.key)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 border shrink-0 ${
              selectedRole === role.key
                ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-xs font-black'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{role.badge}</span>
            <span>{role.name}</span>
            <span className="text-[10px] opacity-70 bg-black/10 px-1.5 py-0.2 rounded-full">
              {(rolePermissions[role.key] || []).length}
            </span>
          </button>
        ))}
      </div>

      {/* Permissions Grid for Selected Role */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-black text-slate-800">
            تعديل صلاحيات رتبة: {ROLES.find(r => r.key === selectedRole)?.badge} {ROLES.find(r => r.key === selectedRole)?.name}
          </span>
          <span className="text-[11px] text-slate-500">
            اضغط على الصلاحية للتبديل بين تفعيل / تعطيل
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PERMISSIONS_LIST.map(perm => {
            const isGranted = (rolePermissions[selectedRole] || []).includes(perm.id);
            return (
              <div
                key={perm.id}
                onClick={() => togglePermission(selectedRole, perm.id)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isGranted
                    ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isGranted ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
                  }`}>
                    {isGranted ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                  </div>
                  <span className={`text-xs font-bold ${isGranted ? 'text-emerald-950' : 'text-slate-500'}`}>
                    {perm.name}
                  </span>
                </div>

                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  isGranted ? 'bg-emerald-200/60 text-emerald-800' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isGranted ? 'مسموح' : 'محظور'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
