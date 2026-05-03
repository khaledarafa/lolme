// public/js/register-sw.js
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      if (location.hostname !== "localhost") {

        const version = Date.now(); // 🔥 ده اللي بيفرق

        await navigator.serviceWorker.register(
          `/service-worker.js?v=${version}`
        );

        console.log("✅ SW registered:", version);

      }
    } catch (err) {
      console.error("❌ SW register failed", err);
    }
  });
}
