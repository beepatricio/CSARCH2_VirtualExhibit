// DecodeStage.jsx
import { useState, useMemo, useEffect } from "react";

const INSTRUCTIONS = [
  {
    id: "mov-reg-reg",
    choices: [
      { text: "MOV", role: "opcode" },
      { text: "AX", role: "operand" },
      { text: "BX", role: "operand" },
    ],
    correctRoute: "register-alu",
    explanation: "Both operands are registers, so this is a register-to-register move.",
    routeHint: "Neither operand has brackets or is a plain number, they're both just register names. Where would a plain register-to-register transfer actually happen?"
  },
  {
    id: "mov-mem-read",
    choices: [
      { text: "MOV", role: "opcode" },
      { text: "AX", role: "operand" },
      { text: "[BX]", role: "operand" },
    ],
    correctRoute: "memory-read",
    explanation: "The brackets around BX mean that the memory address is in BX, so the Control Unit must read from memory to a register.",
    routeHint: "One operand is wrapped in brackets, that means it's a memory address, not a value. Which route reads FROM memory INTO a register?"
  },
  {
    id: "mov-reg-write",
    choices: [
      { text: "MOV", role: "opcode" },
      { text: "[BX]", role: "operand" },
      { text: "AX", role: "operand" },
    ],
    correctRoute: "memory-write",
    explanation: "The destination is the one with the brackets, thus the Control Unit writes the register's value to the memory.",
    routeHint: "The destination operand, the one being written to, is the one in brackets. Which route sends data OUT to memory?"
  },
  {
    id: "add-immediate",
    choices: [
      { text: "ADD", role: "opcode" },
      { text: "AX", role: "operand" },
      { text: "5", role: "operand" },
    ],
    correctRoute: "immediate",
    explanation: "The second operand is a constant, so this is an immediate addition operation.",
    routeHint: "The second operand is a plain number, not a register or an address. Which route deals with a constant built directly into the instruction?"
  },
  {
    id: "jmp-branch",
    choices: [
      { text: "JMP", role: "opcode" },
      { text: "LOOP_START", role: "operand" },
    ],
    correctRoute: "branch",
    explanation: "JMP changes the flow of the program, the Control Unit routes to the branch execution path.",
    routeHint: "This instruction doesn't move or compute any data — it changes where execution continues next. Which route affects the Program Counter?"
  },
];

const ROUTE_LABELS = [
  { value: "memory-read", label: "Memory Read", hint: "IR → MAR → Memory → MBR → AX" },
  { value: "memory-write", label: "Memory Write", hint: "IR → MAR → AX → MBR → Memory" },
  { value: "register-alu", label: "Register/ALU", hint: "BX → Temp → ALU → AX" },
  { value: "immediate", label: "Immediate", hint: "IR → AX" },
  { value: "branch", label: "Branch", hint: "IR → MAR → PC" },
];

// Decode is also worth 100 points total. Every instruction contributes 3
// scoring moments (opcode, operand(s), route), so across all 5 instructions
// that's 15 scoring moments splitting the 100 points as evenly as possible.
function distributePoints(count, total = 100) {
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => (i >= count - remainder ? base + 1 : base));
}
const DECODE_POINTS = distributePoints(INSTRUCTIONS.length * 3);

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}


function DiagramBox({ label, sublabel, active }) {
  return (
    <div
      style={{
        flex: "1 1 100px",
        padding: "10px 8px",
        textAlign: "center",
        borderRadius: "6px",
        fontFamily: "monospace",
        fontSize: "12px",
        fontWeight: "bold",
        transition: "all 0.25s ease",
        border: active ? "1px solid #10b981" : "1px solid #2e2a24",
        background: active ? "rgba(16,185,129,0.12)" : "#0c0a09",
        color: active ? "#34d399" : "#a8a29e",
        boxShadow: active ? "0 0 12px rgba(16,185,129,0.25)" : "none",
      }}
    >
      <div>{label}</div>
      {sublabel && (
        <div style={{ marginTop: "2px", fontSize: "10px", fontWeight: "normal", color: active ? "#6ee7b7" : "#78716c" }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}


function DiagramArrow({ active }) {
  return (
    <div style={{ padding: "0 4px", fontSize: "14px", color: active ? "#34d399" : "#3f3a34", transition: "color 0.25s ease" }}>
      →
    </div>
  );
}

// Test diagram checkign which box should be lit
function DecodeDiagram({ activeStage, resolvedOpcode, resolvedOperand }) {
  return (
    <div style={{ padding: "1rem", background: "#0c0a09", border: "1px solid #1c1917", borderRadius: "6px", marginBottom: "1.25rem" }}>
      <p style={{ margin: "0 0 10px 0", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#78716c", fontFamily: "monospace" }}>
        Decode Data Path
      </p>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px" }}>
        <DiagramBox label="IR" active={activeStage === "ir"} />
        <DiagramArrow active={activeStage === "ir"} />
        <DiagramBox
          label="Opcode"
          sublabel={resolvedOpcode || "?"}
          active={activeStage === "opcode"}
        />
        <DiagramArrow active={activeStage === "opcode" || activeStage === "operand" || activeStage === "control-unit"} />
        <DiagramBox
          label="Operand(s)"
          sublabel={resolvedOperand || "?"}
          active={activeStage === "operand"}
        />
        <DiagramArrow active={activeStage === "operand" || activeStage === "control-unit"} />
        <DiagramBox label="Control Unit" active={activeStage === "control-unit"} />
      </div>
    </div>
  );
}

export default function DecodeStage({ onComplete, onWrong, onCorrect }) {
  // shuffle both the instruction order AND each instruction's choices
  const instructions = useMemo(
    () =>
      shuffle(INSTRUCTIONS).map((instr) => ({
        ...instr,
        tokens: shuffle(instr.choices),
      })),
    []
  );

  const [instructionIndex, setInstructionIndex] = useState(0);

  const [phase, setPhase] = useState("pick-opcode");
  const [chosenOpcodeIndex, setChosenOpcodeIndex] = useState(null);
  const [chosenOperandIndices, setChosenOperandIndices] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  // Running tally of scoring moments across the WHOLE decode stage (all 5
  // instructions) - deliberately not reset when instructionIndex changes,
  // since it needs to keep counting up through the entire stage.
  const [actionIndex, setActionIndex] = useState(0);

  useEffect(() => {
    setPhase("pick-opcode");
    setChosenOpcodeIndex(null);
    setChosenOperandIndices([]);
    setFeedback(null);
    setLocked(false);
  }, [instructionIndex]);

  const instruction = instructions[instructionIndex % instructions.length];

  const operandChoiceIndices = instruction.choices
    .map((t, i) => (t.role === "operand" ? i : null))
    .filter((i) => i !== null);

  const phaseInstruction = useMemo(() => {
    if (phase === "pick-opcode") return "Step 1: Click the OPCODE.";
    if (phase === "pick-operands") return "Step 2: Click the OPERAND(S).";
    return "Step 3: Pick the execution route the Control Unit should choose.";
  }, [phase, feedback]);

  function awardPoint() {
    onCorrect(DECODE_POINTS[actionIndex] ?? 0);
    setActionIndex((prev) => prev + 1);
  }

  function handleOpcodeClick(index) {
    if (locked) return;
    if (instruction.choices[index].role === "opcode") {
      setChosenOpcodeIndex(index);
      setFeedback({ tone: "good", text: "Correct! Opcode captured." });
      setPhase("pick-operands");
      awardPoint();
    } else {
      setFeedback({ tone: "bad", text: "Incorrect opcode choice." });
      onWrong();
    }
  }

  function handleOperandClick(index) {
    if (locked || index === chosenOpcodeIndex || chosenOperandIndices.includes(index)) return;
    if (instruction.choices[index].role === "operand") {
      const updated = [...chosenOperandIndices, index];
      setChosenOperandIndices(updated);
      if (operandChoiceIndices.every((i) => updated.includes(i))) {
        setFeedback({ tone: "good", text: "All operands identified." });
        setPhase("pick-route");
        awardPoint();
      }
    } else {
      setFeedback({ tone: "bad", text: "Incorrect operand choice." });
      onWrong();
    }
  }

  function handleRouteClick(route) {
    if (locked) return;
    if (route === instruction.correctRoute) {
      setFeedback({ tone: "good", text: instruction.explanation });
      setLocked(true);
      awardPoint();

      setTimeout(() => {
        if (instructionIndex === instructions.length - 1) {
          onComplete();
        } else {
          setInstructionIndex((prev) => prev + 1);
        }
      }, 4000);
    } else {
      setFeedback({ tone: "bad", text: `Not quite. ${instruction.routeHint}` });
      onWrong();
    }
  }


  const activeStage = locked
    ? "control-unit"
    : phase === "pick-route"
    ? "operand"
    : phase === "pick-operands"
    ? "opcode"
    : "ir";

  const resolvedOpcode = chosenOpcodeIndex !== null ? instruction.choices[chosenOpcodeIndex].text : "";
  const resolvedOperand = chosenOperandIndices.length
    ? chosenOperandIndices.map((i) => instruction.choices[i].text).join(", ")
    : "";

  return (
    <div>
      <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: "bold" }}>[ STAGE 02: DECODE PHASE ]</span>
      <p style={{ fontSize: "12px", color: "#a8a29e", margin: "4px 0 4px 0", fontFamily: "monospace" }}>{phaseInstruction}</p>
      <p style={{ fontSize: "11px", color: "#78716c", margin: "0 0 12px 0", fontFamily: "monospace" }}>
        Instruction {instructionIndex + 1} / {instructions.length}
      </p>

      <DecodeDiagram activeStage={activeStage} resolvedOpcode={resolvedOpcode} resolvedOperand={resolvedOperand} />

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "1.25rem", background: "#0c0a09", border: "1px solid #1c1917", borderRadius: "6px", marginBottom: "1.25rem" }}>
        {instruction.choices.map((token, i) => {
          const isOpcodeChoice = i === chosenOpcodeIndex;
          const isOperandChoice = chosenOperandIndices.includes(i);
          return (
            <button
              key={i}
              onClick={() => (phase === "pick-opcode" ? handleOpcodeClick(i) : handleOperandClick(i))}
              disabled={locked || phase === "pick-route"}
              style={{ padding: "6px 16px", background: isOpcodeChoice ? "rgba(16,185,129,0.15)" : isOperandChoice ? "rgba(245,158,11,0.15)" : "#0c0a09", border: isOpcodeChoice ? "1px solid #10b981" : isOperandChoice ? "1px solid #f59e0b" : "1px solid #2e2a24", color: isOpcodeChoice ? "#34d399" : isOperandChoice ? "#fbbf24" : "#e7e5e4", borderRadius: "4px", cursor: (locked || phase === "pick-route") ? "not-allowed" : "pointer", fontFamily: "monospace", fontSize: "13px", fontWeight: "bold", transition: "all 0.1s ease" }}
            >
              {token.text}
            </button>
          );
        })}
      </div>

      {phase === "pick-route" && (
        <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {ROUTE_LABELS.map((opt) => (
            <button key={opt.value} onClick={() => handleRouteClick(opt.value)} disabled={locked} style={{ padding: "12px", textAlign: "left", background: "#0c0a09", border: "1px solid #2e2a24", borderRadius: "6px", cursor: locked ? "not-allowed" : "pointer", color: "#e7e5e4", fontFamily: "monospace" }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#f5f5f4" }}>{opt.label}</div>
              <div style={{ fontSize: "11px", color: "#a8a29e", marginTop: "4px", borderTop: "1px solid #1c1917", paddingTop: "4px" }}>{opt.hint}</div>
            </button>
          ))}
        </div>
      )}

      {feedback && (
        <div style={{ marginTop: "1.25rem", padding: "10px 14px", fontSize: "13px", borderRadius: "6px", border: feedback.tone === "good" ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(239,68,68,0.3)", color: feedback.tone === "good" ? "#34d399" : "#f87171", background: feedback.tone === "good" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.04)", lineHeight: "1.5" }}>
          {feedback.text}
        </div>
      )}
    </div>
  );
}