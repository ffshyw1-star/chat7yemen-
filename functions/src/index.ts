import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Firebase Realtime Database Trigger: onPresenceChanged
 * Listens to /presence/{uid}/connections and syncs state directly to Firestore users/{uid}
 * - If connections count > 0 => users/{uid}: { online: true, isOnline: true, onlineStatus: 'online' }
 * - If connections count === 0 => users/{uid}: { online: false, isOnline: false, onlineStatus: 'offline', lastSeen: serverTimestamp() }
 */
export const onPresenceChanged = functions.database
  .ref('/presence/{uid}/connections')
  .onWrite(async (change, context) => {
    const uid = context.params.uid;
    const connections = change.after.val();
    const hasActiveConnection = !!connections && typeof connections === 'object' && Object.keys(connections).length > 0;

    const userDocRef = db.collection('users').doc(uid);

    try {
      if (hasActiveConnection) {
        await userDocRef.set({
          online: true,
          isOnline: true,
          onlineStatus: 'online',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`[onPresenceChanged] User ${uid} is now ONLINE (${Object.keys(connections).length} connections)`);
      } else {
        await userDocRef.set({
          online: false,
          isOnline: false,
          onlineStatus: 'offline',
          lastSeen: admin.firestore.FieldValue.serverTimestamp(),
          lastSeenTimestamp: Date.now(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        console.log(`[onPresenceChanged] User ${uid} is now OFFLINE (0 connections)`);
      }
    } catch (err) {
      console.error(`[onPresenceChanged] Failed to update user ${uid} in Firestore:`, err);
    }
  });

/**
 * Firebase Scheduled Function: cleanupInactiveUsers
 * Runs periodically every 1 hour (cron: 0 * * * *)
 * Automatically purges stale activity logs and marks users offline who have
 * been inactive longer than the owner-defined inactivity timeout in Firestore.
 */
export const cleanupInactiveUsers = functions.pubsub
  .schedule('0 * * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('[cleanupInactiveUsers] Starting scheduled cleanup job...');

      // 1. Fetch site settings to retrieve owner-defined inactivity threshold
      const settingsDoc = await db.collection('settings').doc('site').get();
      const settings = settingsDoc.exists ? settingsDoc.data() : null;
      const timeoutMinutes = Number(settings?.userInactivityTimeoutMinutes) || 15;
      const cutoffTime = Date.now() - (timeoutMinutes * 60 * 1000);

      console.log(`[cleanupInactiveUsers] Inactivity timeout: ${timeoutMinutes} minutes. Cutoff: ${new Date(cutoffTime).toISOString()}`);

      // 2. Query users who are currently marked as online but have stale lastSeenTimestamp
      const usersRef = db.collection('users');
      const inactiveUsersSnapshot = await usersRef
        .where('isOnline', '==', true)
        .where('lastSeenTimestamp', '<', cutoffTime)
        .get();

      if (!inactiveUsersSnapshot.empty) {
        const batch = db.batch();
        let count = 0;

        inactiveUsersSnapshot.docs.forEach((doc) => {
          batch.update(doc.ref, {
            isOnline: false,
            onlineStatus: 'offline',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          count++;
        });

        await batch.commit();
        console.log(`[cleanupInactiveUsers] Successfully marked ${count} inactive users as offline.`);
      } else {
        console.log('[cleanupInactiveUsers] No inactive users found to update.');
      }

      // 3. Purge historical room activity logs older than 7 days to keep Firestore queries fast
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const staleLogsSnapshot = await db.collection('room_activity_logs')
        .where('timestamp', '<', sevenDaysAgo)
        .limit(500)
        .get();

      if (!staleLogsSnapshot.empty) {
        const logBatch = db.batch();
        staleLogsSnapshot.docs.forEach((doc) => {
          logBatch.delete(doc.ref);
        });
        await logBatch.commit();
        console.log(`[cleanupInactiveUsers] Purged ${staleLogsSnapshot.size} stale room activity logs.`);
      }

      return { success: true };
    } catch (error) {
      console.error('[cleanupInactiveUsers] Error during execution:', error);
      throw error;
    }
  });

/**
 * HTTP Callable Endpoint for Owner Dashboard manual invocation
 */
export const manualCleanupInactiveUsers = functions.https.onRequest(async (req, res) => {
  try {
    const settingsDoc = await db.collection('settings').doc('site').get();
    const settings = settingsDoc.exists ? settingsDoc.data() : null;
    const timeoutMinutes = Number(settings?.userInactivityTimeoutMinutes) || 15;
    const cutoffTime = Date.now() - (timeoutMinutes * 60 * 1000);

    const snapshot = await db.collection('users')
      .where('isOnline', '==', true)
      .where('lastSeenTimestamp', '<', cutoffTime)
      .get();

    if (!snapshot.empty) {
      const batch = db.batch();
      snapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          isOnline: false,
          onlineStatus: 'offline'
        });
      });
      await batch.commit();
    }

    res.json({
      success: true,
      cleanedCount: snapshot.size,
      timeoutMinutes,
      timestamp: Date.now()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

/**
 * Firebase Scheduled Cloud Function: checkExpiredMembershipsDaily
 * Runs daily at midnight UTC (cron: 0 0 * * *)
 * Automatically inspects `expiresAt` for all users in Firestore.
 * If a temporary membership has expired:
 * 1. Automatically downgrades the user's role to 'عضو مسجل' ('member').
 * 2. Marks membership.status = 'expired'.
 * 3. Records an audit entry in the `users/{userId}/membershipHistory` sub-collection
 *    with assignedBy, startAt, expiresAt, and permanent: false.
 */
export const checkExpiredMembershipsDaily = functions.pubsub
  .schedule('0 0 * * *')
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('[checkExpiredMembershipsDaily] Starting daily scheduled membership verification...');
      const now = Date.now();
      const usersRef = db.collection('users');

      // Retrieve users who have an active status
      const snapshot = await usersRef
        .where('membership.status', '==', 'active')
        .get();

      if (snapshot.empty) {
        console.log('[checkExpiredMembershipsDaily] No active memberships found.');
        return { count: 0 };
      }

      let expiredCount = 0;
      const batch = db.batch();

      for (const userDoc of snapshot.docs) {
        const userData = userDoc.data();
        const membership = userData.membership;

        // Absolute Primary Owner protection: NEVER expire or downgrade Primary Owner!
        if (
          userDoc.id === 'user-owner' ||
          userData.isPrimaryOwner === true ||
          userData.is_primary_owner === true ||
          userData.email === 'alzymasd9@gmail.com' ||
          (userData.role === 'owner' && (userData.username === 'Owner' || userData.username === 'صاحب الموقع'))
        ) {
          continue;
        }


        // Skip permanent memberships or users without expiresAt
        if (membership && !membership.permanent && membership.expiresAt && now >= membership.expiresAt) {
          const previousRank = membership.rank || userData.role || 'member';
          console.log(`[checkExpiredMembershipsDaily] Expired user detected: ${userDoc.id} (${userData.username}). Rank ${previousRank} -> member`);

          // 1. Update user profile
          batch.update(userDoc.ref, {
            role: 'member',
            'membership.status': 'expired',
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // 2. Add audit entry to sub-collection users/{userId}/membershipHistory
          const historyDocRef = userDoc.ref.collection('membershipHistory').doc();
          batch.set(historyDocRef, {
            id: historyDocRef.id,
            userId: userDoc.id,
            rank: previousRank,
            assignedBy: 'system',
            assignedByUsername: 'الجدولة اليومية التلقائية (Scheduled Cloud Function)',
            startAt: membership.startAt || now,
            expiresAt: membership.expiresAt,
            durationDays: membership.durationDays || 30,
            permanent: false,
            status: 'expired',
            notes: 'انتهت مدة العضوية المحددة بـ 30 يوماً وتم التحويل لعضو مسجل تلقائياً',
            createdAt: admin.firestore.FieldValue.serverTimestamp()
          });

          expiredCount++;
        }
      }

      if (expiredCount > 0) {
        await batch.commit();
        console.log(`[checkExpiredMembershipsDaily] Successfully updated ${expiredCount} expired user(s) to 'عضو مسجل'.`);
      } else {
        console.log('[checkExpiredMembershipsDaily] All active memberships are currently valid.');
      }

      return { success: true, expiredCount };
    } catch (error) {
      console.error('[checkExpiredMembershipsDaily] Error during scheduled membership check:', error);
      throw error;
    }
  });

/**
 * HTTP Callable Endpoint for manual invocation of the membership expiration check
 */
export const manualCheckExpiredMemberships = functions.https.onRequest(async (req, res) => {
  try {
    const now = Date.now();
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('membership.status', '==', 'active').get();

    let expiredCount = 0;
    const batch = db.batch();

    for (const userDoc of snapshot.docs) {
      const userData = userDoc.data();
      const membership = userData.membership;

      // Absolute Primary Owner protection: NEVER expire or downgrade Primary Owner!
      if (
        userDoc.id === 'user-owner' ||
        userData.isPrimaryOwner === true ||
        userData.is_primary_owner === true ||
        userData.email === 'alzymasd9@gmail.com' ||
        (userData.role === 'owner' && (userData.username === 'Owner' || userData.username === 'صاحب الموقع'))
      ) {
        continue;
      }


      if (membership && !membership.permanent && membership.expiresAt && now >= membership.expiresAt) {
        const previousRank = membership.rank || userData.role || 'member';
        batch.update(userDoc.ref, {
          role: 'member',
          'membership.status': 'expired',
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        const historyDocRef = userDoc.ref.collection('membershipHistory').doc();
        batch.set(historyDocRef, {
          id: historyDocRef.id,
          userId: userDoc.id,
          rank: previousRank,
          assignedBy: 'system',
          assignedByUsername: 'التحقق اليدوي/المجدول من الخادم',
          startAt: membership.startAt || now,
          expiresAt: membership.expiresAt,
          durationDays: membership.durationDays || 30,
          permanent: false,
          status: 'expired',
          notes: 'انتهت فترة الاشتراك وتم التحويل لعضو مسجل',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      await batch.commit();
    }

    res.json({
      success: true,
      expiredCount,
      timestamp: now
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

