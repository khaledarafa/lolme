// public/js/admin/community-jokes.js بتاع مراجعة النكت للادمن

import { functions, httpsCallable } from "/js/firebase.js";

const list = document.getElementById("community-jokes-list");
const countBox = document.getElementById("community-jokes-count");
const refreshButton = document.getElementById("refresh-community-jokes");

const getPendingJokes = httpsCallable(functions, "getPendingCommunityJokes");

const reviewJoke = httpsCallable(functions, "reviewCommunityJoke");

const deleteJoke = httpsCallable(functions, "deleteCommunityJoke");

const publishQuestion = httpsCallable(functions, "publishCommunityQuestion");

const getActiveQuestion = httpsCallable(
  functions,
  "getLatestCommunityQuestionForAdmin",
);

// const closeQuestion = httpsCallable(functions, "closeCommunityQuestion");
const publishQuestionJoke = httpsCallable(
  functions,
  "publishCommunityQuestionJoke",
);

const deleteQuestionJoke = httpsCallable(
  functions,
  "deleteCommunityQuestionJoke",
);
const getQuestionComments = httpsCallable(
  functions,
  "getCommunityQuestionComments",
);

const questionContent = document.getElementById(
  "community-question-admin-content",
);

const questionStatus = document.getElementById("community-question-status");

let initialized = false;
let loading = false;

function formatDate(timestamp) {
  if (!timestamp) return "غير معروف";

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

async function loadAdminQuestionComments(questionId, commentsList, countLabel) {
  commentsList.innerHTML = `
    <div class="community-comments-loading">
      جاري تحميل تعليقات الجمهور...
    </div>
  `;

  try {
    const result = await getQuestionComments({ questionId });
    const comments = result.data?.comments || [];

    countLabel.textContent = `التعليقات المعروضة: ${comments.length}`;

    if (!comments.length) {
      commentsList.innerHTML = `
        <div class="community-comments-empty">
          لا توجد تعليقات على هذا السؤال حتى الآن.
        </div>
      `;
      return;
    }

    commentsList.innerHTML = "";

    comments.forEach((comment) => {
      const item = document.createElement("div");
      item.className = "community-admin-comment";

      const meta = document.createElement("div");
      meta.className = "community-admin-comment-meta";

      const author = document.createElement("strong");
      author.textContent = comment.authorName || "مجهول";

      const date = document.createElement("span");
      date.textContent = formatDate(comment.createdAt);

      const text = document.createElement("p");
      text.textContent = comment.text || "";

      meta.append(author, date);
      item.append(meta, text);
      commentsList.appendChild(item);
    });
  } catch (error) {
    console.error("[Load Community Question Comments]", error);

    countLabel.textContent = "تعذر تحميل التعليقات";

    commentsList.innerHTML = `
      <div class="community-comments-empty">
        حدث خطأ أثناء تحميل تعليقات الجمهور.
      </div>
    `;
  }
}

async function loadActiveQuestion() {
  if (!questionContent) return;

  questionContent.innerHTML = `<div class="community-question-loading">جاري تحميل الأسئلة...</div>`;

  questionStatus.textContent = "جاري التحميل...";

  try {
    const result = await getActiveQuestion();
    const questions = result.data?.questions || [];

    questionContent.innerHTML = "";

    if (!questions.length) {
      questionStatus.textContent = "لا توجد أسئلة";
      questionContent.innerHTML = `
        <div class="community-question-empty">
          لا توجد أسئلة للجمهور حاليًا.
        </div>
      `;
      return;
    }

    questionStatus.textContent = `عدد أسئلة الإدارة: ${questions.length}`;
    questionStatus.classList.remove("closed");

    const fragment = document.createDocumentFragment();

    questions.forEach((question) => {
      const card = document.createElement("div");
      card.className = "community-question-admin-card";

      const prompt = document.createElement("p");
      prompt.className = "community-question-admin-prompt";
      prompt.textContent = question.prompt || "";

      const joke = document.createElement("div");
      joke.className = "community-question-admin-joke";
      joke.textContent = question.jokeText || "";

      const stats = document.createElement("div");
      stats.className = "community-question-admin-stats";

      const statItems = [
        ["إجمالي الأصوات", question.totalVotes || 0],
        ["موافق", question.publishVotes || 0],
        ["رافض", question.rejectVotes || 0],
        ["التعليقات", question.commentsCount || 0],
      ];

      statItems.forEach(([label, value]) => {
        const item = document.createElement("div");
        item.className = "community-question-stat";

        const title = document.createElement("span");
        title.textContent = label;

        const number = document.createElement("strong");
        number.textContent = value;

        item.append(title, number);
        stats.appendChild(item);
      });

      const cardStatus = document.createElement("div");
      cardStatus.className = "community-question-card-status";
      cardStatus.textContent = question.publishedAt
        ? "✅ تم نشر النكتة"
        : question.status === "closed"
          ? "السؤال مغلق"
          : "السؤال نشط";

      card.append(joke, prompt, cardStatus, stats);

      // تعليقات الجمهور الخاصة بهذا السؤال
      const commentsSection = document.createElement("details");
      commentsSection.className = "community-admin-comments";

      const commentsHeader = document.createElement("summary");
      commentsHeader.className = "community-admin-comments-header";

      const commentsTitle = document.createElement("strong");
      commentsTitle.textContent = "💬 تعليقات الجمهور";

      const commentsCount = document.createElement("span");
      commentsCount.className = "community-admin-comments-count";
      commentsCount.textContent = "جاري التحميل...";

      commentsHeader.append(commentsTitle, commentsCount);

      const commentsList = document.createElement("div");
      commentsList.className = "community-admin-comments-list";

      commentsSection.append(commentsHeader, commentsList);
      card.appendChild(commentsSection);

      // أزرار النشر والحذف
      if (question.publishedAt) {
        const doneMessage = document.createElement("div");
        doneMessage.className = "community-question-done";
        doneMessage.textContent = "✅ تم نشر النكتة بالفعل.";
        card.appendChild(doneMessage);
      } else {
        const actions = document.createElement("div");
        actions.className = "community-question-admin-actions";

        const publishButton = document.createElement("button");
        publishButton.type = "button";
        publishButton.className = "community-question-publish";
        publishButton.textContent = "✅ نشر النكتة نهائيًا";

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "community-question-delete";
        deleteButton.textContent = "🗑️ حذف السؤال والنكتة";

        publishButton.addEventListener("click", async () => {
          if (!confirm("سيتم نشر النكتة للجميع. هل تريد المتابعة؟")) return;

          publishButton.disabled = true;
          deleteButton.disabled = true;
          publishButton.textContent = "جاري النشر...";

          try {
            await publishQuestionJoke({ questionId: question.id });
            alert("✅ تم نشر النكتة بنجاح.");
            await loadActiveQuestion();
          } catch (error) {
            console.error("[Publish Question Joke]", error);
            alert(error.message || "تعذر نشر النكتة.");
            publishButton.disabled = false;
            deleteButton.disabled = false;
            publishButton.textContent = "✅ نشر النكتة نهائيًا";
          }
        });

        deleteButton.addEventListener("click", async () => {
          if (
            !confirm(
              "⚠️ سيتم حذف السؤال والنكتة الأصلية وكل التعليقات والتصويتات نهائيًا. هل أنت متأكد؟",
            )
          )
            return;

          publishButton.disabled = true;
          deleteButton.disabled = true;
          deleteButton.textContent = "جاري الحذف...";

          try {
            await deleteQuestionJoke({ questionId: question.id });
            alert("🗑️ تم حذف السؤال والنكتة بنجاح.");
            await loadActiveQuestion();
          } catch (error) {
            console.error("[Delete Question Joke]", error);
            alert(error.message || "تعذر حذف السؤال والنكتة.");
            publishButton.disabled = false;
            deleteButton.disabled = false;
            deleteButton.textContent = "🗑️ حذف السؤال والنكتة";
          }
        });

        actions.append(publishButton, deleteButton);
        card.appendChild(actions);
      }

      fragment.appendChild(card);

      // تحميل تعليقات كل سؤال بصورة مستقلة
      loadAdminQuestionComments(question.id, commentsList, commentsCount);
    });

    questionContent.appendChild(fragment);
  } catch (error) {
    console.error("[Load Active Community Questions]", error);

    questionStatus.textContent = "حدث خطأ";

    questionContent.innerHTML = `
      <div class="community-question-empty">
        تعذر تحميل الأسئلة. حاول تحديث الصفحة.
      </div>
    `;
  }
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
      meta.textContent = `👤 ${joke.authorName || "مجهول"} — 📅 ${formatDate(joke.createdAt)}`;

      // خانة كتابة السؤال للجمهور
      const questionInput = document.createElement("textarea");
      questionInput.className = "community-question-input";
      questionInput.placeholder =
        "اكتب سؤالك للجمهور... مثال: هل فهمتوا المقصود من النكتة؟";
      questionInput.maxLength = 500;
      questionInput.rows = 3;

      const actions = document.createElement("div");
      actions.className = "community-joke-actions";

      const approveButton = document.createElement("button");
      approveButton.className = "community-joke-approve";
      approveButton.textContent = "✅ موافقة ونشر";

      const questionButton = document.createElement("button");
      questionButton.className = "community-joke-question";
      questionButton.textContent = "📢 تحويل لسؤال للجمهور";

      const deleteButton = document.createElement("button");
      deleteButton.className = "community-joke-delete";
      deleteButton.textContent = "🗑️ حذف";

      // الموافقة على نشر النكتة
      approveButton.addEventListener("click", async () => {
        if (!confirm("هل تريد نشر هذه النكتة؟")) return;

        setButtonsDisabled(true);

        try {
          await reviewJoke({ jokeId: joke.id });
          card.remove();
          updateCount();
        } catch (error) {
          console.error(error);
          alert(error.message || "تعذرت الموافقة على النكتة.");
          setButtonsDisabled(false);
        }
      });

      // تحويل النكتة إلى سؤال للجمهور
      questionButton.addEventListener("click", async () => {
        const prompt = questionInput.value.trim();

        if (prompt.length < 5) {
          alert("اكتب سؤالًا للجمهور لا يقل عن 5 أحرف.");
          questionInput.focus();
          return;
        }

        if (
          !confirm(
            "سيتم نشر السؤال للجمهور وإخراج النكتة من قائمة المراجعة. هل تريد المتابعة؟",
          )
        ) {
          return;
        }

        setButtonsDisabled(true);

        try {
          await publishQuestion({
            jokeId: joke.id,
            prompt,
          });

          alert("تم نشر السؤال للجمهور بنجاح ❤️");

          card.remove();
          updateCount();
        } catch (error) {
          console.error("[Publish Community Question]", error);
          alert(error.message || "تعذر نشر السؤال.");
          setButtonsDisabled(false);
        }
      });

      // حذف النكتة
      deleteButton.addEventListener("click", async () => {
        if (!confirm("هل أنت متأكد من حذف النكتة نهائيًا؟")) return;

        setButtonsDisabled(true);

        try {
          await deleteJoke({ jokeId: joke.id });
          card.remove();
          updateCount();
        } catch (error) {
          console.error(error);
          alert(error.message || "تعذر حذف النكتة.");
          setButtonsDisabled(false);
        }
      });

      function setButtonsDisabled(disabled) {
        approveButton.disabled = disabled;
        questionButton.disabled = disabled;
        deleteButton.disabled = disabled;
        questionInput.disabled = disabled;
      }

      actions.append(approveButton, questionButton, deleteButton);

      card.append(jokeText, meta, questionInput, actions);

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
  loadActiveQuestion();
};

refreshButton.addEventListener("click", () => {
  loadCommunityJokes();
  loadActiveQuestion();
});
