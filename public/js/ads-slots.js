// public/js/ads-slots.js
// شكل النظام بعد التعديل
// AdsInjector.astro
// يرسم المساحات والحاويات ورسائل الحجز.
// ads-slots.js
// يجلب الحملة النشطة من Firestore ويعرضها داخل المساحة.
// floating-ads-analytics.js
// يراقب ظهور الإعلان ويسجل النقرات مرة واحدة.
// trackAdEvent
// يتحقق من الحملة ويحفظ إحصائيات المعلن في Firestore.
import {
  db,
  collection,
  query,
  where,
  getDocs,
} from "./firebase.js";

const SLOT_IDS = ["floating-right", "floating-left", "floating-main"];

// الصفحات المسموح بعرض إعلانات المعلنين فيها
const ALLOWED_AD_PATHS = ["/", "/jokes", "/tests", "/community-jokes", "/submit-joke"];

function isAllowedAdPage() {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";

  return ALLOWED_AD_PATHS.includes(path) || path.startsWith("/tests/");
}

// التحقق من الروابط
function safeUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const url = new URL(value, window.location.origin);

    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

// التحقق من نشاط الحملة
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

// حماية النصوص من HTML
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

// بناء الإعلان
function campaignMarkup(campaign, campaignId) {
  const targetUrl = safeUrl(campaign.targetUrl);

  const images =
    Array.isArray(campaign.imageUrls) && campaign.imageUrls.length
      ? campaign.imageUrls
      : campaign.imageUrl
        ? [campaign.imageUrl]
        : [];

  const image = images.map(safeUrl).find(Boolean);

  if (!targetUrl || !image) {
    throw new Error("رابط الإعلان أو صورته غير صالحة.");
  }

  const title = campaign.headline || campaign.advertiserName || "إعلان";
  const desc = campaign.description || "";
  const cta = campaign.buttonText || "اعرف المزيد";

  return `
    <div
      class="ad-wrapper ad-tilt in-content-ad-box grid-ad-box"
      data-ad-id="${escapeHtml(campaignId)}"
      data-ad-slot="${escapeHtml(campaign.slotId)}"
      data-ad-type="advertiser"
      data-ad-campaign-id="${escapeHtml(campaignId)}"
      data-closeable="0"
    >
      <a
        href="${escapeHtml(targetUrl)}"
        target="_blank"
        rel="noopener noreferrer"
        class="ad-link"
        data-ad-campaign-click="true"
        data-ad-campaign-id="${escapeHtml(campaignId)}"
        data-ad-slot-id="${escapeHtml(campaign.slotId)}"
      >
        <div class="ad-media">
          <img
            src="${escapeHtml(image)}"
            alt="${escapeHtml(title)}"
            loading="lazy"
            decoding="async"
          />
        </div>

        ${
          title || desc || cta
            ? `
              <div class="ad-body">
                ${title ? `<h4>${escapeHtml(title)}</h4>` : ""}
                ${desc ? `<p>${escapeHtml(desc)}</p>` : ""}
                ${
                  cta
                    ? `<button type="button" class="ad-cta" tabindex="-1">${escapeHtml(cta)}</button>`
                    : ""
                }
              </div>
            `
            : ""
        }

        <span class="ad-badge">📢 إعلان</span>
      </a>
    </div>
  `;
}

// تحميل حملة المساحة
async function loadSlotCampaign(slotId) {
  const container = document.querySelector(`[data-ad-slot="${slotId}"]`);

  if (!container || container.dataset.campaignLoaded === "true") {
    return;
  }

  container.dataset.campaignLoaded = "true";

  try {
    const campaignsQuery = query(
      collection(db, "adCampaigns"),
      where("slotId", "==", slotId),
      where("status", "==", "active"),
    );

    const snapshot = await getDocs(campaignsQuery);

    const campaigns = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter(isActive)
      .sort(
        (a, b) =>
          (b.createdAt?.toDate?.()?.getTime() || 0) -
          (a.createdAt?.toDate?.()?.getTime() || 0),
      );

    if (!campaigns.length) {
      container.dataset.adType = "reservation";
      container.dataset.adReady = "true";
      return;
    }

    // اختيار أحدث حملة نشطة
    const campaign = campaigns[0];

    const wrapper = container.querySelector(
      "[data-side-ad], [data-floating-ad]",
    );

    if (!wrapper) return;

    wrapper.innerHTML = campaignMarkup(campaign, campaign.id);

    wrapper.classList.remove("floating-fallback");

    container.dataset.adType = "advertiser";
    container.dataset.adCampaignId = campaign.id;
    container.dataset.adReady = "true";

    container.classList.remove("side-random-pending", "floating-pending");
  } catch (error) {
    console.error(`[LOLME Ads] فشل تحميل ${slotId}:`, error);

    container.dataset.adReady = "true";

    // تظل رسالة الحجز الاحتياطية ظاهرة عند الفشل
  }
}

// الإعلان الترويجي المستقل
function setupPromoFloatingAd() {
  const ad = document.getElementById("mobile-floating-ad");

  if (!ad || ad.dataset.initialized === "1") {
    return;
  }

  ad.dataset.initialized = "1";

  const closedKey = "lolme-promo-floating-closed";

  try {
    if (sessionStorage.getItem(closedKey) === "1") {
      return;
    }
  } catch {}

  ad.querySelector(".promo-floating-ad__close")?.addEventListener(
    "click",
    () => {
      try {
        sessionStorage.setItem(closedKey, "1");
      } catch {}

      ad.classList.remove("is-visible");
      ad.classList.add("is-closing");

      ad.addEventListener("animationend", () => ad.remove(), { once: true });
    },
  );

  window.setTimeout(() => {
    if (ad.isConnected) {
      ad.classList.add("is-visible");
    }
  }, 1800);
}

// تشغيل النظام
function init() {
  // الصفحات غير المسموح بها: إزالة المساحات الإعلانية بالكامل
  if (!isAllowedAdPage()) {
    document
      .querySelectorAll(
        ".ad-right, .ad-left, .ad-floating, #mobile-floating-ad"
      )
      .forEach((element) => element.remove());

    return;
  }

  // الصفحات المسموح بها فقط
  setupPromoFloatingAd();

  SLOT_IDS.forEach((slotId) => {
    void loadSlotCampaign(slotId);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
