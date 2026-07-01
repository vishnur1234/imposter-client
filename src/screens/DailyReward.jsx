import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useTheme } from "../context/ThemeContext";
import { ChevronLeft, Gift, Lock, Sparkles } from "lucide-react";

export default function DailyReward() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  
  const myUid = auth.currentUser?.uid || "guest";
  const dayInMs = 24 * 60 * 60 * 1000;

  useEffect(() => {
    if (myUid === "guest") {
      setLoading(false);
      return;
    }
    const unsub = onSnapshot(doc(db, "user_stats", myUid), (snap) => {
      if (snap.exists()) {
        setStats(snap.data());
      }
      setLoading(false);
    });
    return () => unsub();
  }, [myUid]);

  const lastClaimed = stats?.lastDailyRewardClaimed || 0;
  const isClaimable = Date.now() - lastClaimed >= dayInMs;

  useEffect(() => {
    const updateTicker = () => {
      const now = Date.now();
      const nextClaimTime = lastClaimed + dayInMs;
      const diff = nextClaimTime - now;

      if (diff <= 0) {
        setTimeRemaining("");
      } else {
        const hrs = Math.floor(diff / (60 * 60 * 1000));
        const mins = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
        const secs = Math.floor((diff % (60 * 1000)) / 1000);
        setTimeRemaining(
          `${String(hrs).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`
        );
      }
    };

    updateTicker();
    const interval = setInterval(updateTicker, 1000);
    return () => clearInterval(interval);
  }, [lastClaimed]);

  const handleClaimReward = async () => {
    if (claiming) return;

    if (!isClaimable) {
      alert(`Chest Locked! Your daily reward is currently recharging. Come back in ${timeRemaining} to unlock it.`);
      return;
    }

    setClaiming(true);
    try {
      const now = Date.now();
      const statsRef = doc(db, "user_stats", myUid);
      const currentHistory = stats?.matchHistory || [];
      const newHistoryItem = {
        gameId: "DAILY_" + Math.random().toString(36).substring(2, 6).toUpperCase(),
        roomCode: "DAILY",
        score: 500,
        timestamp: now
      };
      const updatedHistory = [...currentHistory, newHistoryItem];
      const newHighScore = (stats?.highScore || 0) + 500;

      await setDoc(statsRef, {
        highScore: newHighScore,
        lastDailyRewardClaimed: now,
        matchHistory: updatedHistory
      }, { merge: true });

      alert("Success! Reward unlocked: +500 coins added to your balance.");
    } catch (e) {
      alert("Error: Failed to claim daily reward. " + e.message);
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading Reward Status...</span>
      </div>
    );
  }

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
      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-slate-900 bg-black/30 backdrop-blur-md">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold uppercase tracking-wider"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <span className="text-xs font-extrabold text-slate-200 tracking-widest font-mono">DAILY REWARD</span>
        <div className="w-16" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl backdrop-blur-sm min-h-[460px] justify-between">
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">
              {isClaimable ? "Treasure Chest Ready!" : "Chest Recharging"}
            </h2>
            <p className="text-sm text-slate-400">
              {isClaimable
                ? "Tap the glowing chest below to claim your free daily coin reward!"
                : "You have already claimed today's reward. Come back tomorrow!"}
            </p>
          </div>

          {/* Interactive Chest */}
          <div className="relative my-8">
            <button
              onClick={handleClaimReward}
              disabled={claiming}
              className={`w-36 h-36 rounded-full border-2 flex items-center justify-center transition-all duration-300 relative ${
                isClaimable 
                  ? "border-amber-500 bg-amber-500/5 hover:scale-105 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]" 
                  : "border-slate-850 bg-slate-950"
              }`}
            >
              <div className={`w-28 h-28 rounded-full flex items-center justify-center ${
                isClaimable 
                  ? "bg-gradient-to-br from-amber-300 to-amber-600 animate-pulse" 
                  : "bg-gradient-to-br from-slate-600 to-slate-800"
              }`}>
                <Gift size={56} className="text-white" />
              </div>

              {/* Locked padlock badge */}
              {!isClaimable && (
                <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center shadow-lg">
                  <Lock size={16} className="text-rose-500" />
                </div>
              )}

              {/* Pulsing ring */}
              {isClaimable && (
                <div className="absolute inset-0 w-36 h-36 rounded-full border border-dashed border-amber-500/30 animate-[spin_10s_linear_infinite]" />
              )}
            </button>
          </div>

          {/* Ticker / Button */}
          <div className="w-full">
            {isClaimable ? (
              <button
                onClick={handleClaimReward}
                disabled={claiming}
                className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
              >
                {claiming ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>CLAIM 500 COINS</span>
                  </>
                )}
              </button>
            ) : (
              <div className="w-full bg-slate-950/60 border border-slate-850 rounded-2xl py-4 flex flex-col items-center">
                <span className="text-[10px] font-bold text-slate-500 tracking-wider">NEXT REWARD IN</span>
                <span className="text-2xl font-black text-white mt-1 tracking-widest font-mono">
                  {timeRemaining || "00:00:00"}
                </span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
