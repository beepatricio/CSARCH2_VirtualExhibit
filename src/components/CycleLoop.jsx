// CycleLoop.jsx
// A self-animating overview of the Fetch-Decode-Execute cycle, placed above
// the three detailed stage sections. Auto-highlights each stage in turn so
// the visitor sees the loop "running" before reading the specifics. Colors
// match the stage colors already used inside FetchStage/DecodeStage/
// ExecuteStage, so it reads as part of the same system.
import { useEffect, useState } from "react";

const STAGES = [
  { key: "fetch", label: "FETCH", color: "#ef4444", desc: "Grab next instruction from memory" },
  { key: "decode", label: "DECODE", color: "#10b981", desc: "Split into opcode + operand(s)" },
  { key: "execute", label: "EXECUTE", color: "#f59e0b", desc: "Run the chosen micro-op route" },
];

export default function CycleLoop() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % STAGES.length), 1600);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        fontFamily: "monospace",
        padding: "1.5rem 1rem",
        background: "#0c0a09",
        border: "1px solid #1c1917",
        borderRadius: "8px",
        margin: "1.5rem 0",
      }}
    >
      <p
        style={{
          margin: "0 0 16px 0",
          fontSize: "10px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          color: "#78716c",
          textAlign: "center",
        }}
      >
        Surveillance Feed &mdash; The Fetch&ndash;Decode&ndash;Execute Cycle
      </p>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "2px" }}>
        {STAGES.map((s, i) => (
          <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                minWidth: "130px",
                padding: "14px 10px",
                textAlign: "center",
                borderRadius: "8px",
                border: `1px solid ${active === i ? s.color : "#2e2a24"}`,
                background: active === i ? `${s.color}1a` : "#0c0a09",
                boxShadow: active === i ? `0 0 18px ${s.color}55` : "none",
                transition: "all 0.5s ease",
              }}
            >
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: "900",
                  letterSpacing: "0.1em",
                  color: active === i ? s.color : "#a8a29e",
                  transition: "color 0.5s ease",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  marginTop: "4px",
                  color: active === i ? "#e7e5e4" : "#57534e",
                  transition: "color 0.5s ease",
                }}
              >
                {s.desc}
              </div>
            </div>
            {i < STAGES.length - 1 && (
              <div
                style={{
                  padding: "0 6px",
                  fontSize: "18px",
                  color: active === i ? s.color : "#3f3a34",
                  transition: "color 0.5s ease",
                }}
              >
                →
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "14px",
          fontSize: "11px",
          color: active === STAGES.length - 1 ? STAGES[2].color : "#57534e",
          transition: "color 0.5s ease",
          letterSpacing: "0.08em",
        }}
      >
        ↺ cycle repeats for every instruction in the program
      </div>
    </div>
  );
}
