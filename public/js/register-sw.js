// public/js/register-sw.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      if (window.location.hostname !== "localhost") {
        const reg = await navigator.serviceWorker.register("/service-worker.js");
        console.log("SW registered:", reg);
      }
    } catch (err) {
      console.error("SW register failed", err);
    }
  });
}
