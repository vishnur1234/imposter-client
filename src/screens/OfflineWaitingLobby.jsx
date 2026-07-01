import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useTheme } from "../context/ThemeContext";
import { generateTopic } from "../generateTopic";
import { ChevronLeft, Play, Users, Sparkles, Copy, Check } from "lucide-react";

export default function OfflineWaitingLobby() {
  const { colors } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const { roomCode, course, isHost } = location.state || {};
  const [joinedPlayers, setJoinedPlayers] = useState([]);
  const [starting, setStarting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [category, setCategory] = useState(course || "general");

  const myUid = auth.currentUser?.uid || "guest";

  useEffect(() => {
    if (!roomCode) {
      alert("Missing room code.");
      navigate("/home");
      return;
    }

    const unsub = onSnapshot(doc(db, "rooms", roomCode), async (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const playersList = data.players || [];
        setCategory(data.category || data.course || course || "general");

        // Enrich names with tags
        const enriched = await Promise.all(
          playersList.map(async (p) => {
            try {
              const statSnap = await getDoc(doc(db, "user_stats", p.uid));
              if (statSnap.exists()) {
                const sd = statSnap.data();
                const gTag = sd.playerName || sd.name;
                if (gTag) return { ...p, name: gTag };
              }
            } catch (_) {}
            return p;
          })
        );
        setJoinedPlayers(enriched);

        // Auto transitions for guests
        if (data.gameStatus === "reveal" || data.gameStatus === "round" || (data.started && data.topic)) {
          navigate("/offline-reveal", {
            state: {
              roomCode,
              course: data.category || data.course || category,
              isHost,
            }
          });
        }
      } else {
        alert("Room was disbanded.");
        navigate("/home");
      }
    });

    return () => unsub();
  }, [roomCode, isHost, navigate, category, course]);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStart = async () => {
    if (joinedPlayers.length < 2) {
      alert("Need at least 2 players to start a game.");
      return;
    }
    setStarting(true);
    try {
      const topic = await generateTopic(category);
      if (!topic || !topic.answer) {
        throw new Error("Failed to generate a valid topic.");
      }

      const imposterPlayer = joinedPlayers[Math.floor(Math.random() * joinedPlayers.length)];
      if (!imposterPlayer) {
        throw new Error("No players in lobby.");
      }

      const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const imposterIndex = joinedPlayers.findIndex(p => p.uid === imposterPlayer.uid);

      await updateDoc(doc(db, "rooms", roomCode), {
        gameStatus: "reveal",
        started: true,
        gameId,
        imposterIndex,
        topic,
        gameData: {
          answer: topic.answer,
          clue: topic.clue || "",
          imposterId: imposterPlayer.uid
        },
        readyPlayers: [],
        hints: [],
        votes: {}
      });

      navigate("/offline-reveal", {
        state: { roomCode, course: category, isHost }
      });
    } catch (e) {
      alert("Error generating topic: " + e.message);
    } finally {
      setStarting(false);
    }
  };

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
          Leave Lobby
        </button>
        <div className="text-center">
          <span className="text-xs font-extrabold text-slate-200 tracking-widest font-mono block">OFFLINE LOBBY</span>
          <span className="text-[8px] font-bold text-slate-500 tracking-wider">Verbal Party Game</span>
        </div>
        <div className="w-24" />
      </div>

      {/* Main Panel */}
      <div className="flex-grow flex flex-col items-center justify-center p-6 relative z-10 max-w-md mx-auto w-full space-y-6">
        
        {/* Room Code Info Box */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 w-full text-center shadow-xl backdrop-blur-sm space-y-3">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase">ROOM CODE</span>
          
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-3xl font-black text-[#00E5FF] font-mono tracking-widest">{roomCode}</h1>
            <button
              onClick={copyCode}
              className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-850 flex items-center justify-center text-slate-400 hover:text-white transition"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Players join by clicking <span className="font-bold text-white">Join Room</span> on their own devices and entering this room code.
          </p>
        </div>

        {/* Orbit Layout Circle of Avatars */}
        <div className="relative w-64 h-64 border border-dashed border-cyan-500/10 rounded-full flex items-center justify-center bg-cyan-500/2">
          {/* Circular orbiting core */}
          <div className="w-24 h-24 rounded-full border border-cyan-500/10 flex flex-col items-center justify-center text-center animate-pulse">
            <Users size={24} className="text-cyan-400" />
            <span className="text-[10px] font-black text-cyan-400 mt-1 font-mono">{joinedPlayers.length} JOINED</span>
          </div>

          {/* Orbiting avatars */}
          {joinedPlayers.map((player, idx) => {
            const total = joinedPlayers.length;
            const angle = (idx * 360) / total;
            const rad = (angle * Math.PI) / 180;
            const radius = 96; // Distance from center
            const x = Math.round(radius * Math.cos(rad));
            const y = Math.round(radius * Math.sin(rad));

            return (
              <div
                key={player.uid}
                style={{
                  transform: `translate(${x}px, ${y}px)`,
                  transition: "transform 0.5s ease-out"
                }}
                className="absolute w-10 h-10 border border-violet-500 rounded-xl bg-slate-900 shadow-md flex items-center justify-center font-bold text-xs text-violet-400 z-10"
              >
                {player.name?.[0]?.toUpperCase() || "?"}
              </div>
            );
          })}
        </div>

        {/* Host Play Control */}
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={starting || joinedPlayers.length < 2}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-650 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 transition active:scale-[0.98]"
          >
            {starting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Play size={18} />
                <span>START OFFLINE MATCH</span>
              </>
            )}
          </button>
        ) : (
          <div className="w-full bg-slate-950/60 border border-slate-900 rounded-2xl py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
            <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <span>Waiting for the host to start the game...</span>
          </div>
        )}

      </div>
    </div>
  );
}
