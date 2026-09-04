import React, { useState, useMemo } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Ban, ShieldAlert, Monitor, Smartphone, Globe2, Radio,
  Plus, Trash2, X, Search, CheckCircle2, UserX, VolumeX, Shield, AlertTriangle, RefreshCw
} from 'lucide-react';
import { BlockedDeviceItem, BlockedBrowserItem, BlockedCountryItem, BlockedXBandItem } from '../../types';

export const BlacklistView: React.FC<{ showToast: (msg: string) => void }> = ({ showToast }) => {
  const {
    bannedIps,
    banIp,
    unbanIp,
    banDevice,
    unbanDevice,
    banBrowser,
    unbanBrowser,
    banCountry,
    unbanCountry,
    siteSettings,
    updateSiteSettings,
    rooms,
    users,
    unkickUserFromRoom,
    unmuteUserInRoom
  } = useChat();

  const [activeTab, setActiveTab] = useState<'all' | 'ip' | 'devices' | 'browsers' | 'countries' | 'xbands' | 'room_moderation'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form Inputs for Adding Bans
  const [newIp, setNewIp] = useState('');
  const [newIpUsername, setNewIpUsername] = useState('');
  const [newIpReason, setNewIpReason] = useState('');

  const [newDevice, setNewDevice] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceUsername, setNewDeviceUsername] = useState('');
  const [newDeviceReason, setNewDeviceReason] = useState('');

  const [newBrowserFp, setNewBrowserFp] = useState('');
  const [newBrowserName, setNewBrowserName] = useState('');
  const [newBrowserUsername, setNewBrowserUsername] = useState('');
  const [newBrowserReason, setNewBrowserReason] = useState('');

  const [newCountryCode, setNewCountryCode] = useState('');
  const [newCountryName, setNewCountryName] = useState('');
  const [newCountryReason, setNewCountryReason] = useState('');

  const [newXBandRange, setNewXBandRange] = useState('');
  const [newXBandReason, setNewXBandReason] = useState('');

  // Normalized Arrays
  const blockedDevices: BlockedDeviceItem[] = useMemo(() => {
    const raw = siteSettings?.blockedDevices || [];
    return raw.map(item => {
      if (typeof item === 'string') {
        return {
          id: item,
          name: item,
          token: item,
          username: 'مستخدم غير محدد',
          date: 'غير محدد',
          reason: 'حظر الجهاز من الإدارة'
        };
      }
      return item;
    });
  }, [siteSettings?.blockedDevices]);

  const blockedBrowsers: BlockedBrowserItem[] = useMemo(() => {
    const raw = siteSettings?.blockedBrowsers || [];
    return raw.map(item => {
      if (typeof item === 'string') {
        return {
          id: item,
          name: item,
          fingerprint: item,
          username: 'مستخدم غير محدد',
          date: 'غير محدد',
          reason: 'حظر بصمة المتصفح من الإدارة'
        };
      }
      return item;
    });
  }, [siteSettings?.blockedBrowsers]);

  const blockedCountries: BlockedCountryItem[] = useMemo(() => {
    const raw = siteSettings?.blockedCountries || [];
    return raw.map(item => {
      if (typeof item === 'string') {
        return {
          code: item,
          name: item,
          date: 'غير محدد',
          reason: 'حجب الدولة من الدخول'
        };
      }
      return item;
    });
  }, [siteSettings?.blockedCountries]);

  const blockedXBands: BlockedXBandItem[] = useMemo(() => {
    const raw = siteSettings?.blockedXBands || [];
    return raw.map(item => {
      if (typeof item === 'string') {
        return {
          range: item,
          reason: 'حظر نطاق الشبكة',
          date: 'غير محدد'
        };
      }
      return item;
    });
  }, [siteSettings?.blockedXBands]);

  // Handle Add IP
  const handleAddIp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIp.trim()) return;
    const ip = newIp.trim();
    if (bannedIps.includes(ip)) {
      showToast('عنوان IP محظور بالفعل');
      return;
    }
    banIp(ip, newIpUsername.trim() || undefined, newIpReason.trim() || undefined);
    setNewIp('');
    setNewIpUsername('');
    setNewIpReason('');
    showToast(`تم حظر عنوان IP بنجاح: ${ip} 🚫`);
  };

  // Handle Add Device
  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevice.trim()) return;
    const devId = newDevice.trim();
    if (blockedDevices.some(d => d.id === devId || d.token === devId)) {
      showToast('معرف الجهاز محظور بالفعل');
      return;
    }
    banDevice(
      devId,
      newDeviceUsername.trim() || undefined,
      newDeviceReason.trim() || undefined,
      newDeviceName.trim() || undefined
    );
    setNewDevice('');
    setNewDeviceName('');
    setNewDeviceUsername('');
    setNewDeviceReason('');
    showToast(`تم حظر الجهاز بنجاح 📱`);
  };

  // Handle Add Browser
  const handleAddBrowser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrowserFp.trim()) return;
    const fp = newBrowserFp.trim();
    if (blockedBrowsers.some(b => b.id === fp || b.fingerprint === fp)) {
      showToast('بصمة المتصفح محظورة بالفعل');
      return;
    }
    banBrowser(
      fp,
      newBrowserUsername.trim() || undefined,
      newBrowserReason.trim() || undefined,
      newBrowserName.trim() || undefined
    );
    setNewBrowserFp('');
    setNewBrowserName('');
    setNewBrowserUsername('');
    setNewBrowserReason('');
    showToast(`تم حظر بصمة المتصفح بنجاح 🌐`);
  };

  // Handle Add Country
  const handleAddCountry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCountryCode.trim()) return;
    const code = newCountryCode.trim().toUpperCase();
    if (blockedCountries.some(c => c.code.toUpperCase() === code)) {
      showToast('هذه الدولة محجوبة بالفعل');
      return;
    }
    banCountry(
      code,
      newCountryName.trim() || undefined,
      newCountryReason.trim() || undefined
    );
    setNewCountryCode('');
    setNewCountryName('');
    setNewCountryReason('');
    showToast(`تم حجب الدولة بنجاح 🌍`);
  };

  // Handle Add XBand
  const handleAddXBand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newXBandRange.trim()) return;
    const range = newXBandRange.trim();
    if (blockedXBands.some(x => x.range === range)) {
      showToast('نطاق الشبكة محظور بالفعل');
      return;
    }
    const newItem: BlockedXBandItem = {
      range,
      reason: newXBandReason.trim() || 'حظر نطاق شبكة من لوحة التحكم',
      date: new Date().toLocaleDateString('ar-EG')
    };
    updateSiteSettings({
      blockedXBands: [...blockedXBands, newItem]
    });
    setNewXBandRange('');
    setNewXBandReason('');
    showToast(`تم حظر نطاق الشبكة بنجاح: ${range} 📡`);
  };

  const handleRemoveXBand = (range: string) => {
    updateSiteSettings({
      blockedXBands: blockedXBands.filter(x => x.range !== range)
    });
    showToast(`تم فك حظر النطاق: ${range} 🔓`);
  };

  // Pre-filtered by search query
  const filteredIps = useMemo(() => {
    if (!searchQuery.trim()) return bannedIps;
    return bannedIps.filter(ip => ip.includes(searchQuery));
  }, [bannedIps, searchQuery]);

  const filteredDevices = useMemo(() => {
    if (!searchQuery.trim()) return blockedDevices;
    const q = searchQuery.toLowerCase();
    return blockedDevices.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.username?.toLowerCase().includes(q) ||
      d.id?.toLowerCase().includes(q) ||
      d.reason?.toLowerCase().includes(q)
    );
  }, [blockedDevices, searchQuery]);

  const filteredBrowsers = useMemo(() => {
    if (!searchQuery.trim()) return blockedBrowsers;
    const q = searchQuery.toLowerCase();
    return blockedBrowsers.filter(b =>
      b.name?.toLowerCase().includes(q) ||
      b.username?.toLowerCase().includes(q) ||
      b.fingerprint?.toLowerCase().includes(q) ||
      b.reason?.toLowerCase().includes(q)
    );
  }, [blockedBrowsers, searchQuery]);

  const filteredCountries = useMemo(() => {
    if (!searchQuery.trim()) return blockedCountries;
    const q = searchQuery.toLowerCase();
    return blockedCountries.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.code?.toLowerCase().includes(q) ||
      c.reason?.toLowerCase().includes(q)
    );
  }, [blockedCountries, searchQuery]);

  const totalBansCount = bannedIps.length + blockedDevices.length + blockedBrowsers.length + blockedCountries.length + blockedXBands.length;

  return (
    <div className="max-w-5xl mx-auto space-y-4" dir="rtl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 shadow-2xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span>إدارة الحظر الشامل وفك الحظر</span>
                <span className="text-[11px] font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                  {totalBansCount} محظور
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                قائمة حظر بصمة المتصفح، عنوان الآي بي، حجب الدولة، وحظر الجهاز مع أزرار فك الحظر بجانب كل اسم
              </p>
            </div>
          </div>

          {/* Global Search */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="بحث بالاسم أو المعرف أو السبب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>عرض الكل ({totalBansCount})</span>
          </button>

          <button
            onClick={() => setActiveTab('ip')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'ip'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Ban className="w-3.5 h-3.5" />
            <span>حظر الآي بي IP ({bannedIps.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('devices')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'devices'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>حظر الأجهزة ({blockedDevices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('browsers')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'browsers'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>حظر بصمة المتصفح ({blockedBrowsers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('countries')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'countries'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>حجب الدول ({blockedCountries.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('xbands')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'xbands'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>حزم X-Band ({blockedXBands.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('room_moderation')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'room_moderation'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <UserX className="w-3.5 h-3.5" />
            <span>طرد وكتم الغرف</span>
          </button>
        </div>
      </div>

      {/* VIEW: ALL BANS COMBINED (The exact user request) */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Section 1: IP Bans */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-black text-slate-800">قائمة حظر الآي بي (IP Ban)</h4>
                <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                  {filteredIps.length}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('ip')}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة حظر آي بي جديد</span>
              </button>
            </div>

            {filteredIps.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {filteredIps.map(ip => {
                  const targetUser = users.find(u => u.ip === ip);
                  return (
                    <div key={ip} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white hover:bg-slate-50/70 transition-colors gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                          <Ban className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-slate-900">
                              {targetUser?.username || 'مستخدم على الآي بي'}
                            </span>
                            <span className="font-mono text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                              {ip}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 mt-0.5 block">
                            حظر كامل من الدخول والاتصال بالدردشة
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => unbanIp(ip)}
                        className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>فك الحظر 🔓</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs font-bold">
                لا توجد عناوين IP محظورة حالياً ✅
              </div>
            )}
          </div>

          {/* Section 2: Device Bans */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-black text-slate-800">قائمة حظر الأجهزة (Device Fingerprint)</h4>
                <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                  {filteredDevices.length}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('devices')}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة حظر جهاز جديد</span>
              </button>
            </div>

            {filteredDevices.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {filteredDevices.map(dev => (
                  <div key={dev.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white hover:bg-slate-50/70 transition-colors gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">
                            {dev.username || 'اسم غير محدد'}
                          </span>
                          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {dev.name || dev.id}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {dev.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          {dev.reason && <span>السبب: {dev.reason}</span>}
                          {dev.date && <span>• التاريخ: {dev.date}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => unbanDevice(dev.id)}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>فك الحظر 🔓</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs font-bold">
                لا توجد أجهزة محظورة حالياً ✅
              </div>
            )}
          </div>

          {/* Section 3: Browser Fingerprint Bans */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-black text-slate-800">قائمة حظر بصمة المتصفح (Browser Fingerprint)</h4>
                <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                  {filteredBrowsers.length}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('browsers')}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة حظر بصمة متصفح</span>
              </button>
            </div>

            {filteredBrowsers.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {filteredBrowsers.map(browser => (
                  <div key={browser.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white hover:bg-slate-50/70 transition-colors gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <Monitor className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">
                            {browser.username || 'اسم غير محدد'}
                          </span>
                          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {browser.name || browser.fingerprint}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {browser.fingerprint || browser.id}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          {browser.reason && <span>السبب: {browser.reason}</span>}
                          {browser.date && <span>• التاريخ: {browser.date}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => unbanBrowser(browser.id)}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>فك الحظر 🔓</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs font-bold">
                لا توجد بصمات متصفحات محظورة حالياً ✅
              </div>
            )}
          </div>

          {/* Section 4: Country Bans */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-rose-600" />
                <h4 className="text-xs font-black text-slate-800">قائمة حجب الدولة من دخول الموقع (Country Block)</h4>
                <span className="text-[10px] bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded-full font-bold">
                  {filteredCountries.length}
                </span>
              </div>
              <button
                onClick={() => setActiveTab('countries')}
                className="text-[11px] font-bold text-rose-600 hover:text-rose-700 cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إضافة حجب دولة جديد</span>
              </button>
            </div>

            {filteredCountries.length > 0 ? (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {filteredCountries.map(country => (
                  <div key={country.code} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-white hover:bg-slate-50/70 transition-colors gap-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                        <Globe2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black text-slate-900">
                            {country.name}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {country.code}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                          {country.reason && <span>السبب: {country.reason}</span>}
                          {country.date && <span>• التاريخ: {country.date}</span>}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => unbanCountry(country.code)}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shrink-0 self-end sm:self-center"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>فك الحظر 🔓</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-slate-400 text-xs font-bold">
                لا توجد دول محجوبة حالياً ✅
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 1: IP BANS */}
      {activeTab === 'ip' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <form onSubmit={handleAddIp} className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-rose-600" />
              <span>إضافة حظر آي بي جديد (IP Ban)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">عنوان الـ IP المطلوب حظره *</label>
                <input
                  type="text"
                  placeholder="مثال: 192.168.1.100"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">اسم العضو / الزائر المرتبط</label>
                <input
                  type="text"
                  placeholder="مثال: أحمد_المشاغب"
                  value={newIpUsername}
                  onChange={(e) => setNewIpUsername(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">سبب الحظر</label>
                <input
                  type="text"
                  placeholder="مثال: نشر روابط أو إعلانات مجهولة"
                  value={newIpReason}
                  onChange={(e) => setNewIpReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Ban className="w-4 h-4" />
                <span>تأكيد حظر الـ IP</span>
              </button>
            </div>
          </form>

          {filteredIps.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {filteredIps.map(ip => {
                const targetUser = users.find(u => u.ip === ip);
                return (
                  <div key={ip} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                        <Ban className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-slate-900">
                            {targetUser?.username || 'مستخدم الآي بي'}
                          </span>
                          <span className="font-mono text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                            {ip}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 mt-0.5 block">
                          حظر كامل من الاتصال والتسجيل والدخول للغرف
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => unbanIp(ip)}
                      className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>فك الحظر 🔓</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">
              لا توجد عناوين IP محظورة حالياً ✅
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DEVICE BANS */}
      {activeTab === 'devices' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <form onSubmit={handleAddDevice} className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-rose-600" />
              <span>إضافة حظر جهاز جديد (Device Ban)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">معرف الجهاز (ID) *</label>
                <input
                  type="text"
                  placeholder="مثال: dev_iphone_14pro_x"
                  value={newDevice}
                  onChange={(e) => setNewDevice(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">اسم أو نوع الجهاز</label>
                <input
                  type="text"
                  placeholder="مثال: iPhone 14 Pro Max"
                  value={newDeviceName}
                  onChange={(e) => setNewDeviceName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">اسم صاحب الجهاز</label>
                <input
                  type="text"
                  placeholder="مثال: عمر_المشاغب"
                  value={newDeviceUsername}
                  onChange={(e) => setNewDeviceUsername(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">سبب الحظر</label>
                <input
                  type="text"
                  placeholder="مثال: تكرار السبام والمخالفة"
                  value={newDeviceReason}
                  onChange={(e) => setNewDeviceReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Smartphone className="w-4 h-4" />
                <span>تأكيد حظر الجهاز</span>
              </button>
            </div>
          </form>

          {filteredDevices.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {filteredDevices.map(dev => (
                <div key={dev.id} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900">
                          {dev.username || 'اسم غير محدد'}
                        </span>
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          {dev.name || dev.id}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {dev.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        {dev.reason && <span>السبب: {dev.reason}</span>}
                        {dev.date && <span>• التاريخ: {dev.date}</span>}
                        {dev.actionBy && <span>• بواسطة: {dev.actionBy}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => unbanDevice(dev.id)}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>فك الحظر 🔓</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">
              لا توجد أجهزة محظورة حالياً ✅
            </div>
          )}
        </div>
      )}

      {/* TAB 3: BROWSER BANS */}
      {activeTab === 'browsers' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <form onSubmit={handleAddBrowser} className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-rose-600" />
              <span>إضافة حظر بصمة متصفح جديدة (Browser Fingerprint Ban)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">بصمة المتصفح (Fingerprint / UA) *</label>
                <input
                  type="text"
                  placeholder="مثال: fp_brw_8a92d4f107"
                  value={newBrowserFp}
                  onChange={(e) => setNewBrowserFp(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">اسم المتصفح / النظام</label>
                <input
                  type="text"
                  placeholder="مثال: Chrome 120 (Windows)"
                  value={newBrowserName}
                  onChange={(e) => setNewBrowserName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">اسم المستخدم</label>
                <input
                  type="text"
                  placeholder="مثال: زائر_مخالف_99"
                  value={newBrowserUsername}
                  onChange={(e) => setNewBrowserUsername(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">سبب الحظر</label>
                <input
                  type="text"
                  placeholder="مثال: برامج آلية وزوار وهميين"
                  value={newBrowserReason}
                  onChange={(e) => setNewBrowserReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Monitor className="w-4 h-4" />
                <span>تأكيد حظر بصمة المتصفح</span>
              </button>
            </div>
          </form>

          {filteredBrowsers.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {filteredBrowsers.map(b => (
                <div key={b.id} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                      <Monitor className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-slate-900">
                          {b.username || 'اسم غير محدد'}
                        </span>
                        <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {b.name || b.fingerprint}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {b.fingerprint || b.id}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        {b.reason && <span>السبب: {b.reason}</span>}
                        {b.date && <span>• التاريخ: {b.date}</span>}
                        {b.actionBy && <span>• بواسطة: {b.actionBy}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => unbanBrowser(b.id)}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>فك الحظر 🔓</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">
              لا توجد بصمات متصفحات محظورة حالياً ✅
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COUNTRY BANS */}
      {activeTab === 'countries' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <form onSubmit={handleAddCountry} className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-rose-600" />
              <span>إضافة حجب دولة جديد من دخول الموقع (Country Block)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">رمز الدولة (كود ISO حرفين) *</label>
                <input
                  type="text"
                  placeholder="مثال: IL, US, FR"
                  value={newCountryCode}
                  onChange={(e) => setNewCountryCode(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-rose-500"
                  maxLength={4}
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">اسم الدولة بالعربية</label>
                <input
                  type="text"
                  placeholder="مثال: إسرائيل، أو غيرها"
                  value={newCountryName}
                  onChange={(e) => setNewCountryName(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">سبب الحجب</label>
                <input
                  type="text"
                  placeholder="مثال: حظر دخول كامل من هذه الدولة"
                  value={newCountryReason}
                  onChange={(e) => setNewCountryReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Globe2 className="w-4 h-4" />
                <span>تأكيد حجب الدولة</span>
              </button>
            </div>
          </form>

          {filteredCountries.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {filteredCountries.map(c => (
                <div key={c.code} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                      <Globe2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{c.name}</span>
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {c.code}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        {c.reason && <span>السبب: {c.reason}</span>}
                        {c.date && <span>• التاريخ: {c.date}</span>}
                        {c.actionBy && <span>• بواسطة: {c.actionBy}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => unbanCountry(c.code)}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>فك الحظر 🔓</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">
              لا توجد دول محجوبة حالياً ✅
            </div>
          )}
        </div>
      )}

      {/* TAB 5: X-BANDS */}
      {activeTab === 'xbands' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <form onSubmit={handleAddXBand} className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200">
            <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-rose-600" />
              <span>إضافة حظر نطاق شبكة جديد (X-Band Subnet Ban)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">نطاق الشبكة (CIDR أو Wildcard) *</label>
                <input
                  type="text"
                  placeholder="مثال: 197.245.0.0/16 أو 10.0.0.*"
                  value={newXBandRange}
                  onChange={(e) => setNewXBandRange(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                  required
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-slate-600 mb-1 block">سبب الحظر</label>
                <input
                  type="text"
                  placeholder="مثال: مزود خدمة هجمات متكررة"
                  value={newXBandReason}
                  onChange={(e) => setNewXBandReason(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Radio className="w-4 h-4" />
                <span>تأكيد حظر نطاق الشبكة</span>
              </button>
            </div>
          </form>

          {blockedXBands.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {blockedXBands.map(x => (
                <div key={x.range} className="flex items-center justify-between p-3.5 bg-white hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-mono text-xs font-black text-slate-900">{x.range}</span>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                        {x.reason && <span>السبب: {x.reason}</span>}
                        {x.date && <span>• التاريخ: {x.date}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveXBand(x.range)}
                    className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>فك الحظر 🔓</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-xs font-bold">
              لا توجد حزم أو نطاقات شبكة محظورة حالياً ✅
            </div>
          )}
        </div>
      )}

      {/* TAB 6: ROOM MODERATION (Kicked & Muted Users per Room) */}
      {activeTab === 'room_moderation' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-2xs">
          <h4 className="text-xs font-black text-slate-800 border-b border-slate-100 pb-2">
            قائمة الأعضاء المطرودين والمكتومين مباشرة داخل كل غرفة
          </h4>

          <div className="space-y-3">
            {rooms.map(room => {
              const kicked = room.kickedUsers || [];
              const muted = room.mutedUsers || [];

              if (kicked.length === 0 && muted.length === 0) return null;

              return (
                <div key={room.id} className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">غرفة: {room.name}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                      {kicked.length} مطرود • {muted.length} مكتوم
                    </span>
                  </div>

                  {kicked.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                        <UserX className="w-3.5 h-3.5" />
                        <span>المطرودين من هذه الغرفة:</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {kicked.map(uid => {
                          const targetUser = users.find(u => u.id === uid);
                          return (
                            <div key={uid} className="bg-rose-100 text-rose-800 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-2 border border-rose-200">
                              <span>{targetUser?.username || uid}</span>
                              <button
                                onClick={() => {
                                  unkickUserFromRoom(room.id, uid);
                                  showToast(`تم فك طرد ${targetUser?.username || uid}`);
                                }}
                                className="text-rose-600 hover:text-rose-900 cursor-pointer text-xs font-black"
                                title="فك الطرد"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {muted.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                        <VolumeX className="w-3.5 h-3.5" />
                        <span>المكتومين في هذه الغرفة:</span>
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {muted.map(uid => {
                          const targetUser = users.find(u => u.id === uid);
                          return (
                            <div key={uid} className="bg-amber-100 text-amber-800 text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-2 border border-amber-200">
                              <span>{targetUser?.username || uid}</span>
                              <button
                                onClick={() => {
                                  unmuteUserInRoom(room.id, uid);
                                  showToast(`تم فك كتم ${targetUser?.username || uid}`);
                                }}
                                className="text-amber-600 hover:text-amber-900 cursor-pointer text-xs font-black"
                                title="فك الكتم"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {rooms.every(r => (!r.kickedUsers || r.kickedUsers.length === 0) && (!r.mutedUsers || r.mutedUsers.length === 0)) && (
              <div className="py-8 text-center text-slate-400 text-xs font-bold">
                لا يوجد أي مستخدم مطرود أو مكتوم في أي غرفة حالياً ✅
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
