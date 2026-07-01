import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { collection, query, limit, orderBy, onSnapshot, doc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";
import { useTheme } from "../context/ThemeContext";
import { ChevronLeft, Trophy, Crown, Flame } from "lucide-react";

const AVATAR_PALETTE = ["#00E5FF", "#39FF14", "#FF2E92", "#FFD23F", "#A855F7", "#FF4D4D", "#00FFC2"];

function getAvatarColor(seed = "") {
  const sum = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[sum % AVATAR_PALETTE.length];
}

function formatScore(v) {
  const score = typeof v === "number" ? v : 0;
  if (score >= 1000000) return `${(score / 1000000).toFixed(1)}M`;
  if (score >= 1000) return `${(score / 1000).toFixed(1)}K`;
  return `${score}`;
}

export default function GlobalRanking() {
  const { colors } = useTheme();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState(null);
  const [rankings, setRankings] = useState([]);

  const myUid = auth.currentUser?.uid || "guest";

  useEffect(() => {
    let unsubUser = () => {};
    let unsubRankings = () => {};

    if (myUid !== "guest") {
      unsubUser = onSnapshot(doc(db, "user_stats", myUid), (snap) => {
        if (snap.exists()) setUserStats(snap.data());
      });
    }

    const q = query(collection(db, "user_stats"), orderBy("highScore", "desc"), limit(50));
    unsubRankings = onSnapshot(
      q,
      (snap) => {
        const rows = [];
        snap.forEach((d) => {
          const data = d.data();
          rows.push({
            ...data,
            uid: data.uid || d.id,
            avatarColor: getAvatarColor((data.uid || d.id) + (data.name || data.playerName || "")),
          });
        });
        setRankings(rows);
        setLoading(false);
      },
      (err) => {
        console.error("Rankings error:", err);
        setLoading(false);
      }
    );

    return () => {
      unsubUser();
      unsubRankings();
    };
  }, [myUid]);

  const top3 = rankings.slice(0, 3);
  const rest = rankings.slice(3);
  // Sort podium display as: 2nd place, 1st place, 3rd place
  const podiumOrder = [top3[1], top3[0], top3[2]];
  const myRankIndex = rankings.findIndex((p) => p.uid === myUid);
  const myRank = myRankIndex + 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-4">
        <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="text-xs font-black tracking-widest font-mono text-violet-400">SYNCING RANKINGS...</span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "radial-gradient(ellipse at 50% 0%, #1a0533 0%, #050508 60%)",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header bar */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-slate-900 bg-black/30 backdrop-blur-md">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold uppercase tracking-wider"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <div className="text-center">
          <span className="text-xs font-extrabold text-[#00E5FF] tracking-widest font-mono block">LEADERBOARD</span>
          <span className="text-[8px] font-bold text-slate-500 tracking-wider">GLOBAL RANKINGS</span>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-2 py-1 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-[8px] font-black text-rose-500 tracking-widest font-mono">LIVE</span>
        </div>
      </div>

      {/* Top statistics summary row */}
      <div className="relative z-10 flex justify-center gap-3 p-4 bg-black/10">
        <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-[9px] font-bold text-cyan-400 font-mono uppercase">
          <Trophy size={11} />
          {rankings.length} COMPETING
        </div>
        <div className="bg-cyan-500/5 border border-cyan-500/15 rounded-lg px-3 py-1.5 flex items-center gap-1.5 text-[9px] font-bold text-cyan-400 font-mono uppercase">
          <Trophy size={11} />
          {myRank > 0 ? `YOU · #${myRank}` : "UNRANKED"}
        </div>
      </div>

      {/* Scrollable Container */}
      <div className="flex-1 overflow-y-auto pb-32 relative z-10">
        
        {/* Podium section */}
        {top3.length >= 1 && (
          <div className="pt-8 pb-4 px-4 flex justify-center items-end gap-2 border-b border-cyan-500/10 bg-cyan-500/2 relative overflow-hidden">
            {/* Background gridlines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-[0.03]">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-px bg-white" />
              ))}
            </div>

            {podiumOrder.map((player, i) => {
              if (!player) return <div key={i} className="w-[100px]" />;
              const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
              const heights = { 1: "h-32", 2: "h-24", 3: "h-20" };
              const avatarSizes = { 1: "w-16 h-16 text-xl", 2: "w-12 h-12 text-sm", 3: "w-10 h-10 text-xs" };
              const initial = player?.name || player?.playerName ? (player.name || player.playerName)[0].toUpperCase() : "?";
              const isMe = player.uid === myUid;

              const medalColors = {
                1: { plinth: "from-amber-400 to-amber-600 shadow-[0_-2px_15px_rgba(245,158,11,0.2)]", glow: "text-amber-400", chip: "LEGEND" },
                2: { plinth: "from-teal-400 to-teal-600 shadow-[0_-2px_15px_rgba(45,212,191,0.15)]", glow: "text-teal-400", chip: "ELITE" },
                3: { plinth: "from-pink-400 to-pink-600 shadow-[0_-2px_15px_rgba(244,114,182,0.15)]", glow: "text-pink-400", chip: "ELITE" },
              };
              const m = medalColors[rank];

              return (
                <div key={player.uid} className={`flex flex-col items-center z-10 ${rank === 1 ? "w-32" : "w-24"}`}>
                  
                  {/* Crown for 1st */}
                  {rank === 1 && (
                    <div className="flex flex-col items-center mb-1 animate-bounce">
                      <Crown size={20} className="text-amber-400" />
                      <span className="text-[8px] font-black text-amber-400 tracking-wider">MVP</span>
                    </div>
                  )}

                  {/* Hexagonal avatar container */}
                  <div className={`flex items-center justify-center border-2 rounded-xl rotate-45 relative ${
                    rank === 1 ? "border-amber-400" : "border-slate-800"
                  } ${isMe ? "scale-105 border-violet-500" : ""}`}
                    style={{
                      width: rank === 1 ? "60px" : "48px",
                      height: rank === 1 ? "60px" : "48px",
                      background: "rgba(10, 14, 26, 0.95)",
                      boxShadow: isMe ? "0 0 10px rgba(124,58,237,0.5)" : "none"
                    }}
                  >
                    <span 
                      className={`font-black select-none -rotate-45 ${
                        rank === 1 ? "text-xl" : "text-sm"
                      }`}
                      style={{ color: player.avatarColor }}
                    >
                      {initial}
                    </span>
                  </div>

                  {/* Level / Status Chip */}
                  <div className={`mt-3 py-0.5 px-2 border rounded-full text-[8px] font-extrabold uppercase tracking-wide bg-slate-950/80 ${
                    rank === 1 ? "border-amber-500/30 text-amber-400" : "border-slate-800 text-slate-500"
                  }`}>
                    {m.chip}
                  </div>

                  {/* Name */}
                  <span className="text-[10px] font-black text-white mt-1.5 max-w-[80px] truncate text-center leading-none">
                    {player?.playerName || player?.name || "Player"}
                  </span>

                  {/* You badge */}
                  {isMe && (
                    <div className="bg-violet-600 px-2 py-0.5 rounded text-[8px] font-black text-white tracking-widest mt-1">
                      YOU
                    </div>
                  )}

                  {/* Plinth */}
                  <div className={`w-full mt-2.5 rounded-t-xl bg-gradient-to-b ${m.plinth} ${heights[rank]} flex flex-col items-center justify-center p-2 relative overflow-hidden`}>
                    {/* Sheen sheen */}
                    <div className="absolute inset-x-0 top-0 h-[45%] bg-white/10 -skew-y-3 pointer-events-none" />
                    
                    <span className="text-[10px] font-black text-white tracking-wider">{rank === 1 ? "1ST" : rank === 2 ? "2ND" : "3RD"}</span>
                    <span className="text-sm font-black text-white mt-1 font-mono">{formatScore(player?.highScore)}</span>
                    <span className="text-[8px] font-bold text-white/70 tracking-wider">PTS</span>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Other players section */}
        <div className="mt-6 px-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 h-[1px] bg-slate-900" />
            <span className="text-[9px] font-black text-slate-500 tracking-widest">ALL PLAYERS</span>
            <div className="flex-1 h-[1px] bg-slate-900" />
          </div>

          <div className="space-y-2">
            {rest.map((player, idx) => {
              const rank = idx + 4;
              const isMe = player.uid === myUid;
              const initial = player.playerName || player.name ? (player.playerName || player.name)[0].toUpperCase() : "?";

              return (
                <div
                  key={player.uid}
                  className={`flex items-center gap-3 p-3 border rounded-xl shadow-sm transition ${
                    isMe 
                      ? "bg-violet-500/10 border-violet-500/40 shadow-[0_0_12px_rgba(124,58,237,0.15)]" 
                      : "bg-slate-900/30 border-slate-900 hover:border-slate-800"
                  }`}
                >
                  {/* Rank Badge */}
                  <div className="w-8 flex items-center justify-center">
                    <div className={`w-6 h-6 border rounded-lg flex items-center justify-center text-xs font-black font-mono ${
                      isMe 
                        ? "bg-violet-600 border-violet-500 text-white" 
                        : rank <= 10 
                        ? "bg-cyan-500/10 border-cyan-500/25 text-cyan-400" 
                        : "bg-slate-950 border-slate-900 text-slate-500"
                    }`}>
                      {rank}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div 
                    className="w-9 h-9 border rounded-xl flex items-center justify-center font-black text-sm"
                    style={{
                      background: "rgba(10, 14, 26, 0.95)",
                      borderColor: player.avatarColor,
                      boxShadow: `0 0 6px ${player.avatarColor}33`
                    }}
                  >
                    <span style={{ color: player.avatarColor }}>{initial}</span>
                  </div>

                  {/* Name details */}
                  <div className="flex-1 flex items-center gap-2">
                    <span className={`text-xs font-semibold ${isMe ? "text-violet-400 font-bold" : "text-slate-350"}`}>
                      {player.playerName || player.name || "Player"}
                    </span>
                    {isMe && (
                      <span className="bg-violet-600 px-1.5 py-0.5 rounded text-[8px] font-black text-white tracking-widest leading-none">
                        YOU
                      </span>
                    )}
                    {!isMe && rank <= 10 && (
                      <div className="flex items-center gap-0.5 bg-cyan-500/10 border border-cyan-500/30 rounded px-1 text-[8px] font-bold text-cyan-400 tracking-wide leading-none">
                        <Flame size={8} />
                        TOP 10
                      </div>
                    )}
                  </div>

                  {/* Score */}
                  <div className="flex items-center gap-1">
                    <span className={`text-xs font-mono font-bold ${isMe ? "text-violet-400" : "text-slate-400"}`}>
                      {formatScore(player.highScore)}
                    </span>
                  </div>

                </div>
              );
            })}

            {rankings.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Trophy size={32} className="text-slate-600 mb-3" />
                <span className="text-xs text-slate-500">No score records found.</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Floating User Stats Panel (My Panel) */}
      <div className="absolute bottom-0 inset-x-0 p-4 border-t border-slate-900 bg-black/60 backdrop-blur-lg z-20">
        <div className="w-full max-w-md mx-auto border border-cyan-500/40 rounded-2xl bg-slate-900/60 p-3.5 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border-2 border-cyan-500/60 rounded-xl bg-slate-950 flex items-center justify-center font-black text-sm text-cyan-400 shadow-md">
              {(userStats?.playerName || userStats?.name || "?")[0]?.toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-slate-200">
                {userStats?.playerName || userStats?.name || "Player"}
              </span>
              <span className="text-[10px] font-bold text-slate-500 tracking-wider mt-0.5">
                {myRank > 0 ? `RANK #${myRank} OF ${rankings.length}` : "UNRANKED"}
              </span>
            </div>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/35 rounded-xl px-3 py-2 flex items-center gap-1.5 shadow-sm">
            <Trophy size={14} className="text-amber-500" />
            <span className="text-sm font-mono font-black text-white leading-none">
              {formatScore(userStats?.highScore ?? 0)}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}
