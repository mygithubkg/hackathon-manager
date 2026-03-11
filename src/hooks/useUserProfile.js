import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { sanitizeText, sanitizeURL } from '../utils/security';

export function useUserProfile() {
  const { currentUser } = useAuth();
  const [publicProfile, setPublicProfile] = useState(null);
  const [privateProfile, setPrivateProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setPublicProfile(null);
      setPrivateProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const profileRef = doc(db, 'userProfiles', currentUser.uid);

    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPublicProfile(data.publicProfile || {});
        setPrivateProfile(data.privateProfile || {});
      } else {
        // Initialize with defaults if not exists
        setPublicProfile({
          displayName: currentUser.displayName || '',
          bio: '',
          portfolioLinks: [],
          skills: [],
          avatarURL: currentUser.photoURL || ''
        });
        setPrivateProfile({
          email: currentUser.email || '',
          phone: '',
          location: ''
        });
      }
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Error fetching user profile:", err);
      setError(err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const updatePublicProfile = async (updates) => {
    if (!currentUser) throw new Error('Must be logged in');

    // Validation & Sanitization
    const displayName = sanitizeText(updates.displayName || '').substring(0, 40);
    if (!displayName) throw new Error('Display Name is required');

    const bio = sanitizeText(updates.bio || '').substring(0, 300);
    
    const portfolioLinks = (updates.portfolioLinks || []).slice(0, 5).map(link => ({
      label: sanitizeText(link.label || '').substring(0, 50),
      url: sanitizeURL(link.url || '')
    }));

    const skills = (updates.skills || []).slice(0, 10).map(skill => 
      sanitizeText(skill || '').substring(0, 30)
    ).filter(Boolean);

    const publicUpdates = {
      displayName,
      bio,
      portfolioLinks,
      skills,
      avatarURL: updates.avatarURL || currentUser.photoURL || ''
    };

    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    await setDoc(profileRef, {
      publicProfile: publicUpdates,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  const updatePrivateProfile = async (updates) => {
    if (!currentUser) throw new Error('Must be logged in');

    const privateUpdates = {
      email: updates.email || currentUser.email || '',
      phone: sanitizeText(updates.phone || '').substring(0, 20),
      location: sanitizeText(updates.location || '').substring(0, 100)
    };

    const profileRef = doc(db, 'userProfiles', currentUser.uid);
    await setDoc(profileRef, {
      privateProfile: privateUpdates,
      updatedAt: serverTimestamp()
    }, { merge: true });
  };

  return {
    publicProfile,
    privateProfile,
    loading,
    error,
    updatePublicProfile,
    updatePrivateProfile
  };
}
