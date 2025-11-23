// ========== Tilt Card Global Script ==========
// public/js/tilt-cards.js
function addTiltToProduct(card) {
    const inner = 
    card.querySelector(".product-card-inner") || 
    card.querySelector(".ad-tilt-inner") ||
    card;

    let isDrunkAnimating = false;
  
    // دايمًا خد اللون Live
    function getColor() {
      return getComputedStyle(document.body)
        .getPropertyValue("--shadow-color")
        .trim();
    }
  
    // ===== MOBILE =====
    if (window.innerWidth < 900) {
      card.addEventListener("touchstart", () => {
        const c = getColor();
  
        inner.style.boxShadow = `0 0 22px ${c}`;
        inner.style.transition = "transform 0.2s ease";
        inner.style.transform = "rotateX(14deg) rotateY(14deg) scale(1.05)";
  
        setTimeout(() => {
          inner.style.transition = "transform 0.4s ease-in-out";
          inner.style.transform = "rotateX(-10deg) rotateY(-10deg) scale(0.98)";
        }, 200);
  
        setTimeout(() => {
          inner.style.transition = "transform 0.45s ease-in-out";
          inner.style.transform = "rotateX(6deg) rotateY(-6deg)";
        }, 600);
  
        setTimeout(() => {
          inner.style.transition = "transform 0.45s ease-in-out";
          inner.style.transform = "rotateX(-6deg) rotateY(6deg)";
        }, 1050);
  
        setTimeout(() => {
          inner.style.transition = "transform 0.45s ease-in-out";
          inner.style.transform = "rotateX(4deg) rotateY(-4deg)";
        }, 1500);
  
        setTimeout(() => {
          inner.style.transition = "transform 0.45s ease-in-out";
          inner.style.transform = "rotateX(-3deg) rotateY(3deg)";
        }, 1950);
  
        setTimeout(() => {
          inner.style.transition = "transform 0.6s ease-out, box-shadow 0.6s ease-out";
          inner.style.transform = "rotateX(0) rotateY(0) scale(1)";
          inner.style.boxShadow = `0 0 12px ${getColor()}`;
        }, 2400);
      });
  
      return;
    }
  
    // ===== DESKTOP =====
    card.addEventListener("mousemove", (e) => {
      if (isDrunkAnimating) return;
  
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
  
      const maxTilt = 28;
      const rotateY = ((x / rect.width) - 0.5) * maxTilt;
      const rotateX = ((y / rect.height) - 0.5) * -maxTilt;
  
      const c = getColor();
      const intensity = 10 + Math.abs(rotateX) + Math.abs(rotateY);
  
      inner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      inner.style.boxShadow = `0 0 ${intensity}px ${c}`;
    });
  
    card.addEventListener("mouseleave", () => {
      if (isDrunkAnimating) return;
  
      inner.style.transform = "rotateX(0) rotateY(0)";
      inner.style.boxShadow = `0 0 12px ${getColor()}`;
    });
  
    card.addEventListener("click", () => {
      if (isDrunkAnimating) return;
  
      isDrunkAnimating = true;
      inner.classList.add("product-drunken");
      inner.style.boxShadow = `0 0 25px ${getColor()}`;
  
      setTimeout(() => {
        inner.classList.remove("product-drunken");
        inner.style.transform = "rotateX(0) rotateY(0)";
        inner.style.boxShadow = `0 0 12px ${getColor()}`;
        isDrunkAnimating = false;
      }, 2600);
    });
  }
  
  // ========== AUTO-INIT ==========
  document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".tilt-card").forEach((card) => {
      addTiltToProduct(card);
    });
  });

  document.querySelectorAll(".ad-tilt").forEach((box) => {
    const inner = box.querySelector(".ad-tilt-inner");
    if (inner) {
      addTiltToProduct(box);
    }
  });
  