import { db, collection, getDocs } from "/js/firebase.js";

const container = document.getElementById("seo-games-list");

const categoryNames = {
  "what-animal-is-this": "ما هو الحيوان",
  "supermarket-products": "منتجات السوبر ماركت",
  "english-league": "الدوري الإنجليزي",
  "serie-a": "الدوري الإيطالي",
  "champions-league": "دوري أبطال أوروبا",
  "world-cup": "كأس العالم",
  "find-difference": "اوجد الاختلافات",
  songs: "ألعاب أغاني",
  geography: "جغرافيا",
  movies: "ألعاب أفلام",
  series: "مسلسلات",
  brain: "معلومات عامة",
  mix: "منوعات",
};

async function loadGames() {
  const snap = await getDocs(collection(db, "publicRooms"));

  // 🔥 نحول لمصفوفة
  let games = [];
  snap.forEach(doc => {
    games.push(doc.data());
  });

  // 🎲 shuffle
  games = games.sort(() => 0.5 - Math.random());

  // ✂️ ناخد 10 بس
  games = games.slice(0, 10);

  let html = "";

  games.forEach(data => {
    const category =
      data.gamePlan?.[0]?.category ||
      data.categories?.[0] ||
      "general"; // 🔥 بدل quiz

    const niceName =
      categoryNames[category] || category.replaceAll("-", " ");

    const names = ["اختبار", "تحدي", "لعبة", "مسابقة", "تجربة"];
    const randomName = names[Math.floor(Math.random() * names.length)];

    const title = `${randomName} ${niceName} 🔥`;

    html += `
      <a href="/games/${data.slug}" class="home-card">
        <div class="content">
          <h3>${title}</h3>
          <p>🔥 ${data.questionsCount} سؤال</p>
        </div>
      </a>
    `;
  });

  container.innerHTML = html;
}

loadGames();