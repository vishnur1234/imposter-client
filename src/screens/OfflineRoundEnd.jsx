import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useTheme } from "../context/ThemeContext";
import { ChevronRight, Flame, Volume2, HelpCircle } from "lucide-react";

export default function OfflineRoundEnd() {
  const { colors } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const { roomCode, course, isHost } = location.state || {};

  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const myUid = auth.currentUser?.uid || "guest";

  useEffect(() => {
    if (!roomCode) {
      alert("Missing room code.");
      navigate("/home");
      return;
    }

    const unsub = onSnapshot(doc(db, "rooms", roomCode), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoomData(data);
        setLoading(false);

        // Redirects
        if (data.gameStatus === "round") {
          navigate("/offline-turn", {
            state: { roomCode, course: data.category || course, isHost }
          });
        } else if (data.gameStatus === "offline_voting") {
          navigate("/offline-voting", {
            state: { roomCode, course: data.category || course, isHost }
          });
        }
      } else {
        alert("Room disbanded.");
        navigate("/home");
      }
    });

    return () => unsub();
  }, [roomCode, isHost, navigate, course]);

  const handleProceedRound = async (endEarly = false) => {
    setSubmitting(true);
    try {
      const currentRound = roomData?.currentRound || 1;
      const totalRounds = roomData?.totalRounds || 3;

      if (currentRound < totalRounds && !endEarly) {
        await updateDoc(doc(db, "rooms", roomCode), {
          currentRound: currentRound + 1,
          gameStatus: "round",
          // Note: hints array accumulates all rounds (filtered in views)
        });
      } else {
        await updateDoc(doc(db, "rooms", roomCode), {
          gameStatus: "offline_voting"
        });
      }
    } catch (e) {
      alert("Error proceeding: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !roomData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Syncing round recap...</span>
      </div>
    );
  }

  const { players = [], currentRound = 1, totalRounds = 3, hints = [] } = roomData;
  const roundHints = hints.filter(h => h.round === currentRound);

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
      <div className="flex-grow flex items-center justify-center p-6 z-10">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[460px]">
          
          <div className="w-full flex justify-between items-center mb-6">
            <span className="bg-emerald-500/10 border border-emerald-500/35 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest text-emerald-400 font-mono">
              ROUND {currentRound} COMPLETED
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">RECAP</span>
          </div>

          <div className="flex-1 flex flex-col justify-between w-full py-2">
            <h3 className="text-sm font-bold text-slate-350 text-center mb-4">
              Verbal Clues recap:
            </h3>

            {/* List of speakers */}
            <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2.5 mb-6 pr-1">
              {players.map((player) => {
                const spoke = roundHints.some(h => h.uid === player.uid);
                return (
                  <div
                    key={player.uid}
                    className="flex items-center justify-between p-3.5 border rounded-2xl bg-slate-950 border-slate-850"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500 flex items-center justify-center text-xs font-black text-violet-400 font-mono">
                        {player.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className="text-xs font-bold text-slate-300">{player.name}</span>
                    </div>

                    <div>
                      {spoke ? (
                        <span className="text-[9px] font-black text-emerald-400 tracking-wider">SPOKEN</span>
                      ) : (
                        <span className="text-[9px] font-black text-rose-500 tracking-wider">SKIPPED</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Control Panel */}
            {isHost ? (
              <div className="space-y-2.5">
                {currentRound < totalRounds ? (
                  <>
                    <button
                      onClick={() => handleProceedRound(false)}
                      disabled={submitting}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
                    >
                      <ChevronRight size={18} />
                      <span>START ROUND {currentRound + 1}</span>
                    </button>
                    
                    <button
                      onClick={() => handleProceedRound(true)}
                      disabled={submitting}
                      className="w-full border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
                    >
                      <Flame size={16} />
                      <span>END GAME & VOTE NOW</span>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => handleProceedRound(false)}
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
                  >
                    <Flame size={16} />
                    <span>PROCEED TO VOTING</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="w-full bg-violet-500/10 border border-violet-500/30 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs text-violet-400">
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Waiting for host to proceed...</span>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
