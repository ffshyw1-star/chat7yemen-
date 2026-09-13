import { getApps, initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, push, onDisconnect, set, serverTimestamp as rtdbServerTimestamp } from 'firebase/database';
import firebaseConfig from '../../firebase-applet-config.json';

// Unique connection ID for this specific tab / browser window session
const SESSION_STORAGE_KEY = 'chat_presence_connection_id';

export function getOrCreateConnectionId(): string {
  try {
    let connId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!connId) {
      connId = `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem(SESSION_STORAGE_KEY, connId);
    }
    return connId;
  } catch {
    return `conn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}

let activeRtdbDisconnectRef: any = null;
let rtdbConnectedUnsub: (() => void) | null = null;

/**
 * Initializes Firebase Realtime Database Presence if RTDB is available
 * Pattern: presence/{uid}/connections/{connectionId}
 * - onDisconnect().remove()
 * - set({ state: 'online', connectedAt: serverTimestamp() })
 */
export function initFirebaseRtdbPresence(userId: string, connectionId: string) {
  if (!userId) return;

  // Clean up previous listeners if any
  if (rtdbConnectedUnsub) {
    try { rtdbConnectedUnsub(); } catch {}
    rtdbConnectedUnsub = null;
  }
  if (activeRtdbDisconnectRef) {
    try { activeRtdbDisconnectRef.cancel(); } catch {}
    activeRtdbDisconnectRef = null;
  }

  try {
    const configWithDb = {
      ...firebaseConfig,
      databaseURL: (firebaseConfig as any).databaseURL || `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`
    };
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(configWithDb);
    const rtdb = getDatabase(app);

    const connectedRef = ref(rtdb, '.info/connected');
    const myConnectionRef = ref(rtdb, `presence/${userId}/connections/${connectionId}`);
    const lastSeenRef = ref(rtdb, `presence/${userId}/lastSeen`);

    rtdbConnectedUnsub = onValue(connectedRef, async (snap) => {
      if (snap.val() === true) {
        // 1. Configure onDisconnect to remove this specific connection when disconnected
        const onDisconnectHandler = onDisconnect(myConnectionRef);
        activeRtdbDisconnectRef = onDisconnectHandler;
        await onDisconnectHandler.remove();

        // 2. Set lastSeen on disconnect
        await onDisconnect(lastSeenRef).set(rtdbServerTimestamp());

        // 3. Mark this connection as active and online
        await set(myConnectionRef, {
          state: 'online',
          connectedAt: rtdbServerTimestamp(),
          userAgent: navigator.userAgent
        });
      }
    }, (error) => {
      // Gracefully handle if RTDB is not enabled on the Firebase project
      console.warn('Firebase RTDB Presence fallback to Server WebSocket Presence:', error.message);
    });
  } catch (err: any) {
    console.warn('RTDB presence init skipped:', err?.message || err);
  }
}

/**
 * Disconnects RTDB presence for the current connection
 */
export function disconnectFirebaseRtdbPresence(userId: string, connectionId: string) {
  if (rtdbConnectedUnsub) {
    try { rtdbConnectedUnsub(); } catch {}
    rtdbConnectedUnsub = null;
  }

  try {
    const configWithDb = {
      ...firebaseConfig,
      databaseURL: (firebaseConfig as any).databaseURL || `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com`
    };
    const app = getApps().length > 0 ? getApps()[0] : initializeApp(configWithDb);
    const rtdb = getDatabase(app);
    const myConnectionRef = ref(rtdb, `presence/${userId}/connections/${connectionId}`);
    set(myConnectionRef, null).catch(() => {});
  } catch {}
}

/**
 * Notifies server via beacon when browser tab unloads
 */
export function sendDisconnectBeacon(userId: string, connectionId: string) {
  if (!userId || !connectionId) return;
  try {
    if (navigator.sendBeacon) {
      const data = JSON.stringify({ userId, connectionId });
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon('/api/presence/disconnect', blob);
    }
  } catch {}
}
