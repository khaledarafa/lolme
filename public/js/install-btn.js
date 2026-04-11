// public/js/install-btn.js

let deferredPrompt;
const installBtn = document.getElementById("install-btn");

// 👇 اخفيه في الأول
installBtn.style.display = "none";

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;

  // 👇 هنا بس يظهر
  installBtn.style.display = "block";
});

installBtn.addEventListener("click", async () => {
  if (!deferredPrompt) return;

  deferredPrompt.prompt();

  const choice = await deferredPrompt.userChoice;

  if (choice.outcome === "accepted") {
    console.log("تم تثبيت التطبيق 😎");
  }

  deferredPrompt = null;
  installBtn.style.display = "none"; // 👈 اختفي بعد الاستخدام
});

window.addEventListener("appinstalled", () => {
  console.log("التطبيق اتثبت 🎉");
  installBtn.style.display = "none";
});