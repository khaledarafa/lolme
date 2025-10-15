// public/js/roast.js
const $ = (s) => document.querySelector(s);

let roastsCache = null;

// تحميل الروستات مرة واحدة وتخزينها
async function loadRoasts() {
  if (roastsCache) return roastsCache; // لو اتخزن قبل كده
  try {
    const res = await fetch('/roasts.json');
    if (!res.ok) throw new Error('فشل تحميل الملف');
    const data = await res.json();
    roastsCache = data; // cache
    return data;
  } catch (e) {
    console.error('فشل تحميل قائمة الروستات', e);
    alert('مفيش روستات متاحة دلوقتي 😢');
    return { gentle: [], roast: [], hard: [] };
  }
}

function pickOne(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function makeRoast(name, tone, roasts) {
    const list = roasts[tone] && roasts[tone].length ? roasts[tone] : roasts['roast'];
    let template = pickOne(list);
    if (!name || name.trim() === "") name = "صاحبك";
  
    template = template.replace(/\{name\}/gi, name.trim());
    
    // إزالة أي أرقام في نهاية الجملة بين أقواس (مثال: " (59)")
    template = template.replace(/\s*\(\d+\)\s*$/g, '');
  
    return template;
  }
  
function showWarningIfNeeded(tone) {
  const warn = $('#warn');
  if (tone === 'hard') {
    warn.textContent = "تحذير: المستوى 'جامد' ممكن يكون قاسي. استخدمه بحكمة.";
    warn.style.display = 'block';
  } else {
    warn.textContent = '';
    warn.style.display = 'none';
  }
}

async function init() {
  const roasts = await loadRoasts();

  const nameEl = $('#name');
  const toneEl = $('#tone');
  const roastBox = $('#roastBox');
  const genBtn = $('#generate');
  const copyBtn = $('#copy');
  const shareBtn = $('#share');

  const generateRoast = () => {
    const r = makeRoast(nameEl.value, toneEl.value, roasts);
    roastBox.textContent = r;
    showWarningIfNeeded(toneEl.value);
  };

  genBtn.addEventListener('click', generateRoast);

  copyBtn.addEventListener('click', async () => {
    const text = roastBox.textContent.trim();
    if (!text) return alert('مفيش روست انسخه!');
    try {
      await navigator.clipboard.writeText(text);
      copyBtn.textContent = 'اتنسخ ✅';
      setTimeout(() => (copyBtn.textContent = 'انسخ'), 1200);
    } catch {
      alert('ما قدرتش انسخ. استخدم النسخ اليدوي.');
    }
  });

  shareBtn.addEventListener('click', async () => {
    const text = roastBox.textContent.trim();
    if (!text) return alert('طلع روست الأول!');
    if (navigator.share) {
      try { await navigator.share({ text, title: 'روست من LOLME' }); } catch {}
    } else {
      const url = encodeURIComponent(location.href);
      const tweet = encodeURIComponent(text);
      window.open(`https://twitter.com/intent/tweet?text=${tweet}&url=${url}`, '_blank');
    }
  });

  nameEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') generateRoast(); });

  showWarningIfNeeded(toneEl.value);
  toneEl.addEventListener('change', () => showWarningIfNeeded(toneEl.value));
}

init();
