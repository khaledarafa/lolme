
import {
  auth,
  onAuthStateChanged,
  db,
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "/js/firebase.js";

const $ = (id) => document.getElementById(id);
const PAGE_SIZE = 12;

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
  const date = typeof value.toDate === "function"
    ? value.toDate()
    : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000
  );

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
        }
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
    throw new Error(
      `رابط ${label} يجب أن يبدأ بـ https:// أو http://`
    );
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
    validateUrl(url, `الصورة رقم ${index + 1}`)
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
  $("ad-start").value = toLocalDateTime(data.startAt);
  $("ad-end").value = toLocalDateTime(data.endAt);
  $("ad-status").value = data.status || "paused";
  $("ad-save").textContent = "حفظ التعديلات";
  $("ad-cancel").hidden = false;

  showMessage(
    "ad-form-message",
    `تعدّل الآن حملة ${data.advertiserName || id}`
  );

  $("ad-campaign-form").scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

async function saveCampaign(event) {
  event.preventDefault();

  const saveButton = $("ad-save");
  if (saveButton) saveButton.disabled = true;

  try {
    await verifyAdmin();

    const advertiserName = $("advertiser-name").value.trim();

    const advertiserEmail = (
      $("advertiser-email")?.value || ""
    ).trim().toLowerCase();

    const slotId = $("ad-slot").value;
    const imageUrls = readImages();

    const targetUrl = validateUrl(
      $("ad-url").value.trim(),
      "الوجهة"
    );

    const startValue = $("ad-start").value;
    const endValue = $("ad-end").value;
    const startAt = new Date(startValue);
    const endAt = new Date(endValue);
    const status = $("ad-status").value;
    const campaignId = $("campaign-id").value.trim();

    if (!advertiserName) {
      throw new Error("اكتب اسم المعلن.");
    }

    if (
      advertiserEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(advertiserEmail)
    ) {
      throw new Error("البريد الإلكتروني للمعلن غير صحيح.");
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

    const campaignData = {
      advertiserName,
      advertiserEmail,
      slotId,
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
      campaignData.description =
        $("ad-description").value.trim();
    }

    if ($("ad-button-text")) {
      campaignData.buttonText =
        $("ad-button-text").value.trim();
    }

    if (campaignId) {
      const campaignRef = doc(db, "adCampaigns", campaignId);
      const existing = await getDoc(campaignRef);

      if (!existing.exists()) {
        throw new Error("الحملة المطلوب تعديلها غير موجودة.");
      }

      await setDoc(campaignRef, campaignData, { merge: true });

      showMessage(
        "ad-form-message",
        "تم تحديث الحملة بنجاح، والبيانات ما زالت في النموذج."
      );
    } else {
      const newCampaign = await addDoc(
        collection(db, "adCampaigns"),
        {
          ...campaignData,
          createdAt: serverTimestamp(),
        }
      );

      // الاحتفاظ بالبيانات بعد الحفظ، وتحويل النموذج إلى وضع التعديل.
      $("campaign-id").value = newCampaign.id;
      $("ad-save").textContent = "حفظ التعديلات";
      $("ad-cancel").hidden = false;

      showMessage(
        "ad-form-message",
        "تم حفظ الحملة. الحقول ما زالت محتفظة ببياناتها."
      );
    }

    await loadCampaigns();
  } catch (error) {
    console.error("[Ads Admin] Save error:", error);

    showMessage(
      "ad-form-message",
      error?.message || "تعذر حفظ الحملة."
    );
  } finally {
    if (saveButton) saveButton.disabled = false;
  }
}

async function toggleCampaign(id, currentStatus, button) {
  button.disabled = true;

  try {
    await verifyAdmin();

    const nextStatus =
      currentStatus === "active" ? "paused" : "active";

    await updateDoc(doc(db, "adCampaigns", id), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    });

    showMessage(
      "ad-list-message",
      nextStatus === "active"
        ? "تم تفعيل الحملة في Firestore."
        : "تم إيقاف الحملة في Firestore."
    );

    await loadCampaigns();
  } catch (error) {
    console.error("[Ads Admin] Toggle error:", error);

    showMessage(
      "ad-list-message",
      error?.message || "تعذر تغيير حالة الحملة."
    );
  } finally {
    button.disabled = false;
  }
}

async function deleteCampaign(id, advertiserName, button) {
  const confirmed = window.confirm(
    `هل أنت متأكد من حذف إعلان "${advertiserName || id}" نهائيًا؟`
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

    showMessage(
      "ad-list-message",
      error?.message || "تعذر حذف الحملة."
    );
  } finally {
    button.disabled = false;
  }
}

function getCampaignDate(value) {
  if (!value) return 0;

  const date = typeof value.toDate === "function"
    ? value.toDate()
    : new Date(value);

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
  const search = (
    $("ad-search")?.value || ""
  ).trim().toLocaleLowerCase();

  const slotFilter = $("ad-filter-slot")?.value || "all";
  const statusFilter = $("ad-filter-status")?.value || "all";

  return allCampaigns.filter(({ id, data }) => {
    const name = String(
      data.advertiserName || ""
    ).toLocaleLowerCase();

    const email = String(
      data.advertiserEmail || ""
    ).toLocaleLowerCase();

    const campaignId = String(id).toLocaleLowerCase();

    const matchesSearch =
      !search ||
      name.includes(search) ||
      email.includes(search) ||
      campaignId.includes(search);

    const matchesSlot =
      slotFilter === "all" ||
      (data.slotId || "") === slotFilter;

    const effectiveStatus = getEffectiveStatus(data);

    const matchesStatus =
      statusFilter === "all" ||
      effectiveStatus === statusFilter;

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
    safeText(
      "p",
      `البريد: ${data.advertiserEmail || "غير مسجل"}`
    ),
    safeText("p", `المساحة: ${data.slotId || "—"}`),
    safeText(
      "p",
      `الحالة: ${statusLabels[effectiveStatus]}`
    ),
    safeText(
      "p",
      `البداية: ${toLocalDateTime(data.startAt) || "—"}`
    ),
    safeText(
      "p",
      `النهاية: ${toLocalDateTime(data.endAt) || "—"}`
    ),
    safeText("p", `عدد الصور: ${imageUrls.length}`)
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
    isActive ? "⏸️ إيقاف الإعلان" : "▶️ تفعيل الإعلان"
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
    `صفحة ${currentPage} / ${totalPages} — ${filteredCount} حملة`
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
  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PAGE_SIZE)
  );

  currentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  if (!filtered.length) {
    showMessage(
      "ad-list-message",
      allCampaigns.length
        ? "لا توجد حملات مطابقة للبحث أو الفلاتر."
        : "لا توجد حملات مسجلة حتى الآن."
    );

    renderPagination(0, 1);
    return;
  }

  for (const item of pageItems) {
    list.append(makeCampaignCard(item.id, item.data));
  }

  const activeCount = allCampaigns.filter(
    ({ data }) => getEffectiveStatus(data) === "active"
  ).length;

  const pausedCount = allCampaigns.filter(
    ({ data }) => getEffectiveStatus(data) === "paused"
  ).length;

  showMessage(
    "ad-list-message",
    `إجمالي الحملات: ${allCampaigns.length} | نتائج البحث: ${filtered.length} | النشطة: ${activeCount} | المتوقفة: ${pausedCount} | صفحة ${currentPage} من ${totalPages}`
  );

  renderPagination(filtered.length, totalPages);
}

async function loadCampaigns() {
  const list = $("ad-campaign-list");
  if (!list) return;

  list.replaceChildren();

  showMessage(
    "ad-list-message",
    "جارٍ تحميل كل الحملات من Firestore..."
  );

  try {
    await verifyAdmin();

    // تحميل كل المستندات لتضمين الحملات القديمة التي لا تحتوي createdAt.
    const snapshot = await getDocs(
      collection(db, "adCampaigns")
    );

    allCampaigns = snapshot.docs.map((campaign) => ({
      id: campaign.id,
      data: {
        ...campaign.data(),
        id: campaign.id,
      },
    }));

    allCampaigns.sort((a, b) => {
      const aDate =
        getCampaignDate(a.data.createdAt) ||
        getCampaignDate(a.data.updatedAt);

      const bDate =
        getCampaignDate(b.data.createdAt) ||
        getCampaignDate(b.data.updatedAt);

      return bDate - aDate;
    });

    currentPage = 1;
    renderCampaigns();
  } catch (error) {
    console.error("[Ads Admin] Load error:", error);

    showMessage(
      "ad-list-message",
      error?.message || "تعذر تحميل الحملات."
    );
  }
}

function setupFilters() {
  for (const id of [
    "ad-search",
    "ad-filter-slot",
    "ad-filter-status",
  ]) {
    $(id)?.addEventListener(
      id === "ad-search" ? "input" : "change",
      () => {
        currentPage = 1;
        renderCampaigns();
      }
    );
  }
}

export async function initAds() {
  const form = $("ad-campaign-form");
  if (!form) return;

  if (!initialized) {
    initialized = true;

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
      error?.message || "تعذر التحقق من صلاحية الأدمن."
    );
  }
}

window.initAds = initAds;
initAds();
