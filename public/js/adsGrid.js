// public/js/adsGrid.js
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("ads-config");
  if (!el) return;

  const cfg = JSON.parse(el.textContent);
  const ads = cfg.gridAds || [];
  if (!ads.length) return;

  const grids = document.querySelectorAll(
    ".tests-grid, .quizzes-grid, .cards-grid, .products-grid, .grid, .quiz-grid, .articles-grid"
  );

  grids.forEach(grid => {
    const cards = Array.from(grid.querySelectorAll(":scope > *"));

    ads.forEach(ad => {
      if (ad.every) {
        cards.forEach((card, i) => {
          if (i > 0 && i % ad.every === 0) {
            const box = document.createElement("div");
            box.className = "grid-ad-box tilt-card";

            const inner = document.createElement("div");
            inner.className = "ad-tilt-inner";

            // inner.innerHTML = `
            //   <a href="${ad.link}" onclick="event.preventDefault(); window.open('${ad.link}', '_blank');" class="ad-link">
            //     ${ad.video
            //                 ? `<video src="${ad.video}" autoplay loop muted playsinline></video>`
            //                 : ad.img
            //                   ? `<img src="${ad.img}" />`
            //                   : `<div class="ad-placeholder">مساحتك الإعلانية هنا 😂🔥</div>`
            //               }
            //     <div class="ad-label">📢 إعلان</div>
            //   </a>
            // `;
            inner.innerHTML = `
  <a href="${ad.link}" target="_blank" class="ad-link">
    
    <div class="ad-media">
      ${
        ad.video
          ? `<video src="${ad.video}" autoplay loop muted playsinline></video>`
          : ad.img
          ? `<img src="${ad.img}" />`
          : `<div class="ad-placeholder">إعلان</div>`
      }
    </div>

    <div class="ad-body">
      <h4>${ad.title || "إعلان"}</h4>
      <p>${ad.desc || ""}</p>
      ${ad.cta ? `<button>${ad.cta}</button>` : ""}
    </div>

    <span class="ad-badge">📢 إعلان</span>

  </a>
`;
            box.appendChild(inner);
            card.insertAdjacentElement("beforebegin", box);
          }
        });
      }
    });
  });
});
