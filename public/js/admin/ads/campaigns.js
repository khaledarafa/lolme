// public/js/admin/ads/campaigns.js
import {
  db,
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "/js/firebase.js";
import {
  $,
  PAGE_SIZE,
  findAdvertiserByEmail,
  SLOT_MONTHLY_PRICES,
  showMessage,
  safeText,
  getImageUrls,
  validateUrl,
  getCampaignDate,
  toLocalDateTime,
  verifyAdmin,
} from "./shared.js";

let allCampaigns = [];
let currentPage = 1;

export function getAllCampaigns() {
  return allCampaigns;
}

// ==============================
// حساب سعر الحملة
// ==============================

export function updateCampaignPrice() {
  const slotId = $("ad-slot")?.value || "";
  const monthlyPrice = SLOT_MONTHLY_PRICES[slotId] ?? 0;

  const startValue = $("ad-start")?.value;
  const endValue = $("ad-end")?.value;

  let durationDays = 0;
  let totalPrice = 0;

  if (startValue && endValue) {
    const startAt = new Date(startValue);
    const endAt = new Date(endValue);

    if (
      !Number.isNaN(startAt.getTime()) &&
      !Number.isNaN(endAt.getTime()) &&
      endAt > startAt
    ) {
      durationDays = Math.ceil(
        (endAt.getTime() - startAt.getTime()) / 86400000,
      );

      const billingPeriods = Math.ceil(durationDays / 30);
      totalPrice = monthlyPrice * billingPeriods;
    }
  }

  if ($("ad-monthly-price")) {
    $("ad-monthly-price").value = monthlyPrice;
  }

  if ($("ad-duration-days")) {
    $("ad-duration-days").value = durationDays;
  }

  if ($("ad-total-price")) {
    $("ad-total-price").value = totalPrice;
  }
}

// ==============================
// قراءة صور الإعلان
// ==============================

function readImages() {
  const field = $("ad-images") || $("ad-image");

  if (!field) {
    throw new Error("حقل صور الإعلان غير موجود.");
  }

  const urls = field.value
    .split(/\r?\n/)
    .map((value) => value.trim())
    .filter(Boolean);

  if (!urls.length) {
    throw new Error("أضف رابط صورة واحدًا على الأقل.");
  }

  if (urls.length > 10) {
    throw new Error("الحد الأقصى 10 صور للحملة.");
  }

  return [...new Set(urls)].map((url, index) =>
    validateUrl(url, `الصورة رقم ${index + 1}`),
  );
}

// ==============================
// إعادة ضبط النموذج
// ==============================

export function resetForm() {
  $("ad-campaign-form")?.reset();

  if ($("campaign-id")) {
    $("campaign-id").value = "";
  }

  if ($("ad-cancel")) {
    $("ad-cancel").hidden = true;
  }

  if ($("ad-save")) {
    $("ad-save").textContent = "حفظ الحملة";
  }

  updateCampaignPrice();
}

// ==============================
// تحميل بيانات حملة في النموذج
// ==============================

export function fillForm(id, data) {
  // الانتقال إلى قسم إضافة/تعديل الحملة
  const adminRoot = $("ad-campaign-form")?.closest(".ads-admin");

  if (adminRoot) {
    adminRoot.querySelectorAll("[data-admin-panel]").forEach((panel) => {
      panel.hidden = panel.dataset.adminPanel !== "campaign-form";
    });

    adminRoot.querySelectorAll("[data-admin-view]").forEach((button) => {
      const isActive = button.dataset.adminView === "campaign-form";
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-current", isActive ? "page" : "false");
    });
  }

  $("campaign-id").value = id;
  $("advertiser-name").value = data.advertiserName || "";

  if ($("advertiser-email")) {
    $("advertiser-email").value = data.advertiserEmail || "";
  }

  $("ad-slot").value = data.slotId || "jokes-1";

  $("ad-start").value = toLocalDateTime(data.startAt);
  $("ad-end").value = toLocalDateTime(data.endAt);

  const imagesField = $("ad-images") || $("ad-image");

  if (imagesField) {
    imagesField.value = getImageUrls(data).join("\n");
  }

  if ($("ad-headline")) {
    $("ad-headline").value = data.headline || "";
  }

  if ($("ad-description")) {
    $("ad-description").value = data.description || "";
  }

  if ($("ad-button-text")) {
    $("ad-button-text").value = data.buttonText || "";
  }

  $("ad-url").value = data.targetUrl || "";
  $("ad-status").value = data.status || "paused";

  if ($("ad-save")) {
    $("ad-save").textContent = "حفظ التعديلات";
  }

  if ($("ad-cancel")) {
    $("ad-cancel").hidden = false;
  }

  if ($("ad-payment-status")) {
    $("ad-payment-status").value = data.paymentStatus || "unpaid";
  }

  if ($("ad-payment-method")) {
    $("ad-payment-method").value = data.paymentMethod || "";
  }

  if ($("ad-paid-at")) {
    const paidAt = data.paidAt?.toDate
      ? data.paidAt.toDate()
      : data.paidAt
        ? new Date(data.paidAt)
        : null;

    $("ad-paid-at").value =
      paidAt && !Number.isNaN(paidAt.getTime())
        ? `${paidAt.getFullYear()}-${String(paidAt.getMonth() + 1).padStart(2, "0")}-${String(paidAt.getDate()).padStart(2, "0")}`
        : "";
  }

  updateCampaignPrice();

  showMessage(
    "ad-form-message",
    `تعدّل الآن حملة ${data.advertiserName || id}`,
  );

  requestAnimationFrame(() => {
    $("ad-campaign-form").scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

// ==============================
// حفظ حملة جديدة أو تعديل حملة
// ==============================

export async function saveCampaign(event) {
  event.preventDefault();

  const saveButton = $("ad-save");

  if (saveButton) saveButton.disabled = true;

  try {
    await verifyAdmin();

    const advertiserName = $("advertiser-name").value.trim();

    const advertiserEmail = ($("advertiser-email")?.value || "")
      .trim()
      .toLowerCase();

    const slotId = $("ad-slot").value;
    const imageUrls = readImages();

    const targetUrl = validateUrl($("ad-url").value.trim(), "الوجهة");

    const startValue = $("ad-start").value;
    const endValue = $("ad-end").value;

    const startAt = new Date(startValue);
    const endAt = new Date(endValue);

    const status = $("ad-status").value;
    const campaignId = $("campaign-id").value.trim();

    // التحقق من البيانات الأساسية

    if (!advertiserName) {
      throw new Error("اكتب اسم المعلن.");
    }

    if (!advertiserEmail) {
      throw new Error("اكتب البريد الإلكتروني للمعلن.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(advertiserEmail)) {
      throw new Error("البريد الإلكتروني للمعلن غير صحيح.");
    }

    // البحث عن حساب المعلن وربط الحملة به

    const advertiserResult = await findAdvertiserByEmail({
      email: advertiserEmail,
    });

    const advertiser = advertiserResult.data;

    if (!advertiser?.success || !advertiser.uid) {
      throw new Error("لم يتم العثور على حساب صالح للمعلن.");
    }

    if (!advertiser.emailVerified) {
      throw new Error(
        "يجب أن يتحقق المعلن من بريده الإلكتروني قبل ربط الحملة.",
      );
    }

    const advertiserUid = advertiser.uid;

    if (!slotId) {
      throw new Error("اختر المساحة الإعلانية.");
    }

    if (
      !startValue ||
      !endValue ||
      Number.isNaN(startAt.getTime()) ||
      Number.isNaN(endAt.getTime())
    ) {
      throw new Error("تأكد من تاريخ البداية والنهاية.");
    }

    if (endAt <= startAt) {
      throw new Error("تاريخ النهاية يجب أن يكون بعد البداية.");
    }

    if (!["active", "paused"].includes(status)) {
      throw new Error("حالة الحملة غير صحيحة.");
    }

    // حساب مدة الحملة والسعر

    const durationDays = Math.ceil(
      (endAt.getTime() - startAt.getTime()) / 86400000,
    );

    const monthlyPrice = SLOT_MONTHLY_PRICES[slotId] ?? 0;
    const billingPeriods = Math.ceil(durationDays / 30);
    const totalPrice = monthlyPrice * billingPeriods;

    // التحقق من تعارض الحجوزات على نفس المساحة

    const campaignsQuery = query(
      collection(db, "adCampaigns"),
      where("slotId", "==", slotId),
    );

    const campaignsSnapshot = await getDocs(campaignsQuery);

    for (const campaignDoc of campaignsSnapshot.docs) {
      if (campaignDoc.id === campaignId) continue;

      const existing = campaignDoc.data();

      const existingStart = existing.startAt?.toDate
        ? existing.startAt.toDate()
        : new Date(existing.startAt);

      const existingEnd = existing.endAt?.toDate
        ? existing.endAt.toDate()
        : new Date(existing.endAt);

      if (
        Number.isNaN(existingStart.getTime()) ||
        Number.isNaN(existingEnd.getTime())
      ) {
        continue;
      }

      const hasOverlap = startAt < existingEnd && endAt > existingStart;

      if (hasOverlap) {
        throw new Error(
          `لا يمكن الحفظ: المساحة ${slotId} محجوزة بالفعل بحملة أخرى من ${existingStart.toLocaleDateString("ar-EG")} إلى ${existingEnd.toLocaleDateString("ar-EG")}. اختر فترة مختلفة.`,
        );
      }
    }

    // بيانات الدفع

    const paymentStatus = $("ad-payment-status")?.value || "unpaid";

    const paymentMethod = $("ad-payment-method")?.value || "";

    const paidAtValue = $("ad-paid-at")?.value || "";

    if (!["paid", "unpaid"].includes(paymentStatus)) {
      throw new Error("حالة الدفع غير صحيحة.");
    }

    if (paymentStatus === "paid") {
      if (!paymentMethod) {
        throw new Error("اختر طريقة الدفع.");
      }

      if (!paidAtValue) {
        throw new Error("حدد تاريخ استلام الدفع.");
      }
    }

    const paidAmount = paymentStatus === "paid" ? totalPrice : 0;

    const paidAt =
      paymentStatus === "paid" ? new Date(`${paidAtValue}T12:00:00`) : null;

    // تحديث الحقول الظاهرة في النموذج

    if ($("ad-monthly-price")) {
      $("ad-monthly-price").value = monthlyPrice;
    }

    if ($("ad-duration-days")) {
      $("ad-duration-days").value = durationDays;
    }

    if ($("ad-total-price")) {
      $("ad-total-price").value = totalPrice;
    }

    // بيانات الحملة

    const campaignData = {
      advertiserName,
      advertiserEmail,
      advertiserUid,
      slotId,

      monthlyPrice,
      durationDays,
      totalPrice,

      paymentStatus,
      paymentMethod: paymentStatus === "paid" ? paymentMethod : "",
      paidAmount,
      paidAt,

      imageUrls,
      imageUrl: imageUrls[0],

      targetUrl,
      startAt,
      endAt,
      status,

      updatedAt: serverTimestamp(),
    };

    if ($("ad-headline")) {
      campaignData.headline = $("ad-headline").value.trim();
    }

    if ($("ad-description")) {
      campaignData.description = $("ad-description").value.trim();
    }

    if ($("ad-button-text")) {
      campaignData.buttonText = $("ad-button-text").value.trim();
    }

    // حفظ التعديلات أو إنشاء حملة جديدة

    if (campaignId) {
      const campaignRef = doc(db, "adCampaigns", campaignId);

      const existing = await getDoc(campaignRef);

      if (!existing.exists()) {
        throw new Error("الحملة المطلوب تعديلها غير موجودة.");
      }

      const currentAdvertiserUid = existing.data().advertiserUid || "";

      if (currentAdvertiserUid && currentAdvertiserUid !== advertiserUid) {
        throw new Error(
          "البريد المدخل تابع لحساب مختلف عن مالك الحملة الحالي. لا يمكن تغيير مالك الحملة بهذه الطريقة.",
        );
      }

      await setDoc(campaignRef, campaignData, {
        merge: true,
      });

      showMessage("ad-form-message", "تم تحديث الحملة بنجاح.");
    } else {
      const newCampaign = await addDoc(collection(db, "adCampaigns"), {
        ...campaignData,
        createdAt: serverTimestamp(),
      });

      $("campaign-id").value = newCampaign.id;

      if ($("ad-save")) {
        $("ad-save").textContent = "حفظ التعديلات";
      }

      if ($("ad-cancel")) {
        $("ad-cancel").hidden = false;
      }

      showMessage("ad-form-message", "تم حفظ الحملة بنجاح.");
    }

    await loadCampaigns();
  } catch (error) {
    console.error("[Ads Admin] Save error:", error);

    showMessage("ad-form-message", error?.message || "تعذر حفظ الحملة.");
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
}

// ==============================
// تفعيل وإيقاف الحملة
// ==============================

async function toggleCampaign(id, currentStatus, button) {
  button.disabled = true;

  try {
    await verifyAdmin();

    const nextStatus = currentStatus === "active" ? "paused" : "active";

    await updateDoc(doc(db, "adCampaigns", id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    showMessage(
      "ad-list-message",
      nextStatus === "active"
        ? "تم تفعيل الحملة في Firestore."
        : "تم إيقاف الحملة في Firestore.",
    );

    await loadCampaigns();
  } catch (error) {
    console.error("[Ads Admin] Toggle error:", error);

    showMessage("ad-list-message", error?.message || "تعذر تغيير حالة الحملة.");
  } finally {
    button.disabled = false;
  }
}

// ==============================
// حذف الحملة
// ==============================

async function deleteCampaign(id, advertiserName, button) {
  const confirmed = window.confirm(
    `هل أنت متأكد من حذف إعلان "${advertiserName || id}" نهائيًا؟`,
  );

  if (!confirmed) return;

  button.disabled = true;

  try {
    await verifyAdmin();

    await deleteDoc(doc(db, "adCampaigns", id));

    if ($("campaign-id")?.value === id) {
      resetForm();
      showMessage("ad-form-message", "تم حذف الحملة.");
    }

    showMessage("ad-list-message", "تم حذف الحملة بنجاح.");

    await loadCampaigns();
  } catch (error) {
    console.error("[Ads Admin] Delete error:", error);

    showMessage("ad-list-message", error?.message || "تعذر حذف الحملة.");
  } finally {
    button.disabled = false;
  }
}

// ==============================
// الحالة الفعلية للحملة
// ==============================

function getEffectiveStatus(data) {
  if (data.status !== "active") return "paused";

  const now = Date.now();
  const start = getCampaignDate(data.startAt);
  const end = getCampaignDate(data.endAt);

  if (end && end < now) return "expired";
  if (start && start > now) return "scheduled";

  return "active";
}

// ==============================
// البحث والفلاتر
// ==============================

function getFilteredCampaigns() {
  const search = ($("ad-search")?.value || "").trim().toLocaleLowerCase();

  const slotFilter = $("ad-filter-slot")?.value || "all";
  const statusFilter = $("ad-filter-status")?.value || "all";

  return allCampaigns.filter(({ id, data }) => {
    const name = String(data.advertiserName || "").toLocaleLowerCase();

    const email = String(data.advertiserEmail || "").toLocaleLowerCase();

    const campaignId = String(id).toLocaleLowerCase();

    const matchesSearch =
      !search ||
      name.includes(search) ||
      email.includes(search) ||
      campaignId.includes(search);

    const matchesSlot =
      slotFilter === "all" || (data.slotId || "") === slotFilter;

    const effectiveStatus = getEffectiveStatus(data);

    const matchesStatus =
      statusFilter === "all" || effectiveStatus === statusFilter;

    return matchesSearch && matchesSlot && matchesStatus;
  });
}

// ==============================
// إنشاء بطاقة الحملة
// ==============================

function makeCampaignCard(id, data) {
  const card = document.createElement("article");
  card.className = "ad-campaign-card";

  const effectiveStatus = getEffectiveStatus(data);

  const statusLabels = {
    active: "🟢 نشطة",
    paused: "⏸️ متوقفة",
    expired: "⚫ منتهية بالتاريخ",
    scheduled: "🕒 لم يبدأ موعدها",
  };

  const imageUrls = getImageUrls(data);

  card.append(
    safeText("h4", data.advertiserName || "معلن بدون اسم"),
    safeText("p", `معرّف الحملة: ${id}`),
    safeText("p", `البريد: ${data.advertiserEmail || "غير مسجل"}`),
    safeText("p", `المساحة: ${data.slotId || "—"}`),
    safeText("p", `الحالة: ${statusLabels[effectiveStatus]}`),
    safeText("p", `البداية: ${toLocalDateTime(data.startAt) || "—"}`),
    safeText("p", `النهاية: ${toLocalDateTime(data.endAt) || "—"}`),
    safeText("p", `عدد الصور: ${imageUrls.length}`),
  );

  if (data.headline) {
    card.append(safeText("p", `العنوان: ${data.headline}`));
  }

  if (data.description) {
    card.append(safeText("p", `الوصف: ${data.description}`));
  }

  if (data.buttonText) {
    card.append(safeText("p", `نص الزر: ${data.buttonText}`));
  }

  if (data.targetUrl) {
    card.append(safeText("p", `رابط الوجهة: ${data.targetUrl}`));
  }

  // معاينة الصور

  const imagesContainer = document.createElement("div");
  imagesContainer.className = "ad-campaign-images";

  for (const url of imageUrls.slice(0, 10)) {
    try {
      const parsed = new URL(url);

      if (!["https:", "http:"].includes(parsed.protocol)) {
        continue;
      }

      const image = document.createElement("img");

      image.src = parsed.href;
      image.alt = `إعلان ${data.advertiserName || ""}`;
      image.loading = "lazy";
      image.referrerPolicy = "no-referrer";

      imagesContainer.append(image);
    } catch {
      // تجاهل رابط الصورة غير الصحيح في المعاينة.
    }
  }

  if (imagesContainer.childElementCount) {
    card.append(imagesContainer);
  }

  // أزرار التحكم

  const actions = document.createElement("div");
  actions.className = "ad-campaign-actions";

  const editButton = safeText("button", "✏️ تعديل");
  editButton.type = "button";

  editButton.addEventListener("click", () => {
    fillForm(id, data);
  });

  const isActive = data.status === "active";

  const toggleButton = safeText(
    "button",
    isActive ? "⏸️ إيقاف الإعلان" : "▶️ تفعيل الإعلان",
  );

  toggleButton.type = "button";
  toggleButton.className = isActive ? "ad-pause" : "ad-activate";

  toggleButton.addEventListener("click", () => {
    toggleCampaign(id, data.status, toggleButton);
  });

  const deleteButton = safeText("button", "🗑️ حذف الإعلان");

  deleteButton.type = "button";
  deleteButton.className = "ad-delete";

  deleteButton.addEventListener("click", () => {
    deleteCampaign(id, data.advertiserName, deleteButton);
  });

  actions.append(editButton, toggleButton, deleteButton);
  card.append(actions);

  return card;
}

// ==============================
// ترقيم الصفحات
// ==============================

function renderPagination(filteredCount, totalPages) {
  const holder = $("ad-pagination");

  if (!holder) return;

  holder.replaceChildren();

  const previous = safeText("button", "← السابقة");
  previous.type = "button";
  previous.disabled = currentPage <= 1;

  previous.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderCampaigns();
    }
  });

  const label = safeText(
    "span",
    `صفحة ${currentPage} / ${totalPages} — ${filteredCount} حملة`,
  );

  label.className = "ad-pagination-label";

  const next = safeText("button", "التالية →");
  next.type = "button";
  next.disabled = currentPage >= totalPages;

  next.addEventListener("click", () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderCampaigns();
    }
  });

  holder.append(previous, label, next);
}

// ==============================
// عرض الحملات
// ==============================

export function renderCampaigns() {
  const list = $("ad-campaign-list");

  if (!list) return;

  list.replaceChildren();

  const filtered = getFilteredCampaigns();

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  currentPage = Math.min(Math.max(currentPage, 1), totalPages);

  const startIndex = (currentPage - 1) * PAGE_SIZE;

  const pageItems = filtered.slice(startIndex, startIndex + PAGE_SIZE);

  if (!filtered.length) {
    showMessage(
      "ad-list-message",
      allCampaigns.length
        ? "لا توجد حملات مطابقة للبحث أو الفلاتر."
        : "لا توجد حملات مسجلة حتى الآن.",
    );

    renderPagination(0, 1);
    return;
  }

  for (const item of pageItems) {
    list.append(makeCampaignCard(item.id, item.data));
  }

  const activeCount = allCampaigns.filter(
    ({ data }) => getEffectiveStatus(data) === "active",
  ).length;

  const pausedCount = allCampaigns.filter(
    ({ data }) => getEffectiveStatus(data) === "paused",
  ).length;

  showMessage(
    "ad-list-message",
    `إجمالي الحملات: ${allCampaigns.length} | نتائج البحث: ${filtered.length} | النشطة: ${activeCount} | المتوقفة: ${pausedCount} | صفحة ${currentPage} من ${totalPages}`,
  );

  renderPagination(filtered.length, totalPages);
}

// ==============================
// تحميل الحملات من Firestore
// ==============================

export async function loadCampaigns() {
  const list = $("ad-campaign-list");

  if (!list) return;

  list.replaceChildren();

  showMessage("ad-list-message", "جارٍ تحميل كل الحملات من Firestore...");

  try {
    await verifyAdmin();

    // تحميل كل المستندات لتضمين الحملات القديمة
    // التي لا تحتوي على createdAt.

    const snapshot = await getDocs(collection(db, "adCampaigns"));

    allCampaigns = snapshot.docs.map((campaign) => ({
      id: campaign.id,
      data: {
        ...campaign.data(),
        id: campaign.id,
      },
    }));

    allCampaigns.sort((a, b) => {
      const aDate =
        getCampaignDate(a.data.createdAt) || getCampaignDate(a.data.updatedAt);

      const bDate =
        getCampaignDate(b.data.createdAt) || getCampaignDate(b.data.updatedAt);

      return bDate - aDate;
    });

    currentPage = 1;

    renderCampaigns();
  } catch (error) {
    console.error("[Ads Admin] Load error:", error);

    showMessage("ad-list-message", error?.message || "تعذر تحميل الحملات.");
  }
}

// ==============================
// إعداد البحث والفلاتر
// ==============================

export function setupFilters() {
  for (const id of ["ad-search", "ad-filter-slot", "ad-filter-status"]) {
    $(id)?.addEventListener(id === "ad-search" ? "input" : "change", () => {
      currentPage = 1;
      renderCampaigns();
    });
  }
}
