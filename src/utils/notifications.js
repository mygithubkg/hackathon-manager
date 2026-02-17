import emailjs from '@emailjs/browser';
import { db, auth } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY } from './emailConfig';

/**
 * Fetches all relevant recipients for a project (Owner + Team Members).
 * 
 * @param {object} hackathon The hackathon project object
 * @returns {Promise<Array<{uid: string, email: string, name: string}>>}
 */
export const getProjectRecipients = async (hackathon) => {
  if (!hackathon) return [];

  const currentUser = auth.currentUser;
  const recipients = [];
  const seenUids = new Set();

  // Helper to add user if unique
  const addUser = (user) => {
    if (user && user.uid && !seenUids.has(user.uid)) {
      recipients.push(user);
      seenUids.add(user.uid);
    }
  };

  // 1. Add Current User (Self) - mostly for confirmation, but can filter out if needed
  if (currentUser) {
    addUser({ 
      uid: currentUser.uid, 
      email: currentUser.email, 
      name: currentUser.displayName 
    });
  }

  // 2. If it's a TEAM project, fetch all members
  if (hackathon.type === 'team' && hackathon.teamId) {
    try {
      // A. Fetch Team Document
      const teamRef = doc(db, 'teams', hackathon.teamId);
      const teamSnap = await getDoc(teamRef);

      if (teamSnap.exists()) {
        const teamData = teamSnap.data();
        const memberUids = teamData.members || [];
        const memberProfiles = teamData.memberProfiles || []; // NEW: Stored directly in team doc

        console.group(`👥 Team ID: ${hackathon.teamId}`);
        console.log(`Team Name: ${teamData.name || 'Unnamed Team'}`);
        console.log(`Member Count (UIDs): ${memberUids.length}`);
        
        // Strategy: Use stored profiles first, fall back to UIDs lookup if needed
        const processedUids = new Set();

        // 1. Process stored profiles
        memberProfiles.forEach(profile => {
          if (profile.uid && profile.email) {
            console.log(` - Member (Project Profile): ${profile.email} (${profile.displayName})`);
            addUser({
              uid: profile.uid,
              email: profile.email,
              name: profile.displayName || 'Team Member'
            });
            processedUids.add(profile.uid);
          }
        });

        // 2. Process missing UIDs (Old behavior for backward compatibility)
        const missingUids = memberUids.filter(uid => !processedUids.has(uid));
        
        if (missingUids.length > 0) {
          console.warn(`Attempting to fetch ${missingUids.length} missing profiles from Users collection...`);
          const memberPromises = missingUids.map(uid => getDoc(doc(db, 'users', uid)));
          const memberSnaps = await Promise.all(memberPromises);

          memberSnaps.forEach((snap, index) => {
            if (snap.exists()) {
               const userData = snap.data();
               console.log(` - Member (Live Profile): ${userData.email} (${userData.displayName})`);
               addUser({
                 uid: snap.id,
                 email: userData.email,
                 name: userData.displayName || 'Team Member'
               });
            } else {
               console.warn(` ⚠️ Member Not Found: UID ${missingUids[index]} (User has not logged in since update)`);
            }
          });
        }
        console.groupEnd();
      }
    } catch (error) {
      console.error("Error fetching team recipients:", error);
    }
  }

  return recipients;
};

/**
 * Sends a templated email via EmailJS and creates a Firestore notification.
 * 
 * @param {Array<{uid: string, email: string, name?: string}>} recipients User objects
 * @param {{headline: string, message: string, type_color: string, btn_text: string, btn_link: string}} emailData 
 * @param {{type: string, relatedId: string|null}} notificationData 
 */
export const notifyUsers = async (recipients, emailData, notificationData) => {
  if (!recipients || recipients.length === 0) return;

  const notificationRef = collection(db, 'notifications');
  const APP_URL = window.location.origin; // Base URL of the app

  // Process each recipient
  const promises = recipients.map(async (user) => {
    if (!user || !user.uid) return;

    // 1. Create In-App Notification (Firestore)
    try {
      console.log(`🔔 Creating In-App Notification for UID: ${user.uid}`);
      const docRef = await addDoc(notificationRef, {
        userId: user.uid,
        message: `${emailData.headline}: ${emailData.message}`,
        type: notificationData.type || 'info', // 'success', 'urgent', 'info'
        read: false,
        createdAt: serverTimestamp(),
        relatedId: notificationData.relatedId
      });
      console.log(`✅ Notification created with ID: ${docRef.id}`);
    } catch (error) {
      console.error("❌ Error creating notification Firestore:", error);
    }

    // 2. Send Email (EmailJS)
    if (user.email) {
      try {
        const templateParams = {
          to_email: user.email,
          to_name: user.name || 'User',
          headline: emailData.headline,
          message: emailData.message,
          type_color: emailData.type_color || '#3B82F6', // Default Blue
          btn_text: emailData.btn_text || 'View Dashboard',
          btn_link: emailData.btn_link || APP_URL,
        };

        // Note: EmailJS might have rate limits on the free tier.
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, templateParams, EMAILJS_PUBLIC_KEY);
        console.log(`Email sent to ${user.email}`);
      } catch (error) {
        console.error(`Error sending email to ${user.email}:`, error);
      }
    }
  });

  await Promise.all(promises);
};

/**
 * Checks for upcoming deadlines and triggers urgent notifications.
 * Runs on client-side load.
 * 
 * @param {Array<object>} hackathons Array of hackathon objects
 * @param {object} currentUser The current logged-in user
 */
export const checkDeadlines = async (hackathons, currentUser) => {
  if (!hackathons || !currentUser) return;

  const now = new Date();
  const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

  for (const hackathon of hackathons) {
    if (!hackathon.deadline) continue;
    if (hackathon.deadlineWarned) continue; // Already warned

    const deadlineDate = new Date(hackathon.deadline);
    const timeDiff = deadlineDate.getTime() - now.getTime();

    // Check if deadline is in the future and within the next 3 days
    if (timeDiff > 0 && timeDiff <= threeDaysInMs) {
      
      const emailData = {
        headline: 'Deadline Approaching!',
        message: `Only 3 days left until the deadline for "${hackathon.title}".`,
        type_color: '#EF4444', // RED
        btn_text: 'View Project',
        btn_link: `${window.location.origin}/project/${hackathon.id}` // Assuming route structure
      };

      const notificationData = {
        type: 'urgent',
        relatedId: hackathon.id
      };

      // Notify current user
      await notifyUsers([currentUser], emailData, notificationData);

      // Update Firestore to prevent re-notifying (Persist warning flag)
      try {
        const hackathonRef = doc(db, 'hackathons', hackathon.id);
        await updateDoc(hackathonRef, {
          deadlineWarned: true
        });
        console.log(`Marked ${hackathon.title} as deadline warned.`);
      } catch (error) {
        console.error("Error updating deadline warning flag:", error);
      }
    }
  }
};
