// public/js/ad-analytics.js
import {
  db,
  collection,
  addDoc,
  serverTimestamp,
  functions,
  httpsCallable,
} from "/js/firebase.js";

const EVENTS_COLLECTION = "adEvents";
const CLICK_COOLDOWN_MS = 3000;

const trackAdEvent = httpsCallable(functions, "trackAdEvent");

const houseImpressions = new WeakSet();
const lastClicks = new Map();

// حالة ظهور كل إعلان داخل الصفحة.
const impressionStates = new WeakMap();

function getVisitorId() {
  const storageKey = "lolme_ad_visitor_id";

  try {
    let visitorId = localStorage.getItem(storageKey);

    if (!visitorId) {
      visitorId =
        typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : Array.from(
              crypto.getRandomValues(new Uint8Array(24)),
              (byte) => byte.toString(16).padStart(2, "0"),
            ).join("");

      localStorage.setItem(storageKey, visitorId);
    }

    return visitorId;
  } catch (error) {
    console.warn("تعذر إنشاء معرف الزائر:", error);
    return null;
  }
}

const visitorId = getVisitorId();

async function recordHouseAdEvent({ slotId, eventType }) {
  if (!slotId || !["impression", "click"].includes(eventType)) {
    return;
  }

  try {
    await addDoc(collection(db, EVENTS_COLLECTION), {
      slotId,
      adType: "house",
      eventType,
      pagePath: window.location.pathname.slice(0, 200),
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn("تعذر تسجيل إحصائية الإعلان الداخلي:", error);
  }
}

async function recordAdvertiserEvent({ campaignId, eventType }) {
  if (!campaignId || !visitorId) return;

  try {
    const result = await trackAdEvent({
      campaignId,
      eventType,
      visitorId,
      pagePath: window.location.pathname.slice(0, 200),
    });

    console.log("[AD DEBUG] Cloud Function response:", result.data);

    return result.data;
  } catch (error) {
    console.warn("تعذر تسجيل إحصائية حملة الإعلان:", error);
  }
}

function getAdData(element) {
  return {
    slotId: element.dataset.adSlot,
    adType: element.dataset.adType || "house",
    campaignId: element.dataset.adCampaignId || "",
  };
}

function processImpression(element) {
  if (element.dataset.adReady !== "true") return;

  const { slotId, adType, campaignId } = getAdData(element);

  if (adType === "advertiser") {
    if (!campaignId || !visitorId) return;

    void recordAdvertiserEvent({
      campaignId,
      eventType: "impression",
    });

    return;
  }

  if (adType === "house") {
    if (!slotId || houseImpressions.has(element)) return;

    houseImpressions.add(element);

    void recordHouseAdEvent({
      slotId,
      eventType: "impression",
    });
  }
}

function observeBanner(element) {
  if (!impressionObserver) return;

  impressionObserver.unobserve(element);
  impressionObserver.observe(element);
}

let impressionObserver = null;

function setupImpressionTracking() {
  if (!("IntersectionObserver" in window)) return;

  impressionObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const element = entry.target;

        let state = impressionStates.get(element);

        if (!state) {
          state = {
            timer: null,
            visible: false,
            counted: false,
          };

          impressionStates.set(element, state);
        }

        const qualifies =
          entry.isIntersecting &&
          entry.intersectionRatio >= 0.5 &&
          element.dataset.adReady === "true";

        if (!qualifies) {
          state.visible = false;

          if (state.timer !== null) {
            clearTimeout(state.timer);
            state.timer = null;
          }

          // السماح بمشاهدة جديدة عند ظهور الإعلان مرة أخرى.
          state.counted = false;

          continue;
        }

        state.visible = true;

        // لا نكرر المشاهدة ما دام الإعلان ظاهرًا.
        if (state.counted || state.timer !== null) continue;

        state.timer = setTimeout(() => {
          state.timer = null;

          if (!state.visible) return;
          if (element.dataset.adReady !== "true") return;

          state.counted = true;
          processImpression(element);
        }, 1000);
      }
    },
    {
      threshold: [0, 0.5],
    },
  );

  document.querySelectorAll("[data-ad-slot]").forEach((banner) => {
    impressionObserver.observe(banner);
  });
}

function setupCampaignMutationTracking() {
  const mutationObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.target instanceof Element &&
        mutation.target.matches("[data-ad-slot]")
      ) {
        observeBanner(mutation.target);
      }
    }
  });

  document.querySelectorAll("[data-ad-slot]").forEach((banner) => {
    mutationObserver.observe(banner, {
      attributes: true,
      attributeFilter: [
        "data-ad-type",
        "data-ad-campaign-id",
        "data-ad-ready",
      ],
    });
  });
}

function setupClickTracking() {
  document.addEventListener(
    "click",
    (event) => {
      const target =
        event.target instanceof Element ? event.target : null;

      if (!target) return;

      const advertiserLink = target.closest(
        "a[data-ad-campaign-click]",
      );

      if (advertiserLink) {
        const banner = advertiserLink.closest("[data-ad-slot]");

        if (!banner || banner.dataset.adReady !== "true") return;

        const { campaignId, adType } = getAdData(banner);

        if (adType !== "advertiser" || !campaignId) return;

        const key = `advertiser:${campaignId}`;
        const now = Date.now();
        const previousClick = lastClicks.get(key) || 0;

        if (now - previousClick < CLICK_COOLDOWN_MS) return;

        lastClicks.set(key, now);

        void recordAdvertiserEvent({
          campaignId,
          eventType: "click",
        });

        return;
      }

      const houseLink = target.closest(
        "a[data-ad-booking-click]",
      );

      if (!houseLink) return;

      const banner = houseLink.closest("[data-ad-slot]");

      if (!banner || banner.dataset.adReady !== "true") return;

      const { slotId, adType } = getAdData(banner);

      if (adType !== "house" || !slotId) return;

      const key = `house:${slotId}`;
      const now = Date.now();
      const previousClick = lastClicks.get(key) || 0;

      if (now - previousClick < CLICK_COOLDOWN_MS) return;

      lastClicks.set(key, now);

      void recordHouseAdEvent({
        slotId,
        eventType: "click",
      });
    },
    true,
  );
}

function initAdAnalytics() {
  setupImpressionTracking();
  setupCampaignMutationTracking();
  setupClickTracking();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdAnalytics, {
    once: true,
  });
} else {
  initAdAnalytics();
}