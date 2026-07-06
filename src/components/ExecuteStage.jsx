import { useState, useMemo, useEffect } from "react";

const EXECUTE_PLANS = {
  "mov-reg-reg": {
    display: "MOV AX, BX",
    resultText: "Register transfer complete. AX now holds the value of BX.",
    nodes: ["BX", "Temp", "ALU", "AX"],
    steps: [
      { question: "Register BX holds the source value. What happens next?", answer: "BX → Temp", explanation: "Correct! Even a register move is staged through Temp before it touches the ALU." },
      { question: "The value is now in Temp. What happens next?", answer: "Temp → ALU", explanation: "Correct! The ALU passes the value through. No arithmetic needed, but the data path still runs through it." },
      { question: "The ALU has passed the value along. What happens next?", answer: "ALU → AX", explanation: "Correct! The value is latched into AX. MOV AX, BX is complete." },
    ],
  },
  "mov-mem-read": {
    display: "MOV AX, [BX]",
    resultText: "Memory read complete. The value at the address in BX is now in AX.",
    nodes: ["IR", "BX", "MAR", "Memory", "MBR", "AX"],
    steps: [
      { question: "MOV AX, [BX] is in the IR. [BX] means BX holds an address. What happens next?", answer: "BX → MAR", explanation: "Correct! BX is a pointer. Its value (the target address) is copied into the MAR." },
      { question: "The address is now in the MAR. What happens next?", answer: "MAR → Memory", explanation: "Correct! The MAR tells Memory which address to access." },
      { question: "Memory has located the value. What happens next?", answer: "Memory → MBR", explanation: "Correct! The retrieved value is placed into the MBR." },
      { question: "The value is now in the MBR. What happens next?", answer: "MBR → AX", explanation: "Correct! The value is copied into AX. MOV AX, [BX] is complete." },
    ],
  },
  "mov-reg-write": {
    display: "MOV [BX], AX",
    resultText: "Memory write complete. AX's value has been stored at the address in BX.",
    nodes: ["IR", "BX", "MAR", "AX", "MBR", "Memory"],
    steps: [
      { question: "MOV [BX], AX is in the IR; this time the destination is memory. What happens next?", answer: "BX → MAR", explanation: "Correct! BX holds the destination address, loaded into the MAR first." },
      { question: "The destination address is now in the MAR. What happens next?", answer: "AX → MBR", explanation: "Correct! The value to write, held in AX, is copied into the MBR." },
      { question: "The value to write is now in the MBR. What happens next?", answer: "MBR → Memory", explanation: "Correct! The value is written into Memory at the MAR's address. MOV [BX], AX is complete." },
    ],
  },
  "add-immediate": {
    display: "ADD AX, 5",
    resultText: "Immediate addition complete. 5 has been added into AX.",
    nodes: ["IR", "AX", "ALU"],
    steps: [
      { question: "ADD AX, 5 is in the IR. The 5 is embedded right in the instruction. What happens next?", answer: "IR[imm] → ALU", explanation: "Correct! An immediate value skips memory entirely. It's routed straight from the IR into the ALU." },
      { question: "Register AX holds the value to add to. What happens next?", answer: "AX → ALU", explanation: "Correct! AX is fed into the ALU alongside the immediate value." },
      { question: "The ALU has added the values. What happens next?", answer: "ALU → AX", explanation: "Correct! The sum is written back into AX. ADD AX, 5 is complete." },
    ],
  },
  "jmp-branch": {
    display: "JMP LOOP_START",
    resultText: "Branch complete. The Program Counter now points to LOOP_START.",
    nodes: ["IR", "MAR", "PC"],
    steps: [
      { question: "JMP LOOP_START is in the IR. What happens next?", answer: "IR → MAR", explanation: "Correct! The jump target address moves into the MAR, ready to load into the PC." },
      { question: "The target address is now in the MAR. What happens next?", answer: "MAR → PC", explanation: "Correct! The PC is overwritten with the new address. Execution resumes from LOOP_START next cycle." },
    ],
  },
};

const WRONG_CHOICES = [
  "AX → MAR", "AX → Memory", "AX → PC", "BX → MBR", "BX → ALU",
  "MAR → IR", "MAR → AX", "Memory → IR", "Memory → AX", "MBR → MAR",
  "MBR → IR", "IR → Memory", "IR → PC", "Temp → Memory", "ALU → Memory",
  "ALU → PC", "PC → MAR", "IR[imm] → MBR", "IR[imm] → Memory",
];

// Score points for each step of the stage so that total is 100
function distributePoints(count, total = 100) {
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => (i >= count - remainder ? base + 1 : base));
}
const TOTAL_ACTIONS = Object.values(EXECUTE_PLANS).reduce((sum, plan) => sum + plan.steps.length, 0);
const EXECUTE_POINTS = distributePoints(TOTAL_ACTIONS);

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

// removes [imm] for better layout in diagram
function baseNode(token) {
  return token.replace(/\[.*\]/, "");
}

function DiagramBox({ label, state, revealed }) {
  const styles = {
    active: { border: "1px solid #f59e0b", background: "rgba(245,158,11,0.16)", color: "#fbbf24", boxShadow: "0 0 12px rgba(245,158,11,0.25)" },
    visited: { border: "1px solid #10b981", background: "rgba(16,185,129,0.12)", color: "#34d399", boxShadow: "none" },
    idle: { border: "1px solid #2e2a24", background: "#0c0a09", color: "#a8a29e", boxShadow: "none" },
  }[state];

  return (
    <div
      style={{
        flex: "1 1 90px",
        padding: "10px 8px",
        textAlign: "center",
        borderRadius: "6px",
        fontFamily: "monospace",
        fontSize: "12px",
        fontWeight: "bold",
        transition: "all 0.25s ease",
        ...styles,
      }}
    >
      {revealed ? label : "?"}
    </div>
  );
}

function DiagramArrow({ active }) {
  return (
    <div style={{ padding: "0 4px", fontSize: "14px", color: active ? "#f59e0b" : "#3f3a34", transition: "color 0.25s ease" }}>
      →
    </div>
  );
}

function ExecuteDiagram({ nodes, visited, active, locked }) {
  return (
    <div style={{ padding: "1rem", background: "#0c0a09", border: "1px solid #1c1917", borderRadius: "6px", marginBottom: "1.25rem" }}>
      <p style={{ margin: "0 0 10px 0", fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase", color: "#78716c", fontFamily: "monospace" }}>
        Execute Data Path
      </p>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px" }}>
        {nodes.map((node, i) => {
          const state = active.includes(node) ? "active" : visited.includes(node) ? "visited" : "idle";
          const revealed = state === "visited" || (state === "active" && locked);
          const arrowActive = active.includes(node) && active.includes(nodes[i + 1]);
          return (
            <div key={node + i} style={{ display: "flex", alignItems: "center" }}>
              <DiagramBox label={node} state={state} revealed={revealed} />
              {i < nodes.length - 1 && <DiagramArrow active={arrowActive} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ExecuteStage({ onComplete, onWrong, onCorrect }) {
  // shuffle order of the 5 instructions
  const order = useMemo(() => shuffle(Object.keys(EXECUTE_PLANS)), []);

  const [instructionIndex, setInstructionIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);
  const [finished, setFinished] = useState(false);

    // tally of scoring across the whole stage
  const [actionIndex, setActionIndex] = useState(0);

  useEffect(() => {
    setCurrentStep(0);
    setFeedback(null);
    setLocked(false);
    setFinished(false);
  }, [instructionIndex]);

  const plan = EXECUTE_PLANS[order[instructionIndex % order.length]];
  const current = plan.steps[currentStep];

  const visitedNodes = plan.steps
    .slice(0, currentStep)
    .flatMap((s) => s.answer.split(" → ").map(baseNode));

  const activeNodes = finished ? [] : current.answer.split(" → ").map(baseNode);

  const choices = useMemo(() => {
    const wrong = shuffle(WRONG_CHOICES.filter((c) => c !== current.answer)).slice(0, 3);
    return shuffle([current.answer, ...wrong]);
  }, [currentStep, instructionIndex]);

  function handleChoiceClick(choice) {
    if (locked) return;

    if (choice === current.answer) {
      setFeedback({ tone: "good", text: current.explanation });
      setLocked(true);
      onCorrect(EXECUTE_POINTS[actionIndex] ?? 0);
      setActionIndex((prev) => prev + 1);

      setTimeout(() => {
        if (currentStep === plan.steps.length - 1) {
          setFinished(true);
          setFeedback({ tone: "good", text: plan.resultText });

          setTimeout(() => {
            if (instructionIndex === order.length - 1) {
              onComplete();
            } else {
              setCurrentStep(0);
              setFeedback(null);
              setLocked(false);
              setFinished(false);
              setInstructionIndex((prev) => prev + 1);
            }
          }, 1800);
        } else {
          setCurrentStep((prev) => prev + 1);
          setFeedback(null);
          setLocked(false);
        }
      }, 1200);
    } else {
      setFeedback({ tone: "bad", text: "Incorrect. Think about which component should handle this data next." });
      onWrong();
    }
  }

  return (
    <div>
      <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: "bold" }}>[ STAGE 03: EXECUTE PHASE ]</span>

      <p style={{ fontSize: "12px", color: "#a8a29e", margin: "4px 0 4px 0", fontFamily: "monospace" }}>
        Executing <strong style={{ color: "#e7e5e4" }}>{plan.display}</strong> · Micro-op {Math.min(currentStep + 1, plan.steps.length)} / {plan.steps.length}
      </p>
      <p style={{ fontSize: "11px", color: "#78716c", margin: "0 0 12px 0", fontFamily: "monospace" }}>
        Instruction {instructionIndex + 1} / {order.length}
      </p>

    <ExecuteDiagram nodes={plan.nodes} visited={finished ? plan.nodes : visitedNodes} active={activeNodes} locked={locked} />

      {!finished ? (
        <div style={{ padding: "1.25rem", background: "#0c0a09", border: "1px solid #1c1917", borderRadius: "6px", marginBottom: "1.25rem" }}>
          <p style={{ color: "#e7e5e4", fontFamily: "monospace", fontSize: "14px", fontWeight: "bold", marginBottom: "14px" }}>
            {current.question}
          </p>
          <div style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(2, 1fr)" }}>
            {choices.map((choice) => (
              <button
                key={choice}
                onClick={() => handleChoiceClick(choice)}
                disabled={locked}
                style={{ padding: "12px", textAlign: "left", background: "#0c0a09", border: "1px solid #2e2a24", borderRadius: "6px", cursor: locked ? "not-allowed" : "pointer", color: "#e7e5e4", fontFamily: "monospace", fontSize: "13px", fontWeight: "bold" }}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: "1.25rem", background: "#0c0a09", border: "1px solid rgba(16,185,129,0.4)", borderRadius: "6px", marginBottom: "1.25rem", textAlign: "center" }}>
          <span style={{ color: "#34d399", fontSize: "11px", fontWeight: "bold", letterSpacing: "0.1em" }}>EXECUTION COMPLETE</span>
        </div>
      )}

      {feedback && (
        <div
          style={{
            marginTop: "1.25rem",
            padding: "10px 14px",
            fontSize: "13px",
            borderRadius: "6px",
            border: feedback.tone === "good" ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(239,68,68,0.3)",
            color: feedback.tone === "good" ? "#34d399" : "#f87171",
            background: feedback.tone === "good" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.04)",
            lineHeight: "1.5",
          }}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}