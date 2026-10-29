
import {
  db,
  collection,
  addDoc,
  serverTimestamp,
} from "/js/firebase.js";

const EVENTS_COLLECTION = "adEvents";

// منع تسجيل الظهور أكثر من مرة لنفس العنصر أثناء تحميل الصفحة
const observedElements = new WeakSet();

// تقليل تكرار النقرات المتتالية على نفس المساحة
const lastClicks = new Map();
const CLICK_COOLDOWN_MS = 3000;

async function recordAdEvent({ slotId, adType, eventType }) {
  if (!slotId || !["house", "advertiser"].includes(adType)) return;
  if (!["impression", "click"].includes(eventType)) return;

  try {
    await addDoc(collection(db, EVENTS_COLLECTION), {
      slotId,
      adType,
      eventType,
      pagePath: window.location.pathname.slice(0, 200),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("تعذر تسجيل إحصائية الإعلان:", error);
  }
}

function getAdData(element) {
  return {
    slotId: element.dataset.adSlot,
    // house = إعلان خاص بـ LOLME
    // advertiser = إعلان معلن خارجي
    adType: element.dataset.adType || "house",
  };
}

function setupImpressionTracking() {
  const banners = document.querySelectorAll("[data-ad-slot]");

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;

        const element = entry.target;

        // احتساب الظهور عندما يظهر 50% من المساحة على الأقل
        if (entry.intersectionRatio < 0.5) continue;

        if (!observedElements.has(element)) {
          observedElements.add(element);
          const { slotId, adType } = getAdData(element);

          void recordAdEvent({
            slotId,
            adType,
            eventType: "impression",
          });
        }

        observer.unobserve(element);
      }
    },
    {
      threshold: [0.5],
    }
  );

  banners.forEach((banner) => observer.observe(banner));
}

function setupClickTracking() {
  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target instanceof Element ? event.target : null;

      const link = target?.closest("[data-ad-booking-click]");
      if (!link) return;

      const slotId = link.dataset.adSlot;
      const adType = link.dataset.adType || "house";

      if (!slotId) return;

      const key = `${adType}:${slotId}`;
      const now = Date.now();
      const previousClick = lastClicks.get(key) || 0;

      if (now - previousClick < CLICK_COOLDOWN_MS) return;

      lastClicks.set(key, now);

      // لا نؤخر انتقال الزائر إلى واتساب
      void recordAdEvent({
        slotId,
        adType,
        eventType: "click",
      });
    },
    true
  );
}

function initAdAnalytics() {
  setupImpressionTracking();
  setupClickTracking();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdAnalytics, {
    once: true,
  });
} else {
  initAdAnalytics();
}
