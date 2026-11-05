// public/js/admin/ads.js
import {
  auth,
  onAuthStateChanged,
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
  functions,
  httpsCallable,
} from "/js/firebase.js";

const $ = (id) => document.getElementById(id);
const PAGE_SIZE = 12;

const findAdvertiserByEmail = httpsCallable(functions, "findAdvertiserByEmail");

const SLOT_MONTHLY_PRICES = {
  "jokes-1": 299,
  "jokes-2": 249,
  "jokes-3": 199,
  "jokes-4": 179,
  "jokes-5": 149,
  "jokes-6": 129,
  "jokes-7": 119,
  "jokes-8": 109,
  "jokes-9": 99,
  "jokes-10": 89,
  "jokes-11": 79,
  tests: 0,
  "floating-right": 399,
  "floating-left": 399,
  "floating-main": 399,
};

function updateCampaignPrice() {
  const slotId = $("ad-slot")?.value || "";
  const monthlyPrice = SLOT_MONTHLY_PRICES[slotId] ?? 0;

  const startValue = $("ad-start")?.value;
  const endValue = $("ad-end")?.value;

  let durationDays = 0;
  let billingPeriods = 0;
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

      billingPeriods = Math.ceil(durationDays / 30);
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

let initialized = false;
let authReadyPromise = null;
let allCampaigns = [];
let currentPage = 1;

function showMessage(id, message) {
  const element = $(id);
  if (element) element.textContent = message;
}

function toLocalDateTime(value) {
  if (!value) return "";
  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);

  return local.toISOString().slice(0, 16);
}

function safeText(tag, text) {
  const element = document.createElement(tag);
  element.textContent = text ?? "";
  return element;
}

function waitForAuth() {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  if (!authReadyPromise) {
    authReadyPromise = new Promise((resolve) => {
      let unsubscribe;

      unsubscribe = onAuthStateChanged(
        auth,
        (user) => {
          unsubscribe?.();
          resolve(user);
        },
        (error) => {
          unsubscribe?.();
          authReadyPromise = null;
          console.error("[Ads Admin] Auth error:", error);
          resolve(null);
        },
      );
    });
  }

  return authReadyPromise;
}

async function verifyAdmin() {
  const user = await waitForAuth();

  if (!user) {
    throw new Error("سجّل الدخول إلى حساب الأدمن أولًا.");
  }

  const token = await user.getIdTokenResult(true);

  if (token.claims.admin !== true) {
    throw new Error("الحساب الحالي لا يمتلك صلاحية إدارة الإعلانات.");
  }

  return user;
}

function getImageUrls(data) {
  if (Array.isArray(data.imageUrls) && data.imageUrls.length) {
    return data.imageUrls;
  }

  return data.imageUrl ? [data.imageUrl] : [];
}

function validateUrl(value, label) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`رابط ${label} غير صحيح.`);
  }

  if (!["https:", "http:"].includes(url.protocol)) {
    throw new Error(`رابط ${label} يجب أن يبدأ بـ https:// أو http://`);
  }

  return url.href;
}

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

function resetForm() {
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
}

function fillForm(id, data) {
  $("campaign-id").value = id;
  $("advertiser-name").value = data.advertiserName || "";

  if ($("advertiser-email")) {
    $("advertiser-email").value = data.advertiserEmail || "";
  }

  $("ad-slot").value = data.slotId || "jokes-1";

  $("ad-start").value = toLocalDateTime(data.startAt);
  $("ad-end").value = toLocalDateTime(data.endAt);

  updateCampaignPrice();

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
  $("ad-save").textContent = "حفظ التعديلات";
  $("ad-cancel").hidden = false;

  showMessage(
    "ad-form-message",
    `تعدّل الآن حملة ${data.advertiserName || id}`,
  );

  $("ad-campaign-form").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });

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

  if ($("ad-payment-status")) {
    $("ad-payment-status").value = data.paymentStatus || "unpaid";
  }

  updateCampaignPrice();
}

async function saveCampaign(event) {
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

    // البحث عن حساب المعلن وربط الحملة بمعرّف حسابه
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
      // تجاهل الحملة الحالية أثناء التعديل
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

      // يوجد تعارض إذا تداخلت الفترتان
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

      // منع تغيير مالك حملة مرتبطة بحساب آخر دون إجراء صريح
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
      $("ad-save").textContent = "حفظ التعديلات";
      $("ad-cancel").hidden = false;

      showMessage("ad-form-message", "تم حفظ الحملة بنجاح.");
    }

    await loadCampaigns();
    await loadAdStatistics();
  } catch (error) {
    console.error("[Ads Admin] Save error:", error);

    showMessage("ad-form-message", error?.message || "تعذر حفظ الحملة.");
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
}

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

function getCampaignDate(value) {
  if (!value) return 0;

  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

function getEffectiveStatus(data) {
  if (data.status !== "active") return "paused";

  const now = Date.now();
  const start = getCampaignDate(data.startAt);
  const end = getCampaignDate(data.endAt);

  if (end && end < now) return "expired";
  if (start && start > now) return "scheduled";

  return "active";
}

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

function renderCampaigns() {
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

function formatStatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function getDayString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function initializeStatsDates() {
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

async function loadAdStatistics() {
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

  showMessage("ad-stats-message", "جارٍ تحميل الإحصائيات...");

  try {
    await verifyAdmin();

    const campaignStats = await Promise.all(
      allCampaigns.map(async ({ id, data }) => {
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
          const dayImpressions = Number(day.impressions) || 0;
          const dayClicks = Number(day.clicks) || 0;
          const dayVisitors = Number(day.uniqueVisitors) || 0;

          totals.impressions += dayImpressions;
          totals.clicks += dayClicks;
          totals.visitors += dayVisitors;

          totals.daily[day.date] = {
            impressions: dayImpressions,
            clicks: dayClicks,
            visitors: dayVisitors,
          };

          // تجميع إحصائيات الصفحات
          const dailyPlacements = day.placements || {};

          for (const placement of Object.values(dailyPlacements)) {
            const pagePath = placement.pagePath || "/";

            if (!placementsMap.has(pagePath)) {
              placementsMap.set(pagePath, {
                pagePath,
                impressions: 0,
                clicks: 0,
                dailyStats: [],
              });
            }

            const item = placementsMap.get(pagePath);
            const placementImpressions = Number(placement.impressions) || 0;
            const placementClicks = Number(placement.clicks) || 0;

            item.impressions += placementImpressions;
            item.clicks += placementClicks;

            item.dailyStats.push({
              date: day.date,
              impressions: placementImpressions,
              clicks: placementClicks,
            });
          }
        }

        const placements = Array.from(placementsMap.values())
          .map((placement) => ({
            ...placement,
            ctr:
              placement.impressions > 0
                ? Number(
                    ((placement.clicks / placement.impressions) * 100).toFixed(
                      2,
                    ),
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
          ctr:
            totals.impressions > 0
              ? Number(((totals.clicks / totals.impressions) * 100).toFixed(2))
              : 0,
        };
      }),
    );

    renderAdStatistics(campaignStats);

    showMessage(
      "ad-stats-message",
      `تم تحميل الإحصائيات من ${startDay} إلى ${endDay}.`,
    );
  } catch (error) {
    console.error("[Ads Admin] Statistics error:", error);

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

  $("stat-impressions").textContent = formatStatNumber(totals.impressions);

  $("stat-clicks").textContent = formatStatNumber(totals.clicks);

  $("stat-visitors").textContent = formatStatNumber(totals.visitors);

  $("stat-ctr").textContent = `${ctr.toFixed(2)}%`;

  renderAdStatsChart(totals.daily);
  renderCampaignStatsTable(campaigns);
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

  // نعرض آخر 14 يومًا متاحًا لتجنب ازدحام الرسم.
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

  // تجميع الحملات حسب هوية المعلن
  for (const campaign of campaigns) {
    const uid = campaign.advertiserUid || "";
    const email = String(campaign.email || "")
      .trim()
      .toLowerCase();

    const key = uid ? `uid:${uid}` : `unlinked:${campaign.id}`;

    if (!advertisers.has(key)) {
      advertisers.set(key, {
        key,
        uid,
        email,
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

  const number = (value) => formatStatNumber(value);

  for (const advertiser of sorted) {
    const ctr = advertiser.impressions
      ? (advertiser.clicks / advertiser.impressions) * 100
      : 0;

    const row = document.createElement("tr");

    row.append(
      safeText("td", advertiser.name || "معلن بدون اسم"),
      safeText("td", number(advertiser.campaigns.length)),
      safeText("td", number(advertiser.impressions)),
      safeText("td", number(advertiser.clicks)),
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

    // صف تفاصيل المعلن
    const detailsRow = document.createElement("tr");
    detailsRow.hidden = true;

    const wrapperCell = document.createElement("td");
    wrapperCell.colSpan = 6;

    const wrapper = document.createElement("div");
    wrapper.className = "ad-advertiser-details";

    const title = safeText("strong", `📢 حملات ${advertiser.name || "المعلن"}`);

    wrapper.append(title);

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
        ["مرات الظهور", number(campaign.impressions)],
        ["الزوار المختلفون", number(campaign.visitors)],
        ["النقرات", number(campaign.clicks)],
        ["معدل النقر CTR", `${campaignCtr.toFixed(2)}%`],
      ];

      for (const [label, value] of metrics) {
        const metric = document.createElement("div");
        metric.className = "admin-performance-number";

        metric.append(safeText("span", label), safeText("strong", value));

        campaignNumbers.append(metric);
      }

      campaignBox.append(campaignTitle, campaignMeta, campaignNumbers);

      // الأداء حسب الصفحة
      const placementsSection = document.createElement("div");
      placementsSection.className = "admin-placement-section";

      placementsSection.append(
        safeText("h6", "📍 أداء الإعلان حسب مكان ظهوره"),
      );

      const pageNames = {
        "/tests": "🧩 صفحة الاختبارات",
        "/jokes": "😂 صفحة النكت",
      };

      if (!campaign.placements.length) {
        placementsSection.append(
          safeText(
            "p",
            "لا توجد إحصائيات مسجلة حسب الصفحة خلال الفترة المحددة.",
          ),
        );
      } else {
        const placementsGrid = document.createElement("div");
        placementsGrid.className = "admin-placement-grid";

        for (const placement of campaign.placements) {
          const placementCard = document.createElement("div");
          placementCard.className = "admin-placement-card";

          placementCard.append(
            safeText(
              "h6",
              pageNames[placement.pagePath] || `📄 ${placement.pagePath}`,
            ),
          );

          const placementNumbers = document.createElement("div");
          placementNumbers.className = "admin-placement-numbers";

          const placementMetrics = [
            ["مرات الظهور", number(placement.impressions)],
            ["النقرات", number(placement.clicks)],
            ["CTR", `${placement.ctr.toFixed(2)}%`],
          ];

          for (const [label, value] of placementMetrics) {
            const metric = document.createElement("div");
            metric.className = "admin-placement-number";

            metric.append(safeText("span", label), safeText("strong", value));

            placementNumbers.append(metric);
          }

          placementCard.append(placementNumbers);
          placementsGrid.append(placementCard);
        }

        placementsSection.append(placementsGrid);
      }

      campaignBox.append(placementsSection);

      // الأداء اليومي
      const dailyDetails = document.createElement("details");
      dailyDetails.className = "admin-daily-details";

      dailyDetails.append(safeText("summary", "📅 عرض الأداء اليومي"));

      const dailyEntries = Object.entries(campaign.daily || {}).sort(
        ([a], [b]) => b.localeCompare(a),
      );

      if (!dailyEntries.length) {
        dailyDetails.append(
          safeText("p", "لا توجد بيانات يومية في الفترة المحددة."),
        );
      } else {
        const dailyTableWrap = document.createElement("div");
        dailyTableWrap.className = "ad-stats-table-wrap";

        const dailyTable = document.createElement("table");
        dailyTable.className = "ad-stats-table";

        const thead = document.createElement("thead");
        const header = document.createElement("tr");

        [
          "التاريخ",
          "مرات الظهور",
          "الزوار المختلفون",
          "النقرات",
          "CTR",
        ].forEach((label) => {
          header.append(safeText("th", label));
        });

        thead.append(header);

        const dailyBody = document.createElement("tbody");

        for (const [date, values] of dailyEntries) {
          const dailyCtr = values.impressions
            ? (values.clicks / values.impressions) * 100
            : 0;

          const dailyRow = document.createElement("tr");

          dailyRow.append(
            safeText("td", date),
            safeText("td", number(values.impressions)),
            safeText("td", number(values.visitors)),
            safeText("td", number(values.clicks)),
            safeText("td", `${dailyCtr.toFixed(2)}%`),
          );

          dailyBody.append(dailyRow);
        }

        dailyTable.append(thead, dailyBody);
        dailyTableWrap.append(dailyTable);
        dailyDetails.append(dailyTableWrap);
      }

      campaignBox.append(dailyDetails);
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

async function loadCampaigns() {
  const list = $("ad-campaign-list");
  if (!list) return;

  list.replaceChildren();

  showMessage("ad-list-message", "جارٍ تحميل كل الحملات من Firestore...");

  try {
    await verifyAdmin();

    // تحميل كل المستندات لتضمين الحملات القديمة التي لا تحتوي createdAt.
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

function setupFilters() {
  for (const id of ["ad-search", "ad-filter-slot", "ad-filter-status"]) {
    $(id)?.addEventListener(id === "ad-search" ? "input" : "change", () => {
      currentPage = 1;
      renderCampaigns();
    });
  }
}

export async function initAds() {
  const form = $("ad-campaign-form");
  if (!form) return;

  if (!initialized) {
    initialized = true;
    initializeStatsDates();

    $("ad-stats-refresh")?.addEventListener("click", loadAdStatistics);
    $("ad-slot")?.addEventListener("change", updateCampaignPrice);
    $("ad-start")?.addEventListener("change", updateCampaignPrice);
    $("ad-end")?.addEventListener("change", updateCampaignPrice);
    form.addEventListener("submit", saveCampaign);

    $("ad-cancel")?.addEventListener("click", () => {
      resetForm();
      showMessage("ad-form-message", "");
    });

    $("ad-refresh")?.addEventListener("click", loadCampaigns);

    setupFilters();
  }

  try {
    await verifyAdmin();
    await loadCampaigns();
  } catch (error) {
    console.error("[Ads Admin] Initialization error:", error);

    showMessage(
      "ad-list-message",
      error?.message || "تعذر التحقق من صلاحية الأدمن.",
    );
  }
}

window.initAds = initAds;
initAds();
