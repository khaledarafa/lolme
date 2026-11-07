// public/js/submit-joke.js
import { functions, httpsCallable } from "/js/firebase.js";

import { jokesAuthReady } from "/js/jokes-auth.js";

const form = document.getElementById("submit-joke-form");
const jokeInput = document.getElementById("joke-text");
const authorInput = document.getElementById("joke-author");
const charCount = document.getElementById("joke-char-count");
const submitButton = document.getElementById("submit-joke-button");
const messageBox = document.getElementById("submit-joke-message");

if (form && jokeInput && submitButton && messageBox) {
  const submitJoke = httpsCallable(functions, "submitCommunityJoke");

  // تحديث عداد الأحرف
  jokeInput.addEventListener("input", () => {
    if (charCount) {
      charCount.textContent = jokeInput.value.length;
    }
  });

  // عرض الرسائل
  function showMessage(message, type = "success") {
    messageBox.textContent = message;
    messageBox.style.display = "block";

    messageBox.style.background = type === "success" ? "#123b2c" : "#452329";

    messageBox.style.color = type === "success" ? "#86efac" : "#fca5a5";

    messageBox.style.border =
      type === "success" ? "1px solid #166534" : "1px solid #991b1b";
  }

  // إرسال النكتة
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const jokeText = jokeInput.value.trim();
    const authorName = authorInput?.value.trim() || "";

    if (jokeText.length < 10) {
      showMessage("النكتة قصيرة جدًا، اكتب 10 أحرف على الأقل.", "error");
      return;
    }

    if (jokeText.length > 1000) {
      showMessage("النكتة طويلة جدًا، الحد الأقصى 1000 حرف.", "error");
      return;
    }

    if (authorName.length > 30) {
      showMessage("الاسم المستعار يجب ألا يزيد عن 30 حرفًا.", "error");
      return;
    }

    submitButton.disabled = true;
    const buttonText = submitButton.querySelector(".button-text");
    const originalText = buttonText?.textContent || "إرسال النكتة 😂";

    if (buttonText) buttonText.textContent = "جاري الإرسال...";

    messageBox.style.display = "none";

    try {
      // التأكد من جاهزية هوية المستخدم
      await jokesAuthReady;

      // إرسال النكتة إلى السيرفر
      await submitJoke({
        text: jokeText,
        authorName,
      });

      showMessage(
        "وصلت نكتتك بنجاح! 😂 هتظهر في مجتمع LOLME بعد مراجعة الإدارة.",
      );

      form.reset();

      if (charCount) {
        charCount.textContent = "0";
      }
    } catch (error) {
      console.error("[Submit Joke] Error:", error);

      let errorMessage = "حصل خطأ أثناء إرسال النكتة. حاول مرة تانية.";

      if (error.code === "functions/resource-exhausted") {
        errorMessage = "وصلت للحد المسموح من النكت اليوم. جرّب بكرة.";
      } else if (error.code === "functions/unauthenticated") {
        errorMessage = "تعذر تجهيز هويتك. حدّث الصفحة وحاول تاني.";
      } else if (error.code === "functions/invalid-argument") {
        errorMessage = error.message || "راجع محتوى النكتة وحاول تاني.";
      }

      showMessage(errorMessage, "error");
    } finally {
      submitButton.disabled = false;

      const buttonText = submitButton.querySelector(".button-text");
      if (buttonText) {
        buttonText.textContent = "إرسال النكتة 😂";
      }
    }
  });
}
