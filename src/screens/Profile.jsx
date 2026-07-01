import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useTheme } from "../context/ThemeContext";
import { ChevronLeft, Trophy, Gamepad2, User } from "lucide-react";

export default function Profile() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const myUid = auth.currentUser?.uid;
  const userEmail = auth.currentUser?.email || "No Email";

  useEffect(() => {
    if (!myUid) {
      setLoading(false);
      return;
    }

    const unsub = onSnapshot(doc(db, "user_stats", myUid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setStats(data);
        setPlayerName(data.playerName || data.name || userEmail.split("@")[0]);
      } else {
        setPlayerName(userEmail.split("@")[0]);
      }
      setLoading(false);
    });

    return () => unsub();
  }, [myUid, userEmail]);

  const handleSave = async () => {
    const cleanName = playerName.trim();
    if (!cleanName) {
      alert("Please enter a valid gaming name.");
      return;
    }

    setSaving(true);
    try {
      const statsRef = doc(db, "user_stats", myUid);
      await setDoc(statsRef, {
        playerName: cleanName,
        name: cleanName
      }, { merge: true });

      alert("Success! Gaming name updated successfully.");
    } catch (e) {
      alert("Error: Failed to save name: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading Profile...</span>
      </div>
    );
  }

  const initials = playerName
    ? playerName.substring(0, 2).toUpperCase()
    : userEmail.substring(0, 2).toUpperCase();

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, #1a0533 0%, #050508 60%)",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-slate-900 bg-black/30 backdrop-blur-md">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold uppercase tracking-wider"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <span className="text-xs font-extrabold text-slate-200 tracking-widest font-mono">PROFILE</span>
        <div className="w-16" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10 flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          {/* Avatar card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 flex flex-col items-center shadow-xl backdrop-blur-sm">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">
              {initials}
            </div>
            <h3 className="text-lg font-bold text-white mt-4">
              {stats?.playerName || userEmail.split("@")[0]}
            </h3>
            <span className="text-xs text-slate-400 mt-1">
              {userEmail}
            </span>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center shadow-md backdrop-blur-sm">
              <Trophy className="text-amber-500" size={24} />
              <span className="text-xl font-black text-white mt-2">
                {stats?.highScore ?? 0}
              </span>
              <span className="text-[10px] font-bold text-slate-500 tracking-wider mt-1">COINS BALANCE</span>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col items-center shadow-md backdrop-blur-sm">
              <Gamepad2 className="text-violet-500" size={24} />
              <span className="text-xl font-black text-white mt-2">
                {stats?.totalMatches ?? 0}
              </span>
              <span className="text-[10px] font-bold text-slate-500 tracking-wider mt-1">MATCHES PLAYED</span>
            </div>
          </div>

          {/* Form settings */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl backdrop-blur-sm space-y-4">
            <span className="text-xs font-bold text-violet-500 tracking-wider uppercase block">GAMING NAME SETUP</span>
            <p className="text-xs text-slate-400 leading-relaxed">
              Choose a unique gaming tag that other players will see when you host or join game lobbies.
            </p>
            
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter gaming tag..."
              maxLength={18}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-white outline-none focus:border-violet-500 transition text-sm"
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center transition active:scale-[0.98]"
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>SAVE GAMING TAG</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
