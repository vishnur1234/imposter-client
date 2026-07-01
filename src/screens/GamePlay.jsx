import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { doc, onSnapshot, updateDoc, arrayUnion, getDoc, setDoc, deleteField } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { generateTopic } from "../generateTopic";
import { useTheme } from "../context/ThemeContext";
import { Eye, Check, ChevronRight, Trophy, Flame, AlertTriangle, RefreshCw, Send, CheckCircle2, Clock, LogOut, ShieldAlert } from "lucide-react";

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

export default function GamePlay() {
  const { colors } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const { roomCode, course, isHost } = location.state || {};

  const [roomData, setRoomData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [secRemaining, setSecRemaining] = useState(60);

  // Local phase states
  const [revealed, setRevealed] = useState(false);
  const [hintInput, setHintInput] = useState("");
  const [selectedVoteUid, setSelectedVoteUid] = useState(null);
  const [bonusGuess, setBonusGuess] = useState("");

  const myUid = auth.currentUser?.uid || "guest";
  const recordedGamesRef = useRef([]);
  const paidGamesRef = useRef([]);

  // Firestore Room Listener
  useEffect(() => {
    if (!roomCode) {
      alert("Error: Missing room code.");
      navigate("/home");
      return;
    }

    const unsub = onSnapshot(doc(db, "rooms", roomCode), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setRoomData(data);
        setLoading(false);

        // Host transitions
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

        if (isHost && data.gameStatus === "voting") {
          const totalPlayers = data.players || [];
          const votesMap = data.votes || {};
          if (totalPlayers.length > 0 && Object.keys(votesMap).length >= totalPlayers.length) {
            updateDoc(doc(db, "rooms", roomCode), {
              gameStatus: "results",
            }).catch(err => console.log("Failed to transition to results:", err));
          }
        }

        // Scoring ledger entries
        if (data.gameStatus === "leaderboard") {
          const myPlayerObj = (data.players || []).find(p => p.uid === myUid);
          if (myPlayerObj) {
            const gameId = data.gameId || roomCode;
            if (!recordedGamesRef.current.includes(gameId)) {
              recordedGamesRef.current.push(gameId);
              saveUserScoreToHistory(myUid, myPlayerObj.name, roomCode, gameId, myPlayerObj.score);
            }
          }
        }

        if (data.gameStatus === "reveal" || data.gameStatus === "round") {
          const gameId = data.gameId || roomCode;
          if (!paidGamesRef.current.includes(gameId)) {
            paidGamesRef.current.push(gameId);
            const myPlayerObj = (data.players || []).find(p => p.uid === myUid) || { name: "Player" };
            saveUserScoreToHistory(myUid, myPlayerObj.name, roomCode, gameId, -50, true);
          }
        }

        // Turn Timers
        if (isHost && data.gameStatus === "round" && data.clueTimer > 0) {
          const roundHints = (data.hints || []).filter(h => h.round === (data.currentRound || 1));
          const currentTurnIndex = roundHints.length;
          if (currentTurnIndex < (data.players || []).length) {
            if (data.turnIndex !== currentTurnIndex) {
              updateDoc(doc(db, "rooms", roomCode), {
                turnIndex: currentTurnIndex,
                turnStartedAt: Date.now()
              }).catch(err => console.log("Failed to set turnIndex/turnStartedAt:", err));
            }
          }
        }
      } else {
        alert("Error: Room not found.");
        navigate("/home");
      }
    });

    return () => unsub();
  }, [roomCode, isHost, navigate, myUid]);

  // Clock Countdown Ticker
  useEffect(() => {
    if (!roomData || roomData.gameStatus !== "round") return;

    const roundHints = (roomData.hints || []).filter(h => h.round === (roomData.currentRound || 1));
    const currentTurnIndex = roundHints.length;
    const totalPlayersList = roomData.players || [];
    if (currentTurnIndex >= totalPlayersList.length) return;

    const limitSec = roomData.clueTimer !== undefined ? roomData.clueTimer : 60;
    if (limitSec <= 0) {
      setSecRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - (roomData.turnStartedAt || now)) / 1000);
      const rem = Math.max(0, limitSec - elapsed);
      setSecRemaining(rem);

      if (rem === 0) {
        const isMyTurn = totalPlayersList[currentTurnIndex]?.uid === myUid;
        if (isMyTurn) {
          const myPlayerName = totalPlayersList.find(p => p.uid === myUid)?.name || "You";
          updateDoc(doc(db, "rooms", roomCode), {
            hints: arrayUnion({
              round: roomData.currentRound || 1,
              uid: myUid,
              name: myPlayerName,
              hint: "PASS"
            })
          }).catch(err => console.log("Failed to auto-submit clue:", err));
        } else if (isHost && elapsed >= limitSec + 3) {
          const targetPlayer = totalPlayersList[currentTurnIndex];
          if (targetPlayer) {
            updateDoc(doc(db, "rooms", roomCode), {
              hints: arrayUnion({
                round: roomData.currentRound || 1,
                uid: targetPlayer.uid,
                name: targetPlayer.name,
                hint: "PASS"
              })
            }).catch(err => console.log("Failed to force pass clue:", err));
          }
        }
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [roomData?.turnStartedAt, roomData?.turnIndex, roomData?.gameStatus, roomData?.currentRound, roomData?.hints?.length, myUid, isHost, roomCode]);

  if (loading || !roomData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <span>Loading Game State...</span>
      </div>
    );
  }

  const {
    players = [],
    gameStatus = "reveal",
    currentRound = 1,
    totalRounds = 3,
    gameData = {},
    readyPlayers = [],
    hints = [],
    votes = {},
  } = roomData;

  const myPlayerObj = players.find(p => p.uid === myUid) || { name: "You", score: 0 };
  const isImposter = gameData.imposterId === myUid;
  const imposterPlayer = players.find(p => p.uid === gameData.imposterId);

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

  const handleHintSubmit = async () => {
    const cleanHint = hintInput.trim();
    if (!cleanHint) {
      alert("Please enter a hint.");
      return;
    }
    if (cleanHint.split(/\s+/).length > 1) {
      alert("Rule Exception: Your hint must be exactly ONE word.");
      return;
    }

    setSubmitting(true);
    try {
      await updateDoc(doc(db, "rooms", roomCode), {
        hints: arrayUnion({
          round: currentRound,
          uid: myUid,
          name: myPlayerObj.name,
          hint: cleanHint
        })
      });
      setHintInput("");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleProceedRound = async (endEarly = false) => {
    setSubmitting(true);
    try {
      if (currentRound < totalRounds && !endEarly) {
        await updateDoc(doc(db, "rooms", roomCode), {
          currentRound: currentRound + 1
        });
      } else {
        await updateDoc(doc(db, "rooms", roomCode), {
          gameStatus: "voting"
        });
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVoteSubmit = async () => {
    if (!selectedVoteUid) {
      alert("Please choose a suspect.");
      return;
    }

    setSubmitting(true);
    try {
      await updateDoc(doc(db, "rooms", roomCode), {
        [`votes.${myUid}`]: selectedVoteUid
      });
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBonusSubmit = async () => {
    const cleanGuess = bonusGuess.trim();
    if (!cleanGuess) {
      alert("Please enter your guess.");
      return;
    }

    setSubmitting(true);
    try {
      const actualAnswer = gameData.answer || "";
      const correct = cleanGuess.toLowerCase() === actualAnswer.toLowerCase();

      const imposterId = gameData.imposterId;
      const votesArray = Object.values(votes);
      const imposterVotes = votesArray.filter(v => v === imposterId).length;

      const otherVotesCount = {};
      players.forEach(p => {
        if (p.uid !== imposterId) {
          otherVotesCount[p.uid] = votesArray.filter(v => v === p.uid).length;
        }
      });
      const maxOtherVotes = Math.max(0, ...Object.values(otherVotesCount));
      const imposterCaught = imposterVotes >= maxOtherVotes && imposterVotes > 0;
      const imposterSurvives = !imposterCaught;

      const winners = [];
      const losers = [];

      if (imposterSurvives) {
        winners.push(imposterId);
        players.forEach(p => {
          if (p.uid !== imposterId) losers.push(p.uid);
        });
      } else {
        players.forEach(p => {
          if (p.uid === imposterId) {
            losers.push(p.uid);
          } else {
            const votedForUid = votes[p.uid];
            if (votedForUid === imposterId) {
              winners.push(p.uid);
            } else {
              losers.push(p.uid);
            }
          }
        });
      }

      const totalPlayersCount = players.length;
      const entryFeePot = totalPlayersCount * 50;
      const penaltyPot = losers.length * 50;
      const totalPot = entryFeePot + penaltyPot;

      const winnerEarnedShare = winners.length > 0 ? Math.floor(totalPot / winners.length) : 0;

      const updatedPlayers = players.map(player => {
        let earned = 0;
        if (winners.includes(player.uid)) {
          earned = winnerEarnedShare;
        } else {
          earned = -50;
        }
        return {
          ...player,
          score: earned
        };
      });

      await updateDoc(doc(db, "rooms", roomCode), {
        players: updatedPlayers,
        gameStatus: "leaderboard",
        imposterGuess: cleanGuess,
        imposterGuessCorrect: correct,
        imposterSurvives
      });
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlayAgain = async () => {
    setSubmitting(true);
    try {
      const topic = await generateTopic(course || roomData.category);
      if (!topic || !topic.answer) {
        throw new Error("Failed to generate a valid topic.");
      }

      const nextImposter = players[Math.floor(Math.random() * players.length)];
      const newGameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const resetPlayers = players.map(p => ({
        ...p,
        score: 0
      }));

      await updateDoc(doc(db, "rooms", roomCode), {
        gameStatus: "reveal",
        currentRound: 1,
        players: resetPlayers,
        gameData: {
          answer: topic.answer,
          clue: topic.clue || "",
          imposterId: nextImposter.uid
        },
        votes: {},
        hints: [],
        readyPlayers: [],
        topic,
        imposterIndex: players.findIndex(p => p.uid === nextImposter.uid),
        gameId: newGameId,
        imposterGuess: deleteField(),
        imposterGuessCorrect: deleteField(),
        imposterSurvives: deleteField()
      });
      setRevealed(false);
      setHintInput("");
      setSelectedVoteUid(null);
      setBonusGuess("");
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Reveal Panel
  const renderRevealScreen = () => {
    const isReady = readyPlayers.includes(myUid);
    const clueList = gameData.clue ? [gameData.clue] : [];

    return (
      <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-between min-h-[460px] animate-fade-in text-center">
        {!revealed ? (
          <div className="w-full flex flex-col items-center flex-1 justify-between py-4">
            <div className="w-full flex justify-between items-center mb-6">
              <span className="bg-violet-500/10 border border-violet-500/35 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest text-violet-400 font-mono">
                {course || roomData.category}
              </span>
              <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">ROLE REVEAL</span>
            </div>

            <div className="w-20 h-20 rounded-full bg-violet-600/15 border border-violet-500 flex items-center justify-center text-white text-2xl font-black shadow-[0_0_15px_rgba(124,58,237,0.2)]">
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
          <div className="w-full flex flex-col items-center flex-1 justify-between py-4">
            <div className="w-full flex justify-between items-center mb-6">
              <span className="text-xs font-bold text-slate-400">{myPlayerObj.name}</span>
              <span className="text-[8px] font-bold text-slate-500 tracking-wider">ROLE REVEALED</span>
            </div>

            {isImposter ? (
              <div className="w-full flex flex-col items-center">
                <ShieldAlert size={56} className="text-rose-500 animate-pulse" />
                <span className="text-[10px] font-bold text-slate-500 tracking-wider mt-4">YOU ARE THE</span>
                <h1 className="text-4xl font-black text-rose-500 tracking-widest font-mono mt-1">IMPOSTER</h1>

                {clueList.length > 0 && (
                  <div className="w-full mt-6 space-y-3">
                    <p className="text-xs text-slate-400">Guess the topic using this clue:</p>
                    {clueList.map((clue, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-slate-950 border border-slate-850 p-3.5 rounded-xl text-left">
                        <div className="w-6 h-6 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-[10px] font-black text-rose-500 font-mono">
                          01
                        </div>
                        <p className="text-xs text-slate-350">{clue}</p>
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
                  Describe it in <span className="text-emerald-400 font-bold">one word</span>. Avoid making it too easy for the imposter!
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
    );
  };

  // 2. Round Panel
  const renderRoundScreen = () => {
    const roundHints = hints.filter(h => h.round === currentRound);
    const currentTurnIndex = roundHints.length;
    const isMyTurn = currentTurnIndex < players.length && players[currentTurnIndex]?.uid === myUid;
    const activeTurnPlayer = currentTurnIndex < players.length ? players[currentTurnIndex] : null;
    const roundHintsCompleted = roundHints.length === players.length;

    return (
      <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[480px] animate-fade-in">
        <div className="w-full flex justify-between items-center mb-6">
          <span className="bg-violet-500/10 border border-violet-500/35 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest text-violet-400 font-mono">
            ROUND {currentRound} OF {totalRounds}
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">HINTS PHASE</span>
        </div>

        {/* Turn Status Message */}
        <div className="mb-4">
          {!roundHintsCompleted ? (
            <div className="flex flex-col items-center text-center space-y-2">
              {isMyTurn ? (
                <>
                  <span className="text-sm font-bold text-emerald-400 leading-snug">
                    ⚡ IT'S YOUR TURN! Submit a one-word hint.
                  </span>
                  {roomData.clueTimer > 0 ? (
                    <div className={`px-3 py-1 rounded-full border text-xs font-bold flex items-center gap-1.5 ${
                      secRemaining <= 10 ? "bg-rose-500/10 border-rose-500/30 text-rose-500" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                    }`}>
                      <Clock size={12} />
                      <span>Time Left: {secRemaining}s</span>
                    </div>
                  ) : (
                    <div className="px-3 py-1 rounded-full border border-slate-800 bg-slate-950 text-slate-500 text-xs font-medium flex items-center gap-1.5">
                      <Clock size={12} />
                      <span>No Limit</span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="text-xs text-slate-400">
                    Waiting for <span className="text-violet-400 font-bold">{activeTurnPlayer?.name}</span> to submit hint...
                  </span>
                  <div className="px-3 py-1 rounded-full border border-slate-800 bg-slate-950 text-slate-500 text-xs font-medium flex items-center gap-1.5">
                    <Clock size={12} />
                    <span>{roomData.clueTimer > 0 ? `Time Left: ${secRemaining}s` : "No Limit"}</span>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="text-center">
              <span className="text-sm font-bold text-emerald-400">
                ✅ All hints submitted for Round {currentRound}!
              </span>
            </div>
          )}
        </div>

        {/* Hint Feed */}
        <div className="flex-1 overflow-y-auto max-h-[220px] my-4 space-y-2.5 pr-1">
          {roundHints.map((hintObj, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-2xl border ${
                hintObj.uid === myUid 
                  ? "bg-violet-500/10 border-violet-500/40" 
                  : "bg-slate-950 border-slate-850"
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-violet-600/10 border border-violet-500 flex items-center justify-center text-xs font-black text-violet-400 font-mono">
                {hintObj.name?.[0]?.toUpperCase() || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-slate-500 block leading-none">{hintObj.name}</span>
                <span className="text-sm font-bold text-slate-200 mt-1 block truncate leading-tight font-mono">{hintObj.hint}</span>
              </div>
            </div>
          ))}
          {roundHints.length === 0 && (
            <div className="text-center py-8 text-slate-600 text-xs">No hints submitted yet.</div>
          )}
        </div>

        {/* Input Panel */}
        {isMyTurn && !roundHintsCompleted && (
          <div className="space-y-3 pt-3 border-t border-slate-850">
            <input
              type="text"
              value={hintInput}
              onChange={(e) => setHintInput(e.target.value)}
              placeholder="Enter single word hint..."
              className="w-full bg-slate-950 border border-slate-850 rounded-2xl px-4 py-3 text-white outline-none focus:border-violet-500 text-sm font-mono"
            />
            <button
              onClick={handleHintSubmit}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <Send size={14} />
                  <span>SUBMIT HINT</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Host Control Panel */}
        {roundHintsCompleted && (
          <div className="pt-3 border-t border-slate-850 w-full">
            {isHost ? (
              <div className="space-y-2 w-full">
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
                      <LogOut size={16} />
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
                <span>Waiting for the host to proceed...</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 3. Voting Panel
  const renderVotingScreen = () => {
    const hasVoted = votes[myUid] !== undefined;

    return (
      <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[460px] animate-fade-in">
        <div className="w-full flex justify-between items-center mb-6">
          <span className="bg-rose-650 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest text-white font-mono">
            VOTING TIME
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">WHO IS THE IMPOSTER?</span>
        </div>

        {!hasVoted ? (
          <div className="flex-1 flex flex-col justify-between py-2">
            <p className="text-xs text-slate-400 text-center mb-5">
              Select the player you suspect of being the Imposter. You cannot select yourself.
            </p>

            <div className="flex-1 overflow-y-auto max-h-[220px] space-y-2 mb-4 pr-1">
              {players.filter(p => p.uid !== myUid).map((player) => {
                const selected = selectedVoteUid === player.uid;
                return (
                  <button
                    key={player.uid}
                    onClick={() => setSelectedVoteUid(player.uid)}
                    className={`w-full flex items-center gap-3 p-3.5 border rounded-2xl text-left transition select-none ${
                      selected 
                        ? "border-rose-500 bg-rose-500/10 shadow-sm" 
                        : "bg-slate-950 border-slate-850"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      selected ? "bg-rose-500/10 border border-rose-500/35 text-rose-500" : "bg-violet-600/10 border border-violet-500 text-violet-400"
                    }`}>
                      {player.name?.[0]?.toUpperCase() || "?"}
                    </div>
                    <span className={`flex-1 text-sm font-semibold ${selected ? "text-rose-455 font-bold" : "text-slate-300"}`}>
                      {player.name}
                    </span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selected ? "border-rose-500" : "border-slate-700"}`}>
                      {selected && <div className="w-2 h-2 rounded-full bg-rose-500" />}
                    </div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleVoteSubmit}
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
          <div className="flex-grow flex flex-col items-center justify-center text-center py-8">
            <CheckCircle2 size={56} className="text-emerald-500 mb-4" />
            <h4 className="text-base font-bold text-white mb-1">Vote Submitted!</h4>
            <p className="text-xs text-slate-400 mb-8">
              Suspect: {players.find(p => p.uid === votes[myUid])?.name || "Unknown"}
            </p>

            <div className="w-full bg-emerald-500/10 border border-emerald-500/30 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs text-emerald-400">
              <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
              <span>Waiting for voters ({Object.keys(votes).length} / {players.length})...</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 4. Results Panel
  const renderResultsScreen = () => {
    const votesArray = Object.values(votes);
    const voteCounts = {};
    players.forEach(p => {
      voteCounts[p.uid] = votesArray.filter(v => v === p.uid).length;
    });

    const sortedPlayersByVotes = [...players].sort((a, b) => (voteCounts[b.uid] || 0) - (voteCounts[a.uid] || 0));
    const isBonusSubmitted = roomData.imposterGuess !== undefined;

    return (
      <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[480px] animate-fade-in">
        <div className="w-full flex justify-between items-center mb-5">
          <span className="bg-rose-650 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest text-white font-mono">
            RESULTS REVEAL
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">WHO WAS CAUGHT?</span>
        </div>

        {/* Imposter Reveal banner */}
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 flex flex-col items-center text-center">
          <span className="text-[9px] font-bold text-rose-500 tracking-wider">THE IMPOSTER WAS</span>
          <h2 className="text-xl font-black text-rose-500 mt-1 font-mono">{imposterPlayer?.name}</h2>
        </div>

        {/* Topic Reveal banner */}
        {(!isImposter || isBonusSubmitted) ? (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex flex-col items-center text-center mt-3">
            <span className="text-[9px] font-bold text-emerald-500 tracking-wider">THE SECRET TOPIC WAS</span>
            <h3 className="text-lg font-black text-emerald-500 mt-1 font-mono">{gameData.answer}</h3>
          </div>
        ) : (
          <div className="bg-rose-500/5 border border-rose-500/15 rounded-2xl p-4 flex flex-col items-center text-center mt-3">
            <span className="text-[9px] font-bold text-rose-500 tracking-wider">THE SECRET TOPIC IS</span>
            <div className="flex items-center gap-1.5 justify-center mt-1.5 text-xs text-rose-500 italic">
              <Lock size={14} />
              <span>Hidden until you submit guess</span>
            </div>
          </div>
        )}

        {/* Vote tally breakdown list */}
        <div className="my-4 space-y-2 max-h-[140px] overflow-y-auto pr-1">
          {sortedPlayersByVotes.map((player) => {
            const count = voteCounts[player.uid] || 0;
            const isActualImposter = player.uid === gameData.imposterId;
            return (
              <div key={player.uid} className="flex justify-between items-center py-2 border-b border-slate-850 text-xs">
                <span className={`font-semibold ${isActualImposter ? "text-rose-500 font-bold" : "text-slate-300"}`}>
                  {player.name} {isActualImposter && "(Imposter)"}
                </span>
                <span className={`font-mono ${isActualImposter ? "text-rose-500" : "text-slate-400"}`}>
                  {count} vote{count !== 1 ? "s" : ""}
                </span>
              </div>
            );
          })}
        </div>

        {/* Imposter Bonus Guess Form */}
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 space-y-3.5">
          <span className="text-[10px] font-black text-violet-500 tracking-wider block">🎯 IMPOSTER BONUS ROUND</span>

          {isImposter ? (
            <div className="space-y-3 w-full">
              <p className="text-[11px] text-slate-450 leading-relaxed">
                You survived or got caught! You have a chance to steal <span className="text-emerald-400 font-bold">+50 bonus points</span> by guessing the secret topic.
              </p>
              <input
                type="text"
                value={bonusGuess}
                onChange={(e) => setBonusGuess(e.target.value)}
                placeholder="Guess the secret topic..."
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-4 py-2.5 text-white outline-none focus:border-violet-500 text-sm font-mono"
              />
              <button
                onClick={handleBonusSubmit}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold py-2.5 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg transition active:scale-[0.98]"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Trophy size={14} />
                    <span>SUBMIT GUESS</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-4 text-center">
              <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              <p className="text-xs text-slate-450">
                Waiting for the imposter ({imposterPlayer?.name}) to guess the topic...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // 5. Leaderboard Panel
  const renderLeaderboardScreen = () => {
    const sortedLeaderboard = [...players].sort((a, b) => b.score - a.score);

    return (
      <div className="w-full max-w-md mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between min-h-[480px] animate-fade-in">
        <div className="w-full flex justify-between items-center mb-5">
          <span className="bg-violet-650 px-2.5 py-0.5 rounded text-[8px] font-black tracking-widest text-white font-mono">
            LEADERBOARD
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase font-mono tracking-wider">STANDINGS</span>
        </div>

        {/* Bonus Round outcome report */}
        {roomData.imposterGuess !== undefined && (
          <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4 text-left space-y-2">
            <span className="text-[8px] font-black text-slate-500 tracking-widest block">
              BONUS ROUND GUESS BY {imposterPlayer?.name?.toUpperCase()}:
            </span>
            <span className="text-sm font-black text-slate-200 block font-mono">"{roomData.imposterGuess}"</span>
            
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full ${roomData.imposterGuessCorrect ? "bg-emerald-500" : "bg-rose-500"}`} />
              <span className={roomData.imposterGuessCorrect ? "text-emerald-450 font-bold" : "text-rose-450 font-bold"}>
                {roomData.imposterGuessCorrect ? "CORRECT GUESS (+50 pts)" : "INCORRECT GUESS (0 pts)"}
              </span>
            </div>
            
            <span className={`text-[10px] font-bold block ${roomData.imposterSurvives ? "text-emerald-400" : "text-rose-400"}`}>
              {roomData.imposterSurvives ? "🎭 Imposter survived the votes!" : "👮 Imposter was caught!"}
            </span>

            <div className="border-t border-slate-850 pt-2 mt-2">
              <span className="text-[8px] font-black text-slate-500 tracking-widest block">THE SECRET TOPIC WAS:</span>
              <span className="text-sm font-bold text-emerald-400 block mt-1 font-mono">{gameData.answer}</span>
            </div>
          </div>
        )}

        {/* Scores list */}
        <div className="flex-1 overflow-y-auto max-h-[180px] my-4 space-y-2 pr-1">
          {sortedLeaderboard.map((player, idx) => {
            const isFirst = idx === 0;
            const isImp = player.uid === gameData.imposterId;
            return (
              <div
                key={player.uid}
                className={`flex items-center gap-3 p-3.5 border rounded-2xl ${
                  isFirst 
                    ? "border-amber-500/40 bg-amber-550/5" 
                    : "bg-slate-950 border-slate-850"
                }`}
              >
                <div className="w-6 flex items-center justify-center">
                  {isFirst ? (
                    <Trophy className="text-amber-500 animate-bounce" size={16} />
                  ) : (
                    <span className="text-xs font-mono font-bold text-slate-500">{idx + 1}</span>
                  )}
                </div>

                <span className={`flex-1 text-xs truncate ${isFirst ? "text-amber-450 font-bold" : "text-slate-200"}`}>
                  {player.name} {isImp && <span className="text-rose-500 text-[9px] font-bold ml-1">(Imposter)</span>}
                </span>

                <span className={`text-sm font-mono font-black ${isFirst ? "text-amber-400" : "text-violet-400"}`}>
                  {player.score} pts
                </span>
              </div>
            );
          })}
        </div>

        {/* Play Again control */}
        <div className="pt-3 border-t border-slate-850">
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
            <div className="space-y-3 w-full">
              <div className="w-full bg-violet-500/10 border border-violet-500/30 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-xs text-violet-400">
                <div className="w-4 h-4 border-2 border-violet-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Waiting for host to play again...</span>
              </div>
              <button
                onClick={() => navigate("/home")}
                className="w-full border border-rose-500/30 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500 font-bold py-3.5 px-6 rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <LogOut size={16} />
                <span>QUIT GAME</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
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
      {/* HUD sweep */}
      <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.02)_2px,rgba(0,0,0,0.02)_4px)] pointer-events-none z-1" />

      {/* Screen selector */}
      <div className="flex-1 flex items-center justify-center p-6 relative z-10">
        {gameStatus === "reveal" && renderRevealScreen()}
        {gameStatus === "round" && renderRoundScreen()}
        {gameStatus === "voting" && renderVotingScreen()}
        {gameStatus === "results" && renderResultsScreen()}
        {gameStatus === "leaderboard" && renderLeaderboardScreen()}
      </div>
    </div>
  );
}
