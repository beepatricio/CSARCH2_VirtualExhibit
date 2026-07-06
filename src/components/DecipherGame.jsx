import { useState } from "react";
// Import the separated stage modules
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

// Main card at the top
function MainCard({ lives, score, stage }) {
  const meta = STAGE_META[stage];

  return (
    <div style={{ fontFamily: "monospace", marginBottom: "1.5rem" }}>
      {/* title + lives */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", flexWrap: "wrap", gap: "6px" }}>
        <span style={{ fontSize: "10px", color: "#a8a29e", fontWeight: "bold", letterSpacing: "0.15em" }}>
          BE THE CPU
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "9px", color: "#a8a29e", fontWeight: "bold", letterSpacing: "0.1em" }}>LIVES</span>
          <span style={{ fontSize: "16px", color: "#f87171", letterSpacing: "3px" }}>
            {"♥".repeat(lives)}
            {"♡".repeat(Math.max(START_LIVES - lives, 0))}
          </span>
        </span>
      </div>

      {/* level card */}
      <div
        style={{
          textAlign: "center",
          border: "1px solid #3f3a33",
          borderRadius: "8px",
          padding: "18px 16px",
          background: "#0c0a09",
          marginBottom: "10px",
        }}
      >
        <div style={{ fontSize: "10px", color: "#ef4444", fontWeight: "bold", letterSpacing: "0.2em", marginBottom: "8px" }}>
          STAGE {String(meta.level).padStart(2, "0")}
        </div>
        <h3 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "900", color: "#f5f5f4", textTransform: "uppercase", letterSpacing: "-0.01em" }}>
          Level {meta.level}: {meta.label}
        </h3>
        <div style={{ marginTop: "10px", fontSize: "12px", color: "#fbbf24", fontWeight: "bold", letterSpacing: "0.1em" }}>
          SCORE: {String(score).padStart(4, "0")}
        </div>
      </div>

      {/* mission objective */}
      <div
        style={{
          borderLeft: "3px solid #ef4444",
          background: "#0c0a09",
          padding: "10px 14px",
          borderRadius: "0 6px 6px 0",
        }}
      >
        <div style={{ fontSize: "9px", color: "#a8a29e", fontWeight: "bold", letterSpacing: "0.15em", marginBottom: "4px" }}>
          MISSION OBJECTIVE
        </div>
        <p style={{ margin: 0, fontSize: "12px", color: "#e7e5e4", lineHeight: "1.5" }}>
          "{meta.objective}"
        </p>
      </div>
    </div>
  );
}

export default function DecipherGame() {
  const [hasAcceptedBriefing, setHasAcceptedBriefing] = useState(false);
  const [gameStage, setGameStage] = useState("fetch"); // "fetch" | "decode" | "execute" | "complete" | "gameover"
  const [lives, setLives] = useState(START_LIVES);
  const [score, setScore] = useState(0);

  function resetGame() {
    setLives(START_LIVES);
    setScore(0);
    setGameStage("fetch");
  }

  function handleWrongAnswer() {
    setLives((prev) => {
      const next = Math.max(prev - 1, 0);
      if (next === 0) setGameStage("gameover");
      return next;
    });
  }

  function handleCorrectPoints(points) {
    setScore((prev) => prev + points);
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
      <div style={{ fontFamily: "monospace", color: "#e7e5e4", display: "flex", flexDirection: "column", gap: "32px", width: "100%" }}>
        <section style={{ border: "2px solid #444", background: "linear-gradient(to bottom, rgba(12, 10, 9, 0.85), rgba(12, 10, 9, 0.95))", padding: "2rem", borderRadius: "8px", position: "relative", boxSizing: "border-box" }}>
          <div style={{ position: "absolute", top: "16px", right: "16px", border: "1px solid rgba(239, 68, 68, 0.5)", color: "rgba(239, 68, 68, 0.8)", fontSize: "10px", fontWeight: "bold", letterSpacing: "0.15em", padding: "4px 8px", transform: "rotate(4deg)", textTransform: "uppercase" }}>
            Classified // Restricted
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ fontSize: "11px", color: "#ef4444", fontWeight: "bold", letterSpacing: "0.15em", textTransform: "uppercase" }}>
              Diving into the CPU
            </div>

            <h2 style={{ fontSize: "1.8rem", fontWeight: "900", textTransform: "uppercase", margin: 0, borderBottom: "1px solid #333", paddingBottom: "12px", color: "#f5f5f4", letterSpacing: "-0.02em" }}>
              Journey of an Instruction
            </h2>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", fontSize: "11px", color: "#d6d3d1", background: "#0c0a09", padding: "14px", border: "1px solid #2e2a24", borderRadius: "6px" }}>
              <div><span style={{ color: "#a8a29e", fontWeight: "bold", marginRight: "6px" }}>CASE_ID:</span> #80205</div>
              <div><span style={{ color: "#a8a29e", fontWeight: "bold", marginRight: "6px" }}>CLEARANCE:</span> FIELD AGENT</div>
              <div><span style={{ color: "#a8a29e", fontWeight: "bold", marginRight: "6px" }}>TARGET:</span> MICROPROCESSOR CORE</div>
              <div><span style={{ color: "#a8a29e", fontWeight: "bold", marginRight: "6px" }}>LIVES:</span> {START_LIVES}</div>
            </div>

            <p style={{ fontSize: "13px", lineHeight: "1.65", color: "#e7e5e4", fontFamily: "sans-serif", margin: "8px 0 16px 0" }}>
              <strong>OPERATIVE BRIEFING:</strong> We just intercepted an encrypted transmission from our field agent, Mr. Padfoot. The problem? Our standard decryption software has been compromised. To read this intelligence safely without triggering any alarms, we have to bypass the system and map out the hardware data paths ourselves, across Fetch, Decode, and Execute. You have {START_LIVES} lives. Every wrong move costs one.
            </p>

            <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
              <button
                onClick={() => setHasAcceptedBriefing(true)}
                style={{ width: "100%", padding: "18px 0", background: "#ef4444", border: "none", color: "#ffffff", fontSize: "13px", fontWeight: "900", letterSpacing: "0.2em", textTransform: "uppercase", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s ease" }}
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
      <div style={{ padding: "1.5rem", background: "#141210", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", fontFamily: "monospace" }}>
        <h3 style={{ color: "#f87171", fontWeight: "bold", margin: "0 0 8px 0" }}>Mission Failed — Out of Lives</h3>
        <p style={{ color: "#d6d3d1", fontSize: "13px", margin: "0 0 16px 0" }}>
          Final score: {String(score).padStart(4, "0")}.
        </p>
        <button
          onClick={resetGame}
          style={{ padding: "14px 20px", background: "#ef4444", border: "none", color: "#fff", fontSize: "12px", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: "6px", cursor: "pointer" }}
        >
          Retry Mission ↺
        </button>
      </div>
    );
  }

  // Final Success View
  if (gameStage === "complete") {
    return (
      <div style={{ padding: "1.5rem", background: "#141210", border: "1px solid rgba(16,185,129,0.4)", borderRadius: "8px", fontFamily: "monospace" }}>
        <h3 style={{ color: "#34d399", fontWeight: "bold", margin: "0 0 8px 0" }}>Operation Successful. Pipeline Clear!</h3>
        <p style={{ color: "#e7e5e4", fontSize: "13px", margin: "0 0 6px 0" }}>
          You made it through Fetch, Decode, and Execute with {lives} {lives === 1 ? "life" : "lives"} left.
        </p>
        <p style={{ color: "#fbbf24", fontSize: "13px", fontWeight: "bold", margin: "0 0 16px 0" }}>
          FINAL SCORE: {String(score).padStart(4, "0")}
        </p>
        <button
          onClick={resetGame}
          style={{ padding: "14px 20px", background: "#008f5a", border: "none", color: "#fff", fontSize: "12px", fontWeight: "900", letterSpacing: "0.15em", textTransform: "uppercase", borderRadius: "6px", cursor: "pointer" }}
        >
          Play Again ▶
        </button>
      </div>
    );
  }

  // Game Flow
  return (
    <div style={{ padding: "1.5rem", background: "linear-gradient(to bottom, rgba(12, 10, 9, 0.85), rgba(12, 10, 9, 0.95))", border: "1px solid #2e2a24", borderRadius: "8px" }}>
      <MainCard lives={lives} score={score} stage={gameStage} />

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