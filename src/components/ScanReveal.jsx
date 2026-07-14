// ScanReveal.jsx
// Wraps the exhibit's opening briefing content (e.g. <TextWithImage />) with
// a "decrypting the intercepted transmission" animation: a red scanline
// sweeps over blurred/dimmed content, then it snaps into focus with a
// DECLASSIFIED stamp. Keeps the classified/case-file theme from the game.
import { useEffect, useState } from "react";

export default function ScanReveal({ children, label = "DECRYPTING TRANSMISSION" }) {
  const [phase, setPhase] = useState("scanning"); // "scanning" -> "revealed"

  useEffect(() => {
    const t = setTimeout(() => setPhase("revealed"), 1150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ position: "relative" }}>
      <style>{`
        @keyframes scanReveal_scanline { 0% { top: 0%; opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes scanReveal_stampIn {
          0% { opacity: 0; transform: scale(2.2) rotate(-8deg); }
          60% { opacity: 1; transform: scale(0.92) rotate(-8deg); }
          100% { opacity: 1; transform: scale(1) rotate(-8deg); }
        }
      `}</style>

      <div
        style={{
          filter: phase === "scanning" ? "blur(6px) brightness(0.35)" : "none",
          opacity: phase === "scanning" ? 0.4 : 1,
          transition: "filter 0.6s ease, opacity 0.6s ease",
        }}
      >
        {children}
      </div>

      {phase === "scanning" && (
        <>
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              height: "2px",
              background: "#ef4444",
              boxShadow: "0 0 14px 2px rgba(239,68,68,0.7)",
              animation: "scanReveal_scanline 1.15s linear forwards",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              fontFamily: "monospace",
              fontSize: "11px",
              fontWeight: "bold",
              letterSpacing: "0.15em",
              color: "#ef4444",
              textShadow: "0 0 8px rgba(239,68,68,0.6)",
              whiteSpace: "nowrap",
            }}
          >
            {label}...
          </div>
        </>
      )}

      {phase === "revealed" && (
        <div
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            border: "2px solid rgba(16,185,129,0.7)",
            color: "#34d399",
            fontSize: "10px",
            fontWeight: "bold",
            letterSpacing: "0.15em",
            padding: "3px 8px",
            textTransform: "uppercase",
            fontFamily: "monospace",
            borderRadius: "3px",
            background: "rgba(12,10,9,0.7)",
            animation: "scanReveal_stampIn 0.5s ease forwards",
          }}
        >
          Declassified
        </div>
      )}
    </div>
  );
}
