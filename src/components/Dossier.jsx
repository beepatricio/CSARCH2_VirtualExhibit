// Dossier.jsx
// Replaces static "Key Components" bullet lists with clickable folder tabs
// (trapezoid, overlapping like real hanging file tabs). Clicking a tab
// expands a dossier card underneath with its description.
// items: [{ term: string, def: string }], accent: hex color for the stage.
import { useState } from "react";

export default function Dossier({ items, accent = "#ef4444" }) {
  const [open, setOpen] = useState(null);

  return (
    <div style={{ fontFamily: "monospace", margin: "1.25rem 0" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
        {items.map((item, i) => (
          <button
            key={item.term}
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              padding: "10px 20px 8px 20px",
              background: open === i ? accent : "#0c0a09",
              border: `1px solid ${open === i ? accent : "#2e2a24"}`,
              borderBottom: "none",
              clipPath: "polygon(6% 0%, 94% 0%, 100% 100%, 0% 100%)",
              color: open === i ? "#0c0a09" : "#e7e5e4",
              fontSize: "12px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.2s ease",
              position: "relative",
              top: open === i ? "0px" : "3px",
            }}
          >
            {item.term}
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          style={{
            padding: "16px 18px",
            background: "#0c0a09",
            border: `1px solid ${accent}55`,
            borderTop: `2px solid ${accent}`,
            borderRadius: "0 0 6px 6px",
            fontSize: "13px",
            lineHeight: "1.6",
            color: "#d6d3d1",
            fontFamily: "sans-serif",
            animation: "dossierIn 0.25s ease",
          }}
        >
          <style>{`@keyframes dossierIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div
            style={{
              fontFamily: "monospace",
              fontSize: "10px",
              letterSpacing: "0.12em",
              color: accent,
              marginBottom: "6px",
              textTransform: "uppercase",
            }}
          >
            Case File: {items[open].term}
          </div>
          {items[open].def}
        </div>
      )}
    </div>
  );
}
