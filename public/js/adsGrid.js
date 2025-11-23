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
            
            inner.innerHTML = ad.video
              ? `<a href="${ad.link}" onclick="event.preventDefault(); window.open('${ad.link}', '_blank');">
                   <video src="${ad.video}" autoplay loop muted playsinline style="width:100%; object-fit:cover;"></video>
                 </a>`
              : ad.img
                ? `<a href="${ad.link}">
                     <img src="${ad.img}" style="width:100%; object-fit:cover;" />
                   </a>`
                : `<div class="ad-placeholder">مساحتك الإعلانية هنا 😂🔥</div>`;
                box.appendChild(inner);
            card.insertAdjacentElement("beforebegin", box);
          }
        });        
      }
    });
  });
});
