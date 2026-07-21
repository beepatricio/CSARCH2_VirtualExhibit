import { useState, useRef, useEffect, useLayoutEffect } from "react";
import pcGraphic from "../assets/PCGraphic.png";
import marGraphic from "../assets/MARGraphic.png";
import memGraphic from "../assets/MemoGraphic.png";
import mbrGraphic from "../assets/MBRGraphic.png";
import irGraphic from "../assets/IRGraphic.png";
import decGraphic from "../assets/ControlGraphic.png";
import aluGraphic from "../assets/ALUGraphic.png";
import axGraphic from "../assets/AXGraphic.png";

const STAGE_COLOR = { fetch: "#eb4b3a", decode: "#3fae5c", execute: "#f2a52c" };
const STAGE_LABEL = { fetch: "FETCH DISTRICT", decode: "DECODE DISTRICT", execute: "EXECUTE DISTRICT" };
const BUILDING_IMAGES = {
  PC: pcGraphic,
  MAR: marGraphic,
  MEM: memGraphic,
  MBR: mbrGraphic,
  IR: irGraphic,
  DEC: decGraphic,
  ALU: aluGraphic,
  AX: axGraphic,
};

const BW = 300, BH = 355;
const BASE_FACTOR = 0.8;

const BUILDINGS = {
  PC:  { x: 20,   y: 150, stage: "fetch",   label: "PC" },
  MAR: { x: 250,  y: 230, stage: "fetch",   label: "MAR" },
  MEM: { x: 480,  y: 100, stage: "fetch",   label: "MEMORY" },
  MBR: { x: 710,  y: 240, stage: "fetch",   label: "MBR" },
  IR:  { x: 1040, y: 150, stage: "decode",  label: "IR" },
  DEC: { x: 1270, y: 240, stage: "decode",  label: "CONTROL" },
  ALU: { x: 1600, y: 100, stage: "execute", label: "ALU" },
  AX:  { x: 1830, y: 240, stage: "execute", label: "AX" },
};

const ZONE_WIDTH = 1050;
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

// greedy word-wrap
function wrapText(text, maxChars, maxLines = 3) {
  const words = text.split(" ");
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    } else {
      current = candidate;
    }
  }
  if (lines.length < maxLines && current) lines.push(current);
  if (lines.length === maxLines) {
    const consumedWords = lines.join(" ").split(" ").length;
    if (consumedWords < words.length) {
      const last = lines[lines.length - 1];
      lines[lines.length - 1] = last.length > 3 ? last.slice(0, -1).replace(/\W+$/, "") + "…" : last + "…";
    }
  }
  return lines;
}

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

const CANVAS_W = 2170, CANVAS_H = 720;
const MIN_SCALE = 0.6, MAX_SCALE = 2.2, AUTO_SCALE = 1.15, MOBILE_AUTO_SCALE = 0.6;
const DEFAULT_CAMERA = { x: 0, y: 0, scale: 1 };

// content span
const CONTENT_LEFT = 20;              // PC's left edge
const CONTENT_RIGHT = 1830 + BW;      // AX's right edge
const CONTENT_W = CONTENT_RIGHT - CONTENT_LEFT;
const CONTENT_MID = (CONTENT_LEFT + CONTENT_RIGHT) / 2;

// Shared style objects
const districtBtnStyle = {
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
};

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

const liveDotStyle = {
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: "#3fae5c",
  display: "inline-block",
  animation: "sim_live_blink 1.6s ease-in-out infinite",
};

// Plain placeholder box
function Building({ id, b, image, active, dimmed, value, onClick }) {
  const cx = b.x + BW / 2;
  const clipId = `bclip-${id}`;
  const baseY = b.y + BH * BASE_FACTOR; // visual ground line under the art

  return (
    <g
      opacity={dimmed ? 0.32 : 1}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); onClick(id); }}
      style={{ cursor: "pointer", transition: "opacity 0.35s ease" }}
    >
      {/* Shadow sized to the building footprint, sitting flush against its base */}
      <ellipse cx={cx} cy={baseY + 4} rx={BW * 0.44} ry={BH * 0.045} fill="#000" opacity="0.22" />

      {active && (
        <ellipse cx={cx} cy={b.y + BH / 2} rx={BW * 0.9} ry={BH * 0.75} fill="#ffd93f" opacity="0.22">
          <animate attributeName="opacity" values="0.12;0.28;0.12" dur="1.4s" repeatCount="indefinite" />
        </ellipse>
      )}

      {image ? (
        <>
          <defs>
            <clipPath id={clipId}>
              <rect x={b.x} y={b.y} width={BW} height={BH} />
            </clipPath>
          </defs>
          <g clipPath={`url(#${clipId})`}>
            <image href={image.src || image} x={b.x} y={b.y} width={BW} height={BH} preserveAspectRatio="xMidYMax slice" />
          </g>
        </>
      ) : (
        <g>
          <rect x={b.x} y={b.y} width={BW} height={BH} fill="#e9e2cf" stroke="#1c3a17" strokeWidth="2" strokeDasharray="7 6" />
          <text x={cx} y={b.y + BH / 2} textAnchor="middle" dominantBaseline="middle" fontFamily="'JetBrains Mono',monospace" fontSize="13" fontWeight="700" fill="#9aa896">
            IMG
          </text>
        </g>
      )}

      <text x={cx} y={baseY + 34} textAnchor="middle" fontFamily="'Baloo 2','Arial Black',sans-serif" fontSize="24" fontWeight="800" fill="#ffffff" stroke="#1c3a17" strokeWidth="4" paintOrder="stroke">
        {b.label}
      </text>
      {value && (
        <g transform={`translate(${cx - 68} ${b.y + BH * 0.28 - 38})`}>
          <rect width="136" height="40" rx="20" fill="#1c3a17" />
          <text x="68" y="26" textAnchor="middle" fontFamily="'JetBrains Mono',monospace" fontSize="17" fontWeight="700" fill="#ffd93f">{value}</text>
        </g>
      )}
    </g>
  );
}

export default function InstructionCity() {
  const [activeDistrict, setActiveDistrict] = useState("fetch");
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
  const [isMobile, setIsMobile] = useState(false);
  useLayoutEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener ? mq.addEventListener("change", update) : mq.addListener(update);
    return () => {
      mq.removeEventListener ? mq.removeEventListener("change", update) : mq.removeListener(update);
    };
  }, []);

  const visibleVBWidthRef = useRef(CANVAS_W);
  const [visW, setVisW] = useState(CANVAS_W);
  useLayoutEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const measure = () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const scaleW = rect.width / CANVAS_W;
      const scaleH = rect.height / CANVAS_H;
      const effScale = isMobile ? Math.max(scaleW, scaleH) : Math.min(scaleW, scaleH);
      const w = rect.width / effScale;
      visibleVBWidthRef.current = w;
      setVisW(w);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile]);

  const activeOp = step >= 0 ? MICRO_OPS[step] : null;

  function computeValues(upTo) {
    const v = {};
    for (let i = 0; i <= upTo; i++) Object.assign(v, MICRO_OPS[i].set);
    return v;
  }

  function clampCamera({ x, y, scale }) {
    const s = Number.isFinite(scale) ? Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale)) : 1;
    const visW = visibleVBWidthRef.current || CANVAS_W;
    const homeX = CANVAS_W / 2 - CONTENT_MID * s;
    const overhang = Math.max(0, (CONTENT_W * s - visW) / 2) + 80;
    let nx = Number.isFinite(x) ? x : homeX;
    let ny = Number.isFinite(y) ? y : 0;
    nx = Math.min(homeX + overhang, Math.max(homeX - overhang, nx));
    const maxY = CANVAS_H * 0.32 - CANVAS_H * 0.24 * s - 6;
    ny = Math.min(maxY, Math.max(-30, ny));

    return { x: nx, y: ny, scale: s };
  }

  function moveCameraTo(midX, scale) {
    const targetScale = scale != null ? scale : (isMobile ? MOBILE_AUTO_SCALE : AUTO_SCALE);
    setAutoMove(true);
    setCamera(clampCamera({ x: CANVAS_W / 2 - midX * targetScale, y: 0, scale: targetScale }));
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
    setActiveDistrict(BUILDINGS[id].stage);
  }

  function zoomToDistrict(stage) {
    moveCameraTo(STAGE_ZONES[stage].mid);
    setActiveDistrict(stage);
  }

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
    setActiveDistrict("fetch");
  }

  const startDragAt = (clientX, clientY) => {
    setAutoMove(false);
    setDragging(true);
    dragStart.current = { x: clientX, y: clientY, camX: camera.x, camY: camera.y };
  };

  const moveDragTo = (clientX, clientY) => {
    if (!dragStart.current || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const start = dragStart.current;
    const ratio = (visibleVBWidthRef.current || CANVAS_W) / rect.width;
    const dx = (clientX - start.x) * ratio;
    const dy = (clientY - start.y) * ratio;

    setCamera((c) =>
      clampCamera({
        x: start.camX + dx,
        y: start.camY + dy,
        scale: c.scale,
      })
    );
  };

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startDragAt(e.clientX, e.clientY);
    if (e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    }
  };

  const onPointerMove = (e) => {
    if (!dragging) return;
    moveDragTo(e.clientX, e.clientY);
  };

  const endDrag = (e) => {
    setDragging(false);
    dragStart.current = null;
    if (e && e.currentTarget && e.currentTarget.releasePointerCapture && e.pointerId != null) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    }
  };

  useEffect(() => () => rafRef.current && cancelAnimationFrame(rafRef.current), []);
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const onTouchStart = (e) => {
      if (e.touches.length !== 1) return;
      e.preventDefault();
      const t = e.touches[0];
      startDragAt(t.clientX, t.clientY);
    };
    const onTouchMove = (e) => {
      if (!dragStart.current || e.touches.length !== 1) return;
      e.preventDefault();
      const t = e.touches[0];
      moveDragTo(t.clientX, t.clientY);
    };
    const onTouchEnd = () => {
      setDragging(false);
      dragStart.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [camera.x, camera.y]);

  // Failsafe
  useEffect(() => {
    if (!dragging) return;

    const prevUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    const forceEnd = () => {
      setDragging(false);
      dragStart.current = null;
    };

    const events = ["pointerup", "pointercancel", "mouseup", "touchend", "blur"];
    events.forEach((evt) => window.addEventListener(evt, forceEnd));
    document.addEventListener("selectionchange", forceEnd);

    return () => {
      document.body.style.userSelect = prevUserSelect;
      events.forEach((evt) => window.removeEventListener(evt, forceEnd));
      document.removeEventListener("selectionchange", forceEnd);
    };
  }, [dragging]);

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
        <span style={liveDotStyle} />
        SIM · LIVE
      </div>
      <style>{`
        @keyframes sim_live_blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        .xt-district-btn { transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease; }
        .xt-district-btn:hover:not(.active-light) { transform: translateY(-3px); box-shadow: 5px 6px 0 #1c3a17; }
        .xt-district-btn:active:not(.active-light) { transform: translateY(0); box-shadow: 1px 1px 0 #1c3a17; }
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
        <div style={{ textAlign: "center", padding: "clamp(18px, 4vw, 34px) 20px clamp(12px, 2.5vw, 18px)", background: "#bdeeff" }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "clamp(10px, 2.6vw, 12px)", fontWeight: 700, letterSpacing: "0.15em", color: "#4c6b44", textTransform: "uppercase" }}>Now tracing</div>
          <div style={{ fontFamily: "'Baloo 2','Arial Black',sans-serif", fontSize: "clamp(20px, 6vw, 34px)", marginTop: 2, color: "#1c3a17", fontWeight: 800, textTransform: "uppercase", lineHeight: 1.1 }}>MOV AX, [ALPHA]</div>

          <div style={{ display: "flex", justifyContent: "center", gap: "clamp(6px, 1.5vw, 10px)", marginTop: "clamp(10px, 2.5vw, 14px)", flexWrap: "wrap" }}>
            {["fetch", "decode", "execute"].map((stage) => {
              const isActive = activeDistrict === stage;
              return (
                <button
                  key={stage}
                  onClick={() => zoomToDistrict(stage)}
                  className={`xt-district-btn ${isActive ? "active-light" : ""}`}
                  style={{
                    ...districtBtnStyle,
                    ...(isActive
                      ? {
                          background: "#ffd93f",
                          boxShadow: "0 0 15px 4px rgba(255, 217, 63, 0.6), 3px 3px 0 #1c3a17",
                          transform: "scale(1.05)",
                        }
                      : {}),
                  }}
                >
                  {STAGE_LABEL[stage]}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ position: "relative", width: "100%" }}>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
            preserveAspectRatio={isMobile ? "xMidYMid slice" : "xMidYMid meet"}
            width="100%"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onPointerLeave={(e) => { if (dragging && e.buttons === 0) endDrag(e); }}
            style={{
              display: "block",
              width: "100%",
              aspectRatio: isMobile ? "3 / 4.4" : `${CANVAS_W} / ${CANVAS_H}`,
              maxHeight: isMobile ? "82vh" : "72vh",
              cursor: dragging ? "grabbing" : "grab",
              touchAction: "none",
              userSelect: "none",
              WebkitUserSelect: "none",
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
              <ellipse cx="335" cy="85" rx="85" ry="24" />
              <ellipse cx="410" cy="74" rx="56" ry="19" />
              <ellipse cx="1490" cy="62" rx="98" ry="27" />
              <ellipse cx="1580" cy="76" rx="58" ry="20" />
              <ellipse cx="2100" cy="98" rx="78" ry="22" />
            </g>

            <g style={{ transition: autoMove ? "transform 0.9s cubic-bezier(.65,0,.2,1)" : "none" }} transform={camTransform}>
              <rect x={-CANVAS_W * 2} y={CANVAS_H * 0.24} width={CANVAS_W * 5} height={CANVAS_H * 6} fill="url(#ic-ground)" />

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

            {(() => {
              const captionText = activeOp ? activeOp.text : "Click a building to begin. Drag to pan, use +/− to zoom.";
              const fontSize = 21;
              const sidePadding = 28;
              const maxChars = Math.max(18, Math.floor((visW - sidePadding * 2) / (fontSize * 0.56)));
              const lines = wrapText(captionText, maxChars, 3);
              const lineHeight = 27;
              const barPadding = 12;
              const barHeight = barPadding * 2 + lines.length * lineHeight;
              const barY = CANVAS_H - barHeight;
              const firstLineY = barY + barPadding + lineHeight * 0.72;

              return (
                <g>
                  <rect x="0" y={barY} width={CANVAS_W} height={barHeight} fill="#1c3a17" opacity="0.55" />
                  <text x={CANVAS_W / 2} y={firstLineY} textAnchor="middle" fontFamily="'Nunito',sans-serif" fontWeight="700" fontSize={fontSize} fill="#ffffff">
                    {lines.map((line, i) => (
                      <tspan key={i} x={CANVAS_W / 2} dy={i === 0 ? 0 : lineHeight}>{line}</tspan>
                    ))}
                  </text>
                </g>
              );
            })()}
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