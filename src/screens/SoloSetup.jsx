import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { generateTopic } from "../generateTopic";

function SoloSetup() {
  const navigate = useNavigate();

  const [course, setCourse] = useState("ACCA");
  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState(Array(4).fill(""));
  const [loading, setLoading] = useState(false);

  const handleCountChange = (val) => {
    const n = Math.max(3, Math.min(10, Number(val)));
    setPlayerCount(n);
    setPlayerNames((prev) => {
      const updated = [...prev];
      while (updated.length < n) updated.push("");
      return updated.slice(0, n);
    });
  };

  const handleNameChange = (i, val) => {
    setPlayerNames((prev) => {
      const updated = [...prev];
      updated[i] = val;
      return updated;
    });
  };

  const startGame = async () => {
    setLoading(true);
    try {
      const topic = await generateTopic(course);

      const players = playerNames.map((name, i) => ({
        uid: `solo-${i}`,
        name: name.trim() || `Player ${i + 1}`,
      }));

      const imposterIndex = Math.floor(Math.random() * players.length);

      navigate("/reveal", {
        state: {
          course,
          players,
          topic,
          imposterIndex,
        },
      });
    } catch (error) {
      console.log(error);
      alert("Failed to generate topic");
      setLoading(false);
    }
  };

  const styles = `
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');

    @keyframes fade-up {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes scan-line {
      0%   { top: -2px; opacity: 0; }
      10%  { opacity: 0.3; }
      90%  { opacity: 0.3; }
      100% { top: 100%; opacity: 0; }
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    .solo-input {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 12px;
      padding: 12px 14px;
      color: #F0F0FF;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      outline: none;
      transition: border-color 0.15s, background 0.15s;
    }
    .solo-input:focus {
      border-color: rgba(167,139,250,0.5);
      background: rgba(124,58,237,0.07);
    }
    .solo-input::placeholder { color: rgba(255,255,255,0.2); }

    .solo-select {
      width: 100%;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 12px;
      padding: 12px 14px;
      color: #F0F0FF;
      font-size: 14px;
      font-family: 'Inter', sans-serif;
      outline: none;
      appearance: none;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .solo-select:focus { border-color: rgba(167,139,250,0.5); }
    .solo-select option { background: #0d0d14; }

    .player-row {
      display: flex;
      align-items: center;
      gap: 10px;
      animation: fade-up 0.3s ease both;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #1a0533 0%, #050508 60%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "28px 16px",
        fontFamily: "'Inter', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.25), transparent)",
          animation: "scan-line 9s linear infinite", pointerEvents: "none",
        }} />

        <div style={{ width: "100%", maxWidth: 440, animation: "fade-up 0.5s ease both" }}>

          <a href="/home" style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            color: "rgba(255,255,255,0.3)", textDecoration: "none",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", marginBottom: 24,
            transition: "color 0.15s",
          }}
            onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
            onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.3)"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </a>

          <div style={{ marginBottom: 28 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.25em",
              color: "rgba(0,229,255,0.5)", textTransform: "uppercase", marginBottom: 6,
            }}>Game Mode</p>
            <h1 style={{
              fontFamily: "'Orbitron', monospace",
              fontSize: "clamp(26px, 8vw, 34px)",
              fontWeight: 900, letterSpacing: "0.08em",
              color: "#F0F0FF", textTransform: "uppercase",
            }}>Solo Setup</h1>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 22, padding: "24px",
            marginBottom: 12,
          }}>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
              color: "rgba(167,139,250,0.5)", textTransform: "uppercase", marginBottom: 10,
            }}>Course</p>
            <div style={{ position: "relative" }}>
              <select className="solo-select" value={course} onChange={(e) => setCourse(e.target.value)}>
                <option value="ACCA">ACCA</option>
                <option value="CMA">CMA</option>
              </select>
              <svg style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 22, padding: "24px",
            marginBottom: 12,
          }}>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
              color: "rgba(167,139,250,0.5)", textTransform: "uppercase", marginBottom: 10,
            }}>Number of Players</p>
            <div style={{ position: "relative" }}>
              <select
                className="solo-select"
                value={playerCount}
                onChange={(e) => handleCountChange(e.target.value)}
              >
                {[3,4,5,6,7,8,9,10].map(n => (
                  <option key={n} value={n}>{n} Players</option>
                ))}
              </select>
              <svg style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
                width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>

          <div style={{
            background: "rgba(76,29,149,0.1)",
            border: "1px solid rgba(167,139,250,0.18)",
            borderRadius: 22, padding: "24px",
            marginBottom: 16,
          }}>
            <p style={{
              fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
              color: "rgba(167,139,250,0.5)", textTransform: "uppercase", marginBottom: 14,
            }}>Player Names</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {playerNames.map((name, i) => (
                <div key={i} className="player-row" style={{ animationDelay: `${i * 0.04}s` }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                    background: "linear-gradient(135deg, #4C1D95, #7C3AED)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, fontWeight: 800, color: "#F0F0FF",
                    fontFamily: "'Orbitron', monospace",
                  }}>
                    {name.trim() ? name.trim()[0].toUpperCase() : (i + 1)}
                  </div>
                  <input
                    className="solo-input"
                    placeholder={`Player ${i + 1}`}
                    value={name}
                    onChange={(e) => handleNameChange(i, e.target.value)}
                    maxLength={20}
                  />
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={startGame}
            disabled={loading}
            style={{
              width: "100%",
              background: loading
                ? "rgba(124,58,237,0.3)"
                : "linear-gradient(135deg, #4C1D95 0%, #6D28D9 60%, #7C3AED 100%)",
              border: "1px solid rgba(167,139,250,0.4)",
              borderRadius: 16,
              padding: "16px 20px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              transition: "all 0.18s ease",
              boxShadow: loading ? "none" : "0 4px 24px rgba(124,58,237,0.35)",
            }}
          >
            {loading ? (
              <>
                <div style={{
                  width: 16, height: 16, borderRadius: "50%",
                  border: "2px solid rgba(255,255,255,0.2)",
                  borderTopColor: "#fff",
                  animation: "spin 0.7s linear infinite",
                }} />
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 800, color: "#F0F0FF", letterSpacing: "0.08em" }}>
                  GENERATING…
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 16 }}>🎮</span>
                <span style={{ fontFamily: "'Orbitron', monospace", fontSize: 13, fontWeight: 800, color: "#F0F0FF", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  Start Game
                </span>
              </>
            )}
          </button>

        </div>
      </div>
    </>
  );
}

export default SoloSetup;