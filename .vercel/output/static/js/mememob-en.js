// public/js/mememob.js موبايل
document.addEventListener("DOMContentLoaded", () => {

  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));

  let applyOverlay = false;
  let applyBlur = false;
  let memeTexts = null;

  // fetch النصوص
  fetch("/texts-en.json") // نسخة إنجليزي من النصوص
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

  const canvas = $("#memeCanvas");
  const ctx = canvas.getContext("2d");
  const presetSelect = $("#preset-select");
  const uploadInput = $("#upload-image");
  const uploadBtn = $("#upload-btn");

  const addTextBtn = $("#add-text");
  const layersContainer = $("#layers-container");
  const downloadBtn = $("#download-btn");
  const shareBtn = $("#share-btn");
  const randomMemeBtn = $("#random-meme");

  const drawer = $("#drawer");
  const openDrawerBtn = $("#open-drawer");
  const closeDrawerBtn = $("#close-drawer");

  let img = null,
    layers = [],
    selectedIndex = null,
    isDragging = false,
    dragOffset = { x: 0, y: 0 };

  const DEFAULTS = {
    fontFamily: "Impact",
    fontSize: 48,
    color: "#ffffff",
    strokeColor: "#000000",
    strokeWidth: 4,
    align: "center",
    rtl: false, // هنا خليها LTR
  };

  async function ensureFontsLoaded() {
    const fontsToLoad = [
      "Impact",
      "Anton",
      "Arial",
      "Roboto",
      "Comic Sans MS",
      "Courier New",
    ];
    await Promise.all(
      fontsToLoad.map((f) => document.fonts.load(`16px "${f}"`))
    );
  }

  // =========================
  // canvas + draw functions
  // =========================
  function loadImage(src) {
    const i = new Image();
    i.crossOrigin = "anonymous";
    i.onload = () => {
      img = i;
      fitCanvas();
      draw();
    };
    i.src = src;
  }

  function fitCanvas() {
    if (!img) return;
    const maxW = window.innerWidth - 20;
    const ratio = Math.min(1, maxW / img.width);
    canvas.width = Math.round(img.width * ratio);
    canvas.height = Math.round(img.height * ratio);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!img) return;
    if (applyBlur) ctx.filter = "blur(5px)";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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
    ctx.font = `${layer.fontSize}px ${layer.fontFamily}, sans-serif`;
    ctx.fillStyle = layer.color;
    ctx.strokeStyle = layer.strokeColor;
    ctx.lineWidth = layer.strokeWidth;
    ctx.textBaseline = "top";

    const lines = wrapText(layer.text, canvas.width - 20, ctx);
    const lineH = layer.fontSize * 1.05;
    const totalH = lines.length * lineH;
    let startY = layer.y - (layer.anchor === "center" ? totalH / 2 : 0);

    lines.forEach((line, i) => {
      if (layer.strokeWidth > 0)
        ctx.strokeText(line, layer.x, startY + i * lineH);
      ctx.fillText(line, layer.x, startY + i * lineH);
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
        const wSize = ctx.measureText(test).width;
        if (wSize > maxW && cur) {
          out.push(cur);
          cur = w;
        } else cur = test;
      });
      if (cur) out.push(cur);
    });
    return out;
  }

  // =========================
  // Layers
  // =========================
  function addLayer(
    text = "Write here",
    fontSize = DEFAULTS.fontSize,
    x = null,
    y = null
  ) {
    layers.push({
      text,
      x: x !== null ? x : canvas.width / 2,
      y: y !== null ? y : canvas.height / 2,
      ...DEFAULTS,
      fontSize,
      anchor: "center",
    });
    selectedIndex = layers.length - 1;
    rebuildLayersUI();
    draw();
  }

  function rebuildLayersUI() {
    if (!layersContainer) return;
    layersContainer.innerHTML = "";
    layers.forEach((layer, idx) => {
      const div = document.createElement("div");
      div.style =
        "border:1px solid #eee;padding:8px;margin-bottom:8px;background:white";
      div.innerHTML = `
      <div style="display:flex; gap:8px; align-items:center;">
        <button data-idx="${idx}" class="select-layer" style="flex:0 0 36px;">${
        idx + 1
      }</button>
        <textarea data-idx="${idx}" class="layer-text" style="flex:1; min-height:60px;">${
        layer.text
      }</textarea>
      </div>
      <div style="display:flex; gap:8px; margin-top:6px; align-items:center;">
        <label style="font-size:12px;">Size
          <input data-idx="${idx}" class="layer-size" type="range" min="12" max="200" value="${
        layer.fontSize
      }" />
        </label>
        <label style="font-size:12px;">Color
          <input data-idx="${idx}" class="layer-color" type="color" value="${
        layer.color
      }" />
        </label>
        <label style="font-size:12px;">Stroke
          <input data-idx="${idx}" class="layer-strokecolor" type="color" value="${
        layer.strokeColor
      }" />
        </label>
        <button data-idx="${idx}" class="del-layer" style="background:#ff6b6b;">Delete</button>
      </div>
    `;
      layersContainer.appendChild(div);
    });

    // event listeners
    $$(".select-layer").forEach((b) =>
      b.addEventListener("click", (e) => {
        selectedIndex = +e.currentTarget.dataset.idx;
        draw();
      })
    );
    $$(".layer-text").forEach((inp) =>
      inp.addEventListener("input", (e) => {
        layers[+e.currentTarget.dataset.idx].text = e.target.value;
        draw();
      })
    );
    $$(".layer-size").forEach((inp) =>
      inp.addEventListener("input", (e) => {
        layers[+e.currentTarget.dataset.idx].fontSize = +e.target.value;
        draw();
      })
    );
    $$(".layer-color").forEach((inp) =>
      inp.addEventListener("input", (e) => {
        layers[+e.currentTarget.dataset.idx].color = e.target.value;
        draw();
      })
    );
    $$(".layer-strokecolor").forEach((inp) =>
      inp.addEventListener("input", (e) => {
        layers[+e.currentTarget.dataset.idx].strokeColor = e.target.value;
        draw();
      })
    );
    $$(".del-layer").forEach((b) =>
      b.addEventListener("click", (e) => {
        layers.splice(+e.currentTarget.dataset.idx, 1);
        selectedIndex = null;
        rebuildLayersUI();
        draw();
      })
    );
  }

  // =========================
  // drawer open/close
  // =========================
  openDrawerBtn.addEventListener("click", () => {
    if (drawer.style.display === "flex") {
      drawer.style.display = "none"; // لو مفتوح، يقفل
    } else {
      drawer.style.display = "flex"; // لو مغلق، يفتح
      isDragging = false; // تمنع السحب أثناء فتح الأدوات
    }
  });

  // =========================
  // Canvas Pointer Events
  // =========================
  canvas.style.touchAction = "none";

  canvas.addEventListener("pointerdown", (e) => {
    //   if (drawer.style.display === "flex") return; // drawer مفتوح، تجاهل اللمس
    e.preventDefault();
    const active = document.activeElement;
    if (active && (active.tagName === "TEXTAREA" || active.tagName === "INPUT"))
      active.blur();
    const pos = toCanvasPos(e);
    let clickedLayer = null;
    for (let i = layers.length - 1; i >= 0; i--)
      if (isPointInLayer(pos, layers[i])) {
        clickedLayer = i;
        break;
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
    e.preventDefault();
    const pos = toCanvasPos(e);
    layers[selectedIndex].x = pos.x - dragOffset.x;
    layers[selectedIndex].y = pos.y - dragOffset.y;
    draw();
  });

  canvas.addEventListener("pointerup", stopDragging);
  canvas.addEventListener("pointercancel", stopDragging);

  function stopDragging(e) {
    isDragging = false;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
  }

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
    const metrics = ctx.measureText(layer.text);
    const textWidth = metrics.width;
    const textHeight = layer.fontSize;
    const x = layer.x - textWidth / 2;
    const y = layer.y - textHeight / 2;
    ctx.restore();
    return (
      pos.x >= x &&
      pos.x <= x + textWidth &&
      pos.y >= y &&
      pos.y <= y + textHeight
    );
  }

  // =========================
  // inputs & buttons
  // =========================
  presetSelect.addEventListener("change", (e) => loadImage(e.target.value));

  console.log("🎯 uploadInput:", uploadInput);

  function handleFile(e) {
    const f = e.target.files[0];
    console.log("📂 Selected file:", f);

    if (!f) {
      alert("❌ لم يتم اختيار صورة");
      return;
    }
    if (!f.type.startsWith("image/")) {
      alert("⚠️ الملف مش صورة");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      alert("⚠️ الصورة أكبر من 5 ميجا");
      return;
    }

    console.log("⏳ جاري قراءة الصورة...");
    const url = URL.createObjectURL(f);
    console.log("✅ الصورة اتحملت بـ ObjectURL:", url);
    loadImage(url);
  }

  if (uploadBtn && uploadInput) {
    uploadBtn.addEventListener("click", () => {
      console.log("👉 الزرار اتداس - بفتح input");
      uploadInput.click();
    });

    // 👇 هنا بس الحدث ده
    uploadInput.addEventListener("change", handleFile);
  }

  // uploadInput.addEventListener("change", (e) => {
  //   const f = e.target.files[0];
  //   if (!f) return;
  //   const reader = new FileReader();
  //   reader.onload = (ev) => loadImage(ev.target.result);
  //   reader.readAsDataURL(f);
  // });
  addTextBtn.addEventListener("click", () => addLayer("اكتب هنا"));
  downloadBtn.addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = canvas.toDataURL();
    a.download = "lolme-meme.png";
    a.click();
  });
  shareBtn.addEventListener("click", async () => {
    try {
      const dataUrl = canvas.toDataURL();
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const files = [new File([blob], "lolme.png", { type: blob.type })];
      if (navigator.canShare && navigator.canShare({ files }))
        await navigator.share({ files, title: "LOLME Meme" });
      else window.open(dataUrl);
    } catch (e) {
      console.error(e);
    }
  });
  randomMemeBtn.addEventListener("click", () => {
    const presets = [
      "/memes/drake.jpg",
      "/memes/doge.jpg",
      "/memes/crying.jpg",
    ];
    loadImage(presets[Math.floor(Math.random() * presets.length)]);
    layers = [];
    if (memeTexts) {
      let cat = $("#category").value;
      if (cat === "any") {
        const cats = Object.keys(memeTexts);
        cat = cats[Math.floor(Math.random() * cats.length)];
      }
      const arr = memeTexts[cat];
      addLayer(arr[Math.floor(Math.random() * arr.length)]);
      addLayer(arr[Math.floor(Math.random() * arr.length)]);
    } else {
      addLayer("جاري التحميل...");
      addLayer("استنى ثانية ✋");
    }
    draw();
  });

  window.addEventListener("resize", () => {
    fitCanvas();
    draw();
  });
  document.getElementById("darkOverlay").addEventListener("change", (e) => {
    applyOverlay = e.target.checked;
    draw();
  });
  document.getElementById("blurBackground").addEventListener("change", (e) => {
    applyBlur = e.target.checked;
    draw();
  });

  // fonts buttons
  $$(".font-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (selectedIndex !== null) {
        layers[selectedIndex].fontFamily = btn.dataset.font;
        draw();
      }
      $$(".font-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // init
  if (!presetSelect.value) presetSelect.value = "/memes/drake.jpg";
  ensureFontsLoaded().then(() => {
    loadImage(presetSelect.value);
    addLayer("Top text");
    addLayer("Bottom text");
  });

  window.addEventListener("focusin", (e) => {
    // لما تفتح أي input أو textarea
    document.body.style.position = "fixed";
  });

  window.addEventListener("focusout", (e) => {
    // لما نقفل الكيبورد
    document.body.style.position = "";
  });
});
