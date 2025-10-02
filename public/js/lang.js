// public/js/lang.js
// public/js/lang.js
// public/js/lang.js
const switcher = document.getElementById("lang-switch");

const translations = {
  ar: { home: "🏠 الرئيسية", articles: "📚 المقالات" },
  en: { home: "🏠 Home", articles: "📚 Articles" },
};

// --- تنظيف المسار الحالي ليكون "base" ثابت آمن ---
function normalizePathForRouting(rawPath) {
  let p = rawPath || "/";
  // remove query and hash
  p = p.split(/[?#]/)[0];

  // remove trailing slash except root
  if (p !== "/" && p.endsWith("/")) p = p.slice(0, -1);

  // remove common language prefixes: /en or /ar
  p = p.replace(/^\/(en|ar)(\/|$)/, "/");

  // remove index.* or index-en/index-ar etc. -> treat as root
  p = p.replace(/\/index(?:\.(?:html|htm))?(?:-en|-ar)?$/, "/");

  // remove suffix -en or -ar if someone appended it
  p = p.replace(/(-en|-ar)$/, "");

  // ensure starts with /
  if (!p.startsWith("/")) p = "/" + p;

  return p === "" ? "/" : p;
}

// --- بناء المسار الهدف اعتمادًا على قاعدة بسيطة: use prefix /en ---
function buildTargetPath(basePath, targetLang) {
  // basePath is normalized e.g. '/', '/meme', '/mememob', '/articles'
  if (targetLang === "en") {
    // english pages served under /en/... (you must have these pages or handle server routing)
    return basePath === "/" ? "/en" : "/en" + basePath;
  } else {
    // arabic: remove possible /en prefix
    return basePath.startsWith("/en") ? basePath.replace(/^\/en/, "") || "/" : basePath;
  }
}

// --- apply language (changes dir/lang attributes, updates a few nav texts if present) ---
function applyLangOnPage(lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  const home = document.getElementById("nav-home");
  const articles = document.getElementById("nav-articles");
  if (home) home.textContent = translations[lang].home;
  if (articles) articles.textContent = translations[lang].articles;

  // set select if present
  if (switcher) switcher.value = lang;
}

// init on load
(function () {
  // read saved lang or default 'ar'
  const saved = localStorage.getItem("lang") || "ar";
  applyLangOnPage(saved);

  // make sure select reflects saved value
  if (switcher) switcher.value = saved;
})();

if (switcher) {
  switcher.addEventListener("change", (e) => {
    const lang = e.target.value;
    localStorage.setItem("lang", lang);

    // compute safe base path and target
    const base = normalizePathForRouting(window.location.pathname);
    const target = buildTargetPath(base, lang);

    // if target equals current pathname nothing to do (still apply lang)
    if (target === window.location.pathname) {
      applyLangOnPage(lang);
      return;
    }

    // navigate
    window.location.href = target;
  });
}

// const switcher = document.getElementById("lang-switch");

// function applyLang(lang) {
//   document.documentElement.lang = lang;
//   document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
//   localStorage.setItem("lang", lang);

//   // خلى الـ select يعكس الاختيار فعلياً
//   if (switcher) {
//     switcher.value = lang;
//   }

//   // لو عندك نصوص بتتغير من ملف JSON
//   fetch(`/lang/${lang}.json`)
//     .then((r) => r.json())
//     .then((dict) => {
//       document.querySelectorAll("[data-i18n]").forEach((el) => {
//         const key = el.dataset.i18n;
//         if (dict[key]) el.textContent = dict[key];
//       });
//     });
// }

// // أول تحميل
// window.addEventListener("DOMContentLoaded", () => {
//   const saved = localStorage.getItem("lang") || "ar";
//   applyLang(saved);

//   if (switcher) {
//     switcher.value = saved; // هنا اللي هيخلي الـ select يعكس اللغة الحالية

//     switcher.addEventListener("change", (e) => {
//       applyLang(e.target.value);
//     });
//   }
// });
