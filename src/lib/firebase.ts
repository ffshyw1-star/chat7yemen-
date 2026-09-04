import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, Message, PrivateMessage, Room } from '../types';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

const customDbId = (firebaseConfig as any).firestoreDatabaseId;
export const auth = getAuth(app);
export const db = customDbId && customDbId !== '(default)'
  ? getFirestore(app, customDbId)
  : getFirestore(app);

export const googleAuthProvider = new GoogleAuthProvider();
// Essential scopes only
googleAuthProvider.addScope('openid');
googleAuthProvider.addScope('email');
googleAuthProvider.addScope('profile');

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Error Info: ', JSON.stringify(errInfo));
  return errInfo;
}

export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    return false;
  }
}
testFirestoreConnection();

let cachedIdToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: FirebaseUser, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      if (cachedIdToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedIdToken);
      } else if (!isSigningIn) {
        try {
          const idToken = await user.getIdToken();
          cachedIdToken = idToken;
          if (onAuthSuccess) onAuthSuccess(user, idToken);
        } catch {
          if (onAuthFailure) onAuthFailure();
        }
      }
    } else {
      cachedIdToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: FirebaseUser; idToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleAuthProvider);
    const idToken = await result.user.getIdToken();
    cachedIdToken = idToken;
    return { user: result.user, idToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/popup-blocked'
    ) {
      console.warn('Google Sign In cancelled or popup closed by user.');
      return null;
    }
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCachedIdToken = (): string | null => cachedIdToken;
export const getCachedAccessToken = (): string | null => cachedIdToken;

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedIdToken = null;
};

// 1. Sync User Profile (Separating public client-safe profile fields)
export const saveUserToFirestore = async (user: User): Promise<void> => {
  if (!user || !user.id) return;
  const path = `users/${user.id}`;
  try {
    const userDocRef = doc(db, 'users', user.id);
    const publicProfile = {
      id: user.id,
      username: user.username || '',
      gender: user.gender || 'male',
      age: user.age || 20,
      country: user.country || 'اليمن',
      countryFlag: user.countryFlag || '🇾🇪',
      avatar: user.avatar || '',
      bio: user.bio || '',
      statusMessage: user.statusMessage || '',
      onlineStatus: user.onlineStatus || 'online',
      joinedDate: user.joinedDate || '',
      updatedAt: serverTimestamp()
    };
    await setDoc(userDocRef, publicProfile, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// 1b. Delete User Profile from Firestore
export const deleteUserFromFirestore = async (userId: string): Promise<void> => {
  if (!userId) return;
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// 2. Sync Chat Message with serverTimestamp
export const saveMessageToFirestore = async (msg: Message): Promise<void> => {
  if (!msg || !msg.id) return;
  const path = `messages/${msg.id}`;
  try {
    const msgDocRef = doc(db, 'messages', msg.id);
    const cleanMsg = {
      id: msg.id,
      roomId: msg.roomId || 'room-general',
      senderId: msg.senderId || '',
      senderName: msg.senderName || '',
      senderAvatar: msg.senderAvatar || '',
      senderRole: msg.senderRole || 'user',
      text: msg.text || '',
      type: msg.type || 'text',
      mediaUrl: msg.mediaUrl || '',
      voiceDuration: msg.voiceDuration || 0,
      timestamp: msg.timestamp || '',
      createdAt: serverTimestamp()
    };
    await setDoc(msgDocRef, cleanMsg);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// 2b. Delete Chat Message from Firestore
export const deleteMessageFromFirestore = async (messageId: string): Promise<void> => {
  if (!messageId) return;
  const path = `messages/${messageId}`;
  try {
    const msgDocRef = doc(db, 'messages', messageId);
    await deleteDoc(msgDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

// 3. Sync Private Message with serverTimestamp
export const savePrivateMessageToFirestore = async (pMsg: PrivateMessage): Promise<void> => {
  if (!pMsg || !pMsg.id) return;
  const path = `private_messages/${pMsg.id}`;
  try {
    const pMsgDocRef = doc(db, 'private_messages', pMsg.id);
    const cleanPMsg = {
      id: pMsg.id,
      senderId: pMsg.senderId || '',
      receiverId: pMsg.receiverId || '',
      text: pMsg.text || '',
      timestamp: pMsg.timestamp || '',
      mediaUrl: pMsg.mediaUrl || '',
      isRead: !!pMsg.isRead,
      createdAt: serverTimestamp()
    };
    await setDoc(pMsgDocRef, cleanPMsg);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// 4. Sync Room
export const saveRoomToFirestore = async (room: Room): Promise<void> => {
  if (!room || !room.id) return;
  const path = `rooms/${room.id}`;
  try {
    const roomDocRef = doc(db, 'rooms', room.id);
    await setDoc(roomDocRef, {
      id: room.id,
      name: room.name,
      description: room.description || '',
      isLocked: !!room.isLocked,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// 5. Sync Site Settings
export const saveSettingsToFirestore = async (settings: any): Promise<void> => {
  if (!settings) return;
  const path = 'settings/global';
  try {
    const settingsDocRef = doc(db, 'settings', 'global');
    await setDoc(settingsDocRef, {
      ...settings,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};
