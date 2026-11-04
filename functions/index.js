const { setGlobalOptions } = require("firebase-functions");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { createHash } = require("crypto");

setGlobalOptions({ maxInstances: 10 });

initializeApp();

const db = getFirestore();

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

  // إحصائيات اليوم.
  const dailyStatsRef = campaignStatsRef.collection("days").doc(day);

  // سجل الحدث.
  const eventRef = db.collection("adEvents").doc();

  const result = await db.runTransaction(async (transaction) => {
    let visitorSnap = null;
    let guardSnap = null;

    // قراءة البيانات المطلوبة قبل الكتابة.
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

    // بيانات مكان الظهور داخل مستند اليوم نفسه.
    const placementUpdates = {
      pagePath,
    };

    if (eventType === "impression") {
      // إجمالي مرات ظهور الحملة.
      dailyUpdates.impressions = increment;

      // أول مشاهدة لهذا الزائر في الحملة بالكامل.
      if (!visitorSnap.exists) {
        dailyUpdates.uniqueVisitors = increment;

        transaction.create(visitorRef, {
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

      // مرات الظهور حسب الصفحة.
      placementUpdates.impressions = increment;
    } else {
      // إجمالي نقرات الحملة.
      dailyUpdates.clicks = increment;

      // منع تكرار النقرة.
      transaction.set(guardRef, {
        lastEventAt: FieldValue.serverTimestamp(),
      });

      // النقرات حسب الصفحة.
      placementUpdates.clicks = increment;
    }

    // دمج إحصائيات الصفحة مع إحصائيات اليوم.
    dailyUpdates.placements = {
      [placementKey]: placementUpdates,
    };

    // كتابة واحدة لمستند الإحصائيات اليومية.
    transaction.set(dailyStatsRef, dailyUpdates, { merge: true });

    // حفظ سجل الحدث.
    transaction.create(eventRef, {
      campaignId,
      advertiserUid: campaign.advertiserUid,
      slotId: campaign.slotId,
      eventType,
      pagePath,
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

        const [campaignStatsSnap, daysSnapshot] = await Promise.all([
          campaignStatsRef.get(),
          campaignStatsRef.collection("days").get(),
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
