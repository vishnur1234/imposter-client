import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebase";
import { generateTopic } from "../generateTopic";

function RoleReveal() {
  const location = useLocation();
  const navigate = useNavigate();

  const course = location.state?.course || "ACCA";
  const playerList = location.state?.players || [];
  const topic = location.state?.topic;
  const imposterIndex = location.state?.imposterIndex ?? -1;

  const gamePlayers = playerList.map((p, i) => ({
    id: p.uid || i,
    name: p.name || p.email || `Player ${i + 1}`,
    role: i === imposterIndex ? "IMPOSTER" : "PLAYER",
  }));

  const currentUid = auth.currentUser?.uid;
  const myPlayer = gamePlayers.find((p) => p.id === currentUid) || gamePlayers[0];
  const isImposter = myPlayer?.role === "IMPOSTER";

  const [phase, setPhase] = useState("card");
  const [revealed, setRevealed] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [suspects, setSuspects] = useState({});
  const [selectedTopic, setSelectedTopic] = useState(topic);

  const toggleSuspect = (id) => {
    setSuspects((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRestart = async () => {
    try {
      const newTopic = await generateTopic(course);
      setSelectedTopic(newTopic);
      setRevealed(false);
      setPhase("card");
      setShowWinner(false);
      setSuspects({});
    } catch (error) {
      alert("Failed to generate topic");
    }
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');

    @keyframes fade-up {
      from { opacity: 0; transform: translateY(20px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes flip-in {
      0%   { opacity: 0; transform: rotateY(90deg) scale(0.95); }
      60%  { transform: rotateY(-6deg) scale(1.02); }
      100% { opacity: 1; transform: rotateY(0deg) scale(1); }
    }
    @keyframes imposter-pulse {
      0%,100% { text-shadow: 0 0 20px rgba(239,68,68,0.8), 0 0 40px rgba(239,68,68,0.4); }
      50%      { text-shadow: 0 0 40px rgba(239,68,68,1),   0 0 80px rgba(239,68,68,0.6); }
    }
    @keyframes scan-line {
      0%   { top: -2px; opacity: 0; }
      10%  { opacity: 0.3; }
      90%  { opacity: 0.3; }
      100% { top: 100%; opacity: 0; }
    }
    @keyframes float {
      0%,100% { transform: translateY(0px); }
      50%      { transform: translateY(-6px); }
    }
    @keyframes reveal-glow {
      0%   { box-shadow: 0 0 0 rgba(124,58,237,0); }
      50%  { box-shadow: 0 0 60px rgba(124,58,237,0.5), 0 0 120px rgba(124,58,237,0.2); }
      100% { box-shadow: 0 0 20px rgba(124,58,237,0.3); }
    }
    @keyframes suspect-shake {
      0%,100% { transform: translateX(0); }
      25%      { transform: translateX(-3px); }
      75%      { transform: translateX(3px); }
    }

    .rv-btn {
      width: 100%;
      border: none;
      border-radius: 16px;
      padding: 16px 24px;
      font-size: 15px;
      font-weight: 700;
      font-family: 'Inter', sans-serif;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: transform 0.15s ease, box-shadow 0.15s ease;
    }
    .rv-btn:hover { transform: translateY(-2px); }
    .rv-btn:active { transform: translateY(0) scale(0.98); }

    .rv-btn-violet {
      background: linear-gradient(135deg, #4C1D95 0%, #6D28D9 60%, #7C3AED 100%);
      color: #F0F0FF;
      box-shadow: 0 4px 20px rgba(124,58,237,0.35);
    }
    .rv-btn-violet:hover { box-shadow: 0 6px 32px rgba(124,58,237,0.6); }

    .rv-btn-red {
      background: linear-gradient(135deg, #7F1D1D 0%, #B91C1C 60%, #EF4444 100%);
      color: #FFF1F2;
      box-shadow: 0 4px 20px rgba(239,68,68,0.35);
    }
    .rv-btn-red:hover { box-shadow: 0 6px 32px rgba(239,68,68,0.6); }

    .rv-btn-green {
      background: linear-gradient(135deg, #064E3B 0%, #059669 60%, #10B981 100%);
      color: #F0FFF4;
      box-shadow: 0 4px 20px rgba(16,185,129,0.35);
    }
    .rv-btn-green:hover { box-shadow: 0 6px 32px rgba(16,185,129,0.6); }

    .rv-btn-ghost {
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.1) !important;
      color: rgba(240,240,255,0.7);
      box-shadow: none;
    }
    .rv-btn-ghost:hover { background: rgba(255,255,255,0.1); }

    * { box-sizing: border-box; margin: 0; padding: 0; }
  `;

  const scanLine = (
    <div style={{
      position: "absolute", left: 0, right: 0, height: 2,
      background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.25), transparent)",
      animation: "scan-line 9s linear infinite", pointerEvents: "none",
    }} />
  );

  const wrapper = (children) => (
    <>
      <style>{styles}</style>
      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #1a0533 0%, #050508 60%)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
        fontFamily: "'Inter', sans-serif",
        position: "relative", overflow: "hidden",
      }}>
        {scanLine}
        <div style={{ width: "100%", maxWidth: 420 }}>
          {children}
        </div>
      </div>
    </>
  );

  if (phase === "card") {
    return wrapper(
      !revealed ? (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24, padding: "32px 24px",
          textAlign: "center",
          backdropFilter: "blur(10px)",
          animation: "fade-up 0.45s ease both",
        }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: "rgba(0,229,255,0.6)",
            letterSpacing: "0.18em", textTransform: "uppercase",
            border: "1px solid rgba(0,229,255,0.2)", padding: "4px 10px",
            borderRadius: 20, background: "rgba(0,229,255,0.05)",
            display: "inline-block", marginBottom: 32,
          }}>{course}</span>

          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "linear-gradient(135deg, #4C1D95, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 20px",
            fontSize: 30,
            boxShadow: "0 0 30px rgba(124,58,237,0.5)",
            animation: "float 3s ease-in-out infinite",
          }}>
            {myPlayer?.name?.[0]?.toUpperCase() || "?"}
          </div>

          <h1 style={{
            fontFamily: "'Orbitron', monospace",
            fontSize: "clamp(26px, 7vw, 34px)",
            fontWeight: 900, color: "#F0F0FF",
            letterSpacing: "0.06em", marginBottom: 10,
          }}>{myPlayer?.name}</h1>

          <p style={{
            fontSize: 13, color: "rgba(255,255,255,0.35)",
            marginBottom: 32, letterSpacing: "0.02em",
          }}>
            Only you can see your card — tap to reveal
          </p>

          <button className="rv-btn rv-btn-violet" onClick={() => setRevealed(true)}>
            Reveal My Card
          </button>
        </div>
      ) : (
        <div style={{
          background: isImposter ? "rgba(127,29,29,0.15)" : "rgba(255,255,255,0.03)",
          border: isImposter ? "1px solid rgba(239,68,68,0.25)" : "1px solid rgba(52,211,153,0.2)",
          borderRadius: 24, padding: "32px 24px",
          textAlign: "center",
          backdropFilter: "blur(10px)",
          animation: "flip-in 0.45s ease both",
          boxShadow: isImposter
            ? "0 0 40px rgba(239,68,68,0.12)"
            : "0 0 40px rgba(52,211,153,0.08)",
        }}>
          <div style={{
            display: "flex", justifyContent: "flex-end",
            marginBottom: 28,
          }}>
            <span style={{
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.12em",
            }}>{myPlayer?.name}</span>
          </div>

          {isImposter ? (
            <>
              <div style={{ marginBottom: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "rgba(239,68,68,0.6)",
                  letterSpacing: "0.22em", textTransform: "uppercase",
                }}>You Are</span>
              </div>

              <h1 style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "clamp(38px, 11vw, 52px)",
                fontWeight: 900, color: "#ef4444",
                letterSpacing: "0.1em", textTransform: "uppercase",
                marginBottom: 24,
                animation: "imposter-pulse 2s ease-in-out infinite",
              }}>IMPOSTER</h1>

              <p style={{
                fontSize: 12, color: "rgba(255,255,255,0.35)",
                marginBottom: 16, letterSpacing: "0.1em", textTransform: "uppercase",
              }}>Guess the topic from these clues</p>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
                {selectedTopic?.clues?.map((clue, i) => (
                  <div key={i} style={{
                    background: "rgba(239,68,68,0.07)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    borderRadius: 12, padding: "12px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                    animation: `fade-up 0.4s ${0.1 + i * 0.07}s both`,
                  }}>
                    <span style={{
                      fontSize: 11, fontWeight: 800, color: "rgba(239,68,68,0.5)",
                      fontFamily: "'Orbitron', monospace", minWidth: 20,
                    }}>{String(i + 1).padStart(2, "0")}</span>
                    <span style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)", textAlign: "left" }}>
                      {clue}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div style={{ marginBottom: 8 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "rgba(52,211,153,0.7)",
                  letterSpacing: "0.22em", textTransform: "uppercase",
                }}>Your Topic Is</span>
              </div>

              <div style={{
                background: "rgba(52,211,153,0.06)",
                border: "1px solid rgba(52,211,153,0.2)",
                borderRadius: 18, padding: "28px 20px",
                marginBottom: 16,
                animation: "reveal-glow 1s ease forwards",
              }}>
                <h1 style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: "clamp(28px, 8vw, 38px)",
                  fontWeight: 900, color: "#F0F0FF",
                  letterSpacing: "0.06em",
                  textShadow: "0 0 30px rgba(52,211,153,0.3)",
                }}>{selectedTopic?.answer}</h1>
              </div>

              <p style={{
                fontSize: 13, color: "rgba(255,255,255,0.3)",
                marginBottom: 28, lineHeight: 1.6,
              }}>
                Describe this in <strong style={{ color: "rgba(52,211,153,0.7)" }}>one word</strong>. Don't let the imposter guess it.
              </p>
            </>
          )}

          <button className="rv-btn rv-btn-green" onClick={() => setPhase("discussion")}>
            ✓ I've Seen My Card — Go to Discussion
          </button>
        </div>
      )
    );
  }

  const imposterPlayer = gamePlayers.find((p) => p.role === "IMPOSTER");

  return wrapper(
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 24, padding: "28px 24px",
      backdropFilter: "blur(10px)",
      animation: "fade-up 0.5s 0.1s both",
    }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 8, animation: "float 3s ease-in-out infinite" }}>🕵️</div>
        <h1 style={{
          fontFamily: "'Orbitron', monospace",
          fontSize: 22, fontWeight: 800,
          color: "#a78bfa", letterSpacing: "0.08em",
          textTransform: "uppercase", marginBottom: 8,
        }}>Discussion Phase</h1>
        <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
          Each player describes the topic in{" "}
          <strong style={{ color: "rgba(255,255,255,0.65)" }}>one word</strong>.
          Vote on who the imposter is.
        </p>
      </div>

      <div style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 18, padding: "18px 16px", marginBottom: 20,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)",
            letterSpacing: "0.2em", textTransform: "uppercase",
          }}>Suspect Board</span>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", letterSpacing: "0.1em" }}>
            Tap to mark suspects
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
          {gamePlayers.map((p) => {
            const isSuspect = suspects[p.id];
            return (
              <button
                key={p.id}
                onClick={() => toggleSuspect(p.id)}
                style={{
                  padding: "12px 10px", borderRadius: 12,
                  fontWeight: 700, fontSize: 13,
                  fontFamily: "'Inter', sans-serif",
                  cursor: "pointer",
                  border: isSuspect ? "1px solid rgba(239,68,68,0.5)" : "1px solid rgba(255,255,255,0.06)",
                  background: isSuspect ? "rgba(127,29,29,0.4)" : "rgba(255,255,255,0.04)",
                  color: isSuspect ? "#fca5a5" : "rgba(240,240,255,0.6)",
                  transition: "all 0.18s ease", textAlign: "center",
                  animation: isSuspect ? "suspect-shake 0.25s ease" : "none",
                  boxShadow: isSuspect ? "0 0 12px rgba(239,68,68,0.2)" : "none",
                }}
              >
                {p.name} {p.id === currentUid && "👤"} {isSuspect && "🎯"}
              </button>
            );
          })}
        </div>
      </div>

      {!showWinner ? (
        <button className="rv-btn rv-btn-red" onClick={() => setShowWinner(true)}>
          ⚡ Reveal the Imposter
        </button>
      ) : (
        <div style={{ animation: "flip-in 0.5s ease both" }}>
          <div style={{
            background: "rgba(127,29,29,0.2)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: 18, padding: "24px 20px",
            textAlign: "center", marginBottom: 16,
          }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6,
            }}>The Imposter Was</p>
            <h2 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 28, fontWeight: 900, color: "#ef4444",
              letterSpacing: "0.06em", marginBottom: 20,
              animation: "imposter-pulse 2s ease-in-out infinite",
            }}>{imposterPlayer?.name}</h2>

            <div style={{ width: "100%", height: 1, background: "rgba(255,255,255,0.06)", marginBottom: 20 }} />

            <p style={{
              fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)",
              letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6,
            }}>The Topic Was</p>
            <h2 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: 24, fontWeight: 900, color: "#34d399",
              letterSpacing: "0.06em",
              textShadow: "0 0 20px rgba(52,211,153,0.5)",
            }}>{selectedTopic?.answer}</h2>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button className="rv-btn rv-btn-violet" style={{ flex: 1 }} onClick={handleRestart}>
              Play Again
            </button>
            <button className="rv-btn rv-btn-ghost" style={{ flex: 1 }} onClick={() => navigate("/home")}>
              Home
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RoleReveal;