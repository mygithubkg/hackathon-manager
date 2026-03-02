import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export async function logActivity({
  currentUser,
  currentTeam = null,
  type,
  projectId = null,
  projectTitle = null,
  entityId = null,
  entityTitle = null,
  meta = {}
}) {
  try {
    await addDoc(collection(db, 'activityLogs'), {
      ownerId: currentUser.uid,
      ownerName: currentUser.displayName || currentUser.email,
      ownerPhoto: currentUser.photoURL || null,
      teamId: currentTeam?.id || null,
      type,
      projectId,
      projectTitle,
      entityId,
      entityTitle,
      meta,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.warn('Activity log failed:', error);
  }
}
