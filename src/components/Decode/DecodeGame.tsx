// Decode Game component

// Game logic for decode stage
// click opcode, click operand(s), choose which execution route
// Wrong picks cost a life, resets current instruction

import React, { useMemo, useState } from "react";
import type { DecodeStage } from "./DecodeDiagram";

// Possible  routes for Control Unit to take, sending decoded instruction
export type ExecutionRoute =
  | "memory-read"
  | "memory-write"
  | "register-alu"
  | "immediate"
  | "branch";

// Quiz instruction, choices are the clickable pieces (w/ instruction)
type Instruction = {
  id: string;
  choices: string[];
  opcodeIndex: number; 
  operandIndices: number[];
  correctRoute: ExecutionRoute;
  explanation: string;
};

const INSTRUCTIONS: Instruction[] = [
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
    explanation: "The brackets around BX mean that the memory address is in BX, so Control Unit must read from memory to a register."
  },
  {
    id: "mov-reg-write",
    choices: ["MOV", "[BX]", "AX"],
    opcodeIndex: 0,
    operandIndices: [1, 2],
    correctRoute: "memory-write",
    explanation: "The destination is the one with the brackets, thus the Control Unit writes the register's value to the memory.",
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

// Labels + short hints for five route choices
const ROUTE_LABELS: { value: ExecutionRoute; label: string; hint: string }[] = [
  { value: "memory-read", label: "Memory Read", hint: "IR → MAR → Memory → MBR → AX" },
  { value: "memory-write", label: "Memory Write", hint: "IR → MAR → AX → MBR → Memory" },
  { value: "register-alu", label: "Register/ALU", hint: "BX → Temp → ALU → AX" },
  { value: "immediate", label: "Immediate", hint: "IR → AX" },
  { value: "branch", label: "Branch", hint: "IR → MAR → PC" },
];

const STARTING_LIVES = 3;

type DecodeGameProps = {
  onStageComplete?: () => void;
  onActiveStageChange?: (stage: DecodeStage) => void;
};

// 3 sub-steps the player moves through for each instruction
type Phase = "pick-opcode" | "pick-operands" | "pick-route";

export default function DecodeGame({
  onStageComplete,
  onActiveStageChange,
}: DecodeGameProps) {
  // Current instruction
  const [instructionIndex, setInstructionIndex] = useState(0);
  const current = INSTRUCTIONS[instructionIndex];

  // Instruction state: phase, chosen opcode, chosen operands, feedback
  const [phase, setPhase] = useState<Phase>("pick-opcode");
  const [chosenOpcodeIndex, setChosenOpcodeIndex] = useState<number | null>(null);
  const [chosenOperandIndices, setChosenOperandIndices] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<{ tone: "good" | "bad"; text: string } | null>(
    null
  );

  // Overall game state: lives, score, game over, finished
  const [lives, setLives] = useState(STARTING_LIVES);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [finished, setFinished] = useState(false);

  const isLastInstruction = instructionIndex === INSTRUCTIONS.length - 1;

  // Tell the diagram which box should currently glow.
  function pushActiveStage(stage: DecodeStage) {
    onActiveStageChange?.(stage);
  }

  // Used both when starting a new instruction/when the player runs out of lives
  function resetInstructionState() {
    setPhase("pick-opcode");
    setChosenOpcodeIndex(null);
    setChosenOperandIndices([]);
    setFeedback(null);
    pushActiveStage("ir");
  }

  // Deducts a life, shows feedback, restarts if needed
  function loseLife(message: string) {
    setFeedback({ tone: "bad", text: message });
    setLives((prev) => {
      const next = prev - 1;
      if (next <= 0) {
        // Out of lives: pause then reset game state
        setTimeout(() => {
          resetInstructionState();
          setLives(STARTING_LIVES);
        }, 900);
        setGameOver(true);
      }
      return Math.max(next, 0);
    });
  }

  // Chooses opcode, moves to next phase, loses life if wrong
  function handleOpcodeClick(tokenIndex: number) {
    if (phase !== "pick-opcode" || gameOver) return;

    if (tokenIndex === current.opcodeIndex) {
      setChosenOpcodeIndex(tokenIndex);
      setFeedback({ tone: "good", text: "Correct! That's the opcode." });
      setPhase("pick-operands");
      pushActiveStage("opcode");
    } else {
      loseLife("Not quite! That isn't the operation being performed.");
    }
  }

  // Chooses operands, moves to next phase if all found, loses life if wrong
  function handleOperandClick(tokenIndex: number) {
    if (phase !== "pick-operands" || gameOver) return;
    if (tokenIndex === chosenOpcodeIndex) return; // already used as opcode
    if (chosenOperandIndices.includes(tokenIndex)) return; // already picked

    if (current.operandIndices.includes(tokenIndex)) {
      const updated = [...chosenOperandIndices, tokenIndex];
      setChosenOperandIndices(updated);

      // Check whether every required operand token has now been picked
      const allFound = current.operandIndices.every((i) => updated.includes(i));
      if (allFound) {
        setFeedback({ tone: "good", text: "All operands identified." });
        setPhase("pick-route");
        pushActiveStage("operand");
      } else {
        setFeedback({ tone: "good", text: "Correct! Keep going." });
      }
    } else {
      loseLife("That token isn't an operand for this instruction.");
    }
  }

  // Choose execution route, moves to next instruction if correct, loses life if wrong
  function handleRouteClick(route: ExecutionRoute) {
    if (phase !== "pick-route" || gameOver) return;

    if (route === current.correctRoute) {
      pushActiveStage("control-unit");
      setScore((s) => s + 1);
      setFeedback({ tone: "good", text: current.explanation });

      // Pause then advance (to show explanation)
      setTimeout(() => {
        if (isLastInstruction) {
          setFinished(true);
          onStageComplete?.();
        } else {
          setInstructionIndex((i) => i + 1);
          resetInstructionState();
        }
      }, 1200);
    } else {
      loseLife(
        "That's not the right route, think about what the operands actually are (register, memory address, or constant?)."
      );
    }
  }

  // Restart the whole module from instruction 0, reset lives and score
  function handleRestart() {
    setInstructionIndex(0);
    setScore(0);
    setLives(STARTING_LIVES);
    setGameOver(false);
    setFinished(false);
    resetInstructionState();
  }

  // Human-readable phase instructions shown above the token row.
  const phaseInstruction = useMemo(() => {
    if (phase === "pick-opcode") return "Step 1: Click the OPCODE.";
    if (phase === "pick-operands") return "Step 2: Click the OPERAND(S).";
    return "Step 3: Pick the execution route the Control Unit should choose.";
  }, [phase]);

  // Completion
  if (finished) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-emerald-400">
          Decode Stage Complete!
        </p>
        <h3 className="mt-2 text-2xl font-semibold text-slate-100">
          {score} / {INSTRUCTIONS.length} instructions decoded correctly
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm text-slate-400">
          Every instruction now has a known opcode, its operands, and a
          confirmed route into Execute. That route is exactly what the Execute
          stage picks up next.
        </p>
        <button
          onClick={handleRestart}
          className="mt-6 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-mono text-sm text-emerald-300 transition hover:bg-emerald-500/20"
        >
          ↺ Play Again
        </button>
      </div>
    );
  }

  // Game UI
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/30 p-6">
      {/* Header row: progress + lives */}
      <div className="flex items-center justify-between font-mono text-xs text-slate-500">
        <span>
          Instruction {instructionIndex + 1} / {INSTRUCTIONS.length}
        </span>
        <span className="flex items-center gap-1">
          Lives:
          {Array.from({ length: STARTING_LIVES }).map((_, i) => (
            <span
              key={i}
              className={i < lives ? "text-amber-400" : "text-slate-800"}
            >
              ●
            </span>
          ))}
        </span>
      </div>

      {/* Current instruction, shown as clickable tokens */}
      <div className="mt-4">
        <p className="text-xs text-slate-500">{phaseInstruction}</p>
        <div className="mt-3 flex flex-wrap gap-2 rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-lg">
          {current.choices.map((token, i) => {
            const isOpcodeChoice = i === chosenOpcodeIndex;
            const isOperandChoice = chosenOperandIndices.includes(i);
            const clickable =
              (phase === "pick-opcode" && chosenOpcodeIndex === null) ||
              (phase === "pick-operands" && i !== chosenOpcodeIndex);

            return (
              <button
                key={i}
                disabled={!clickable}
                onClick={() =>
                  phase === "pick-opcode"
                    ? handleOpcodeClick(i)
                    : handleOperandClick(i)
                }
                className={[
                  "rounded px-3 py-1 transition",
                  isOpcodeChoice
                    ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400"
                    : isOperandChoice
                    ? "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400"
                    : "text-slate-300 hover:bg-slate-800",
                  !clickable ? "cursor-default opacity-80" : "cursor-pointer",
                ].join(" ")}
              >
                {token}
              </button>
            );
          })}
        </div>
      </div>

      {/* Phase 3: route selection buttons */}
      {phase === "pick-route" && (
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {ROUTE_LABELS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleRouteClick(opt.value)}
              className="rounded-lg border border-slate-800 bg-slate-950 p-3 text-left transition hover:border-emerald-500/40 hover:bg-slate-900"
            >
              <div className="font-mono text-sm text-slate-200">{opt.label}</div>
              <div className="mt-1 font-mono text-[11px] text-slate-500">
                {opt.hint}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Feedback banner: green for correct, red for incorrect */}
      {feedback && (
        <div
          className={[
            "mt-4 rounded-lg border px-4 py-2 text-sm",
            feedback.tone === "good"
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-300"
              : "border-red-500/30 bg-red-500/5 text-red-300",
          ].join(" ")}
        >
          {feedback.text}
        </div>
      )}
    </div>
  );
}
