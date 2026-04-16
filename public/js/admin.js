document.addEventListener("DOMContentLoaded", () => {
  const buttons = document.querySelectorAll('.top-tabs button');
  const tabs = document.querySelectorAll('.tab');

  const passwords = {
    addc:   "1111",
    review: "22222",
    rooms:  "333333"
  };

  const unlockedTabs = JSON.parse(localStorage.getItem("admin_tabs") || "{}"); // 🔥 يحفظ المفتوح

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;

      // 🔐 لو التاب ليها باسورد
      if (passwords[tabId] && !unlockedTabs[tabId]) {
        const pass = prompt("🔒 ادخل كلمة المرور");

        if (pass !== passwords[tabId]) {
          alert("❌ كلمة المرور غلط");
          return;
        }

        unlockedTabs[tabId] = true;
localStorage.setItem("admin_tabs", JSON.stringify(unlockedTabs)); // ✔ اتفتحت خلاص
      }

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
    });
  });

  window.initAddQ?.();
});