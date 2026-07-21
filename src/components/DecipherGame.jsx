import { useState, useRef, useEffect } from "react";
import FetchStage from "./FetchStage.jsx";
import DecodeStage from "./DecodeStage.jsx";
import ExecuteStage from "./ExecuteStage.jsx";

const START_LIVES = 10; // total lives
const STAGE_META = {
  fetch: {
    level: 1,
    label: "FETCH",
    objective: "Move the next instruction from memory into the IR using the correct data path.",
  },
  decode: {
    level: 2,
    label: "DECODE",
    objective: "Split each instruction into its opcode, operand(s), and execution route.",
  },
  execute: {
    level: 3,
    label: "EXECUTE",
    objective: "Carry out each decoded instruction using the correct sequence of micro-operations.",
  },
};

// Slim status bar: pinned to the top of the viewport (below the site header)
// so lives/score/streak stay visible even as the stage content below scrolls.
function StickyStatusBar({ lives, score, streak, stage }) {
  const meta = STAGE_META[stage];
  const stageColor = { fetch: "#ef4444", decode: "#3fae5c", execute: "#f2a52c" }[stage];

  return (
    <div
      style={{
        position: "sticky",
        top: "var(--xt-header-h, 70px)",
        zIndex: 40,
        background: "#ffffff",
        border: "3px solid #1c3a17",
        borderRadius: "14px",
        padding: "8px clamp(10px, 3vw, 14px)",
        marginBottom: "10px",
        boxShadow: "4px 4px 0 #1c3a17",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "6px 12px",
        fontFamily: "'Nunito', sans-serif",
        minWidth: 0,
      }}
    >
      <span
        style={{
          fontFamily: "'Baloo 2', 'Arial Black', sans-serif",
          fontSize: "clamp(9.5px, 2.6vw, 11px)",
          color: stageColor,
          fontWeight: "900",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        LV.{meta.level} {meta.label}
      </span>

      <span style={{ display: "flex", alignItems: "center", gap: "clamp(8px, 2.5vw, 14px)", flexWrap: "wrap", minWidth: 0 }}>
        {streak >= 3 && (
          <span
            key={streak}
            className="xt-streak-pop"
            style={{
              fontSize: "clamp(9px, 2.4vw, 10.5px)",
              fontWeight: "900",
              color: "#f2a52c",
              fontFamily: "'Baloo 2', 'Arial Black', sans-serif",
              whiteSpace: "nowrap",
            }}
          >
            🔥 x{streak}
          </span>
        )}
        <span style={{ fontSize: "clamp(9.5px, 2.6vw, 11px)", color: "#f2a52c", fontWeight: "bold", fontFamily: "'JetBrains Mono', monospace", whiteSpace: "nowrap" }}>
          {String(score).padStart(4, "0")}
        </span>
        <span style={{ fontSize: "clamp(12px, 3.4vw, 15px)", color: "#ef4444", letterSpacing: "clamp(1px, 0.5vw, 2px)", whiteSpace: "nowrap" }}>
          {"♥".repeat(lives)}
          {"♡".repeat(Math.max(START_LIVES - lives, 0))}
        </span>
      </span>
    </div>
  );
}

// Level intro card + mission objective, shown in normal document flow
// (scrolls away, unlike the status bar above).
function MissionCard({ stage }) {
  const meta = STAGE_META[stage];

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", marginBottom: "clamp(1rem, 3vw, 1.5rem)", minWidth: 0 }}>
      <div
        style={{
          textAlign: "center",
          border: "4px solid #1c3a17",
          borderRadius: "18px",
          padding: "clamp(12px, 4vw, 18px) clamp(10px, 3vw, 16px)",
          background: "#ffffff",
          marginBottom: "14px",
          boxShadow: "6px 6px 0 #1c3a17",
          boxSizing: "border-box",
        }}
      >
        <div style={{ fontSize: "clamp(8.5px, 2.4vw, 10px)", color: "#ef4444", fontWeight: "bold", letterSpacing: "0.2em", marginBottom: "8px" }}>
          STAGE {String(meta.level).padStart(2, "0")}
        </div>
        <h3 style={{ margin: 0, fontFamily: "'Baloo 2', 'Arial Black', sans-serif", fontSize: "clamp(1.1rem, 5.5vw, 1.6rem)", fontWeight: "900", color: "#1c3a17", textTransform: "uppercase", letterSpacing: "-0.01em", lineHeight: "1.2", overflowWrap: "break-word" }}>
          Level {meta.level}: {meta.label}
        </h3>
      </div>

      {/* mission objective */}
      <div
        style={{
          border: "3px solid #1c3a17",
          borderLeft: "8px solid #ef4444",
          background: "#fffbea",
          padding: "10px clamp(10px, 3.5vw, 16px)",
          borderRadius: "10px",
          boxShadow: "4px 4px 0 #1c3a17",
          boxSizing: "border-box",
          minWidth: 0,
        }}
      >
        <div style={{ fontSize: "clamp(8.5px, 2.4vw, 10px)", color: "#4c6b44", fontWeight: "bold", letterSpacing: "0.12em", marginBottom: "4px" }}>
          MISSION OBJECTIVE
        </div>
        <p style={{ margin: 0, fontSize: "clamp(11px, 3vw, 12px)", color: "#1c3a17", lineHeight: "1.5", overflowWrap: "break-word" }}>
          "{meta.objective}"
        </p>
      </div>
    </div>
  );
}

// Tiny cross-browser haptic buzz. No-op where unsupported (desktop, iOS Safari).
function buzz(pattern) {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    try { navigator.vibrate(pattern); } catch (e) { /* ignore */ }
  }
}

export default function DecipherGame() {
  const [hasAcceptedBriefing, setHasAcceptedBriefing] = useState(false);
  const [gameStage, setGameStage] = useState("fetch"); // "fetch" | "decode" | "execute" | "complete" | "gameover"
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const gameRef = useRef(null);

  // Whenever the active stage changes, bring the top of the game card back
  // into view so mobile players don't lose their place after scrolling
  // through a long stage.
  useEffect(() => {
    if (gameRef.current) {
      gameRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [gameStage]);

  function resetGame() {
    setLives(START_LIVES);
    setScore(0);
    setStreak(0);
    setGameStage("fetch");
  }

  function handleWrongAnswer() {
    buzz(80);
    setStreak(0);
    setLives((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next === 0) setGameStage("gameover");
      return next;
    });
  }

  function handleCorrectPoints(points) {
    buzz(25);
    setStreak((prev) => {
      const next = prev + 1;
      // Small streak bonus every 3 correct answers in a row, on top of the
      // stage's own point value, to reward consistency without needing to
      // touch each stage's scoring logic.
      const bonus = next > 0 && next % 3 === 0 ? 10 : 0;
      setScore((s) => s + points + bonus);
      return next;
    });
  }

  function handleFetchComplete() {
    setGameStage("decode");
  }

  function handleDecodeComplete() {
    setGameStage("execute");
  }

  function handleExecuteComplete() {
    setGameStage("complete");
  }

  // Mission Details Landing View
  if (!hasAcceptedBriefing) {
    return (
      <div ref={gameRef} className="xt-cpu-game" style={{ fontFamily: "'Nunito', sans-serif", color: "#1c3a17", display: "flex", flexDirection: "column", gap: "clamp(20px, 5vw, 32px)", width: "100%", boxSizing: "border-box" }}>
        <section style={{ border: "5px solid #1c3a17", background: "linear-gradient(180deg, #bdeeff 0%, #eafff1 100%)", padding: "clamp(1.1rem, 5vw, 2rem)", borderRadius: "20px", position: "relative", boxSizing: "border-box", boxShadow: "8px 8px 0 #1c3a17", overflow: "hidden" }}>
          <div style={{ alignSelf: "flex-start", display: "inline-block", border: "3px solid #ef4444", color: "#ef4444", fontSize: "clamp(8.5px, 2.4vw, 10px)", fontWeight: "900", letterSpacing: "0.12em", padding: "5px 10px", transform: "rotate(-1deg)", textTransform: "uppercase", boxShadow: "3px 3px 0 #1c3a17", marginBottom: "4px" }}>
            Classified // Restricted
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "clamp(10px, 3vw, 16px)", minWidth: 0 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(9.5px, 2.8vw, 11px)", color: "#ef4444", fontWeight: "bold", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              Diving into the CPU
            </div>

            <h2 style={{ fontFamily: "'Baloo 2', 'Arial Black', sans-serif", fontSize: "clamp(1.3rem, 6.5vw, 1.8rem)", fontWeight: "900", textTransform: "uppercase", margin: 0, borderBottom: "3px solid #1c3a17", paddingBottom: "12px", color: "#1c3a17", letterSpacing: "-0.02em", lineHeight: "1.15", overflowWrap: "break-word" }}>
              Journey of an Instruction
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))", gap: "10px", fontSize: "clamp(10.5px, 3vw, 11px)", color: "#1c3a17", background: "#ffffff", padding: "12px", border: "3px solid #1c3a17", borderRadius: "12px", boxSizing: "border-box" }}>
              <div style={{ minWidth: 0, overflowWrap: "break-word" }}><span style={{ color: "#4c6b44", fontWeight: "bold", marginRight: "6px" }}>CASE_ID:</span> #80205</div>
              <div style={{ minWidth: 0, overflowWrap: "break-word" }}><span style={{ color: "#4c6b44", fontWeight: "bold", marginRight: "6px" }}>CLEARANCE:</span> FIELD AGENT</div>
              <div style={{ minWidth: 0, overflowWrap: "break-word" }}><span style={{ color: "#4c6b44", fontWeight: "bold", marginRight: "6px" }}>TARGET:</span> MICROPROCESSOR CORE</div>
              <div style={{ minWidth: 0, overflowWrap: "break-word" }}><span style={{ color: "#4c6b44", fontWeight: "bold", marginRight: "6px" }}>LIVES:</span> {START_LIVES}</div>
            </div>

            <p style={{ fontSize: "clamp(12px, 3.4vw, 13px)", lineHeight: "1.6", color: "#1c3a17", fontFamily: "'Nunito', sans-serif", margin: "4px 0 12px 0", overflowWrap: "break-word" }}>
              <strong>OPERATIVE BRIEFING:</strong> We just intercepted an encrypted transmission from our field agent, Mr. Padfoot. The problem? Our standard decryption software has been compromised. To read this intelligence safely without triggering any alarms, we have to bypass the system and map out the hardware data paths ourselves, across Fetch, Decode, and Execute. You have {START_LIVES} lives. Every wrong move costs one.
            </p>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "4px" }}>
              <button
                onClick={() => setHasAcceptedBriefing(true)}
                style={{ width: "100%", padding: "clamp(14px, 4vw, 18px) 0", background: "#ef4444", border: "4px solid #1c3a17", color: "#ffffff", fontFamily: "'Baloo 2', 'Arial Black', sans-serif", fontSize: "clamp(12px, 3.4vw, 14px)", fontWeight: "900", letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: "12px", boxShadow: "5px 5px 0 #1c3a17", cursor: "pointer", transition: "all 0.2s ease", boxSizing: "border-box" }}
              >
                Start Mission Now ▶
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Game Over View
  if (gameStage === "gameover") {
    return (
      <div ref={gameRef} className="xt-cpu-game" style={{ padding: "clamp(1.1rem, 5vw, 1.5rem)", background: "#fff5f5", border: "5px solid #1c3a17", borderRadius: "20px", fontFamily: "'Nunito', sans-serif", boxShadow: "8px 8px 0 #1c3a17", boxSizing: "border-box" }}>
        <h3 style={{ fontFamily: "'Baloo 2', 'Arial Black', sans-serif", color: "#ef4444", fontWeight: "900", margin: "0 0 8px 0", fontSize: "clamp(1rem, 4.5vw, 1.17rem)", lineHeight: "1.25" }}>Mission Failed. Out of Lives!</h3>
        <p style={{ color: "#1c3a17", fontSize: "clamp(11.5px, 3.2vw, 13px)", margin: "0 0 16px 0" }}>
          Final score: {String(score).padStart(4, "0")}.
        </p>
        <button
          onClick={resetGame}
          style={{ padding: "12px clamp(14px, 4vw, 20px)", background: "#ef4444", border: "4px solid #1c3a17", color: "#ffffff", fontSize: "clamp(11px, 3vw, 12px)", fontFamily: "'Baloo 2', 'Arial Black', sans-serif", fontWeight: "900", letterSpacing: "0.12em", textTransform: "uppercase", borderRadius: "10px", cursor: "pointer", width: "100%", boxSizing: "border-box" }}
        >
          Retry Mission ↺
        </button>
      </div>
    );
  }

  // Final Success View
  if (gameStage === "complete") {
    return (
      <div ref={gameRef} className="xt-cpu-game" style={{ padding: "1.5rem", background: "#eafff1", border: "5px solid #1c3a17", borderRadius: "20px", fontFamily: "'Nunito', sans-serif", boxShadow: "8px 8px 0 #1c3a17", boxSizing: "border-box" }}>
        <h3 style={{ fontFamily: "'Baloo 2', 'Arial Black', sans-serif", color: "#3fae5c", fontWeight: "900", margin: "0 0 8px 0" }}>Operation Successful. Pipeline Clear!</h3>
        <p style={{ color: "#1c3a17", fontSize: "13px", margin: "0 0 6px 0" }}>
          You made it through Fetch, Decode, and Execute with {lives} {lives === 1 ? "life" : "lives"} left.
        </p>
        <p style={{ color: "#fbbf24", fontSize: "13px", fontWeight: "bold", margin: "0 0 16px 0" }}>
          FINAL SCORE: {String(score).padStart(4, "0")}
        </p>
        <button
          onClick={resetGame}
          style={{ padding: "14px 20px", background: "#3fae5c", border: "4px solid #1c3a17", color: "#ffffff", fontFamily: "'Baloo 2', 'Arial Black', sans-serif",fontSize: "12px", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: "10px", cursor: "pointer", boxShadow:"4px 4px 0 #1c3a17", }}
        >
          Play Again ▶
        </button>
      </div>
    );
  }

  // Game Flow
  return (
    <div ref={gameRef} className="xt-cpu-game" style={{ padding: "clamp(0.9rem, 4vw, 1.5rem)", background: "linear-gradient(180deg, #bdeeff 0%, #eafff1 100%)", border: "5px solid #1c3a17", borderRadius: "20px", boxShadow: "8px 8px 0 #1c3a17", boxSizing: "border-box" }}>
      <StickyStatusBar lives={lives} score={score} streak={streak} stage={gameStage} />
      <MissionCard stage={gameStage} />

      {gameStage === "fetch" && (
        <FetchStage onComplete={handleFetchComplete} onWrong={handleWrongAnswer} onCorrect={handleCorrectPoints} />
      )}

      {gameStage === "decode" && (
        <DecodeStage onComplete={handleDecodeComplete} onWrong={handleWrongAnswer} onCorrect={handleCorrectPoints} />
      )}

      {gameStage === "execute" && (
        <ExecuteStage onComplete={handleExecuteComplete} onWrong={handleWrongAnswer} onCorrect={handleCorrectPoints} />
      )}
    </div>
  );
}