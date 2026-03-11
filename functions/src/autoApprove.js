// To deploy: firebase deploy --only functions:autoApprovePendingMembers
// Required IAM: functions service account needs Cloud Datastore User role

const { onSchedule } = require("firebase-functions/v2/scheduler");
const { getFirestore, Timestamp, FieldValue } = require("firebase-admin/firestore");

// Usually admin app is initialized in an index.js entrypoint. 
// We are exporting the function, if it runs it needs the admin app init.
const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Scheduled Cloud Function — runs every 30 minutes
 * Auto-approves pending members when admin is offline for 48h+
 */
exports.autoApprovePendingMembers = onSchedule("every 30 minutes", async (event) => {
  const db = getFirestore();
  let completedCount = 0;
  let teamsProcessed = 0;

  try {
    const teamsSnapshot = await db.collection("teams").get();
    const now = Date.now();
    teamsProcessed = teamsSnapshot.size;

    for (const teamDoc of teamsSnapshot.docs) {
      const teamId = teamDoc.id;
      
      try {
        const teamData = teamDoc.data();
        const pendingMembers = teamData.pendingMembers || [];
        if (pendingMembers.length === 0) continue;
        
        // Filter those due for auto approval
        const dueMembers = pendingMembers.filter(member => {
          if (!member.autoApproveAt) return false;
          // handle robust Timestamp checks
          if (member.autoApproveAt.toMillis) {
            return member.autoApproveAt.toMillis() <= now;
          }
          if (member.autoApproveAt._seconds) {
            return (member.autoApproveAt._seconds * 1000) <= now;
          }
          return false;
        });

        if (dueMembers.length === 0) continue;

        const batch = db.batch();
        const teamRef = db.collection("teams").doc(teamId);

        // Aggregate array ops for single batch update
        const membersToAdd = [];
        const memberProfilesToAdd = [];
        const pendingToRemove = [];

        for (const member of dueMembers) {
          membersToAdd.push(member.uid);
          memberProfilesToAdd.push({
            uid: member.uid,
            email: member.email,
            displayName: member.displayName
          });
          pendingToRemove.push(member);

          const notificationRef = db.collection("notifications").doc();
          batch.set(notificationRef, {
            type: 'join_auto_approved',
            message: `Auto-approved into ${teamData.name || 'Team'}`,
            userId: member.uid,
            teamId: teamId,
            read: false,
            createdAt: FieldValue.serverTimestamp()
          });
          
          completedCount++;
        }

        batch.update(teamRef, {
          members: FieldValue.arrayUnion(...membersToAdd),
          memberProfiles: FieldValue.arrayUnion(...memberProfilesToAdd),
          pendingMembers: FieldValue.arrayRemove(...pendingToRemove)
        });

        await batch.commit();

      } catch (teamError) {
        console.error(`Failed to process auto-approvals for team ${teamId}:`, teamError);
      }
    }

    console.log(`Auto-approved ${completedCount} members across ${teamsProcessed} teams`);
  } catch (error) {
    console.error("Critical error querying teams:", error);
  }
});
