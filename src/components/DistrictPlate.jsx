// DistrictPlate.jsx
// Small rotated badge used at the top-left of each .district-panel
// (e.g. "District 01/03 · Fetch"). Pure presentational, no state.

const plateStyle = {
  position: "absolute",
  top: "-22px",
  left: "22px",
  display: "inline-flex",
  alignItems: "center",
  gap: "10px",
  fontFamily: "'Baloo 2', sans-serif",
  fontSize: "13px",
  fontWeight: "800",
  letterSpacing: "0.04em",
  color: "#ffffff",
  border: "3px solid #1c3a17",
  boxShadow: "3px 3px 0 #1c3a17",
  padding: "8px 20px",
  borderRadius: "999px",
  textTransform: "uppercase",
  transform: "rotate(-2deg)",
};

export default function DistrictPlate({ index, total = 3, label, color = "#eb4b3a" }) {
  return (
    <div style={{ ...plateStyle, background: color }}>
      <span>District {String(index).padStart(2, "0")}/{String(total).padStart(2, "0")}</span>
      {label && <span style={{ opacity: 0.85, fontWeight: "600" }}>· {label}</span>}
    </div>
  );
}