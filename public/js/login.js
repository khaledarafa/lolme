
import {
  auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  googleProvider
} from "/js/firebase.js";

const form = document.getElementById("login-form");
const email = document.getElementById("login-email");
const password = document.getElementById("login-password");
const submit = document.getElementById("login-submit");
const googleBtn = document.getElementById("google-login");
const message = document.getElementById("auth-message");

if (form && email && password && submit && googleBtn && message) {
  function showError(error) {
    const errors = {
      "auth/invalid-credential": "البريد أو كلمة المرور غير صحيحة.",
      "auth/user-not-found": "لا يوجد حساب بهذا البريد.",
      "auth/wrong-password": "كلمة المرور غير صحيحة.",
      "auth/invalid-email": "البريد الإلكتروني غير صحيح.",
      "auth/popup-closed-by-user": "أغلقت نافذة Google قبل إكمال العملية.",
      "auth/popup-blocked": "اسمح بالنوافذ المنبثقة وحاول مجددًا.",
      "auth/too-many-requests": "محاولات كثيرة. انتظر قليلًا ثم حاول مجددًا."
    };

    message.textContent =
      errors[error.code] || "تعذر تسجيل الدخول. حاول مرة أخرى.";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    message.textContent = "جاري تسجيل الدخول...";

    try {
      await signInWithEmailAndPassword(
        auth,
        email.value.trim(),
        password.value
      );

      window.location.href = "/account";
    } catch (error) {
      showError(error);
    } finally {
      submit.disabled = false;
    }
  });

  googleBtn.addEventListener("click", async () => {
    googleBtn.disabled = true;
    message.textContent = "جاري الاتصال بـ Google...";

    try {
      await signInWithPopup(auth, googleProvider);
      window.location.href = "/account";
    } catch (error) {
      showError(error);
    } finally {
      googleBtn.disabled = false;
    }
  });
}
