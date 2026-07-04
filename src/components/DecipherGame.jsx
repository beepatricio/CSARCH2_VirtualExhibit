import { useState } from "react";
// Import the separated stage modules
import FetchStage from "./FetchStage.jsx";
import DecodeStage from "./DecodeStage.jsx";
import ExecuteStage from "./ExecuteStage.jsx";

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

export default function DecipherGame() {
  const [hasAcceptedBriefing, setHasAcceptedBriefing] = useState(false);
  const [instructionIndex, setInstructionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [gameStage, setGameStage] = useState("fetch"); // Stages: "fetch" | "decode" | "execute" | "complete"

  const current = INSTRUCTIONS[instructionIndex];

  // Callback functions that child components execute when completed
  const handleFetchComplete = () => {
    setGameStage("decode");
  };

  const handleDecodeComplete = () => {
    setGameStage("execute");
  };

  const handleExecuteComplete = () => {
    setScore((prev) => prev + 1);
    if (instructionIndex === INSTRUCTIONS.length - 1) {
      setGameStage("complete");
    } else {
      // Advance to the next instruction loop and reset back to fetch stage
      setInstructionIndex((prev) => prev + 1);
      setGameStage("fetch");
    }
  };

  // Mission Details Landing View
  if (!hasAcceptedBriefing) {
    return (
      <div style={{ fontFamily: "monospace", color: "#e7e5e4", display: "flex", flexDirection: "column", gap: "32px", width: "100%"  }}>

        {/*  */}
        <section style={{ 
          border: "2px solid #444", 
          background: "linear-gradient(to bottom, rgba(12, 10, 9, 0.85), rgba(12, 10, 9, 0.95))",
          padding: "2rem", 
          borderRadius: "8px", 
          position: "relative", 
          width: "100%", 
          boxSizing: "border-box" 
        }}>
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

            {/* Hardware Metadata Grid Table */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", fontSize: "11px", color: "#d6d3d1", background: "rgba(0, 0, 0, 0.4)", padding: "14px", border: "1px solid #2e2a24", borderRadius: "6px" }}>
              <div><span style={{ color: "#78716c", fontWeight: "bold", marginRight: "6px" }}>CASE_ID:</span> #80205</div>
              <div><span style={{ color: "#78716c", fontWeight: "bold", marginRight: "6px" }}>CLEARANCE:</span> FIELD AGENT</div>
              <div><span style={{ color: "#78716c", fontWeight: "bold", marginRight: "6px" }}>TARGET:</span> MICROPROCESSOR CORE</div>
              <div><span style={{ color: "#78716c", fontWeight: "bold", marginRight: "6px" }}>STATUS:</span> INTERCEPT ACTIVE</div>
            </div>

            <p style={{ fontSize: "13px", lineHeight: "1.65", color: "#d6d3d1", fontFamily: "sans-serif", margin: "8px 0 16px 0" }}>
              <strong>OPERATIVE BRIEFING:</strong> We just intercepted an encrypted transmission from our field agent, Mr. Padfoot. The problem? Our standard decryption software has been compromised. To read this intelligence safely without triggering any alarms, we have to bypass the system and map out the hardware data paths ourselves.
            </p>

            {/* Start Decipher Now */}
            <div style={{ display: "flex", justifyContent: "center", marginTop: "8px" }}>
              <button 
                onClick={() => setHasAcceptedBriefing(true)}
                style={{ width: "100%", padding: "18px 0", background: "#ef4444", border: "none", color: "#ffffff", fontSize: "13px", fontWeight: "900", letterSpacing: "0.2em", textTransform: "uppercase", borderRadius: "6px", cursor: "pointer", transition: "all 0.2s ease" }}
              >
                Start Journey Now ▶
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // Final Success View 
  if (gameStage === "complete") {
    return (
      <div style={{ padding: "1.5rem", background: "rgba(0,0,0,0.2)", border: "1px solid #2e2a24", borderRadius: "8px" }}>
        <h3 style={{ color: "#f61010", fontWeight: "bold", marginRight: "6px" }}>Operation Successful. Pipeline Clear!</h3>
        <p style={{ color: "#008f5a", fontWeight: "bold", marginRight: "6px" }}>Final Score: {score} / {INSTRUCTIONS.length}</p>
      </div>
    );
  }

  // Game Flow
  return (
    <div style={{ padding: "1.5rem", background: "rgba(0,0,0,0.2)", border: "1px solid #2e2a24", borderRadius: "8px" }}>
      
      {/* Fetch phase component */}
      {gameStage === "fetch" && (
        <FetchStage 
          instruction={current} 
          onComplete={handleFetchComplete} 
        />
      )}

      {/* Decode phase component */}
      {gameStage === "decode" && (
        <DecodeStage 
          instruction={current} 
          onComplete={handleDecodeComplete} 
        />
      )}

      {/*Execute phase component*/}
      {gameStage === "execute" && (
        <ExecuteStage 
          instruction={current} 
          onComplete={handleExecuteComplete} 
        />
      )}

    </div>
  );
}