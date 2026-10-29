
(() => {
  // تشغيل التأثير مرة واحدة فقط
  if (window.__lolmeMouseGlowInitialized) return;
  window.__lolmeMouseGlowInitialized = true;

  // الماوس الحقيقي فقط، وليس شاشات اللمس
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
    return;
  }

  const banners = document.querySelectorAll(".advertise-banner");

  banners.forEach((banner) => {
    banner.addEventListener("pointermove", (event) => {
      const rect = banner.getBoundingClientRect();

      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      banner.style.setProperty("--mouse-x", `${x}px`);
      banner.style.setProperty("--mouse-y", `${y}px`);
      banner.style.setProperty("--glow-opacity", "1");
    });

    banner.addEventListener("pointerleave", () => {
      banner.style.setProperty("--glow-opacity", "0");
    });
  });
})();
