const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { onSchedule } = require("firebase-functions/v2/scheduler");
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

/**
 * البحث عن حساب المعلن بالبريد الإلكتروني.
 * متاحة للأدمن فقط.
 */
// exports.findAdvertiserByEmail = onCall(
//   {
//     cors: [
//       "http://localhost:4321",
//       "https://lolme.cc",
//       "https://www.lolme.cc"
//     ]
//   },
//   async (request) => {

exports.findAdvertiserByEmail = onCall(async (request) => {
  // التأكد من تسجيل الدخول
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
  }

  // التأكد من صلاحية الأدمن
  if (request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "هذه العملية للأدمن فقط.");
  }

  const email = String(request.data?.email || "")
    .trim()
    .toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new HttpsError("invalid-argument", "البريد الإلكتروني غير صحيح.");
  }

  try {
    const user = await getAuth().getUserByEmail(email);

    return {
      success: true,
      uid: user.uid,
      email: user.email || email,
      displayName: user.displayName || "",
      emailVerified: user.emailVerified,
    };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      throw new HttpsError(
        "not-found",
        "لا يوجد حساب مسجل بهذا البريد الإلكتروني.",
      );
    }

    console.error("Find advertiser error:", error);

    throw new HttpsError("internal", "حدث خطأ أثناء البحث عن حساب المعلن.");
  }
});

/**
 * Normalizes a page path by removing query strings and trailing slashes.
 *
 * @param {string} path - The original page path.
 * @return {string|null} The normalized path or null if invalid.
 */
// function normalizeSitePath(path) {
//   if (typeof path !== "string") return null;

//   let normalized = path.split("?")[0].split("#")[0].trim();

//   if (!normalized.startsWith("/")) return null;

//   if (normalized.length > 300) return null;

//   if (normalized.length > 1) {
//     normalized = normalized.replace(/\/+$/, "");
//   }

//   return normalized;
// }

/**
 * Validates a page path against the allowed analytics sections.
 *
 * @param {string} pageType - The analytics section.
 * @param {string} path - The requested page path.
 * @return {string|null} The validated path or null if invalid.
 */
// function validateSitePage(pageType, path) {
//   const normalizedPath = normalizeSitePath(path);

//   if (!normalizedPath || !SITE_SECTIONS.includes(pageType)) {
//     return null;
//   }

//   if (pageType === "home" && normalizedPath !== "/") {
//     return null;
//   }

//   if (pageType === "jokes" && normalizedPath !== "/jokes") {
//     return null;
//   }

//   if (
//     pageType === "tests" &&
//     normalizedPath !== "/tests" &&
//     !normalizedPath.startsWith("/tests/")
//   ) {
//     return null;
//   }

//   return normalizedPath;
// }

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

    // الجمهور حسب الدولة - آخر 30 يومًا
    const [countriesResponse] = await analyticsDataClient.runReport({
      property,
      dateRanges: [
        {
          startDate: "30daysAgo",
          endDate: "yesterday",
        },
      ],
      dimensions: [{ name: "country" }],
      metrics: [{ name: "activeUsers" }],
      orderBys: [
        {
          metric: { metricName: "activeUsers" },
          desc: true,
        },
      ],
      limit: 250000,
    });

    const summary = summaryResponse.rows?.[0]?.metricValues || [];

    const activeUsers = Number(summary[0]?.value || 0);
    const sessions = Number(summary[1]?.value || 0);
    const pageViews = Number(summary[2]?.value || 0);
    const newUsers = Number(summary[3]?.value || 0);

    const countries = (countriesResponse.rows || [])
      .map((row) => ({
        country: row.dimensionValues?.[0]?.value || "غير محدد",
        activeUsers: Number(row.metricValues?.[0]?.value || 0),
      }))
      .filter((item) => item.country !== "(not set)")
      .sort((a, b) => b.activeUsers - a.activeUsers);

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
      countries,
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
  // التحقق من أن الحدث صادر من صفحة مسموح بها
  const normalizedPath =
    pagePath.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

  const allowedAdPage =
    normalizedPath === "/" ||
    normalizedPath === "/jokes" ||
    normalizedPath === "/community-jokes" ||
    normalizedPath === "/tests" ||
    normalizedPath.startsWith("/tests/");

  if (!allowedAdPage) {
    return {
      success: true,
      recorded: false,
      reason: "page-not-allowed",
    };
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
 * تسجيل إحصائيات المساحات الإعلانية العائمة الثلاث.
 * لا يعتمد على تسجيل دخول الزائر.
 */
exports.trackFloatingAdEvent = onCall({ maxInstances: 10 }, async (request) => {
  const data = request.data || {};

  const { slotId, adId, eventType, visitorId, pagePath } = data;

  const allowedSlots = ["floating-right", "floating-left", "floating-main"];

  if (
    !allowedSlots.includes(slotId) ||
    !["impression", "click"].includes(eventType) ||
    typeof visitorId !== "string" ||
    !/^[a-zA-Z0-9_-]{20,100}$/.test(visitorId) ||
    typeof pagePath !== "string" ||
    pagePath.length > 200 ||
    !pagePath.startsWith("/") ||
    (adId !== undefined && (typeof adId !== "string" || adId.length > 150))
  ) {
    throw new HttpsError(
      "invalid-argument",
      "بيانات الإعلان العائم غير صحيحة.",
    );
  }

  // التحقق من أن الحدث صادر من صفحة مسموح بها
  const normalizedPath =
    pagePath.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";

  const allowedAdPage =
    normalizedPath === "/" ||
    normalizedPath === "/jokes" ||
    normalizedPath === "/tests" ||
    normalizedPath.startsWith("/tests/");

  if (!allowedAdPage) {
    return {
      success: true,
      recorded: false,
      reason: "page-not-allowed",
    };
  }
  const safeAdId = adId || null;
  const now = Date.now();
  const day = new Date().toISOString().slice(0, 10);

  // تشفير هوية الزائر قبل تخزينها.
  const visitorHash = createHash("sha256")
    .update(`${slotId}:${visitorId}`)
    .digest("hex");

  const slotRef = db.collection("floatingAdStats").doc(slotId);

  const dailyRef = slotRef.collection("days").doc(day);

  // زائر فريد للمساحة طوال عمرها.
  const lifetimeVisitorRef = slotRef.collection("visitors").doc(visitorHash);

  // زائر فريد للمساحة خلال اليوم.
  const dailyVisitorRef = dailyRef.collection("visitors").doc(visitorHash);

  // منع تكرار النقرات لنفس الزائر في نفس المساحة.
  const clickGuardRef = db
    .collection("floatingAdEventGuards")
    .doc(`${visitorHash}_click`);

  const eventRef = db.collection("adEvents").doc();

  const result = await db.runTransaction(async (transaction) => {
    // جميع القراءات تتم قبل أي كتابة.
    let lifetimeVisitorSnap = null;
    let dailyVisitorSnap = null;
    let guardSnap = null;

    if (eventType === "impression") {
      [lifetimeVisitorSnap, dailyVisitorSnap] = await Promise.all([
        transaction.get(lifetimeVisitorRef),
        transaction.get(dailyVisitorRef),
      ]);
    } else {
      guardSnap = await transaction.get(clickGuardRef);

      if (guardSnap.exists) {
        const lastEvent = guardSnap.data().lastEventAt?.toMillis?.() || 0;

        if (now - lastEvent < 10000) {
          return {
            recorded: false,
            reason: "cooldown",
          };
        }
      }
    }

    const increment = FieldValue.increment(1);

    const slotUpdates = {
      slotId,
      updatedAt: FieldValue.serverTimestamp(),
    };

    const dailyUpdates = {
      slotId,
      date: day,
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (eventType === "impression") {
      slotUpdates.impressions = increment;
      dailyUpdates.impressions = increment;

      // زائر جديد للمساحة طوال عمرها.
      if (!lifetimeVisitorSnap.exists) {
        slotUpdates.uniqueVisitors = increment;

        transaction.create(lifetimeVisitorRef, {
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      // زائر جديد للمساحة في هذا اليوم.
      if (!dailyVisitorSnap.exists) {
        dailyUpdates.uniqueVisitors = increment;

        transaction.create(dailyVisitorRef, {
          createdAt: FieldValue.serverTimestamp(),
        });
      }
    } else {
      slotUpdates.clicks = increment;
      dailyUpdates.clicks = increment;

      transaction.set(clickGuardRef, {
        lastEventAt: FieldValue.serverTimestamp(),
      });
    }

    transaction.set(slotRef, slotUpdates, { merge: true });

    transaction.set(dailyRef, dailyUpdates, { merge: true });

    transaction.create(eventRef, {
      slotId,
      adId: safeAdId,
      adType: "house",
      eventType,
      pagePath,
      visitorHash,
      createdAt: FieldValue.serverTimestamp(),
    });

    return {
      recorded: true,
    };
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

exports.setJokeReaction = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "يجب تسجيل هوية الزائر أولاً");
  }

  const uid = request.auth.uid;
  const { jokeId, reactionType } = request.data || {};

  const allowedReactions = ["laugh", "love", "notFunny"];

  if (
    typeof jokeId !== "string" ||
    !/^[a-zA-Z0-9_-]{1,100}$/.test(jokeId) ||
    !allowedReactions.includes(reactionType)
  ) {
    throw new HttpsError("invalid-argument", "بيانات التفاعل غير صحيحة");
  }

  const statsRef = db.collection("jokeStats").doc(jokeId);
  const reactionRef = db.collection("jokeReactions").doc(`${jokeId}_${uid}`);

  return db.runTransaction(async (transaction) => {
    const [statsSnap, reactionSnap] = await Promise.all([
      transaction.get(statsRef),
      transaction.get(reactionRef),
    ]);

    const stats = {
      laugh: Number(statsSnap.get("laugh") || 0),
      love: Number(statsSnap.get("love") || 0),
      notFunny: Number(statsSnap.get("notFunny") || 0),
    };

    // دعم البيانات القديمة التي كانت تحفظ تفاعلًا واحدًا في type.
    const oldData = reactionSnap.exists ? reactionSnap.data() : {};

    const previous = {
      laugh: false,
      love: false,
      notFunny: false,
    };

    if (oldData.reactions && typeof oldData.reactions === "object") {
      previous.laugh = oldData.reactions.laugh === true;
      previous.love = oldData.reactions.love === true;
      previous.notFunny = oldData.reactions.notFunny === true;
    } else if (allowedReactions.includes(oldData.type)) {
      previous[oldData.type] = true;
    }

    const next = { ...previous };

    // الضغط على التفاعل نفسه يلغي اختياره.
    next[reactionType] = !previous[reactionType];

    // ضحكتني ومش مضحكة متعارضان.
    if (reactionType === "laugh" && next.laugh) {
      next.notFunny = false;
    }

    if (reactionType === "notFunny" && next.notFunny) {
      next.laugh = false;
    }

    // تحديث العدادات حسب الاختلاف الفعلي.
    for (const type of allowedReactions) {
      if (previous[type] !== next[type]) {
        stats[type] = Math.max(0, stats[type] + (next[type] ? 1 : -1));
      }
    }

    const hasReactions = Object.values(next).some(Boolean);

    if (hasReactions) {
      transaction.set(reactionRef, {
        uid,
        jokeId,
        reactions: next,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } else {
      transaction.delete(reactionRef);
    }

    transaction.set(
      statsRef,
      {
        ...stats,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    return {
      stats,
      selectedReactions: next,
    };
  });
});

exports.getMyJokeReactions = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "يجب تسجيل هوية الزائر أولاً");
  }

  const uid = request.auth.uid;

  const reactionsSnapshot = await db
    .collection("jokeReactions")
    .where("uid", "==", uid)
    .get();

  const reactions = {};

  reactionsSnapshot.forEach((doc) => {
    const data = doc.data();

    // دعم التفاعلات الجديدة والقديمة.
    if (data.reactions && typeof data.reactions === "object") {
      reactions[data.jokeId] = {
        laugh: data.reactions.laugh === true,
        love: data.reactions.love === true,
        notFunny: data.reactions.notFunny === true,
      };
    } else {
      reactions[data.jokeId] = {
        laugh: data.type === "laugh",
        love: data.type === "love",
        notFunny: data.type === "notFunny",
      };
    }
  });

  const statsSnapshot = await db.collection("jokeStats").get();

  const stats = {};

  statsSnapshot.forEach((doc) => {
    const data = doc.data();

    stats[doc.id] = {
      laugh: Number(data.laugh || 0),
      love: Number(data.love || 0),
      notFunny: Number(data.notFunny || 0),
    };
  });

  return {
    reactions,
    stats,
  };
});

/**
 * حفظ لقطة يومية للأعداد النهائية لتفاعلات النكت.
 * تعمل يوميًا الساعة 11:59 مساءً بتوقيت القاهرة.
 */
exports.saveDailyJokeStats = onSchedule(
  {
    schedule: "59 23 * * *",
    timeZone: "Africa/Cairo",
    maxInstances: 1,
  },
  async () => {
    const statsSnapshot = await db.collection("jokeStats").get();

    const dateParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const dateValues = Object.fromEntries(
      dateParts.map((part) => [part.type, part.value]),
    );

    const day = `${dateValues.year}-${dateValues.month}-${dateValues.day}`;

    const dailyRef = db.collection("jokeDailyStats").doc(day);

    const totals = {
      laugh: 0,
      love: 0,
      notFunny: 0,
    };

    const batch = db.batch();

    for (const jokeDoc of statsSnapshot.docs) {
      const data = jokeDoc.data();

      const jokeStats = {
        laugh: Math.max(0, Number(data.laugh) || 0),
        love: Math.max(0, Number(data.love) || 0),
        notFunny: Math.max(0, Number(data.notFunny) || 0),
      };

      totals.laugh += jokeStats.laugh;
      totals.love += jokeStats.love;
      totals.notFunny += jokeStats.notFunny;

      batch.set(dailyRef.collection("jokes").doc(jokeDoc.id), {
        jokeId: jokeDoc.id,
        ...jokeStats,
      });
    }

    batch.set(dailyRef, {
      date: day,
      totals,
      totalReactions: totals.laugh + totals.love + totals.notFunny,
      jokeCount: statsSnapshot.size,
      capturedAt: FieldValue.serverTimestamp(),
    });

    await batch.commit();

    console.log(`[Jokes] Daily stats saved for ${day}`, totals);
  },
);

exports.getJokeAdminStats = onCall(async (request) => {
  // حماية الإحصائيات: للأدمن فقط
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "يجب تسجيل الدخول أولاً.");
  }

  if (request.auth.token.admin !== true) {
    throw new HttpsError("permission-denied", "هذه الإحصائيات للأدمن فقط.");
  }

  const days = Number(request.data?.days || 30);
  const selectedDate = String(request.data?.date || "");

  if (![7, 30, 90].includes(days)) {
    throw new HttpsError("invalid-argument", "الفترة الزمنية غير صحيحة.");
  }

  const datePattern = /^\d{4}-\d{2}-\d{2}$/;

  if (!datePattern.test(selectedDate)) {
    throw new HttpsError("invalid-argument", "التاريخ غير صحيح.");
  }

  const parsedDate = new Date(`${selectedDate}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== selectedDate
  ) {
    throw new HttpsError("invalid-argument", "التاريخ غير صحيح.");
  }

  // الإجمالي الحالي من jokeStats
  const statsSnapshot = await db.collection("jokeStats").get();

  const totals = {
    laugh: 0,
    love: 0,
    notFunny: 0,
  };

  statsSnapshot.forEach((doc) => {
    const data = doc.data();

    totals.laugh += Number(data.laugh) || 0;
    totals.love += Number(data.love) || 0;
    totals.notFunny += Number(data.notFunny) || 0;
  });

  totals.totalReactions = totals.laugh + totals.love + totals.notFunny;

  // تجهيز تواريخ الفترة المطلوبة بتوقيت القاهرة
  const cairoParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const todayParts = Object.fromEntries(
    cairoParts.map((part) => [part.type, part.value]),
  );

  const today = `${todayParts.year}-${todayParts.month}-${todayParts.day}`;

  const todayDate = new Date(`${today}T00:00:00.000Z`);

  const dates = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(todayDate);
    date.setUTCDate(date.getUTCDate() - i);
    dates.push(date.toISOString().slice(0, 10));
  }

  // قراءة اللقطات اليومية
  const dailySnapshots = await Promise.all(
    dates.map(async (day) => {
      const snap = await db.collection("jokeDailyStats").doc(day).get();

      const data = snap.exists ? snap.data() : {};
      const dayTotals = data.totals || {};

      return {
        date: day,
        laugh: Number(dayTotals.laugh) || 0,
        love: Number(dayTotals.love) || 0,
        notFunny: Number(dayTotals.notFunny) || 0,
        totalReactions: Number(data.totalReactions) || 0,
        available: snap.exists,
      };
    }),
  );

  // تفاصيل النكت في التاريخ المختار
  const selectedDayRef = db.collection("jokeDailyStats").doc(selectedDate);
  const selectedDaySnap = await selectedDayRef.get();

  let jokes = [];

  if (selectedDaySnap.exists) {
    const jokesSnapshot = await selectedDayRef.collection("jokes").get();

    jokes = jokesSnapshot.docs.map((doc) => {
      const data = doc.data();

      const laugh = Number(data.laugh) || 0;
      const love = Number(data.love) || 0;
      const notFunny = Number(data.notFunny) || 0;

      return {
        jokeId: doc.id,
        laugh,
        love,
        notFunny,
        total: laugh + love + notFunny,
      };
    });

    jokes.sort((a, b) => b.total - a.total);
  }

  return {
    totals,
    daily: dailySnapshots,
    jokes,
    selectedDate,
    selectedDateAvailable: selectedDaySnap.exists,
    updatedAt: new Date().toISOString(),
  };
});

/**
 * استقبال نكت الجمهور وإضافتها للمراجعة.
 * يسمح بثلاث نكت يوميًا لكل UID.
 */
exports.submitCommunityJoke = onCall(
  {
    cors: ["http://localhost:4321", "https://lolme.cc", "https://www.lolme.cc"],
  },
  async (request) => {
    // التأكد من وجود هوية للزائر، حتى لو كانت Anonymous
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "يجب تجهيز هوية الزائر أولاً.");
    }

    const uid = request.auth.uid;

    const text =
      typeof request.data?.text === "string" ? request.data.text.trim() : "";

    const authorName =
      typeof request.data?.authorName === "string"
        ? request.data.authorName.trim()
        : "";

    // التحقق من محتوى النكتة
    if (text.length < 10 || text.length > 1000) {
      throw new HttpsError(
        "invalid-argument",
        "النكتة يجب أن تكون بين 10 و1000 حرف.",
      );
    }

    if (authorName.length > 30) {
      throw new HttpsError(
        "invalid-argument",
        "الاسم المستعار لا يجب أن يزيد عن 30 حرفًا.",
      );
    }

    // تاريخ اليوم بتوقيت القاهرة
    const dateParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Africa/Cairo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const dateValues = Object.fromEntries(
      dateParts.map((part) => [part.type, part.value]),
    );

    const today = `${dateValues.year}-${dateValues.month}-${dateValues.day}`;

    const limitRef = db.collection("communityJokeLimits").doc(uid);

    const jokeRef = db.collection("communityJokes").doc();

    return db.runTransaction(async (transaction) => {
      // قراءة سجل الحد قبل أي كتابة
      const limitSnap = await transaction.get(limitRef);

      const limitData = limitSnap.exists ? limitSnap.data() : {};

      const currentCount =
        limitData.date === today ? Number(limitData.count || 0) : 0;

      if (currentCount >= 20) {
        throw new HttpsError(
          "resource-exhausted",
          "وصلت للحد الأقصى، يمكنك إرسال 20 نكت يوميًا.",
        );
      }

      // حفظ النكتة للمراجعة
      transaction.create(jokeRef, {
        text,
        authorName: authorName || "مجهول",
        uid,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });

      // تحديث عدد النكت المرسلة اليوم
      transaction.set(limitRef, {
        uid,
        date: today,
        count: currentCount + 1,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        jokeId: jokeRef.id,
        remaining: 2 - currentCount,
      };
    });
  },
);

// جلب النكت المعلقة - للأدمن فقط
exports.getPendingCommunityJokes = onCall(
  {
    cors: ["http://localhost:4321", "https://lolme.cc", "https://www.lolme.cc"],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "يجب تسجيل الدخول.");
    }

    if (request.auth.token.admin !== true) {
      throw new HttpsError("permission-denied", "هذه العملية للأدمن فقط.");
    }

    const snapshot = await db
      .collection("communityJokes")
      .where("status", "==", "pending")
      .limit(100)
      .get();

    const jokes = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        text: data.text || "",
        authorName: data.authorName || "مجهول",
        createdAt: data.createdAt?.toMillis?.() || null,
      };
    });

    jokes.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    return { jokes };
  },
);

// الموافقة على النكتة ونشرها - للأدمن فقط
exports.reviewCommunityJoke = onCall(
  {
    cors: ["http://localhost:4321", "https://lolme.cc", "https://www.lolme.cc"],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "يجب تسجيل الدخول.");
    }

    if (request.auth.token.admin !== true) {
      throw new HttpsError("permission-denied", "هذه العملية للأدمن فقط.");
    }

    const jokeId = request.data?.jokeId;

    if (typeof jokeId !== "string" || !/^[a-zA-Z0-9_-]{1,150}$/.test(jokeId)) {
      throw new HttpsError("invalid-argument", "رقم النكتة غير صحيح.");
    }

    const jokeRef = db.collection("communityJokes").doc(jokeId);

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(jokeRef);

      if (!snap.exists) {
        throw new HttpsError("not-found", "النكتة غير موجودة.");
      }

      if (snap.data().status !== "pending") {
        throw new HttpsError(
          "failed-precondition",
          "النكتة لم تعد معلقة للمراجعة.",
        );
      }

      transaction.update(jokeRef, {
        status: "published",
        reviewedAt: FieldValue.serverTimestamp(),
        reviewedBy: request.auth.uid,
        updatedAt: FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  },
);

// حذف النكتة المرفوضة - للأدمن فقط
exports.deleteCommunityJoke = onCall(
  {
    cors: ["http://localhost:4321", "https://lolme.cc", "https://www.lolme.cc"],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "يجب تسجيل الدخول.");
    }

    if (request.auth.token.admin !== true) {
      throw new HttpsError("permission-denied", "هذه العملية للأدمن فقط.");
    }

    const jokeId = request.data?.jokeId;

    if (typeof jokeId !== "string" || !/^[a-zA-Z0-9_-]{1,150}$/.test(jokeId)) {
      throw new HttpsError("invalid-argument", "رقم النكتة غير صحيح.");
    }

    const jokeRef = db.collection("communityJokes").doc(jokeId);

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(jokeRef);

      if (!snap.exists) {
        throw new HttpsError("not-found", "النكتة غير موجودة.");
      }

      if (snap.data().status !== "pending") {
        throw new HttpsError(
          "failed-precondition",
          "لا يمكن حذف هذه النكتة من قائمة المراجعة.",
        );
      }

      transaction.delete(jokeRef);
    });

    return { success: true };
  },
);

exports.getPublishedCommunityJokes = onCall(
  {
    cors: ["http://localhost:4321", "https://lolme.cc", "https://www.lolme.cc"],
  },
  async () => {
    const snapshot = await db
      .collection("communityJokes")
      .where("status", "==", "published")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const jokes = snapshot.docs.map((doc) => {
      const data = doc.data();

      return {
        id: doc.id,
        text: data.text || "",
        authorName: data.authorName || "مجهول",
        createdAt: data.createdAt?.toMillis?.() || null,
      };
    });

    return { jokes };
  },
);
