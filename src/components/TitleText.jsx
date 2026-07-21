// TitleText.jsx
import React, { useEffect, useRef } from "react";

// 5x7 bitmap font — only the letters needed for "JOURNEY OF AN INSTRUCTION"
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

function buildGlyphs(str) {
  return str.split("").map((ch) => FONT[ch] || FONT[" "]);
}

function hueShift(hex, deg) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;
  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  h = (h + deg / 360) % 1;
  function hue2rgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }
  let r2, g2, b2;
  if (s === 0) {
    r2 = g2 = b2 = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r2 = hue2rgb(p, q, h + 1 / 3);
    g2 = hue2rgb(p, q, h);
    b2 = hue2rgb(p, q, h - 1 / 3);
  }
  const toHex = (v) => Math.round(v * 255).toString(16).padStart(2, "0");
  return "#" + toHex(r2) + toHex(g2) + toHex(b2);
}

const HERO_COLORS = ["#7a2a12", "#e8792a", "#ffdd55"]; // back to front: dark ember -> orange -> bright yellow-gold front face
const OUTLINE_COLOR = "#1c3a17"; // matches --xt-fg / --xt-line so it reads as "ink" not just a generic black stroke

function buildGlyphs2(str) {
  return buildGlyphs(str);
}

export default function TitleText() {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const W = canvas.width,
      H = canvas.height;

    const linesHero = [buildGlyphs2("JOURNEY"), buildGlyphs2("INSTRUCTION")];
    const midText = "of an";

    let particles = [];
    function spawnParticles(x, y, color, count = 3, spread = { vx: 4, vyMin: 1, vyMax: 3 }) {
      for (let i = 0; i < count; i++) {
        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * spread.vx,
          vy: -Math.random() * spread.vyMax - spread.vyMin,
          life: 30 + Math.random() * 20,
          color,
          size: 3,
        });
      }
    }

    // ground-level dust puff for the landing impact — low, wide, dusty, short-lived
    function spawnDust(cx, y) {
      for (let i = 0; i < 14; i++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * 120,
          y: y + (Math.random() - 0.5) * 6,
          vx: (Math.random() - 0.5) * 3.5,
          vy: -Math.random() * 1.4 - 0.2,
          life: 18 + Math.random() * 14,
          color: "rgba(240, 230, 210, 0.8)",
          size: 2 + Math.random() * 3,
          fade: true,
        });
      }
    }

    // screen-shake state, triggered once per word landing
    let shake = { t: 0, dur: 0, mag: 0 };
    function triggerShake(mag = 6, dur = 220) {
      shake = { t: 0, dur, mag };
    }

    function drawHeroWord(glyphs, cx, cy, scale, depthOffset, popProgress, idleTime, wordIndex, landedRef) {
      const glyphW = 5,
        glyphH = 7,
        spacing = 1;
      const totalW = glyphs.length * (glyphW + spacing) * scale;
      const startX = cx - totalW / 2;

      const bob = idleTime !== null ? Math.sin(idleTime / 500 + wordIndex * 1.2) * 3 : 0;
      const hueDeg = idleTime !== null ? Math.sin(idleTime / 2600 + wordIndex) * 10 : 0;
      const pulse = idleTime !== null ? Math.sin(idleTime / 900) * 0.5 + 0.5 : 0;
      const cyc = HERO_COLORS.map((c) => (idleTime !== null ? hueShift(c, hueDeg) : c));

      // fully-appeared check, used to fire the one-time landing impact
      const lastLetterDelay = (glyphs.length - 1) * 4;
      const fullyLanded = idleTime !== null || popProgress - lastLetterDelay >= 12;
      if (fullyLanded && landedRef && !landedRef.done) {
        landedRef.done = true;
        triggerShake(5, 200);
        spawnDust(cx, cy + glyphH * scale + 6);
      }

      // ---- pass 0: silhouette outline ----
      // draw every filled cell 1px oversized in outline color FIRST, then draw
      // the real fill on top slightly inset. Neighboring cells cancel the
      // outline on shared interior edges, so only the true outer silhouette
      // keeps a stroke — this is what makes the word legible over the
      // dithered background instead of the shadow-blur alone.
      ctx.save();
      for (let gi = 0; gi < glyphs.length; gi++) {
        const glyph = glyphs[gi];
        const gx = startX + gi * (glyphW + spacing) * scale;
        const letterDelay = gi * 4;
        let appear = idleTime !== null ? 1 : Math.min(1, Math.max(0, (popProgress - letterDelay) / 12));
        if (appear <= 0) continue;
        const ease = 1 - Math.pow(1 - appear, 3);
        let bounce = idleTime !== null ? bob : Math.sin(ease * Math.PI) * 6 * (1 - ease);
        // squash on the final tick of the landing bounce for a little "thud"
        const squashT = idleTime === null ? Math.max(0, Math.min(1, (appear - 0.82) / 0.18)) : 0;
        const squashY = 1 - squashT * 0.16;

        ctx.fillStyle = OUTLINE_COLOR;
        for (let row = 0; row < glyphH; row++) {
          for (let col = 0; col < glyphW; col++) {
            if (glyph[row][col] === "1") {
              const px = gx + col * scale;
              const rowCy = cy + (glyphH * scale) / 2;
              const py = rowCy + (cy + row * scale - bounce - rowCy) * squashY;
              ctx.fillRect(
                px + depthOffset * 2 - 1.5,
                py + depthOffset * 2 - 1.5,
                scale + 2,
                scale + 2
              );
            }
          }
        }
      }
      ctx.restore();

      // ---- pass 1: soft ambient shadow behind the extrusion stack ----
      ctx.save();
      ctx.shadowColor = "rgba(10, 6, 4, 0.55)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = "rgba(0,0,0,0.001)"; // near-invisible, exists only to cast the shadow pass
      for (let gi = 0; gi < glyphs.length; gi++) {
        const glyph = glyphs[gi];
        const gx = startX + gi * (glyphW + spacing) * scale;
        const letterDelay = gi * 4;
        let appear = idleTime !== null ? 1 : Math.min(1, Math.max(0, (popProgress - letterDelay) / 12));
        if (appear <= 0) continue;
        const ease = 1 - Math.pow(1 - appear, 3);
        const bounce = idleTime !== null ? bob : Math.sin(ease * Math.PI) * 6 * (1 - ease);
        for (let row = 0; row < glyphH; row++) {
          for (let col = 0; col < glyphW; col++) {
            if (glyph[row][col] === "1") {
              const px = gx + col * scale;
              const py = cy + row * scale - bounce;
              ctx.fillRect(px + depthOffset * 2, py + depthOffset * 2, scale - 1, scale - 1);
            }
          }
        }
      }
      ctx.restore();

      // ---- pass 2: extruded colored blocks on top ----
      for (let gi = 0; gi < glyphs.length; gi++) {
        const glyph = glyphs[gi];
        const gx = startX + gi * (glyphW + spacing) * scale;
        const letterDelay = gi * 4;
        let appear = idleTime !== null ? 1 : Math.min(1, Math.max(0, (popProgress - letterDelay) / 12));
        if (appear <= 0) continue;
        const ease = 1 - Math.pow(1 - appear, 3);
        let bounce = idleTime !== null ? bob : Math.sin(ease * Math.PI) * 6 * (1 - ease);
        const squashT = idleTime === null ? Math.max(0, Math.min(1, (appear - 0.82) / 0.18)) : 0;
        const squashY = 1 - squashT * 0.16;

        for (let row = 0; row < glyphH; row++) {
          for (let col = 0; col < glyphW; col++) {
            if (glyph[row][col] === "1") {
              const px = gx + col * scale;
              const rowCy = cy + (glyphH * scale) / 2;
              const py = rowCy + (cy + row * scale - bounce - rowCy) * squashY;
              for (let d = depthOffset; d >= 0; d--) {
                const idx = cyc.length - 1 - Math.min(d, cyc.length - 1);
                ctx.fillStyle = cyc[idx];
                ctx.fillRect(px + d * 2, py + d * 2, scale - 1, scale - 1);
              }
              if (idleTime !== null && pulse > 0.75 && Math.random() < 0.08) {
                // small bright speck instead of a full-pixel wash, so it
                // reads as a glitter twinkle sitting ON the color rather
                // than a translucent tint blending into it
                const glintSize = 2 + Math.random() * 2;
                const gx2 = px + Math.random() * (scale - glintSize);
                const gy2 = py + Math.random() * (scale - glintSize);
                ctx.save();
                ctx.shadowColor = "#ffffff";
                ctx.shadowBlur = 4;
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(gx2, gy2, glintSize, glintSize);
                ctx.restore();
              }
              if (appear < 1 && Math.random() < 0.02) {
                spawnParticles(px + scale / 2, py + scale / 2, HERO_COLORS[HERO_COLORS.length - 1]);
              }
              if (idleTime !== null && Math.random() < 0.003) {
                spawnParticles(px + scale / 2, py + scale / 2, cyc[cyc.length - 1]);
              }
            }
          }
        }
      }
    }

    function drawMidText(text, cx, cy, popProgress, fontSize) {
      let appear = Math.min(1, Math.max(0, popProgress / 12));
      if (appear <= 0) return;
      const ease = 1 - Math.pow(1 - appear, 3);
      const rise = (1 - ease) * 10;

      ctx.save();
      ctx.globalAlpha = appear;
      ctx.font = `700 ${fontSize}px 'Baloo 2', system-ui, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.lineJoin = "round";

      const letters = text.split("");
      const widths = letters.map((ch) => ctx.measureText(ch).width);
      const gap = 3;
      const totalW = widths.reduce((a, b) => a + b, 0) + gap * (letters.length - 1);
      const y = cy - rise;
      const SHADOW_OFFSET_X = 5;
      const SHADOW_OFFSET_Y = 4; // lower-right now, instead of a pure horizontal offset

      // pass 1: flat dark shadow copy, offset to the right
      let xShadow = cx - totalW / 2;
      ctx.fillStyle = OUTLINE_COLOR;
      letters.forEach((ch, i) => {
        const w = widths[i];
        ctx.fillText(ch, xShadow + w / 2 + SHADOW_OFFSET_X, y + SHADOW_OFFSET_Y);
        xShadow += w + gap;
      });

      // pass 2: white front face with a dark outline on top
      let x = cx - totalW / 2;
      ctx.lineWidth = 4;
      ctx.strokeStyle = OUTLINE_COLOR;
      ctx.fillStyle = "#ffffff";
      letters.forEach((ch, i) => {
        const w = widths[i];
        ctx.strokeText(ch, x + w / 2, y);
        ctx.fillText(ch, x + w / 2, y);
        x += w + gap;
      });

      ctx.restore();
    }

    let raf;
    let t0 = performance.now();
    const landed0 = { done: false };
    const landed1 = { done: false };

    function loop(now) {
      const elapsed = now - t0;
      ctx.clearRect(0, 0, W, H);

      // advance screen shake
      let shakeX = 0,
        shakeY = 0;
      if (shake.t < shake.dur) {
        shake.t += 16;
        const decay = 1 - shake.t / shake.dur;
        shakeX = (Math.random() - 0.5) * shake.mag * decay;
        shakeY = (Math.random() - 0.5) * shake.mag * decay;
      }

      ctx.save();
      ctx.translate(shakeX, shakeY);

      const introDone = elapsed > 1400;
      const idleTime = introDone ? elapsed - 1400 : null;

      if (introDone) {
        const cyclePos = idleTime % 4000;
        if (cyclePos < 200) {
          const s = (1 - cyclePos / 200) * 5;
          ctx.translate((Math.random() - 0.5) * s, (Math.random() - 0.5) * s);
        }
      }

      const scale = 6; // smaller overall block now that this needs to leave room for buttons below
      const popProgress = elapsed / 22;

      // ---- layout: derive every y-position from gap values ----
      // GAP_TOP is the breathing room under JOURNEY, GAP_BOTTOM is the
      // (smaller) breathing room under "of an" before INSTRUCTION — kept as
      // two named constants rather than one shared GAP so the asymmetry is
      // an intentional, easy-to-retune choice instead of a magic number.
      const glyphH = 7;
      const letterH = glyphH * scale; // pixel-font block height
      const midFontSize = 26;
      const GAP_TOP = 12;
      const GAP_BOTTOM = 6;

      const blockH = letterH + GAP_TOP + midFontSize + GAP_BOTTOM + letterH;
      const TITLE_Y_SHIFT = 80; // pixels to move the whole block UP from dead-center; increase to push it higher
      const blockTop = H / 2 - blockH / 2 - TITLE_Y_SHIFT;

      const journeyCy = blockTop;
      const midCy = journeyCy + letterH + GAP_TOP + midFontSize / 2;
      const instructionCy = midCy + midFontSize / 2 + GAP_BOTTOM;

      drawHeroWord(linesHero[0], W / 2, journeyCy, scale, 4, popProgress, idleTime, 0, landed0);
      drawMidText(midText, W / 2, midCy, popProgress - 20, midFontSize);
      drawHeroWord(linesHero[1], W / 2, instructionCy, scale, 4, popProgress - 30, idleTime, 1, landed1);

      ctx.restore();

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.1;
        p.life--;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, p.size || 3, p.size || 3);
      });
      particles = particles.filter((p) => p.life > 0);

      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={wrapRef} style={styles.wrap}>
      <div style={styles.canvasBox}>
        <canvas ref={canvasRef} width={900} height={500} style={styles.canvas} />
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    pointerEvents: "none",
  },
  canvasBox: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  canvas: {
    display: "block",
    width: "100%",
    height: "auto",
    imageRendering: "pixelated",
  },
};