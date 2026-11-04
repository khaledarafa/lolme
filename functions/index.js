const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue,
  Timestamp,
} = require("firebase-admin/firestore");
const { createHash } = require("crypto");

const { BetaAnalyticsDataClient } = require("@google-analytics/data");

const analyticsDataClient = new BetaAnalyticsDataClient();

const GA4_PROPERTY_ID = "508035818";

setGlobalOptions({ maxInstances: 10 });

initializeApp();

const db = getFirestore();

const SITE_SECTIONS = ["home", "jokes", "tests"];

/**
 * Normalizes a page path by removing query strings and trailing slashes.
 *
 * @param {string} path - The original page path.
 * @return {string|null} The normalized path or null if invalid.
 */
function normalizeSitePath(path) {
  if (typeof path !== "string") return null;

  let normalized = path.split("?")[0].split("#")[0].trim();

  if (!normalized.startsWith("/")) return null;

  if (normalized.length > 300) return null;

  if (normalized.length > 1) {
    normalized = normalized.replace(/\/+$/, "");
  }

  return normalized;
}

/**
 * Validates a page path against the allowed analytics sections.
 *
 * @param {string} pageType - The analytics section.
 * @param {string} path - The requested page path.
 * @return {string|null} The validated path or null if invalid.
 */
function validateSitePage(pageType, path) {
  const normalizedPath = normalizeSitePath(path);

  if (!normalizedPath || !SITE_SECTIONS.includes(pageType)) {
    return null;
  }

  if (pageType === "home" && normalizedPath !== "/") {
    return null;
  }

  if (pageType === "jokes" && normalizedPath !== "/jokes") {
    return null;
  }

  if (
    pageType === "tests" &&
    normalizedPath !== "/tests" &&
    !normalizedPath.startsWith("/tests/")
  ) {
    return null;
  }

  return normalizedPath;
}

/**
 * Returns public GA4 statistics for the last 30 complete days.
 * Results are cached in Firestore for 15 minutes.
 */
exports.getGa4PublicStats = onCall(async () => {
  const cacheRef = db.collection("siteStats").doc("ga4_public_cache");
  const cacheSnap = await cacheRef.get();

  // Reuse cached data for 15 minutes.
  if (cacheSnap.exists) {
    const cached = cacheSnap.data();
    const updatedAt = cached.updatedAt?.toMillis?.() || 0;

    if (cached.stats && Date.now() - updatedAt < 15 * 60 * 1000) {
      return cached.stats;
    }
  }

  try {
    const property = `properties/${GA4_PROPERTY_ID}`;

    // Main audience report.
    const [summaryResponse] = await analyticsDataClient.runReport({
      property,
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "yesterday",
        },
      ],
      metrics: [
        { name: "activeUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
        { name: "newUsers" },
      ],
    });

    // Page views by page path.
    const [pagesResponse] = await analyticsDataClient.runReport({
      property,
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "yesterday",
        },
      ],
      dimensions: [{ name: "pagePath" }],
      metrics: [{ name: "screenPageViews" }],
      orderBys: [
        {
          metric: { metricName: "screenPageViews" },
          desc: true,
        },
      ],
      limit: 1000,
    });

    const summary = summaryResponse.rows?.[0]?.metricValues || [];

    const activeUsers = Number(summary[0]?.value || 0);
    const sessions = Number(summary[1]?.value || 0);
    const pageViews = Number(summary[2]?.value || 0);
    const newUsers = Number(summary[3]?.value || 0);

    const pages = (pagesResponse.rows || []).map((row) => ({
      path: row.dimensionValues?.[0]?.value || "/",
      pageViews: Number(row.metricValues?.[0]?.value || 0),
    }));

    const sections = {
      home: 0,
      jokes: 0,
      tests: 0,
    };

    for (const page of pages) {
      const path = page.path.replace(/\/+$/, "") || "/";

      if (path === "/") {
        sections.home += page.pageViews;
      } else if (path === "/jokes") {
        sections.jokes += page.pageViews;
      } else if (path === "/tests" || path.startsWith("/tests/")) {
        sections.tests += page.pageViews;
      }
    }

    const topTests = pages
      .filter((page) => page.path.startsWith("/tests/"))
      .slice(0, 10);

    const stats = {
      period: "آخر 30 يومًا مكتملًا",
      activeUsers,
      sessions,
      pageViews,
      newUsers,
      sections,
      topPages: pages.slice(0, 10),
      topTests,
      updatedAt: new Date().toISOString(),
    };

    await cacheRef.set({
      stats,
      updatedAt: Timestamp.now(),
    });

    return stats;
  } catch (error) {
    console.error("GA4 public statistics error:", error);

    throw new HttpsError(
      "internal",
      "تعذر تحميل إحصائيات Google Analytics حاليًا.",
    );
  }
});

/**
 * ربط الحملات القديمة بحساب الأدمن الحالي.
 * هذه الوظيفة مخصصة لعملية ترحيل الحملات القديمة.
 */
exports.linkLegacyCampaignsToAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
  }

  if (request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "هذه العملية للأدمن فقط.");
  }

  if (request.auth.token.email_verified !== true) {
    throw new HttpsError(
      "failed-precondition",
      "يجب التحقق من البريد الإلكتروني أولاً.",
    );
  }

  const uid = request.auth.uid;
  const email = String(request.auth.token.email || "")
    .trim()
    .toLowerCase();

  const snapshot = await db.collection("adCampaigns").get();

  const unassigned = snapshot.docs.filter((campaignDoc) => {
    const data = campaignDoc.data();

    if (data.advertiserUid) {
      return false;
    }

    const campaignEmail = String(data.advertiserEmail || "")
      .trim()
      .toLowerCase();

    return !campaignEmail || campaignEmail === email;
  });

  if (unassigned.length > 450) {
    throw new HttpsError(
      "resource-exhausted",
      "عدد الحملات كبير، نحتاج تقسيم عملية الربط.",
    );
  }

  if (unassigned.length === 0) {
    return { success: true, linkedCount: 0 };
  }

  const batch = db.batch();

  for (const campaignDoc of unassigned) {
    batch.update(campaignDoc.ref, {
      advertiserUid: uid,
      advertiserLinkedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  return {
    success: true,
    linkedCount: unassigned.length,
  };
});

/**
 * ربط الحملات الجديدة بحساب المعلن بعد التحقق من البريد.
 */
exports.linkAdvertiserCampaigns = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
  }

  if (request.auth.token.email_verified !== true) {
    throw new HttpsError(
      "failed-precondition",
      "يجب التحقق من بريدك الإلكتروني أولاً.",
    );
  }

  const uid = request.auth.uid;
  const email = String(request.auth.token.email || "")
    .trim()
    .toLowerCase();

  if (!email) {
    throw new HttpsError(
      "failed-precondition",
      "لا يوجد بريد إلكتروني مرتبط بالحساب.",
    );
  }

  const snapshot = await db.collection("adCampaigns").get();

  const unassigned = snapshot.docs.filter((campaignDoc) => {
    const data = campaignDoc.data();

    const campaignEmail = String(data.advertiserEmail || "")
      .trim()
      .toLowerCase();

    return !data.advertiserUid && campaignEmail === email;
  });

  if (unassigned.length > 450) {
    throw new HttpsError(
      "resource-exhausted",
      "عدد الحملات كبير، نحتاج تقسيم عملية الربط.",
    );
  }

  if (unassigned.length === 0) {
    return { success: true, linkedCount: 0 };
  }

  const batch = db.batch();

  for (const campaignDoc of unassigned) {
    batch.update(campaignDoc.ref, {
      advertiserUid: uid,
      advertiserLinkedAt: FieldValue.serverTimestamp(),
    });
  }

  await batch.commit();

  return {
    success: true,
    linkedCount: unassigned.length,
  };
});

/**
 * تسجيل مرات ظهور الإعلان والنقرات.
 *
 * impressions:
 * كل مشاهدة مستوفية للشروط تُحسب.
 *
 * uniqueVisitors:
 * كل زائر يُحسب مرة واحدة طوال الحملة.
 *
 * clicks:
 * منع تكرار النقرات خلال 10 ثوانٍ.
 */
exports.trackAdEvent = onCall({ maxInstances: 10 }, async (request) => {
  const data = request.data || {};

  const campaignId = data.campaignId;
  const eventType = data.eventType;
  const visitorId = data.visitorId;
  const pagePath = data.pagePath;

  const countryCode =
    typeof data.countryCode === "string" && /^[A-Z]{2}$/.test(data.countryCode)
      ? data.countryCode
      : "XX";

  if (
    typeof campaignId !== "string" ||
    !/^[a-zA-Z0-9_-]{1,150}$/.test(campaignId) ||
    !["impression", "click"].includes(eventType) ||
    typeof visitorId !== "string" ||
    !/^[a-zA-Z0-9_-]{20,100}$/.test(visitorId) ||
    typeof pagePath !== "string" ||
    pagePath.length > 200 ||
    !pagePath.startsWith("/")
  ) {
    throw new HttpsError("invalid-argument", "بيانات الحدث غير صحيحة.");
  }

  const campaignRef = db.collection("adCampaigns").doc(campaignId);
  const campaignSnap = await campaignRef.get();

  if (!campaignSnap.exists) {
    throw new HttpsError("not-found", "الحملة غير موجودة.");
  }

  const campaign = campaignSnap.data();
  const now = Date.now();

  const start =
    campaign.startAt && typeof campaign.startAt.toMillis === "function"
      ? campaign.startAt.toMillis()
      : null;

  const end =
    campaign.endAt && typeof campaign.endAt.toMillis === "function"
      ? campaign.endAt.toMillis()
      : null;

  if (
    campaign.status !== "active" ||
    !campaign.advertiserUid ||
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start > now ||
    end <= now
  ) {
    throw new HttpsError("failed-precondition", "الحملة غير نشطة حاليًا.");
  }

  // تاريخ اليوم بتوقيت UTC.
  const day = new Date().toISOString().slice(0, 10);

  // بصمة الزائر على مستوى الحملة.
  const visitorHash = createHash("sha256")
    .update(`${campaignId}:${visitorId}`)
    .digest("hex");

  // مفتاح ثابت لكل صفحة داخل الحملة.
  const placementKey = createHash("sha256")
    .update(pagePath)
    .digest("hex")
    .slice(0, 20);

  // سجل الزائر على مستوى الحملة.
  const visitorRef = db
    .collection("adCampaignStats")
    .doc(campaignId)
    .collection("visitors")
    .doc(visitorHash);

  // سجل منع تكرار النقرات.
  const guardRef = db.collection("adEventGuards").doc(`${visitorHash}_click`);

  // إحصائيات الحملة الإجمالية.
  const campaignStatsRef = db.collection("adCampaignStats").doc(campaignId);

  const countryStatsRef = campaignStatsRef
    .collection("countries")
    .doc(countryCode);

  // إحصائيات اليوم.
  const dailyStatsRef = campaignStatsRef.collection("days").doc(day);

  // سجل الحدث.
  const eventRef = db.collection("adEvents").doc();

  const result = await db.runTransaction(async (transaction) => {
    let visitorSnap = null;
    let guardSnap = null;

    // أولاً: قراءة البيانات المطلوبة.
    if (eventType === "impression") {
      visitorSnap = await transaction.get(visitorRef);
    } else {
      guardSnap = await transaction.get(guardRef);
    }

    // منع تكرار النقرات خلال 10 ثوانٍ.
    if (eventType === "click" && guardSnap.exists) {
      const guardData = guardSnap.data();
      const lastEvent = guardData.lastEventAt?.toMillis?.() || 0;

      if (now - lastEvent < 10000) {
        return {
          recorded: false,
          reason: "cooldown",
        };
      }
    }

    const increment = FieldValue.increment(1);

    const baseUpdates = {
      campaignId,
      slotId: campaign.slotId,
      advertiserUid: campaign.advertiserUid,
      updatedAt: FieldValue.serverTimestamp(),
    };

    const dailyUpdates = {
      ...baseUpdates,
      date: day,
    };

    const placementUpdates = {
      pagePath,
    };

    // إحصائيات الدولة.
    const countryUpdates = {
      campaignId,
      advertiserUid: campaign.advertiserUid,
      countryCode,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (eventType === "impression") {
      dailyUpdates.impressions = increment;
      countryUpdates.impressions = increment;

      // أول مشاهدة لهذا الزائر في الحملة بالكامل.
      if (!visitorSnap.exists) {
        dailyUpdates.uniqueVisitors = increment;
        countryUpdates.uniqueVisitors = increment;

        transaction.create(visitorRef, {
          countryCode,
          createdAt: FieldValue.serverTimestamp(),
        });

        transaction.set(
          campaignStatsRef,
          {
            ...baseUpdates,
            uniqueVisitors: increment,
          },
          { merge: true },
        );
      }

      placementUpdates.impressions = increment;
    } else {
      dailyUpdates.clicks = increment;
      countryUpdates.clicks = increment;

      transaction.set(guardRef, {
        lastEventAt: FieldValue.serverTimestamp(),
      });

      placementUpdates.clicks = increment;
    }

    dailyUpdates.placements = {
      [placementKey]: placementUpdates,
    };

    // حفظ إحصائيات الدولة.
    transaction.set(countryStatsRef, countryUpdates, {
      merge: true,
    });

    // حفظ الإحصائيات اليومية.
    transaction.set(dailyStatsRef, dailyUpdates, {
      merge: true,
    });

    // حفظ سجل الحدث.
    transaction.create(eventRef, {
      campaignId,
      advertiserUid: campaign.advertiserUid,
      slotId: campaign.slotId,
      eventType,
      pagePath,
      countryCode,
      visitorHash,
      placementKey,
      createdAt: FieldValue.serverTimestamp(),
    });

    return { recorded: true };
  });

  return {
    success: true,
    recorded: result.recorded,
    reason: result.reason || null,
  };
});

/**
 * إرجاع لوحة إحصائيات المعلن الحالي فقط.
 */

exports.getAdvertiserDashboard = onCall(
  { maxInstances: 10 },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
    }

    if (request.auth.token.email_verified !== true) {
      throw new HttpsError(
        "failed-precondition",
        "يجب التحقق من البريد الإلكتروني أولاً.",
      );
    }

    const uid = request.auth.uid;

    const snapshot = await db
      .collection("adCampaigns")
      .where("advertiserUid", "==", uid)
      .get();

    const campaigns = await Promise.all(
      snapshot.docs.map(async (campaignDoc) => {
        const campaign = campaignDoc.data();

        const campaignStatsRef = db
          .collection("adCampaignStats")
          .doc(campaignDoc.id);

        // قراءة الإحصائيات الإجمالية واليومية وإحصائيات الدول
        const [campaignStatsSnap, daysSnapshot, countriesSnapshot] =
          await Promise.all([
            campaignStatsRef.get(),
            campaignStatsRef.collection("days").get(),
            campaignStatsRef.collection("countries").get(),
          ]);

        const campaignStats = campaignStatsSnap.exists
          ? campaignStatsSnap.data()
          : {};

        let impressions = 0;
        let clicks = 0;

        // تجميع إحصائيات كل صفحة على حدة
        const placementsMap = new Map();

        const dailyStats = daysSnapshot.docs
          .map((dayDoc) => {
            const data = dayDoc.data();

            const dayImpressions = Number(data.impressions) || 0;
            const dayClicks = Number(data.clicks) || 0;
            const dayUniqueVisitors = Number(data.uniqueVisitors) || 0;

            impressions += dayImpressions;
            clicks += dayClicks;

            // قراءة إحصائيات أماكن ظهور الإعلان داخل اليوم
            const dailyPlacements = data.placements || {};

            for (const placement of Object.values(dailyPlacements)) {
              const pagePath = placement.pagePath || "/";

              if (!placementsMap.has(pagePath)) {
                placementsMap.set(pagePath, {
                  pagePath,
                  impressions: 0,
                  clicks: 0,
                });
              }

              const item = placementsMap.get(pagePath);

              item.impressions += Number(placement.impressions) || 0;
              item.clicks += Number(placement.clicks) || 0;
            }

            return {
              date: dayDoc.id,
              impressions: dayImpressions,
              uniqueVisitors: dayUniqueVisitors,
              clicks: dayClicks,
            };
          })
          .sort((a, b) => a.date.localeCompare(b.date));

        // تحويل إحصائيات الصفحات إلى مصفوفة جاهزة للواجهة
        const placements = Array.from(placementsMap.values())
          .map((item) => ({
            pagePath: item.pagePath,
            impressions: item.impressions,
            clicks: item.clicks,
            uniqueVisitors: null,
            ctr:
              item.impressions > 0
                ? Number(((item.clicks / item.impressions) * 100).toFixed(2))
                : 0,
          }))
          .sort((a, b) => b.impressions - a.impressions);

        // إحصائيات الجمهور حسب الدولة
        const countries = countriesSnapshot.docs
          .map((countryDoc) => {
            const data = countryDoc.data();

            return {
              countryCode: countryDoc.id,
              impressions: Number(data.impressions) || 0,
              uniqueVisitors: Number(data.uniqueVisitors) || 0,
              clicks: Number(data.clicks) || 0,
            };
          })
          .sort((a, b) => b.impressions - a.impressions);

        const uniqueVisitors = Number(campaignStats.uniqueVisitors) || 0;

        return {
          id: campaignDoc.id,
          advertiserName: campaign.advertiserName || "",
          slotId: campaign.slotId || "",
          status: campaign.status || "paused",
          headline: campaign.headline || "",
          startAt: campaign.startAt?.toMillis?.() ?? null,
          endAt: campaign.endAt?.toMillis?.() ?? null,

          // البيانات المالية للحملة
          monthlyPrice: Number(campaign.monthlyPrice) || 0,
          durationDays:
            Number(campaign.durationDays) ||
            (campaign.startAt && campaign.endAt
              ? Math.ceil(
                  (campaign.endAt.toMillis() - campaign.startAt.toMillis()) /
                    86400000,
                )
              : 0),
          totalPrice: Number(campaign.totalPrice) || 0,
          paidAmount: Number(campaign.paidAmount) || 0,
          paymentStatus: campaign.paymentStatus || "unpaid",
          paymentMethod: campaign.paymentMethod || "",
          paidAt: campaign.paidAt
            ? typeof campaign.paidAt.toMillis === "function"
              ? campaign.paidAt.toMillis()
              : new Date(campaign.paidAt).getTime()
            : null,

          // إجمالي إحصائيات الحملة
          impressions,
          uniqueVisitors,
          clicks,
          ctr:
            impressions > 0
              ? Number(((clicks / impressions) * 100).toFixed(2))
              : 0,

          // الإحصائيات اليومية
          dailyStats,

          // إحصائيات كل صفحة على حدة
          placements,

          // إحصائيات الجمهور حسب الدولة
          countries,
        };
      }),
    );

    // ترتيب الحملات من الأحدث إلى الأقدم
    campaigns.sort((a, b) => (b.startAt || 0) - (a.startAt || 0));

    // إجمالي إحصائيات كل الحملات
    const totals = campaigns.reduce(
      (result, campaign) => {
        result.impressions += campaign.impressions;
        result.uniqueVisitors += campaign.uniqueVisitors;
        result.clicks += campaign.clicks;
        return result;
      },
      {
        impressions: 0,
        uniqueVisitors: 0,
        clicks: 0,
      },
    );

    totals.ctr =
      totals.impressions > 0
        ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2))
        : 0;

    return {
      success: true,
      advertiserEmail: request.auth.token.email || "",
      campaigns,
      totals,
    };
  },
);
