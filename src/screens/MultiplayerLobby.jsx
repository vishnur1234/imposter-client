import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";

function MultiplayerLobby() {
  const [roomCode, setRoomCode] = useState("");
  const [createHovered, setCreateHovered] = useState(false);
  const [joinHovered, setJoinHovered] = useState(false);
  const inputRef = useRef(null);

  const CODE_LENGTH = 6;
  const codeChars = roomCode.toUpperCase().split("").concat(Array(CODE_LENGTH).fill("")).slice(0, CODE_LENGTH);

  const navigate = useNavigate();

  const joinRoom = async () => {
    if (roomCode.length < CODE_LENGTH) return;
    try {
      const roomRef = doc(db, "rooms", roomCode);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        alert("Room not found");
        return;
      }

      const roomData = roomSnap.data();

      // Add current user to playerList
      await updateDoc(roomRef, {
        playerList: arrayUnion({
          uid: auth.currentUser?.uid || "guest",
          name: auth.currentUser?.email || "Guest Player",
        }),
      });

      navigate("/waiting-room", {
        state: {
          roomCode,
          course: roomData.course,
          players: roomData.players,
          isHost: false,
          isDemoMode: false,
        },
      });
    } catch (error) {
      console.error("Failed to join room:", error);
      alert(`Failed to join room: ${error.message || error}`);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scan-line {
          0%   { top: -2px; opacity: 0; }
          10%  { opacity: 0.35; }
          90%  { opacity: 0.35; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes hud-slide {
          from { opacity: 0; transform: translateY(-12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slot-pop {
          0%   { transform: scale(0.85); opacity: 0.4; }
          60%  { transform: scale(1.08); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes panel-glow-green {
          0%,100% { box-shadow: 0 0 0px rgba(16,185,129,0); }
          50%      { box-shadow: 0 0 30px rgba(16,185,129,0.08); }
        }
        @keyframes panel-glow-violet {
          0%,100% { box-shadow: 0 0 0px rgba(124,58,237,0); }
          50%      { box-shadow: 0 0 30px rgba(124,58,237,0.08); }
        }
        @keyframes cursor-blink {
          0%,100% { opacity: 1; }
          50%      { opacity: 0; }
        }
        @keyframes badge-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(57,255,20,0.4); }
          50%      { box-shadow: 0 0 0 4px rgba(57,255,20,0); }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        .lobby-input {
          position: absolute;
          inset: 0;
          opacity: 0;
          cursor: text;
          width: 100%;
          height: 100%;
          font-size: 0;
          border: none;
          background: transparent;
          outline: none;
          caret-color: transparent;
        }
      `}</style>

      <div style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #1a0533 0%, #050508 55%)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}>

        {/* CRT scanlines */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", zIndex: 1,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)",
        }} />

        {/* Scan sweep */}
        <div style={{
          position: "absolute", left: 0, right: 0, height: 2,
          background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)",
          animation: "scan-line 8s linear infinite",
          pointerEvents: "none", zIndex: 2,
        }} />

        {/* HUD top bar */}
        <div style={{
          position: "relative", zIndex: 10,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(0,0,0,0.3)",
          backdropFilter: "blur(10px)",
          animation: "hud-slide 0.4s ease both",
        }}>
          <a href="/" style={{
            display: "flex", alignItems: "center", gap: 7,
            color: "rgba(255,255,255,0.35)", textDecoration: "none",
            fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
            textTransform: "uppercase", fontFamily: "'Inter', sans-serif",
            transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "rgba(255,255,255,0.7)"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.35)"}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </a>

          <span style={{
            fontSize: 11, fontWeight: 800,
            color: "rgba(255,255,255,0.2)",
            fontFamily: "'Orbitron', monospace",
            letterSpacing: "0.2em", textTransform: "uppercase",
          }}>IMPOSTER</span>

          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(57,255,20,0.07)",
            border: "1px solid rgba(57,255,20,0.2)",
            borderRadius: 20, padding: "4px 10px",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#39FF14", boxShadow: "0 0 6px #39FF14",
              animation: "badge-pulse 2s infinite",
            }} />
            <span style={{ fontSize: 10, color: "rgba(57,255,20,0.85)", fontWeight: 700, letterSpacing: "0.12em" }}>ONLINE</span>
          </div>
        </div>

        {/* Main content */}
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          padding: "28px 16px 36px",
          position: "relative", zIndex: 3,
        }}>
          <div style={{ width: "100%", maxWidth: 420 }}>

            {/* Page header */}
            <div style={{ marginBottom: 28, animation: "fade-up 0.5s 0.1s both" }}>
              <p style={{
                fontSize: 10, fontWeight: 700, letterSpacing: "0.25em",
                color: "rgba(0,229,255,0.5)", textTransform: "uppercase",
                marginBottom: 6,
              }}>Game Mode</p>
              <h1 style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "clamp(26px, 8vw, 34px)",
                fontWeight: 900, letterSpacing: "0.08em",
                color: "#F0F0FF", textTransform: "uppercase",
              }}>Multiplayer</h1>
            </div>

            {/* Create Room panel */}
            <div style={{
              background: "rgba(6,78,59,0.15)",
              border: "1px solid rgba(52,211,153,0.18)",
              borderRadius: 22,
              padding: "24px",
              marginBottom: 12,
              animation: "fade-up 0.5s 0.2s both, panel-glow-green 4s ease-in-out infinite",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: "linear-gradient(90deg, transparent, rgba(52,211,153,0.4), transparent)",
              }} />

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: "rgba(16,185,129,0.12)",
                  border: "1px solid rgba(52,211,153,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>🛰️</div>
                <div>
                  <h2 style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 15, fontWeight: 800,
                    color: "#F0F0FF", letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }} >Create Room</h2>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, letterSpacing: "0.02em" }}>
                    Generate a code & invite friends
                  </p>
                </div>
              </div>

              <button
              onClick={()=>navigate("/createroom")}
                onMouseEnter={() => setCreateHovered(true)}
                onMouseLeave={() => setCreateHovered(false)}
                style={{
                  width: "100%",
                  background: createHovered
                    ? "linear-gradient(135deg, #059669 0%, #10B981 100%)"
                    : "linear-gradient(135deg, #064E3B 0%, #059669 100%)",
                  border: "1px solid rgba(52,211,153,0.4)",
                  borderRadius: 14,
                  padding: "14px 20px",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.18s ease",
                  transform: createHovered ? "translateY(-1px)" : "translateY(0)",
                  boxShadow: createHovered ? "0 6px 28px rgba(16,185,129,0.35)" : "0 2px 10px rgba(0,0,0,0.3)",
                }}
              >
                <span   style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 13, fontWeight: 800,
                  color: "#F0F0FF", letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>Create Room</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: createHovered ? "translateX(3px)" : "translateX(0)", transition: "transform 0.15s" }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>

            
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              margin: "12px 0",
              animation: "fade-up 0.5s 0.3s both",
            }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
              <span style={{
                fontSize: 10, fontWeight: 700,
                color: "rgba(255,255,255,0.2)",
                letterSpacing: "0.2em", textTransform: "uppercase",
              }}>or join existing</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
            </div>

            {/* Join Room panel */}
            <div style={{
              background: "rgba(76,29,149,0.15)",
              border: "1px solid rgba(167,139,250,0.18)",
              borderRadius: 22,
              padding: "24px",
              animation: "fade-up 0.5s 0.4s both, panel-glow-violet 4s ease-in-out 1s infinite",
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 1,
                background: "linear-gradient(90deg, transparent, rgba(167,139,250,0.4), transparent)",
              }} />

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 11,
                  background: "rgba(124,58,237,0.12)",
                  border: "1px solid rgba(167,139,250,0.25)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18,
                }}>🔐</div>
                <div>
                  <h2 style={{
                    fontFamily: "'Orbitron', monospace",
                    fontSize: 15, fontWeight: 800,
                    color: "#F0F0FF", letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}>Join Room</h2>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2, letterSpacing: "0.02em" }}>
                    Enter the 6-digit access code
                  </p>
                </div>
              </div>

             
              <div style={{ marginBottom: 16 }}>
                <p style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.2em",
                  color: "rgba(167,139,250,0.5)", textTransform: "uppercase",
                  marginBottom: 10,
                }}>Room Code</p>

                <div 
                  style={{ position: "relative", cursor: "text" }}
                  onClick={() => inputRef.current?.focus()}
                >
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(6, 1fr)",
                    gap: 7,
                    pointerEvents: "none",
                  }}>
                    {codeChars.map((char, i) => {
                      const isFilled = !!char && char !== "";
                      const isCursor = i === roomCode.length && roomCode.length < CODE_LENGTH;
                      return (
                        <div key={i} style={{
                          aspectRatio: "1",
                          borderRadius: 10,
                          border: isFilled
                            ? "1px solid rgba(167,139,250,0.6)"
                            : isCursor
                            ? "1px solid rgba(167,139,250,0.4)"
                            : "1px solid rgba(255,255,255,0.08)",
                          background: isFilled
                            ? "rgba(124,58,237,0.18)"
                            : isCursor
                            ? "rgba(124,58,237,0.07)"
                            : "rgba(255,255,255,0.03)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontFamily: "'Orbitron', monospace",
                          fontSize: 18, fontWeight: 900,
                          color: isFilled ? "#c4b5fd" : "transparent",
                          boxShadow: isFilled ? "0 0 12px rgba(124,58,237,0.3)" : "none",
                          transition: "all 0.15s ease",
                          animation: isFilled ? "slot-pop 0.2s ease" : "none",
                          position: "relative",
                        }}>
                          {isFilled ? char : ""}
                          {isCursor && (
                            <div style={{
                              width: 2, height: 18, borderRadius: 1,
                              background: "rgba(167,139,250,0.7)",
                              animation: "cursor-blink 1s ease-in-out infinite",
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                 
                  <input
                    ref={inputRef}
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, CODE_LENGTH))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        joinRoom();
                      }
                    }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      opacity: 0,
                      width: "100%",
                      height: "100%",
                      cursor: "text",
                      zIndex: 2,
                      fontSize: "16px",
                      background: "transparent",
                      border: "none",
                      outline: "none",
                    }}
                    maxLength={CODE_LENGTH}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
              </div>

              <button
                onClick={joinRoom}
                onMouseEnter={() => setJoinHovered(true)}
                onMouseLeave={() => setJoinHovered(false)}
                style={{
                  width: "100%",
                  background: joinHovered
                    ? "linear-gradient(135deg, #6D28D9 0%, #7C3AED 100%)"
                    : "linear-gradient(135deg, #4C1D95 0%, #6D28D9 100%)",
                  border: "1px solid rgba(167,139,250,0.4)",
                  borderRadius: 14,
                  padding: "14px 20px",
                  cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  transition: "all 0.18s ease",
                  transform: joinHovered ? "translateY(-1px)" : "translateY(0)",
                  boxShadow: joinHovered ? "0 6px 28px rgba(124,58,237,0.35)" : "0 2px 10px rgba(0,0,0,0.3)",
                  opacity: roomCode.length < CODE_LENGTH ? 0.5 : 1,
                }}
              >
                <span style={{
                  fontFamily: "'Orbitron', monospace",
                  fontSize: 13, fontWeight: 800,
                  color: "#F0F0FF", letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}>Join Room</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: joinHovered ? "translateX(3px)" : "translateX(0)", transition: "transform 0.15s" }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {roomCode.length > 0 && roomCode.length < CODE_LENGTH && (
                <p style={{
                  fontSize: 10, color: "rgba(167,139,250,0.5)",
                  textAlign: "center", marginTop: 10,
                  letterSpacing: "0.1em",
                }}>
                  {CODE_LENGTH - roomCode.length} more character{CODE_LENGTH - roomCode.length !== 1 ? "s" : ""} needed
                </p>
              )}
            </div>

            <p style={{
              textAlign: "center", marginTop: 24,
              fontSize: 10, color: "rgba(255,255,255,0.12)",
              letterSpacing: "0.22em", textTransform: "uppercase",
              animation: "fade-up 0.5s 0.6s both",
            }}>
              Study &nbsp;·&nbsp; Play &nbsp;·&nbsp; Compete
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default MultiplayerLobby;