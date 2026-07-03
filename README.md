# Imposter Game - Web Client

A sleek, responsive, and feature-rich social deduction game built with **React**, **Vite**, and **Tailwind CSS**. The game integrates **Firebase Authentication and Firestore** for real-time multiplayer lobbies, and leverages **Google Gemini AI** to generate smart gameplay topics.

---

## 🎮 Game Concept & Rules

**Imposter** (inspired by Undercover, Spyfall, and other social deduction games) pits players against one another:
- **Crewmates (Secret Topic Holders)**: Receive a secret word/topic (e.g., "Library"). They must describe it verbally in one word.
- **The Imposter**: Does not know the secret topic but receives a subtle clue (generated dynamically via Gemini AI, e.g., "A quiet place of learning"). The Imposter must blend in, guess the topic, and avoid detection.
- **Goal**: Crewmates must identify and vote out the Imposter, while the Imposter tries to guess the secret topic or survive the vote.

---

## ⚙️ Tech Stack & Libraries

- **Frontend**: [React 19](https://react.dev/) + [Vite](https://vitejs.dev/) (fast HMR, compilation, and asset pipelines)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (modern responsive designs, curated HSL dark color palettes, gradients)
- **Routing**: [React Router v7](https://reactrouter.com/) for single page app routing ([AppRoutes.jsx](file:///Users/elance/imposter-client/src/routes/AppRoutes.jsx))
- **Backend & Database**: [Firebase v12](https://firebase.google.com/) (Auth for users & guests, Firestore for real-time synced room state & lobbies)
- **AI Engine**: [Google Gemini SDK (@google/genai)](https://www.npmjs.com/package/@google/genai) for category-specific topic and clue generation
- **Icons**: [Lucide React](https://lucide.dev/) for high-quality SVG interface icons

---

## 📂 Project Directory Structure

```
imposter-client/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, styles, logo assets
│   ├── components/         # Reusable structural components (e.g., ProtectedRoute)
│   ├── context/            # AuthContext (Firebase Auth) & ThemeContext (Theme styles/custom variables)
│   ├── firebase/           # firebase.js (DB initialization & configuration)
│   ├── routes/             # AppRoutes.jsx (Central routing table)
│   ├── screens/            # Application screens (21 views covering online/offline/social features)
│   │   ├── Login.jsx & Register.jsx
│   │   ├── Home.jsx
│   │   ├── Profile.jsx & DailyReward.jsx
│   │   ├── CoinHistory.jsx & GlobalRanking.jsx
│   │   ├── GameRules.jsx
│   │   ├── SoloSetup.jsx & GamePlay.jsx (Solo & Online multiplayer modes)
│   │   ├── CreateRoom.jsx, WaitingRoom.jsx, JoinRoom.jsx, RoleReveal.jsx (Online multiplayer lobby screens)
│   │   └── Offline... (6 files for Pass & Play multiplayer mode)
│   ├── demoData.js         # Offline fallback topics when Gemini API is unavailable
│   ├── gemini.js           # Gemini API initialization
│   ├── generateTopic.js    # Service logic to query Gemini models or fallback to demo data
│   ├── App.jsx & App.css   # Main app entrypoint and base animations/styles
│   ├── index.css           # Global Tailwind directives
│   └── main.jsx            # DOM mounting element
├── package.json            # Scripts and dependencies
└── vite.config.js          # Vite compilation config
```

---

## 🖥️ Screen & Routing Breakdown

The client application includes **21 distinct screens**, structured as follows:

### 🔑 Authentication & Navigation
- `/` ([Login.jsx](file:///Users/elance/imposter-client/src/screens/Login.jsx)): User/Guest sign-in.
- `/register` ([Register.jsx](file:///Users/elance/imposter-client/src/screens/Register.jsx)): Account registration.
- `/home` ([Home.jsx](file:///Users/elance/imposter-client/src/screens/Home.jsx)): Core game dashboard showing wallet balance, daily reward trigger, and navigation to Solo, Online Multiplayer, Offline Pass-and-Play, rules, and profile.
- `/profile` ([Profile.jsx](file:///Users/elance/imposter-client/src/screens/Profile.jsx)): User statistics, high score, total matches played, avatar selection, and logout functionality.

### 💰 Progression & Economy System
- `/daily-reward` ([DailyReward.jsx](file:///Users/elance/imposter-client/src/screens/DailyReward.jsx)): Daily login coin claiming module.
- `/coin-history` ([CoinHistory.jsx](file:///Users/elance/imposter-client/src/screens/CoinHistory.jsx)): Detailed ledger displaying entry fee deductions, match wins, and reward credits.
- `/rankings` ([GlobalRanking.jsx](file:///Users/elance/imposter-client/src/screens/GlobalRanking.jsx)): Leaderboard showing top-ranked users worldwide by aggregate score.
- `/rules` ([GameRules.jsx](file:///Users/elance/imposter-client/src/screens/GameRules.jsx)): Educational instructions detailing game mechanics, crewmate strategies, and imposter tips.

### 👥 Online Multiplayer Mode (Real-Time Firestore Sync)
- `/multiplayer` ([MultiplayerLobby.jsx](file:///Users/elance/imposter-client/src/screens/MultiplayerLobby.jsx)): Main multiplayer screen for finding existing rooms or initiating room creation.
- `/createroom` ([CreateRoom.jsx](file:///Users/elance/imposter-client/src/screens/CreateRoom.jsx)): Room customizer setting topic category (ACCA, CMA, Bank, Movie, General) and entry fees.
- `/joinroom` ([JoinRoom.jsx](file:///Users/elance/imposter-client/src/screens/JoinRoom.jsx)): Input modal to join via alphanumeric code.
- `/waiting-room` ([WaitingRoom.jsx](file:///Users/elance/imposter-client/src/screens/WaitingRoom.jsx)): Pre-game waiting room synchronizing player statuses.
- `/reveal` ([RoleReveal.jsx](file:///Users/elance/imposter-client/src/screens/RoleReveal.jsx)): Secret assignment screen displaying roles (with dynamic animations and hiding features).
- `/gameplay` ([GamePlay.jsx](file:///Users/elance/imposter-client/src/screens/GamePlay.jsx)): Core game loop interface including active game state, clues list, voting boards, chat, and victory checks.

### 📶 Offline Pass-and-Play Mode
Optimized for single-device groups or synchronized offline groups via manual room updates.
- `/offline-lobby` ([OfflineWaitingLobby.jsx](file:///Users/elance/imposter-client/src/screens/OfflineWaitingLobby.jsx)): Lobby listing nearby or local players joining the offline game.
- `/offline-reveal` ([OfflineRoleReveal.jsx](file:///Users/elance/imposter-client/src/screens/OfflineRoleReveal.jsx)): Individual secret card reveal. Imposters get clues; crewmates get the exact topic.
- `/offline-turn` ([OfflineTurn.jsx](file:///Users/elance/imposter-client/src/screens/OfflineTurn.jsx)): Screen managing whose turn it is to give their verbal description.
- `/offline-round-end` ([OfflineRoundEnd.jsx](file:///Users/elance/imposter-client/src/screens/OfflineRoundEnd.jsx)): Overview of the completed round, prompting players to begin voting.
- `/offline-voting` ([OfflineVoting.jsx](file:///Users/elance/imposter-client/src/screens/OfflineVoting.jsx)): Grid where players cast votes to identify the suspected Imposter.
- `/offline-result` ([OfflineResult.jsx](file:///Users/elance/imposter-client/src/screens/OfflineResult.jsx)): Winner announcement, coin tally distributions, entry fee settlements, and rematch initialization.

---

## 🧠 Topic Generation & Gemini AI

The application dynamically generates topics and clues using `gemini-2.5-flash` under [generateTopic.js](file:///Users/elance/imposter-client/src/generateTopic.js).
1. Takes a custom category (e.g., ACCA, CMA, Banking, Movies, General).
2. Generates a secret topic and **exactly one clue** designed to guide the Imposter without immediately spoiling it for the Crewmates.
3. Automatically falls back to a clean offline dataset ([demoData.js](file:///Users/elance/imposter-client/src/demoData.js)) if no internet connection is present or if the Gemini API key is missing.

---

## 🛠️ Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### Install Dependencies
```bash
npm install
```

### Configure Environment Variables
Create a `.env` file in the root directory and supply your Firebase credentials and Gemini API configuration:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Run Locally
Launch the Vite development server:
```bash
npm run dev
```

### Production Build
Build optimized production bundles to the `dist/` directory:
```bash
npm run build
```

---

## 📄 Code Quality & Styling
- Linting is managed via **ESLint** ([eslint.config.js](file:///Users/elance/imposter-client/eslint.config.js)).
- Typography relies on custom Google Fonts (specifically `Inter`).
- Colors, border-radii, and gradients are handled through Tailwind's utility classes.
