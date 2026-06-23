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
      </Routes>
      
    </BrowserRouter>
    </AuthProvider>
  );
}