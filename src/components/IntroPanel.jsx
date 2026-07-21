import { useState, useEffect } from "react";

export default function IntroPanel({ children }) {
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    function runBriefing() {
      setPhase("loading");
      return setTimeout(() => setPhase("ready"), 900);
    }
    let timer = runBriefing();

    function onTabActivated(e) {
      if (e.detail.id === "overview") {
        clearTimeout(timer);
        timer = runBriefing();
      }
    }

    document.addEventListener("xt-tab-activated", onTabActivated);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("xt-tab-activated", onTabActivated);
    };
  }, []);

  const loading = phase === "loading";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "18px",
        border: "3px solid #1c3a17",
        boxShadow: "6px 6px 0 #1c3a17",
        margin: "0 0 2.75rem 0",
        background: "#ffffff",
      }}
    >
      <style>{`
        @keyframes ip_scan { 0% { top: 0%; opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes ip_blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 22px",
          background: "#eafff1",
          borderBottom: "3px solid #1c3a17",
          fontFamily: "'Baloo 2', sans-serif",
          fontSize: "12px",
          fontWeight: "800",
          letterSpacing: "0.06em",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3fae5c" }}>
          <span
            style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: "#3fae5c",
              display: "inline-block",
              animation: "ip_blink 1.6s ease-in-out infinite",
            }}
          />
          SIMULATION READY
        </span>
        <span style={{ color: "#7f9c74" }}>INSTRUCTION SET: x86</span>
      </div>

      <div style={{ position: "relative", padding: "2.25rem 2rem" }}>
        <div
          style={{
            filter: loading ? "blur(6px) brightness(0.7)" : "none",
            opacity: loading ? 0.4 : 1,
            transition: "filter 0.5s ease, opacity 0.5s ease",
            textAlign: "left",
            fontFamily: "'Nunito', sans-serif",
            color: "#4c6b44",
            fontWeight: "600",
          }}
        >
          {children}
        </div>

        {loading && (
          <>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                height: "3px",
                background: "#ffd93f",
                boxShadow: "0 0 14px 2px rgba(255,217,63,0.8)",
                animation: "ip_scan 0.9s linear forwards",
                pointerEvents: "none",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                fontFamily: "'Baloo 2', sans-serif",
                fontSize: "13px",
                fontWeight: "800",
                letterSpacing: "0.06em",
                color: "#1c3a17",
                whiteSpace: "nowrap",
              }}
            >
              LOADING BRIEFING...
            </div>
          </>
        )}
      </div>
    </div>
  );
}