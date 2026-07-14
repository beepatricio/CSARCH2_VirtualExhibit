// StageStamp.jsx
// Renders as a literal manila-folder tab (trapezoid), meant to sit at the
// top-left of a `.folder` wrapper (see case-theme.css) so each stage reads
// as its own hanging case file. Pass `color` to match the stage's accent.
export default function StageStamp({ index, total = 3, label, color = "#ef4444" }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "-16px",
        left: "18px",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        fontFamily: "monospace",
        fontSize: "10px",
        fontWeight: "bold",
        letterSpacing: "0.12em",
        color: "#0c0a09",
        background: color,
        padding: "6px 20px",
        textTransform: "uppercase",
        clipPath: "polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)",
        boxShadow: `0 4px 10px ${color}40`,
      }}
    >
      <span>
        FILE {String(index).padStart(2, "0")}/{String(total).padStart(2, "0")}
      </span>
      {label && <span style={{ opacity: 0.75, fontWeight: "normal" }}>· {label}</span>}
    </div>
  );
}
