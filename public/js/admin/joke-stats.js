import { functions, httpsCallable } from "/js/firebase.js";

const getJokeAdminStats = httpsCallable(
  functions,
  "getJokeAdminStats",
);

const $ = (id) => document.getElementById(id);

const numberFormat = new Intl.NumberFormat("ar-EG");

function getCairoToday() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function formatNumber(value) {
  return numberFormat.format(Number(value) || 0);
}

function showError(message) {
  const chart = $("joke-stats-chart");
  const table = $("joke-stats-table");

  if (chart) {
    chart.textContent = message;
  }

  if (table) {
    table.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">${message}</td>
      </tr>
    `;
  }
}

function renderTotals(totals = {}) {
  $("total-laugh").textContent = formatNumber(totals.laugh);
  $("total-love").textContent = formatNumber(totals.love);
  $("total-not-funny").textContent = formatNumber(totals.notFunny);
  $("total-reactions").textContent = formatNumber(
    totals.totalReactions,
  );
}

function renderDailyChart(daily = []) {
  const container = $("joke-stats-chart");
  if (!container) return;

  const availableDays = daily.filter((day) => day.available);

  if (!availableDays.length) {
    container.textContent =
      "لا توجد لقطات يومية محفوظة في الفترة المحددة حتى الآن.";
    return;
  }

  const maxValue = Math.max(
    1,
    ...availableDays.map((day) => day.totalReactions),
  );

  container.innerHTML = `
    <div class="daily-chart">
      ${daily.map((day) => {
        const total = day.totalReactions || 0;
        const height = day.available
          ? Math.max(2, (total / maxValue) * 100)
          : 0;

        const label = day.date.slice(5);

        return `
          <div class="daily-chart-column"
               title="${day.date}: ${formatNumber(total)}">
            <strong>${day.available ? formatNumber(total) : "—"}</strong>
            <div class="daily-chart-track">
              <div class="daily-chart-bar"
                   style="height: ${height}%"></div>
            </div>
            <span>${label}</span>
          </div>
        `;
      }).join("")}
    </div>
    <div class="daily-chart-legend">
      <span>إجمالي الضحكات والإعجابات والتقييمات في نهاية اليوم</span>
    </div>
  `;
}

function renderJokesTable(jokes = [], available = false) {
  const tbody = $("joke-stats-table");
  if (!tbody) return;

  if (!available) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state"> 
<br/>
          لا توجد لقطة محفوظة لهذا التاريخ. اللقطة تُحفظ يوميًا الساعة 11:59 مساءً.
        </td>
      </tr>
    `;
    return;
  }

  if (!jokes.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          لا توجد بيانات تفاعلات محفوظة لهذا اليوم.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = jokes.map((joke) => `
    <tr>
      <td>${joke.jokeId}</td>
      <td>${formatNumber(joke.laugh)}</td>
      <td>${formatNumber(joke.love)}</td>
      <td>${formatNumber(joke.notFunny)}</td>
      <td><strong>${formatNumber(joke.total)}</strong></td>
    </tr>
  `).join("");
}

async function loadJokeStats() {
  const period = Number($("stats-period")?.value || 30);
  const date = $("stats-date")?.value || getCairoToday();

  const chart = $("joke-stats-chart");
  const table = $("joke-stats-table");

  if (chart) chart.textContent = "جارٍ تحميل الإحصائيات...";
  if (table) {
    table.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">جارٍ تحميل البيانات...</td>
      </tr>
    `;
  }

  try {
    const result = await getJokeAdminStats({
      days: period,
      date,
    });

    const data = result.data || {};

    renderTotals(data.totals);
    renderDailyChart(data.daily);
    renderJokesTable(data.jokes, data.selectedDateAvailable);
  } catch (error) {
    console.error("[LOLME] Joke stats error:", error);

    showError(
      error.code === "functions/permission-denied"
        ? "ليس لديك صلاحية عرض إحصائيات النكت."
        : "تعذر تحميل الإحصائيات. راجع Console لمعرفة السبب.",
    );
  }
}

function initJokeStats() {
  const dateInput = $("stats-date");
  const periodSelect = $("stats-period");

  if (!dateInput || !periodSelect) return;

  if (!dateInput.value) {
    dateInput.value = getCairoToday();
  }

  periodSelect.addEventListener("change", loadJokeStats);
  dateInput.addEventListener("change", loadJokeStats);

  loadJokeStats();
}

initJokeStats();