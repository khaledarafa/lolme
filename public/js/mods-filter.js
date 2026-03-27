function showSection(type) {
  document.querySelectorAll('.mod-section').forEach((sec) => {
    sec.style.display = 'none';
  });

  const el = document.getElementById(type);
  if (el) el.style.display = 'block';
}

// نخليه global عشان الزرار يوصله
window.showSection = showSection;