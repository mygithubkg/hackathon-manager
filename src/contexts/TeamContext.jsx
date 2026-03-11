import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  getDoc,
  updateDoc,
  arrayUnion,
  doc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';
import { logActivity } from '../utils/logActivity';
import { requireAdmin } from '../utils/adminGuard';
import { updateHackathonLimiter, sanitizeText } from '../utils/security';

export const AUTO_APPROVE_HOURS = 48;

const TeamContext = createContext();

export function useTeam() {
  return useContext(TeamContext);
}

export function TeamProvider({ children }) {
  const { currentUser } = useAuth();
  const [currentTeam, setCurrentTeam] = useState(null);
  const [userTeams, setUserTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate a random 6-character invite code
  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Listen for teams where the current user is a member
  useEffect(() => {
    if (!currentUser) {
      setUserTeams([]);
      setCurrentTeam(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, where('members', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const teams = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setUserTeams(teams);

      // --- SELF-HEALING DATA MIGRATION ---
      // Automatically upgrade old team data to include memberProfiles
      teams.forEach(async (team) => {
        const profiles = team.memberProfiles || [];
        const myProfile = profiles.find(p => p.uid === currentUser.uid);

        if (!myProfile) {
          console.log(`🩹 Self-healing data for team: ${team.name}`);
          try {
            const teamDocRef = doc(db, 'teams', team.id);
            const userProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || 'Team Member'
            };
            // usage of arrayUnion is safe here
            await updateDoc(teamDocRef, {
              memberProfiles: arrayUnion(userProfile)
            });
          } catch (err) {
            // Silently fail if permissions prevent healing (e.g. read-only)
            // console.warn("Could not heal team profile:", err); 
          }
        }
      });

      // If user is designated to a team but currentTeam is null, set the first one
      // Or if the currentTeam is no longer in the list (kicked out?), reset it
      if (teams.length > 0 && !currentTeam) {
        // Optional: auto-select first team or keep null until user selects
        // setCurrentTeam(teams[0]); 
      } else if (currentTeam && !teams.find(t => t.id === currentTeam.id)) {
        setCurrentTeam(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Create a new team
  const createTeam = async (teamName) => {
    if (!currentUser) throw new Error('Must be logged in');

    // Ensure unique invite code (simple check, in production might need retry loop)
    const inviteCode = generateInviteCode();

    const teamData = {
      name: teamName,
      members: [currentUser.uid],
      memberProfiles: [{
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || 'Leader'
      }],
      createdBy: currentUser.uid,
      adminId: currentUser.uid,
      admins: [currentUser.uid],
      pendingMembers: [],
      inviteCode: inviteCode,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'teams'), teamData);
    const newTeam = { id: docRef.id, ...teamData };
    setCurrentTeam(newTeam); // Auto-switch to new team
    return newTeam;
  };

  // Join a team using invite code (requests to join)
  const joinTeam = async (code) => {
    if (!currentUser) throw new Error('Must be logged in');

    // Find team with this code
    const teamsRef = collection(db, 'teams');
    const q = query(teamsRef, where('inviteCode', '==', code.toUpperCase()));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      throw new Error('Invalid invite code');
    }

    const teamDoc = querySnapshot.docs[0];
    const teamData = teamDoc.data();

    // Check if already a member
    if (teamData.members.includes(currentUser.uid)) {
      throw new Error('You are already a member of this team');
    }

    // Check if already pending
    const pendingMembers = teamData.pendingMembers || [];
    if (pendingMembers.some(p => p.uid === currentUser.uid)) {
      throw new Error('Request already pending');
    }

    const autoApproveAt = Timestamp.fromDate(new Date(Date.now() + AUTO_APPROVE_HOURS * 60 * 60 * 1000));

    /** @type {import('../types/firestoreSchema').PendingMember} */
    const pendingMem = {
      uid: currentUser.uid,
      email: currentUser.email,
      displayName: currentUser.displayName || 'Pending Member',
      requestedAt: Timestamp.now(),  // Use explicit timestamp since serverTimestamp fails inside arrayUnion
      autoApproveAt: autoApproveAt
    };

    // Add user to pendingMembers array
    await updateDoc(doc(db, 'teams', teamDoc.id), {
      pendingMembers: arrayUnion(pendingMem)
    });

    const admins = teamData.admins || [teamData.adminId];
    for (const adminUid of admins) {
      await addDoc(collection(db, 'notifications'), {
        type: 'join_request',
        message: `${currentUser.displayName || currentUser.email} wants to join ${teamData.name}`,
        teamId: teamDoc.id,
        userId: adminUid, // Admin to notify
        requesterId: currentUser.uid, // As requested
        read: false,
        createdAt: serverTimestamp()
      });
    }

    return { status: 'pending', autoApproveAt };
  };

  // Switch active team
  const switchTeam = (teamId) => {
    if (!teamId) {
      setCurrentTeam(null); // Switch to "Solo" view
      return;
    }
    const team = userTeams.find(t => t.id === teamId);
    if (team) {
      setCurrentTeam(team);
    }
  };

  // Promote to admin
  const promoteToAdmin = async (teamId, targetUid) => {
    if (!currentUser) throw new Error('Must be logged in');

    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);

    if (!teamSnap.exists()) {
      throw new Error('Team not found');
    }

    const teamData = teamSnap.data();

    if (!teamData.admins?.includes(currentUser.uid)) {
      throw new Error('Unauthorized');
    }

    if (!teamData.members?.includes(targetUid)) {
      throw new Error('User is not a member');
    }

    await updateDoc(teamRef, {
      admins: arrayUnion(targetUid)
    });

    logActivity({
      currentUser,
      currentTeam, // pass currently viewed team context
      type: 'promoted_to_admin',
      action: 'promoted_to_admin',
      targetUid,
      teamId,
      actorUid: currentUser.uid
    });

    await addDoc(collection(db, 'notifications'), {
      type: 'role_change',
      message: `You are now an admin of ${teamData.name}`,
      teamId,
      userId: targetUid,
      read: false,
      createdAt: serverTimestamp()
    });
  };

  /**
   * Approve a pending join request
   * @param {string} teamId 
   * @param {string} targetUid 
   */
  const approveJoinRequest = async (teamId, targetUid) => {
    if (!currentUser) throw new Error('Must be logged in');

    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) throw new Error('Team not found');

    const teamData = teamSnap.data();
    requireAdmin(teamData, currentUser.uid);

    const pendingMembers = teamData.pendingMembers || [];
    const pendingMem = pendingMembers.find(p => p.uid === targetUid);
    if (!pendingMem) throw new Error('No pending request found for this user');

    await updateDoc(teamRef, {
      pendingMembers: arrayRemove(pendingMem),
      members: arrayUnion(targetUid),
      memberProfiles: arrayUnion({
        uid: pendingMem.uid,
        email: pendingMem.email,
        displayName: pendingMem.displayName
      })
    });

    logActivity({
      currentUser,
      currentTeam,
      type: 'member_approved',
      action: 'member_approved',
      targetUid,
      teamId,
      actorUid: currentUser.uid
    });

    await addDoc(collection(db, 'notifications'), {
      type: 'join_approved',
      message: `Your request to join ${teamData.name} was approved!`,
      teamId,
      userId: targetUid,
      read: false,
      createdAt: serverTimestamp()
    });
  };

  /**
   * Reject a pending join request
   * @param {string} teamId 
   * @param {string} targetUid 
   */
  const rejectJoinRequest = async (teamId, targetUid) => {
    if (!currentUser) throw new Error('Must be logged in');

    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) throw new Error('Team not found');

    const teamData = teamSnap.data();
    requireAdmin(teamData, currentUser.uid);

    const pendingMembers = teamData.pendingMembers || [];
    const pendingMem = pendingMembers.find(p => p.uid === targetUid);
    if (!pendingMem) throw new Error('No pending request found for this user');

    await updateDoc(teamRef, {
      pendingMembers: arrayRemove(pendingMem)
    });

    await addDoc(collection(db, 'notifications'), {
      type: 'join_rejected',
      message: `Your request to join ${teamData.name} was not approved.`,
      teamId,
      userId: targetUid,
      read: false,
      createdAt: serverTimestamp()
    });
  };

  /**
   * Delete a team
   * @param {string} teamId
   */
  const deleteTeam = async (teamId) => {
    if (!currentUser) throw new Error('Must be logged in');

    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) throw new Error('Team not found');

    const teamData = teamSnap.data();
    requireAdmin(teamData, currentUser.uid);

    let batch = writeBatch(db);
    let batchSize = 0;

    // 1. Delete the team document
    batch.delete(teamRef);
    batchSize++;

    // 2. Query and delete all hackathons for this team
    const hackathonsRef = collection(db, 'hackathons');
    const hackathonsQ = query(hackathonsRef, where('teamId', '==', teamId));
    const hackathonsSnap = await getDocs(hackathonsQ);

    for (const docSnap of hackathonsSnap.docs) {
      if (batchSize >= 499) {
        await batch.commit();
        batch = writeBatch(db);
        batchSize = 0;
      }
      batch.delete(docSnap.ref);
      batchSize++;
    }

    // 3. Query and delete all notifications for this team
    const notifsRef = collection(db, 'notifications');
    const notifsQ = query(notifsRef, where('teamId', '==', teamId));
    const notifsSnap = await getDocs(notifsQ);

    for (const docSnap of notifsSnap.docs) {
      if (batchSize >= 499) {
        await batch.commit();
        batch = writeBatch(db);
        batchSize = 0;
      }
      batch.delete(docSnap.ref);
      batchSize++;
    }

    if (batchSize > 0) {
      await batch.commit();
    }

    if (currentTeam?.id === teamId) {
      switchTeam(null);
    }

    logActivity({
      currentUser,
      currentTeam: null,
      type: 'team_deleted',
      action: 'team_deleted',
      teamId,
      actorUid: currentUser.uid,
      teamName: teamData.name
    });
  };

  /**
   * Update team name
   * @param {string} teamId
   * @param {string} newName
   */
  const updateTeamName = async (teamId, newName) => {
    if (!currentUser) throw new Error('Must be logged in');

    if (!updateHackathonLimiter.canProceed(`rename_team_${currentUser.uid}`)) {
      throw new Error('Too many updates, please wait');
    }

    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    if (!teamSnap.exists()) throw new Error('Team not found');

    const teamData = teamSnap.data();

    const isAdmin = teamData.admins?.includes?.(currentUser.uid) || teamData.adminId === currentUser.uid;
    const isMember = teamData.members?.includes?.(currentUser.uid);
    if (!isMember && !isAdmin) {
      throw new Error('Not a member');
    }

    const trimmedName = newName?.trim() || '';
    if (!trimmedName) throw new Error('Team name cannot be empty');
    if (trimmedName.length > 50) throw new Error('Team name must be 50 characters or less');

    const sanitizedName = sanitizeText(trimmedName);

    await updateDoc(teamRef, {
      name: sanitizedName,
      updatedAt: serverTimestamp()
    });

    logActivity({
      currentUser,
      currentTeam,
      type: 'team_renamed',
      action: 'team_renamed',
      teamId,
      oldName: teamData.name,
      newName: sanitizedName,
      actorUid: currentUser.uid
    });
  };

  /**
   * Fetch full profiles for all members of a team
   * @param {string} teamId
   * @returns {Promise<Array<{uid: string, publicProfile: import('../types/firestoreSchema').PublicProfile}>>}
   */
  const fetchMemberProfiles = async (teamId) => {
    if (!teamId) return [];

    try {
      const teamRef = doc(db, 'teams', teamId);
      const teamSnap = await getDoc(teamRef);
      if (!teamSnap.exists()) return [];

      const teamData = teamSnap.data();
      const cachedProfiles = teamData.memberProfiles || [];
      const memberUids = teamData.members || [];

      const profiles = await Promise.all(
        memberUids.map(async (uid) => {
          const profileDoc = await getDoc(doc(db, 'userProfiles', uid));
          const cached = cachedProfiles.find((p) => p.uid === uid) || {};

          if (profileDoc.exists() && profileDoc.data().publicProfile) {
            return { uid, publicProfile: profileDoc.data().publicProfile };
          }

          return {
            uid,
            publicProfile: {
              displayName: cached.displayName || cached.email || 'Unknown',
              bio: '',
              portfolioLinks: [],
              skills: [],
              avatarURL: ''
            }
          };
        })
      );

      return profiles;
    } catch (err) {
      console.error('Error fetching member profiles:', err);
      return [];
    }
  };

  const isAdmin = currentTeam?.admins?.includes(currentUser?.uid) ?? false;
  const isCreator = currentTeam?.adminId === currentUser?.uid;
  const pendingMembers = currentTeam?.pendingMembers ?? [];
  const pendingCount = pendingMembers.length;

  const value = {
    currentTeam,
    userTeams,
    createTeam,
    joinTeam,
    switchTeam,
    promoteToAdmin,
    approveJoinRequest,
    rejectJoinRequest,
    deleteTeam,
    updateTeamName,
    fetchMemberProfiles,
    isAdmin,
    isCreator,
    pendingMembers,
    pendingCount,
    loading
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}
