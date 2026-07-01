import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, db } from "../firebase/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useTheme } from "../context/ThemeContext";
import { Trophy, Sun, Moon, User, LogOut } from "lucide-react";
function ParticleCanvas() {
  const canvasRef = useRef(null);



  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const COUNT = 55;
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.8 + 0.4,
      dx: (Math.random() - 0.5) * 0.35,
      dy: (Math.random() - 0.5) * 0.35,
      alpha: Math.random() * 0.5 + 0.15,
      color: Math.random() > 0.6 ? "#7C3AED" : Math.random() > 0.5 ? "#00E5FF" : "#39FF14",
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1;
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

function RadarRing() {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      {[180, 260, 340].map((size, i) => (
        <div
          key={size}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: size,
            height: size,
            marginTop: -size / 2,
            marginLeft: -size / 2,
            borderRadius: "50%",
            border: `1px solid rgba(124,58,237,${0.25 - i * 0.06})`,
            animation: `pulse-ring 3s ${i * 0.8}s ease-out infinite`,
          }}
        />
      ))}

      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 170,
          height: 170,
          marginTop: -85,
          marginLeft: -85,
          borderRadius: "50%",
          overflow: "hidden",
          animation: "spin 4s linear infinite",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            width: "50%",
            height: "50%",
            transformOrigin: "0% 100%",
            background:
              "conic-gradient(from 0deg, transparent 0deg, rgba(0,229,255,0.18) 60deg, transparent 70deg)",
          }}
        />
      </div>
    </div>
  );
}

function GlitchTitle({ text }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          color: "#00E5FF",
          clipPath: "polygon(0 15%, 100% 15%, 100% 35%, 0 35%)",
          animation: "glitch-top 4s infinite",
          fontSize: "inherit",
          fontWeight: "inherit",
          fontFamily: "inherit",
          letterSpacing: "inherit",
          opacity: 0.7,
        }}
      >
        {text}
      </span>
      <span
        style={{
          position: "relative",
          zIndex: 1,
          background: "linear-gradient(135deg, #F0F0FF 0%, #a78bfa 50%, #00E5FF 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {text}
      </span>
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          color: "#39FF14",
          clipPath: "polygon(0 65%, 100% 65%, 100% 80%, 0 80%)",
          animation: "glitch-bot 4s infinite 0.15s",
          fontSize: "inherit",
          fontWeight: "inherit",
          fontFamily: "inherit",
          letterSpacing: "inherit",
          opacity: 0.6,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function GameButton({ onClick, accent, label, sub, delay = "0s", icon }) {
  const [hovered, setHovered] = useState(false);

  const colors = {
    violet: {
      bg: "linear-gradient(135deg, #4C1D95 0%, #6D28D9 60%, #7C3AED 100%)",
      glow: "0 0 24px rgba(124,58,237,0.6), 0 0 60px rgba(124,58,237,0.2)",
      border: "rgba(167,139,250,0.4)",
      shimmer: "rgba(167,139,250,0.15)",
    },
    emerald: {
      bg: "linear-gradient(135deg, #064E3B 0%, #059669 60%, #10B981 100%)",
      glow: "0 0 24px rgba(16,185,129,0.6), 0 0 60px rgba(16,185,129,0.2)",
      border: "rgba(52,211,153,0.4)",
      shimmer: "rgba(52,211,153,0.15)",
    },
  };

  const c = colors[accent];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 20,
        padding: "22px 24px",
        marginBottom: 16,
        cursor: "pointer",
        position: "relative",
        overflow: "hidden",
        textAlign: "left",
        transition: "transform 0.18s ease, box-shadow 0.18s ease",
        transform: hovered ? "translateY(-3px) scale(1.01)" : "translateY(0) scale(1)",
        boxShadow: hovered ? c.glow : "0 2px 12px rgba(0,0,0,0.4)",
        animation: `fade-up 0.6s ${delay} both`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(105deg, transparent 40%, ${c.shimmer} 50%, transparent 60%)`,
          backgroundSize: "200% 100%",
          animation: hovered ? "shimmer 0.7s ease forwards" : "none",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          top: 12,
          right: 16,
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: hovered ? "#39FF14" : "rgba(255,255,255,0.3)",
          boxShadow: hovered ? "0 0 8px #39FF14" : "none",
          transition: "all 0.2s",
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative", zIndex: 1 }}>
        <span style={{ fontSize: 32 }}>{icon}</span>
        <div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#F0F0FF",
              fontFamily: "'Orbitron', monospace",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
            }}
          >
            {label}
          </div>
          <div
            style={{
              fontSize: 13,
              color: "rgba(240,240,255,0.65)",
              marginTop: 4,
              fontFamily: "'Inter', sans-serif",
              letterSpacing: "0.03em",
            }}
          >
            {sub}
          </div>
        </div>
      </div>
    </button>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const { theme, toggleTheme, colors } = useTheme();
  const [coins, setCoins] = useState(0);

  const myUid = auth.currentUser?.uid;
  const isDark = theme === "dark";

  useEffect(() => {
    if (!myUid) return;
    const unsub = onSnapshot(doc(db, "user_stats", myUid), (snap) => {
      if (snap.exists()) {
        setCoins(snap.data().highScore || 0);
      }
    });
    return () => unsub();
  }, [myUid]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <>
      {/* Google Fonts & Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Inter:wght@400;500;600;700&display=swap');

        @keyframes scan-line {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        @keyframes pulse-ring {
          0% { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
          50% { opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0; }
        }
        @keyframes float {
          0% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(3deg); }
          100% { transform: translateY(0px) rotate(0deg); }
        }
        @keyframes glitch-top {
          0%, 100% { transform: translate(0); }
          10% { transform: translate(-1.5px, -1px); }
          20% { transform: translate(1.5px, 1px); }
          30% { transform: translate(-1.5px, 1px); }
          40% { transform: translate(1px, -1px); }
          50% { transform: translate(-1px, 1.5px); }
          60% { transform: translate(1px, 1px); }
        }
        @keyframes glitch-bot {
          0%, 100% { transform: translate(0); }
          10% { transform: translate(1px, 1px); }
          20% { transform: translate(-1px, -1.5px); }
          30% { transform: translate(1.5px, -1px); }
          40% { transform: translate(-1.5px, 1px); }
          50% { transform: translate(1px, -1px); }
          60% { transform: translate(-1px, 1px); }
        }
        @keyframes fade-up {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes badge-pop {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: isDark
            ? "radial-gradient(ellipse at 50% 0%, #1a0533 0%, #050508 55%)"
            : "radial-gradient(ellipse at 50% 0%, #e3f0ff 0%, #f7f9fc 70%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Inter', sans-serif",
          transition: "background 0.3s ease",
        }}
      >
        <ParticleCanvas />

        {/* Dynamic Premium Header Bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "between",
            padding: "16px 20px",
            background: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.4)",
            backdropFilter: "blur(10px)",
            borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid rgba(0,0,0,0.05)",
          }}
        >
          {/* Coins balance pill */}
          <div
            onClick={() => navigate("/coin-history")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: isDark ? "rgba(245,158,11,0.08)" : "rgba(245,158,11,0.12)",
              border: isDark ? "1px solid rgba(245,158,11,0.25)" : "1px solid rgba(245,158,11,0.4)",
              borderRadius: 14,
              padding: "6px 14px",
              cursor: "pointer",
              transition: "transform 0.15s ease",
            }}
            onMouseEnter={e => e.currentTarget.style.transform = "scale(1.03)"}
            onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
          >
            <Trophy size={14} className="text-amber-500" />
            <span style={{ fontSize: 13, fontWeight: 800, color: isDark ? "#FFF" : "#1A1A1A", fontFamily: "'Orbitron', sans-serif" }}>
              {coins}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(245,158,11,0.85)", letterSpacing: "0.05em" }}>
              coins
            </span>
          </div>

          {/* Action buttons list */}
          <div style={{ display: "flex", itemsCenter: "center", gap: 10 }}>
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                borderRadius: 10,
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Profile settings */}
            <button
              onClick={() => navigate("/profile")}
              style={{
                background: "rgba(255,255,255,0.04)",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                borderRadius: 10,
                width: 34,
                height: 34,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.6)",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.04)"}
            >
              <User size={15} />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(255,255,255,0.04)",
                border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid rgba(0,0,0,0.08)",
                borderRadius: 10,
                padding: "0 12px",
                height: 34,
                cursor: "pointer",
                color: "rgba(239,68,68,0.7)",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "rgba(239,68,68,0.12)";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                e.currentTarget.style.color = "rgba(239,68,68,0.7)";
              }}
            >
              <LogOut size={13} />
              Logout
            </button>
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: 2,
            background: "linear-gradient(90deg, transparent, rgba(0,229,255,0.3), transparent)",
            animation: "scan-line 8s linear infinite",
            pointerEvents: "none",
            zIndex: 1,
          }}
        />

        <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 2, paddingTop: 60 }}>

          <div
            style={{
              textAlign: "center",
              marginBottom: 36,
              position: "relative",
              animation: "fade-up 0.7s 0.1s both",
            }}
          >
            <RadarRing />

            <div
              style={{
                fontSize: 48,
                marginBottom: 6,
                animation: "float 3.5s ease-in-out infinite",
                position: "relative",
                zIndex: 1,
                filter: "drop-shadow(0 0 14px rgba(124,58,237,0.8))",
              }}
            >
              👁️
            </div>

            <h1
              style={{
                fontFamily: "'Orbitron', monospace",
                fontSize: "clamp(34px, 9vw, 48px)",
                fontWeight: 900,
                letterSpacing: "0.12em",
                lineHeight: 1,
                textTransform: "uppercase",
                position: "relative",
                zIndex: 1,
              }}
            >
              <GlitchTitle text="IMPOSTER" />
            </h1>

            <div style={{ marginTop: 10, position: "relative", zIndex: 1 }}>
              <span
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 650,
                  letterSpacing: "0.22em",
                  color: isDark ? "rgba(0,229,255,0.8)" : "#0ea5e9",
                  textTransform: "uppercase",
                  border: isDark ? "1px solid rgba(0,229,255,0.25)" : "1px solid rgba(14,165,233,0.3)",
                  padding: "4px 14px",
                  borderRadius: 20,
                  background: isDark ? "rgba(0,229,255,0.06)" : "rgba(14,165,233,0.05)",
                }}
              >
                ACCA &nbsp;•&nbsp; CMA &nbsp;•&nbsp; Revision Game
              </span>
            </div>

            <div
              style={{
                marginTop: 14,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(57,255,20,0.08)",
                border: "1px solid rgba(57,255,20,0.3)",
                borderRadius: 20,
                padding: "4px 12px",
                animation: "badge-pop 0.5s 1s both",
                position: "relative",
                zIndex: 1,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#39FF14",
                  boxShadow: "0 0 8px #39FF14",
                  display: "inline-block",
                  animation: "pulse-ring 2s infinite",
                }}
              />
              <span style={{ fontSize: 11, color: "#39FF14", fontWeight: 600, letterSpacing: "0.08em" }}>
                2,841 players online
              </span>
            </div>
          </div>

          {/* <GameButton
            onClick={() => navigate("/solo")}
            accent="violet"
            label="Solo Mode"
            sub="Pass & Play — one device, full chaos"
            delay="0.35s"
            icon="🎮"
          /> */}

          <GameButton
            onClick={() => navigate("/multiplayer")}
            accent="emerald"
            label="Start Game"
            sub="Challenge friends online in real-time"
            delay="0.5s"
            icon="🌐"
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "16px 0",
              animation: "fade-up 0.6s 0.65s both",
            }}
          >
            <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
            <span style={{ fontSize: 10, color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)", letterSpacing: "0.18em" }}>
              OR
            </span>
            <div style={{ flex: 1, height: 1, background: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }} />
          </div>

          {/* Active 3-column sub grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              animation: "fade-up 0.6s 0.75s both",
            }}
          >
            {[
              { label: "Daily Chest", route: "/daily-reward", emoji: "🎁", col: "#f59e0b" },
              { label: "Leaderboard", route: "/rankings", emoji: "🏆", col: "#00E5FF" },
              { label: "Game Rules", route: "/rules", emoji: "📜", col: "#8b5cf6" },
            ].map(({ label, route, emoji, col }) => (
              <button
                key={label}
                onClick={() => navigate(route)}
                style={{
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.75)",
                  border: isDark ? "1px solid rgba(255,255,255,0.07)" : "1px solid rgba(0,0,0,0.08)",
                  borderRadius: 16,
                  padding: "16px 12px",
                  textAlign: "center",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.2s ease",
                  boxShadow: isDark ? "none" : "0 4px 6px rgba(0,0,0,0.02)",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = col;
                  e.currentTarget.style.boxShadow = `0 4px 15px ${col}25`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.08)";
                  e.currentTarget.style.boxShadow = isDark ? "none" : "0 4px 6px rgba(0,0,0,0.02)";
                }}
              >
                <div style={{ fontSize: 24 }}>{emoji}</div>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: isDark ? "rgba(240,240,255,0.85)" : "#334155",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
              </button>
            ))}
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: 24,
              fontSize: 10,
              color: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.3)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              animation: "fade-up 0.6s 0.9s both",
            }}
          >
            Study &nbsp;•&nbsp; Play &nbsp;•&nbsp; Compete
          </p>
        </div>
      </div>
    </>
  );
}