import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { doc, onSnapshot, updateDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { generateTopic } from "../generateTopic";
import { ChevronLeft } from "lucide-react";

export default function WaitingRoom() {
  const location = useLocation();
  const navigate = useNavigate();

  const [joinedPlayers, setJoinedPlayers] = useState([]);
  const [starting, setStarting] = useState(false);

  const roomCode = location.state?.roomCode;
  const course = location.state?.course || "general";
  const players = location.state?.players || 4;
  const isHost = location.state?.isHost;
  const isDemoMode = location.state?.isDemoMode;

  const startGame = async () => {
    if (joinedPlayers.length < 2 && !isDemoMode) {
      alert("Need at least 2 players to start a game.");
      return;
    }
    setStarting(true);
    try {
      const parsedTopic = await generateTopic(course);
      if (!parsedTopic || !parsedTopic.answer) {
        throw new Error("Failed to generate a valid topic.");
      }

      const imposterPlayer = joinedPlayers[Math.floor(Math.random() * joinedPlayers.length)];
      if (!imposterPlayer) {
        throw new Error("No players joined.");
      }

      const gameId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const imposterIndex = joinedPlayers.findIndex(p => p.uid === imposterPlayer.uid);

      await updateDoc(doc(db, "rooms", roomCode), {
        gameStatus: "reveal",
        started: true,
        gameId,
        imposterIndex,
        topic: parsedTopic, // compatibility
        gameData: {
          answer: parsedTopic.answer,
          clue: parsedTopic.clue || "",
          imposterId: imposterPlayer.uid
        },
        readyPlayers: [],
        hints: [],
        votes: {}
      });

      navigate("/gameplay", {
        state: { roomCode, course, isHost }
      });
    } catch (error) {
      console.log(error);
      alert("Failed to start game: " + (error.message || error));
      setStarting(false);
    }
  };

  useEffect(() => {
    if (!roomCode) return;
    const unsubscribe = onSnapshot(doc(db, "rooms", roomCode), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const playersList = data.players || data.playerList || [];

        // Enrich names from user_stats
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

        if (data.gameStatus === "reveal" || data.gameStatus === "round" || (data.started && data.topic)) {
          navigate("/gameplay", {
            state: {
              roomCode,
              course: data.category || data.course || course,
              isHost,
            },
          });
        }
      } else {
        alert("Room was disbanded.");
        navigate("/home");
      }
    });
    return () => unsubscribe();
  }, [roomCode, isHost, navigate, course]);

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, #1a0533 0%, #050508 60%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px 16px",
      fontFamily: "'Inter', sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes fade-up { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes badge-pulse { 0%,100% { box-shadow:0 0 0 0 rgba(57,255,20,0.4); } 50% { box-shadow:0 0 0 6px rgba(57,255,20,0); } }
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440, animation: "fade-up 0.5s ease both" }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: "28px 24px",
          backdropFilter: "blur(10px)",
        }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.25em",
              color: "rgba(0,229,255,0.5)", textTransform: "uppercase", marginBottom: 6,
            }}>Waiting Room</p>
            <h1 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 28, fontWeight: 900,
              color: "#F0F0FF", letterSpacing: "0.08em",
            }}>Room {roomCode}</h1>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: 18,
            padding: "16px 18px",
            marginBottom: 20,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
                color: "rgba(255,255,255,0.3)", textTransform: "uppercase",
              }}>Players Joined</span>
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: joinedPlayers.length >= Number(players) ? "#39FF14" : "rgba(255,255,255,0.3)",
              }}>
                {joinedPlayers.length} / {players}
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {joinedPlayers.map((player, i) => (
                <div key={player.uid} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 14px",
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 12,
                  animation: `fade-up 0.3s ${i * 0.06}s both`,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: "50%",
                    background: "linear-gradient(135deg, #4C1D95, #7C3AED)",
                    display: "flex", alignItems: "center", justifyCenter: "center",
                    fontSize: 12, fontWeight: 800, color: "#F0F0FF",
                    flexShrink: 0,
                    textAlign: "center",
                    lineHeight: "28px",
                  }}>
                    {player.name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(240,240,255,0.8)" }}>
                    {player.name}
                  </span>
                  <div style={{
                    marginLeft: "auto",
                    width: 7, height: 7, borderRadius: "50%",
                    background: "#39FF14", boxShadow: "0 0 6px #39FF14",
                    animation: "badge-pulse 2s infinite",
                  }} />
                </div>
              ))}

              {joinedPlayers.length === 0 && (
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", textAlign: "center", padding: "12px 0" }}>
                  Waiting for players to join…
                </p>
              )}
            </div>
          </div>

          <div style={{
            display: "flex", gap: 10, alignItems: "center", marginBottom: 20,
            padding: "10px 14px",
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)",
            borderRadius: 12,
          }}>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Course</span>
            <span style={{
              marginLeft: "auto",
              fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
              color: "rgba(0,229,255,0.7)",
              fontFamily: "'Orbitron', monospace",
            }}>{course}</span>
          </div>

          {isHost && (
            <button
              onClick={startGame}
              disabled={starting || joinedPlayers.length < 2}
              style={{
                width: "100%",
                background: starting || joinedPlayers.length < 2
                  ? "rgba(16,185,129,0.2)"
                  : "linear-gradient(135deg, #064E3B 0%, #059669 60%, #10B981 100%)",
                border: "1px solid rgba(52,211,153,0.4)",
                borderRadius: 16,
                padding: "16px 20px",
                cursor: starting || joinedPlayers.length < 2 ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                transition: "all 0.18s ease",
                boxShadow: starting ? "none" : "0 4px 24px rgba(16,185,129,0.3)",
              }}
            >
              {starting ? (
                <>
                  <div style={{
                    width: 16, height: 16, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.2)",
                    borderTopColor: "#fff",
                    animation: "spin 0.7s linear infinite",
                  }} />
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 800, color: "#F0F0FF", letterSpacing: "0.08em" }}>
                    STARTING…
                  </span>
                </>
              ) : (
                <>
                  <span style={{ fontSize: 16 }}>🚀</span>
                  <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 800, color: "#F0F0FF", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Start Game
                  </span>
                </>
              )}
            </button>
          )}

          {!isHost && (
            <div style={{
              textAlign: "center", padding: "14px",
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)",
              borderRadius: 14,
            }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>
                Waiting for the host to start the game…
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}