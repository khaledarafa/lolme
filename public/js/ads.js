// public/js/ads.js
document.addEventListener("DOMContentLoaded", insertAds);

function insertAds() {
  const configEl = document.getElementById("ads-config");
  if (!configEl) return;

  let adsConfig;

  try {
    adsConfig = JSON.parse(configEl.textContent);
  } catch (error) {
    console.error("Invalid ads-config JSON:", error);
    return;
  }

  const midAds = adsConfig.inContent || [];
  if (!midAds.length) return;

  const paragraphs = document.querySelectorAll(
    ".article-container p, .article-container h2",
  );

  // اختيار إعلان واحد لكل موضع، بالتناوب بين الإعلانات
  let adIndex = Math.floor(Math.random() * midAds.length);

  paragraphs.forEach((el, index) => {
    // منع تكرار الإعلان بعد نفس العنصر
    if (el.dataset.adInserted === "true") return;

    // نستخدم قيمة every لأول إعلان كمسافة موحدة
    const every = Number(midAds[0].every) || 3;

    if (index === 0 || (index + 1) % every !== 0) return;

    const ad = midAds[adIndex % midAds.length];
    adIndex++;

    const box = document.createElement("div");
    box.className = "in-content-ad-box grid-ad-box";

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

    const badge = document.createElement("span");
    badge.className = "ad-badge";
    badge.textContent = "📢 إعلان";
    link.appendChild(badge);

    box.appendChild(link);

    el.insertAdjacentElement("afterend", box);
    el.dataset.adInserted = "true";
  });
}
