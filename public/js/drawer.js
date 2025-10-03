
  // drawer open/close
  const drawer = document.getElementById("drawer");
  const openBtn = document.getElementById("open-drawer");
  openBtn.addEventListener("click", () => {
    drawer.style.display = drawer.style.display === "flex" ? "none" : "flex";
  });