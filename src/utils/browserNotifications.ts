// Browser Native HTML5 Notification & Tab Title Flashing Manager

export function isBrowserNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | 'unsupported' {
  if (!isBrowserNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!isBrowserNotificationSupported()) return false;
  try {
    if (Notification.permission === 'granted') return true;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (err) {
    console.warn('Failed to request notification permission:', err);
    return false;
  }
}

export interface ShowNotificationOptions {
  body: string;
  icon?: string;
  tag?: string;
  badge?: string;
  data?: any;
  onClick?: () => void;
  autoCloseTimeoutMs?: number;
}

export function showBrowserNotification(
  title: string,
  options: ShowNotificationOptions
): Notification | null {
  if (!isBrowserNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notifOptions: NotificationOptions = {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag || `chat-notif-${Date.now()}`,
      badge: options.badge || options.icon,
      silent: false,
      data: options.data,
    };

    const notif = new Notification(title, notifOptions);

    notif.onclick = (e) => {
      try {
        window.focus();
      } catch {}
      if (options.onClick) {
        options.onClick();
      }
      notif.close();
    };

    const timeout = options.autoCloseTimeoutMs || 8000;
    setTimeout(() => {
      try {
        notif.close();
      } catch {}
    }, timeout);

    return notif;
  } catch (err) {
    console.warn('Native notification display failed:', err);
    return null;
  }
}

// Background Tab Title Flashing Manager
class TabTitleManager {
  private baseTitle: string = typeof document !== 'undefined' ? document.title || 'شات اليمن المطور' : 'شات اليمن المطور';
  private intervalId: NodeJS.Timeout | null = null;
  private currentAlertText: string | null = null;
  private isShowingAlert: boolean = false;
  private unreadCount: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.clearAlert();
      });
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.clearAlert();
        }
      });
    }
  }

  public setBaseTitle(title: string) {
    this.baseTitle = title;
    if (!this.intervalId) {
      document.title = title;
    }
  }

  public triggerAlert(alertText: string, totalUnread: number = 1) {
    this.unreadCount = totalUnread;
    this.currentAlertText = `(${totalUnread}) ${alertText}`;

    // Only start flashing if document is currently hidden or window is not focused
    if (typeof document !== 'undefined' && (document.hidden || !document.hasFocus())) {
      this.startFlashing();
    }
  }

  private startFlashing() {
    if (this.intervalId) return;

    this.isShowingAlert = true;
    if (this.currentAlertText) {
      document.title = this.currentAlertText;
    }

    this.intervalId = setInterval(() => {
      if (typeof document === 'undefined') return;
      if (!document.hidden && document.hasFocus()) {
        this.clearAlert();
        return;
      }

      this.isShowingAlert = !this.isShowingAlert;
      if (this.isShowingAlert && this.currentAlertText) {
        document.title = this.currentAlertText;
      } else {
        document.title = this.unreadCount > 0 ? `(${this.unreadCount}) ${this.baseTitle}` : this.baseTitle;
      }
    }, 1200);
  }

  public clearAlert() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.currentAlertText = null;
    this.unreadCount = 0;
    if (typeof document !== 'undefined') {
      document.title = this.baseTitle;
    }
  }
}

export const tabTitleManager = new TabTitleManager();
