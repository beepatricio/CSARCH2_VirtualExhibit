import { useState, useMemo } from "react";

const FETCH_STEPS = [
  {
    current: "PC",
    question: "The CPU is currently reading the Program Counter (PC). What happens next?",
    answer: "PC → MAR",
    explanation: "Correct! The address in the PC is copied into the MAR.",
  },
  {
    current: "MAR",
    question: "The address is now inside the MAR. What happens next?",
    answer: "MAR → Memory",
    explanation: "Correct! The MAR tells Memory which address to access.",
  },
  {
    current: "Memory",
    question: "Memory has located the instruction. What happens next?",
    answer: "Memory → MBR",
    explanation: "Correct! The fetched instruction is loaded into the MBR.",
  },
  {
    current: "MBR",
    question: "The instruction is now inside the MBR. What happens next?",
    answer: "MBR → IR",
    explanation: "Correct! The instruction is transferred into the IR.",
  },
  {
    current: "IR",
    question: "The instruction is now inside the IR. What happens next?",
    answer: "IR → Decode Stage",
    explanation: "Correct! The instruction is ready to be decoded.",
  },
];

const WRONG_CHOICES = [
  "PC → IR",
  "PC → MBR",
  "MAR → MBR",
  "MAR → IR",
  "Memory → IR",
  "Memory → MAR",
  "MBR → Memory",
  "MBR → MAR",
  "IR → MBR",
  "IR → Control Unit",
  "MAR → Control Unit",
  "Memory → Decode Stage",
  "MBR → Decode Stage",
  "PC → Decode Stage",
];

function shuffle(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

export default function FetchStage({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [locked, setLocked] = useState(false);

  const current = FETCH_STEPS[currentStep];

  const choices = useMemo(() => {
    const wrong = WRONG_CHOICES.filter((choice) => choice !== current.answer);
    const randomWrong = shuffle(wrong).slice(0, 3);

    return shuffle([current.answer, ...randomWrong]);
  }, [currentStep]);

  function handleChoiceClick(choice) {
    if (locked) return;

    if (choice === current.answer) {
      setFeedback({
        tone: "good",
        text: current.explanation,
      });

      setLocked(true);

      setTimeout(() => {
        if (currentStep === FETCH_STEPS.length - 1) {
          onComplete();
        } else {
          setCurrentStep(currentStep + 1);
          setFeedback(null);
          setLocked(false);
        }
      }, 1200);
    } else {
      setFeedback({
        tone: "bad",
        text: "Incorrect. Think about where the instruction or address should move next.",
      });
    }
  }

  return (
    <div>
      <span style={{ color: "#ef4444", fontSize: "11px", fontWeight: "bold" }}>
        [ STAGE 01: FETCH PHASE ]
      </span>

      <p style={{ fontSize: "12px", color: "#2c2c2c", margin: "4px 0 12px 0" }}>
        Step {currentStep + 1} / {FETCH_STEPS.length}
      </p>

      <div
        style={{
          padding: "1.25rem",
          background: "#0c0a09",
          border: "1px solid #1c1917",
          borderRadius: "6px",
          marginBottom: "1.25rem",
        }}
      >
        <p
          style={{
            color: "#e7e5e4",
            fontFamily: "monospace",
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "14px",
          }}
        >
          {current.question}
        </p>

        <div
          style={{
            display: "grid",
            gap: "10px",
            gridTemplateColumns: "repeat(2, 1fr)",
          }}
        >
          {choices.map((choice) => (
            <button
              key={choice}
              onClick={() => handleChoiceClick(choice)}
              disabled={locked}
              style={{
                padding: "12px",
                textAlign: "left",
                background: "#0c0a09",
                border: "1px solid #2e2a24",
                borderRadius: "6px",
                cursor: locked ? "not-allowed" : "pointer",
                color: "#e7e5e4",
                fontFamily: "monospace",
                fontSize: "13px",
                fontWeight: "bold",
              }}
            >
              {choice}
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          style={{
            marginTop: "1.25rem",
            padding: "10px 14px",
            fontSize: "13px",
            borderRadius: "6px",
            border:
              feedback.tone === "good"
                ? "1px solid rgba(12, 128, 89, 0.3)"
                : "1px solid rgba(239,68,68,0.3)",
            color: feedback.tone === "good" ? "#008f5a" : "#f87171",
            background:
              feedback.tone === "good"
                ? "rgba(16,185,129,0.04)"
                : "rgba(239,68,68,0.04)",
            lineHeight: "1.5",
          }}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}