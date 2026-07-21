import { useState } from "react";

export default function ComponentPanel({ items, accent = "#eb4b3a" }) {
  const [open, setOpen] = useState(0);

  return (
    <div style={{ fontFamily: "'Nunito', sans-serif", margin: "1.5rem 0" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
        {items.map((item, i) => (
          <button
            key={item.term}
            onClick={() => setOpen(open === i ? null : i)}
            style={{
              padding: "10px 20px",
              background: open === i ? accent : "#ffffff",
              border: "3px solid #1c3a17",
              borderRadius: "14px",
              boxShadow: open === i ? "2px 2px 0 #1c3a17" : "4px 4px 0 #1c3a17",
              transform: open === i ? "translate(2px, 2px)" : "none",
              color: open === i ? "#ffffff" : "#1c3a17",
              fontSize: "13px",
              fontWeight: "800",
              fontFamily: "'Baloo 2', sans-serif",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.12s ease",
            }}
          >
            {item.term}
          </button>
        ))}
      </div>

      {open !== null && (
        <div
          style={{
            marginTop: "14px",
            padding: "18px 20px",
            background: "#ffffff",
            border: "3px solid #1c3a17",
            borderRadius: "14px",
            boxShadow: "5px 5px 0 #1c3a17",
            fontSize: "14px",
            lineHeight: "1.6",
            color: "#4c6b44",
            fontWeight: "600",
            animation: "cp_in 0.25s ease",
          }}
        >
          <style>{`@keyframes cp_in { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div
            style={{
              fontFamily: "'Baloo 2', sans-serif",
              fontSize: "13px",
              letterSpacing: "0.04em",
              color: accent,
              fontWeight: "800",
              marginBottom: "6px",
              textTransform: "uppercase",
            }}
          >
            {items[open].term}
          </div>
          {items[open].def}
        </div>
      )}
    </div>
  );
}