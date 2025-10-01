// public/js/register-sw.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      console.log("SW registered:", reg);
    } catch (err) {
      console.error("SW register failed", err);
    }
  });
}

if ("serviceWorker" in navigator) {
  // نعلق التسجيل أثناء التطوير
  if (window.location.hostname !== "localhost") {
    navigator.serviceWorker.register("/sw.js");
  }
}
