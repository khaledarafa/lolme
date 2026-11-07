
import {
  functions,
  httpsCallable,
} from "/js/firebase.js";

const list = document.getElementById("community-jokes-list");
const countBox = document.getElementById("community-jokes-count");
const refreshButton = document.getElementById("refresh-community-jokes");

const getPendingJokes = httpsCallable(
  functions,
  "getPendingCommunityJokes"
);

const reviewJoke = httpsCallable(
  functions,
  "reviewCommunityJoke"
);

const deleteJoke = httpsCallable(
  functions,
  "deleteCommunityJoke"
);

let initialized = false;
let loading = false;

function formatDate(timestamp) {
  if (!timestamp) return "غير معروف";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

async function loadCommunityJokes() {
  if (loading) return;

  loading = true;
  refreshButton.disabled = true;
  countBox.textContent = "جاري تحميل النكت...";
  list.innerHTML = "";

  try {
    const result = await getPendingJokes();
    const jokes = result.data.jokes || [];

    countBox.textContent = `النكت المعلقة: ${jokes.length}`;

    if (!jokes.length) {
      list.innerHTML = `
        <div class="community-jokes-empty">
          🎉 مفيش نكت جديدة للمراجعة حاليًا.
        </div>
      `;
      return;
    }

    jokes.forEach((joke) => {
      const card = document.createElement("article");
      card.className = "community-joke-card";

      const jokeText = document.createElement("div");
      jokeText.className = "community-joke-text";
      jokeText.textContent = joke.text;

      const meta = document.createElement("div");
      meta.className = "community-joke-meta";
      meta.textContent =
        `👤 ${joke.authorName || "مجهول"} — 📅 ${formatDate(joke.createdAt)}`;

      const actions = document.createElement("div");
      actions.className = "community-joke-actions";

      const approveButton = document.createElement("button");
      approveButton.className = "community-joke-approve";
      approveButton.textContent = "✅ موافقة ونشر";

      const deleteButton = document.createElement("button");
      deleteButton.className = "community-joke-delete";
      deleteButton.textContent = "🗑️ حذف";

      approveButton.addEventListener("click", async () => {
        if (!confirm("هل تريد نشر هذه النكتة؟")) return;

        approveButton.disabled = true;
        deleteButton.disabled = true;

        try {
          await reviewJoke({ jokeId: joke.id });
          card.remove();
          updateCount();
        } catch (error) {
          console.error(error);
          alert(error.message || "تعذرت الموافقة على النكتة.");
          approveButton.disabled = false;
          deleteButton.disabled = false;
        }
      });

      deleteButton.addEventListener("click", async () => {
        if (!confirm("هل أنت متأكد من حذف النكتة نهائيًا؟")) return;

        approveButton.disabled = true;
        deleteButton.disabled = true;

        try {
          await deleteJoke({ jokeId: joke.id });
          card.remove();
          updateCount();
        } catch (error) {
          console.error(error);
          alert(error.message || "تعذر حذف النكتة.");
          approveButton.disabled = false;
          deleteButton.disabled = false;
        }
      });

      actions.append(approveButton, deleteButton);
      card.append(jokeText, meta, actions);
      list.appendChild(card);
    });

  } catch (error) {
    console.error("[Community Jokes Admin]", error);
    countBox.textContent = "حدث خطأ أثناء تحميل النكت.";
    list.innerHTML = `
      <div class="community-jokes-empty">
        تعذر تحميل النكت. تأكد من صلاحيات الأدمن واتصالك بالإنترنت.
      </div>
    `;
  } finally {
    loading = false;
    refreshButton.disabled = false;
  }
}

function updateCount() {
  const remaining = list.querySelectorAll(".community-joke-card").length;
  countBox.textContent = `النكت المعلقة: ${remaining}`;

  if (remaining === 0) {
    list.innerHTML = `
      <div class="community-jokes-empty">
        🎉 انتهيت من مراجعة كل النكت!
      </div>
    `;
  }
}

window.initCommunityJokes = function () {
  if (initialized) return;

  initialized = true;
  loadCommunityJokes();
};

refreshButton.addEventListener("click", loadCommunityJokes);
