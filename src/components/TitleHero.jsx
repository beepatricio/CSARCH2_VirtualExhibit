import React, { useEffect, useRef } from "react";
import backgroundTrees from "../assets/BackgroundTrees.png";
import foregroundTrees from "../assets/ForegroundTrees.png";
import grass from "../assets/Grass.png";
import sky from "../assets/Sky.png";

function scrollToId(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// 5x7 bitmap font for letters used
const FONT = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  E: ["11111", "10000", "11110", "10000", "10000", "10000", "11111"],
  F: ["11111", "10000", "11110", "10000", "10000", "10000", "10000"],
  I: ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
  J: ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
  N: ["10001", "11001", "10101", "10101", "10011", "10001", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
};
const glyphsOf = (str) => str.split("").map((ch) => FONT[ch] || FONT[" "]);

// star silhouette
const STAR = [
  "....#....",
  "...###...",
  "...###...",
  "#########",
  ".#######.",
  "..#####..",
  ".##.#.##.",
  "##.....##",
  "#.......#",
];

const HERO_COLORS = ["#7a2a12", "#e8792a", "#ffdd55"]; // back -> front
const OUTLINE = "#1c3a17";
const SUBTEXT_COLOR = "#a8431f";
const TITLE = "JOURNEY OF AN INSTRUCTION";
const SUBTITLE = "MICROPROGRAMMING INSIDE THE CPU";

function ParallaxStrip({ src, heightPercent, bottomPercent, pxPerSecond }) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const firstImgRef = useRef(null);
  const [tileWidth, setTileWidth] = React.useState(0);
  const [tileCount, setTileCount] = React.useState(2);

  useEffect(() => {
    function measure() {
      const img = firstImgRef.current;
      const container = containerRef.current;
      if (!img || !container || !img.naturalWidth) return;
      const w = img.clientHeight * (img.naturalWidth / img.naturalHeight);
      if (w > 0) {
        setTileWidth(w);
        setTileCount(Math.ceil((container.clientWidth * 2) / w) + 2);
      }
    }
    const img = firstImgRef.current;
    if (img && img.complete) measure();
    if (img) img.addEventListener("load", measure);
    window.addEventListener("resize", measure);
    return () => {
      if (img) img.removeEventListener("load", measure);
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!tileWidth) return;
    let raf, last = performance.now(), offset = 0;
    function step(now) {
      offset -= pxPerSecond * ((now - last) / 1000);
      last = now;
      if (offset <= -tileWidth) offset += tileWidth;
      if (trackRef.current) trackRef.current.style.transform = `translateX(${offset}px)`;
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [tileWidth, pxPerSecond]);

  return (
    <div ref={containerRef} style={{ position: "absolute", left: 0, bottom: `${bottomPercent}%`, width: "100%", height: `${heightPercent}%`, overflow: "hidden" }}>
      <div ref={trackRef} style={{ display: "flex", height: "100%", willChange: "transform" }}>
        {Array.from({ length: tileCount }).map((_, i) => (
          <img key={i} ref={i === 0 ? firstImgRef : null} src={src} alt="" style={{ height: "100%", width: "auto", flex: "0 0 auto", display: "block" }} />
        ))}
      </div>
    </div>
  );
}

export default function TitleHero() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    const titleGlyphs = glyphsOf(TITLE);

    function drawStar(cx, cy, size, t, phase) {
      const twinkle = 0.7 + 0.3 * Math.sin(t / 700 + phase);
      const s = (size / 9) * (0.92 + 0.08 * twinkle);
      const bob = Math.sin(t / 650 + phase) * 3;
      ctx.save();
      ctx.globalAlpha = 0.85 + 0.15 * twinkle;
      // outline pass
      ctx.fillStyle = OUTLINE;
      for (let r = 0; r < STAR.length; r++)
        for (let c = 0; c < 9; c++)
          if (STAR[r][c] === "#")
            ctx.fillRect(cx + (c - 4.5) * s - 1, cy + (r - 4.5) * s - bob - 1, s + 2, s + 2);
      // two-tone fill (brighter top-left, deeper gold bottom-right) + glint
      for (let r = 0; r < STAR.length; r++) {
        for (let c = 0; c < 9; c++) {
          if (STAR[r][c] !== "#") continue;
          const px = cx + (c - 4.5) * s, py = cy + (r - 4.5) * s - bob;
          ctx.fillStyle = c + r < 8 ? "#ffe066" : "#e8952a";
          ctx.fillRect(px, py, s, s);
          if (twinkle > 0.92 && Math.random() < 0.15) {
            ctx.save();
            ctx.shadowColor = "#ffffff";
            ctx.shadowBlur = 5;
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(px + s * 0.25, py + s * 0.25, s * 0.5, s * 0.5);
            ctx.restore();
          }
        }
      }
      ctx.restore();
    }

    function drawTitle(glyphs, cx, cy, scale, depth, popProgress, idleTime) {
      const glyphW = 5, glyphH = 7, spacing = 1;
      const totalW = glyphs.length * (glyphW + spacing) * scale;
      const startX = cx - totalW / 2;
      const bob = idleTime !== null ? Math.sin(idleTime / 500) * 2 : 0;
      const pulse = idleTime !== null ? Math.sin(idleTime / 900) * 0.5 + 0.5 : 0;

      // outline silhouette
      for (let gi = 0; gi < glyphs.length; gi++) {
        const glyph = glyphs[gi];
        const gx = startX + gi * (glyphW + spacing) * scale;
        const appear = idleTime !== null ? 1 : Math.min(1, Math.max(0, (popProgress - gi * 3) / 10));
        if (appear <= 0) continue;
        const ease = 1 - Math.pow(1 - appear, 3);
        const bounce = idleTime !== null ? bob : Math.sin(ease * Math.PI) * 5 * (1 - ease);
        ctx.fillStyle = OUTLINE;
        for (let row = 0; row < glyphH; row++)
          for (let col = 0; col < glyphW; col++)
            if (glyph[row][col] === "1")
              ctx.fillRect(gx + col * scale + depth * 2 - 1.5, cy + row * scale - bounce + depth * 2 - 1.5, scale + 2, scale + 2);
      }
      // shadow and shimmer
      for (let gi = 0; gi < glyphs.length; gi++) {
        const glyph = glyphs[gi];
        const gx = startX + gi * (glyphW + spacing) * scale;
        const appear = idleTime !== null ? 1 : Math.min(1, Math.max(0, (popProgress - gi * 3) / 10));
        if (appear <= 0) continue;
        const ease = 1 - Math.pow(1 - appear, 3);
        const bounce = idleTime !== null ? bob : Math.sin(ease * Math.PI) * 5 * (1 - ease);
        for (let row = 0; row < glyphH; row++) {
          for (let col = 0; col < glyphW; col++) {
            if (glyph[row][col] !== "1") continue;
            const px = gx + col * scale, py = cy + row * scale - bounce;
            for (let d = depth; d >= 0; d--) {
              ctx.fillStyle = HERO_COLORS[HERO_COLORS.length - 1 - Math.min(d, HERO_COLORS.length - 1)];
              ctx.fillRect(px + d * 2, py + d * 2, scale - 1, scale - 1);
            }
            if (idleTime !== null && pulse > 0.75 && Math.random() < 0.06) {
              const gsz = 2 + Math.random() * 2;
              ctx.save();
              ctx.shadowColor = "#ffffff";
              ctx.shadowBlur = 4;
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(px + Math.random() * (scale - gsz), py + Math.random() * (scale - gsz), gsz, gsz);
              ctx.restore();
            }
          }
        }
      }
    }

    function drawSubtitle(cy, popProgress) {
      const appear = Math.min(1, Math.max(0, popProgress / 12));
      if (appear <= 0) return;
      ctx.save();
      ctx.globalAlpha = appear;
      ctx.translate(0, (1 - (1 - Math.pow(1 - appear, 3))) * 8);
      ctx.font = "800 20px 'Baloo 2', system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = SUBTEXT_COLOR;
      ctx.fillText(SUBTITLE, W / 2, cy);
      ctx.restore();
    }

    let raf, t0 = performance.now();
    function loop(now) {
      const elapsed = now - t0;
      ctx.clearRect(0, 0, W, H);

      const introDone = elapsed > 900;
      const idleTime = introDone ? elapsed - 900 : null;
      const popProgress = elapsed / 16;

      const scale = 5;
      const starsCy = H / 2 - 145;
      const titleCy = H / 2 - 95;
      const subCy = H / 2 - 15;

      // stars twinkle and stagger
      const starCount = 5, starGap = 70, starX0 = W / 2 - (starGap * (starCount - 1)) / 2;
      for (let i = 0; i < starCount; i++) {
        const starPop = Math.min(1, Math.max(0, (popProgress - i * 2) / 8));
        if (starPop <= 0) continue;
        ctx.save();
        ctx.globalAlpha = starPop;
        drawStar(starX0 + i * starGap, starsCy, 34, idleTime ?? elapsed, i * 1.1);
        ctx.restore();
      }

      drawTitle(titleGlyphs, W / 2, titleCy, scale, 4, popProgress - 10, idleTime);
      drawSubtitle(subCy, popProgress - 34);

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={styles.stage}>
      <img src={sky.src} style={styles.skyImg} alt="" />
      <ParallaxStrip src={backgroundTrees.src} heightPercent={70} bottomPercent={20} pxPerSecond={18} />
      <ParallaxStrip src={foregroundTrees.src} heightPercent={75} bottomPercent={20} pxPerSecond={45} />
      <img src={grass.src} style={styles.grassImg} alt="" />
      <div style={styles.canvasBox}>
        <canvas ref={canvasRef} width={900} height={500} style={styles.canvas} />
      </div>
      <div className="xt-hero-cta">
        <button type="button" className="xt-btn-start" onClick={() => scrollToId("overview")}>
          <span className="xt-btn-start__glyph">▶</span>
          <span>Start</span>
        </button>
        <button type="button" className="xt-btn-tiy" onClick={() => scrollToId("try-it-yourself")}>
          Try It Yourself
        </button>
      </div>
    </div>
  );
}

const styles = {
  stage: {
    position: "relative",
    width: "100%",
    aspectRatio: "1.92 / 1",
    minHeight: "300px",
    maxHeight: "100svh",
    overflow: "hidden",
    background: "transparent",
  },
  skyImg: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", pointerEvents: "none", zIndex: 0 },
  grassImg: { position: "absolute", bottom: 0, left: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "bottom", pointerEvents: "none" },
  canvasBox: { position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" },
  canvas: { display: "block", width: "100%", height: "auto", imageRendering: "pixelated" },
};