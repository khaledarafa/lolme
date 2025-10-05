// public/js/meme.js
const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

let applyOverlay = false;
let applyBlur = false;
let currentCanvasChoice = "original"; // default

let memeTexts = null;
fetch("/texts.json")
  .then((r) => r.json())
  .then((data) => {
    memeTexts = data;
    const catSel = $("#category");
    Object.keys(memeTexts).forEach((cat) => {
      const o = document.createElement("option");
      o.value = cat;
      o.textContent = cat;
      catSel.appendChild(o);
    });
  });

let memesData = null;
fetch("/memes.json")
  .then((res) => res.json())
  .then((data) => {
    memesData = data;
    setupCategoryButtons();
  });

  function setupCategoryButtons() {
    const catContainer = $("#category-buttons");
    catContainer.innerHTML = "";
  
    Object.keys(memesData).forEach((cat) => {
      const btn = document.createElement("button");
      btn.textContent = cat;
      btn.className = "category-btn";
      btn.addEventListener("click", () => {
        showGallery(cat);
        localStorage.setItem("lastGallery", cat);
  
        // غير الـ active
        $$("#category-buttons .category-btn").forEach((b) =>
          b.classList.remove("active")
        );
        btn.classList.add("active");
      });
      catContainer.appendChild(btn);
    });
  
    // ✅ بعد ما نرسم الأزرار كلها نعمل استرجاع
    const savedGallery = localStorage.getItem("lastGallery");
    if (savedGallery && memesData[savedGallery]?.length) {
      showGallery(savedGallery);
  
      // دور على الزرار اللي ليه نفس الاسم
      const savedBtn = Array.from(
        document.querySelectorAll("#category-buttons .category-btn")
      ).find((b) => b.textContent === savedGallery);
  
      if (savedBtn) {
        savedBtn.classList.add("active");
      }
    } else {
      // الافتراضي
      const firstCat = Object.keys(memesData).find(
        (c) => memesData[c].length > 0
      );
      if (firstCat) {
        showGallery(firstCat);
        const firstBtn = $("#category-buttons .category-btn");
        if (firstBtn) firstBtn.classList.add("active");
      }
    }
  }
  
function showGallery(cat) {
  localStorage.setItem("lastGallery", cat);

  const gallery = $("#meme-gallery");
  gallery.innerHTML = "";

  memesData[cat].forEach((src) => {
    const imgEl = document.createElement("img");
    imgEl.src = src;
    imgEl.style.width = "120px";
    imgEl.style.height = "120px";
    imgEl.style.objectFit = "cover";
    imgEl.style.cursor = "pointer";

    imgEl.addEventListener("click", () => {
      loadImage(src, false);
    });

    gallery.appendChild(imgEl);
  });
}

// CANVAS SETUP
const canvas = $("#memeCanvas"),
  ctx = canvas.getContext("2d");
let img = null,
  layers = [],
  selectedIndex = null,
  isDragging = false,
  dragOffset = { x: 0, y: 0 };
const DEFAULTS = {
  fontFamily: "Tajawal",
  fontSize: 48,
  color: "#fff",
  strokeColor: "#000",
  strokeWidth: 4,
  align: "center",
  rtl: true,
};

function fitCanvas() {
  if (!img) return;
  const maxW = 900,
    ratio = Math.min(1, maxW / img.width);
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!img) return;

  if (applyBlur) ctx.filter = "blur(5px)";

  const { drawWidth, drawHeight, offsetX, offsetY } = getDrawImageParams(
    img,
    canvas
  );
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

  ctx.filter = "none";
  if (applyOverlay) {
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  layers.forEach((l, i) => drawLayer(l, i === selectedIndex));
}

function drawLayer(layer, isSel) {
  ctx.save();
  ctx.direction = layer.rtl ? "rtl" : "ltr";
  ctx.textAlign = layer.align;

  // اضفنا layer.bold
  const fontWeight = layer.bold ? "bold" : "normal";
  ctx.font = `${fontWeight} ${layer.fontSize}px ${layer.fontFamily}, sans-serif`;

  ctx.fillStyle = layer.color;
  ctx.strokeStyle = layer.strokeColor;
  ctx.lineWidth = layer.strokeWidth;
  ctx.textBaseline = "middle";

  const lines = wrapText(layer.text, canvas.width - 20, ctx);
  const lineH = layer.fontSize * 1.4;
  const totalH = lines.length * lineH;
  let startY = layer.y - (layer.anchor === "center" ? totalH / 2 : 0);

  lines.forEach((line, i) => {
    const y = startY + i * lineH + lineH / 1.7; // بدل ما يبدأ من فوق
    if (layer.strokeWidth > 0) ctx.strokeText(line, layer.x, y);
    ctx.fillText(line, layer.x, y);
  });
  
  if (isSel) {
    let maxW = 0;
    lines.forEach((l) => {
      maxW = Math.max(maxW, ctx.measureText(l).width);
    });
    let bx =
      layer.align === "center"
        ? layer.x - maxW / 2
        : layer.align === "left"
        ? layer.x
        : layer.x - maxW;
    ctx.strokeStyle = "#00aaff";
    ctx.lineWidth = 2;
    ctx.strokeRect(bx - 6, startY - 6, maxW + 12, totalH + 12);
  }

  ctx.restore();
}

function wrapText(text, maxW, ctx) {
  const raw = text.split("\n"),
    out = [];
  raw.forEach((line) => {
    const words = line.split(/\s+/);
    let cur = "";
    words.forEach((w) => {
      const test = cur ? cur + " " + w : w;
      if (ctx.measureText(test).width > maxW && cur) {
        out.push(cur);
        cur = w;
      } else cur = test;
    });
    if (cur) out.push(cur);
  });
  return out;
}

function addLayer(text = "نص هنا") {
  layers.push({
    text,
    x: canvas.width / 2,
    y: canvas.height / 2,
    ...DEFAULTS,
    anchor: "center",
    bold: false
  });
  selectedIndex = layers.length - 1;
  rebuildLayersUI();
  draw();
  saveState();
}

const layersContainer = $("#layers-container");
function rebuildLayersUI() {
  layersContainer.innerHTML = "";
  layers.forEach((layer, idx) => {
    const div = document.createElement("div");
    div.style = "padding:8px;margin-bottom:8px;background:var(--bg);box-shadow: 0 1px 2px var(--shadow-color);";
    div.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;">
        <button data-idx="${idx}" class="select-layer" style="flex:0 0 36px;">${ idx + 1 }</button>
        <textarea data-idx="${idx}" class="layer-text" style="flex:1; min-height:40px;">${ layer.text }</textarea>
      </div>
      <div class="my-container" style="display:flex;gap:8px;margin-top:6px;align-items:center; justify-content: space-between;">
        <label style="font-size:12px;">
          
          <input data-idx="${idx}" class="layer-size" type="range" min="12" max="400" value="${ layer.fontSize }" />
          <input data-idx="${idx}" class="layer-size-number" type="number" min="12" max="400" value="${ layer.fontSize }" style="display:none; width:50px;" />
        </label>
        <label style="font-size:12px;"> <input type="checkbox" class="size-mode" data-idx="${idx}" />  </label>
        <button data-idx="${idx}" class="toggle-bold" style="background:#3498db; color:#fff; padding:4px 6px; border-radius:4px;">B</button>
        <label style="font-size:12px;"> <input data-idx="${idx}" class="layer-color" type="color" value="${ '#14ff03' }" /> </label>
        <label style="font-size:12px;"> <input data-idx="${idx}" class="layer-strokecolor" type="color" value="${ layer.strokeColor }" /> </label>
        <button data-idx="${idx}" class="del-layer">🗑️</button>
      </div>
    `;
    layersContainer.appendChild(div);

    // EVENT LISTENERS
    const textarea = div.querySelector(".layer-text");
    const slider = div.querySelector(".layer-size");
    const numberInput = div.querySelector(".layer-size-number");
    const checkbox = div.querySelector(".size-mode");
    const colorInput = div.querySelector(".layer-color");
    const strokeInput = div.querySelector(".layer-strokecolor");
    const delBtn = div.querySelector(".del-layer");
    const selectBtn = div.querySelector(".select-layer");

    // اختيار الطبقة
    selectBtn.addEventListener("click", () => {
      selectedIndex = idx;
      draw();
    });

    // تعديل النص
    textarea.addEventListener("input", (e) => {
      layer.text = e.target.value;
      draw();
      saveState();
    });

    // السلايدر
    slider.addEventListener("input", (e) => {
      layer.fontSize = +e.target.value;
      numberInput.value = layer.fontSize;
      draw();
      saveState();
    });

    // رقم مباشر
    numberInput.addEventListener("input", (e) => {
      layer.fontSize = +e.target.value;
      slider.value = layer.fontSize;
      draw();
      saveState();
    });

    // التبديل بين سلايدر ورقم
    checkbox.addEventListener("change", (e) => {
      layer.useNumberInput = e.target.checked;
      if (e.target.checked) {
        slider.style.display = "none";
        numberInput.style.display = "inline-block";
      } else {
        slider.style.display = "inline-block";
        numberInput.style.display = "none";
      }
      draw();
      saveState();
    });

    // لون
    colorInput.addEventListener("input", (e) => {
      layer.color = e.target.value;
      draw();
      saveState();
    });

    // stroke
    strokeInput.addEventListener("input", (e) => {
      layer.strokeColor = e.target.value;
      draw();
      saveState();
    });

    // حذف الطبقة
    delBtn.addEventListener("click", () => {
      layers.splice(idx, 1);
      selectedIndex = null;
      rebuildLayersUI();
      draw();
      saveState();
    });

    const boldBtn = div.querySelector(".toggle-bold");
    boldBtn.addEventListener("click", () => {
      layer.bold = !layer.bold;
      boldBtn.style.background = layer.bold ? "#1abc9c" : "#3498db";
      draw();
      saveState();
    });
  });
}

// CANVAS DRAG
canvas.style.touchAction = "none";
canvas.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  const pos = toCanvasPos(e);
  let clickedLayer = null;
  for (let i = layers.length - 1; i >= 0; i--) {
    if (isPointInLayer(pos, layers[i])) {
      clickedLayer = i;
      break;
    }
  }
  if (clickedLayer !== null) {
    selectedIndex = clickedLayer;
    isDragging = true;
    dragOffset = {
      x: pos.x - layers[clickedLayer].x,
      y: pos.y - layers[clickedLayer].y,
    };
  } else {
    selectedIndex = null;
    isDragging = false;
  }
  draw();
  canvas.setPointerCapture(e.pointerId);
});

canvas.addEventListener("pointermove", (e) => {
  if (!isDragging || selectedIndex === null) return;
  const pos = toCanvasPos(e);
  layers[selectedIndex].x = pos.x - dragOffset.x;
  layers[selectedIndex].y = pos.y - dragOffset.y;
  draw();
  saveState();
});
canvas.addEventListener("pointerup", () => (isDragging = false));
canvas.addEventListener("pointercancel", () => (isDragging = false));

function toCanvasPos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
}

function isPointInLayer(pos, layer) {
  ctx.save();
  ctx.font = `${layer.fontSize}px ${layer.fontFamily || "Tajawal"}`;
  const w = ctx.measureText(layer.text).width;
  const h = layer.fontSize;
  const x = layer.x - w / 2,
    y = layer.y - h / 2;
  ctx.restore();
  return pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h;
}

// IMAGE HANDLING
const uploadInput = $("#upload-image");
function loadImage(src, resetLayers = false, callback = null) {
  const i = new Image();
  i.crossOrigin = "anonymous";
  i.onload = () => {
    img = i;
    resizeCanvasByChoice(currentCanvasChoice);
    draw();
    if (resetLayers) {
      layers = [];
      addLayer("اكتب نص هنا");
    }
    if (callback) {
      callback();
    }
    saveState();
  };
  i.src = src;
}

// SAVE & LOAD STATE
function saveState() {
  if (!img) return;
  localStorage.setItem(
    "memeState",
    JSON.stringify({
      imgSrc: img.src,
      layers,
      applyOverlay,
      applyBlur,
    })
  );
}

function loadState() {
  const stateStr = localStorage.getItem("memeState");
  if (!stateStr) return false;
  try {
    const state = JSON.parse(stateStr);

    if (state.imgSrc) {
      loadImage(state.imgSrc, false, () => {
        // ✅ بعد الصورة
        if (state.layers) {
          layers = state.layers;
          rebuildLayersUI();

          // حالة السلايدر/الرقم
          layers.forEach((layer, idx) => {
            const slider = layersContainer.querySelector(
              `.layer-size[data-idx="${idx}"]`
            );
            const numberInput = layersContainer.querySelector(
              `.layer-size-number[data-idx="${idx}"]`
            );
            const checkbox = layersContainer.querySelector(
              `.size-mode[data-idx="${idx}"]`
            );

            if (layer.useNumberInput) {
              slider.style.display = "none";
              numberInput.style.display = "inline-block";
              checkbox.checked = true;
            } else {
              slider.style.display = "inline-block";
              numberInput.style.display = "none";
              checkbox.checked = false;
            }
          });

          draw();
        }
      });
    }

    if (state.applyOverlay !== undefined) {
      applyOverlay = state.applyOverlay;
      $("#darkOverlay").checked = applyOverlay;
    }
    if (state.applyBlur !== undefined) {
      applyBlur = state.applyBlur;
      $("#blurBackground").checked = applyBlur;
    }
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}
window.addEventListener("load", () => {
  const loaded = loadState();
  if (!loaded) {
    loadImage("/memes/lolme.webp", true);
  }
});

// EVENTS
$("#darkOverlay").addEventListener("change", (e) => {
  applyOverlay = e.target.checked;
  draw();
  saveState();
});
$("#blurBackground").addEventListener("change", (e) => {
  applyBlur = e.target.checked;
  draw();
  saveState();
});
$("#add-text").addEventListener("click", () => addLayer());
$("#download-btn").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL();
  a.download = "lolme-meme.png";
  a.click();
});
$("#share-btn").addEventListener("click", async () => {
  const dataUrl = canvas.toDataURL();
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const files = [new File([blob], "lolme.png", { type: blob.type })];
  if (navigator.canShare && navigator.canShare({ files }))
    await navigator.share({ files, title: "LOLME Meme" });
  else window.open(dataUrl);
});

// RANDOM MEME (تغيير الصورة فقط من نفس الفئة)
$("#random-meme").addEventListener("click", () => {
  if (!memesData) return;

  // ناخد الفئة من الزرار اللي عنده active
  const activeBtn = document.querySelector("#category-buttons .category-btn.active");
  let chosenCat = activeBtn ? activeBtn.textContent : null;

  // لو الفئة مش موجودة أو فاضية، ناخد أول فئة فيها صور
  if (!chosenCat || !memesData[chosenCat] || memesData[chosenCat].length === 0) {
    chosenCat = Object.keys(memesData).find(cat => memesData[cat].length > 0);
    if (!chosenCat) return; // لو مفيش صور خالص
  }

  const images = memesData[chosenCat];
  const imgSrc = images[Math.floor(Math.random() * images.length)];

  // تغيير الصورة فقط، بدون مسح الطبقات
  loadImage(imgSrc, false);
});

// $("#random-meme").addEventListener("click", () => {
//   if (!memesData) return;
//   const cats = Object.keys(memesData).filter((c) => memesData[c].length > 0);
//   const chosenCat = cats[Math.floor(Math.random() * cats.length)];
//   const images = memesData[chosenCat];
//   const imgSrc = images[Math.floor(Math.random() * images.length)];
//   loadImage(imgSrc, false); // false عشان مانمسحش النصوص

//   if (memeTexts) {
//     const texts = memeTexts[chosenCat] || memeTexts[cats[0]];
//     addLayer(texts[Math.floor(Math.random() * texts.length)]);
//     addLayer(texts[Math.floor(Math.random() * texts.length)]);
//   }
// });
$("#random-text").addEventListener("click", () => {
  if (!memeTexts) return;
  if (!layers.length) return;

  // الفئة المختارة من select
  const cat = $("#category").value || Object.keys(memeTexts)[0];
  const texts = memeTexts[cat] || memeTexts[Object.keys(memeTexts)[0]];

  layers.forEach((layer, idx) => {
    const randomText = texts[Math.floor(Math.random() * texts.length)];
    layer.text = randomText;

    // لو فيه textarea موجودة
    const textarea = layersContainer.querySelector(
      `textarea[data-idx="${idx}"]`
    );
    if (textarea) textarea.value = randomText;
  });

  draw();
});

// UPLOAD IMAGE
uploadInput.addEventListener("change", (e) => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = (ev) => loadImage(ev.target.result, false);
  reader.readAsDataURL(f);
});

// FONT BUTTONS
$$(".font-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (selectedIndex !== null) {
      layers[selectedIndex].fontFamily = btn.dataset.font;
      draw();
      saveState();
    }
    $$(".font-btn").forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });
});
// بتخلي الكانفس يتغير حجمه لا الكيبورد يظهر
// window.addEventListener("resize", () => {
//   fitCanvas();
//   draw();
// });

function resizeCanvasByChoice(choice) {
  if (!img) return;

  const oldW = canvas.width;
  const oldH = canvas.height;

  let w = img.width;
  let h = img.height;

  switch (choice) {
    case "1:1":
      const size = Math.max(img.width, img.height);
      w = h = size;
      break;
    case "16:9":
      w = img.width;
      h = Math.round((w * 9) / 16);
      break;
    case "9:16":
      h = img.height;
      w = Math.round((h * 9) / 16);
      break;
    case "1080x1080":
      w = 1080;
      h = 1080;
      break;
    case "1920x1080":
      w = 1920;
      h = 1080;
      break;
    case "1080x1920":
      w = 1080;
      h = 1920;
      break;
    case "original":
    default:
      w = img.width;
      h = img.height;
  }

  const scaleX = w / oldW;
  const scaleY = h / oldH;

  canvas.width = w;
  canvas.height = h;

  layers.forEach((l) => {
    l.x *= scaleX;
    l.y *= scaleY;
    // l.fontSize *= Math.min(scaleX, scaleY);
  });

  draw();
}

function getDrawImageParams(img, canvas) {
  const canvasRatio = canvas.width / canvas.height;
  const imgRatio = img.width / img.height;

  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgRatio > canvasRatio) {
    // الصورة أعرض من الكانفاس -> نعمل crop من الجانبين
    drawHeight = canvas.height;
    drawWidth = img.width * (canvas.height / img.height);
    offsetX = (canvas.width - drawWidth) / 2;
    offsetY = 0;
  } else {
    // الصورة أطول من الكانفاس -> نعمل crop من فوق وتحت
    drawWidth = canvas.width;
    drawHeight = img.height * (canvas.width / img.width);
    offsetX = 0;
    offsetY = (canvas.height - drawHeight) / 2;
  }

  return { drawWidth, drawHeight, offsetX, offsetY };
}

// لزراير الكانفس بدل السلكت
const canvasSizeButtons = $$("#canvas-size-buttons button");

// استرجاع آخر اختيار من localStorage لو موجود
let savedChoice = localStorage.getItem("canvasSizeChoice");
if (savedChoice) {
  currentCanvasChoice = savedChoice;
  resizeCanvasByChoice(savedChoice);
}

// إعداد الأزرار
canvasSizeButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const size = btn.dataset.size;
    currentCanvasChoice = size;
    resizeCanvasByChoice(size);

    // حفظ الاختيار في localStorage
    localStorage.setItem("canvasSizeChoice", size);

    // تحديث الزر النشط
    canvasSizeButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
  });

  // عند تحميل الصفحة: خلي الزر المختار من الحفظ ياخد active
  if (btn.dataset.size === currentCanvasChoice) {
    btn.classList.add("active");
  }
});

// تقدر تحدد الزر الأصلي كـ active عند البداية
canvasSizeButtons.forEach((b) => {
  if (b.dataset.size === currentCanvasChoice) b.classList.add("active");
});






























// CANVAS DRAG بيخلى الكانفس يتحرك مع السحب
// canvas.style.touchAction = "pan-y"; // خلي السحب العمودي للصفحة طبيعي

// canvas.addEventListener("pointerdown", (e) => {
//   const pos = toCanvasPos(e);
//   selectedIndex = null;
//   for (let i = layers.length - 1; i >= 0; i--) {
//     if (isPointInLayer(pos, layers[i])) {
//       selectedIndex = i;
//       break;
//     }
//   }
//   if (selectedIndex !== null) {
//     isDragging = true;
//     dragOffset = {
//       x: pos.x - layers[selectedIndex].x,
//       y: pos.y - layers[selectedIndex].y,
//     };
//     canvas.setPointerCapture(e.pointerId);
//   }
// });

// canvas.addEventListener("pointermove", (e) => {
//   if (!isDragging || selectedIndex === null) return;
//   const pos = toCanvasPos(e);
//   const layer = layers[selectedIndex];
//   layer.x = pos.x - dragOffset.x;
//   layer.y = pos.y - dragOffset.y;
//   draw(); // فقط إعادة رسم الطبقة
// });

// canvas.addEventListener("pointerup", () => (isDragging = false));
// canvas.addEventListener("pointercancel", () => (isDragging = false));