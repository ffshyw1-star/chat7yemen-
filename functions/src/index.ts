import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

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
