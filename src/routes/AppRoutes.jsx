import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "../screens/Home";
import SoloSetup from "../screens/SoloSetup";
import MultiplayerLobby from "../screens/MultiplayerLobby";
import RoleReveal from "../screens/RoleReveal";
import Login from "../screens/Login";
import { AuthProvider } from "../context/AuthContext";
import ProtectedRoute from "../components/ProtectedRoute";
import Register from "../screens/Register";
import CreateRoom from "../screens/CreateRoom";
import WaitingRoom from "../screens/WaitingRoom";
import JoinRoom from "../screens/JoinRoom";

// New utility and progression screens
import DailyReward from "../screens/DailyReward";
import GameRules from "../screens/GameRules";
import GlobalRanking from "../screens/GlobalRanking";
import Profile from "../screens/Profile";
import CoinHistory from "../screens/CoinHistory";

// Multiplayer Gameplay
import GamePlay from "../screens/GamePlay";

// Offline game mode screens
import OfflineWaitingLobby from "../screens/OfflineWaitingLobby";
import OfflineRoleReveal from "../screens/OfflineRoleReveal";
import OfflineTurn from "../screens/OfflineTurn";
import OfflineRoundEnd from "../screens/OfflineRoundEnd";
import OfflineVoting from "../screens/OfflineVoting";
import OfflineResult from "../screens/OfflineResult";


export default function AppRoutes() {
  return (
    <AuthProvider>
    <BrowserRouter>
    
      <Routes>
         <Route path="/" element={<Login />} />
         <Route path="/register" element={<Register />} />

         <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
         <Route path="/solo" element={<ProtectedRoute><SoloSetup /></ProtectedRoute>} />
         <Route path="/multiplayer" element={<ProtectedRoute><MultiplayerLobby /></ProtectedRoute>} />
         <Route path="/reveal" element={<ProtectedRoute><RoleReveal /></ProtectedRoute>} />
          <Route path="/createroom" element={<ProtectedRoute><CreateRoom /></ProtectedRoute>} />
          <Route path="/waiting-room" element={<ProtectedRoute><WaitingRoom /></ProtectedRoute>} />
          <Route path="/joinroom" element={<ProtectedRoute><JoinRoom /></ProtectedRoute>} />

         {/* New Screen Routes */}
         <Route path="/daily-reward" element={<ProtectedRoute><DailyReward /></ProtectedRoute>} />
         <Route path="/rules" element={<ProtectedRoute><GameRules /></ProtectedRoute>} />
         <Route path="/rankings" element={<ProtectedRoute><GlobalRanking /></ProtectedRoute>} />
         <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
         <Route path="/coin-history" element={<ProtectedRoute><CoinHistory /></ProtectedRoute>} />
         
         <Route path="/gameplay" element={<ProtectedRoute><GamePlay /></ProtectedRoute>} />
         
         <Route path="/offline-lobby" element={<ProtectedRoute><OfflineWaitingLobby /></ProtectedRoute>} />
         <Route path="/offline-reveal" element={<ProtectedRoute><OfflineRoleReveal /></ProtectedRoute>} />
         <Route path="/offline-turn" element={<ProtectedRoute><OfflineTurn /></ProtectedRoute>} />
         <Route path="/offline-round-end" element={<ProtectedRoute><OfflineRoundEnd /></ProtectedRoute>} />
         <Route path="/offline-voting" element={<ProtectedRoute><OfflineVoting /></ProtectedRoute>} />
         <Route path="/offline-result" element={<ProtectedRoute><OfflineResult /></ProtectedRoute>} />
      </Routes>
      
    </BrowserRouter>
    </AuthProvider>
  );
}