export function initDownloadMeme() {
  function downloadMeme(imgSrc, caption, number) {
    const img = new Image();
    img.src = imgSrc;
    img.crossOrigin = "anonymous";

    const logo = new Image();
    logo.src = "/images/site-emoji.png";
    logo.crossOrigin = "anonymous";

    Promise.all([
      new Promise((res) => img.onload = res),
      new Promise((res) => logo.onload = res)
    ]).then(() => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height + 80; // مساحة للكابشن
      const ctx = canvas.getContext("2d");

      // ارسم الصورة الأصلية
      ctx.drawImage(img, 0, 0);

      // ارسم watermark اللوجو في الركن العلوي يمين
      const logoWidth = 50;
      const logoHeight = 50;
      ctx.globalAlpha = 0.8; // شفاف شويه
      ctx.drawImage(logo, canvas.width - logoWidth - 10, 10, logoWidth, logoHeight);

      // ارسم نص الدومين بجانب اللوجو
      ctx.fillStyle = "blue";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "right";
      ctx.globalAlpha = 0.5;
      ctx.fillText("lolme.cc", canvas.width - logoWidth - 15, 40);

      // اعادة الشفافية للكابشن
      ctx.globalAlpha = 1;

      // خلفية للكابشن
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, img.height, canvas.width, 80);

      // النص العربي للكابشن
      ctx.fillStyle = "white";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";

      // خصائص النص العربي للكابشن
      ctx.direction = "rtl";          // اتجاه النص عربي
      ctx.textAlign = "right";        // محاذاة النص لليمين
      ctx.textBaseline = "middle";    // محاذاة عمودية

      const words = caption.split(" ");
      let line = "";
      let y = img.height + 30;
      for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > canvas.width - 100) { // مساحة للكابشن واللوجو
          ctx.fillText(line, canvas.width - 10, y);
          line = words[n] + " ";
          y += 25;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, canvas.width - 10, y);
      
      // تحميل الصورة
      const link = document.createElement("a");
      link.download = `meme-${number}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    });
  }

  document.querySelectorAll(".download-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".meme-card");
      const img = card.querySelector("img").src;
      const caption = card.querySelector("p").innerText;
      const number = card.querySelector(".meme-number").innerText;
      downloadMeme(img, caption, number);
    });
  });
}



// export function initDownloadMeme() {
//   function downloadMeme(imgSrc, caption, number) {
//     const img = new Image();
//     img.src = imgSrc;
//     img.crossOrigin = "anonymous";

//     const logo = new Image();
//     logo.src = "/images/site-emoji.png"; // اللوجو
//     logo.crossOrigin = "anonymous";

//     // ننتظر تحميل الصورة واللوجو قبل الرسم
//     Promise.all([
//       new Promise((res) => img.onload = res),
//       new Promise((res) => logo.onload = res)
//     ]).then(() => {
//       const canvas = document.createElement("canvas");
//       canvas.width = img.width;
//       canvas.height = img.height + 80;
//       const ctx = canvas.getContext("2d");

//       // ارسم الصورة
//       ctx.drawImage(img, 0, 0);

//       // ارسم اللوجو على الركن فوق يمين الصورة
//       const logoWidth = 60;
//       const logoHeight = 60;
//       ctx.drawImage(logo, canvas.width - logoWidth - 10, canvas.height - 80 - logoHeight - 10, logoWidth, logoHeight);

//       // خلفية للكابشن
//       ctx.fillStyle = "rgba(0,0,0,0.5)";
//       ctx.fillRect(0, img.height, canvas.width, 80);

//       // النص العربي
//       ctx.fillStyle = "white";
//       ctx.font = "bold 20px Arial";
//       ctx.textAlign = "right";
//       ctx.textBaseline = "middle";

//       const words = caption.split(" ");
//       let line = "";
//       let y = img.height + 30;
//       for (let n = 0; n < words.length; n++) {
//         const testLine = line + words[n] + " ";
//         const metrics = ctx.measureText(testLine);
//         if (metrics.width > canvas.width - 20) {
//           ctx.fillText(line, canvas.width - 10, y);
//           line = words[n] + " ";
//           y += 25;
//         } else {
//           line = testLine;
//         }
//       }
//       ctx.fillText(line, canvas.width - 10, y);

//       // تحميل الصورة
//       const link = document.createElement("a");
//       link.download = `meme-${number}.png`;
//       link.href = canvas.toDataURL("image/png");
//       link.click();
//     });
//   }

//   // ربط الزرار بالتحميل
//   document.querySelectorAll(".download-btn").forEach((btn) => {
//     btn.addEventListener("click", () => {
//       const card = btn.closest(".meme-card");
//       const img = card.querySelector("img").src;
//       const caption = card.querySelector("p").innerText;
//       const number = card.querySelector(".meme-number").innerText;
//       downloadMeme(img, caption, number);
//     });
//   });
// }


// export function initDownloadMeme() {
//   function downloadMeme(imgSrc, caption, number) {
//     const img = new Image();
//     img.src = imgSrc;
//     img.crossOrigin = "anonymous";
//     img.onload = () => {
//       const canvas = document.createElement("canvas");
//       canvas.width = img.width;
//       canvas.height = img.height + 60; // زيادة شوية مساحة للكابشن
//       const ctx = canvas.getContext("2d");
//       ctx.drawImage(img, 0, 0);

//       // خلفية للكابشن
//       ctx.fillStyle = "rgba(0,0,0,0.5)";
//       ctx.fillRect(0, img.height, img.width, 60);

//       // خصائص النص العربي
//       ctx.fillStyle = "white";
//       ctx.font = "bold 20px Arial";
//       ctx.textAlign = "right"; // الكلام على اليمين
//       ctx.textBaseline = "middle";

//       // تقسيم النص لسطرين لو طويل
//       const words = caption.split(" ");
//       let line = "";
//       let y = img.height + 30; // البداية عموديًا
//       for (let n = 0; n < words.length; n++) {
//         const testLine = line + words[n] + " ";
//         const metrics = ctx.measureText(testLine);
//         if (metrics.width > canvas.width - 20) { // 10px padding على الجانبين
//           ctx.fillText(line, canvas.width - 10, y);
//           line = words[n] + " ";
//           y += 25; // السطر التالي
//         } else {
//           line = testLine;
//         }
//       }
//       ctx.fillText(line, canvas.width - 10, y);

//       // تحميل الصورة
//       const link = document.createElement("a");
//       link.download = `meme-${number}.png`;
//       link.href = canvas.toDataURL("image/png");
//       link.click();
//     };
//   }

//   document.querySelectorAll(".download-btn").forEach((btn) => {
//     btn.addEventListener("click", () => {
//       const card = btn.closest(".meme-card");
//       const img = card.querySelector("img").src;
//       const caption = card.querySelector("p").innerText;
//       const number = card.querySelector(".meme-number").innerText;
//       downloadMeme(img, caption, number);
//     });
//   });
// }
