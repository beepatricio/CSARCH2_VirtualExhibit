// TitleHero.jsx
import React, { useEffect, useRef, useState } from "react";
import backgroundTrees from "../assets/BackgroundTrees.png";
import foregroundTrees from "../assets/ForegroundTrees.png";
import grass from "../assets/Grass.png";
import sky from "../assets/Sky.png";

function ParallaxStrip({ src, heightPercent, bottomPercent, pxPerSecond }) {
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const [tileWidth, setTileWidth] = useState(0);
  const [tileCount, setTileCount] = useState(2);
  const firstImgRef = useRef(null);

  // measure the rendered width of one tile (image scaled to the box height,
  // keeping its natural aspect ratio) and figure out how many copies are
  // needed to cover at least 2x the visible width, so the loop never runs out
  useEffect(() => {
    function measure() {
      const img = firstImgRef.current;
      const container = containerRef.current;
      if (!img || !container || !img.naturalWidth) return;
      const renderedHeight = img.clientHeight;
      const ratio = img.naturalWidth / img.naturalHeight;
      const w = renderedHeight * ratio;
      if (w > 0) {
        setTileWidth(w);
        const needed = Math.ceil((container.clientWidth * 2) / w) + 2;
        setTileCount(needed);
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

  // continuous seamless scroll via rAF, resetting exactly one tile width
  // so the wrap-around is invisible regardless of screen size
  useEffect(() => {
    if (!tileWidth) return;
    let raf;
    let last = performance.now();
    let offset = 0;
    function step(now) {
      const dt = (now - last) / 1000;
      last = now;
      offset -= pxPerSecond * dt;
      if (offset <= -tileWidth) offset += tileWidth;
      if (trackRef.current) {
        trackRef.current.style.transform = `translateX(${offset}px)`;
      }
      raf = requestAnimationFrame(step);
    }
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [tileWidth, pxPerSecond]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "absolute",
        left: 0,
        bottom: `${bottomPercent}%`,
        width: "100%",
        height: `${heightPercent}%`,
        overflow: "hidden",
      }}
    >
      <div ref={trackRef} style={{ display: "flex", height: "100%", willChange: "transform" }}>
        {Array.from({ length: tileCount }).map((_, i) => (
          <img
            key={i}
            ref={i === 0 ? firstImgRef : null}
            src={src}
            alt=""
            style={{
              height: "100%",
              width: "auto",
              flex: "0 0 auto",
              display: "block",
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default function TitleHero() {
  return (
    <div style={styles.stage}>
      <img src={sky.src} style={styles.skyImg} alt="" />
      <ParallaxStrip
        src={backgroundTrees.src}
        heightPercent={70}
        bottomPercent={20}
        pxPerSecond={18}
      />
      <ParallaxStrip
        src={foregroundTrees.src}
        heightPercent={75}
        bottomPercent={20}
        pxPerSecond={45}
      />
      <img src={grass.src} style={styles.grassImg} alt="" />
    </div>
  );
}

const styles = {
  stage: {
    position: "relative",
    width: "100%",
    // Height now derives from WIDTH (fixed aspect ratio), not viewport
    // height. Using svh here was the bug: on a narrow/tall phone, 100svh
    // is a huge number with no relation to the (small) width, so the
    // stage stretched into a tall column and pushed everything below
    // the fold. aspect-ratio keeps the hero proportioned like the source
    // art at any width. maxHeight is just a safety cap for ultra-wide,
    // short browser windows so it can never force a scroll on desktop.
    aspectRatio: "1.92 / 1",
    minHeight: "300px",
    maxHeight: "100svh",
    overflow: "hidden",
    background: "transparent",
  },
  skyImg: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
    pointerEvents: "none",
    zIndex: 0,
  },
  grassImg: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "bottom",
    pointerEvents: "none",
  },
};