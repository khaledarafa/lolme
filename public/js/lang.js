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
    return basePath.startsWith("/en")
      ? basePath.replace(/^\/en/, "") || "/"
      : basePath;
  }
}

// --- apply language (changes dir/lang attributes, updates a few nav texts if present) ---

// helper لقراءة الكوكي
function getCookie(name) {
    const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
    return match ? match[2] : null;
  }
  
  function setCookie(name, value, days = 365) {
    const d = new Date();
    d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value}; path=/; expires=${d.toUTCString()}`;
  }
  
  function applyLangOnPage(lang) {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  
    const home = document.getElementById("nav-home");
    const articles = document.getElementById("nav-articles");
    if (home) home.textContent = translations[lang].home;
    if (articles) articles.textContent = translations[lang].articles;
  
    if (switcher) switcher.value = lang;
  }
  
  // init on load
  (function () {
    let saved = getCookie("lang") || localStorage.getItem("lang") || "ar";
  
    // sync الكوكي واللوكال
    setCookie("lang", saved);
    localStorage.setItem("lang", saved);
  
    applyLangOnPage(saved);
  })();
  
  if (switcher) {
    switcher.addEventListener("change", (e) => {
      const lang = e.target.value;
      localStorage.setItem("lang", lang);
      setCookie("lang", lang);
  
      // جيب الـ path الحالي بعد تنظيفه
      const basePath = normalizePathForRouting(window.location.pathname);
  
      // ابني الرابط الجديد حسب اللغة المختارة
      const target = buildTargetPath(basePath, lang);
  
      // روح للرابط الجديد
      window.location.href = target;
    });
  }
  