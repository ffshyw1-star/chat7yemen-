import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc,
  serverTimestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { User, Message, PrivateMessage, Room, MembershipHistoryItem } from '../types';

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
    await getDoc(doc(db, 'settings', 'global'));
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Strict Administrative Permission Validator based on the User's `membership` object.
 * Validates that:
 * 1. User is sovereign owner / super_admin OR
 * 2. User has an active membership (`membership.status === 'active'` OR `membership.permanent === true`)
 * 3. Not expired (`Date.now() < expiresAt` unless `permanent === true`)
 * 4. The membership rank satisfies the required minimum authority level.
 */
export function validateAdminMembership(
  user: User | null | undefined,
  requiredRole: 'moderator' | 'management' | 'admin' | 'owner'
): boolean {
  if (!user) return false;

  // Sovereign owner bypass
  if (user.role === 'owner' || user.id === 'user-owner' || (user as any).is_super_admin) {
    return true;
  }

  // Must have a valid membership object - simple unverified rank field is rejected
  if (!user.membership) {
    console.warn(`[validateAdminMembership] Action blocked for user '${user.username}': No membership object found. Administrative actions require an active membership.`);
    return false;
  }

  const { status, permanent, expiresAt, rank } = user.membership;
  const isStatusActive = status === 'active';
  const isPermanent = Boolean(permanent);

  if (!isPermanent && !isStatusActive) {
    console.warn(`[validateAdminMembership] Action blocked for user '${user.username}': Membership status is '${status}' and not permanent.`);
    return false;
  }

  // Check expiration if not permanent
  if (!isPermanent && expiresAt && Date.now() >= expiresAt) {
    console.warn(`[validateAdminMembership] Action blocked for user '${user.username}': Membership expired at ${new Date(expiresAt).toISOString()}.`);
    return false;
  }

  // Role hierarchy score
  const roleScores: Record<string, number> = {
    visitor: 0,
    member: 0,
    vip: 1,
    moderator: 2,
    management: 3,
    admin: 4,
    owner: 5
  };

  const userRoleScore = roleScores[rank || user.role] || 0;
  const requiredScore = roleScores[requiredRole] || 99;

  return userRoleScore >= requiredScore;
}

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

import { logSyncDiagnostic } from './syncDiagnostics';

/**
 * Recursively removes undefined fields from an object so Firestore setDoc does not throw errors.
 */
export function cleanUndefinedFields<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(cleanUndefinedFields).filter(v => v !== undefined) as unknown as T;
  }
  const result: any = {};
  for (const [key, value] of Object.entries(obj as any)) {
    if (value !== undefined) {
      result[key] = cleanUndefinedFields(value);
    }
  }
  return result;
}

// 1. Sync User Profile (Separating public client-safe profile fields)
export const saveUserToFirestore = async (user: User): Promise<boolean> => {
  if (!user || !user.id) return false;
  const path = `users/${user.id}`;
  try {
    const userDocRef = doc(db, 'users', user.id);
    const isPrimary = Boolean(user.isPrimaryOwner || user.id === 'user-owner' || user.email === 'alzymasd9@gmail.com');
    const publicProfile = cleanUndefinedFields({
      id: user.id,
      username: user.username || '',
      email: user.email || null,
      role: isPrimary ? 'owner' : (user.role || 'member'),
      isPrimaryOwner: isPrimary,
      is_primary_owner: isPrimary,
      gender: user.gender || 'male',
      age: user.age || 20,
      country: user.country || 'اليمن',
      countryFlag: user.countryFlag || '🇾🇪',
      avatar: user.avatar || '',
      wallCover: user.wallCover || '',
      bio: user.bio || '',
      statusMessage: user.statusMessage || '',
      specialty: user.specialty || '',
      specialtyCategory: user.specialtyCategory || '',
      language: user.language || 'Arabic',
      hideCountry: !!user.hideCountry,
      usernameColor: user.usernameColor || null,
      usernameBgGradient: user.usernameBgGradient || null,
      usernameFontSize: user.usernameFontSize || null,
      chatTextColor: user.chatTextColor || null,
      chatTextBgGradient: user.chatTextBgGradient || null,
      chatFontFamily: user.chatFontFamily || null,
      chatFontStyle: user.chatFontStyle || null,
      chatTextWeight: user.chatTextWeight || null,
      chatIsNeon: !!user.chatIsNeon,
      membership: user.membership || null,
      membershipHistory: user.membershipHistory || null,
      onlineStatus: user.onlineStatus || 'online',
      joinedDate: user.joinedDate || '',
      updatedAt: serverTimestamp()
    });
    await setDoc(userDocRef, publicProfile, { merge: true });
    logSyncDiagnostic({
      source: 'firestore_user_write',
      documentPath: path,
      fieldName: 'profile',
      newValue: user.username,
      writeResult: 'SUCCESS'
    });
    return true;
  } catch (error) {
    logSyncDiagnostic({
      source: 'firestore_user_write',
      documentPath: path,
      fieldName: 'profile',
      writeResult: `ERROR: ${(error as any)?.message || String(error)}`,
      error: String(error)
    });
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

// 1b. Delete User Profile from Firestore
export const deleteUserFromFirestore = async (userId: string, requester?: User | null): Promise<boolean> => {
  if (!userId) return false;
  if (requester && !validateAdminMembership(requester, 'owner')) {
    const err = new Error('صلاحية مرفوضة: يتطلب حذف الحسابات رتبة مالك وعضوية نشطة صالحة.');
    console.warn(err.message);
    throw err;
  }
  const path = `users/${userId}`;
  try {
    const userDocRef = doc(db, 'users', userId);
    await deleteDoc(userDocRef);
    logSyncDiagnostic({
      source: 'firestore_user_delete',
      documentPath: path,
      writeResult: 'SUCCESS'
    });
    return true;
  } catch (error) {
    logSyncDiagnostic({
      source: 'firestore_user_delete',
      documentPath: path,
      writeResult: `ERROR: ${(error as any)?.message || String(error)}`,
      error: String(error)
    });
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
};

// 2. Sync Chat Message with serverTimestamp
export const saveMessageToFirestore = async (msg: Message): Promise<boolean> => {
  if (!msg || !msg.id) return false;
  const path = `messages/${msg.id}`;
  try {
    const msgDocRef = doc(db, 'messages', msg.id);
    const cleanMsg = cleanUndefinedFields({
      id: msg.id,
      roomId: msg.roomId || 'room-general',
      senderId: msg.senderId || '',
      senderName: msg.senderName || '',
      senderAvatar: msg.senderAvatar || '',
      senderRole: msg.senderRole || 'user',
      senderGender: msg.senderGender,
      senderUsernameColor: msg.senderUsernameColor,
      senderUsernameFontSize: msg.senderUsernameFontSize,
      text: msg.text || '',
      textColor: msg.textColor,
      textFontSize: msg.textFontSize,
      textWeight: msg.textWeight,
      fontFamily: msg.fontFamily,
      textStyle: msg.textStyle,
      textBgGradient: msg.textBgGradient,
      isNeon: !!msg.isNeon,
      type: msg.type || 'text',
      mediaUrl: msg.mediaUrl || '',
      voiceDuration: msg.voiceDuration || 0,
      timestamp: msg.timestamp || '',
      date: msg.date || '',
      createdAt: serverTimestamp()
    });
    await setDoc(msgDocRef, cleanMsg);
    logSyncDiagnostic({
      source: 'firestore_message_write',
      documentPath: path,
      fieldName: 'text',
      newValue: msg.text?.substring(0, 40),
      writeResult: 'SUCCESS'
    });
    return true;
  } catch (error) {
    logSyncDiagnostic({
      source: 'firestore_message_write',
      documentPath: path,
      fieldName: 'text',
      writeResult: `ERROR: ${(error as any)?.message || String(error)}`,
      error: String(error)
    });
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

// 2b. Delete Chat Message from Firestore
export const deleteMessageFromFirestore = async (messageId: string): Promise<boolean> => {
  if (!messageId) return false;
  const path = `messages/${messageId}`;
  try {
    const msgDocRef = doc(db, 'messages', messageId);
    await deleteDoc(msgDocRef);
    logSyncDiagnostic({
      source: 'firestore_message_delete',
      documentPath: path,
      writeResult: 'SUCCESS'
    });
    return true;
  } catch (error) {
    logSyncDiagnostic({
      source: 'firestore_message_delete',
      documentPath: path,
      writeResult: `ERROR: ${(error as any)?.message || String(error)}`,
      error: String(error)
    });
    handleFirestoreError(error, OperationType.DELETE, path);
    return false;
  }
};

// 2c. Clear all room messages or all chat messages from Firestore
export const clearRoomFromFirestore = async (roomId: string, requester?: User | null): Promise<{ success: boolean; count: number }> => {
  if (!roomId) return { success: false, count: 0 };
  if (requester && !validateAdminMembership(requester, 'moderator')) {
    const err = new Error('صلاحية مرفوضة: يتطلب مسح رسائل الدردشة عضوية إدارية نشطة (مشرف أو أعلى).');
    console.warn(err.message);
    throw err;
  }
  try {
    const isAll = roomId === 'all';
    const q = isAll
      ? collection(db, 'messages')
      : query(collection(db, 'messages'), where('roomId', '==', roomId));
    
    const snapshot = await getDocs(q);
    const totalCount = snapshot.size;

    if (!snapshot.empty) {
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 400);
        chunk.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    }

    logSyncDiagnostic({
      source: 'firestore_clear_messages',
      documentPath: isAll ? 'messages/*' : `messages[roomId=${roomId}]`,
      fieldName: 'clearChat',
      oldValue: `${totalCount} docs`,
      newValue: '0 docs',
      writeResult: `SUCCESS: deleted ${totalCount} messages`
    });

    return { success: true, count: totalCount };
  } catch (error) {
    logSyncDiagnostic({
      source: 'firestore_clear_messages',
      documentPath: `messages[roomId=${roomId}]`,
      writeResult: `ERROR: ${(error as any)?.message || String(error)}`,
      error: String(error)
    });
    console.error('Failed to clear room messages from Firestore:', error);
    throw error;
  }
};

// 3. Sync Private Message with serverTimestamp
export const savePrivateMessageToFirestore = async (pMsg: PrivateMessage): Promise<boolean> => {
  if (!pMsg || !pMsg.id) return false;
  const path = `private_messages/${pMsg.id}`;
  try {
    const pMsgDocRef = doc(db, 'private_messages', pMsg.id);
    const cleanPMsg = cleanUndefinedFields({
      id: pMsg.id,
      senderId: pMsg.senderId || '',
      receiverId: pMsg.receiverId || '',
      text: pMsg.text || '',
      timestamp: pMsg.timestamp || '',
      mediaUrl: pMsg.mediaUrl || '',
      isRead: !!pMsg.isRead,
      createdAt: serverTimestamp()
    });
    await setDoc(pMsgDocRef, cleanPMsg);
    logSyncDiagnostic({
      source: 'firestore_private_msg_write',
      documentPath: path,
      fieldName: 'text',
      newValue: pMsg.text?.substring(0, 40),
      writeResult: 'SUCCESS'
    });
    return true;
  } catch (error) {
    logSyncDiagnostic({
      source: 'firestore_private_msg_write',
      documentPath: path,
      writeResult: `ERROR: ${(error as any)?.message || String(error)}`,
      error: String(error)
    });
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

// 3b. Clear all private messages from Firestore
export const clearAllPrivateMessagesFromFirestore = async (requester?: User | null): Promise<{ success: boolean; count: number }> => {
  if (requester && !validateAdminMembership(requester, 'admin')) {
    const err = new Error('صلاحية مرفوضة: يتطلب مسح جميع الرسائل الخاصة عضوية إدارية نشطة (أدمن أو مالك).');
    console.warn(err.message);
    throw err;
  }
  try {
    const snapshot = await getDocs(collection(db, 'private_messages'));
    const totalCount = snapshot.size;
    if (!snapshot.empty) {
      const docs = snapshot.docs;
      for (let i = 0; i < docs.length; i += 400) {
        const batch = writeBatch(db);
        const chunk = docs.slice(i, i + 400);
        chunk.forEach((docSnap) => {
          batch.delete(docSnap.ref);
        });
        await batch.commit();
      }
    }
    logSyncDiagnostic({
      source: 'firestore_clear_private_messages',
      documentPath: 'private_messages/*',
      fieldName: 'clearPrivateChat',
      oldValue: `${totalCount} docs`,
      newValue: '0 docs',
      writeResult: `SUCCESS: deleted ${totalCount} private messages`
    });
    return { success: true, count: totalCount };
  } catch (error) {
    logSyncDiagnostic({
      source: 'firestore_clear_private_messages',
      documentPath: 'private_messages/*',
      writeResult: `ERROR: ${(error as any)?.message || String(error)}`,
      error: String(error)
    });
    console.error('Failed to clear private messages from Firestore:', error);
    throw error;
  }
};

// 4. Sync Room
export const saveRoomToFirestore = async (room: Room, requester?: User | null): Promise<boolean> => {
  if (!room || !room.id) return false;
  if (requester && !validateAdminMembership(requester, 'admin')) {
    const err = new Error('صلاحية مرفوضة: يتطلب تعديل بيانات الغرفة عضوية إدارية نشطة.');
    console.warn(err.message);
    throw err;
  }
  const path = `rooms/${room.id}`;
  try {
    const roomDocRef = doc(db, 'rooms', room.id);
    await setDoc(roomDocRef, cleanUndefinedFields({
      id: room.id,
      name: room.name,
      description: room.description || '',
      isLocked: !!room.isLocked,
      updatedAt: serverTimestamp()
    }), { merge: true });
    logSyncDiagnostic({
      source: 'firestore_room_write',
      documentPath: path,
      fieldName: 'name',
      newValue: room.name,
      writeResult: 'SUCCESS'
    });
    return true;
  } catch (error) {
    logSyncDiagnostic({
      source: 'firestore_room_write',
      documentPath: path,
      writeResult: `ERROR: ${(error as any)?.message || String(error)}`,
      error: String(error)
    });
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

// 5. Sync Site Settings
export const saveSettingsToFirestore = async (
  settings: any,
  oldSettings?: any,
  requester?: User | null
): Promise<boolean> => {
  if (!settings) return false;
  if (requester && !validateAdminMembership(requester, 'management')) {
    const err = new Error('صلاحية مرفوضة: يتطلب تعديل إعدادات الموقع رتبة إدارة أو أعلى مع عضوية نشطة صالحة.');
    console.warn(err.message);
    throw err;
  }
  const path = 'settings/global';
  try {
    const settingsDocRef = doc(db, 'settings', 'global');
    const cleaned = cleanUndefinedFields({
      ...settings,
      updatedAt: serverTimestamp()
    });
    await setDoc(settingsDocRef, cleaned, { merge: true });

    if (oldSettings && typeof oldSettings === 'object') {
      Object.keys(settings).forEach((key) => {
        if (settings[key] !== oldSettings[key]) {
          logSyncDiagnostic({
            source: 'firestore_settings_write',
            documentPath: path,
            fieldName: key,
            oldValue: oldSettings[key],
            newValue: settings[key],
            writeResult: 'SUCCESS'
          });
        }
      });
    } else {
      logSyncDiagnostic({
        source: 'firestore_settings_write',
        documentPath: path,
        fieldName: 'settings_keys',
        newValue: Object.keys(settings).join(', '),
        writeResult: 'SUCCESS'
      });
    }
    return true;
  } catch (error) {
    logSyncDiagnostic({
      source: 'firestore_settings_write',
      documentPath: path,
      writeResult: `ERROR: ${(error as any)?.message || String(error)}`,
      error: String(error)
    });
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

// 6. Sub-collection: membershipHistory (Audit trail for rank & membership changes)
export const saveMembershipHistoryToFirestore = async (
  userId: string,
  item: Partial<MembershipHistoryItem> & { rank: string; assignedBy: string; startAt: number }
): Promise<boolean> => {
  if (!userId || !item) return false;
  const historyId = item.id || `mh-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const path = `users/${userId}/membershipHistory/${historyId}`;
  try {
    const historyDocRef = doc(db, 'users', userId, 'membershipHistory', historyId);
    const cleaned = cleanUndefinedFields({
      id: historyId,
      userId,
      rank: item.rank,
      assignedBy: item.assignedBy,
      assignedByUserId: item.assignedByUserId || null,
      assignedByUsername: item.assignedByUsername || null,
      startAt: item.startAt,
      expiresAt: item.expiresAt || null,
      durationDays: item.durationDays || 30,
      permanent: Boolean(item.permanent),
      status: item.status || 'active',
      notes: (item as any).notes || null,
      createdAt: serverTimestamp()
    });
    await setDoc(historyDocRef, cleaned);
    logSyncDiagnostic({
      source: 'firestore_membership_history_write',
      documentPath: path,
      fieldName: 'rank',
      newValue: item.rank,
      writeResult: 'SUCCESS'
    });
    return true;
  } catch (error) {
    logSyncDiagnostic({
      source: 'firestore_membership_history_write',
      documentPath: path,
      writeResult: `ERROR: ${(error as any)?.message || String(error)}`,
      error: String(error)
    });
    handleFirestoreError(error, OperationType.WRITE, path);
    return false;
  }
};

export const getMembershipHistoryFromFirestore = async (
  userId: string
): Promise<MembershipHistoryItem[]> => {
  if (!userId) return [];
  const path = `users/${userId}/membershipHistory`;
  try {
    const q = query(
      collection(db, 'users', userId, 'membershipHistory'),
      orderBy('startAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    const historyList: MembershipHistoryItem[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      historyList.push({
        id: docSnap.id,
        rank: data.rank,
        startAt: data.startAt || Date.now(),
        expiresAt: data.expiresAt || null,
        durationDays: data.durationDays || 30,
        assignedBy: data.assignedBy || 'system',
        assignedByUserId: data.assignedByUserId,
        assignedByUsername: data.assignedByUsername,
        permanent: Boolean(data.permanent),
        status: data.status || 'active',
        createdAt: data.createdAt ? (typeof data.createdAt.toMillis === 'function' ? data.createdAt.toMillis() : Date.now()) : Date.now(),
        notes: data.notes
      } as MembershipHistoryItem);
    });
    return historyList;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    return [];
  }
};
