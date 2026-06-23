import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase/firebase";
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
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@700;800;900&family=Inter:wght@400;500;600&display=swap');

        @keyframes fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes pulse-ring {
          0%   { opacity: 0.6; transform: translate(-50%,-50%) scale(1); }
          70%  { opacity: 0;   transform: translate(-50%,-50%) scale(1.15); }
          100% { opacity: 0;   transform: translate(-50%,-50%) scale(1.15); }
        }
        @keyframes glitch-top {
          0%,90%,100% { transform: translate(0); }
          91%          { transform: translate(-3px, 1px); }
          93%          { transform: translate(3px, -1px); }
          95%          { transform: translate(-2px, 0); }
        }
        @keyframes glitch-bot {
          0%,90%,100% { transform: translate(0); }
          91%          { transform: translate(3px, 1px); }
          93%          { transform: translate(-3px, -1px); }
          95%          { transform: translate(2px, 0); }
        }
        @keyframes shimmer {
          from { background-position: 200% center; }
          to   { background-position: -200% center; }
        }
        @keyframes float {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-7px); }
        }
        @keyframes badge-pop {
          0%   { opacity: 0; transform: scale(0.7) rotate(-6deg); }
          60%  { transform: scale(1.08) rotate(2deg); }
          100% { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes scan-line {
          0%   { top: -2px; opacity: 0; }
          10%  { opacity: 0.4; }
          90%  { opacity: 0.4; }
          100% { top: 100%; opacity: 0; }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          background: "radial-gradient(ellipse at 50% 0%, #1a0533 0%, #050508 55%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 16px",
          position: "relative",
          overflow: "hidden",
          fontFamily: "'Inter', sans-serif",
        }}
      >
        <ParticleCanvas />

        <button
          onClick={handleLogout}
          style={{
            position: "absolute",
            top: 18,
            right: 18,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "7px 13px",
            cursor: "pointer",
            color: "rgba(255,255,255,0.4)",
            fontSize: 12,
            fontWeight: 600,
            fontFamily: "'Inter', sans-serif",
            letterSpacing: "0.08em",
            transition: "all 0.18s ease",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = "rgba(239,68,68,0.12)";
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.35)";
            e.currentTarget.style.color = "#fca5a5";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Logout
        </button>

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

        <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 2 }}>

          <div
            style={{
              textAlign: "center",
              marginBottom: 44,
              position: "relative",
              animation: "fade-up 0.7s 0.1s both",
            }}
          >
            <RadarRing />

            <div
              style={{
                fontSize: 52,
                marginBottom: 10,
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
                fontSize: "clamp(36px, 10vw, 52px)",
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
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.22em",
                  color: "rgba(0,229,255,0.8)",
                  textTransform: "uppercase",
                  border: "1px solid rgba(0,229,255,0.25)",
                  padding: "4px 14px",
                  borderRadius: 20,
                  background: "rgba(0,229,255,0.06)",
                }}
              >
                ACCA &nbsp;•&nbsp; CMA &nbsp;•&nbsp; Revision Game
              </span>
            </div>

            <div
              style={{
                marginTop: 16,
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                background: "rgba(57,255,20,0.08)",
                border: "1px solid rgba(57,255,20,0.3)",
                borderRadius: 20,
                padding: "5px 14px",
                animation: "badge-pop 0.5s 1s both",
                position: "relative",
                zIndex: 1,
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#39FF14",
                  boxShadow: "0 0 8px #39FF14",
                  display: "inline-block",
                  animation: "pulse-ring 2s infinite",
                }}
              />
              <span style={{ fontSize: 12, color: "#39FF14", fontWeight: 600, letterSpacing: "0.08em" }}>
                2,841 players online
              </span>
            </div>
          </div>

          <GameButton
            onClick={() => navigate("/solo")}
            accent="violet"
            label="Solo Mode"
            sub="Pass & Play — one device, full chaos"
            delay="0.35s"
            icon="🎮"
          />

          <GameButton
            onClick={() => navigate("/multiplayer")}
            accent="emerald"
            label="Multiplayer"
            sub="Challenge friends online in real-time"
            delay="0.5s"
            icon="🌐"
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              margin: "20px 0",
              animation: "fade-up 0.6s 0.65s both",
            }}
          >
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)", letterSpacing: "0.18em" }}>
              OR
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.07)" }} />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              animation: "fade-up 0.6s 0.75s both",
            }}
          >
            {[
              { icon: "🎯", label: "Boost Marks" },
              { icon: "📈", label: "Score Higher" },
              { icon: "🏆", label: "Top Rank" },
            ].map(({ icon, label }) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 14,
                  padding: "13px 8px",
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 22, marginBottom: 5 }}>{icon}</div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(240,240,255,0.75)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {label}
                </div>
              </div>
            ))}
          </div>

          <p
            style={{
              textAlign: "center",
              marginTop: 28,
              fontSize: 11,
              color: "rgba(255,255,255,0.18)",
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