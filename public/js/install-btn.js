// public/js/install-btn.js

let deferredPrompt;
const installBtn = document.getElementById("install-btn");

// 👇 check موحد
function isAppInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
    || localStorage.getItem("pwa-installed") === "true";
}

// 👇 نخفيه في الأول
installBtn.style.display = "none";

// 👇 لو متثبت خلاص نخلع من الفيلم كله
if (isAppInstalled()) {
  installBtn.remove(); // 🔥 امسح الزرار أصلاً
}

// 👇 event التثبيت
window.addEventListener("beforeinstallprompt", (e) => {
  if (isAppInstalled()) return; // 👈 الحارس الأساسي

  e.preventDefault();
  deferredPrompt = e;

  installBtn.style.display = "block";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const choice = await deferredPrompt.userChoice;

  if (choice.outcome === "accepted") {
    console.log("تم تثبيت التطبيق 😎");
    localStorage.setItem("pwa-installed", "true"); // 👈 نحفظها هنا كمان
  }

  deferredPrompt = null;
  installBtn.style.display = "none";
});

// 👇 لما يتثبت فعليًا
window.addEventListener("appinstalled", () => {
  console.log("التطبيق اتثبت 🎉");
  localStorage.setItem("pwa-installed", "true");
  installBtn.remove(); // 🔥 اقفله خالص
});




// let deferredPrompt;
// const installBtn = document.getElementById("install-btn");

// // 👇 اخفيه في الأول
// installBtn.style.display = "none";

// window.addEventListener("beforeinstallprompt", (e) => {
//   e.preventDefault();
//   deferredPrompt = e;

//   // 👇 هنا بس يظهر
//   installBtn.style.display = "block";
// });

// installBtn.addEventListener("click", async () => {
//   if (!deferredPrompt) return;

//   deferredPrompt.prompt();

//   const choice = await deferredPrompt.userChoice;

//   if (choice.outcome === "accepted") {
//     console.log("تم تثبيت التطبيق 😎");
//   }

//   deferredPrompt = null;
//   installBtn.style.display = "none"; // 👈 اختفي بعد الاستخدام
// });

// window.addEventListener("appinstalled", () => {
//   console.log("التطبيق اتثبت 🎉");
//   installBtn.style.display = "none";
// });