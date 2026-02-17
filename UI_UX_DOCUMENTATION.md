# 🎨 UI/UX Documentation - Hackathon Command Center v2.0

> **"A premium, centralized command center for high-performance hackathon teams."**

This document serves as a comprehensive guide for UI/UX developers, designers, and frontend engineers to understand the visual architecture, design system, and user experience flows of the application.

---

## 🛠 Technology Stack

The frontend is built on a modern, performance-focused stack:

| Category | Technology | Usage |
| :--- | :--- | :--- |
| **Framework** | **React 18** | Component-based UI architecture. |
| **Build Tool** | **Vite** | Blazing fast HMR and build optimization. |
| **Styling** | **Tailwind CSS 3** | Utility-first styling with custom configuration. |
| **Animations** | **Framer Motion** | Complex layout transitions, spring animations, and micro-interactions. |
| **Icons** | **Lucide React** | Consistent, stroke-based vector icons. |
| **Backend/State** | **Firebase** | Real-time database (Firestore) & Authentication. |

---

## 💎 Design System

### 1. Color Palette & Theme
The application uses a **"Cyberpunk / Glassmorphism"** aesthetic, characterized by dark backgrounds, neon accents, and translucent surfaces.

- **Backgrounds**: Deep variations of Gray/Black (`bg-gray-900`, `#030303`).
- **Glass Panels**: `bg-white/5` or `bg-gray-800/50` with `backdrop-blur-xl`.
- **Primary Gradients**:
  - **Indigo/Purple**: Main brand identity (`from-indigo-500 to-purple-600`).
  - **Status Colors**:
    - 🔥 **Critical**: Red/Rose (`red-500`)
    - ⚡ **Active**: Amber/Yellow (`amber-500`)
    - ✅ **Success**: Emerald/Green (`emerald-500`)
    - 🧊 **Future**: Cyan/Blue (`cyan-500`)

### 2. Typography
- **Headings**: `Space Grotesk` - Technical, modern, geometric.
- **Body**: `Outfit` - Clean, legible, friendly sans-serif.

### 3. UI Effects
- **Glassmorphism**: Heavy use of `backdrop-filter: blur()` combined with semi-transparent borders (`border-white/10`) to create depth.
- **Glows**: `box-shadow` and absolute positioned gradient orbs behind elements to create "neon" lighting effects.
- **Noise**: Subtle grain overlays (in Landing Page) for texture.

---

## 📐 Page Structure & Wireframes

### 1. Landing Page (`LandingPage.jsx`)
*Entry point for unauthenticated users.*

**Wireframe Layout:**
```
[ Navigation Bar: Logo (Left) | "Launch App" Button (Right) ]
      (Glassmorphic, Sticky)

[ Hero Section ]
   - "Status: Fully Functional" Badge
   - Huge Typography: "Centralized Hackathon Manager"
   - CTA Buttons: "Get Started"
   - Tech Stack Badges (React, Firebase, etc.)

[ 3D Dashboard Preview ]
   - Tilted 3D Card showing abstract UI representation
   - Scroll-linked rotation effect

[ Feature Sections (Alternating Layout) ]
   - Section 1: Team Collaboration (Text Left | Visual Right)
   - Section 2: Resource Hub (Visual Left | Text Right)
   - Section 3: Smart Notifications (Text Left | Visual Right)

[ Footer: Clean links, Copyright ]
```

### 2. Main Dashboard (`App.jsx` + `Dashboard.jsx`)
*The central workspace. Accessible after login.*

**Wireframe Layout:**
```
[ Header Bar ]
   - Logo / Team Name
   - "Team View" Badge (if applicable)
   - Right Side: 
       [Notification Bell] [Team Switcher Button] [User Profile] [Sign Out] [ + Add Hackathon ]

[ Main Content Area ]
   [ HUD Stats Row ] -> 3 Cards: Total Protocols | Active Sprints | Shipped

   [ Dashboard Controls ]
       - Title: "My Projects" / "Team Command"
       - Tabs (Solo Only): [ 👤 Solo ] [ 👥 Team ] (Liquid switch animation)

   [ Projects Grid ]
       (Dynamically Grouped by Urgency)
       
       --- 🔥 Critical Attention (Deadline < 48hrs) ---
       [ Hackathon Card ] [ Hackathon Card ]
       
       --- 💻 Active Projects ---
       [ Hackathon Card ] [ Hackathon Card ] [ Hackathon Card ]
       
       --- 📅 Planned & Completed ---
       [ Hackathon Card ]
```

### 3. The Hackathon Card (`HackathonCard.jsx`)
*The core unit of the interface. A highly interactive, tabbed card.*

**Internal Structure:**
```
[ Card Header ]
   - Title
   - Edit / Delete Quick Actions (visible on hover)
   - Status Badge (Upcoming/Ongoing/etc.)
   - Countdown Timer (if urgency detected)
   - Progress Bar (Visual % read-out)

[ Tab Navigation ]
   [ Overview ] [ Tasks (Count) ] [ Resources (Count) ] [ Quick Tasks (Count) ]

[ Tab Content Area (Scrollable fixed height) ]
   - Overview: Description + Stats Grid
   - Tasks: Checklist items with Deadlines + "Add Task" Input
   - Resources: Links List (GitHub, Figma, etc.) + "Add Resource" Form
   - Quick Tasks: Simple Checkbox List
```

### 4. Team Manager (`TeamManager.jsx`)
*Modal/Dropdown for managing workspace context.*

**UI Flow:**
- **List Mode**: Shows current team + list of joined teams.
- **Create Mode**: Simple form to name a new team.
- **Join Mode**: 6-digit code input field to join an existing squad.

---

## ⚡ User Experience (UX) Flows

### A. The "Urgency-First" Dashboard
**Problem**: Users lose track of deadlines in a sea of cards.
**Solution**:
1.  **Auto-Sorting**: The dashboard automatically groups projects. Projects due within 48 hours are physically moved to the top under a "🔥 Critical Attention" section.
2.  **Visual Cues**: Urgent cards get a pulsing red glow border and a countdown timer.
3.  **Real-Time**: The countdown updates every minute.

### B. Tabbed Card Interaction
**Problem**: Too much information (tasks, links, notes) makes cards cluttered.
**Solution**:
1.  **Internal Tabs**: The card acts like a mini-app. State is preserved within the card.
2.  **Progress Tracking**: A progress bar in the card header is always visible, regardless of the active tab.
3.  **Smooth Transitions**: Switching tabs uses `AnimatePresence` for a smooth slide-in/slide-out effect, making the card feel responsive.

### C. Resource Management
**Problem**: Losing links to design files or repos.
**Solution**:
1.  **Smart Detection**: When adding a link, the system checks the URL.
2.  **Auto-Iconography**: If the user pastes a GitHub link, a GitHub icon appears. Same for Drive, Figma, etc.
3.  **Security**: Inputs are sanitized to prevent XSS.

### D. Notification System
**Problem**: Missing updates from teammates.
**Solution**:
1.  **Red Badge**: Appears on the bell icon with a count.
2.  **Dropdown Feed**: Shows two types of alerts:
    *   **System Alerts**: "Project X is due in 2 hours" (Calculated locally/real-time).
    *   **Activity Alerts**: "John added a new task" (From Firestore).

---

## 📱 Responsiveness

The application is fully responsive using Tailwind's breakpoint system:

- **Mobile (< 768px)**:
  - Grid: 1 Column.
  - Sidebar/Modals: Full width.
  - Notifications: Full screen takeover or large dropdown.
- **Tablet (768px - 1024px)**:
  - Grid: 2 Columns.
- **Desktop (> 1024px)**:
  - Grid: 3 Columns.
  - Hover effects enabled.

---

## 🎭 Animation Guide (Framer Motion)

- **Entry**: `initial={{ opacity: 0, y: 20 }}` -> `animate={{ opacity: 1, y: 0 }}`. Used for almost all cards and lists.
- **Hover**: Scale up (`scale: 1.05`) + Glow intensity increase.
- **Layout Changes**: The `layout` prop is critical. When filtering tabs (Solo vs Team), cards physically move to their new positions smoothly instead of snapping.
- **Micro-interactions**:
  - Buttons tap effect: `scale: 0.95`.
  - Tab highlight: A sliding background (`layoutId="activeTab"`) moves behind the active tab text.

---

## 🔧 Developer Notes for UI Updates

1.  **Components**: Always reuse `HackathonCard` for project displays. Do not create new card variations; extend the existing filtered view logic.
2.  **Icons**: Use `Lucide React`. Set `strokeWidth={2}` for standard icons, `{1.5}` for large hero icons.
3.  **Z-Index Management**:
    - `z-50`: Modals and Dropdowns (Notifications).
    - `z-40`: Sticky Header.
    - `z-10`: Interactive cards.
