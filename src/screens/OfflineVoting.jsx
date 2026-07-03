import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useTheme } from "../context/ThemeContext";
import { ChevronRight, Check } from "lucide-react";

export default function OfflineVoting() {
  const { colors } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const { roomCode, course, isHost, players, topic, imposterIndex, scores } = location.state || {};

  const [dbRoom, setDbRoom] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const currentUid = auth.currentUser?.uid || "guest";

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

        if (data.gameStatus === "offline_result") {
          navigate("/offline-result", {
            state: {
              course: data.category || course,
              players: data.players || players || [],
              topic: data.topic || topic,
              imposterIndex: data.imposterIndex ?? imposterIndex,
              votes: Object.values(data.votes || {}),
              tally: data.tally || {},
              imposterCaught: data.imposterCaught ?? false,
              scores: data.scores || {},
              roomCode,
              isHost
            }
          });
        }
      } else {
        alert("Room disbanded.");
        navigate("/home");
      }
    });

    return () => unsub();
  }, [roomCode, isHost, navigate, course, players, topic, imposterIndex, scores]);

  // Host auto-tally logic when all players submit their votes
  useEffect(() => {
    if (!isHost || !dbRoom || !roomCode) return;
    if (dbRoom.gameStatus !== "offline_voting") return;

    const currentVotes = dbRoom.votes || {};
    const totalPlayers = dbRoom.players || [];

    if (totalPlayers.length > 0 && Object.keys(currentVotes).length >= totalPlayers.length) {
      const tallyTally = async () => {
        try {
          const tally = {};
          totalPlayers.forEach((p) => { tally[p.uid] = 0; });
          Object.values(currentVotes).forEach((uid) => {
            if (uid && tally[uid] !== undefined) tally[uid]++;
          });

          const maxVotes = Math.max(...Object.values(tally));
          const mostVotedUids = Object.keys(tally).filter((uid) => tally[uid] === maxVotes);
          const imposterPlayerObj = totalPlayers[dbRoom.imposterIndex ?? imposterIndex];
          const imposterUid = imposterPlayerObj?.uid;
          const imposterCaught = mostVotedUids.includes(imposterUid);

          const winners = [];
          const losers = [];

          if (!imposterCaught) {
            winners.push(imposterUid);
            totalPlayers.forEach(p => {
              if (p.uid !== imposterUid) losers.push(p.uid);
            });
          } else {
            totalPlayers.forEach(p => {
              if (p.uid === imposterUid) {
                losers.push(p.uid);
              } else {
                const votedForUid = currentVotes[p.uid];
                if (votedForUid === imposterUid) {
                  winners.push(p.uid);
                } else {
                  losers.push(p.uid);
                }
              }
            });
          }

          const entryFeePot = totalPlayers.length * 50;
          const penaltyPot = losers.length * 50;
          const totalPot = entryFeePot + penaltyPot;
          const winnerEarnedShare = winners.length > 0 ? Math.floor(totalPot / winners.length) : 0;

          const prevScores = dbRoom.scores || scores || {};
          const updatedScores = { ...prevScores };

          totalPlayers.forEach((p) => {
            let earned = 0;
            if (winners.includes(p.uid)) {
              earned = winnerEarnedShare - 50;
            } else {
              earned = -100;
            }
            updatedScores[p.uid] = (prevScores[p.uid] || 0) + earned;
          });

          await updateDoc(doc(db, "rooms", roomCode), {
            gameStatus: "offline_result",
            tally,
            imposterCaught,
            scores: updatedScores
          });
        } catch (e) {
          console.log("Failed to auto tally offline votes:", e.message);
        }
      };
      tallyTally();
    }
  }, [dbRoom, isHost, imposterIndex, roomCode, scores]);

  const handleConfirmVote = async () => {
    if (!selected) {
      alert("Please select a player to vote.");
      return;
    }

    setSubmitting(true);
    try {
      await updateDoc(doc(db, "rooms", roomCode), {
        [`votes.${currentUid}`]: selected
      });
    } catch (e) {
      alert("Error submitting vote: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!dbRoom) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Syncing votes...</span>
      </div>
    );
  }

  const { players: list = [] } = dbRoom;
  const currentVotes = dbRoom.votes || {};
  const hasVoted = currentUid in currentVotes;

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
            <span className="bg-rose-650 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest text-white font-mono">
              OFFLINE VOTING
            </span>
            <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">SUSPECTS</span>
          </div>

          {!hasVoted ? (
            <div className="flex-grow flex flex-col justify-between py-2">
              <p className="text-xs text-slate-400 text-center mb-4">
                Select the player you suspect of being the Imposter. You cannot select yourself.
              </p>

              <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 mb-4 pr-1">
                {list.filter(p => p.uid !== currentUid).map((p) => {
                  const sel = selected === p.uid;
                  return (
                    <button
                      key={p.uid}
                      onClick={() => setSelected(p.uid)}
                      className={`w-full flex items-center gap-3 p-3.5 border rounded-2xl text-left transition select-none ${sel
                          ? "border-rose-500 bg-rose-500/10 shadow-sm"
                          : "bg-slate-950 border-slate-850"
                        }`}
                    >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black font-mono ${sel ? "bg-rose-500/10 border border-rose-500/35 text-rose-500" : "bg-violet-600/10 border border-violet-500 text-violet-400"
                        }`}>
                        {p.name?.[0]?.toUpperCase() || "?"}
                      </div>
                      <span className={`flex-1 text-sm font-semibold ${sel ? "text-rose-455 font-bold" : "text-slate-355"}`}>
                        {p.name}
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${sel ? "border-rose-500" : "border-slate-750"}`}>
                        {sel && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleConfirmVote}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check size={18} />
                    <span>SUBMIT VOTE</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex-grow flex flex-col items-center justify-center text-center py-6">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/35 flex items-center justify-center text-emerald-400 mb-4 animate-bounce">
                <Check size={24} />
              </div>
              <h4 className="text-base font-bold text-white mb-1">Vote Submitted!</h4>
              <p className="text-xs text-slate-400 mb-8">
                Suspect: {list.find(p => p.uid === currentVotes[currentUid])?.name || "Unknown"}
              </p>

              <div className="w-full bg-emerald-500/10 border border-emerald-500/30 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs text-emerald-400">
                <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Waiting for voters ({Object.keys(currentVotes).length} / {list.length})...</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
