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
        fontFamily: " 'Nunito', sans-serif",
        padding: "2rem 1.5rem",
        background: "linear-gradient(180deg, #bdeeff 0%, #eafff1 100%)",
        border: "5px solid #1c3a17",
        borderRadius: "20px",
        boxShadow: "8px 8px 0 #1c3a17",
        margin: "1.5rem 0",
      }}
    >
      <p
        style={{
          margin: "0 0 24px 0",
          fontFamily:" 'Baloo 2', 'Arial Black', sans-serif ",
          fontSize: "14px",
          fontWeight: "800",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#1c3a17",
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
                padding: "16px 12px",
                textAlign: "center",
                borderRadius: "16px",
                border: `4px solid ${active === i ? s.color : "#1c3a17"}`,
                background: active === i ? "#fffbea" : "#ffffff",
                boxShadow: active === i ? `6px 6px 0 ${s.color}` : "5px 5px 0 #1c3a17",
                transition: "all 0.5s ease",
              }}
            >
              <div
                style={{
                  fontFamily: " 'Baloo 2', 'Arial Black', sans-serif",
                  fontSize: "16px",
                  fontWeight: "900",
                  letterSpacing: "0.1em",
                  color: active === i ? s.color : "#1c3a17",
                  transition: "color 0.5s ease",
                }}
              >
                {s.label}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "700",
                  marginTop: "5px",
                  color: active === i ? "#4c6b44" : "#6b7f65",
                  transition: "color 0.5s ease",
                }}
              >
                {s.desc}
              </div>
            </div>
            {i < STAGES.length - 1 && (
              <div
                style={{
                  padding: "0 10px",
                  fontFamily: " 'Baloo 2', 'Arial Black', sans-serif",
                  fontSize: "26px",
                  color: active === i ? s.color : "#1c3a17",
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
          marginTop: "22px",
          fontFamily: " 'JetBrains Mono', monospace",
          fontSize: "11px",
          fontWeight: "700",
          color: active === STAGES.length - 1 ? STAGES[2].color : "#4c6b44",
          transition: "color 0.5s ease",
          letterSpacing: "0.08em",
        }}
      >
        ↺ cycle repeats for every instruction in the program
      </div>
    </div>
  );
}
