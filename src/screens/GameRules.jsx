import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { ChevronLeft, Info, HelpCircle, Gamepad2, Users, BookOpen, Star, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";

const RULES_STEPS = [
  {
    id: 1,
    emoji: "🎭",
    title: "Role Reveal",
    subtitle: "Who are you in the game?",
    accentColor: "border-violet-500 text-violet-400",
    bgColor: "bg-violet-500/10",
    details: [
      "At the start of each round, every player is secretly assigned a role.",
      "👤 Students receive the secret topic — a specific ACCA/CMA exam term.",
      "🕵️ The Imposter receives only a vague clue — NOT the exact topic.",
      "No one knows who the Imposter is. Keep your role secret!",
    ],
  },
  {
    id: 2,
    emoji: "📝",
    title: "Clue Round",
    subtitle: "Give one-word answers only",
    accentColor: "border-sky-500 text-sky-400",
    bgColor: "bg-sky-500/10",
    details: [
      "Each player takes a turn to give exactly ONE WORD as a clue about the topic.",
      "⏱️ Clue Timer: Active turns are limited to 1 Min (60s) or 2 Min (120s), set by the host.",
      "⚠️ Turn Timeout: If the timer runs out, your turn is passed ('PASS') automatically.",
      "Students describe the topic subtly. Imposters must bluff to blend in without knowing the topic.",
    ],
  },
  {
    id: 3,
    emoji: "🕵️",
    title: "Discussion & Voting",
    subtitle: "Find the Imposter among you",
    accentColor: "border-amber-500 text-amber-455",
    bgColor: "bg-amber-500/10",
    details: [
      "After all clues are given, players debate and vote on who they believe is the Imposter.",
      "👮 Caught on Ties: In a voting tie (e.g. 1-1 in 2-player mode), the Imposter is caught!",
      "If the Imposter receives the most (or tied most) votes, they are caught and must play the Bonus Round.",
    ],
  },
  {
    id: 4,
    emoji: "🎯",
    title: "Imposter Bonus Round",
    subtitle: "The Imposter's last chance to win",
    accentColor: "border-rose-500 text-rose-400",
    bgColor: "bg-rose-500/10",
    details: [
      "If the Imposter is caught, they get ONE final chance to save themselves.",
      "They must guess the secret topic that the students were describing.",
      "Correct guess: The Imposter escapes and survives the round, stealing the pot!",
    ],
  },
  {
    id: 5,
    emoji: "🏆",
    title: "Scoring & Betting System",
    subtitle: "How coins are wagered and won",
    accentColor: "border-emerald-500 text-emerald-400",
    bgColor: "bg-emerald-500/10",
    details: [
      "🎟️ Entry Fee: Starting a match costs 50 coins, deducted at the start.",
      "🛡️ Imposter Escapes: Imposter wins the entire pot (Players * 50 coins). Students lose their fee.",
      "🎯 Imposter Caught: Correct voting students divide the total pot equally.",
      "💰 The Pot: Pot = Everyone's entry fee + an additional 50-coin penalty from losers.",
      "❌ Loser Penalty: Incorrect voters and caught Imposter lose an extra 50 coins (-100 total).",
    ],
  },
];

const ROLES = [
  {
    role: "Student",
    icon: "🎓",
    color: "text-emerald-500",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/20",
    objective: "Identify the Imposter before they fool everyone. Give smart clues, discuss wisely, and vote correctly to earn points.",
    tips: ["Give related but not too obvious clues", "Watch for vague or off-topic answers", "Coordinate with other students subtly"],
  },
  {
    role: "Imposter",
    icon: "🕵️",
    color: "text-rose-500",
    bg: "bg-rose-500/5",
    border: "border-rose-500/20",
    objective: "Stay hidden! You don't know the topic — only a vague clue. Blend in with students by giving convincing answers and avoid being voted out.",
    tips: ["Listen carefully to others' clues to infer the topic", "Stay confident — don't hesitate too long", "Use broad and plausible words to stay safe"],
  },
];

function AccordionStep({ step }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      onClick={() => setExpanded(!expanded)}
      className={`border rounded-2xl p-4 cursor-pointer select-none transition ${
        expanded ? `${step.accentColor} ${step.bgColor}` : "border-slate-800 bg-slate-900/40"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full border border-slate-800 flex items-center justify-center text-xl bg-slate-950`}>
          {step.emoji}
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-black text-white">{step.title}</h4>
          <span className="text-[10px] text-slate-500 font-medium block mt-0.5">{step.subtitle}</span>
        </div>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {expanded && (
        <div className="border-t border-slate-800 mt-4 pt-3 space-y-2.5 animate-fade-in">
          {step.details.map((detail, i) => (
            <div key={i} className="flex gap-2.5 items-start text-xs text-slate-300 leading-relaxed">
              <div className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0" />
              <p>{detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function GameRules() {
  const { colors } = useTheme();
  const navigate = useNavigate();

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
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-slate-900 bg-black/30 backdrop-blur-md">
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition text-xs font-semibold uppercase tracking-wider"
        >
          <ChevronLeft size={16} />
          Back
        </button>
        <div className="text-center">
          <span className="text-xs font-extrabold text-slate-200 tracking-widest font-mono block">GAME RULES</span>
          <span className="text-[8px] font-bold text-slate-500 tracking-wider">How to Play</span>
        </div>
        <div className="w-16" />
      </div>

      {/* Scrollable Rules Container */}
      <div className="flex-1 overflow-y-auto p-6 relative z-10 flex flex-col items-center">
        <div className="w-full max-w-md space-y-5">
          
          {/* Welcome Info Card */}
          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-3xl p-6 flex flex-col items-center text-center space-y-3">
            <BookOpen size={40} className="text-indigo-400" />
            <h3 className="text-lg font-black text-indigo-200">Welcome to Imposter Game!</h3>
            <p className="text-xs text-indigo-300 leading-relaxed">
              A detective revision game where ACCA & CMA students test their syllabus knowledge while discovering or hiding the Imposter.
            </p>
            <div className="grid grid-cols-3 gap-2 w-full mt-4">
              {[
                { label: "Players", val: "3–10" },
                { label: "Timer", val: "Flexible" },
                { label: "Coins", val: "Pot Wagers" },
              ].map((item, idx) => (
                <div key={idx} className="bg-indigo-500/5 border border-indigo-500/15 rounded-xl p-2.5 flex flex-col items-center">
                  <span className="text-xs font-black text-indigo-200">{item.val}</span>
                  <span className="text-[8px] text-indigo-400 mt-0.5">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Section title */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-[1px] bg-slate-900" />
            <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">GAME PHASES</span>
            <div className="flex-1 h-[1px] bg-slate-900" />
          </div>

          {/* Steps */}
          <div className="space-y-2.5">
            {RULES_STEPS.map((step) => (
              <AccordionStep key={step.id} step={step} />
            ))}
          </div>

          {/* Section title */}
          <div className="flex items-center gap-2 pt-2">
            <div className="flex-1 h-[1px] bg-slate-900" />
            <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">ROLES</span>
            <div className="flex-1 h-[1px] bg-slate-900" />
          </div>

          {/* Roles list */}
          <div className="space-y-3">
            {ROLES.map((r) => (
              <div key={r.role} className={`border rounded-2xl p-5 ${r.bg} ${r.border}`}>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 border border-current rounded-full flex items-center justify-center text-xl bg-slate-950/60 leading-none">
                    {r.icon}
                  </div>
                  <h4 className={`text-base font-black ${r.color}`}>{r.role}</h4>
                </div>
                <p className="text-xs text-slate-200 mt-3.5 leading-relaxed">
                  {r.objective}
                </p>
                <div className={`border-t my-4 ${r.border}`} />
                <span className={`text-[8px] font-black tracking-widest leading-none ${r.color} block mb-2`}>
                  PRO TIPS
                </span>
                <div className="space-y-2">
                  {r.tips.map((tip, i) => (
                    <div key={i} className="flex gap-2 items-start text-xs text-slate-400 leading-normal">
                      <CheckCircle size={14} className={`${r.color} flex-shrink-0 mt-0.5`} />
                      <p>{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Banner */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex gap-3 items-start">
            <Info size={20} className="text-violet-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-slate-400 leading-relaxed">
              Good luck! Remember — the best players combine deep ACCA/CMA knowledge with keen observation of word play.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
