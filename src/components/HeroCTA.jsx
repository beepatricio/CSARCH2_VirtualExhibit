// HeroCTA.jsx
import React from "react";
import tryItBadge from "../assets/TryItYourself.png";

function scrollToId(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Finds the real ExhibitTabs button by its visible label instead of
// guessing an internal attribute name, so this stays decoupled from
// however ExhibitTabs.astro implements its own click/aria-selected logic.
function clickTabByLabel(label) {
  const btn = Array.from(document.querySelectorAll(".xt-tabs__btn")).find(
    (b) => b.textContent.trim().toLowerCase() === label.toLowerCase()
  );
  if (btn) btn.click();
  return !!btn;
}

export default function HeroCTA() {
  function handleStart() {
    clickTabByLabel("Try It Yourself");
    // wait a frame for the panel swap/animation to kick in before scrolling
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToId("try-it-yourself"));
    });
  }

  return (
    <div className="xt-hero-cta">
      <div className="xt-btn-start-wrap">
        <img src={tryItBadge.src} alt="" className="xt-btn-start-badge" />
        <button
          type="button"
          className="xt-btn-start"
          onClick={handleStart}
          aria-label="Start the Try It Yourself experience"
        >
          <span className="xt-btn-start__glyph">▶</span>
          <span>Start</span>
        </button>
      </div>
    </div>
  );
}