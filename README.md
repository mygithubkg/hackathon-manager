# Hackathon Command Center — Complete Technical README

Last updated: March 2, 2026

## 1) What this project is

This is a Vite + React single-page app for managing hackathon projects in solo mode and team mode.

Core capabilities:
- Google authentication (Firebase Auth)
- Real-time project data (Cloud Firestore)
- Team creation/joining with invite codes
- Project cards with tabs for overview, tasks, resources, and quick checklist
- In-app notifications + deadline alerts + optional email notifications (EmailJS)
- Dark, glassmorphism, motion-heavy UI (Tailwind + Framer Motion)

## 2) How the website works end-to-end

1. Browser loads `index.html` and mounts React in `#root`.
2. `src/main.jsx` wraps the app with `BrowserRouter`, `AuthProvider`, and `TeamProvider`.
3. `src/App.jsx` controls auth gate:
     - Logged out: shows marketing page (`LandingPage`) or sign-in page (`Login`)
     - Logged in: enables routes
4. Authenticated routes:
     - `/` → `DashboardPage`
     - `/teams` → `TeamsPage`
5. `DashboardPage` uses `useFirestore('hackathons')` and `useNotifications(hackathons)`.
6. CRUD updates are written to Firestore; onSnapshot listeners update UI in real time.
7. `TeamsPage` switches active team context; dashboard automatically reflects selected context.

## 3) Pages, UX, theme, and visual behavior

### Public pages
- `LandingPage`:
    - Premium hero marketing layout with feature sections
    - Animated backgrounds/orbs, cards, and motion transforms
    - “Launch App” CTA leads to login state
- `Login`:
    - 3D tilt card interaction based on cursor movement
    - Google sign-in button with loader and detailed error handling

### Authenticated pages
- `DashboardPage`:
    - Primary workspace for hackathon projects
    - Desktop sidebar + mobile dock navigation via `DashboardLayout`
    - Add/Edit modal, notifications modal, grouped project display
- `TeamsPage`:
    - Dedicated full page for team context management
    - Modes: view existing contexts, create team, join team

### Design system / UI theme
- Visual theme: dark cyber/glassmorphism
- Typography: Space Grotesk (heading), Outfit (body)
- Interaction: Framer Motion for entrances, hover states, tab transitions, staggered lists
- Color language:
    - Indigo/Purple = primary actions
    - Red = urgent/deletion/critical deadline
    - Emerald = completed/success
- Responsive strategy:
    - Desktop: collapsible left command rail (`DesktopSidebar`)
    - Mobile: floating bottom dock (`MobileDock`)

## 4) Data model, storage, and connectivity

## 4.1 Firestore collections used
- `hackathons`
- `teams`
- `users`
- `notifications`

## 4.2 Hackathon document fields (observed from code)
- Identity/ownership: `ownerId`, `teamId`, `type`
- Core: `title`, `description`, `status`, `deadline`
- Nested arrays: `tasks`, `resources`, `checklist`
- Metadata: `createdAt`, `updatedAt`, optional `deadlineWarned`

## 4.3 Team document fields
- `name`, `inviteCode`, `createdBy`, `createdAt`
- `members` (uid array)
- `memberProfiles` ({ uid, email, displayName }[])

## 4.4 Where data is stored
- Cloud: Firestore is the source of truth for projects, teams, notifications, user profiles.
- Local: `useLocalStorage` exists as legacy helper with validation and size limits.

## 4.5 How data is stored
- Firestore writes happen through:
    - `addDoc`, `updateDoc`, `deleteDoc`, `writeBatch`
    - `serverTimestamp()` for server-side timestamps
- Live reads happen via `onSnapshot` listeners.
- Team-vs-solo filtering:
    - Team mode: query/filter by `teamId`
    - Solo mode: query by `ownerId`, then client-side exclude team-owned items

## 4.6 Security and validation
- Input sanitization: text/URL/object sanitizers in `src/utils/security.js`
- Input safety checks: suspicious patterns detection and length caps
- Client-side rate limiting: add/update/delete action throttling
- CSP + referrer policy defined in `index.html`

## 5) Full file inventory with functions per file

Note: This section covers all project files present in the working tree except generated directories (`node_modules`, `.git` internals).

### Root files

#### `.env`
- Purpose: runtime secrets and API keys (Firebase + EmailJS)
- Functions defined: none

#### `.env.example`
- Purpose: template for environment variables
- Functions defined: none

#### `.firebaserc`
- Purpose: Firebase project alias config
- Functions defined: none

#### `.gitignore`
- Purpose: ignore rules (`node_modules`, `dist`, `.env`, logs, IDE files)
- Functions defined: none

#### `firebase.json`
- Purpose: Firebase CLI config (functions source + ignore patterns)
- Functions defined: none

#### `index.html`
- Purpose: SPA host document, CSP, referrer policy, app root, module entry
- Functions defined: none

#### `package.json`
- Purpose: project metadata, scripts, dependencies
- Functions defined: none

#### `package-lock.json`
- Purpose: deterministic dependency lockfile
- Functions defined: none

#### `postcss.config.js`
- Purpose: PostCSS plugins (`tailwindcss`, `autoprefixer`)
- Functions defined: none (exports config object)

#### `tailwind.config.js`
- Purpose: Tailwind content globs, extended color palette, animations, keyframes
- Functions defined: none (exports config object)

#### `vite.config.js`
- Purpose: Vite + React plugin config, dev server port/open behavior
- Functions defined:
    - default export `defineConfig(...)`

#### `README.md`
- Purpose: technical documentation for the project
- Functions defined: none

#### `.github/copilot-instructions.md`
- Purpose: workspace-level Copilot guidance
- Functions defined: none

#### `srcpages/` (empty directory)
- Purpose: currently unused
- Functions defined: none

### `src/` files

#### `src/main.jsx`
- Purpose: React bootstrap and provider composition
- Functions defined: none named
- Key calls:
    - `ReactDOM.createRoot(...).render(...)`

#### `src/App.jsx`
- Purpose: auth gate + top-level route switch
- Functions defined:
    - `App()`

#### `src/firebase.js`
- Purpose: Firebase app initialization and shared service exports
- Functions defined:
    - `checkFirebaseConfig()`
- Exports:
    - `db`, `auth`, `googleProvider`, default `app`

#### `src/index.css`
- Purpose: Tailwind layers + global classes + reusable utility classes
- Functions defined: none

### `src/hooks/`

#### `src/hooks/useFirestore.js`
- Purpose: Firestore CRUD + realtime sync hook
- Functions defined:
    - `useFirestore(collectionName)`
    - `addItem(item)`
    - `updateItem(id, updates)`
    - `deleteItem(id)`

#### `src/hooks/useLocalStorage.js`
- Purpose: secure localStorage state hook (legacy helper)
- Functions defined:
    - `useLocalStorage(key, initialValue)`
    - `setValue(value)`
    - `handleStorageChange(e)` (inside effect)

#### `src/hooks/useNotifications.js`
- Purpose: deadline alert computation + Firestore notification listener/actions
- Functions defined:
    - `useNotifications(hackathons)`
    - `calculateAlerts()` (inside effect)
    - `markAllRead()`
    - `deleteNotification(id)`
    - `clearAllNotifications()`

### `src/contexts/`

#### `src/contexts/AuthContext.jsx`
- Purpose: auth state, login/logout methods, user profile sync
- Functions defined:
    - `useAuth()`
    - `AuthProvider({ children })`
    - `login()`
    - `logout()`

#### `src/contexts/TeamContext.jsx`
- Purpose: team membership state and team operations
- Functions defined:
    - `useTeam()`
    - `TeamProvider({ children })`
    - `generateInviteCode()`
    - `createTeam(teamName)`
    - `joinTeam(code)`
    - `switchTeam(teamId)`

### `src/utils/`

#### `src/utils/logActivity.js`
- Purpose: activity logging service for Firestore
- Functions defined:
    - `logActivity()`

#### `src/utils/relativeTime.js`
- Purpose: timestamp formatting helpers for readable relative times
- Functions defined:
    - `toDate(value)`
    - `getRelativeTime(timestamp)`

#### `src/utils/security.js`
- Purpose: security helper library
- Functions/classes defined:
    - `sanitizeText(text)`
    - `sanitizeURL(url)`
    - `validateLength(input, maxLength)`
    - `isInputSafe(input)`
    - `sanitizeObject(obj, allowedKeys)`
    - `createSafeHTML(html)`
    - `isValidDate(dateString)`
    - `RateLimiter` class
        - `constructor(maxRequests, timeWindow)`
        - `canProceed(action)`
        - `reset(action)`
- Instances exported:
    - `addHackathonLimiter`
    - `deleteHackathonLimiter`
    - `updateHackathonLimiter`

#### `src/utils/notifications.js`
- Purpose: recipients discovery, notification fan-out, deadline warning workflow
- Functions defined:
    - `getProjectRecipients(hackathon)`
    - `addUser(user)` (inner helper)
    - `notifyUsers(recipients, emailData, notificationData)`
    - `checkDeadlines(hackathons, currentUser)`

#### `src/utils/emailConfig.js`
- Purpose: EmailJS environment-backed constants
- Functions defined: none
- Exports:
    - `EMAILJS_SERVICE_ID`
    - `EMAILJS_TEMPLATE_ID`
    - `EMAILJS_PUBLIC_KEY`

### `src/pages/`

#### `src/pages/AnalyticsPage.jsx`
- Purpose: project and activity analytics dashboard
- Functions defined:
    - `StatCard()`
    - `AnalyticsPage()`

#### `src/pages/DashboardPage.jsx`
- Purpose: authenticated dashboard orchestration page
- Functions defined:
    - `DashboardPage()`
    - `handleTeamClick()`
    - `handleAddHackathon(hackathon)`
    - `handleUpdateHackathon(id, updatedData)`
    - `handleDeleteHackathon(id)`
    - `handleEditClick(hackathon)`
    - `handleCloseModal()`

#### `src/pages/TeamsPage.jsx`
- Purpose: standalone team management page
- Functions defined:
    - `TeamsPage()`
    - `handleTeamSelect(teamId)`
    - `handleCreate(e)`
    - `handleJoin(e)`
    - `copyToClipboard(text, id)`
    - `Background()`
    - `TeamCard({ team, isSolo })`
    - `ActionCard({ title, icon, onClick, colorClass })`

#### `src/pages/ResourcesPage.jsx`
- Purpose: global resource and link management page
- Functions defined:
    - `parseAddedAt(value)`
    - `formatAddedAt(value)`
    - `getResourceIcon(type)`
    - `getReadableFirestoreError(listenerError)`
    - `ResourcesPage()`
    - `resetAddForm()`
    - `closeAddModal()`
    - `openAddModal()`
    - `validateForm()`
    - `handleAddResource()`
    - `handleCopyResource()`
    - `ResourceCard({ resource })`

#### `src/pages/SnippetsPage.jsx`
- Purpose: code snippet management with syntax highlighting
- Functions defined:
    - `getLanguageMeta(language)`
    - `toDate(value)`
    - `hasEditedLabel(createdAt, updatedAt)`
    - `getInitials(name)`
    - `getReadableFirestoreError(listenerError)`
    - `SnippetModal()`
    - `SnippetsPage()`
    - `resetModalForm()`
    - `openCreateModal()`
    - `openEditModal()`
    - `closeModal()`
    - `handleSubmitSnippet()`
    - `handleTogglePinned()`
    - `handleDeleteSnippet()`
    - `handleCopy()`
    - `toggleExpanded()`
    - `renderContentBlock()`

#### `src/pages/TodoPage.jsx`
- Purpose: calendar-based task management
- Functions defined:
    - `formatDateKey(dateValue)`
    - `isOverdue(dueDate, completed)`
    - `getReadableFirestoreError(listenerError)`
    - `getWeekDates(selectedDate)`
    - `TodoPage()`
    - `handleAddTodo()`
    - `handleToggleCompleted()`
    - `handleDeleteTodo()`
    - `tileContent()`

### `src/components/`

#### `src/components/ActivityFeed.jsx`
- Purpose: timeline display for project activities
- Functions defined:
    - `getActivityDescription(log)`
    - `getInitials(name)`
    - `ActivityFeed({ logs, showProject, emptyMessage })`

#### `src/components/AddModal.jsx`
- Purpose: create/edit project modal with validation and resource embedding
- Functions defined:
    - `InputField({ label, icon, ...props })`
    - `SelectField({ label, icon, children, ...props })`
    - `AddModal({ isOpen, onClose, onSave, editingHackathon })`
    - `handleSubmit(e)`

#### `src/components/Dashboard.jsx`
- Purpose: dashboard sectioning, filtering, sorting, grouping, empty-state handling
- Functions defined:
    - `StatCard({ label, value, icon, colorClass, delay })`
    - `Dashboard({ hackathons, onEdit, onDelete, onUpdate, isTeamView })`
    - `handleSecureDelete(id)`

#### `src/components/DashboardLayout.jsx`
- Purpose: shared authenticated layout with ambient background + nav wrappers
- Functions defined:
    - `DashboardLayout({ ...props })`
    - `AmbientBackground()`

#### `src/components/DesktopSidebar.jsx`
- Purpose: desktop command-rail navigation
- Functions defined:
    - `NavItem({ icon, label, active, onClick, badge, collapsed })`
    - `DesktopSidebar({ user, currentTeam, onLogout, onAddClick, onTeamClick, renderNotifications })`

#### `src/components/GlobalSearch.jsx`
- Purpose: command palette for deep searching across entities
- Functions defined:
    - `highlightMatch(text, query)`
    - `GlobalSearch({ hackathons, todos, snippets, activityLogs })`
    - `handleShortcut()`
    - `onSelect()`
    - `handleNav()`

#### `src/components/HackathonCard.jsx`
- Purpose: main project card with multi-tab interactive controls
- Functions defined:
    - `HackathonCard({ hackathon, onEdit, onDelete, onUpdate, updateHackathon })`
    - `calculateTime()` (inside effect)
    - `handleAddTask(e)`
    - `toggleTask(taskId)`
    - `removeTask(taskId)`
    - `handleAddTaskItem(e)`
    - `toggleTaskItem(taskId)`
    - `removeTaskItem(taskId)`
    - `handleAddResource(e)`
    - `removeResource(resourceId)`
    - `getResourceIcon(type)`

#### `src/components/LandingPage.jsx`
- Purpose: pre-auth marketing and product narrative experience
- Functions defined:
    - `GlobalStyles()`
    - `DashboardPreview()`
    - `TeamPreview()`
    - `NotificationPreview()`
    - `ResourcesPreview()`
    - `FeatureSection({ title, description, badge, Icon, VisualComponent, reversed })`
    - `FeatureCard({ icon, title, description, delay })`
    - `handleMouseMove({ currentTarget, clientX, clientY })` (inside `FeatureCard`)
    - `TechStack()`
    - `LandingPage({ onGetStarted })`

#### `src/components/Login.jsx`
- Purpose: auth entry with animated 3D interaction
- Functions defined:
    - `GlobalStyles()`
    - `Login()`
    - `handleMouseMove(event)`
    - `handleMouseLeave()`
    - `handleLogin()`

#### `src/components/MobileDock.jsx`
- Purpose: mobile navigation dock and profile actions
- Functions defined:
    - `MobileNavItem({ icon, label, active, onClick })`
    - `MobileProfileItem({ user, onLogout })`
    - `MobileDock({ user, onLogout, onAddClick, onTeamClick, renderNotifications })`

#### `src/components/NotificationBell.jsx`
- Purpose: bell action + unread badge surface
- Functions defined:
    - `NotificationBell({ unreadCount, totalCount, hasAlerts, onBellClick, className })`

#### `src/components/NotificationModal.jsx`
- Purpose: centered modal for deadline + message notifications
- Functions defined:
    - `NotificationModal({ isOpen, onClose, notifications, deadlineAlerts, onMarkRead, onClearAll, onDelete, unreadCount, totalCount })`
    - `handleClickOutside(event)` (inside effect)
    - `getNotifStyle(type)`

#### `src/components/ResourceManager.jsx`
- Purpose: add/remove resource links with security validation
- Functions defined:
    - `ResourceManager({ resources, onChange })`
    - `handleAddResource()`
    - `handleRemoveResource(id)`
    - `handleKeyPress(e)`

#### `src/components/TeamManager.jsx`
- Purpose: team management component (legacy/optional panel style)
- Functions defined:
    - `TeamManager({ onClose })`
    - `handleCreate(e)`
    - `handleJoin(e)`
    - `copyCode()`

## 6) Connection map (which part talks to which)

- UI Components (`src/components/*`) call page handlers from `src/pages/*`.
- Page handlers call hooks (`useFirestore`, `useNotifications`) and context actions (`useAuth`, `useTeam`).
- Hooks and contexts call Firebase SDK (`src/firebase.js` services).
- Utility layer (`security.js`, `notifications.js`) is consumed by components/pages/hooks.
- Notification pipeline:
    - action occurs in UI → helper builds recipient list → writes Firestore notifications + optional EmailJS mail

## 7) Current route map

- `/` while logged out:
    - `LandingPage` (default)
    - `Login` (when “Get Started” toggles login view)
- `/` while logged in:
    - `DashboardPage`
- `/teams` while logged in:
    - `TeamsPage`
- `/todo` while logged in:
    - `TodoPage`
- `/resources` while logged in:
    - `ResourcesPage`
- `/snippets` while logged in:
    - `SnippetsPage`
- `/analytics` while logged in:
    - `AnalyticsPage`
- `*`:
    - redirect to `/`

## 8) Build/run notes

- Dev server: `npm run dev` (configured for port 3000)
- Production build: `npm run build`
- Preview build: `npm run preview`

## 9) Important implementation notes

- `Planning` exists in UI status options, but AddModal validation currently allows only `Upcoming`, `Ongoing`, `Completed`.
- `TeamManager.jsx` exists but the primary team UX route is `TeamsPage.jsx`.
- `.env` currently holds live-looking credentials; keep this file private and rotate secrets if exposed.
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
