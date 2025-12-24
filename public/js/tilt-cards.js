// /public/js/tilt-cards.js  (استبدل الملف القديم بالنسخة دي)
// Optimized Dancing Tilt — smooth, reactive, zero forced reflow

(function () {
  const isMobile = () => window.innerWidth < 900;

  // small lerp helper
  const lerp = (a, b, t) => a + (b - a) * t;

  // clamp helper
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // get current theme color for glow
  const getColor = () =>
    getComputedStyle(document.body).getPropertyValue("--shadow-color").trim() || "rgba(0,0,0,0.12)";

  function attach(card) {
    const inner =
      card.querySelector(".product-card-inner") ||
      card.querySelector(".ad-tilt-inner") ||
      card;

    // make sure the inner will be GPU-accelerated
    inner.style.willChange = "transform, box-shadow";

    // state (no DOM reads on mousemove)
    let rect = null;
    let width = 0;
    let height = 0;
    let targetX = 0;
    let targetY = 0;
    let currentRX = 0;
    let currentRY = 0;
    let currentScale = 1;
    let isAnimating = false;
    let rafId = null;

    const maxTilt = 28;
    const danceIntensity = 1.0; // tweak for more/less wobble
    const smoothness = 0.12; // a bit lower = snappier; higher = smoother

    function updateRect() {
      // read rect only occasionally (mouseenter / resize)
      rect = card.getBoundingClientRect();
      width = rect.width || card.offsetWidth || 200;
      height = rect.height || card.offsetHeight || 120;
    }

    function onEnter() {
      updateRect();
      // give a little scale for presence
      currentScale = 1.03;
      inner.style.transition = "box-shadow 220ms linear";
      inner.style.boxShadow = `0 0 14px ${getColor()}`;
      startLoop();
    }

    function onLeave() {
      // reset targets
      targetX = 0;
      targetY = 0;
      currentScale = 1;
      // gentle reset on style
      inner.style.transition = "transform 280ms cubic-bezier(.2,.8,.2,1), box-shadow 280ms linear";
      // keep loop a bit so lerp finishes, then stop
      stopLoopWithDelay(350);
    }

    function onMove(e) {
      if (!rect) return;
      const clientX = e.clientX || (e.touches && e.touches[0] && e.touches[0].clientX) || 0;
      const clientY = e.clientY || (e.touches && e.touches[0] && e.touches[0].clientY) || 0;

      // compute normalized mouse pos (0..1)
      const nx = clamp((clientX - rect.left) / width, 0, 1);
      const ny = clamp((clientY - rect.top) / height, 0, 1);

      // target rotation (degrees)
      const ry = (nx - 0.5) * maxTilt;
      const rx = (ny - 0.5) * -maxTilt;

      // add a subtle dance offset that depends on mouse velocity direction (for "wobble")
      // we won't compute velocity from DOM — just add a tiny function of position to feel alive
      const wobbleX = (Math.sin(nx * Math.PI * 2 * danceIntensity) * 2);
      const wobbleY = (Math.cos(ny * Math.PI * 2 * danceIntensity) * 2);

      targetX = rx + wobbleX;
      targetY = ry + wobbleY;
    }

    function frame() {
      // smooth interpolate current to targets
      currentRX = lerp(currentRX, targetX, smoothness);
      currentRY = lerp(currentRY, targetY, smoothness);

      // subtle idle breathing (very small) to keep it lively
      const idle = Math.sin(performance.now() / 800) * 0.15;

      const rxFinal = currentRX + idle;
      const ryFinal = currentRY + idle;

      // intensity for box-shadow based on tilt amount
      const intensity = 10 + (Math.abs(currentRX) + Math.abs(currentRY)) * 0.8;

      // apply transform (only writes — no reads)
      inner.style.transform = `perspective(900px) rotateX(${rxFinal}deg) rotateY(${ryFinal}deg) scale(${currentScale})`;
      inner.style.boxShadow = `0 0 ${intensity}px ${getColor()}`;

      rafId = requestAnimationFrame(frame);
    }

    function startLoop() {
      if (isAnimating) return;
      isAnimating = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(frame);
    }

    function stopLoop() {
      if (!isAnimating) return;
      isAnimating = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
      // final snap to zero
      inner.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
      inner.style.boxShadow = `0 0 12px ${getColor()}`;
    }

    function stopLoopWithDelay(ms = 200) {
      setTimeout(() => {
        stopLoop();
      }, ms);
    }

    // drunk click effect (shorter, snappier)
    function onClick() {
      inner.style.transition = "transform 420ms cubic-bezier(.2,.8,.2,1), box-shadow 420ms linear";
      inner.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1.06)";
      inner.style.boxShadow = `0 0 28px ${getColor()}`;
      setTimeout(() => {
        inner.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1.02)";
        setTimeout(() => {
          inner.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg) scale(1)";
        }, 220);
      }, 160);
    }

    // attach events based on device
    if (isMobile()) {
      // keep original fun mobile routine but leaner
      card.addEventListener("touchstart", () => {
        inner.style.transition = "transform 300ms ease";
        inner.style.transform = "perspective(900px) rotateX(8deg) rotateY(8deg) scale(1.04)";
        inner.style.boxShadow = `0 0 20px ${getColor()}`;
        setTimeout(() => {
          inner.style.transform = "perspective(900px) rotateX(-6deg) rotateY(-6deg) scale(0.98)";
        }, 240);
        setTimeout(() => {
          inner.style.transform = "perspective(900px) rotateX(4deg) rotateY(-4deg) scale(1)";
        }, 520);
        setTimeout(() => {
          inner.style.transform = "perspective(900px) rotateX(0) rotateY(0) scale(1)";
        }, 880);
      }, {passive: true});
      return;
    }

    // desktop handlers
    card.addEventListener("mouseenter", onEnter, {passive: true});
    card.addEventListener("mousemove", onMove, {passive: true});
    card.addEventListener("mouseleave", onLeave, {passive: true});
    card.addEventListener("click", onClick);

    // recalc rect on resize (throttled)
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        updateRect();
      }, 120);
    });
  }

  // auto-init
  function initAll() {
    document.querySelectorAll(".tilt-card, .ad-tilt").forEach(attach);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }
})();



// // ========== Tilt Card Global Script ==========
// // public/js/tilt-cards.js
// function addTiltToProduct(card) {
//     const inner = 
//     card.querySelector(".product-card-inner") || 
//     card.querySelector(".ad-tilt-inner") ||
//     card;

//     let isDrunkAnimating = false;
  
//     // دايمًا خد اللون Live
//     function getColor() {
//       return getComputedStyle(document.body)
//         .getPropertyValue("--shadow-color")
//         .trim();
//     }
  
//     // ===== MOBILE =====
//     if (window.innerWidth < 900) {
//       card.addEventListener("touchstart", () => {
//         const c = getColor();
  
//         inner.style.boxShadow = `0 0 22px ${c}`;
//         inner.style.transition = "transform 0.2s ease";
//         inner.style.transform = "rotateX(14deg) rotateY(14deg) scale(1.05)";
  
//         setTimeout(() => {
//           inner.style.transition = "transform 0.4s ease-in-out";
//           inner.style.transform = "rotateX(-10deg) rotateY(-10deg) scale(0.98)";
//         }, 200);
  
//         setTimeout(() => {
//           inner.style.transition = "transform 0.45s ease-in-out";
//           inner.style.transform = "rotateX(6deg) rotateY(-6deg)";
//         }, 600);
  
//         setTimeout(() => {
//           inner.style.transition = "transform 0.45s ease-in-out";
//           inner.style.transform = "rotateX(-6deg) rotateY(6deg)";
//         }, 1050);
  
//         setTimeout(() => {
//           inner.style.transition = "transform 0.45s ease-in-out";
//           inner.style.transform = "rotateX(4deg) rotateY(-4deg)";
//         }, 1500);
  
//         setTimeout(() => {
//           inner.style.transition = "transform 0.45s ease-in-out";
//           inner.style.transform = "rotateX(-3deg) rotateY(3deg)";
//         }, 1950);
  
//         setTimeout(() => {
//           inner.style.transition = "transform 0.6s ease-out, box-shadow 0.6s ease-out";
//           inner.style.transform = "rotateX(0) rotateY(0) scale(1)";
//           inner.style.boxShadow = `0 0 12px ${getColor()}`;
//         }, 2400);
//       });
  
//       return;
//     }
  
//     // ===== DESKTOP =====
//     card.addEventListener("mousemove", (e) => {
//       if (isDrunkAnimating) return;
  
//       const rect = card.getBoundingClientRect();
//       const x = e.clientX - rect.left;
//       const y = e.clientY - rect.top;
  
//       const maxTilt = 28;
//       const rotateY = ((x / rect.width) - 0.5) * maxTilt;
//       const rotateX = ((y / rect.height) - 0.5) * -maxTilt;
  
//       const c = getColor();
//       const intensity = 10 + Math.abs(rotateX) + Math.abs(rotateY);
  
//       inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
//       inner.style.boxShadow = `0 0 ${intensity}px ${c}`;
//     });
  
//     card.addEventListener("mouseleave", () => {
//       if (isDrunkAnimating) return;
  
//       inner.style.transform = "rotateX(0) rotateY(0)";
//       inner.style.boxShadow = `0 0 12px ${getColor()}`;
//     });
  
//     card.addEventListener("click", () => {
//       if (isDrunkAnimating) return;
  
//       isDrunkAnimating = true;
//       inner.classList.add("product-drunken");
//       inner.style.boxShadow = `0 0 25px ${getColor()}`;
  
//       setTimeout(() => {
//         inner.classList.remove("product-drunken");
//         inner.style.transform = "rotateX(0) rotateY(0)";
//         inner.style.boxShadow = `0 0 12px ${getColor()}`;
//         isDrunkAnimating = false;
//       }, 2600);
//     });
//   }
  
//   // ========== AUTO-INIT ==========
//   document.addEventListener("DOMContentLoaded", () => {
//     document.querySelectorAll(".tilt-card").forEach((card) => {
//       addTiltToProduct(card);
//     });
//   });

//   document.querySelectorAll(".ad-tilt").forEach((box) => {
//     const inner = box.querySelector(".ad-tilt-inner");
//     if (inner) {
//       addTiltToProduct(box);
//     }
//   });
  