import {
  db,
  collection,
  query,
  where,
  getDocs,
} from "./firebase.js";

const SLOT_IDS = ["grid-1", "grid-2", "grid-3", "grid-4", "grid-5", "grid-6"];


const GRID_SLOT_DETAILS = {
  "grid-1": {
    price: 299,
    position: "المساحة الإعلانية الأولى داخل جريد الاختبارات",
  },
  "grid-2": {
    price: 249,
    position: "المساحة الإعلانية الثانية داخل جريد الاختبارات",
  },
  "grid-3": {
    price: 199,
    position: "المساحة الإعلانية الثالثة داخل جريد الاختبارات",
  },
  "grid-4": {
    price: 179,
    position: "المساحة الإعلانية الرابعة داخل جريد الاختبارات",
  },
  "grid-5": {
    price: 149,
    position: "المساحة الإعلانية الخامسة داخل جريد الاختبارات",
  },
  "grid-6": {
    price: 129,
    position: "المساحة الإعلانية السادسة داخل جريد الاختبارات",
  },
};


const CARDS_PER_SLOT = 4;
const CAMPAIGNS_COLLECTION = "adCampaigns";

const HOUSE_AD = {
  title: "إعلانك ممكن يظهر هنا 👀",
  desc: "عندك بيزنس أو صفحة؟ احجز مساحتك الإعلانية على LOLME ووصل لجمهورنا",
  cta: "احجز مساحتك الآن",
  link: "https://wa.me/201002008305",
  img: "",
};

function safeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value, window.location.origin);

    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };

    return entities[char];
  });
}

function isActive(campaign) {
  const now = Date.now();

  const start = campaign.startAt?.toDate?.()?.getTime();
  const end = campaign.endAt?.toDate?.()?.getTime();

  return (
    campaign.status === "active" &&
    Number.isFinite(start) &&
    Number.isFinite(end) &&
    start <= now &&
    end > now
  );
}

function getCampaignImage(campaign) {
  const images = Array.isArray(campaign.imageUrls)
    ? campaign.imageUrls
    : campaign.imageUrl
      ? [campaign.imageUrl]
      : [];

  return images.map(safeUrl).find(Boolean) || null;
}

function buildAdMarkup(campaign, campaignId, slotId) {
  const targetUrl = safeUrl(campaign.targetUrl);
  const image = getCampaignImage(campaign);

  if (!targetUrl || !image) {
    console.warn(
      `[LOLME Ads] الحملة ${campaignId} لديها صورة أو رابط غير صالح.`,
    );

    return buildHouseMarkup(slotId);
  }

  const title = campaign.headline || campaign.advertiserName || "إعلان";

  const desc = campaign.description || "";
  const cta = campaign.buttonText || "اعرف المزيد";

  return `
    <div
      class="ad-wrapper ad-tilt in-content-ad-box grid-ad-box"
      data-ad-id="${escapeHtml(campaignId)}"
      data-ad-slot="${escapeHtml(slotId)}"
      data-ad-type="advertiser"
      data-ad-campaign-id="${escapeHtml(campaignId)}"
      data-ad-ready="true"
      data-closeable="0"
    >
      <a
        href="${escapeHtml(targetUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        class="ad-link"
        data-ad-campaign-click="true"
      >
        <div class="ad-media">
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(title)}"
            loading="lazy"
            decoding="async"
          />
        </div>

        <div class="ad-body">
          ${title ? `<h4>${escapeHtml(title)}</h4>` : ""}
          ${desc ? `<p>${escapeHtml(desc)}</p>` : ""}
          ${
            cta
              ? `
            <button type="button" class="ad-cta" tabindex="-1">
              ${escapeHtml(cta)}
            </button>
          `
              : ""
          }
        </div>

        <span class="ad-badge">📢 إعلان</span>
      </a>
    </div>
  `;
}

function buildHouseMarkup(slotId) {
  const slot = GRID_SLOT_DETAILS[slotId];

  if (!slot) return "";

  const whatsappMessage = [
    `أنا مهتم بحجز ${slot.position}`,
    `السعر: ${slot.price} جنيه لمدة 30 يومًا.`,
    "ممكن أعرف تفاصيل الحجز؟",
  ].join("\n");

  const whatsappUrl =
    `https://wa.me/201002008305?text=${encodeURIComponent(whatsappMessage)}`;

  const slotNumber = slotId.replace("grid-", "");

  return `
    <a
      href="${whatsappUrl}"
      target="_blank"
      rel="noopener noreferrer"
      class="ad-wrapper ad-tilt in-content-ad-box grid-ad-box"
      data-ad-slot="${slotId}"
      data-ad-type="house"
      data-ad-ready="true"
      data-ad-booking-click="true"
    >
      <div class="ad-media grid-ad-placeholder">
        <span class="grid-house-icon">📢</span>
        <strong>أعلن على LOLME</strong>
        <span class="grid-slot-number">المساحة رقم ${slotNumber} اختبارات</span>
      </div>

      <div class="ad-body">
        <div class="grid-house-price">${slot.price} جنيه</div>
        <p class="grid-house-duration">اشتراك إعلاني لمدة 30 يومًا</p>
        <span class="ad-cta">احجز مساحتك ←</span>
      </div>
    </a>
  `;
}

async function loadCampaigns() {
  const campaignsQuery = query(
    collection(db, CAMPAIGNS_COLLECTION),
    where("status", "==", "active"),
  );

  const snapshot = await getDocs(campaignsQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

function getCampaignForSlot(campaigns, slotId) {
  return (
    campaigns
      .filter((campaign) => campaign.slotId === slotId && isActive(campaign))
      .sort(
        (a, b) =>
          (b.createdAt?.toDate?.()?.getTime() || 0) -
          (a.createdAt?.toDate?.()?.getTime() || 0),
      )[0] || null
  );
}

function insertSlot(grid, card, slotId, campaign) {
  const box = document.createElement("div");

  box.innerHTML = campaign
    ? buildAdMarkup(campaign, campaign.id, slotId)
    : buildHouseMarkup(slotId);

  const adElement = box.firstElementChild;

  if (!adElement) return;

  card.insertAdjacentElement("afterend", adElement);
}

async function insertGridAds() {
  const grid = document.querySelector(".tests-page .grid");

  if (!grid || grid.dataset.gridAdsInjected === "true") {
    return;
  }

  const cards = Array.from(grid.children).filter(
    (element) => !element.classList.contains("grid-ad-box"),
  );

  if (!cards.length) return;

  grid.dataset.gridAdsInjected = "true";

  try {
    const campaigns = await loadCampaigns();

    SLOT_IDS.forEach((slotId, index) => {
      const cardIndex = (index + 1) * CARDS_PER_SLOT - 1;
      const card = cards[cardIndex];

      if (!card) return;

      const campaign = getCampaignForSlot(campaigns, slotId);

      insertSlot(grid, card, slotId, campaign);
    });
  } catch (error) {
    console.error("[LOLME Ads] تعذر تحميل الحملات:", error);

    // عند فشل الاتصال نعرض كروت الحجز بدل ترك أماكن فارغة.
    SLOT_IDS.forEach((slotId, index) => {
      const cardIndex = (index + 1) * CARDS_PER_SLOT - 1;
      const card = cards[cardIndex];

      if (card) {
        insertSlot(grid, card, slotId, null);
      }
    });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", insertGridAds, {
    once: true,
  });
} else {
  void insertGridAds();
}

// // public/js/adsGrid.js.    قبل الفايرستور
// document.addEventListener("DOMContentLoaded", insertGridAds);

// function insertGridAds() {
//   const configEl = document.getElementById("ads-config");
//   if (!configEl) return;

//   let cfg;

//   try {
//     cfg = JSON.parse(configEl.textContent);
//   } catch (error) {
//     console.error("Invalid ads-config JSON:", error);
//     return;
//   }

//   const ads = cfg.gridAds || [];
//   if (!ads.length) return;

//   const grids = document.querySelectorAll(
//     ".tests-grid, .quizzes-grid, .cards-grid, .products-grid, .grid, .quiz-grid, .articles-grid",
//   );

//   grids.forEach((grid) => {
//     // منع تكرار إضافة الإعلانات
//     if (grid.dataset.gridAdsInjected === "true") return;

//     const cards = Array.from(grid.children).filter(
//       (el) => !el.classList.contains("grid-ad-box"),
//     );

//     if (cards.length < 4) return;

//     // خلط الإعلانات عشوائيًا
//     const shuffledAds = [...ads];

//     for (let i = shuffledAds.length - 1; i > 0; i--) {
//       const j = Math.floor(Math.random() * (i + 1));
//       [shuffledAds[i], shuffledAds[j]] = [shuffledAds[j], shuffledAds[i]];
//     }

//     let adIndex = 0;

//     cards.forEach((card, i) => {
//       if ((i + 1) % 4 !== 0) return;

//       const ad = shuffledAds[adIndex % shuffledAds.length];
//       adIndex++;

//       const box = document.createElement("div");
//       box.className = "grid-ad-box tilt-card";

//       const inner = document.createElement("div");
//       inner.className = "ad-tilt-inner";

//       const link = document.createElement("a");
//       link.href = ad.link;
//       link.target = "_blank";
//       link.rel = "noopener noreferrer";
//       link.className = "ad-link";

//       const media = document.createElement("div");
//       media.className = "ad-media";

//       if (ad.img) {
//         const img = document.createElement("img");
//         img.src = ad.img;
//         img.alt = ad.title || "إعلان";
//         img.loading = "lazy";
//         img.decoding = "async";
//         media.appendChild(img);
//       }

//       link.appendChild(media);

//       if (ad.title || ad.desc || ad.cta) {
//         const body = document.createElement("div");
//         body.className = "ad-body";

//         if (ad.title) {
//           const title = document.createElement("h4");
//           title.textContent = ad.title;
//           body.appendChild(title);
//         }

//         if (ad.desc) {
//           const desc = document.createElement("p");
//           desc.textContent = ad.desc;
//           body.appendChild(desc);
//         }

//         if (ad.cta) {
//           const cta = document.createElement("button");
//           cta.type = "button";
//           cta.className = "ad-cta";
//           cta.textContent = ad.cta;
//           cta.style.pointerEvents = "none";
//           body.appendChild(cta);
//         }

//         link.appendChild(body);
//       }

//       const badge = document.createElement("span");
//       badge.className = "ad-badge";
//       badge.textContent = "📢 إعلان";
//       link.appendChild(badge);

//       inner.appendChild(link);
//       box.appendChild(inner);

//       card.insertAdjacentElement("afterend", box);
//     });

//     grid.dataset.gridAdsInjected = "true";
//   });
// }
