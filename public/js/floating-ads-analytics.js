// public/js/floating-ads-analytics.js
import { functions, httpsCallable } from "/js/firebase.js";

const trackFloatingAdEvent = httpsCallable(
  functions,
  "trackFloatingAdEvent",
);

const trackAdEvent = httpsCallable(functions, "trackAdEvent");

const FLOATING_SELECTOR = [
  ".ad-right[data-ad-slot]",
  ".ad-left[data-ad-slot]",
  ".ad-floating[data-ad-slot]",
].join(", ");

const trackedImpressions = new WeakSet();
const pendingTimers = new WeakMap();

function getVisitorId() {
  const key = "lolme-floating-visitor-id";

  try {
    let id = localStorage.getItem(key);

    if (!id) {
      id = crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      localStorage.setItem(key, id);
    }

    return id;
  } catch {
    return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

const visitorId = getVisitorId();

// قراءة بيانات الإعلان من العنصر الداخلي أولاً
function getAdData(container) {
  const adElement = container.querySelector(
    ".ad-wrapper[data-ad-id]",
  );

  return {
    slotId:
      adElement?.dataset.adSlot ||
      container.dataset.adSlot ||
      "",

    adType:
      adElement?.dataset.adType ||
      container.dataset.adType ||
      "house",

    campaignId:
      adElement?.dataset.adCampaignId ||
      container.dataset.adCampaignId ||
      "",

    adId: adElement?.dataset.adId || "",

    pagePath: window.location.pathname,
  };
}

async function sendEvent(container, eventType) {
  const data = getAdData(container);

  if (!data.slotId || !data.adId) return;

  try {
    // إعلانات المعلنين: نفس نظام إحصائيات النكت
    if (data.adType === "advertiser") {
      if (!data.campaignId) {
        console.warn(
          "[Floating Ads] Missing campaignId",
          data.slotId,
        );
        return;
      }

      await trackAdEvent({
        campaignId: data.campaignId,
        eventType,
        visitorId,
        pagePath: data.pagePath,
      });

      return;
    }

    // الإعلانات الداخلية: نحافظ على نظامها الحالي
    await trackFloatingAdEvent({
      slotId: data.slotId,
      adId: data.adId,
      eventType,
      visitorId,
      pagePath: data.pagePath,
    });
  } catch (error) {
    console.error("[Floating Ads Analytics]", error);
  }
}

// تسجيل الظهور بعد مشاهدة 50% لمدة ثانية
function processImpression(container) {
  if (
    !container.isConnected ||
    container.dataset.adReady !== "true" ||
    trackedImpressions.has(container)
  ) {
    return;
  }

  const data = getAdData(container);

  if (!data.adId || !data.slotId) return;

  trackedImpressions.add(container);
  sendEvent(container, "impression");
}

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const container = entry.target;

      if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
        if (trackedImpressions.has(container)) return;

        if (!pendingTimers.has(container)) {
          const timer = setTimeout(() => {
            pendingTimers.delete(container);

            const rect = container.getBoundingClientRect();

            const visibleHeight =
              Math.min(rect.bottom, window.innerHeight) -
              Math.max(rect.top, 0);

            const visibleWidth =
              Math.min(rect.right, window.innerWidth) -
              Math.max(rect.left, 0);

            const visible =
              visibleHeight > 0 &&
              visibleWidth > 0 &&
              container.dataset.adReady === "true";

            if (visible) {
              processImpression(container);
            }
          }, 1000);

          pendingTimers.set(container, timer);
        }
      } else {
        const timer = pendingTimers.get(container);

        if (timer) {
          clearTimeout(timer);
          pendingTimers.delete(container);
        }
      }
    });
  },
  {
    threshold: [0, 0.5, 1],
  },
);

function observeFloatingAds() {
  document.querySelectorAll(FLOATING_SELECTOR).forEach((container) => {
    observer.observe(container);
  });
}

// تسجيل النقرات
document.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof Element)) return;

  const link = target.closest("a");
  if (!link) return;

  const container = link.closest(FLOATING_SELECTOR);
  if (!container) return;

  const isHouseClick =
    link.dataset.adBookingClick === "true";

  const isAdvertiserClick =
    link.dataset.adCampaignClick !== undefined;

  if (!isHouseClick && !isAdvertiserClick) return;

  sendEvent(container, "click");
});

// مراقبة جاهزية الإعلان
const mutationObserver = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (
      mutation.type === "attributes" &&
      mutation.attributeName === "data-ad-ready"
    ) {
      const container = mutation.target;

      if (container.matches?.(FLOATING_SELECTOR)) {
        if (container.dataset.adReady === "true") {
          observer.observe(container);
        }
      }
    }
  }
});

function init() {
  observeFloatingAds();

  document.querySelectorAll(FLOATING_SELECTOR).forEach((container) => {
    mutationObserver.observe(container, {
      attributes: true,
      attributeFilter: ["data-ad-ready"],
    });
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}
