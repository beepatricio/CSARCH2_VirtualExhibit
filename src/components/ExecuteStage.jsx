import { useState, useMemo, useEffect, useRef } from "react";

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
    active: { border: "3px solid #f2a52c", background: "#fffbea", color: "#f2a52c", boxShadow: "4px 4px 0 #f2a52c" },
    visited: { border: "3px solid #3fae5c", background: "#eafff1", color: "#3fae5c", boxShadow: "3px 3px 0 #3fae5c" },
    idle: { border: "3px solid #1c3a17", background: "#ffffff", color: "#1c3a17", boxShadow: "3px 3px 0 #1c3a17" },
  }[state];

  return (
    <div
      style={{
        flex: "1 1 clamp(52px, 15vw, 90px)",
        minWidth: 0,
        padding: "clamp(8px, 2.6vw, 12px) clamp(4px, 1.8vw, 10px)",
        textAlign: "center",
        borderRadius: "clamp(8px, 2vw, 12px)",
        fontFamily: "'Baloo 2', 'Arial Black', sans-serif",
        fontSize: "clamp(10px, 3vw, 13px)",
        fontWeight: "900",
        transition: "all 0.25s ease",
        boxSizing: "border-box",
        overflowWrap: "break-word",
        ...styles,
      }}
    >
      {revealed ? label : "?"}
    </div>
  );
}

function DiagramArrow({ active }) {
  return (
    <div style={{ padding: "0 clamp(2px, 1.2vw, 8px)", fontSize: "clamp(14px, 4vw, 22px)", color: active ? "#f2a52c" : "#1c3a17", transition: "color 0.25s ease", flexShrink: 0 }}>
      →
    </div>
  );
}

function ExecuteDiagram({ nodes, visited, active, locked }) {
  return (
    <div style={{ padding: "clamp(0.65rem, 3.5vw, 1rem)", background: "#fffbea", border: "3px solid #1c3a17", boxShadow: "4px 4px 0 #1c3a17", borderRadius: "14px", marginBottom: "clamp(0.85rem, 3vw, 1.25rem)", boxSizing: "border-box", overflow: "hidden" }}>
      <p style={{ margin: "0 0 10px 0", fontSize: "clamp(8px, 2.4vw, 10px)", letterSpacing: "0.1em", textTransform: "uppercase", color: "#4c6b44", fontFamily: "monospace" }}>
        Execute Data Path
      </p>
      <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "2px", rowGap: "10px" }}>
        {nodes.map((node, i) => {
          const state = active.includes(node) ? "active" : visited.includes(node) ? "visited" : "idle";
          const revealed = state === "visited" || (state === "active" && locked);
          const arrowActive = active.includes(node) && active.includes(nodes[i + 1]);
          return (
            <div key={node + i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
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
  const [shakeKey, setShakeKey] = useState(0);
  const [msgKey, setMsgKey] = useState(0);

    // tally of scoring across the whole stage
  const [actionIndex, setActionIndex] = useState(0);

  const advanceTimerRef = useRef(null);

  useEffect(() => {
    setCurrentStep(0);
    setFeedback(null);
    setLocked(false);
    setFinished(false);
    return () => clearTimeout(advanceTimerRef.current);
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
      <span style={{  color: "#f2a52c", fontFamily: "'Baloo 2', 'Arial Black', sans-serif", fontSize: "clamp(10px, 3vw, 12px)", fontWeight: "900" }}>[ STAGE 03: EXECUTE PHASE ]</span>

      <p style={{ fontSize: "clamp(11px, 3vw, 12px)", color: "#4c6b44", margin: "4px 0 4px 0", fontFamily: "monospace", fontWeight:"700", lineHeight: "1.4" }}>
        Executing <strong style={{ color: "#1c3a17" }}>{plan.display}</strong> · Micro-op {Math.min(currentStep + 1, plan.steps.length)} / {plan.steps.length}
      </p>
      <p style={{ fontSize: "clamp(9.5px, 2.6vw, 11px)", color: "#4c6b44", margin: "0 0 10px 0", fontFamily: "monospace" }}>
        Instruction {instructionIndex + 1} / {order.length}
      </p>

    <ExecuteDiagram nodes={plan.nodes} visited={finished ? plan.nodes : visitedNodes} active={activeNodes} locked={locked} />

      {!finished ? (
        <div style={{ padding: "clamp(0.9rem, 4vw, 1.25rem)", background: "#ffffff", border: "3px solid #1c3a17", borderRadius: "14px", marginBottom: "14px", boxSizing: "border-box" }}>
          <p style={{ color: "#1c3a17", fontFamily: "sans-serif", fontSize: "clamp(12.5px, 3.6vw, 14px)", fontWeight: "800", marginBottom: "14px", lineHeight: "1.4" }}>
            {current.question}
          </p>
          <div style={{ display: "grid", gap: "8px", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))" }}>
            {choices.map((choice) => (
              <button
                key={choice}
                onClick={() => handleChoiceClick(choice)}
                disabled={locked}
                style={{ padding: "10px 12px", textAlign: "left", background: locked ? "#f3f3ed" : "#fffbea", border: "3px solid #1c3a17", borderRadius: "10px", cursor: locked ? "not-allowed" : "pointer", color: "#1c3a17", fontFamily: "sans-serif", fontSize: "clamp(11.5px, 3.2vw, 13px)", fontWeight: "800", lineHeight: "1.3", wordBreak: "break-word" }}
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div style={{ padding: "clamp(0.9rem, 4vw, 1.25rem)", background: "#eafff1", border: "3px solid #3fae5c", borderRadius: "14px", marginBottom: "1.25rem", textAlign: "center", boxSizing: "border-box" }}>
          <span style={{ color: "#3fae5c", fontSize: "clamp(10px, 2.8vw, 11px)", fontWeight: "bold", letterSpacing: "0.08em" }}>EXECUTION COMPLETE</span>
        </div>
      )}

      {feedback && (
        <div
          style={{
            marginTop: "1.1rem",
            padding: "10px 14px",
            fontSize: "clamp(11.5px, 3.2vw, 13px)",
            borderRadius: "6px",
            border: feedback.tone === "good" ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(239,68,68,0.3)",
            color: feedback.tone === "good" ? "#34d399" : "#f87171",
            background: feedback.tone === "good" ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.04)",
            lineHeight: "1.5",
            boxSizing: "border-box",
          }}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}