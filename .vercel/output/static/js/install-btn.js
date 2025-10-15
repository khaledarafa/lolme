// public/js/install-btn.js
let deferredPrompt;
const installBtn = document.getElementById("install-btn");

// حاول تستقبل الـ prompt
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  deferredPrompt = e;
});

installBtn.addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    if (choice.outcome === "accepted") {
      console.log("تم تثبيت التطبيق 😎");
    }
    deferredPrompt = null;
  } else {
    alert("متصفحك لا يدعم تثبيت التطبيقات. استخدم Chrome على الموبايل!");
  }
});
