import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';

/**
 * Migration strictly additive to avoid breaking existing data.
 */
export async function migrateTeams() {
  if (!auth.currentUser) {
    console.warn("Migration failed: Must be authenticated.");
    return;
  }

  console.log("Starting teams migration...");
  const teamsRef = collection(db, 'teams');
  const snapshot = await getDocs(teamsRef);

  if (snapshot.empty) {
    console.log("No teams found. Migration complete.");
    return;
  }

  const chunks = [];
  let currentBatch = writeBatch(db);
  let currentBatchSize = 0;
  let totalMigrated = 0;
  let totalSkipped = 0;

  snapshot.forEach((teamDoc) => {
    const data = teamDoc.data();

    // Idempotency check: if adminId is already present, skip
    if (data.adminId !== undefined) {
      totalSkipped++;
      return;
    }

    const migrationData = {
      adminId: data.createdBy,
      admins: [data.createdBy],
    };

    if (data.pendingMembers === undefined) {
      migrationData.pendingMembers = [];
    }

    const teamDocRef = doc(db, 'teams', teamDoc.id);
    currentBatch.update(teamDocRef, migrationData);
    currentBatchSize++;
    totalMigrated++;

    // Firestore batch limit is 500
    if (currentBatchSize >= 499) {
      chunks.push(currentBatch);
      currentBatch = writeBatch(db);
      currentBatchSize = 0;
    }
  });

  if (currentBatchSize > 0) {
    chunks.push(currentBatch);
  }

  console.log(`Prepared to migrate ${totalMigrated} teams. Skipped ${totalSkipped} already migrated teams.`);

  for (let i = 0; i < chunks.length; i++) {
    await chunks[i].commit();
    console.log(`Committed batch ${i + 1} of ${chunks.length}`);
  }

  console.log(`Migration complete! Migrated ${totalMigrated} / ${snapshot.size} teams.`);
}

if (import.meta.env.DEV) {
  window.__runMigration = migrateTeams;
  console.info("DevTools Extension: Migration helper `window.__runMigration()` is available.");
}
