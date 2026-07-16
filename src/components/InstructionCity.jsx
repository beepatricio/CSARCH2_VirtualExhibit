import { useState, useRef, useEffect, useCallback } from "react";

const STAGE_COLOR = { fetch: "#eb4b3a", decode: "#3fae5c", execute: "#f2a52c" };
const STAGE_LABEL = { fetch: "FETCH DISTRICT", decode: "DECODE DISTRICT", execute: "EXECUTE DISTRICT" };

const BUILDING_IMAGES = { PC: null, MAR: null, MEM: null, MBR: null, IR: null, DEC: null, ALU: null, AX: null };

const BW = 140, BH = 170;
const BUILDINGS = {
  PC:  { x: 40,   y: 70,  stage: "fetch",   label: "PC" },
  MAR: { x: 230,  y: 110, stage: "fetch",   label: "MAR" },
  MEM: { x: 420,  y: 55,  stage: "fetch",   label: "MEMORY" },
  MBR: { x: 610,  y: 115, stage: "fetch",   label: "MDR" },
  IR:  { x: 860,  y: 70,  stage: "decode",  label: "IR" },
  DEC: { x: 1060, y: 115, stage: "decode",  label: "CONTROL" },
  ALU: { x: 1300, y: 55,  stage: "execute", label: "ALU" },
  AX:  { x: 1480, y: 115, stage: "execute", label: "AX" },
};

const ZONE_WIDTH = 760;
function computeZones() {
  const zones = {};
  for (const stage of ["fetch", "decode", "execute"]) {
    const xs = Object.values(BUILDINGS).filter((b) => b.stage === stage).map((b) => b.x);
    const min = Math.min(...xs), max = Math.max(...xs);
    zones[stage] = { mid: (min + max + BW) / 2 };
  }
  return zones;
}
const STAGE_ZONES = computeZones();

const MICRO_OPS = [
  { stage: "fetch", from: "PC", to: "MAR", set: { MAR: "200" }, text: "The program counter's address moves into the memory address register." },
  { stage: "fetch", from: "MAR", to: "MEM", set: { MEM: "reading…" }, text: "Memory looks up the value stored at the address ALPHA." },
  { stage: "fetch", from: "MEM", to: "MBR", set: { MBR: "value" }, text: "The value read from memory is staged in the memory buffer register." },
  { stage: "fetch", from: "MBR", to: "IR", set: { IR: "MOV AX,[A]" }, text: "The instruction bytes move into the instruction register. Fetch is complete." },
  { stage: "decode", from: "IR", to: "DEC", set: { DEC: "op: MOV" }, text: "The decoder reads the instruction register and isolates the opcode, MOV." },
  { stage: "decode", from: "IR", to: "DEC", set: { DEC: "AX, [A]" }, text: "The decoder identifies the operands: destination AX, source [ALPHA]." },
  { stage: "execute", from: "DEC", to: "ALU", set: {}, text: "The control unit routes the value onto the ALU's data path." },
  { stage: "execute", from: "ALU", to: "AX", set: { AX: "value" }, text: "The value lands in AX. Execute finishes; the cycle restarts from Fetch." },
];

function curvedRoadPath(points) {
  if (points.length < 2) return "";
  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const p0 = points[i - 1], p1 = points[i];
    const midX = (p0.x + p1.x) / 2;
    const bow = (i % 2 === 0 ? 1 : -1) * 26;
    d += ` Q${midX},${(p0.y + p1.y) / 2 + bow} ${p1.x},${p1.y}`;
  }
  return d;
}

const CANVAS_W = 1600, CANVAS_H = 430;
const MIN_SCALE = 0.6, MAX_SCALE = 2.2, AUTO_SCALE = 1.3;
const DEFAULT_CAMERA = { x: 0, y: 0, scale: 1 };
const CONTENT_W = 1480 + BW - 0;

export function DistrictPlate({ index, total = 3, label, color = "#eb4b3a" }) {
  return (
    <div
      style={{
        position: "absolute", top: "-22px", left: "22px", display: "inline-flex",
        alignItems: "center", gap: "10px", fontFamily: "'Baloo 2', sans-serif",
        fontSize: "13px", fontWeight: "800", letterSpacing: "0.04em", color: "#ffffff",
        background: color, border: "3px solid #1c3a17", boxShadow: "3px 3px 0 #1c3a17",
        padding: "8px 20px", borderRadius: "999px", textTransform: "uppercase", transform: "rotate(-2deg)",
      }}
    >
      <span>District {String(index).padStart(2, "0")}/{String(total).padStart(2, "0")}</span>
      {label && <span style={{ opacity: 0.85, fontWeight: "600" }}>· {label}</span>}
    </div>
  );
}

export function IntroPanel({ children }) {
  const [phase, setPhase] = useState("loading");

  useEffect(() => {
    function runBriefing() {
      setPhase("loading");
      const t = setTimeout(() => setPhase("ready"), 900);
      return t;
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
  return (
    <div style={{ position: "relative", overflow: "hidden", borderRadius: "18px", border: "3px solid #1c3a17", boxShadow: "6px 6px 0 #1c3a17", margin: "0 0 2.75rem 0", background: "#ffffff" }}>
      <style>{`
        @keyframes ip_scan { 0% { top: 0%; opacity: 1; } 90% { opacity: 1; } 100% { top: 100%; opacity: 0; } }
        @keyframes ip_blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 22px", background: "#eafff1", borderBottom: "3px solid #1c3a17", fontFamily: "'Baloo 2', sans-serif", fontSize: "12px", fontWeight: "800", letterSpacing: "0.06em" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3fae5c" }}>
          <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#3fae5c", display: "inline-block", animation: "ip_blink 1.6s ease-in-out infinite" }} />
          SIMULATION READY
        </span>
        <span style={{ color: "#7f9c74" }}>INSTRUCTION SET: x86</span>
      </div>
      <div style={{ position: "relative", padding: "2.25rem 2rem" }}>
        <div style={{ filter: phase === "loading" ? "blur(6px) brightness(0.7)" : "none", opacity: phase === "loading" ? 0.4 : 1, transition: "filter 0.5s ease, opacity 0.5s ease", textAlign: "left", fontFamily: "'Nunito', sans-serif", color: "#4c6b44", fontWeight: "600" }}>
          {children}
        </div>
        {phase === "loading" && (
          <>
            <div style={{ position: "absolute", left: 0, right: 0, height: "3px", background: "#ffd93f", boxShadow: "0 0 14px 2px rgba(255,217,63,0.8)", animation: "ip_scan 0.9s linear forwards", pointerEvents: "none" }} />
            <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", fontFamily: "'Baloo 2', sans-serif", fontSize: "13px", fontWeight: "800", letterSpacing: "0.06em", color: "#1c3a17", whiteSpace: "nowrap" }}>
              LOADING BRIEFING...
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Plain placeholder box.. !! swap BUILDING_IMAGES[id] with a png path when ready
function Building({ id, b, image, active, dimmed, value, onClick }) {
  const cx = b.x + BW / 2;

  return (
    <g
      opacity={dimmed ? 0.32 : 1}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onClick(id); }}
      style={{ cursor: "pointer", transition: "opacity 0.35s ease" }}
    >
      <ellipse cx={cx} cy={b.y + BH + 12} rx={BW * 0.42} ry={10} fill="#000" opacity="0.15" />

      {active && (
        <ellipse cx={cx} cy={b.y + BH / 2} rx={BW * 0.9} ry={BH * 0.75} fill="#ffd93f" opacity="0.22">
          <animate attributeName="opacity" values="0.12;0.28;0.12" dur="1.4s" repeatCount="indefinite" />
        </ellipse>
      )}

      {image ? (
        <image href={image} x={b.x} y={b.y} width={BW} height={BH} preserveAspectRatio="xMidYMax meet" />
      ) : (
        <g>
          <rect x={b.x} y={b.y} width={BW} height={BH} fill="#e9e2cf" stroke="#1c3a17" strokeWidth="2" strokeDasharray="7 6" />
          <text x={cx} y={b.y + BH / 2} textAnchor="middle" dominantBaseline="middle" fontFamily="'JetBrains Mono',monospace" fontSize="13" fontWeight="700" fill="#9aa896">
            IMG
          </text>
        </g>
      )}

      <text x={cx} y={b.y + BH + 32} textAnchor="middle" fontFamily="'Baloo 2','Arial Black',sans-serif" fontSize="19" fontWeight="800" fill="#ffffff" stroke="#1c3a17" strokeWidth="4" paintOrder="stroke">
        {b.label}
      </text>
      {value && (
        <g transform={`translate(${cx - 46} ${b.y - 26})`}>
          <rect width="92" height="28" rx="14" fill="#1c3a17" />
          <text x="46" y="19" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="12" fontWeight="700" fill="#ffd93f">{value}</text>
        </g>
      )}
    </g>
  );
}

export default function InstructionCity() {
  const [step, setStep] = useState(-1);
  const [pulsePos, setPulsePos] = useState(null);
  const [values, setValues] = useState({});
  const rafRef = useRef(null);
  const svgRef = useRef(null);
  const wrapRef = useRef(null);

  const [camera, setCamera] = useState(DEFAULT_CAMERA);
  const [dragging, setDragging] = useState(false);
  const [autoMove, setAutoMove] = useState(true);
  const dragStart = useRef(null);

  const activeOp = step >= 0 ? MICRO_OPS[step] : null;

  function computeValues(upTo) {
    const v = {};
    for (let i = 0; i <= upTo; i++) Object.assign(v, MICRO_OPS[i].set);
    return v;
  }

  function clampCamera({ x, y, scale }) {
    const s = Number.isFinite(scale) ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)) : 1;
    const homeX = (CANVAS_W - CONTENT_W * s) / 2;
    const overhang = Math.max(0, (CONTENT_W * s - CANVAS_W) / 2) + 80;
    let nx = Number.isFinite(x) ? x : homeX;
    let ny = Number.isFinite(y) ? y : 0;
    nx = Math.min(homeX + overhang, Math.max(homeX - overhang, nx));
    const maxY = CANVAS_H * 0.32 - CANVAS_H * 0.24 * s - 6;
    ny = Math.min(maxY, Math.max(-30, ny));

    return { x: nx, y: ny, scale: s };
    }

  function moveCameraTo(midX, scale = AUTO_SCALE) {
    setAutoMove(true);
    setCamera(clampCamera({ x: CANVAS_W / 2 - midX * scale, y: 0, scale }));
  }

  function playStep(idx) {
    if (idx < 0 || idx >= MICRO_OPS.length) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setStep(idx);
    setValues(computeValues(idx - 1));
    const op = MICRO_OPS[idx];
    const a = BUILDINGS[op.from], b = BUILDINGS[op.to];
    const start = performance.now(), dur = 550;
    function frame(t) {
      const p = Math.min(1, (t - start) / dur);
      setPulsePos({ x: a.x + BW / 2 + (b.x - a.x) * p, y: a.y + BH / 2 + (b.y - a.y) * p });
      if (p < 1) rafRef.current = requestAnimationFrame(frame);
      else setValues(computeValues(idx));
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  function onBuildingClick(id) {
    const candidates = MICRO_OPS.map((op, i) => ({ op, i })).filter(({ op }) => op.from === id || op.to === id);
    if (candidates.length === 0) return;
    const next = candidates.find(({ i }) => i > step) || candidates[0];
    playStep(next.i);
    moveCameraTo(STAGE_ZONES[BUILDINGS[id].stage].mid);
  }

  function zoomToDistrict(stage) { moveCameraTo(STAGE_ZONES[stage].mid); }

  function zoomBy(delta) {
    setAutoMove(true);
    setCamera((c) => {
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, c.scale + delta));
      const centerWorldX = (CANVAS_W / 2 - c.x) / c.scale;
      const newX = CANVAS_W / 2 - centerWorldX * newScale;
      return clampCamera({ x: newX, y: c.y, scale: newScale });
    });
  }

  function resetSimulation() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setStep(-1);
    setPulsePos(null);
    setValues({});
    setAutoMove(true);
    setCamera(clampCamera(DEFAULT_CAMERA));
  }

  const onMouseDown = (e) => {
    setAutoMove(false);
    setDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY, camX: camera.x, camY: camera.y };
  };

  const onMouseMove = useCallback((e) => {
    if (!dragging || !dragStart.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const ratio = CANVAS_W / rect.width;
    const dx = (e.clientX - dragStart.current.x) * ratio;
    const dy = (e.clientY - dragStart.current.y) * ratio;
    const baseX = dragStart.current.camX;
    const baseY = dragStart.current.camY;

    setCamera((c) =>
        clampCamera({
        x: baseX + dx,
        y: baseY + dy,
        scale: c.scale,
        })
    );
    }, [dragging]);

  const onMouseUp = () => { setDragging(false); dragStart.current = null; };

  useEffect(() => {
    if (!dragging) return;
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("blur", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("blur", onMouseUp);
    };
  }, [dragging, onMouseMove]);

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);

  const roadPoints = Object.values(BUILDINGS).map((b) => ({ x: b.x + BW / 2, y: b.y + BH / 2 }));
  const roadPath = curvedRoadPath(roadPoints);
  const camTransform = `translate(${camera.x}, ${camera.y}) scale(${camera.scale})`;

  return (
    <div style={{ position: "relative" }}>
        <div
        style={{
            position: "absolute",
            top: "-16px",
            left: "50%",
            transform: "translateX(-50%) rotate(-1deg)",
            zIndex: 20,
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "#1c3a17",
            color: "#ffffff",
            fontFamily: "'Baloo 2','Arial Black',sans-serif",
            fontSize: "clamp(11px, 2.4vw, 13px)",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            padding: "7px 18px",
            borderRadius: "999px",
            border: "3px solid #ffd93f",
            boxShadow: "3px 3px 0 rgba(0,0,0,0.25)",
            whiteSpace: "nowrap",
        }}
        >
        <span
            style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: "#3fae5c",
            display: "inline-block",
            animation: "sim_live_blink 1.6s ease-in-out infinite",
            }}
        />
        SIM · LIVE
        </div>
        <style>{`
        @keyframes sim_live_blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        `}</style>

        <div
        id="simulation"
        ref={wrapRef}
        style={{
            width: "100%",
            fontFamily: "'Nunito',sans-serif",
            border: "5px solid #1c3a17",
            borderRadius: "20px",
            boxShadow: "8px 8px 0 #1c3a17",
            overflow: "hidden",
        }}
        >
        <div style={{ textAlign: "center", padding: "34px 20px 10px", background: "linear-gradient(180deg, #bdeeff 0%, #eafff1 100%)" }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "clamp(10px, 2.6vw, 12px)", fontWeight: 700, letterSpacing: "0.15em", color: "#4c6b44", textTransform: "uppercase" }}>Now tracing</div>
            <div style={{ fontFamily: "'Baloo 2','Arial Black',sans-serif", fontSize: "clamp(20px, 6vw, 34px)", marginTop: 2, color: "#1c3a17", fontWeight: 800, textTransform: "uppercase", lineHeight: 1.1 }}>MOV AX, [ALPHA]</div>

            <style>{`
            .xt-district-btn {
                transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
            }
            .xt-district-btn:hover {
                transform: translateY(-3px);
                box-shadow: 5px 6px 0 #1c3a17;
            }
            .xt-district-btn:active {
                transform: translateY(0);
                box-shadow: 1px 1px 0 #1c3a17;
            }
            `}</style>
            <div style={{ display: "flex", justifyContent: "center", gap: "clamp(6px, 1.5vw, 10px)", marginTop: 14, flexWrap: "wrap" }}>
            {["fetch", "decode", "execute"].map((stage) => (
                <button
                key={stage}
                onClick={() => zoomToDistrict(stage)}
                className="xt-district-btn"
                style={{
                    fontFamily: "'Baloo 2','Arial Black',sans-serif",
                    fontSize: "clamp(9px, 1.8vw, 12px)",
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    padding: "clamp(6px, 1.6vw, 9px) clamp(10px, 3vw, 16px)",
                    borderRadius: 999,
                    cursor: "pointer",
                    border: "3px solid #1c3a17",
                    background: "#ffffff",
                    color: "#1c3a17",
                    boxShadow: "3px 3px 0 #1c3a17",
                    whiteSpace: "nowrap",
                }}
                >
                {STAGE_LABEL[stage]}
                </button>
            ))}
            </div>
        </div>

        <div style={{ position: "relative", width: "100%" }}>
            <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            width="100%"
            onMouseDown={onMouseDown}
            style={{
                display: "block",
                width: "100%",
                aspectRatio: `${CANVAS_W} / ${CANVAS_H}`,
                maxHeight: "62vh",
                cursor: dragging ? "grabbing" : "grab",
                touchAction: "none",
            }}
            >
            <defs>
                <linearGradient id="ic-sky" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#bdeeff" />
                <stop offset="100%" stopColor="#eafff1" />
                </linearGradient>
                <linearGradient id="ic-ground" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8fd670" />
                <stop offset="100%" stopColor="#5cb03c" />
                </linearGradient>
                <radialGradient id="ic-vignette" cx="50%" cy="50%" r="75%">
                <stop offset="60%" stopColor="#000000" stopOpacity="0" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.18" />
                </radialGradient>
            </defs>

            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H * 0.32} fill="url(#ic-sky)" />
            <g opacity="0.7" fill="#ffffff">
                <ellipse cx="220" cy="60" rx="60" ry="18" />
                <ellipse cx="270" cy="52" rx="40" ry="14" />
                <ellipse cx="980" cy="45" rx="70" ry="20" />
                <ellipse cx="1040" cy="55" rx="42" ry="15" />
                <ellipse cx="1380" cy="70" rx="55" ry="16" />
            </g>

            <g style={{ transition: autoMove ? "transform 0.9s cubic-bezier(.65,0,.2,1)" : "none" }} transform={camTransform}>
                <rect x={-CANVAS_W * 2} y={CANVAS_H * 0.24} width={CANVAS_W * 5} height={CANVAS_H} fill="url(#ic-ground)" />

                {activeOp && (
                <rect
                    x={STAGE_ZONES[activeOp.stage].mid - ZONE_WIDTH / 2}
                    y={CANVAS_H * 0.24}
                    width={ZONE_WIDTH}
                    height={CANVAS_H}
                    fill={STAGE_COLOR[activeOp.stage]}
                    opacity="0.09"
                    rx="30"
                />
                )}

                <path d={roadPath} stroke="#6b6259" strokeWidth="20" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                <path d={roadPath} stroke="#eb4b3a" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="4 18" />

                {Object.entries(BUILDINGS).map(([id, b]) => (
                <Building key={id} id={id} b={b} image={BUILDING_IMAGES[id]} active={activeOp && (activeOp.from === id || activeOp.to === id)} dimmed={activeOp && b.stage !== activeOp.stage} value={values[id]} onClick={onBuildingClick} />
                ))}
                {pulsePos && (
                <circle cx={pulsePos.x} cy={pulsePos.y} r="12" fill="#ffd93f" stroke="#1c3a17" strokeWidth="3" />
                )}
            </g>

            <rect x="0" y="0" width={CANVAS_W} height={CANVAS_H} fill="url(#ic-vignette)" pointerEvents="none" />

            <g>
                <rect x="0" y={CANVAS_H - 46} width={CANVAS_W} height="46" fill="#1c3a17" opacity="0.55" />
                <text
                x={CANVAS_W / 2}
                y={CANVAS_H - 18}
                textAnchor="middle"
                fontFamily="'Nunito',sans-serif"
                fontWeight="700"
                fontSize="15"
                fill="#ffffff"
                >
                {activeOp ? activeOp.text : "Click a building to begin. Drag to pan, use +/− to zoom."}
                </text>
            </g>
            </svg>

            <div style={{ position: "absolute", bottom: 62, right: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={resetSimulation} title="Reset to full map" style={zoomBtnStyle}>⟲</button>
            <div style={{ height: 4 }} />
            <button onClick={() => zoomBy(0.2)} style={zoomBtnStyle}>+</button>
            <button onClick={() => zoomBy(-0.2)} style={zoomBtnStyle}>−</button>
            </div>
        </div>
        </div>
    </div>
    );
}

const zoomBtnStyle = {
  width: 36,
  height: 36,
  fontFamily: "'Baloo 2','Arial Black',sans-serif",
  fontSize: 18,
  fontWeight: 800,
  borderRadius: 10,
  border: "3px solid #1c3a17",
  boxShadow: "2px 2px 0 #1c3a17",
  background: "#ffffff",
  color: "#1c3a17",
  cursor: "pointer",
  lineHeight: 1,
};