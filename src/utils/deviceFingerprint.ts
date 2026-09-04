// Persistent Device Fingerprint utility to prevent ban evasion via cache clearing, IP change, or proxy
export async function getDeviceFingerprint(): Promise<string> {
  const STORAGE_KEY = 'araby_persistent_device_uuid';
  
  try {
    // 1. Try localStorage
    let deviceId = localStorage.getItem(STORAGE_KEY);
    if (deviceId) return deviceId;

    // 2. Try Cookie
    const match = document.cookie.match(new RegExp('(^| )' + STORAGE_KEY + '=([^;]+)'));
    if (match) {
      deviceId = match[2];
      try {
        localStorage.setItem(STORAGE_KEY, deviceId);
      } catch (e) {}
      return deviceId;
    }

    // 3. Generate robust fingerprint based on canvas, screen, hardware, timezone
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let canvasHash = '';
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('ArabyChat Fingerprint 2026', 2, 2);
      canvasHash = canvas.toDataURL();
    }

    const nav = navigator as any;
    const dataString = [
      nav.userAgent,
      nav.language,
      screen.width,
      screen.height,
      screen.colorDepth,
      new Date().getTimezoneOffset(),
      nav.hardwareConcurrency || 4,
      nav.deviceMemory || 8,
      canvasHash.slice(-50)
    ].join('|||');

    let hash = 0;
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    deviceId = `dev_${Math.abs(hash)}_${Math.random().toString(36).substring(2, 9)}`;

    // Store persistently in localStorage & Cookie (10 years max-age)
    try {
      localStorage.setItem(STORAGE_KEY, deviceId);
      document.cookie = `${STORAGE_KEY}=${deviceId}; path=/; max-age=315360000; SameSite=Lax`;
    } catch (e) {}

    return deviceId;
  } catch (e) {
    return `dev_fallback_${Math.random().toString(36).substring(2, 11)}`;
  }
}
