import { useState, useMemo } from "react";

export default function DecodeStage({ instruction, onComplete }) {
  const [phase, setPhase] = useState("pick-opcode"); // "pick-opcode" | "pick-operands" | "pick-route"
  const [chosenOpcodeIndex, setChosenOpcodeIndex] = useState(null);
  const [chosenOperandIndices, setChosenOperandIndices] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Define your internal route labels locally
  const ROUTE_LABELS = [
    { value: "memory-read", label: "Memory Read", hint: "IR → MAR → Memory → MBR → AX" },
    { value: "memory-write", label: "Memory Write", hint: "IR → MAR → AX → MBR → Memory" },
    { value: "register-alu", label: "Register/ALU", hint: "BX → Temp → ALU → AX" },
    { value: "immediate", label: "Immediate", hint: "IR → AX" },
    { value: "branch", label: "Branch", hint: "IR → MAR → PC" },
  ];

  const phaseInstruction = useMemo(() => {
    if (phase === "pick-opcode") return "Step 1: Click the OPCODE.";
    if (phase === "pick-operands") return "Step 2: Click the OPERAND(S).";
    return "Step 3: Pick the execution route the Control Unit should choose.";
  }, [phase]);

  function handleOpcodeClick(index) {
    if (index === instruction.opcodeIndex) {
      setChosenOpcodeIndex(index);
      setFeedback({ tone: "good", text: "Correct! Opcode captured." });
      setPhase("pick-operands");
    } else {
      setFeedback({ tone: "bad", text: "Incorrect opcode choice." });
    }
  }

  function handleOperandClick(index) {
    if (index === chosenOpcodeIndex || chosenOperandIndices.includes(index)) return;
    if (instruction.operandIndices.includes(index)) {
      const updated = [...chosenOperandIndices, index];
      setChosenOperandIndices(updated);
      if (instruction.operandIndices.every((i) => updated.includes(i))) {
        setFeedback({ tone: "good", text: "All operands identified." });
        setPhase("pick-route");
      }
    } else {
      setFeedback({ tone: "bad", text: "Incorrect operand choice." });
    }
  }

  function handleRouteClick(route) {
    if (route === instruction.correctRoute) {
      setFeedback({ tone: "good", text: instruction.explanation });
      setTimeout(() => {
        // Core success signal: fire the parent trigger handler!
        onComplete(); 
      }, 2600);
    } else {
      setFeedback({ tone: "bad", text: "Wrong data path selected." });
    }
  }

  return (
    <div>
      <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: "bold" }}>[ STAGE 02: DECODE PHASE ]</span>
      <p style={{ fontSize: "12px", color: "#2c2c2c", margin: "4px 0 12px 0" }}>{phaseInstruction}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "1.25rem", background: "#0c0a09", border: "1px solid #1c1917", borderRadius: "6px", marginBottom: "1.25rem" }}>
        {instruction.choices.map((token, i) => {
          const isOpcodeChoice = i === chosenOpcodeIndex;
          const isOperandChoice = chosenOperandIndices.includes(i);
          return (
            <button
              key={i}
              onClick={() => (phase === "pick-opcode" ? handleOpcodeClick(i) : handleOperandClick(i))}
              style={{padding: "6px 16px", background: isOpcodeChoice ? "rgba(16,185,129,0.15)" : isOperandChoice ? "rgba(245,158,11,0.15)" : "rgba(0,0,0,0.3)", border: isOpcodeChoice ? "1px solid #10b981" : isOperandChoice ? "1px solid #f59e0b" : "1px solid #333",color: isOpcodeChoice ? "#34d399" : isOperandChoice ? "#fbbf24" : "#e7e5e4", borderRadius: "4px", cursor: "pointer", fontFamily: "monospace", fontSize: "13px", fontWeight: "bold", transition: "all 0.1s ease"}}
            >
              {token}
            </button>
          );
        })}
      </div>

      {/* Control Unit Routing Parameter Target Options */}
      {phase === "pick-route" && (
        <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {ROUTE_LABELS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleRouteClick(opt.value)}
              style={{ padding: "12px", textAlign: "left", background: "#0c0a09", border: "1px solid #2e2a24", borderRadius: "6px", cursor: "pointer", color: "#e7e5e4", fontFamily: "monospace", transition: "border-color 0.15s ease" }}
            >
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#f5f5f4" }}>{opt.label}</div>
              <div style={{ fontSize: "11px", color: "#78716c", marginTop: "4px", borderTop: "1px solid #1c1917", paddingTop: "4px" }}>{opt.hint}</div>
            </button>
          ))}
        </div>
      )}

      {/* Diagnostics Error / Success Feedback banner */}
      {feedback && (
        <div style={{ marginTop: "1.25rem", padding: "10px 14px", fontSize: "13px", borderRadius: "6px", border: feedback.tone === "good" ? "1px solid rgba(12, 128, 89, 0.3)" : "1px solid rgba(239,68,68,0.3)", color: feedback.tone === "good" ? "#008f5a" : "#f87171", background: feedback.tone === "good" ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.04)", lineHeight: "1.5" }}>
          {feedback.text}
        </div>
      )}
    </div>
    
  );
}