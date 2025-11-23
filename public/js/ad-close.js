// public/js/ad-close.js
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".ad-wrapper").forEach((box) => {
      const id = box.getAttribute("data-ad-id");
      const canClose = box.getAttribute("data-closeable");
  
      // لو الإعلان قابل للإغلاق واتقفل قبل كده → اخفيه
      if (canClose === "1" && sessionStorage.getItem("ad_closed_" + id) === "1") {
        box.style.display = "none";
      }
  
      // لو فيه زرار إغلاق → سجل الإغلاق
      const btn = box.querySelector(".ad-close-btn");
      if (btn) {
        btn.addEventListener("click", () => {
          sessionStorage.setItem("ad_closed_" + id, "1");
          box.style.display = "none";
        });
      }
    });
  });
  