
import {
  auth,
  sendPasswordResetEmail
} from "/js/firebase.js";

const form = document.getElementById("reset-form");
const email = document.getElementById("reset-email");
const submit = document.getElementById("reset-submit");
const message = document.getElementById("reset-message");

if (form && email && submit && message) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    submit.disabled = true;
    message.textContent = "جاري إرسال الطلب...";

    try {
      await sendPasswordResetEmail(auth, email.value.trim());

      message.textContent =
        "إذا كان البريد مسجلًا، فستصلك رسالة تحتوي على رابط استعادة كلمة المرور. تحقق من البريد الوارد والرسائل غير المرغوب فيها.";
    } catch (error) {
      console.error("Password reset error:", error);

      message.textContent =
        "تعذر إرسال الطلب حاليًا. راجع البريد وحاول مرة أخرى.";
    } finally {
      submit.disabled = false;
    }
  });
}
