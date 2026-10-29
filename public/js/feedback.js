
import {
  db,
  collection,
  addDoc,
  serverTimestamp
} from "/js/firebase.js";

const form = document.getElementById("feedback-form");
const textarea = document.getElementById("feedback");
const submitBtn = document.getElementById("feedback-submit");
const result = document.getElementById("feedback-result");

// لا تشغّل النموذج لو عناصره غير موجودة
if (form && textarea && submitBtn && result) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const message = (textarea.value || "").trim();

    if (!message) {
      result.textContent = "اكتب اقتراحك الأول.";
      return;
    }

    if (message.length > 2000) {
      result.textContent = "الرسالة طويلة جدًا.";
      return;
    }

    submitBtn.disabled = true;
    result.textContent = "جاري إرسال اقتراحك...";

    try {
      await addDoc(collection(db, "feedback"), {
        message,
        status: "pending",
        createdAt: serverTimestamp()
      });

      form.reset();
      result.textContent = "✅ شكرًا لك! وصل اقتراحك بنجاح.";
    } catch (error) {
      console.error("Feedback submission error:", error);
      result.textContent = "تعذر إرسال الاقتراح. حاول مرة أخرى.";
    } finally {
      submitBtn.disabled = false;
    }
  });
}
