
import {
  db,
  collection,
  query,
  where,
  getDocs,
} from "./firebase.js";

const ADMIN_EMAIL = "arafaarranger@gmail.com";

const ADMIN_MESSAGE = `
  <strong>📢 مساحة إعلانية متاحة للمعلنين</strong>
  <span>الإعلان الحالي للتوضيح، ويمكنك حجز هذا المكان لعرض علامتك التجارية.</span>
`;

function getDate(timestamp) {
  if (!timestamp) return null;

  const date =
    typeof timestamp.toDate === "function"
      ? timestamp.toDate()
      : new Date(timestamp);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getSlotStatus(campaigns, slotId) {
  const now = Date.now();

  const slotCampaigns = campaigns
    .filter((item) => item.slotId === slotId)
    .map((item) => {
      const email = (item.advertiserEmail || "")
        .trim()
        .toLowerCase();

      return {
        ...item,
        isAdmin: email === ADMIN_EMAIL,
        start: getDate(item.startAt),
        end: getDate(item.endAt),
      };
    })
    .filter((item) =>
      item.start &&
      item.end &&
      item.end.getTime() > now
    );

  // حملاتك الشخصية لا تحجز المساحة تجارياً
  const adminCampaign = slotCampaigns.find(
    (item) => item.isAdmin && item.start.getTime() <= now
  );

  // حملات المعلنين الخارجيين فقط هي التي تحجز المساحة
  const matchingCampaigns = slotCampaigns
    .filter((item) =>
      !item.isAdmin && item.status === "active"
    )
    .sort((a, b) =>
      a.start.getTime() - b.start.getTime()
    );

  const currentCampaign = matchingCampaigns.find(
    (item) => item.start.getTime() <= now
  );

  if (currentCampaign) {
    return {
      status: "booked",
      campaign: currentCampaign,
    };
  }

  if (matchingCampaigns.length > 0) {
    return {
      status: "upcoming",
      campaign: matchingCampaigns[0],
    };
  }

  if (adminCampaign) {
    return {
      status: "admin",
      campaign: adminCampaign,
    };
  }

  return { status: "available" };
}

function formatCampaignDate(date) {
  return date.toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function updateSlotCard(card, result) {
  const statusElement = card.querySelector("[data-availability]");

  const bookingLink = card.querySelector(
    ".slot-button, .floating-space-button"
  );

  if (!statusElement) return;

  card.classList.remove(
    "slot-is-available",
    "slot-is-booked",
    "slot-is-upcoming"
  );

  if (result.status === "booked") {
    const startDate = formatCampaignDate(result.campaign.start);
    const endDate = formatCampaignDate(result.campaign.end);

    statusElement.textContent =
      `🔴 محجوزة من ${startDate} حتى ${endDate}`;

    card.classList.add("slot-is-booked");

    if (bookingLink) {
      bookingLink.textContent = "المساحة محجوزة حاليًا";
      bookingLink.removeAttribute("href");
      bookingLink.removeAttribute("target");
      bookingLink.setAttribute("aria-disabled", "true");
      bookingLink.style.pointerEvents = "none";
      bookingLink.style.opacity = "0.55";
    }

    return;
  }

  if (result.status === "upcoming") {
    const startDate = formatCampaignDate(result.campaign.start);

    statusElement.textContent = `🟡 متاحة حتى ${startDate}`;
    card.classList.add("slot-is-upcoming");

    if (bookingLink) {
      bookingLink.textContent = "استفسر عن موعد الإتاحة";
    }

    return;
  }

  if (result.status === "admin") {
    statusElement.innerHTML = ADMIN_MESSAGE;
    card.classList.add("slot-is-available");

    if (bookingLink) {
      bookingLink.textContent = "احجز هذه المساحة";
      bookingLink.setAttribute("href", bookingLink.dataset.originalHref || "#");
      bookingLink.removeAttribute("aria-disabled");
      bookingLink.style.pointerEvents = "";
      bookingLink.style.opacity = "";
    }

    return;
  }

  statusElement.textContent = "🟢 متاحة للحجز";
  card.classList.add("slot-is-available");
}

async function loadAvailability() {
  const cards = document.querySelectorAll("[data-slot-id]");

  if (!cards.length) {
    console.warn("[LOLME Ads] لم يتم العثور على بطاقات المساحات.");
    return;
  }

  // حفظ روابط الحجز الأصلية قبل أي تعديل
  cards.forEach((card) => {
    const link = card.querySelector(
      ".slot-button, .floating-space-button"
    );

    if (link && link.href) {
      link.dataset.originalHref = link.href;
    }
  });

  try {
    const campaignsQuery = query(
      collection(db, "adCampaigns"),
      where("status", "==", "active")
    );

    const snapshot = await getDocs(campaignsQuery);

    const campaigns = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    cards.forEach((card) => {
      const slotId = card.dataset.slotId;

      if (!slotId) return;

      const result = getSlotStatus(campaigns, slotId);

      updateSlotCard(card, result);
    });

    console.log(
      `[LOLME Ads] تم فحص ${cards.length} مساحة إعلانية بنجاح.`
    );

  } catch (error) {
    console.error(
      "[LOLME Ads] تعذر تحميل حالة المساحات:",
      error
    );

    cards.forEach((card) => {
      const status = card.querySelector("[data-availability]");

      if (status) {
        status.textContent = "تعذر التحقق من التوافر";
      }
    });
  }
}

loadAvailability();
