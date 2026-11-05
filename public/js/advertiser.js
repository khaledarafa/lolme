// public/js/advertiser.js
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
  return Number(value || 0).toLocaleString("ar-EG", {
    useGrouping: false,
  });
}
function formatDate(timestamp) {
  if (!timestamp) return "غير محدد";

  let date;

  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === "number") {
    date = new Date(timestamp);
  } else if (typeof timestamp === "string") {
    date = new Date(timestamp);
  } else if (typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else if (timestamp.seconds || timestamp._seconds) {
    date = new Date((timestamp.seconds || timestamp._seconds) * 1000);
  } else {
    return "غير محدد";
  }

  if (Number.isNaN(date.getTime())) return "غير محدد";

  return new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
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

function getSlotLabel(slotId) {
  const slots = {
    "floating-right": "إعلان عائم - الجانب الأيمن",
    "floating-left": "إعلان عائم - الجانب الأيسر",
    "floating-main": "إعلان عائم - الرئيسي",
  };

  return slots[slotId] || slotId || "مساحة إعلانية";
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

// function renderPlacementStats(placements = []) {
//   const container = document.createElement("section");
//   container.className = "placement-stats";

//   const heading = document.createElement("h4");
//   heading.textContent = "📍 أداء الإعلان حسب مكان ظهوره";
//   container.append(heading);

//   if (!placements.length) {
//     container.append(
//       makeElement(
//         "p",
//         "لم يتم تسجيل إحصائيات حسب الصفحة حتى الآن. ستظهر البيانات هنا بعد تسجيل مرات ظهور الإعلان ونقراته.",
//         "placement-empty",
//       ),
//     );

//     return container;
//   }

//   const names = {
//     "/tests": "🧩 صفحة الاختبارات",
//     "/jokes": "😂 صفحة النكت",
//   };

//   for (const placement of placements) {
//     const card = document.createElement("div");
//     card.className = "placement-card";

//     const title = makeElement(
//       "h5",
//       names[placement.pagePath] || `📄 ${placement.pagePath}`,
//     );

//     const stats = document.createElement("div");
//     stats.className = "placement-numbers";

//     const items = [
//       ["مرات الظهور", formatNumber(placement.impressions)],
//       ["النقرات", formatNumber(placement.clicks)],
//       ["معدل النقر CTR", `${(Number(placement.ctr) || 0).toFixed(2)}%`],
//     ];

//     for (const [label, value] of items) {
//       const item = document.createElement("div");
//       item.className = "placement-number";

//       item.append(makeElement("span", label), makeElement("strong", value));

//       stats.append(item);
//     }

//     card.append(title, stats);
//     container.append(card);
//   }

//   return container;
// }

function renderCountryStats(countries = []) {
  const container = document.createElement("section");
  container.className = "country-stats";

  container.append(makeElement("h4", "🌍 الجمهور حسب الدولة"));

  if (!countries.length) {
    container.append(
      makeElement(
        "p",
        "ستظهر إحصائيات الدول بعد تسجيل مشاهدات جديدة للإعلان.",
        "country-empty",
      ),
    );

    return container;
  }

  function getCountryName(countryCode) {
    if (!countryCode || countryCode === "XX") {
      return "غير محدد";
    }

    try {
      return (
        new Intl.DisplayNames(["ar"], {
          type: "region",
        }).of(countryCode) || countryCode
      );
    } catch {
      return countryCode;
    }
  }

  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const header = document.createElement("tr");

  ["الدولة", "مرات الظهور", "الزوار المختلفون", "النقرات"].forEach((label) => {
    header.append(makeElement("th", label));
  });

  thead.append(header);

  const tbody = document.createElement("tbody");

  for (const country of countries) {
    const countryCode = country.countryCode || "XX";

    const row = document.createElement("tr");

    row.append(
      getCountryName(countryCode),
      makeElement("td", formatNumber(country.impressions)),
      makeElement("td", formatNumber(country.uniqueVisitors)),
      makeElement("td", formatNumber(country.clicks)),
    );

    tbody.append(row);
  }

  table.append(thead, tbody);
  container.append(table);

  return container;
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

    // البطاقة القابلة للفتح والإغلاق
    const accordion = document.createElement("details");
    accordion.className = "campaign-accordion";

    // رأس البطاقة الظاهر دائمًا
    const summary = document.createElement("summary");
    summary.className = "campaign-accordion-summary";

    const header = document.createElement("div");
    header.className = "campaign-accordion-header";

    header.append(
      makeElement(
        "h4",
        campaign.headline || `حملة ${getSlotLabel(campaign.slotId)}`,
      ),
      makeElement(
        "span",
        `${getSlotLabel(campaign.slotId)} · ${getCampaignStatus(campaign)}`,
        "campaign-accordion-status",
      ),
      makeElement("span", "⌄ عرض تفاصيل الحملة", "campaign-accordion-hint"),
    );

    summary.append(header);

    // إحصائيات مختصرة تظهر دون فتح الحملة
    const numbers = document.createElement("div");
    numbers.className = "campaign-numbers";

    [
      ["مرات الظهور", formatNumber(campaign.impressions)],
      ["الزوار المختلفون", formatNumber(campaign.uniqueVisitors)],
      ["النقرات", formatNumber(campaign.clicks)],
      ["CTR", `${(Number(campaign.ctr) || 0).toFixed(2)}%`],
    ].forEach(([label, value]) => {
      const item = document.createElement("div");
      item.className = "campaign-number";

      item.append(makeElement("span", label), makeElement("strong", value));

      numbers.append(item);
    });

    summary.append(numbers);

    // محتوى الحملة الذي يظهر عند فتحها
    const expanded = document.createElement("div");
    expanded.className = "campaign-accordion-content";

    // تواريخ الحملة
    const schedule = document.createElement("div");
    schedule.className = "campaign-schedule";

    const startDate = document.createElement("div");
    startDate.className = "campaign-date start";

    startDate.append(
      makeElement("span", "🟢 بداية الحملة"),
      makeElement("strong", formatDate(campaign.startAt)),
    );

    const endDate = document.createElement("div");
    endDate.className = "campaign-date end";

    endDate.append(
      makeElement("span", "🔴 انتهاء الحملة"),
      makeElement("strong", formatDate(campaign.endAt)),
    );

    schedule.append(startDate, endDate);
    expanded.append(schedule);

    // تفاصيل الحجز والدفع
    const financial = document.createElement("section");
    financial.className = "campaign-financial";

    financial.append(makeElement("h5", "💰 تفاصيل الحجز والدفع"));

    const paymentMethods = {
      fawry: "فوري",
      transfer: "تحويل بنكي",
      cash: "نقدًا",
    };

    const paymentStatus =
      campaign.paymentStatus === "paid" ? "مدفوع بالكامل" : "غير مدفوع";

    const financialRows = [
      [
        "سعر المساحة (كل 30 يومًا)",
        `${formatNumber(campaign.monthlyPrice)} جنيه`,
      ],
      ["مدة الحجز", `${formatNumber(campaign.durationDays)} يوم`],
      ["إجمالي الحملة", `${formatNumber(campaign.totalPrice)} جنيه`],
      ["المبلغ المدفوع", `${formatNumber(campaign.paidAmount)} جنيه`],
      ["حالة الدفع", paymentStatus],
      ["طريقة الدفع", paymentMethods[campaign.paymentMethod] || "—"],
      [
        "تاريخ استلام الدفع",
        campaign.paidAt
          ? new Date(campaign.paidAt).toLocaleDateString("ar-EG")
          : "لم يتم تسجيل الدفع",
      ],
    ];

    const financialGrid = document.createElement("div");
    financialGrid.className = "campaign-financial-grid";

    for (const [label, value] of financialRows) {
      const item = document.createElement("div");
      item.className = "campaign-financial-item";

      item.append(makeElement("span", label), makeElement("strong", value));

      financialGrid.append(item);
    }

    financial.append(financialGrid);
    expanded.append(financial);

    // الأداء اليومي
    expanded.append(renderDailyStats(campaign));

    // // أداء الإعلان حسب مكان ظهوره
    // expanded.append(renderPlacementStats(campaign.placements || []));

    // الجمهور حسب الدولة
    expanded.append(renderCountryStats(campaign.countries || []));
    accordion.append(summary, expanded);
    card.append(accordion);
    campaignsContainer.append(card);

    // فتح حملة واحدة فقط في كل مرة
    accordion.addEventListener("toggle", () => {
      if (!accordion.open) return;

      campaignsContainer
        .querySelectorAll(".campaign-accordion[open]")
        .forEach((other) => {
          if (other !== accordion) {
            other.open = false;
          }
        });
    });
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
