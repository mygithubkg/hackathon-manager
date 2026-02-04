# 🚀 Hackathon Command Center

> A modern, centralized dashboard to manage hackathon resources, tracks, and progress. Built with React, Tailwind CSS, and powered by Firebase Firestore for real-time cloud synchronization.

![Project Status](https://img.shields.io/badge/Status-Complete-success)
![React](https://img.shields.io/badge/React-18.3-blue)
![Vite](https://img.shields.io/badge/Vite-5.1-purple)
![Firebase](https://img.shields.io/badge/Firebase-12.8-orange)
![Tailwind](https://img.shields.io/badge/Tailwind-3.4-cyan)

---

## 📖 Table of Contents

1. [What is This Project?](#-what-is-this-project)
2. [Why Was This Built?](#-why-was-this-built)
3. [Key Features](#-key-features)
4. [Technologies Used](#-technologies-used)
5. [Project Structure Explained](#-project-structure-explained)
6. [Getting Started (Step-by-Step)](#-getting-started-step-by-step)
7. [How to Use the App](#-how-to-use-the-app)
8. [Understanding the Code](#-understanding-the-code)
9. [Firebase Setup Guide](#-firebase-setup-guide)
10. [Troubleshooting](#-troubleshooting)
11. [Future Enhancements](#-future-enhancements)
12. [Contributing](#-contributing)
13. [License](#-license)

---

## 🎯 What is This Project?

The **Hackathon Command Center** is a web application that helps you organize and track all your hackathon projects in one place. Think of it as a personal dashboard where you can:

- **Add hackathon projects** with details like name, status, and dates
- **Store important links** like GitHub repos, Figma designs, and Notion docs
- **Track progress** with visual status indicators (Ongoing, Completed, Planning)
- **Access your data anywhere** because it's stored in the cloud (Firebase Firestore)

### Perfect For:
- Students participating in multiple hackathons
- Developers managing side projects
- Teams collaborating on hackathon submissions
- Anyone who wants to organize project resources beautifully

---

## 💡 Why Was This Built?

Managing multiple hackathons can get messy fast! You might have:
- GitHub links scattered across browser bookmarks
- Design files saved in random folders
- Project details written on sticky notes
- No way to track which projects are active or completed

This app solves that by providing a **single, beautiful dashboard** where everything lives together.

---

## ✨ Key Features

### 🔥 Real-Time Cloud Sync
- All your data is stored in **Firebase Firestore** (Google's cloud database)
- Changes appear instantly across all your devices
- No more "lost data" when you clear your browser cache

### 🎨 Beautiful User Interface
- **Dark Mode Design**: Easy on the eyes, modern aesthetic
- **Glassmorphism Effects**: Frosted glass-like card designs
- **Smooth Animations**: Cards fade in, buttons animate on hover
- **Fully Responsive**: Works perfectly on phones, tablets, and desktops

### 🛠 Resource Management
- Add multiple resource links to each hackathon
- Common types: GitHub Repos, Figma Designs, Notion Docs, Live Demos
- Edit or delete resources with one click
- Each resource gets an icon based on its type

### 📊 Status Tracking
Three status options for each project:
- **Ongoing** 🔵 (Currently working on it)
- **Completed** 🟢 (Finished and submitted)
- **Planning** 🟡 (Just brainstorming ideas)

### ⚡ Quick Actions
- **Add New Hackathon**: Click the "+" button, fill the form, done!
- **Edit Hackathon**: Update name, status, or date anytime
- **Delete Hackathon**: Remove projects you no longer need
- **Manage Resources**: Add/remove links directly from each card

---

## 🛠 Technologies Used

### Frontend
- **React** (v18.3): JavaScript library for building user interfaces
- **Vite** (v5.1): Super-fast build tool and development server
- **Tailwind CSS** (v3.4): Utility-first CSS framework for styling
- **Framer Motion** (v11.15): Animation library for smooth transitions
- **Lucide React**: Beautiful, consistent icon set

### Backend
- **Firebase Firestore**: NoSQL cloud database for storing hackathon data
- **Firebase SDK** (v12.8): Official library to interact with Firebase

### Development Tools
- **PostCSS**: Tool for processing CSS
- **ESLint**: Code quality checker
- **Git**: Version control system

---

## 📂 Project Structure Explained

Here's what each file and folder does:

```
Manage Resources/
│
├── src/                          # Source code folder
│   ├── components/               # React components (UI pieces)
│   │   ├── LandingPage.jsx      # Landing page for authentication
│   │   ├── Login.jsx            # Login/signup component
│   │   ├── Dashboard.jsx        # Main page showing all hackathons
│   │   ├── HackathonCard.jsx    # Individual card for each hackathon
│   │   ├── AddModal.jsx         # Popup form to add/edit hackathons
│   │   ├── ResourceManager.jsx  # Component to manage resource links
│   │   └── TeamManager.jsx      # Team management component
│   │
│   ├── contexts/                 # React Context for state management
│   │   ├── AuthContext.jsx      # Handles user authentication state
│   │   └── TeamContext.jsx      # Manages team-related data
│   │
│   ├── hooks/                    # Custom React hooks (reusable logic)
│   │   ├── useFirestore.js      # Hook for Firebase database operations
│   │   └── useLocalStorage.js   # Hook for browser local storage
│   │
│   ├── utils/                    # Utility functions
│   │   └── security.js          # Security-related helper functions
│   │
│   ├── App.jsx                   # Main app component (root)
│   ├── main.jsx                  # Entry point (renders App.jsx)
│   ├── firebase.js               # Firebase configuration
│   └── index.css                 # Global styles and Tailwind setup
│
├── index.html                    # HTML template
├── package.json                  # Project dependencies and scripts
├── vite.config.js               # Vite configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── postcss.config.js            # PostCSS configuration
├── .env                         # Environment variables (Firebase keys)
└── README.md                     # This file!
```

---

## 🚀 Getting Started (Step-by-Step)

### Prerequisites (What You Need First)

1. **Node.js** (version 16 or higher)
   - Download from: https://nodejs.org/
   - Check if installed: Open terminal and run `node --version`

2. **npm** (comes with Node.js)
   - Check if installed: Run `npm --version`

3. **Code Editor** (recommended: VS Code)
   - Download from: https://code.visualstudio.com/

4. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/

---

### Step 1: Clone the Repository

Open your terminal (Command Prompt on Windows, Terminal on Mac/Linux) and run:

```bash
# Clone the project
git clone <repository_url>

# Navigate into the project folder
cd "Manage Resources"
```

Or if you downloaded a ZIP file, just extract it and open the folder in your terminal.

---

### Step 2: Install Dependencies

Install all the required packages:

```bash
npm install
```

This will download all the libraries listed in `package.json`. It might take a few minutes.

**What gets installed:**
- React and React DOM
- Vite
- Tailwind CSS
- Framer Motion
- Firebase SDK
- Lucide React (icons)
- And more...

---

### Step 3: Set Up Firebase

#### 3.1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add Project"
3. Enter a project name (e.g., "Hackathon Command Center")
4. Disable Google Analytics (optional for this project)
5. Click "Create Project"

#### 3.2: Create a Firestore Database

1. In your Firebase project, go to **Build** → **Firestore Database**
2. Click "Create Database"
3. Select **"Start in test mode"** (we'll secure it later)
4. Choose a location (closest to you)
5. Click "Enable"

#### 3.3: Get Your Firebase Configuration

1. Go to **Project Settings** (gear icon in top left)
2. Scroll down to "Your apps"
3. Click the **Web** icon (`</>`)
4. Register your app with a nickname (e.g., "Web App")
5. Copy the configuration object (looks like this):

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

#### 3.4: Create the `.env` File

1. In the project root folder (where `package.json` is), create a file named `.env`
2. Add your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
```

**⚠️ Important:**
- Replace `your_api_key_here` with your actual values
- Don't use quotes around the values
- This file should **never** be committed to Git (it's in `.gitignore`)

---

### Step 4: Run the Development Server

Start the app in development mode:

```bash
npm run dev
```

You should see output like:

```
VITE v5.1.0  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

Open your browser and go to `http://localhost:5173/`

**🎉 Congratulations!** Your app should now be running!

---

## 📱 How to Use the App

### Adding Your First Hackathon

1. **Click the "Add Hackathon" button** (big "+" button in the top right)
2. **Fill in the form:**
   - **Name**: Enter the hackathon name (e.g., "DevFest Hackathon 2026")
   - **Status**: Choose Ongoing, Completed, or Planning
   - **Date**: Pick the start date
3. **Click "Add Hackathon"**
4. Your new hackathon card appears on the dashboard!

### Managing Resources

Each hackathon card has a "Resources" section:

1. **Click "Add Resource"** on any card
2. **Enter details:**
   - **Type**: GitHub, Figma, Notion, Demo, or Other
   - **URL**: Paste the link
3. **Click "Add"**
4. **To delete a resource**: Click the trash icon next to it

### Editing a Hackathon

1. **Click the "Edit" button** on any card (pencil icon)
2. **Update the information** in the modal
3. **Click "Update Hackathon"**

### Deleting a Hackathon

1. **Click the "Delete" button** on any card (trash icon)
2. **Confirm deletion**
3. The card disappears from your dashboard

---

## 💻 Understanding the Code

### For Complete Beginners

If you're new to React, here's a simple explanation of how this app works:

#### 1. Components (Building Blocks)

Think of components as LEGO blocks. Each component is a piece of the UI:

- **`App.jsx`**: The main container that holds everything
- **`Dashboard.jsx`**: The grid that displays all hackathon cards
- **`HackathonCard.jsx`**: One card showing a single hackathon
- **`AddModal.jsx`**: The popup form for adding/editing hackathons
- **`ResourceManager.jsx`**: The section inside each card for managing links

#### 2. How Data Flows

```
Firebase Firestore (Cloud Database)
         ↓
   useFirestore Hook (Fetches data)
         ↓
      App.jsx (Stores data in state)
         ↓
   Dashboard.jsx (Receives list of hackathons)
         ↓
   HackathonCard.jsx (Displays each hackathon)
```

#### 3. Key Concepts

**State**: Data that can change (like the list of hackathons)
**Props**: Data passed from parent to child components
**Hooks**: Special functions that let you use React features (like `useState`, `useEffect`)
**Context**: A way to share data across many components without passing props

---

### Component Breakdown

#### `App.jsx` - The Main Hub

**What it does:**
- Imports the `useFirestore` hook to connect to Firebase
- Manages the state for all hackathons
- Handles authentication and team context
- Renders the Dashboard component

**Key code:**
```jsx
const { hackathons, loading, addHackathon, deleteHackathon, updateHackathon } = useFirestore();
```

---

#### `Dashboard.jsx` - The Grid View

**What it does:**
- Receives the list of hackathons as a prop
- Displays them in a responsive grid
- Shows an "empty state" message when there are no hackathons
- Contains the "Add Hackathon" button

**Key features:**
- Responsive grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Animations: Uses Framer Motion for fade-in effects

---

#### `HackathonCard.jsx` - Individual Card

**What it does:**
- Displays one hackathon's details (name, status, date)
- Shows a color-coded status badge
- Contains the ResourceManager component
- Has Edit and Delete buttons

**Visual features:**
- Glassmorphism background: `bg-white/5 backdrop-blur-lg`
- Border glow effect on hover
- Icon changes based on status

---

#### `AddModal.jsx` - Form Popup

**What it does:**
- Popup overlay that appears when adding/editing
- Contains a form with inputs for name, status, and date
- Validates input before submission
- Can be used for both creating and updating hackathons

**Form fields:**
- `name`: Text input (required)
- `status`: Dropdown (Ongoing, Completed, Planning)
- `date`: Date picker

---

#### `ResourceManager.jsx` - Link Management

**What it does:**
- Lists all resources for a hackathon
- Allows adding new resources (type + URL)
- Each resource is displayed with an icon and link
- Delete button for each resource

**Resource types:**
- **GitHub**: Code repository
- **Figma**: Design files
- **Notion**: Documentation
- **Demo**: Live website
- **Other**: Anything else

---

### Custom Hooks Explained

#### `useFirestore.js` - Database Operations

This is the brain of the app! It handles all communication with Firebase.

**What it provides:**
```javascript
{
  hackathons: [],           // Array of all hackathons
  loading: false,           // True while fetching data
  addHackathon,            // Function to create new hackathon
  deleteHackathon,         // Function to remove hackathon
  updateHackathon,         // Function to update hackathon
  addResource,             // Function to add resource link
  deleteResource           // Function to remove resource link
}
```

**How it works:**
1. Connects to Firebase Firestore
2. Sets up a real-time listener
3. Whenever data changes in the database, it updates automatically
4. Provides functions to create, read, update, and delete (CRUD)

---

#### `useLocalStorage.js` - Browser Storage

**What it does:**
- Saves data to browser's local storage
- Useful for saving user preferences
- Persists data even when you close the browser

**Currently used for:**
- Theme preferences (if implemented)
- User settings

---

### Styling with Tailwind CSS

Instead of writing traditional CSS, we use **Tailwind utility classes**:

```jsx
// Traditional CSS
<div className="card">
  <h2 className="title">Hackathon Name</h2>
</div>

// Tailwind CSS
<div className="bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10">
  <h2 className="text-2xl font-bold text-white">Hackathon Name</h2>
</div>
```

**Common classes you'll see:**
- `bg-*`: Background color
- `text-*`: Text color and size
- `p-*`, `m-*`: Padding and margin
- `flex`, `grid`: Layout systems
- `rounded-*`: Border radius
- `hover:*`: Styles on hover

---

### Animations with Framer Motion

We use Framer Motion to make things smooth and interactive:

```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}    // Start state
  animate={{ opacity: 1, y: 0 }}     // End state
  transition={{ duration: 0.3 }}      // How long it takes
>
  Content here
</motion.div>
```

This makes the element fade in and slide up when it appears!

---

## 🔥 Firebase Setup Guide

### Understanding Firestore Structure

Firestore is a **NoSQL database**, meaning it stores data in documents and collections:

```
hackathons (Collection)
  ├── doc1 (Document)
  │   ├── name: "DevFest 2026"
  │   ├── status: "ongoing"
  │   ├── date: "2026-02-15"
  │   └── resources: [...]
  │
  ├── doc2 (Document)
  │   ├── name: "MLH Hackathon"
  │   └── ...
```

**Collection**: Like a folder containing documents
**Document**: A single record (like a JSON object)

---

### Security Rules (Important!)

By default, we started in "test mode" where anyone can read/write. This is NOT secure for production!

**To secure your database:**

1. Go to Firestore → **Rules** tab
2. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Only authenticated users can read/write their own data
    match /hackathons/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

3. Click "Publish"

**What this does:**
- Requires users to be logged in (authenticated)
- Only logged-in users can access the data

---

### Adding Authentication (Optional Enhancement)

Want to add user login? Firebase makes it easy:

1. Go to Firebase Console → **Authentication**
2. Click "Get Started"
3. Enable **Email/Password** or **Google Sign-In**
4. Follow the Firebase Auth documentation

---

## 🐛 Troubleshooting

### Common Issues and Solutions

#### 1. "Cannot find module" Error

**Problem:** Missing dependencies

**Solution:**
```bash
# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

#### 2. Firebase Configuration Error

**Problem:** Firebase not connecting

**Solution:**
- Check that `.env` file exists in the root folder
- Verify all VITE_FIREBASE_* variables are set correctly
- Make sure there are no quotes around the values
- Restart the dev server after changing `.env`

---

#### 3. "localhost refused to connect"

**Problem:** Dev server not running

**Solution:**
```bash
# Make sure the dev server is running
npm run dev

# If port 5173 is busy, Vite will use the next available port
# Check the terminal output for the correct URL
```

---

#### 4. Styles Not Applying

**Problem:** Tailwind CSS not working

**Solution:**
- Check `tailwind.config.js` exists
- Verify `index.css` has the Tailwind directives:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```
- Restart the dev server

---

#### 5. Data Not Saving to Firebase

**Problem:** Firestore operations failing

**Solution:**
- Check browser console for errors (F12 → Console tab)
- Verify Firestore database is created in Firebase Console
- Check Firestore security rules allow read/write
- Ensure internet connection is active

---

#### 6. "Module not found: Can't resolve 'X'"

**Problem:** Import path is wrong

**Solution:**
- Check the file path in the import statement
- Make sure file extension is included (`.jsx`, `.js`)
- Verify the file exists in the correct location

---

## 🚀 Future Enhancements

Here are some ideas to make the app even better:

### Authentication
- [ ] Add user login/signup
- [ ] Each user sees only their hackathons
- [ ] Profile page with user settings

### Team Features
- [ ] Add team members to hackathons
- [ ] Assign roles (Developer, Designer, etc.)
- [ ] Team collaboration tools

### Advanced Features
- [ ] Search and filter hackathons
- [ ] Sort by date, status, or name
- [ ] Calendar view of all hackathons
- [ ] Deadline reminders and notifications
- [ ] Export hackathon data as PDF/CSV

### UI Improvements
- [ ] Light mode toggle
- [ ] Customizable themes
- [ ] Drag-and-drop to reorder cards
- [ ] Image upload for hackathon thumbnails

### Analytics
- [ ] Track time spent on each project
- [ ] Visualize progress with charts
- [ ] Count total hackathons participated in

---

## 🤝 Contributing

Want to improve this project? Contributions are welcome!

### How to Contribute

1. **Fork the repository** (click "Fork" button on GitHub)
2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Manage-Resources.git
   ```
3. **Create a new branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "Add: description of your changes"
   ```
5. **Push to your fork:**
   ```bash
   git push origin feature/your-feature-name
   ```
6. **Create a Pull Request** on GitHub

### Contribution Guidelines

- Write clear commit messages
- Follow the existing code style
- Test your changes before submitting
- Update the README if you add new features
- Be respectful and helpful in discussions

---

## 📚 Learning Resources

Want to learn more about the technologies used?

### React
- [Official React Tutorial](https://react.dev/learn)
- [React Hooks Documentation](https://react.dev/reference/react)

### Tailwind CSS
- [Official Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind UI Components](https://tailwindui.com/components)

### Firebase
- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Getting Started](https://firebase.google.com/docs/firestore/quickstart)

### Vite
- [Vite Guide](https://vitejs.dev/guide/)

### Framer Motion
- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Animation Examples](https://www.framer.com/motion/examples/)

---

## 📄 License

This project is licensed under the MIT License - feel free to use it for learning and personal projects!

---

## 🙏 Acknowledgments

- **Icons**: [Lucide React](https://lucide.dev/)
- **Fonts**: System fonts (optimized for performance)
- **Inspiration**: Modern dashboard designs and glassmorphism trends

---

## 📞 Support

Having trouble? Here's how to get help:

1. **Check the Troubleshooting section** above
2. **Search existing issues** on GitHub
3. **Open a new issue** with:
   - Description of the problem
   - Steps to reproduce
   - Error messages (if any)
   - Your environment (OS, Node version, browser)

---

## 🎉 Final Notes

Congratulations on setting up the Hackathon Command Center! This project is a great way to learn modern web development with React, Tailwind CSS, and Firebase.

**Tips for learning:**
- Experiment with the code! Change colors, layouts, and features
- Read the comments in the code files
- Try adding your own features from the "Future Enhancements" list
- Share your improvements with the community

**Happy coding! 🚀**

---

*Last Updated: February 4, 2026*
