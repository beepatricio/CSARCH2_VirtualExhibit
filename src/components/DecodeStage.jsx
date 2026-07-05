import { useState, useMemo, useEffect } from "react";

const INSTRUCTIONS = [
  {
    id: "mov-reg-reg",
    choices: ["MOV", "AX", "BX"],
    opcodeIndex: 0,
    operandIndices: [1, 2],
    correctRoute: "register-alu",
    explanation: "Both operands are registers, so this is a register-to-register move."
  },
  {
    id: "mov-mem-read",
    choices: ["MOV", "AX", "[BX]"],
    opcodeIndex: 0,
    operandIndices: [1, 2],
    correctRoute: "memory-read",
    explanation: "The brackets around BX mean that the memory address is in BX, so the Control Unit must read from memory to a register."
  },
  {
    id: "mov-reg-write",
    choices: ["MOV", "[BX]", "AX"],
    opcodeIndex: 0,
    operandIndices: [1, 2],
    correctRoute: "memory-write",
    explanation: "The destination is the one with the brackets, thus the Control Unit writes the register's value to the memory."
  },
  {
    id: "add-immediate",
    choices: ["ADD", "AX", "5"],
    opcodeIndex: 0,
    operandIndices: [1, 2],
    correctRoute: "immediate",
    explanation: "The second operand is a constant, so this is an immediate addition operation."
  },
  {
    id: "jmp-branch",
    choices: ["JMP", "LOOP_START"],
    opcodeIndex: 0,
    operandIndices: [1],
    correctRoute: "branch",
    explanation: "JMP changes the flow of the program, the Control Unit routes to the branch execution path."
  },
];

const ROUTE_LABELS = [
  { value: "memory-read", label: "Memory Read", hint: "IR → MAR → Memory → MBR → AX" },
  { value: "memory-write", label: "Memory Write", hint: "IR → MAR → AX → MBR → Memory" },
  { value: "register-alu", label: "Register/ALU", hint: "BX → Temp → ALU → AX" },
  { value: "immediate", label: "Immediate", hint: "IR → AX" },
  { value: "branch", label: "Branch", hint: "IR → MAR → PC" },
];

export default function DecodeStage({onComplete }) {
  const [instructionIndex, setInstructionIndex] = useState(0);

  const [phase, setPhase] = useState("pick-opcode");
  const [chosenOpcodeIndex, setChosenOpcodeIndex] = useState(null);
  const [chosenOperandIndices, setChosenOperandIndices] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    setPhase("pick-opcode");
    setChosenOpcodeIndex(null);
    setChosenOperandIndices([]);
    setFeedback(null);
    setLocked(false);
  }, [instructionIndex]);

  // Safely grab the instruction from our local array using the round tracker
  const instruction = INSTRUCTIONS[instructionIndex % INSTRUCTIONS.length];


  const phaseInstruction = useMemo(() => {
    if (phase === "pick-opcode") return "Step 1: Click the OPCODE.";
    if (phase === "pick-operands") return "Step 2: Click the OPERAND(S).";
    return "Step 3: Pick the execution route the Control Unit should choose.";
  }, [phase, feedback]);

  function handleOpcodeClick(index) {
    if (locked) return;
    if (index === instruction.opcodeIndex) {
      setChosenOpcodeIndex(index);
      setFeedback({ tone: "good", text: "Correct! Opcode captured." });
      setPhase("pick-operands");
    } else {
      setFeedback({ tone: "bad", text: "Incorrect opcode choice." });
    }
  }

  function handleOperandClick(index) {
    if (locked || index === chosenOpcodeIndex || chosenOperandIndices.includes(index)) return;
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
    if (locked) return;
    if (route === instruction.correctRoute) {
      setFeedback({ tone: "good", text: instruction.explanation });
      setLocked(true);
      
      setTimeout(() => {
        if (instructionIndex === INSTRUCTIONS.length - 1) {
          onComplete(); 
        } else {
          setInstructionIndex((prev) => prev + 1);
          
        }
      }, 2600);
    } else {
      setFeedback({ tone: "bad", text: "Wrong data path selected." });
    }
  }

  return (
    <div>
      <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: "bold" }}>[ STAGE 02: DECODE PHASE ]</span>
      <p style={{ fontSize: "12px", color: "#a8a29e", margin: "4px 0 12px 0", fontFamily: "monospace" }}>{phaseInstruction}</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", padding: "1.25rem", background: "#0c0a09", border: "1px solid #1c1917", borderRadius: "6px", marginBottom: "1.25rem" }}>
        {instruction.choices.map((token, i) => {
          const isOpcodeChoice = i === chosenOpcodeIndex;
          const isOperandChoice = chosenOperandIndices.includes(i);
          return (
            <button
              key={i}
              onClick={() => (phase === "pick-opcode" ? handleOpcodeClick(i) : handleOperandClick(i))}
              disabled={locked || phase === "pick-route"}
              style={{ padding: "6px 16px", background: isOpcodeChoice ? "rgba(16,185,129,0.15)" : isOperandChoice ? "rgba(245,158,11,0.15)" : "rgba(0,0,0,0.3)", border: isOpcodeChoice ? "1px solid #10b981" : isOperandChoice ? "1px solid #f59e0b" : "1px solid #333", color: isOpcodeChoice ? "#34d399" : isOperandChoice ? "#fbbf24" : "#e7e5e4", borderRadius: "4px", cursor: (locked || phase === "pick-route") ? "not-allowed" : "pointer", fontFamily: "monospace", fontSize: "13px", fontWeight: "bold", transition: "all 0.1s ease" }}
            >
              {token}
            </button>
          );
        })}
      </div>

      {phase === "pick-route" && (
        <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {ROUTE_LABELS.map((opt) => (
            <button key={opt.value} onClick={() => handleRouteClick(opt.value)} disabled={locked} style={{ padding: "12px", textAlign: "left", background: "#0c0a09", border: "1px solid #2e2a24", borderRadius: "6px", cursor: locked ? "not-allowed" : "pointer", color: "#e7e5e4", fontFamily: "monospace" }}>
              <div style={{ fontSize: "13px", fontWeight: "bold", color: "#f5f5f4" }}>{opt.label}</div>
              <div style={{ fontSize: "11px", color: "#78716c", marginTop: "4px", borderTop: "1px solid #1c1917", paddingTop: "4px" }}>{opt.hint}</div>
            </button>
          ))}
        </div>
      )}

      {feedback && (   
        <div style={{ marginTop: "1.25rem", padding: "10px 14px", fontSize: "13px", borderRadius: "6px", border: feedback.tone === "good" ? "1px solid rgba(12, 128, 89, 0.3)" : "1px solid rgba(239,68,68,0.3)", color: feedback.tone === "good" ? "#008f5a" : "#f87171", background: feedback.tone === "good" ? "rgba(16,185,129,0.04)" : "rgba(239,68,68,0.04)", lineHeight: "1.5" }}>
          {feedback.text}
        </div>        
      )}
    </div>
  );
}