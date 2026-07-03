import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useTheme } from "../context/ThemeContext";
import { ChevronRight, Clock, Volume2 } from "lucide-react";

export default function OfflineTurn() {
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

        // Host transition logic when round turns are finished
        if (isHost && data.gameStatus === "round") {
          const playersList = data.players || [];
          const roundHints = (data.hints || []).filter(h => h.round === (data.currentRound || 1));
          if (playersList.length > 0 && roundHints.length >= playersList.length) {
            updateDoc(doc(db, "rooms", roomCode), {
              gameStatus: "round-end"
            }).catch(err => console.log("Failed to transition to round-end:", err));
          }
        }

        // Redirect when round ends
        if (data.gameStatus === "round-end") {
          navigate("/offline-round-end", {
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

  const handlePass = async () => {
    setSubmitting(true);
    try {
      const currentRound = roomData?.currentRound || 1;
      const myPlayerObj = roomData?.players?.find(p => p.uid === myUid) || { name: "You" };

      await updateDoc(doc(db, "rooms", roomCode), {
        hints: arrayUnion({
          round: currentRound,
          uid: myUid,
          name: myPlayerObj.name,
          hint: "PASS"
        })
      });
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !roomData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Syncing turn state...</span>
      </div>
    );
  }

  const { players = [], currentRound = 1, totalRounds = 3, hints = [] } = roomData;
  const roundHints = hints.filter(h => h.round === currentRound);
  const currentTurnIndex = roundHints.length;
  const isMyTurn = currentTurnIndex < players.length && players[currentTurnIndex]?.uid === myUid;
  const activePlayer = currentTurnIndex < players.length ? players[currentTurnIndex] : null;

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
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-between min-h-[460px] text-center">

          <div className="w-full flex justify-between items-center mb-6">
            <span className="bg-violet-500/10 border border-violet-500/35 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest text-violet-400 font-mono">
              ROUND {currentRound} OF {totalRounds}
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">OFFLINE HINTS</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center w-full py-8">
            <Volume2 size={48} className="text-cyan-400 animate-pulse mb-6" />

            {isMyTurn ? (
              <div className="space-y-4">
                <h2 className="text-2xl font-black text-white font-mono">⚡ IT'S YOUR TURN!</h2>
                <p className="text-sm text-slate-350 max-w-[280px] mx-auto leading-relaxed">
                  Say exactly <span className="text-cyan-400 font-bold">one word</span> about the topic out loud to the group.
                </p>
                <p className="text-[10px] text-slate-500 font-medium">
                  Once spoken, press the button below to pass turn to the next player.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-300">
                  Waiting for <span className="text-violet-400 font-black">{activePlayer?.name}</span> to speak...
                </h3>
                <p className="text-xs text-slate-400 max-w-[260px] mx-auto">
                  Listen carefully to their clue to find if they are the imposter!
                </p>
              </div>
            )}
          </div>

          {/* Controls */}
          {isMyTurn ? (
            <button
              onClick={handlePass}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-cyan-500 to-violet-600 hover:from-cyan-600 hover:to-violet-750 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
            >
              <ChevronRight size={18} />
              <span>I HAVE SPOKEN</span>
            </button>
          ) : (
            <div className="w-full bg-slate-950/60 border border-slate-900 rounded-2xl py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
              <span>Playing turns...</span>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
