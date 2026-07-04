import { useEffect } from "react";

export default function ExecuteStage({ instruction, onComplete }) {
  useEffect(() => {
    // Missing execution engine logic: automatically forwards back to manager
    onComplete();
  }, [instruction]);

  return (
    <div style={{ fontFamily: "monospace", color: "#a8a29e", textAlign: "center", padding: "1rem" }}>
      [ROUTING SIGNAL THROUGH EXECUTE SUBSYSTEM...]
    </div>
  );
}