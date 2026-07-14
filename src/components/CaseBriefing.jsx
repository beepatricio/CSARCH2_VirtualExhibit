// CaseBriefing.jsx
// Merges the "cover page" hero and the decrypt-intro into a single unified
// panel: status bar -> stamp -> "Welcome back, Agent." heading -> divider ->
// case file count -> then the actual mission text/image (passed as
// children), which decrypts into view within the same paper-textured
// surface. No separate stacked blocks - one continuous case file.
import { useEffect, useState } from "react";

export default function CaseBriefing({ children, caseCount = 1 }) {
  const [phase, setPhase] = useState("scanning"); // "scanning" -> "revealed"

  useEffect(() => {
    const t = setTimeout(() => setPhase("revealed"), 1150);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "10px",
        border: "1px solid #2e2a24",
        margin: "0 0 2.5rem 0",
        fontFamily: "monospace",
      }}
    >
      <style>{`
        @keyframes cb_blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
        @keyframes cb_fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes cb_stampSlam {
          0% { opacity: 0; transform: rotate(-9deg) scale(2.4); }
          55% { opacity: 1; transform: rotate(-9deg) scale(0.94); }
          75% { transform: rotate(-9deg) scale(1.04); }
          100% { opacity: 1; transform: rotate(-9deg) scale(1); }
        }
        @keyframes cb_scanline { 0% { top: 0%; opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes cb_grain { 0%, 100% { background-position: 0 0; } 50% { background-position: 6px 4px; } }
      `}</style>

      {/* status bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "10px 20px",
          background: "#0c0a09",
          borderBottom: "1px solid #2e2a24",
          fontSize: "10px",
          fontWeight: "bold",
          letterSpacing: "0.15em",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ef4444" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#ef4444",
              display: "inline-block",
              animation: "cb_blink 1.6s ease-in-out infinite",
            }}
          />
          LIVE FEED
        </span>
        <span style={{ color: "#78716c" }}>CLEARANCE LEVEL: FIELD AGENT</span>
      </div>

      {/* paper backdrop, holds everything: stamp, heading, and the briefing text */}
      <div
        className="case-paper"
        style={{
          position: "relative",
          padding: "4rem 1.75rem 2.5rem 1.75rem",
        }}
      >
        {/* TOP SECRET stamp */}
        <div
          style={{
            position: "absolute",
            top: "18px",
            right: "6%",
            fontSize: "clamp(22px, 4.2vw, 40px)",
            fontWeight: 900,
            letterSpacing: "0.1em",
            color: "rgba(190,40,40,0.55)",
            border: "4px double rgba(190,40,40,0.55)",
            padding: "5px 16px",
            transform: "rotate(-9deg)",
            textTransform: "uppercase",
            userSelect: "none",
            whiteSpace: "nowrap",
            animation: "cb_stampSlam 0.6s ease-out both",
          }}
        >
          Top Secret
        </div>

        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              margin: "3rem 0 0 0",
              fontSize: "clamp(24px, 4.4vw, 38px)",
              fontWeight: 900,
              letterSpacing: "0.02em",
              color: "#f5f5f4",
              textTransform: "uppercase",
              lineHeight: 1.2,
              animation: "cb_fadeUp 0.7s ease 0.1s both",
            }}
          >
            Welcome Back, Agent.
          </h2>

          <div
            style={{
              width: "200px",
              margin: "20px auto",
              borderTop: "1px solid rgba(231,229,228,0.35)",
              borderBottom: "1px solid rgba(231,229,228,0.35)",
              height: "3px",
              animation: "cb_fadeUp 0.7s ease 0.3s both",
            }}
          />

          <p
            style={{
              fontSize: "12px",
              letterSpacing: "0.1em",
              color: "#d6d3d1",
              margin: "0 0 34px 0",
              animation: "cb_fadeUp 0.7s ease 0.45s both",
            }}
          >
            {caseCount} NEW CASE FILE{caseCount === 1 ? "" : "S"}
          </p>
        </div>

        {/* the actual briefing text/image, decrypted into view within the same panel */}
        <div style={{ position: "relative", textAlign: "left" }}>
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
                  animation: "cb_scanline 1.15s linear forwards",
                  pointerEvents: "none",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  fontSize: "11px",
                  fontWeight: "bold",
                  letterSpacing: "0.15em",
                  color: "#ef4444",
                  textShadow: "0 0 8px rgba(239,68,68,0.6)",
                  whiteSpace: "nowrap",
                }}
              >
                DECRYPTING TRANSMISSION...
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
                borderRadius: "3px",
                background: "rgba(12,10,9,0.7)",
                animation: "cb_fadeUp 0.5s ease forwards",
              }}
            >
              Declassified
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
