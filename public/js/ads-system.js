// public/js/ads-system.js   اعلانات الموبايل من تحت
const ads = [
  // {
  //   id: "myad1",
  //   image: "https://lolme.cc/default-og.png",
  //   link: "https://lolme.cc",
  //   title: "ضحكني",
  //   views: 0,
  // },
  {
    id: "ad2",
    image: "https://monce.cc/images/oglogo.webp",
    link: "https://monce.cc",
    title: "مونسيسي",
    views: 0,
  },
  {
    id: "moncellence-edm",
    image: "/ads/moncellence-edm.webp",
    link: "https://www.youtube.com/@Moncellence",
    title: "🔥 Moncellence Music",
    views: 0,
    // desc: "اكتشف الموسيقى الإلكترونية والأغاني المختلفة على القناة.",
    // cta: "🎧 استمع الآن",
    // every: 4,
  },
  {
    id: "grid5",
    title: "غيّر طريقة تفكيرك 🧠",
    desc: "مقالات عن الوعي والمال وقانون الجذب",
    img: "/ads/blog-index-og.png",
    link: "https://monce.cc/blog",
    cta: "ابدأ القراءة",
    every: 4,
  },
  {
    id: "wafra11",
    title: "🚪 باب الوفرة مفتوح... بس هل أنت مستعد؟",
    desc: "رحلة عملية لفهم المعتقدات التي تشكل واقعك المالي",
    img: "/ads/wafra-350.webp",
    link: "https://monce.cc/wafra",
    cta: "ابدأ الرحلة",
    every: 4,
  },

  //  =======================================.  🎤 إعلان قناة Moncellence
  {
    id: "moncellence-channel",
    title: "🎤 اكتشف عالم Moncellence",
    desc: "أغاني توكيدات، تطوير الذات، الوفرة والثراء والمزيد.",
    img: "/ads/moncellence-channel.webp",
    link: "https://www.youtube.com/@Moncellence",
    cta: "▶️ شاهد القناة",
    every: 4,
  },

  // // ✨ إعلان أغاني التوكيدات
  {
    id: "moncellence-affirmations",
    title: "✨ توكيداتك في شكل أغاني",
    desc: "اكتشف طريقة مختلفة للاستماع إلى أغاني التوكيدات وتطوير الذات.",
    img: "/ads/moncellence-affirmations.webp",
    link: "https://www.youtube.com/@Moncellence/videos",
    cta: "🎶 اكتشف الأغاني",
    every: 4,
  },

  // // 🔥 إعلان الموسيقى الإلكترونية
  {
    id: "moncellence-edm",
    title: "🔥 Moncellence Music",
    desc: "اكتشف الموسيقى الإلكترونية والأغاني المختلفة على القناة.",
    img: "/ads/moncellence-edm.webp",
    link: "https://www.youtube.com/@Moncellence/videos",
    cta: "🎧 استمع الآن",
    every: 4,
  },
];

// 🎯 توزيع عادل + راندوم
let lastAdId = null;

function getAd() {
  const sorted = ads.sort((a, b) => a.views - b.views);
  const minViews = sorted[0].views;
  const sameAds = sorted.filter((ad) => ad.views === minViews);

  let ad;
  do {
    ad = sameAds[Math.floor(Math.random() * sameAds.length)];
  } while (sameAds.length > 1 && ad.id === lastAdId);

  lastAdId = ad.id;
  return ad;
}

// 📱 هل موبايل؟
function isMobile() {
  return window.matchMedia("(max-width: 767px)").matches;
}

// 🧠 عرض إعلان الديسكتوب
function renderDesktopAd() {
  const container = document.getElementById("ad-container");
  if (!container || ads.length === 0) return;

  const ad = getAd();

  const img = new Image();
  img.src = ad.image;

  img.onload = () => {
    container.innerHTML = `
      <a href="${ad.link}" target="_blank">
        <img src="${ad.image}" alt="${ad.title}" />
      </a>
    `;
    trackView(ad.id);
  };

  img.onerror = () => {
    container.innerHTML = "🚀 مساحتك الإعلانية هنا";
  };
}

// 📱 عرض إعلان الموبايل
function renderMobileAd() {
  const container = document.getElementById("mobile-ad");
  if (!container || ads.length === 0) return;

  const ad = getAd();

  const img = new Image();
  img.src = ad.image;

  img.onload = () => {
    container.innerHTML = `
      <a href="${ad.link}" target="_blank">
        <img src="${ad.image}" alt="${ad.title}" />
      </a>
      <span id="close-ad">✖</span>
    `;

    trackView(ad.id);

    // زرار القفل
    document.getElementById("close-ad").onclick = () => {
      container.style.display = "none";
    };
  };

  img.onerror = () => {
    container.style.display = "none";
  };
}

// 📊 تتبع المشاهدات
function trackView(id) {
  const ad = ads.find((a) => a.id === id);
  if (ad) ad.views++;
  console.log("view:", id);
}

// 🚀 تشغيل السيستم
let currentMode = null;

function initAds() {
  const mobileMode = isMobile();

  // 👈 لو نفس الوضع، ما نعملش حاجة
  if (currentMode === mobileMode) return;

  currentMode = mobileMode;

  if (mobileMode) {
    renderMobileAd();
  } else {
    renderDesktopAd();
  }
}
window.addEventListener("resize", () => {
  initAds();
});
document.addEventListener("DOMContentLoaded", initAds);

setInterval(() => {
  if (isMobile()) {
    renderMobileAd();
  } else {
    renderDesktopAd();
  }
}, 20000); // كل 20 ثانية
