# 🚀 Hackathon Command Center: The Comprehensive Documentation

> **Version**: 2.0.0  
> **Status**: Production Ready  
> **Authors**: Google DeepMind Agentic Team & User  
> **Last Updated**: February 2026

---

## 📖 Table of Contents

1.  [🌟 Project Overview](#-project-overview)
2.  [🧠 Architecture & Philosophy](#-architecture--philosophy)
3.  [🛠 Technology Stack Deep Dive](#-technology-stack-deep-dive)
4.  [💾 Database Schema & Data Logic](#-database-schema--data-logic)
5.  [🔐 Security Infrastructure](#-security-infrastructure)
6.  [🎨 Design System & UI/UX](#-design-system--uiux)
7.  [📂 File Structure & Module Breakdown](#-file-structure--module-breakdown)
8.  [🧩 State Management (Context API)](#-state-management-context-api)
9.  [⚓ Custom Hooks Reference](#-custom-hooks-reference)
10. [⚛️ Component Encyclopedia](#-component-encyclopedia)
    *   [App Entry Point](#app-entry-point)
    *   [Authentication Components](#authentication-components)
    *   [Dashboard & Navigation](#dashboard--navigation)
    *   [Hackathon Card System](#hackathon-card-system)
    *   [Modals & Forms](#modals--forms)
    *   [Team Management System](#team-management-system)
11. [🔄 Operational Workflows](#-operational-workflows)
12. [💻 Installation & Developer Guide](#-installation--developer-guide)

---

## 🌟 Project Overview

The **Hackathon Command Center** is a sophisticated, cloud-native React application designed to act as the central nervous system for competitive developers, hackathon enthusiasts, and engineering teams. It solves the chaos of managing multiple hackathons, deadlines, team resources, and submission requirements by providing a unified, visual interface.

Unlike simple to-do lists, this application is "Hackathon-Aware". It understands:
*   **Deadlines**: Calculating real-time countdowns.
*   **Urgency**: Visually flagging tasks that are due in < 48 hours.
*   **Teams**: Differentiating between solo side-projects and collaborative squad efforts.
*   **Assets**: Managing heterogeneous resources like Figma links, GitHub repos, and deployment URLs in one place.

The application is built as a **Single Page Application (SPA)** that feels like a native desktop app, utilizing aggressive animations, glassmorphism UI, and optimistic UI updates for a snappy feel.

---

## 🧠 Architecture & Philosophy

The architecture follows a **Serverless, Component-Driven** model.

### 1. Client-Side Rendering (CSR)
We utilize Client-Side Rendering via React to ensure immediate interactivity. The initial bundle is loaded via Vite, and subsequent data is fetched asynchronously. This allows for:
*   **Rich Interactivity**: Drag-and-drop feels, instant tab switching, and complex animations (Framer Motion) that would be janky with Server-Side Rendering (SSR).
*   **Decoupled Backend**: The frontend is completely agnostic of the backend implementation details, communicating solely via the Firebase SDK.

### 2. "Context-First" State Management
Instead of heavy libraries like Redux, we rely on React's native **Context API** for global state (`AuthContext`, `TeamContext`).
*   **Why?** Our state (User User, Current Team) is relatively stable. Prop drilling is avoided by wrapping the entire `App` in these providers.
*   **Performance**: To prevent re-renders, we split contexts logically. Updating a team doesn't re-render the authentication tree.

### 3. "Security-by-Design"
Security is not an afterthought; it is baked into the utility layer (`src/utils/security.js`).
*   **Input Sanitization**: Every user input passed to the database is scrubbed for XSS scripts.
*   **Rate Limiting**: Custom token-bucket algorithms prevent clients from spamming create/delete operations.
*   **Validation**: Strict type and length checks prevent database pollution.

---

## 🛠 Technology Stack Deep Dive

We carefully selected technologies that balance developer experience (DX) with performance and scalability.

### Core Framework
*   **React 18.3**: Leveraging concurrent features and strict mode. We use functional components exclusively with Hooks (`useState`, `useEffect`, `useMemo`, `useCallback`).
*   **Vite 5.1**: The build tool of choice. It uses native ES modules during development for instant Hot Module Replacement (HMR) and Rollup for highly optimized production builds.

### Styling & Animation
*   **Tailwind CSS 3.4**: Utility-first CSS.
    *   *Usage*: We use standard Tailwind classes but extend the theme in `tailwind.config.js` to add custom colors (primary-400, primary-600) and animations.
    *   *Philosophy*: No separate CSS files for components. Styles are co-located with markup for rapid iteration.
*   **Framer Motion 11**: The industry standard for React animations.
    *   *Usage*: We use `<AnimatePresence>` for modal entry/exit and `layout` props for smooth list reordering when items are added/removed.
*   **Lucide React**: A lightweight, consistent icon library that supports tree-shaking.

### Backend-as-a-Service (BaaS)
*   **Firebase 10.x**:
    *   **Authentication**: Google Sign-In provider handles identity management securely (OAuth 2.0).
    *   **Firestore**: A NoSQL document database. It offers real-time listeners (`onSnapshot`), meaning when one user updates a team project, all other team members see the update *instantly* without refreshing.

---

## 💾 Database Schema & Data Logic

We use **Cloud Firestore**, a NoSQL database. Understanding the schema is critical for working on the backend logic.

### Collection: `hackathons`
This is the primary collection storing project data.

**Document Structure:**
```json
{
  "id": "auto_generated_uuid",
  "title": "String (Limit 100 chars)",
  "description": "String (Limit 1000 chars)",
  "status": "Enum ['Upcoming', 'Ongoing', 'Planning', 'Completed']",
  "type": "Enum ['solo', 'team']",
  
  // Ownership & Access Control
  "ownerId": "uid_of_creator",   // The user who created it
  "teamId": "team_uuid_or_null", // If null, it's a solo project. If set, it belongs to that team.
  
  // Dates
  "deadline": "ISO_8601_DateTime_String", // Optional
  "createdAt": "ServerTimestamp",
  "updatedAt": "ServerTimestamp",
  
  // Nested Objects (Sub-resources)
  "resources": [
    {
      "id": "timestamp_string",
      "label": "String",
      "url": "String",
      "type": "Enum ['GitHub', 'Figma', ...]",
      "addedAt": "ISO_String"
    }
  ],
  
  "tasks": [
    {
      "id": "timestamp",
      "text": "String",
      "done": "Boolean",
      "deadline": "ISO_Date_String (Optional)"
    }
  ],
  
  "checklist": [
    // Simpler version of tasks for the 'Quick Tasks' tab
    { "id": "...", "text": "...", "completed": false }
  ]
}
```

### Collection: `teams`
Stores team metadata and membership.

**Document Structure:**
```json
{
  "id": "auto_generated_uuid",
  "name": "String (e.g., 'Code Ninjas')",
  "inviteCode": "String (Unique 6-char alphanumeric, e.g., 'A1B2C3')",
  "createdBy": "uid_of_creator",
  "createdAt": "ServerTimestamp",
  "members": [
    "uid_user_1",
    "uid_user_2",
    "uid_user_3"
  ]
}
```

### Data Access Patterns (Query Logic)
The `useFirestore` hook handles the complex querying logic:

1.  **Solo Mode**:
    *   Query: `hackathons.where('ownerId', '==', currentUser.uid)`
    *   Filter: Client-side filter removes any item where `teamId` is not null.
2.  **Team Mode**:
    *   Query: `hackathons.where('teamId', '==', currentTeam.id)`
    *   Result: Returns all projects belonging to the team, regardless of who created them.

---

## 🔐 Security Infrastructure

Security is handled at both the Application Level (client-side) and Database Level (Firebase Rules).

### 1. `src/utils/security.js`
This module exports critical functions used throughout the app:

*   **`sanitizeText(text)`**:
    *   Replaces characters like `<`, `>`, `&`, `"`, `'` with HTML entities.
    *   Used in `HackathonCard` to prevents Stored XSS attacks when rendering titles/descriptions.
*   **`sanitizeURL(url)`**:
    *   Blocks `javascript:`, `data:`, and `vbscript:` protocols.
    *   Forces `https://` if no protocol is present.
    *   Used in `ResourceManager` before saving links.
*   **`RateLimiter` Class**:
    *   Implements a Token Bucket algorithm in memory.
    *   Example: `addHackathonLimiter` allows max 5 requests per minute.
    *   If a user tries to spam the "Add" button, the request is intercepted before hitting Firebase.
*   **`sanitizeObject(obj, allowedKeys)`**:
    *   Prevents **Prototype Pollution**.
    *   Strips `__proto__`, `constructor`, and `prototype` keys.
    *   Whitelists only expected keys (e.g., `title`, `status`) and discards any junk data injected by a malicious client.

### 2. Authentication Logic
Located in `src/contexts/AuthContext.jsx`.
*   Uses `signInWithPopup` with `GoogleAuthProvider`.
*   We forcefully set `prompt: 'select_account'` to ensure the Google account chooser always appears, preventing auto-login loops with the wrong account.

---

## 🎨 Design System & UI/UX

We use a "Dark Glass" aesthetic inspired by modern developer tools (like Linear, Vercel).

### Color Palette (Tailwind)
*   **Background**: `bg-gray-900` (#0c4a6e) to `bg-black` (#000000). We use deep gradients to avoid flat, boring blacks.
*   **Primary**: `indigo-500` to `purple-600`. Used for "Call to Actions" and accents.
*   **Success**: `emerald-400`. Used for "Completed" status and checklist items.
*   **Danger**: `red-500`. Used for deletions and "Urgent/Overdue" flags.
*   **Glass**: `bg-white/5` or `bg-black/20` with `backdrop-blur-xl`. This creates the frosted glass effect.

### Typography
*   **Headings**: `Space Grotesk`. A geometric sans-serif with quirky details, giving a "tech" feel.
*   **Body**: `Outfit`. A clean, highly legible sans-serif for dense information.

### Component Styling Rules
1.  **Cards**: Must have `rounded-2xl` and a subtle border `border-white/10`.
2.  **Hover Effects**: All interactive elements must scale (`scale-105`) or brighten on hover.
3.  **Transitions**: Use `transition-all duration-300` for smooth state changes.
4.  **Scrollbars**: Custom thin scrollbars defined in `index.css` to match the dark theme.

---

## 📂 File Structure & Module Breakdown

This comprehensive tree explains every file in the `src` directory.

```text
src/
├── components/                 # UI Components
│   ├── AddModal.jsx           # The "Create/Edit" overlay form
│   ├── Dashboard.jsx          # GRID view controller for hackathons
│   ├── HackathonCard.jsx      # The complex card UI (tabs, progress, timers)
│   ├── LandingPage.jsx        # Public marketing page for logged-out users
│   ├── Login.jsx              # 3D Tilt login card component
│   ├── NotificationBell.jsx   # Polls for deadlines < 6 hours
│   ├── ResourceManager.jsx    # Sub-component for managing URL lists
│   └── TeamManager.jsx        # Sidebar/Modal for creating & joining teams
│
├── contexts/                   # React Context Providers
│   ├── AuthContext.jsx        # Handles Firebase Auth user state
│   └── TeamContext.jsx        # Handles Team selection, creation, and members
│
├── hooks/                      # Custom Logic Hooks
│   ├── useFirestore.js        # The core data layer (CRUD + Realtime Sync)
│   └── useLocalStorage.js     # (Legacy) Kept for non-critical local preferences
│
├── utils/                      # Helper Functions
│   └── security.js            # XSS protection, rate limiting, validation
│
├── App.jsx                     # Main Application Controller
├── firebase.js                 # Firebase initialization & config export
├── index.css                   # Global Tailwind imports & custom classes
└── main.jsx                    # React Root entry point
```

---

## 🧩 State Management (Context API)

### 1. AuthContext (`src/contexts/AuthContext.jsx`)
*   **State**: `currentUser` (User Object), `loading` (Boolean).
*   **Logic**:
    *   Initializes `onAuthStateChanged` listener on mount.
    *   Exposes `login()` wrapper for Google Sign-In.
    *   Exposes `logout()` wrapper for Firebase Sign-Out.
*   **Usage**: Wrapped around the entire app in `main.jsx` so `currentUser` is available everywhere.

### 2. TeamContext (`src/contexts/TeamContext.jsx`)
*   **State**: `currentTeam` (Object | null), `userTeams` (Array).
*   **Logic**:
    *   **Listeners**: Listens to `teams` collection where `members` array contains `currentUser.uid`.
    *   **Switching**: When `currentTeam` is null, the app is in "Solo Mode". When set, it enters "Team Mode".
    *   **Operations**: `createTeam` (generates code), `joinTeam` (validates code).

---

## ⚓ Custom Hooks Reference

### `useFirestore(collectionName)`
This is the most critical hook in the application.

**Parameters**: `collectionName` (String) - usually 'hackathons'.

**Returns**:
*   `data` (Array): The real-time list of documents.
*   `loading` (Boolean): True while initial fetch happens.
*   `error` (String | null): Error message if fetch fails.
*   `addItem(item)`: Async function to add doc.
*   `updateItem(id, updates)`: Async function to patch doc.
*   `deleteItem(id)`: Async function to remove doc.

**Internal Logic**:
1.  Checks if `currentUser` exists. If not, returns empty data.
2.  Checks `TeamContext`.
3.  If `currentTeam` is set -> Sets up listener for `where('teamId', '==', currentTeam.id)`.
4.  If `currentTeam` is null -> Sets up listener for `where('ownerId', '==', currentUser.uid)`.
5.  Updates `data` state whenever the listener fires (Real-time).

---

## ⚛️ Component Encyclopedia

This section serves as a manual for every UI component.

### App Entry Point (`App.jsx`)
*   **Role**: The "Brain" of the UI.
*   **Key Responsibilities**:
    1.  **Routing**: Decides whether to show `LandingPage` (if !user) or `Dashboard` (if user).
    2.  **Layout**: Renders the persistent `Header` (with Logo, Team Switcher, Profile).
    3.  **Modals**: Holds the state (`isModalOpen`) for the Add/Edit form.
    4.  **Error Boundaries**: Displays global error banners from Firestore hooks.
*   **State Diagram**:
    *   `showLogin` (Bool): Toggles between Landing Page and Login Form.
    *   `activeTab` (String): (Legacy logic moved to Dashboard) 'solo' vs 'team'.

### Authentication Components

#### `LandingPage.jsx`
*   **Role**: Sales page for the app.
*   **Features**:
    *   **3D Tilt Effect**: Uses Framer Motion `useMotionValue` to create a pseudo-3D parallax effect on the cursor.
    *   **Feature Grid**: Static cards explaining value prop.
    *   **Tech Stack**: Badges showing React, Firebase, etc.

#### `Login.jsx`
*   **Role**: The actual login form.
*   **Features**:
    *   Interactive glass card that follows mouse movement.
    *   "Sign in with Google" button with loading state handling.
    *   Error handling for pop-up closures or network issues.

### Dashboard & Navigation

#### `Dashboard.jsx`
*   **Role**: The main grid view.
*   **Sorting Algorithm**:
    1.  **Priority 1**: "Critical Attention" (Deadline < 48 hours).
    2.  **Priority 2**: "Active Projects" (Status == 'Ongoing').
    3.  **Priority 3**: Everything else, sorted by Date.
*   **Props**: `hackathons` (Array), `onEdit`, `onDelete`, `isTeamView`.
*   **Visual Groups**: It visually separates these priorities into different sections with headers ("🔥 Critical Attention").

#### `NotificationBell.jsx`
*   **Role**: Urgent alert system.
*   **Logic**:
    *   Runs a `setInterval` every 60 seconds.
    *   Filters `hackathons` to find any with `deadline` within 6 hours.
    *   Displays a red badge count if alerts exist.
*   **UI**: A dropdown menu showing exactly how many hours/minutes are left for urgent items.

### Hackathon Card System

#### `HackathonCard.jsx`
The most complex component, containing 790+ lines of code.

*   **Design**: Fixed height card with internal scrollable content.
*   **Tabs Architecture**:
    *   **Overview**: Shows description + Progress Bar.
    *   **Tasks**: A mini Todo list for that specific project.
    *   **Resources**: List of links (GitHub, etc.).
    *   **Quick Tasks**: A checklist overlay.
*   **Smart Features**:
    *   **Timer**: Calculates `timeLeft` and updates every minute. Changes color (Red/Orange/Gray) based on urgency.
    *   **Progress Bar**: Dynamically calculates `%` based on `completedTasks / totalTasks`.
*   **Props**: `hackathon` (Object), `onUpdate` (Function).

### Modals & Forms

#### `AddModal.jsx`
*   **Role**: The form to Create or Edit a hackathon.
*   **Tabs**: Supports toggling between `Solo` and `Team` type (though usually inferred from context).
*   **Validation**:
    *   Title < 100 chars.
    *   Description < 1000 chars.
    *   Status must be valid Enum.
*   **Sub-components**: Embeds `ResourceManager` for handling the links array.

#### `ResourceManager.jsx`
*   **Role**: Dynamic list manager for links.
*   **Features**:
    *   Input for Label + URL.
    *   Dropdown for Type (GitHub, Canva, etc.).
    *   Security: Validates URL protocol before adding to the list.

### Team Management System

#### `TeamManager.jsx`
*   **Role**: Sidebar/Dropdown for switching contexts.
*   **Modes**:
    1.  **List**: Shows "Solo Workspace" + List of joined teams.
    2.  **Create**: Input for Team Name -> Generates Invite Code.
    3.  **Join**: Input for Invite Code -> Validates & Adds user.
*   **Data**: Consumes `TeamContext` directly.

---

## 🔄 Operational Workflows

### Workflow 1: User Log In
1.  User clicks "Get Started" on Landing Page.
2.  User clicks "Sign In With Google".
3.  `AuthContext` triggers `signInWithPopup`.
4.  Firefox/Chrome opens OAuth window.
5.  On success, `onAuthStateChanged` fires.
6.  `currentUser` state updates.
7.  `App.jsx` re-renders, sees `currentUser` is strictly true, and mounts `Dashboard`.

### Workflow 2: Adding a Hackathon
1.  User clicks "+" button in Header.
2.  `AddModal` opens.
3.  User fills Title, Description, Date.
4.  User clicks "Save".
5.  **Security Check 1**: `RateLimiter` checks if user added > 5 items this minute.
6.  **Security Check 2**: `sanitizeObject` strips malicious keys.
7.  **Data Prep**: Logic in `App.jsx` attaches `ownerId` and (`teamId` OR `type:'solo'`).
8.  **Firestore**: `addDoc` is called on `hackathons` collection.
9.  **Sync**: Firestore triggers `onSnapshot` in `useFirestore` hook.
10. `data` array updates.
11. `Dashboard` re-renders with new card.

### Workflow 3: Switching to a Team
1.  User opens "Teams" dropdown.
2.  User clicks "Create Team".
3.  `TeamContext` generates code "X9Y8Z7" and creates doc in `teams` collection.
4.  User clicks the new team in the list.
5.  `switchTeam(teamId)` is called.
6.  `currentTeam` state updates.
7.  `useFirestore` hook detects change in dependencies (`[currentTeam]`).
8.  It unsubscribes from the "Solo" query.
9.  It subscribes to the "Team" query (`where teamId == X`).
10. `Dashboard` clears and fills with Team Projects.
11. Header updates to show Team Name and "TEAM VIEW" badge.

---

## 💻 Installation & Developer Guide

### Prerequisites
*   **Node.js**: v18.0.0 or higher.
*   **npm**: v9.0.0 or higher.
*   **Git**: For version control.
*   **Firebase Account**: You need a free project at [console.firebase.google.com](https://console.firebase.google.com).

### Step 1: Clone & Install
```bash
# Clone the repository
git clone https://github.com/your-username/hackathon-command-center.git

# Navigate into directory
cd hackathon-command-center

# Install dependencies (This installs React, Vite, Firebase, Tailwind, Framer Motion)
npm install
```

### Step 2: Environment Configuration
You must create a `.env` file in the root directory. Do not commit this file.

```env
# .env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-app-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Step 3: Firebase Console Setup
1.  **Authentication**: Enable **Google Sign-In**.
2.  **Firestore Database**: Create a database in **Production Mode**.
3.  **Rules**: Set strictly or open for dev:
    ```javascript
    // Allow read/write if user is authenticated
    allow read, write: if request.auth != null;
    ```
4.  **Indexes**: If you sort by deadline *and* filter by owner, Firestore might ask you to create a Composite Index. Click the link in the console error to auto-create it.

### Step 4: Run Locally
```bash
# Start the Vite development server
npm run dev
```
Open `http://localhost:5173` in your browser.

### Step 5: Build for Production
```bash
# Compile and Minify
npm run build

# Preview the production build
npm run preview
```
The output will be in the `dist/` folder, ready to deploy to Vercel, Netlify, or Firebase Hosting.

---

### 🐛 Troubleshooting Common Issues

**1. "Firebase Missing Config" Error**
*   *Cause*: `.env` file is missing or variables don't start with `VITE_`.
*   *Fix*: Ensure variables are exactly `VITE_FIREBASE_...` and restart the terminal.

**2. Google Sign-In Popup Closes Immediately**
*   *Cause*: Domain not authorized.
*   *Fix*: Go to Firebase Console -> Authentication -> Settings -> Authorized Domains. Add `localhost`.

**3. Styles looking "broken"**
*   *Cause*: Tailwind validation.
*   *Fix*: Ensure `tailwind.config.js` content array includes `"./src/**/*.{js,jsx}"`.

---

### 🤝 Contributing

We welcome pull requests! distinct areas to improve:
1.  **Kanban View**: Add drag-and-drop columns for status (Planning -> Ongoing -> Completed).
2.  **Dark/Light Mode**: Currently fixed to Dark Mode. Add a toggle.
3.  **Calendar Integration**: Sync deadlines to Google Calendar.

Please ensure you run linting before committing:
```bash
npm run lint
```
