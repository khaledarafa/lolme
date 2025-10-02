// public/js/open-meme.js
const btn = document.getElementById("open-meme");
if (btn) {
  btn.addEventListener("click", () => {
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);
    const lang = localStorage.getItem("lang") || "ar";

    if (isMobile) {
      window.location.href = lang === "en" ? "/en/mememob" : "/mememob";
    } else {
      window.location.href = lang === "en" ? "/en/meme" : "/meme";
    }
  });
}


// const btn = document.getElementById("open-meme");

// if (btn) {
//   btn.addEventListener("click", () => {
//     const isMobile = /Mobi|Android/i.test(navigator.userAgent);
//     if (isMobile) {
//       window.location.href = "/mememob";   // صفحة الموبايل
//     } else {
//       window.location.href = "/meme"; // صفحة الكمبيوتر
//     }
//   });
// }











// // public/js/open-meme.js
// document.getElementById("open-meme").addEventListener("click", () => {
//     const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
//     if (isMobile) {
//       window.location.href = "/mememob";   // صفحة الموبايل
//     } else {
//       window.location.href = "/meme"; // صفحة الكمبيوتر
//     }
//   });