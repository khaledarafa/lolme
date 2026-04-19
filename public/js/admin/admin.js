// public/js/admin/admin.js
document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll('.top-tabs button');
  const tabs = document.querySelectorAll('.tab');

  const passwords = {
    // ditq: "000",
    // addq: "000",
    addc: "1111",
    review: "22222",
    rooms: "333333"
  };

  const unlockedTabs = JSON.parse(localStorage.getItem("admin_tabs") || "{}");
  const savedTab = localStorage.getItem("active_tab") || "addq";

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      // 🔐 باسورد
      if (passwords[tabId] && !unlockedTabs[tabId]) {
        const pass = prompt("🔒 ادخل كلمة المرور");

        if (pass !== passwords[tabId]) {
          alert("❌ كلمة المرور غلط");
          return;
        }

        unlockedTabs[tabId] = true;
        localStorage.setItem("admin_tabs", JSON.stringify(unlockedTabs));
      }

      // حفظ التاب
      localStorage.setItem("active_tab", tabId);

      // hide all
      tabs.forEach(t => t.classList.remove('active'));
      buttons.forEach(b => b.classList.remove('active'));

      // show
      document.getElementById(tabId).classList.add('active');
      btn.classList.add('active');

      // تشغيل
      if (tabId === "review") window.loadQuestions?.();
      if (tabId === "addq") window.initAddQ?.();
      if (tabId === "addc") window.initAddC?.();
      if (tabId === "edit") window.loadQuestionsBatch?.();
    });
  });

  // 🔥 يرجع لنفس التاب بعد الريفريش
  const defaultBtn = document.querySelector(`.top-tabs button[data-tab="${savedTab}"]`);
  if (defaultBtn) {
    defaultBtn.click();
  } else {
    document.querySelector('.top-tabs button')?.click();
  }
});