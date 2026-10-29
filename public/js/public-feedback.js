
import {
  db,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  startAfter
} from "/js/firebase.js";

const box = document.getElementById("public-feedback-list");

const PAGE_SIZE = 6;
let lastVisible = null;
let isLoading = false;
let hasMore = true;
let loadMoreButton = null;

if (box) {
  loadPublicFeedback();
}

async function loadPublicFeedback() {
  if (isLoading || !hasMore || !box) return;

  isLoading = true;

  if (loadMoreButton) {
    loadMoreButton.disabled = true;
    loadMoreButton.textContent = "جاري التحميل...";
  }

  try {
    const constraints = [
      where("status", "==", "published"),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE)
    ];

    if (lastVisible) {
      constraints.push(startAfter(lastVisible));
    }

    const q = query(
      collection(db, "feedback"),
      ...constraints
    );

    const snapshot = await getDocs(q);

    if (!lastVisible) {
      box.replaceChildren();
    }

    if (snapshot.empty && !lastVisible) {
      box.textContent = "لسه مفيش تعليقات منشورة. شاركنا رأيك! ❤️";
      hasMore = false;
      return;
    }

    snapshot.forEach((item) => {
      const data = item.data();

      const card = document.createElement("article");
      card.className = "public-feedback-card";

      const message = document.createElement("p");
      message.className = "public-feedback-message";
      message.textContent = data.message || "";

      card.appendChild(message);

      if (data.createdAt?.toDate) {
        const date = document.createElement("div");
        date.className = "public-feedback-date";
        date.textContent = data.createdAt
          .toDate()
          .toLocaleDateString("ar-EG");

        card.appendChild(date);
      }

      box.appendChild(card);
    });

    lastVisible = snapshot.docs[snapshot.docs.length - 1] || lastVisible;
    hasMore = snapshot.size === PAGE_SIZE;

    updateLoadMoreButton();
  } catch (error) {
    console.error("Public feedback error:", error);

    if (!box.querySelector(".public-feedback-card")) {
      box.textContent = "تعذر تحميل التعليقات حاليًا.";
    }

    if (loadMoreButton) {
      loadMoreButton.disabled = false;
      loadMoreButton.textContent = "إعادة المحاولة";
    }
  } finally {
    isLoading = false;

    if (loadMoreButton && hasMore) {
      loadMoreButton.disabled = false;

      if (loadMoreButton.textContent === "جاري التحميل...") {
        loadMoreButton.textContent = "عرض المزيد من التعليقات";
      }
    }
  }
}

function updateLoadMoreButton() {
  if (!loadMoreButton) {
    loadMoreButton = document.createElement("button");
    loadMoreButton.type = "button";
    loadMoreButton.textContent = "عرض المزيد من التعليقات";
    loadMoreButton.className = "public-feedback-more";

    loadMoreButton.addEventListener("click", loadPublicFeedback);

    box.insertAdjacentElement("afterend", loadMoreButton);
  }

  loadMoreButton.hidden = !hasMore;

  if (!hasMore) {
    loadMoreButton.textContent = "عرضنا كل التعليقات ❤️";
  } else {
    loadMoreButton.textContent = "عرض المزيد من التعليقات";
  }
}
