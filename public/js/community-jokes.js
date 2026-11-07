
import { functions, httpsCallable } from "/js/firebase.js";
import { jokesAuthReady } from "/js/jokes-auth.js";

const list = document.getElementById("community-jokes-list");
const total = document.getElementById("community-jokes-total");

const getPublishedJokes = httpsCallable(
  functions,
  "getPublishedCommunityJokes",
);

function formatDate(timestamp) {
  if (!timestamp) return "";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
  }).format(new Date(timestamp));
}


function createJokeCard(joke) {
  const card = document.createElement("li");
  card.className = "card tilt-card";
  card.dataset.jokeId = joke.id;

  // بيانات الكاتب في أعلى الكارت
  const meta = document.createElement("div");
  meta.className = "community-joke-meta";
  meta.textContent = `👤 ${joke.authorName || "مجهول"} · 📅 ${
    joke.createdAt ? formatDate(joke.createdAt) : ""
  }`;

  // نص النكتة
  const text = document.createElement("p");
  text.className = "community-joke-text";
  text.textContent = (joke.text || "")
  .replace(/\r\n/g, "\n")
  .replace(/\n[ \t]*\n+/g, "\n")
  .trim();

  // التفاعلات
  const reactions = document.createElement("div");
  reactions.className = "joke-reactions";
  reactions.dataset.reactionsFor = joke.id;

  // زر المشاركة
  const shareButton = document.createElement("button");
  shareButton.type = "button";
  shareButton.className = "share-btn";
  shareButton.textContent = "شارك الضحكة 😂";

  shareButton.addEventListener("click", async () => {
    const shareData = {
      title: "نكت المجتمع | LOLME",
      text: `${joke.text} 😂🤣 من موقع لول مي!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(
          `${shareData.text}\n${shareData.url}`
        );

        shareButton.textContent = "تم النسخ ✓";

        setTimeout(() => {
          shareButton.textContent = "شارك الضحكة 😂";
        }, 2000);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("[Community Jokes] Share error:", error);
      }
    }
  });

  card.append(meta, text, reactions, shareButton);

  return card;
}



async function loadCommunityJokes() {
  try {
    await jokesAuthReady;

    const result = await getPublishedJokes();
    const jokes = result.data.jokes || [];

    list.innerHTML = "";

    total.textContent = `🤣 ${jokes.length} نكتة`;

    if (!jokes.length) {
      const empty = document.createElement("li");
      empty.className = "card tilt-card";
      empty.style.textAlign = "center";

      empty.innerHTML = `
        <div style="font-size:40px">🤷‍♂️</div>
        <p>لسه مفيش نكت منشورة.</p>
        <p>كن أول واحد يشاركنا نكتته!</p>
        <a href="/submit-joke">ابعت نكتتك 😂</a>
      `;

      list.appendChild(empty);
      return;
    }

    const fragment = document.createDocumentFragment();

    jokes.forEach((joke) => {
      fragment.appendChild(createJokeCard(joke));
    });

    list.appendChild(fragment);

    // تحميل نظام التفاعلات بعد إنشاء الكروت
    await import("/js/jokes-reactions.js");

    console.log("[Community Jokes] Loaded:", jokes.length);
  } catch (error) {
    console.error("[Community Jokes] Loading error:", error);

    total.textContent = "تعذر تحميل النكت";

    const errorItem = document.createElement("li");
    errorItem.className = "card tilt-card";
    errorItem.style.textAlign = "center";

    errorItem.innerHTML = `
      <div style="font-size:38px">😕</div>
      <p>حصلت مشكلة أثناء تحميل نكت المجتمع.</p>
      <button id="retry-community-jokes" type="button">
        حاول مرة تانية
      </button>
    `;

    list.replaceChildren(errorItem);

    document
      .getElementById("retry-community-jokes")
      ?.addEventListener("click", loadCommunityJokes);
  }
}

loadCommunityJokes();
