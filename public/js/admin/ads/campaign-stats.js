// public/js/admin/ads/campaign-stats.js
import { db, collection, getDocs, query, where } from "/js/firebase.js";

import {
  $,
  safeText,
  formatStatNumber,
  showMessage,
  verifyAdmin,
} from "./shared.js";

function getDayString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function initializeStatsDates() {
  const end = new Date();
  const start = new Date();

  start.setDate(start.getDate() - 6);

  if ($("ad-stats-start")) {
    $("ad-stats-start").value = getDayString(start);
  }

  if ($("ad-stats-end")) {
    $("ad-stats-end").value = getDayString(end);
  }
}

function renderHouseAdStatistics(events) {
  const tbody = $("house-stats-slots");
  if (!tbody) return;

  tbody.replaceChildren();

  const totals = {
    impressions: 0,
    clicks: 0,
  };

  const slots = new Map();

  for (const event of events) {
    if (event.adType !== "house") continue;

    const slotId = event.slotId || "unknown";
    const pagePath = event.pagePath || "/";
    const key = `${slotId}::${pagePath}`;

    if (!slots.has(key)) {
      slots.set(key, {
        slotId,
        pagePath,
        impressions: 0,
        clicks: 0,
      });
    }

    const item = slots.get(key);

    if (event.eventType === "impression") {
      item.impressions++;
      totals.impressions++;
    } else if (event.eventType === "click") {
      item.clicks++;
      totals.clicks++;
    }
  }

  const ctr = totals.impressions
    ? (totals.clicks / totals.impressions) * 100
    : 0;

  $("house-stat-impressions").textContent = formatStatNumber(
    totals.impressions,
  );

  $("house-stat-clicks").textContent = formatStatNumber(totals.clicks);

  $("house-stat-ctr").textContent = `${ctr.toFixed(2)}%`;

  const sorted = [...slots.values()].sort(
    (a, b) => b.impressions - a.impressions,
  );

  if (!sorted.length) {
    const row = document.createElement("tr");
    const cell = safeText(
      "td",
      "لا توجد إحصائيات لإعلانات الموقع في هذه الفترة.",
    );

    cell.colSpan = 5;
    row.append(cell);
    tbody.append(row);
    return;
  }

  for (const item of sorted) {
    const itemCtr = item.impressions
      ? (item.clicks / item.impressions) * 100
      : 0;

    const row = document.createElement("tr");

    row.append(
      safeText("td", item.slotId),
      safeText("td", item.pagePath),
      safeText("td", formatStatNumber(item.impressions)),
      safeText("td", formatStatNumber(item.clicks)),
      safeText("td", `${itemCtr.toFixed(2)}%`),
    );

    tbody.append(row);
  }
}

async function loadHouseAdEvents(startDay, endDay) {
  const startDate = new Date(`${startDay}T00:00:00`);
  const endDate = new Date(`${endDay}T00:00:00`);

  endDate.setDate(endDate.getDate() + 1);

  const eventsQuery = query(
    collection(db, "adEvents"),
    where("createdAt", ">=", startDate),
    where("createdAt", "<", endDate),
  );

  const snapshot = await getDocs(eventsQuery);

  return snapshot.docs.map((eventDoc) => eventDoc.data());
}

export async function loadAdStatistics() {
  const startDay = $("ad-stats-start")?.value;
  const endDay = $("ad-stats-end")?.value;

  if (!startDay || !endDay) {
    showMessage("ad-stats-message", "حدد فترة الإحصائيات أولًا.");
    return;
  }

  if (startDay > endDay) {
    showMessage(
      "ad-stats-message",
      "تاريخ البداية يجب أن يكون قبل تاريخ النهاية.",
    );
    return;
  }

  const refreshButton = $("ad-stats-refresh");

  if (refreshButton) refreshButton.disabled = true;

  showMessage("ad-stats-message", "جارٍ تحميل إحصائيات المعلنين...");

  try {
    await verifyAdmin();

    const houseEvents = await loadHouseAdEvents(startDay, endDay);

    renderHouseAdStatistics(houseEvents);
    
    const campaignsSnapshot = await getDocs(collection(db, "adCampaigns"));

    const campaigns = await Promise.all(
      campaignsSnapshot.docs.map(async (campaignDoc) => {
        const id = campaignDoc.id;
        const data = campaignDoc.data();

        const snapshot = await getDocs(
          collection(db, "adCampaignStats", id, "days"),
        );

        const days = snapshot.docs
          .map((dayDoc) => ({
            date: dayDoc.id,
            ...dayDoc.data(),
          }))
          .filter((day) => day.date >= startDay && day.date <= endDay)
          .sort((a, b) => a.date.localeCompare(b.date));

        const totals = {
          impressions: 0,
          clicks: 0,
          visitors: 0,
          daily: {},
        };

        const placementsMap = new Map();

        for (const day of days) {
          const impressions = Number(day.impressions) || 0;
          const clicks = Number(day.clicks) || 0;
          const visitors = Number(day.uniqueVisitors) || 0;

          totals.impressions += impressions;
          totals.clicks += clicks;
          totals.visitors += visitors;

          totals.daily[day.date] = {
            impressions,
            clicks,
            visitors,
          };

          const placements = day.placements || {};

          for (const placement of Object.values(placements)) {
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
        }

        const placements = Array.from(placementsMap.values())
          .map((placement) => ({
            ...placement,
            ctr: placement.impressions
              ? Number(
                  ((placement.clicks / placement.impressions) * 100).toFixed(2),
                )
              : 0,
          }))
          .sort((a, b) => b.impressions - a.impressions);

        return {
          id,
          name: data.advertiserName || "معلن بدون اسم",
          email: data.advertiserEmail || "",
          advertiserUid: data.advertiserUid || "",
          slotId: data.slotId || "—",
          data,
          impressions: totals.impressions,
          clicks: totals.clicks,
          visitors: totals.visitors,
          daily: totals.daily,
          placements,
          ctr: totals.impressions
            ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2))
            : 0,
        };
      }),
    );

    renderAdStatistics(campaigns);

    showMessage(
      "ad-stats-message",
      `تم تحميل إحصائيات المعلنين من ${startDay} إلى ${endDay}.`,
    );
  } catch (error) {
    console.error("[Ads Admin Stats]", error);

    showMessage("ad-stats-message", error?.message || "تعذر تحميل الإحصائيات.");
  } finally {
    if (refreshButton) refreshButton.disabled = false;
  }
}

function renderAdStatistics(campaigns) {
  const totals = campaigns.reduce(
    (result, campaign) => {
      result.impressions += campaign.impressions;
      result.clicks += campaign.clicks;
      result.visitors += campaign.visitors;

      for (const [date, values] of Object.entries(campaign.daily)) {
        if (!result.daily[date]) {
          result.daily[date] = {
            impressions: 0,
            clicks: 0,
          };
        }

        result.daily[date].impressions += values.impressions;
        result.daily[date].clicks += values.clicks;
      }

      return result;
    },
    {
      impressions: 0,
      clicks: 0,
      visitors: 0,
      daily: {},
    },
  );

  const ctr = totals.impressions
    ? (totals.clicks / totals.impressions) * 100
    : 0;

  if ($("stat-impressions")) {
    $("stat-impressions").textContent = formatStatNumber(totals.impressions);
  }

  if ($("stat-clicks")) {
    $("stat-clicks").textContent = formatStatNumber(totals.clicks);
  }

  if ($("stat-visitors")) {
    $("stat-visitors").textContent = formatStatNumber(totals.visitors);
  }

  if ($("stat-ctr")) {
    $("stat-ctr").textContent = `${ctr.toFixed(2)}%`;
  }

  renderAdStatsChart(totals.daily);
  renderCampaignDetailsTable(campaigns);
  renderCampaignStatsTable(campaigns);
}

function renderCampaignDetailsTable(campaigns) {
  const tbody = $("ad-stats-campaign-details");

  if (!tbody) return;

  tbody.replaceChildren();

  if (!campaigns.length) {
    const row = document.createElement("tr");
    const cell = safeText("td", "لا توجد حملات خلال الفترة المحددة.");
    cell.colSpan = 5;
    row.append(cell);
    tbody.append(row);
    return;
  }

  const sorted = [...campaigns].sort((a, b) => b.impressions - a.impressions);

  for (const campaign of sorted) {
    const row = document.createElement("tr");

    row.append(
      safeText(
        "td",
        campaign.data?.headline || campaign.name || "حملة بدون عنوان",
      ),
      safeText("td", campaign.slotId || "—"),
      safeText("td", formatStatNumber(campaign.impressions)),
      safeText("td", formatStatNumber(campaign.clicks)),
      safeText("td", `${campaign.ctr.toFixed(2)}%`),
    );

    tbody.append(row);
  }
}

function renderAdStatsChart(daily) {
  const container = $("ad-stats-chart");

  if (!container) return;

  container.replaceChildren();

  const entries = Object.entries(daily).sort(([a], [b]) => a.localeCompare(b));

  if (!entries.length) {
    container.textContent = "لا توجد بيانات ظهور أو نقرات في هذه الفترة.";
    return;
  }

  const visibleEntries = entries.slice(-14);

  const maxValue = Math.max(
    1,
    ...visibleEntries.flatMap(([, values]) => [
      values.impressions,
      values.clicks,
    ]),
  );

  for (const [date, values] of visibleEntries) {
    const day = document.createElement("div");
    day.className = "ad-chart-day";

    const bars = document.createElement("div");
    bars.className = "ad-chart-bars";

    const impressions = document.createElement("div");
    impressions.className = "ad-chart-bar ad-chart-impressions";

    impressions.style.height = `${Math.max(2, (values.impressions / maxValue) * 125)}px`;

    impressions.title = `الظهور: ${formatStatNumber(values.impressions)}`;

    const clicks = document.createElement("div");
    clicks.className = "ad-chart-bar ad-chart-clicks";

    clicks.style.height = `${Math.max(2, (values.clicks / maxValue) * 125)}px`;

    clicks.title = `النقرات: ${formatStatNumber(values.clicks)}`;

    bars.append(impressions, clicks);

    const label = safeText("small", date.slice(5));

    day.append(bars, label);
    container.append(day);
  }

  const legend = document.createElement("div");
  legend.className = "ad-chart-legend";

  legend.innerHTML = `
    <span><i style="background:#8b5cf6"></i> مرات الظهور</span>
    <span><i style="background:#22c55e"></i> النقرات</span>
  `;

  container.append(legend);
}

function renderCampaignStatsTable(campaigns) {
  const tbody = $("ad-stats-campaigns");

  if (!tbody) return;

  tbody.replaceChildren();

  const advertisers = new Map();

  for (const campaign of campaigns) {
    const uid = campaign.advertiserUid || "";

    const key = uid ? `uid:${uid}` : `unlinked:${campaign.id}`;

    if (!advertisers.has(key)) {
      advertisers.set(key, {
        name: campaign.name,
        campaigns: [],
        impressions: 0,
        clicks: 0,
        visitors: 0,
      });
    }

    const advertiser = advertisers.get(key);

    advertiser.campaigns.push(campaign);
    advertiser.impressions += campaign.impressions;
    advertiser.clicks += campaign.clicks;
    advertiser.visitors += campaign.visitors;
  }

  const sorted = [...advertisers.values()].sort(
    (a, b) => b.impressions - a.impressions,
  );

  if (!sorted.length) {
    const row = document.createElement("tr");
    const cell = safeText("td", "لا توجد بيانات للمعلنين.");

    cell.colSpan = 6;
    row.append(cell);
    tbody.append(row);

    return;
  }

  for (const advertiser of sorted) {
    const ctr = advertiser.impressions
      ? (advertiser.clicks / advertiser.impressions) * 100
      : 0;

    const row = document.createElement("tr");

    row.append(
      safeText("td", advertiser.name || "معلن بدون اسم"),
      safeText("td", formatStatNumber(advertiser.campaigns.length)),
      safeText("td", formatStatNumber(advertiser.impressions)),
      safeText("td", formatStatNumber(advertiser.clicks)),
      safeText("td", `${ctr.toFixed(2)}%`),
    );

    const detailsCell = document.createElement("td");
    const detailsButton = safeText("button", "عرض الحملات");

    detailsButton.type = "button";
    detailsButton.className = "ad-stats-details-button";
    detailsButton.setAttribute("aria-expanded", "false");

    detailsCell.append(detailsButton);
    row.append(detailsCell);
    tbody.append(row);

    const detailsRow = document.createElement("tr");
    detailsRow.hidden = true;

    const wrapperCell = document.createElement("td");
    wrapperCell.colSpan = 6;

    const wrapper = document.createElement("div");
    wrapper.className = "ad-advertiser-details";

    wrapper.append(
      safeText("strong", `📢 حملات ${advertiser.name || "المعلن"}`),
    );

    const sortedCampaigns = [...advertiser.campaigns].sort(
      (a, b) => b.impressions - a.impressions,
    );

    for (const campaign of sortedCampaigns) {
      const campaignBox = document.createElement("section");
      campaignBox.className = "admin-campaign-performance";

      const campaignTitle = safeText(
        "h5",
        campaign.data?.headline || `حملة ${campaign.slotId}`,
      );

      const campaignMeta = safeText(
        "p",
        `المساحة: ${campaign.slotId} | معرّف الحملة: ${campaign.id}`,
      );

      campaignMeta.className = "admin-campaign-meta";

      const campaignNumbers = document.createElement("div");
      campaignNumbers.className = "admin-performance-grid";

      const campaignCtr = campaign.impressions
        ? (campaign.clicks / campaign.impressions) * 100
        : 0;

      const metrics = [
        ["مرات الظهور", formatStatNumber(campaign.impressions)],
        ["الزوار المختلفون", formatStatNumber(campaign.visitors)],
        ["النقرات", formatStatNumber(campaign.clicks)],
        ["معدل النقر CTR", `${campaignCtr.toFixed(2)}%`],
      ];

      for (const [label, value] of metrics) {
        const metric = document.createElement("div");
        metric.className = "admin-performance-number";

        metric.append(safeText("span", label), safeText("strong", value));

        campaignNumbers.append(metric);
      }

      campaignBox.append(campaignTitle, campaignMeta, campaignNumbers);

      renderPlacementDetails(campaign, campaignBox);
      renderDailyDetails(campaign, campaignBox);

      wrapper.append(campaignBox);
    }

    wrapperCell.append(wrapper);
    detailsRow.append(wrapperCell);
    tbody.append(detailsRow);

    detailsButton.addEventListener("click", () => {
      const isExpanded = !detailsRow.hidden;

      detailsRow.hidden = isExpanded;

      detailsButton.textContent = isExpanded ? "عرض الحملات" : "إخفاء الحملات";

      detailsButton.setAttribute("aria-expanded", String(!isExpanded));
    });
  }
}

function renderPlacementDetails(campaign, campaignBox) {
  const section = document.createElement("div");
  section.className = "admin-placement-section";

  section.append(safeText("h6", "📍 أداء الإعلان حسب مكان ظهوره"));

  const pageNames = {
    "/tests": "🧩 صفحة الاختبارات",
    "/jokes": "😂 صفحة النكت",
  };

  if (!campaign.placements.length) {
    section.append(
      safeText("p", "لا توجد إحصائيات مسجلة حسب الصفحة خلال الفترة المحددة."),
    );

    campaignBox.append(section);
    return;
  }

  const grid = document.createElement("div");
  grid.className = "admin-placement-grid";

  for (const placement of campaign.placements) {
    const card = document.createElement("div");
    card.className = "admin-placement-card";

    card.append(
      safeText(
        "h6",
        pageNames[placement.pagePath] || `📄 ${placement.pagePath}`,
      ),
    );

    const numbers = document.createElement("div");
    numbers.className = "admin-placement-numbers";

    const metrics = [
      ["مرات الظهور", formatStatNumber(placement.impressions)],
      ["النقرات", formatStatNumber(placement.clicks)],
      ["CTR", `${placement.ctr.toFixed(2)}%`],
    ];

    for (const [label, value] of metrics) {
      const metric = document.createElement("div");
      metric.className = "admin-placement-number";

      metric.append(safeText("span", label), safeText("strong", value));

      numbers.append(metric);
    }

    card.append(numbers);
    grid.append(card);
  }

  section.append(grid);
  campaignBox.append(section);
}

function renderDailyDetails(campaign, campaignBox) {
  const details = document.createElement("details");
  details.className = "admin-daily-details";

  details.append(safeText("summary", "📅 عرض الأداء اليومي"));

  const entries = Object.entries(campaign.daily || {}).sort(([a], [b]) =>
    b.localeCompare(a),
  );

  if (!entries.length) {
    details.append(safeText("p", "لا توجد بيانات يومية في الفترة المحددة."));

    campaignBox.append(details);
    return;
  }

  const wrap = document.createElement("div");
  wrap.className = "ad-stats-table-wrap";

  const table = document.createElement("table");
  table.className = "ad-stats-table";

  const thead = document.createElement("thead");
  const header = document.createElement("tr");

  ["التاريخ", "مرات الظهور", "الزوار المختلفون", "النقرات", "CTR"].forEach(
    (label) => {
      header.append(safeText("th", label));
    },
  );

  thead.append(header);

  const tbody = document.createElement("tbody");

  for (const [date, values] of entries) {
    const ctr = values.impressions
      ? (values.clicks / values.impressions) * 100
      : 0;

    const row = document.createElement("tr");

    row.append(
      safeText("td", date),
      safeText("td", formatStatNumber(values.impressions)),
      safeText("td", formatStatNumber(values.visitors)),
      safeText("td", formatStatNumber(values.clicks)),
      safeText("td", `${ctr.toFixed(2)}%`),
    );

    tbody.append(row);
  }

  table.append(thead, tbody);
  wrap.append(table);
  details.append(wrap);

  campaignBox.append(details);
}
