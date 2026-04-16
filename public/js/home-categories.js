import { db, collection, getDocs } from "/js/firebase.js";

const container = document.getElementById("home-categories");

async function loadHomeCategories() {
  const snap = await getDocs(collection(db, "categories"));

  container.innerHTML = "";

  snap.forEach(docSnap => {
    const cat = docSnap.data();

    if (cat.hidden) return;

    const card = document.createElement("div");
    card.className = "home-card";

    card.innerHTML = `
      <img src="${cat.image}" />
      <div class="content">
        <h3>${cat.name}</h3>
      </div>
    `;

    // 👇 لما يضغط
    card.onclick = () => {
      window.location.href = `/room/new/setup?cat=${cat.slug}`;
    };

    container.appendChild(card);
  });
}

loadHomeCategories();