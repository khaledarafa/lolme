// public/js/images-to-pdf.js
import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

const input = document.getElementById("imageInput");
const previewContainer = document.getElementById("previewContainer");
const convertBtn = document.getElementById("convertBtn");
const imgSizeSelect = document.getElementById("imgSize");
const orientationSelect = document.getElementById("orientation");

let images = JSON.parse(localStorage.getItem("pdfImages") || "[]");

// 🔁 تحميل الصور من localStorage عند بداية الصفحة
if (images.length > 0) renderPreviews();

input.addEventListener("change", (e) => {
  const files = Array.from(e.target.files);
  files.forEach((file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      images.push(event.target.result);
      saveImages();
      renderPreviews();
    };
    reader.readAsDataURL(file);
  });
});

function saveImages() {
  localStorage.setItem("pdfImages", JSON.stringify(images));
}

function renderPreviews() {
  previewContainer.innerHTML = "";
  images.forEach((src, index) => {
    const item = document.createElement("div");
    item.className = "preview-item";
    item.innerHTML = `
      <img src="${src}" alt="preview" />
      <button class="delete-btn" data-index="${index}">×</button>
    `;
    previewContainer.appendChild(item);
  });

  new Sortable(previewContainer, {
    animation: 150,
    onEnd: (evt) => {
      const movedItem = images.splice(evt.oldIndex, 1)[0];
      images.splice(evt.newIndex, 0, movedItem);
      saveImages();
      renderPreviews();
    },
  });

  document.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = e.target.dataset.index;
      images.splice(index, 1);
      saveImages();
      renderPreviews();
    });
  });
}

convertBtn.addEventListener("click", async () => {
  if (images.length === 0) return alert("من فضلك اختر صور أولًا!");

  const orientation = orientationSelect.value;
  const pdf = new jsPDF({ orientation });
  const sizeSetting = imgSizeSelect.value;
  const scaleMap = { small: 0.5, medium: 0.8, large: 1 };

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const imgProps = pdf.getImageProperties(img);
    const pdfWidth = pdf.internal.pageSize.getWidth() * scaleMap[sizeSetting];
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    const x = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;
    const y = (pdf.internal.pageSize.getHeight() - pdfHeight) / 2;
    if (i > 0) pdf.addPage();
    pdf.addImage(img, "JPEG", x, y, pdfWidth, pdfHeight);
  }

  pdf.save("LOLME-images.pdf");
});

// import { jsPDF } from "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/+esm";

// const input = document.getElementById("imageInput");
// const previewContainer = document.getElementById("previewContainer");
// const convertBtn = document.getElementById("convertBtn");
// const imgSizeSelect = document.getElementById("imgSize");
// const orientationSelect = document.getElementById("orientation");

// let images = [];

// input.addEventListener("change", (e) => {
//   const files = Array.from(e.target.files);
//   files.forEach((file) => {
//     const reader = new FileReader();
//     reader.onload = (event) => {
//       images.push(event.target.result);
//       renderPreviews();
//     };
//     reader.readAsDataURL(file);
//   });
// });

// function renderPreviews() {
//   previewContainer.innerHTML = "";
//   images.forEach((src, index) => {
//     const item = document.createElement("div");
//     item.className = "preview-item";
//     item.innerHTML = `
//       <img src="${src}" alt="preview" />
//       <button class="delete-btn" data-index="${index}">×</button>
//     `;
//     previewContainer.appendChild(item);
//   });

//   new Sortable(previewContainer, {
//     animation: 150,
//     onEnd: (evt) => {
//       const movedItem = images.splice(evt.oldIndex, 1)[0];
//       images.splice(evt.newIndex, 0, movedItem);
//       renderPreviews();
//     },
//   });

//   document.querySelectorAll(".delete-btn").forEach((btn) => {
//     btn.addEventListener("click", (e) => {
//       const index = e.target.dataset.index;
//       images.splice(index, 1);
//       renderPreviews();
//     });
//   });
// }

// convertBtn.addEventListener("click", async () => {
//   if (images.length === 0) return alert("من فضلك اختر صور أولًا!");

//   const orientation = orientationSelect.value;
//   const pdf = new jsPDF({ orientation });

//   const sizeSetting = imgSizeSelect.value;
//   const scaleMap = { small: 0.5, medium: 0.8, large: 1 };

//   for (let i = 0; i < images.length; i++) {
//     const img = images[i];
//     const imgProps = pdf.getImageProperties(img);
//     const pdfWidth = pdf.internal.pageSize.getWidth() * scaleMap[sizeSetting];
//     const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

//     const x = (pdf.internal.pageSize.getWidth() - pdfWidth) / 2;
//     const y = (pdf.internal.pageSize.getHeight() - pdfHeight) / 2;

//     if (i > 0) pdf.addPage();
//     pdf.addImage(img, "JPEG", x, y, pdfWidth, pdfHeight);
//   }

//   pdf.save("images.pdf");
// });









//     // نحمل jsPDF من CDN
//     const script = document.createElement("script");
//     script.src = "https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js";
//     script.onload = initPDFTool;
//     document.body.appendChild(script);

//     function initPDFTool() {
//       const { jsPDF } = window.jspdf;

//       const imageInput = document.getElementById("imageInput");
//       const convertBtn = document.getElementById("convertBtn");
//       const preview = document.getElementById("preview");
//       let selectedImages = [];

//       imageInput.addEventListener("change", (e) => {
//         preview.innerHTML = "";
//         selectedImages = Array.from(e.target.files);

//         selectedImages.forEach((file) => {
//           const imgDiv = document.createElement("div");
//           imgDiv.style.textAlign = "center";

//           const img = document.createElement("img");
//           img.src = URL.createObjectURL(file);
//           img.style.width = "100px";
//           img.style.borderRadius = "10px";
//           img.style.border = "2px solid #0fe85b";

//           const downloadBtn = document.createElement("button");
//           downloadBtn.textContent = "⬇️ تحميل";
//           downloadBtn.style.display = "block";
//           downloadBtn.style.marginTop = "5px";
//           downloadBtn.onclick = () => {
//             const a = document.createElement("a");
//             a.href = img.src;
//             a.download = file.name;
//             a.click();
//           };

//           imgDiv.appendChild(img);
//           imgDiv.appendChild(downloadBtn);
//           preview.appendChild(imgDiv);
//         });
//       });

//       convertBtn.addEventListener("click", async () => {
//   if (!selectedImages.length) {
//     alert("اختار صور الأول يا نجم 😅");
//     return;
//   }

//   const pdf = new jsPDF();

//   for (let i = 0; i < selectedImages.length; i++) {
//     const img = selectedImages[i];
//     const imgData = await toBase64(img);

//     // نجيب أبعاد الصورة الأصلية
//     const dimensions = await getImageDimensions(imgData);
//     const pageWidth = pdf.internal.pageSize.getWidth();
//     const pageHeight = pdf.internal.pageSize.getHeight();

//     // نحافظ على النسبة الأصلية
//     const ratio = Math.min(pageWidth / dimensions.width, pageHeight / dimensions.height);
//     const imgWidth = dimensions.width * ratio;
//     const imgHeight = dimensions.height * ratio;

//     // نوسّط الصورة في الصفحة
//     const x = (pageWidth - imgWidth) / 2;
//     const y = (pageHeight - imgHeight) / 2;

//     if (i > 0) pdf.addPage();
//     pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);
//   }

//   pdf.save("LOLME-images.pdf");
// });

// function getImageDimensions(dataUrl) {
//   return new Promise((resolve) => {
//     const img = new Image();
//     img.onload = () => resolve({ width: img.width, height: img.height });
//     img.src = dataUrl;
//   });
// }

//       function toBase64(file) {
//         return new Promise((resolve, reject) => {
//           const reader = new FileReader();
//           reader.onload = () => resolve(reader.result);
//           reader.onerror = (error) => reject(error);
//           reader.readAsDataURL(file);
//         });
//       }
//     }