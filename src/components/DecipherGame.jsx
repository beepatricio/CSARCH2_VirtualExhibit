import { useState } from "react";
// Import the separated stage modules
import FetchStage from "./FetchStage.jsx";
import DecodeStage from "./DecodeStage.jsx";
import ExecuteStage from "./ExecuteStage.jsx";

export default function DecipherGame() {
  const [hasAcceptedBriefing, setHasAcceptedBriefing] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [gameStage, setGameStage] = useState("fetch"); // "fetch" | "decode" | "execute" | "complete"

  const total_rnds = 5;

  // Callback functions that child components execute when completed
  const handleFetchComplete = () => {
    setGameStage("decode");
  };

  const handleDecodeComplete = () => {
    setGameStage("execute");
  };

  const handleExecuteComplete = () => {
    const nextCount = completedCycles + 1;
    setCompletedCycles(nextCount);
    
    if (nextCount >= total_rnds) {
      setGameStage("complete");
    } else {
      setGameStage("fetch"); // Loop back to start the next sequence
    }
  };

  // Mission Details Landing View
  if (!hasAcceptedBriefing) {
    return (
      <div style={{ fontFamily: "monospace", color: "#e7e5e4", display: "flex", flexDirection: "column", gap: "32px", width: "100%"  }}>

        {/*  */}
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
                Start Mission Now ▶
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
        <p style={{ color: "#008f5a", fontWeight: "bold", marginRight: "6px" }}>Successfully deciphered all {completedCycles} instruction cycles.</p>
      </div>
    );
  }

  // Game Flow
  return (
    <div style={{ padding: "1.5rem", background: "rgba(0,0,0,0.2)", border: "1px solid #2e2a24", borderRadius: "8px" }}>
      {gameStage === "fetch" && (
        <FetchStage onComplete={handleFetchComplete} />
      )}

      {gameStage === "decode" && (
        <DecodeStage onComplete={handleDecodeComplete} />
      )}

      {gameStage === "execute" && (
        <ExecuteStage onComplete={handleExecuteComplete} />
      )}
    </div>
  );
}