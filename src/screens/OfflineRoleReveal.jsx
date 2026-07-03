import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, onSnapshot, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useTheme } from "../context/ThemeContext";
import { Eye, Check, CheckCircle2, ShieldAlert } from "lucide-react";

export default function OfflineRoleReveal() {
  const { colors } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const { roomCode, course, isHost } = location.state || {};

  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [revealed, setRevealed] = useState(false);

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

        // Host transition logic
        if (isHost && data.gameStatus === "reveal") {
          const totalPlayers = data.players || [];
          const readyList = data.readyPlayers || [];
          if (totalPlayers.length > 0 && readyList.length >= totalPlayers.length) {
            updateDoc(doc(db, "rooms", roomCode), {
              gameStatus: "round",
              readyPlayers: [], // reset
            }).catch(err => console.log("Failed to transition to round:", err));
          }
        }

        // Redirect when round starts
        if (data.gameStatus === "round") {
          navigate("/offline-turn", {
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

  const handleConfirmRole = async () => {
    setSubmitting(true);
    try {
      await updateDoc(doc(db, "rooms", roomCode), {
        readyPlayers: arrayUnion(myUid)
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
        <span>Syncing roles...</span>
      </div>
    );
  }

  const { players = [], gameData = {}, readyPlayers = [] } = roomData;
  const myPlayerObj = players.find(p => p.uid === myUid) || { name: "You" };
  const isImposter = gameData.imposterId === myUid;
  const clueList = gameData.clue ? [gameData.clue] : [];
  const isReady = readyPlayers.includes(myUid);

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

          {!revealed ? (
            <div className="w-full flex flex-col items-center flex-grow justify-between py-4">
              <div className="w-full flex justify-between items-center mb-6">
                <span className="bg-violet-500/10 border border-violet-500/35 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest text-violet-400 font-mono">
                  {course || roomData.category}
                </span>
                <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">OFFLINE ROLE REVEAL</span>
              </div>

              <div className="w-20 h-20 rounded-full bg-violet-600/15 border border-violet-500 flex items-center justify-center text-white text-2xl font-black">
                {myPlayerObj.name?.[0]?.toUpperCase() || "?"}
              </div>

              <h3 className="text-xl font-bold text-slate-200 mt-4 font-mono">{myPlayerObj.name}</h3>
              <p className="text-xs text-slate-400 mt-3 max-w-[280px]">
                Tap below to view your secret role. Keep it hidden from others!
              </p>

              <button
                onClick={() => setRevealed(true)}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 mt-8 shadow-lg hover:shadow-violet-600/20 transition active:scale-[0.98]"
              >
                <Eye size={18} />
                <span>Reveal My Card</span>
              </button>
            </div>
          ) : (
            <div className="w-full flex flex-col items-center flex-grow justify-between py-4">
              <div className="w-full flex justify-between items-center mb-6">
                <span className="text-xs font-bold text-slate-450">{myPlayerObj.name}</span>
                <span className="text-[8px] font-bold text-slate-500 tracking-wider">ROLE REVEALED</span>
              </div>

              {isImposter ? (
                <div className="w-full flex flex-col items-center">
                  <ShieldAlert size={56} className="text-rose-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider mt-4 font-mono">YOU ARE THE</span>
                  <h1 className="text-4xl font-black text-rose-500 tracking-widest font-mono mt-1">IMPOSTER</h1>

                  {clueList.length > 0 && (
                    <div className="w-full mt-6 space-y-3">
                      <p className="text-xs text-slate-400">Guess the topic using this clue:</p>
                      {clueList.map((clue, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-left">
                          <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-[10px] font-black text-rose-500 font-mono">
                            01
                          </div>
                          <p className="text-xs text-white font-mono">{clue}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <CheckCircle2 size={56} className="text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider mt-4">YOUR SECRET TOPIC IS</span>

                  <div className="w-full bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/30 rounded-2xl py-6 my-4 shadow-inner">
                    <h1 className="text-2xl font-black text-emerald-400 font-mono tracking-wide">{gameData.answer}</h1>
                  </div>

                  <p className="text-xs text-slate-400 max-w-[280px]">
                    Describe it verbally in <span className="text-emerald-400 font-bold">one word</span> to the group when it is your turn.
                  </p>
                </div>
              )}

              {isReady ? (
                <div className="w-full bg-emerald-500/10 border border-emerald-500/30 py-3 rounded-2xl mt-8 flex items-center justify-center gap-2 text-xs text-emerald-400">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Waiting for other players ({readyPlayers.length}/{players.length})...</span>
                </div>
              ) : (
                <button
                  onClick={handleConfirmRole}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 mt-8 shadow-lg transition active:scale-[0.98]"
                >
                  <Check size={18} />
                  <span>I UNDERSTAND</span>
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
