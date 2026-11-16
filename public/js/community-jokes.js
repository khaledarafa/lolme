// public/js/community-jokes.js

import { functions, httpsCallable } from "/js/firebase.js";
import { jokesAuthReady } from "/js/jokes-auth.js";

const list = document.getElementById("community-jokes-list");
const total = document.getElementById("community-jokes-total");

const getPublishedJokes = httpsCallable(
  functions,
  "getPublishedCommunityJokes",
);

const getActiveCommunityQuestion = httpsCallable(
  functions,
  "getActiveCommunityQuestion",
);

const getQuestionComments = httpsCallable(
  functions,
  "getCommunityQuestionComments",
);

const submitQuestionResponse = httpsCallable(
  functions,
  "submitCommunityQuestionResponse",
);

async function loadQuestionComments(questionId, commentsList, countLabel) {
  commentsList.replaceChildren();

  const loading = document.createElement("p");
  loading.className = "community-comments-loading";
  loading.textContent = "جاري تحميل التعليقات...";
  commentsList.appendChild(loading);

  try {
    const result = await getQuestionComments({ questionId });
    const comments = result.data?.comments || [];

    countLabel.textContent = `💬 ${comments.length} تعليق`;

    commentsList.replaceChildren();

    if (!comments.length) {
      const empty = document.createElement("p");
      empty.className = "community-comments-empty";
      empty.textContent = "لسه مفيش ردود. كن أول واحد يشاركنا رأيه ❤️";
      commentsList.appendChild(empty);
      return;
    }

    comments.forEach((comment) => {
      const item = document.createElement("article");
      item.className = "community-comment";

      const meta = document.createElement("div");
      meta.className = "community-comment-meta";

      const author = document.createElement("strong");
      author.textContent = `👤 ${comment.authorName || "زائر"}`;

      const date = document.createElement("span");
      date.textContent = comment.createdAt ? formatDate(comment.createdAt) : "";

      meta.append(author, date);

      const text = document.createElement("p");
      text.className = "community-comment-text";
      text.textContent = comment.text || "";

      item.append(meta, text);
      commentsList.appendChild(item);
    });
  } catch (error) {
    console.error("[Community Question Comments]", error);

    commentsList.replaceChildren();

    const errorMessage = document.createElement("p");
    errorMessage.className = "community-comments-empty";
    errorMessage.textContent = "تعذر تحميل التعليقات. حاول تحديث الصفحة.";

    commentsList.appendChild(errorMessage);
    countLabel.textContent = "💬 تعذر تحميل التعليقات";
  }
}

async function loadActiveCommunityQuestion() {
  const questionsList = document.getElementById("community-questions-list");

  if (!questionsList) return;

  questionsList.replaceChildren();

  document.getElementById("load-more-community-questions")?.remove();

  try {
    const result = await getActiveCommunityQuestion();
    const questions = result.data?.questions || [];

    if (!questions.length) {
      const empty = document.createElement("div");
      empty.className = "community-questions-empty";
      empty.textContent = "مفيش أسئلة مطروحة حاليًا. تابعنا لأسئلة جديدة ❤️";
      questionsList.appendChild(empty);
      return;
    }

    const batchSize = 3;
    let visibleCount = 0;

    function createQuestionCard(question) {
      const card = document.createElement("section");
      card.id = `community-question-card-${question.id}`;
      card.className = "community-question-card";

      const heading = document.createElement("h3");
      heading.textContent = "📢 سؤال من إدارة LOLME";

      const prompt = document.createElement("p");
      prompt.className = "community-question-prompt";
      prompt.textContent = question.prompt;

      const jokeLabel = document.createElement("div");
      jokeLabel.className = "community-question-joke-label";
      jokeLabel.textContent = "المشاركة الأصلية:";

      const jokeText = document.createElement("div");
      jokeText.className = "community-question-joke";
      jokeText.textContent = question.jokeText;

      const footer = document.createElement("div");
      footer.className = "community-question-footer";
      footer.textContent = "مشاركتكم تهمنا ❤️";

      // قسم التعليقات
      const commentsSection = document.createElement("div");
      commentsSection.className = "community-comments-section";

      const commentsHeading = document.createElement("h4");
      commentsHeading.textContent = "💬 ردود الجمهور";

      const commentsCount = document.createElement("div");
      commentsCount.className = "community-comments-count";
      commentsCount.textContent = "جاري تحميل التعليقات...";

      const commentsList = document.createElement("div");
      commentsList.className = "community-comments-list";

      const commentForm = document.createElement("form");
      commentForm.className = "community-comment-form";

      const commentInput = document.createElement("textarea");
      commentInput.className = "community-comment-input";
      commentInput.placeholder = "اكتب تفسيرك أو تعليقك هنا... (اختياري)";
      commentInput.maxLength = 500;
      commentInput.rows = 3;

      const formMessage = document.createElement("div");
      formMessage.className = "community-comment-message";

      commentForm.append(commentInput, formMessage);

      commentsSection.append(
        commentsHeading,
        commentsCount,
        commentsList,
        commentForm,
      );

      // قسم التصويت
      const votingSection = document.createElement("div");
      votingSection.className = "community-voting-section";

      const votingHeading = document.createElement("h4");
      votingHeading.textContent = "📊 رأيكم إيه؟ ننشر النكتة ولا لأ؟";

      const votingStats = document.createElement("div");
      votingStats.className = "community-voting-stats";

      const publishCount = document.createElement("span");
      publishCount.textContent = `👍 موافق: ${question.publishVotes || 0}`;

      const rejectCount = document.createElement("span");
      rejectCount.textContent = `👎 رافض: ${question.rejectVotes || 0}`;

      const totalVotes = document.createElement("span");
      totalVotes.textContent = `🗳️ إجمالي الأصوات: ${question.totalVotes || 0}`;

      votingStats.append(publishCount, rejectCount, totalVotes);

      const votingActions = document.createElement("div");
      votingActions.className = "community-voting-actions";

      const publishVoteButton = document.createElement("button");
      publishVoteButton.type = "button";
      publishVoteButton.className = "community-vote-publish";
      publishVoteButton.textContent = "👍 انشروا النكتة";

      const rejectVoteButton = document.createElement("button");
      rejectVoteButton.type = "button";
      rejectVoteButton.className = "community-vote-reject";
      rejectVoteButton.textContent = "👎 بلاش ننشرها";

      const votingMessage = document.createElement("p");
      votingMessage.className = "community-voting-message";

      if (question.voteOpen === false) {
        votingMessage.textContent = "التصويت مغلق حاليًا.";
        publishVoteButton.disabled = true;
        rejectVoteButton.disabled = true;
      }

      async function castVote(vote) {
        if (question.voteOpen === false) return;

        const text = commentInput.value.trim();

        publishVoteButton.disabled = true;
        rejectVoteButton.disabled = true;
        votingMessage.textContent = "جاري تسجيل صوتك...";

        try {
          await authPromise;

          const responseData = {
            questionId: question.id,
            vote,
          };

          // التعليق اختياري
          if (text.length >= 2 && text.length <= 500) {
            responseData.text = text;
          }

          await submitQuestionResponse(responseData);

          commentInput.value = "";

          if (responseData.text) {
            await loadQuestionComments(
              question.id,
              commentsList,
              commentsCount,
            );
          }

          votingMessage.textContent = "تم تسجيل صوتك بنجاح ❤️";

          // تحديث أعداد التصويت
          const updated = await getActiveCommunityQuestion();

          const updatedQuestion = updated.data?.questions?.find(
            (item) => item.id === question.id,
          );

          if (updatedQuestion) {
            publishCount.textContent = `👍 موافق: ${updatedQuestion.publishVotes || 0}`;

            rejectCount.textContent = `👎 رافض: ${updatedQuestion.rejectVotes || 0}`;

            totalVotes.textContent = `🗳️ إجمالي الأصوات: ${updatedQuestion.totalVotes || 0}`;
          }
        } catch (error) {
          console.error("[Community Question Vote]", error);

          votingMessage.textContent =
            error.message || "تعذر تسجيل صوتك. حاول مرة أخرى.";
        } finally {
          if (question.voteOpen !== false) {
            publishVoteButton.disabled = false;
            rejectVoteButton.disabled = false;
          }
        }
      }

      publishVoteButton.addEventListener("click", () => {
        castVote("publish");
      });

      rejectVoteButton.addEventListener("click", () => {
        castVote("reject");
      });

      votingActions.append(publishVoteButton, rejectVoteButton);

      votingSection.append(
        votingHeading,
        votingStats,
        votingActions,
        votingMessage,
      );

      card.append(
        heading,
        prompt,
        jokeLabel,
        jokeText,
        footer,
        commentsSection,
        votingSection,
      );

      // تحميل تعليقات هذا السؤال
      loadQuestionComments(question.id, commentsList, commentsCount);

      return card;
    }

    // عرض الدفعة الأولى أو التالية
    function renderNextBatch() {
      const nextQuestions = questions.slice(
        visibleCount,
        visibleCount + batchSize,
      );

      const fragment = document.createDocumentFragment();

      nextQuestions.forEach((question) => {
        fragment.appendChild(createQuestionCard(question));
      });

      questionsList.appendChild(fragment);

      visibleCount += nextQuestions.length;

      document.getElementById("load-more-community-questions")?.remove();

      if (visibleCount < questions.length) {
        const moreButton = document.createElement("button");

        moreButton.id = "load-more-community-questions";
        moreButton.className = "load-more-community";
        moreButton.type = "button";
        moreButton.textContent = "عرض 3 أسئلة إضافية ↓";

        moreButton.addEventListener("click", renderNextBatch);

        questionsList.appendChild(moreButton);
      }
    }

    renderNextBatch();

    console.log("[Community Questions] Loaded:", questions.length);
  } catch (error) {
    console.error("[Community Questions]", error);
  }
}

// بدء العمليتين بالتوازي دون انتظار إحداهما للأخرى
const authPromise = jokesAuthReady;
// const jokesPromise = getPublishedJokes();

function formatDate(timestamp) {
  if (!timestamp) return "";

  const date =
    typeof timestamp === "number"
      ? new Date(timestamp)
      : timestamp.toDate?.() || new Date(timestamp);

  return new Intl.DateTimeFormat("ar-EG", {
    dateStyle: "medium",
  }).format(date);
}

function createJokeCard(joke) {
  const card = document.createElement("li");
  card.className = "card tilt-card";
  card.dataset.jokeId = joke.id;

  // بيانات الكاتب
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
          `${shareData.text}\n${shareData.url}`,
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

function showEmptyState() {
  const empty = document.createElement("li");
  empty.className = "card tilt-card";
  empty.style.textAlign = "center";

  empty.innerHTML = `
    <div style="font-size:40px">🤷‍♂️</div>
    <p>لسه مفيش نكت منشورة.</p>
    <p>كن أول واحد يشاركنا نكتته!</p>
    <a href="/submit-joke">ابعت نكتتك 😂</a>
  `;

  list.replaceChildren(empty);
}

function showError() {
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

async function loadReactions() {
  try {
    // المصادقة لا تعطل ظهور النكت
    await authPromise;

    // تشغيل التفاعلات بعد تجهيز المصادقة
    await import("/js/jokes-reactions.js");

    console.log("[Community Jokes] Reactions ready");
  } catch (error) {
    console.error("[Community Jokes] Reactions initialization error:", error);
  }
}

// مشاركة النكت الافتتاحية الموجودة في HTML
document.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-share-joke]");

  if (!button) return;

  const jokeText = button.dataset.shareJoke;

  if (!jokeText) return;

  const shareData = {
    title: "نكت LOLME 😂",
    text: `${jokeText} 😂🤣 من موقع لول مي!`,
    url: window.location.href,
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(
        `${shareData.text}\n${shareData.url}`,
      );

      button.textContent = "تم النسخ ✓";

      setTimeout(() => {
        button.textContent = "شارك الضحكة 😂";
      }, 2000);
    }
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("[Community Jokes] Share error:", error);
    }
  }
});

async function loadCommunityJokes() {
  try {
    total.textContent = "جاري التحميل...";

    const result = await getPublishedJokes();
    const jokes = result.data.jokes || [];

    const starterCount = document.querySelectorAll(
      ".starter-community-jokes [data-joke-id]",
    ).length;

    total.textContent = `🤣 ${starterCount + jokes.length} نكتة`;

    if (!jokes.length) {
      showEmptyState();
      return;
    }

    const batchSize = 10;
    let visibleCount = 0;

    // إزالة زر سابق عند إعادة التحميل
    document.getElementById("load-more-community-jokes")?.remove();

    function renderNextBatch() {
      const nextJokes = jokes.slice(visibleCount, visibleCount + batchSize);

      const fragment = document.createDocumentFragment();

      nextJokes.forEach((joke) => {
        fragment.appendChild(createJokeCard(joke));
      });

      list.appendChild(fragment);

      visibleCount += nextJokes.length;

      document.getElementById("load-more-community-jokes")?.remove();

      if (visibleCount < jokes.length) {
        const moreButton = document.createElement("button");

        moreButton.id = "load-more-community-jokes";
        moreButton.className = "load-more-community";
        moreButton.type = "button";
        moreButton.textContent = "عرض 10 نكت إضافية ↓";

        moreButton.addEventListener("click", renderNextBatch);

        list.after(moreButton);
      }
    }

    // عرض أول 10 نكت
    list.replaceChildren();
    renderNextBatch();

    console.log("[Community Jokes] Loaded:", visibleCount, "of", jokes.length);
  } catch (error) {
    console.error("[Community Jokes] Loading error:", error);

    total.textContent = "تعذر تحميل النكت";
    showError();
  } finally {
    void loadReactions();
  }
}

loadCommunityJokes();
loadActiveCommunityQuestion();
