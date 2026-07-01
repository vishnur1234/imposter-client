import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useTheme } from "../context/ThemeContext";
import { ChevronLeft, Receipt } from "lucide-react";

export default function CoinHistory() {
  const { colors } = useTheme();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const myUid = auth.currentUser?.uid;

  useEffect(() => {
    if (!myUid) {
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
        <span className="text-xs font-extrabold text-slate-200 tracking-widest font-mono">COIN HISTORY</span>
        <div className="w-16" />
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10 flex flex-col items-center">
        <div className="w-full max-w-md space-y-6">
          
          {/* Total balance card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-6 flex flex-col shadow-md">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider">TOTAL COINS ACCUMULATED</span>
            <h1 className="text-3xl font-black text-white mt-1">
              {stats?.highScore ?? 0} <span className="text-sm font-normal text-slate-500">coins</span>
            </h1>
          </div>

          {/* History log list */}
          <div className="space-y-3">
            {stats?.matchHistory && stats.matchHistory.length > 0 ? (
              [...stats.matchHistory]
                .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
                .map((item, idx) => {
                  const dateStr = item.timestamp
                    ? new Date(item.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Unknown Date";
                  const earned = item.score ?? 0;
                  const isEntryFee = item.isEntryFee || earned < 0;
                  const rowKey = `${item.gameId || idx}_${isEntryFee ? "fee" : "score"}`;

                  return (
                    <div
                      key={rowKey}
                      className="flex items-center justify-between p-4 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-sm"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-white leading-none">
                            {item.roomCode === "DAILY"
                              ? "Daily Reward"
                              : isEntryFee
                              ? `Entry Fee: Room ${item.roomCode || "N/A"}`
                              : `Match Score: Room ${item.roomCode || "N/A"}`}
                          </span>
                          {item.roomCode !== "DAILY" && !isEntryFee && (
                            <span className="bg-slate-800 px-2 py-0.5 rounded-md text-[8px] font-mono text-slate-400 tracking-wider">
                              ID: {item.gameId || "N/A"}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500">{dateStr}</span>
                      </div>

                      <div className="text-right">
                        <span className={`text-base font-extrabold ${
                          earned > 0 ? "text-emerald-500" : earned < 0 ? "text-rose-500" : "text-slate-400"
                        }`}>
                          {earned > 0 ? `+${earned}` : `${earned}`}
                        </span>
                      </div>
                    </div>
                  );
                })
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Receipt size={48} className="text-slate-600 mb-4" />
                <span className="text-sm text-slate-500">No transactions recorded yet.</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
