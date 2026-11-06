// public/js/admin/ads/navigation.js
const navItems = document.querySelectorAll("[data-admin-view]");
const views = document.querySelectorAll("[data-admin-panel]");

function showAdminView(viewName) {
  const target = document.querySelector(
    `[data-admin-panel="${viewName}"]`
  );

  if (!target) return;

  views.forEach((view) => {
    view.hidden = view !== target;
  });

  navItems.forEach((item) => {
    const active = item.dataset.adminView === viewName;

    item.classList.toggle("active", active);
    item.setAttribute("aria-current", active ? "page" : "false");
  });
}

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    showAdminView(item.dataset.adminView);
  });
});

// القسم الافتراضي
showAdminView("overview");
