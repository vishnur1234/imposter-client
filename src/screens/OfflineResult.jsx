import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, onSnapshot, updateDoc, getDoc, setDoc, deleteField } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useTheme } from "../context/ThemeContext";
import { generateTopic } from "../generateTopic";
import { Trophy, RefreshCw, AlertTriangle, ShieldCheck, Check, Lock, LogOut } from "lucide-react";

const saveUserScoreToHistory = async (uid, name, roomCode, gameId, score, isEntryFee = false) => {
  if (uid === "guest") return;
  try {
    const statsRef = doc(db, "user_stats", uid);
    const snap = await getDoc(statsRef);
    let matchHistory = [];
    let highScore = 0;
    let totalMatches = 0;

    if (snap.exists()) {
      const statsData = snap.data();
      matchHistory = statsData.matchHistory || [];
      highScore = statsData.highScore || 0;
      totalMatches = statsData.totalMatches || 0;
    }

    if (matchHistory.some(m => m.gameId === gameId && (m.isEntryFee ?? false) === isEntryFee)) {
      return;
    }

    const newMatch = {
      roomCode,
      gameId,
      score,
      isEntryFee,
      timestamp: Date.now()
    };

    matchHistory.push(newMatch);
    highScore = matchHistory.reduce((sum, m) => sum + (m.score || 0), 0);
    if (!isEntryFee) {
      totalMatches = totalMatches + 1;
    }

    await setDoc(statsRef, {
      uid,
      name,
      highScore,
      totalMatches,
      matchHistory
    }, { merge: true });
  } catch (error) {
    console.error("Error saving user match score:", error);
  }
};

export default function OfflineResult() {
  const { colors } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const { course, players = [], topic, imposterIndex, votes = [], tally = {}, imposterCaught = false, scores = {}, roomCode, isHost } = location.state || {};

  const [dbRoom, setDbRoom] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const myUid = auth.currentUser?.uid || "guest";
  const recordedRef = useRef(false);

  // Firestore Room Listener
  useEffect(() => {
    if (!roomCode) {
      alert("Missing room code.");
      navigate("/home");
      return;
    }

    const unsub = onSnapshot(doc(db, "rooms", roomCode), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setDbRoom(data);

        // Transition back to reveal when playing again
        if (data.gameStatus === "reveal" || data.gameStatus === "round") {
          navigate("/offline-reveal", {
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

  // Record stats once when screen mounts
  useEffect(() => {
    if (myUid === "guest" || recordedRef.current || !dbRoom) return;

    const gameId = dbRoom.gameId || roomCode;
    const myPlayerObj = (dbRoom.players || []).find(p => p.uid === myUid);
    const myScoreChange = dbRoom.scores?.[myUid];

    if (myPlayerObj && myScoreChange !== undefined) {
      recordedRef.current = true;
      saveUserScoreToHistory(myUid, myPlayerObj.name, roomCode, gameId, myScoreChange);
    }
  }, [myUid, dbRoom, roomCode]);

  const handlePlayAgain = async () => {
    setSubmitting(true);
    try {
      const topicGen = await generateTopic(dbRoom?.category || course || "general");
      if (!topicGen || !topicGen.answer) {
        throw new Error("Failed to generate a valid topic.");
      }

      const totalPlayers = dbRoom?.players || [];
      const nextImposter = totalPlayers[Math.floor(Math.random() * totalPlayers.length)];
      const nextImposterIndex = totalPlayers.findIndex(p => p.uid === nextImposter.uid);
      const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();

      await updateDoc(doc(db, "rooms", roomCode), {
        gameStatus: "reveal",
        currentRound: 1,
        gameId: newGameId,
        imposterIndex: nextImposterIndex,
        topic: topicGen,
        gameData: {
          answer: topicGen.answer,
          clue: topicGen.clue || "",
          imposterId: nextImposter.uid
        },
        votes: {},
        hints: [],
        readyPlayers: [],
        tally: deleteField(),
        imposterCaught: deleteField(),
        scores: deleteField(),
        imposterGuess: deleteField(),
        imposterGuessCorrect: deleteField(),
        imposterSurvives: deleteField()
      });
    } catch (e) {
      alert("Error resetting room: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const imposterPlayerObj = players[imposterIndex] || { name: "Imposter" };

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
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[480px]">
          
          <div className="w-full flex justify-between items-center mb-6">
            <span className="bg-amber-500/10 border border-amber-500/35 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest text-amber-400 font-mono">
              MATCH CONCLUSION
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">OFFLINE STANDINGS</span>
          </div>

          <div className="flex-1 flex flex-col justify-between w-full py-2">
            {/* Banner outcome */}
            <div className="text-center mb-4">
              {imposterCaught ? (
                <div className="bg-emerald-500/10 border border-emerald-500/35 rounded-2xl p-4 flex flex-col items-center">
                  <ShieldCheck size={48} className="text-emerald-500 mb-2" />
                  <span className="text-[9px] font-black tracking-wider text-emerald-500">IMPOSTER WAS CAUGHT</span>
                  <h3 className="text-lg font-black text-white mt-1 font-mono">{imposterPlayerObj.name}</h3>
                </div>
              ) : (
                <div className="bg-rose-500/10 border border-rose-500/35 rounded-2xl p-4 flex flex-col items-center">
                  <AlertTriangle size={48} className="text-rose-500 mb-2" />
                  <span className="text-[9px] font-black tracking-wider text-rose-500">IMPOSTER ESCAPED!</span>
                  <h3 className="text-lg font-black text-white mt-1 font-mono">{imposterPlayerObj.name}</h3>
                </div>
              )}
            </div>

            {/* Answer details */}
            <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 text-center mb-4">
              <span className="text-[8px] font-black text-slate-500 tracking-widest block">THE SECRET TOPIC WAS</span>
              <h4 className="text-base font-bold text-emerald-400 mt-1 font-mono">{topic?.answer || dbRoom?.gameData?.answer}</h4>
            </div>

            {/* Score logs list */}
            <div className="space-y-2 mb-6 max-h-[140px] overflow-y-auto pr-1">
              {players.map((player) => {
                const earned = scores[player.uid] ?? 0;
                const isImp = player.uid === imposterPlayerObj.uid;
                const scoreDiff = earned >= 0 ? `+${earned}` : `${earned}`;

                return (
                  <div
                    key={player.uid}
                    className="flex justify-between items-center py-2.5 border-b border-slate-850 text-xs"
                  >
                    <span className={`font-semibold ${isImp ? "text-rose-500 font-bold" : "text-slate-350"}`}>
                      {player.name} {isImp && "(Imposter)"}
                    </span>
                    <span className={`font-mono font-black ${earned >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                      {scoreDiff} coins
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Actions Panel */}
            <div className="space-y-2.5">
              {isHost ? (
                <button
                  onClick={handlePlayAgain}
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <RefreshCw size={16} />
                      <span>PLAY AGAIN</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="w-full bg-violet-500/10 border border-violet-500/30 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs text-violet-400">
                  <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Waiting for host to play again...</span>
                </div>
              )}
              
              <button
                onClick={() => navigate("/home")}
                className="w-full border border-slate-800 bg-slate-950/40 hover:bg-slate-900/60 text-slate-300 font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <LogOut size={16} />
                <span>QUIT TO LOBBY</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
