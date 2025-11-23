// public/js/ads.js
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    insertAds();
  }, 200);
});

function insertAds() {
  const configEl = document.getElementById("ads-config");
  if (!configEl) return;

  const adsConfig = JSON.parse(configEl.textContent);
  const midAds = adsConfig.inContent || [];
  if (!midAds.length) return;

  const paragraphs = document.querySelectorAll(
    ".article-container p, .article-container h2, .jokes-page p, .jokes-page li"
  );

  paragraphs.forEach((el, index) => {
    midAds.forEach((ad) => {
      if (ad.every && index > 0 && index % ad.every === 0) {
        const box = document.createElement("div");
        box.className = "in-content-ad-box";

        box.innerHTML = ad.video
        ? `<a href="${ad.link}" onclick="event.preventDefault(); window.open('${ad.link}', '_blank');">
            <video src="${ad.video}" autoplay loop muted playsinline style="width:100%; max-height:180px; object-fit:cover; border-radius:10px;"></video>
          </a>`
        : ad.img
          ? `<a href="${ad.link}" onclick="event.preventDefault(); window.open('${ad.link}', '_blank');">
              <img src="${ad.img}" style="width:100%; border-radius:10px;" />
            </a>`
          : `<div class="ad-placeholder">مساحتك الإعلانية هنا 😂🔥</div>`;
       
      
        el.insertAdjacentElement("afterend", box);
      }
    });
  });
}
