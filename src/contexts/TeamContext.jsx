import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  arrayUnion, 
  doc,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

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
      createdBy: currentUser.uid,
      inviteCode: inviteCode,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'teams'), teamData);
    const newTeam = { id: docRef.id, ...teamData };
    setCurrentTeam(newTeam); // Auto-switch to new team
    return newTeam;
  };

  // Join a team using invite code
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

    // Add user to members array
    await updateDoc(doc(db, 'teams', teamDoc.id), {
      members: arrayUnion(currentUser.uid)
    });

    const joinedTeam = { id: teamDoc.id, ...teamData, members: [...teamData.members, currentUser.uid] };
    setCurrentTeam(joinedTeam);
    return joinedTeam;
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

  const value = {
    currentTeam,
    userTeams,
    createTeam,
    joinTeam,
    switchTeam,
    loading
  };

  return (
    <TeamContext.Provider value={value}>
      {children}
    </TeamContext.Provider>
  );
}
