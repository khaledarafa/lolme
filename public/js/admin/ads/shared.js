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

export const $ = (id) => document.getElementById(id);

export const PAGE_SIZE = 12;

export const findAdvertiserByEmail = httpsCallable(
  functions,
  "findAdvertiserByEmail",
);

export const SLOT_MONTHLY_PRICES = {
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
  "grid-1": 299,
  "grid-2": 249,
  "grid-3": 199,
  "grid-4": 179,
  "grid-5": 149,
  "grid-6": 129,
};

export function showMessage(id, message) {
  const element = $(id);
  if (element) element.textContent = message;
}

export function safeText(tag, text) {
  const element = document.createElement(tag);
  element.textContent = text ?? "";
  return element;
}

export function formatStatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

export function getImageUrls(data) {
  if (Array.isArray(data.imageUrls) && data.imageUrls.length) {
    return data.imageUrls;
  }

  return data.imageUrl ? [data.imageUrl] : [];
}

export function validateUrl(value, label) {
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

export function getCampaignDate(value) {
  if (!value) return 0;

  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);

  return Number.isNaN(date.getTime()) ? 0 : date.getTime();
}

export function toLocalDateTime(value) {
  if (!value) return "";

  const date =
    typeof value.toDate === "function" ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  const local = new Date(
    date.getTime() - date.getTimezoneOffset() * 60000,
  );

  return local.toISOString().slice(0, 16);
}

export function updateCampaignPrice() {
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

export async function waitForAuth() {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }

  return new Promise((resolve) => {
    let unsubscribe;

    unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe?.();
        resolve(user);
      },
      (error) => {
        unsubscribe?.();
        console.error("[Ads Admin] Auth error:", error);
        resolve(null);
      },
    );
  });
}

export async function verifyAdmin() {
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