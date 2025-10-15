const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));

let img = null, layers = [], selectedIndex = null;

// canvas
const canvas = $("#mashupCanvas");
const ctx = canvas.getContext("2d");

// الميمز والروست
let memesData = null, roastsData = null;

fetch("/memes.json").then(r => r.json()).then(data => {
  memesData = data;
  populateMemeSelect();
});
fetch("/roasts.json").then(r => r.json()).then(data => {
  roastsData = data;
  populateRoastSelect();
});

function populateMemeSelect() {
  const sel = $("#meme-select");
  Object.keys(memesData).forEach(cat => {
    memesData[cat].forEach((m,i) => {
      const o = document.createElement("option");
      o.value = `${cat}:${i}`;
      o.textContent = `${cat} #${i+1}`;
      sel.appendChild(o);
    });
  });
}

function populateRoastSelect() {
  const sel = $("#roast-select");
  Object.keys(roastsData).forEach(tone => {
    roastsData[tone].forEach((r,i) => {
      const o = document.createElement("option");
      o.value = `${tone}:${i}`;
      o.textContent = `${tone} #${i+1}`;
      sel.appendChild(o);
    });
  });
}

// تحميل الصورة
$("#upload-image").addEventListener("change", e => {
  const f = e.target.files[0];
  if (!f) return;
  const reader = new FileReader();
  reader.onload = ev => loadImage(ev.target.result, true);
  reader.readAsDataURL(f);
});

function loadImage(src, resetLayers=false) {
  const i = new Image();
  i.crossOrigin = "anonymous";
  i.onload = () => {
    img = i;
    canvas.width = img.width;
    canvas.height = img.height;
    if (resetLayers) layers = [];
    draw();
  };
  i.src = src;
}

// رسم
function draw() {
  ctx.clearRect(0,0,canvas.width, canvas.height);
  if (img) ctx.drawImage(img, 0,0, canvas.width, canvas.height);

  layers.forEach((l,i) => {
    ctx.save();
    ctx.font = `${l.fontSize||40}px ${l.fontFamily||"Tajawal"}`;
    ctx.fillStyle = l.color||"#fff";
    ctx.strokeStyle = l.strokeColor||"#000";
    ctx.lineWidth = l.strokeWidth||3;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(l.text, l.x || canvas.width/2, l.y || canvas.height/2);
    ctx.strokeText(l.text, l.x || canvas.width/2, l.y || canvas.height/2);
    ctx.restore();
  });
}

// إضافة طبقة
$("#add-layer").addEventListener("click", () => {
  let text = "نص هنا";

  const memeSel = $("#meme-select").value;
  if (memeSel && memeSel !== "اختيار عشوائي") {
    const [cat,i] = memeSel.split(":");
    text = memesData[cat][i];
  }

  const roastSel = $("#roast-select").value;
  if (roastSel && roastSel !== "اختيار عشوائي") {
    const [tone,i] = roastSel.split(":");
    text += "\n" + roastsData[tone][i].replace(/\(\d+\)$/,"");
  }

  layers.push({text, x:canvas.width/2, y:canvas.height/2, fontSize:40, color:"#fff", strokeColor:"#000", strokeWidth:3});
  draw();
});
$("#download-btn").addEventListener("click", () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL();
  a.download = "lolme-mashup.png";
  a.click();
});
$("#share-btn").addEventListener("click", async () => {
  const dataUrl = canvas.toDataURL();
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const files = [new File([blob], "lolme-mashup.png", {type:blob.type})];
  if (navigator.canShare && navigator.canShare({files})) await navigator.share({files});
  else window.open(dataUrl);
});
