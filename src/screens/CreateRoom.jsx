import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useTheme } from "../context/ThemeContext";
import { ChevronLeft, Info, HelpCircle, Gamepad2, Users, Star } from "lucide-react";

export default function CreateRoom() {
  const { colors } = useTheme();
  const navigate = useNavigate();

  const [course, setCourse] = useState("ACCA");
  const [players, setPlayers] = useState(4);
  const [rounds, setRounds] = useState(3);
  const [clueTimer, setClueTimer] = useState(60);
  const [gameMode, setGameMode] = useState("Multiplayer");
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [userCoins, setUserCoins] = useState(0);
  const [hostPlayerName, setHostPlayerName] = useState("");

  const myUid = auth.currentUser?.uid;
  const userEmail = auth.currentUser?.email || "Guest";

  useEffect(() => {
    if (!myUid) {
      setLoading(false);
      return;
    }

    const fetchUserStats = async () => {
      try {
        const snap = await getDoc(doc(db, "user_stats", myUid));
        if (snap.exists()) {
          const data = snap.data();
          setUserCoins(data.highScore || 0);
          setHostPlayerName(data.playerName || data.name || userEmail.split("@")[0]);
        } else {
          setHostPlayerName(userEmail.split("@")[0]);
        }
      } catch (e) {
        console.error("Failed to load user stats for Create Room:", e);
      } finally {
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [myUid, userEmail]);

  const handleCreateRoom = async () => {
    if (creating) return;

    if (userCoins < 50 && myUid !== "guest") {
      alert("Insufficient Coins! You need at least 50 coins to host an Imposter match.");
      return;
    }

    setCreating(true);
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    const finalHostName = hostPlayerName || userEmail.split("@")[0];

    try {
      await setDoc(doc(db, "rooms", roomCode), {
        roomCode,
        hostId: myUid,
        category: course,
        course, // for compatibility
        playersRequired: Number(players),
        totalRounds: Number(rounds),
        clueTimer: gameMode === "Multiplayer" ? Number(clueTimer) : 0,
        currentRound: 1,
        gameStatus: "waiting",
        gameMode,
        createdAt: Date.now(),
        players: [{ uid: myUid, name: finalHostName, score: 0 }],
        playerList: [{ uid: myUid, name: finalHostName }],
        votes: {},
        hints: [],
        readyPlayers: [],
        gameData: {},
      });

      if (gameMode === "Offline") {
        navigate("/offline-lobby", {
          state: { roomCode, course, isHost: true }
        });
      } else {
        navigate("/waiting-room", {
          state: {
            roomCode,
            course,
            players: Number(players),
            isHost: true,
            isDemoMode: false,
          },
        });
      }
    } catch (error) {
      console.error("Firestore Write Failed:", error);
      alert("Failed to create room: " + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Syncing Coins Balance...</span>
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
        <span className="text-xs font-extrabold text-slate-200 tracking-widest font-mono">CREATE LOBBY</span>
        <div className="w-16" />
      </div>

      {/* Main Content */}
      <div className="flex-grow flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-sm space-y-4">

          <h2 className="text-xl font-black text-white font-mono text-center">LOBBY CONFIGURATION</h2>

          <div className="space-y-4">
            {/* Game Mode */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1.5">Game Mode</label>
              <div className="grid grid-cols-2 gap-2">
                {["Multiplayer", "Offline"].map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setGameMode(mode)}
                    className={`py-3 px-4 rounded-xl border text-xs font-bold transition ${gameMode === mode
                      ? "border-violet-500 bg-violet-500/10 text-violet-400"
                      : "border-slate-800 bg-slate-950 text-slate-500 hover:text-slate-400"
                      }`}
                  >
                    {mode === "Multiplayer" ? "🌐 Online" : "🗣️ offline"}
                  </button>
                ))}
              </div>
            </div>

            {/* Course Category */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1.5">Syllabus Topic Category</label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition text-sm font-semibold"
              >
                <option>ACCA</option>
                <option>CMA</option>
                <option>Bank</option>
                <option>Movie</option>
                <option>General</option>
              </select>
            </div>

            {/* Players Limit */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1.5">Player Count Limit</label>
              <input
                type="number"
                min="3"
                max="10"
                value={players}
                onChange={(e) => setPlayers(Math.max(3, Math.min(10, Number(e.target.value))))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition text-sm font-mono font-bold"
              />
            </div>

            {/* Rounds Count */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1.5">Total Match Rounds</label>
              <select
                value={rounds}
                onChange={(e) => setRounds(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition text-sm font-semibold"
              >
                <option value={1}>1 Round</option>
                <option value={2}>2 Rounds</option>
                <option value={3}>3 Rounds</option>
                <option value={4}>4 Rounds</option>
                <option value={5}>5 Rounds</option>
              </select>
            </div>

            {/* Clue Timer (Only for Multiplayer) */}
            {gameMode === "Multiplayer" && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-1.5">Clue Turn Timer Limit</label>
                <select
                  value={clueTimer}
                  onChange={(e) => setClueTimer(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white outline-none focus:border-violet-500 transition text-sm font-semibold"
                >
                  <option value={60}>1 Minute (60s)</option>
                  <option value={120}>2 Minutes (120s)</option>
                  <option value={0}>No Limit</option>
                </select>
              </div>
            )}

            {/* Coin deduction info banner */}
            <div className="bg-slate-950 border border-slate-850 p-3.5 rounded-2xl flex items-start gap-2.5">
              <Info size={16} className="text-violet-500 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-slate-450 leading-normal">
                Host Entry Fee: <span className="text-white font-bold">50 coins</span> will be deducted when you launch the game. Your current balance is <span className="text-amber-500 font-bold">{userCoins} coins</span>.
              </p>
            </div>

            {/* Action */}
            <button
              onClick={handleCreateRoom}
              disabled={creating}
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
            >
              {creating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <span>LAUNCH ROOM LOBBY</span>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}