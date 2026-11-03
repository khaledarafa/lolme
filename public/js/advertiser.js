import {
  auth,
  onAuthStateChanged,
  signOut,
  functions,
  httpsCallable,
} from "/js/firebase.js";

const $ = (id) => document.getElementById(id);

const status = $("advertiser-status");
const content = $("advertiser-content");
const campaignsContainer = $("advertiser-campaigns");
const refreshButton = $("advertiser-refresh");
const logoutButton = $("advertiser-logout");

const linkCampaigns = httpsCallable(functions, "linkAdvertiserCampaigns");

const getDashboard = httpsCallable(functions, "getAdvertiserDashboard");

let currentUser = null;

const numberFormat = new Intl.NumberFormat("ar-EG");

function formatNumber(value) {
  return numberFormat.format(Number(value || 0));
}

function formatDate(timestamp) {
  if (!timestamp) return "غير محدد";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function getCampaignStatus(campaign) {
  const now = Date.now();

  if (campaign.status !== "active") {
    return "⏸️ متوقفة";
  }

  if (campaign.startAt && campaign.startAt > now) {
    return "🕒 لم تبدأ";
  }

  if (campaign.endAt && campaign.endAt <= now) {
    return "⚫ انتهت";
  }

  return "🟢 نشطة";
}

function makeElement(tag, text, className = "") {
  const element = document.createElement(tag);
  element.textContent = text ?? "";

  if (className) {
    element.className = className;
  }

  return element;
}

function renderDailyStats(campaign) {
  const details = document.createElement("details");
  details.className = "campaign-details";

  const summary = makeElement("summary", "عرض الأداء اليومي");

  details.append(summary);

  const days = campaign.dailyStats || [];

  if (!days.length) {
    details.append(makeElement("p", "لا توجد بيانات يومية حتى الآن."));

    return details;
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const header = document.createElement("tr");

  ["التاريخ", "الظهور", "الزوار المختلفون", "النقرات", "CTR"].forEach(
    (label) => {
      header.append(makeElement("th", label));
    },
  );

  thead.append(header);

  const tbody = document.createElement("tbody");

  for (const day of [...days].reverse()) {
    const ctr = day.impressions ? (day.clicks / day.impressions) * 100 : 0;

    const row = document.createElement("tr");

    row.append(
      makeElement("td", day.date),
      makeElement("td", formatNumber(day.impressions)),
      makeElement("td", formatNumber(day.uniqueVisitors)),
      makeElement("td", formatNumber(day.clicks)),
      makeElement("td", `${ctr.toFixed(2)}%`),
    );

    tbody.append(row);
  }

  table.append(thead, tbody);
  details.append(table);

  return details;
}

function renderCampaigns(campaigns) {
  campaignsContainer.replaceChildren();

  if (!campaigns.length) {
    campaignsContainer.append(
      makeElement(
        "div",
        "لا توجد حملات مرتبطة بحسابك حاليًا. إذا كنت قد حجزت إعلانًا بالفعل، تأكد من استخدام البريد الإلكتروني نفسه الذي سجلت به الحملة.",
        "campaign-empty",
      ),
    );

    return;
  }

  for (const campaign of campaigns) {
    const card = document.createElement("article");
    card.className = "advertiser-campaign-card";

    card.append(
      makeElement("h4", campaign.headline || `حملة ${campaign.slotId}`),
    );

    const meta = document.createElement("div");
    meta.className = "campaign-meta";

    [
      `المساحة: ${campaign.slotId}`,
      `الحالة: ${getCampaignStatus(campaign)}`,
      `البداية: ${formatDate(campaign.startAt)}`,
      `النهاية: ${formatDate(campaign.endAt)}`,
    ].forEach((value) => {
      meta.append(makeElement("span", value));
    });

    card.append(meta);

    const numbers = document.createElement("div");
    numbers.className = "campaign-numbers";

    [
      ["مرات الظهور", formatNumber(campaign.impressions)],
      ["الزوار المختلفون", formatNumber(campaign.uniqueVisitors)],
      ["النقرات", formatNumber(campaign.clicks)],
      ["CTR", `${campaign.ctr.toFixed(2)}%`],
    ].forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "campaign-number";

      item.append(makeElement("span", label), makeElement("strong", value));

      numbers.append(item);
    });

    card.append(numbers);
    card.append(renderDailyStats(campaign));

    campaignsContainer.append(card);
  }
}

async function loadDashboard() {
  if (!currentUser) return;

  refreshButton.disabled = true;
  refreshButton.textContent = "جارٍ التحديث...";

  status.textContent = "جاري تحميل بيانات حملاتك...";

  try {
    // ربط الحملات القديمة أو غير المرتبطة بالبريد الحالي.
    await linkCampaigns();

    const response = await getDashboard();
    const data = response.data;

    if (!data.success) {
      throw new Error("تعذر تحميل لوحة المعلن.");
    }

    const totals = data.totals;

    $("advertiser-name").textContent =
      data.campaigns[0]?.advertiserName || "المعلن";

    $("advertiser-email").textContent =
      data.advertiserEmail || currentUser.email || "";

    $("total-impressions").textContent = formatNumber(totals.impressions);

    $("total-clicks").textContent = formatNumber(totals.clicks);

    $("total-ctr").textContent = `${totals.ctr.toFixed(2)}%`;

    $("total-campaigns").textContent = formatNumber(data.campaigns.length);

    $("total-unique-visitors").textContent = formatNumber(
      totals.uniqueVisitors,
    );

    renderCampaigns(data.campaigns);

    status.textContent = "تم تحديث بيانات حملاتك بنجاح.";
    content.hidden = false;
  } catch (error) {
    console.error("[Advertiser Dashboard]", error);

    status.textContent = error?.message || "تعذر تحميل بيانات الحساب.";
  } finally {
    refreshButton.disabled = false;
    refreshButton.textContent = "↻ تحديث";
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("/login");
    return;
  }

  currentUser = user;

  if (!user.emailVerified) {
    status.textContent =
      "يجب التحقق من بريدك الإلكتروني قبل استخدام لوحة المعلن.";

    content.hidden = true;
    return;
  }

  await loadDashboard();
});

refreshButton?.addEventListener("click", loadDashboard);

logoutButton?.addEventListener("click", async () => {
  logoutButton.disabled = true;

  try {
    await signOut(auth);
    window.location.replace("/login");
  } catch (error) {
    console.error("Logout error:", error);
    status.textContent = "تعذر تسجيل الخروج.";
    logoutButton.disabled = false;
  }
});
