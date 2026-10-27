// public/js/adsGrid.js            ٢٧-١٠-٢٦
document.addEventListener("DOMContentLoaded", insertGridAds);

function insertGridAds() {
  const configEl = document.getElementById("ads-config");
  if (!configEl) return;

  let cfg;

  try {
    cfg = JSON.parse(configEl.textContent);
  } catch (error) {
    console.error("Invalid ads-config JSON:", error);
    return;
  }

  const ads = cfg.gridAds || [];
  if (!ads.length) return;

  const grids = document.querySelectorAll(
    ".tests-grid, .quizzes-grid, .cards-grid, .products-grid, .grid, .quiz-grid, .articles-grid"
  );

  grids.forEach((grid) => {
    // منع تكرار إضافة الإعلانات
    if (grid.dataset.gridAdsInjected === "true") return;

    const cards = Array.from(grid.children).filter(
      (el) => !el.classList.contains("grid-ad-box")
    );

    if (cards.length < 4) return;

    // خلط الإعلانات عشوائيًا
    const shuffledAds = [...ads];

    for (let i = shuffledAds.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledAds[i], shuffledAds[j]] = [
        shuffledAds[j],
        shuffledAds[i],
      ];
    }

    let adIndex = 0;

    cards.forEach((card, i) => {
      if ((i + 1) % 4 !== 0) return;

      const ad = shuffledAds[adIndex % shuffledAds.length];
      adIndex++;

      const box = document.createElement("div");
      box.className = "grid-ad-box tilt-card";

      const inner = document.createElement("div");
      inner.className = "ad-tilt-inner";

      const link = document.createElement("a");
      link.href = ad.link;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.className = "ad-link";

      const media = document.createElement("div");
      media.className = "ad-media";

      if (ad.img) {
        const img = document.createElement("img");
        img.src = ad.img;
        img.alt = ad.title || "إعلان";
        img.loading = "lazy";
        img.decoding = "async";
        media.appendChild(img);
      }

      link.appendChild(media);

      if (ad.title || ad.desc || ad.cta) {
        const body = document.createElement("div");
        body.className = "ad-body";

        if (ad.title) {
          const title = document.createElement("h4");
          title.textContent = ad.title;
          body.appendChild(title);
        }

        if (ad.desc) {
          const desc = document.createElement("p");
          desc.textContent = ad.desc;
          body.appendChild(desc);
        }

        if (ad.cta) {
const cta = document.createElement("button");
cta.type = "button";
cta.className = "ad-cta";
cta.textContent = ad.cta;
cta.style.pointerEvents = "none";
body.appendChild(cta);
        }

        link.appendChild(body);
      }

      const badge = document.createElement("span");
      badge.className = "ad-badge";
      badge.textContent = "📢 إعلان";
      link.appendChild(badge);

      inner.appendChild(link);
      box.appendChild(inner);

      card.insertAdjacentElement("afterend", box);
    });

    grid.dataset.gridAdsInjected = "true";
  });
}

// document.addEventListener("DOMContentLoaded", () => {
//   const el = document.getElementById("ads-config");
//   if (!el) return;

//   const cfg = JSON.parse(el.textContent);
//   const ads = cfg.gridAds || [];
//   if (!ads.length) return;

//   const grids = document.querySelectorAll(
//     ".tests-grid, .quizzes-grid, .cards-grid, .products-grid, .grid, .quiz-grid, .articles-grid"
//   );

//   grids.forEach(grid => {
//     const cards = Array.from(grid.querySelectorAll(":scope > *"));

// cards.forEach((card, i) => {
//   if (i > 0 && i % 4 === 0) {
    
// //     const adIndex = Math.floor(i / 4) % ads.length;
// // const ad = ads[adIndex]; // 👈 اختيار إعلان مختلف كل مرة
// const ad = ads[Math.floor(Math.random() * ads.length)];
//     const box = document.createElement("div");
//     box.className = "grid-ad-box tilt-card";

//     const inner = document.createElement("div");
//     inner.className = "ad-tilt-inner";

//     inner.innerHTML = `
//       <a href="${ad.link}" target="_blank" class="ad-link">
//         <div class="ad-media">
//           ${ad.img ? `<img src="${ad.img}" />` : ""}
//         </div>
//         <div class="ad-body">
//           <h4>${ad.title}</h4>
//           <p>${ad.desc}</p>
//           ${ad.cta ? `<button>${ad.cta}</button>` : ""}
//         </div>
//         <span class="ad-badge">📢 إعلان</span>
//       </a>
//     `;

//     box.appendChild(inner);
//     card.insertAdjacentElement("beforebegin", box);
//   }
// });
//   });
// });
