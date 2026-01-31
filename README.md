# 🚀 Hackathon Command Center

> A modern, centralized dashboard to manage hackathon resources, tracks, and progress. Built with React, Tailwind CSS, and powered by Firebase Firestore for real-time cloud synchronization.

![Project Status](https://img.shields.io/badge/Status-Complete-success)
![React](https://img.shields.io/badge/React-18.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.1-purple)
![Firebase](https://img.shields.io/badge/Firebase-12.8-orange)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)

## 📊 Website Status

**Current State:** ✅ **Fully Functional & Migrated to Cloud**

The application has been successfully migrated from local storage to **Firebase Firestore**. This means:
- Data is stored securely in the cloud.
- Changes sync in real-time across all connected devices.
- No data loss when clearing browser cache.
- Ready for public deployment.

## ✨ Features

- **🔥 Real-Time Dashboard**: See all your hackathons in a responsive grid layout.
- **☁️ Cloud Sync**: All data is stored in Firebase Firestore, accessible anywhere.
- **🛠 Resource Manager**: Add, edit, and organize links (GitHub, Figma, Notion, etc.) for each project.
- **🎨 Modern UI/UX**: Dark mode aesthetic with glassmorphism effects and smooth transitions.
- **🎬 Animations**: Powered by generic Framer Motion for a fluid user experience.
- **📱 Fully Responsive**: Optimized for desktop, tablet, and mobile views.
- **✨ Easy Management**: Create, Update, and Delete hackathon entries with a few clicks.

## 🛠 Tech Stack

- **Frontend Framework**: [React](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Backend/Database**: [Firebase Firestore](https://firebase.google.com/docs/firestore)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📂 Project Structure

Verified structure of the codebase:

```text
src/
├── components/          # UI Components
│   ├── AddModal.jsx     # Form modal for creating/editing hackathons
│   ├── Dashboard.jsx    # Main grid view of all hackathons
│   ├── HackathonCard.jsx # Individual card component for a hackathon
│   └── ResourceManager.jsx # Component to manage resource links inside a card
├── hooks/               # Custom React Hooks
│   ├── useFirestore.js  # Main hook for Firebase CRUD operations
│   └── useLocalStorage.js # (Legacy) Local storage hook for fallback/preferences
├── App.jsx              # Application root and state orchestrator
├── firebase.js          # Firebase configuration and initialization
├── index.css            # Global styles and Tailwind directives
└── main.jsx             # Entry point
```

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Prerequisites
- Node.js (v16+)
- npm or yarn

### 2. Installation
Clone the repository and install dependencies:

```bash
git clone <repository_url>
cd "Manage Resources"
npm install
```

### 3. Environment Configuration
The project uses environment variables for Firebase configuration. 
**A `.env` file has been created for you.** 

If you need to set it up manually, create a `.env` file in the root directory:



### 4. Run Locally
Start the development server:

```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) (or the port shown in terminal) to view the app.

## 📖 Component Guide

- **`App.jsx`**: Handles the main layout and integrates the `useFirestore` hook to fetch data.
- **`Dashboard.jsx`**: Receives list of hackathons and renders them. Handles generic "empty state" display.
- **`HackathonCard.jsx`**: Displays details (Name, Status, Date) and includes the `ResourceManager`.
- **`ResourceManager.jsx`**: A mini-crud component inside the card to add/remove links like "Design", "Repo".
- **`AddModal.jsx`**: A popup form to input new hackathon details.

## 🪝 Hooks

- **`useFirestore`**:
  - `hackathons`: Array of hackathon objects.
  - `loading`: Boolean state for async operations.
  - `addHackathon(data)`: Create new entry.
  - `deleteHackathon(id)`: Remove entry.
  - `updateHackathon(id, data)`: Update existing entry.
  - `addResource(hackathonId, resource)`: Add a link to a hackathon.
  - `deleteResource(hackathonId, resourceId)`: Remove a link.

---

*Verified and Updated on Jan 31, 2026*
