// public/js/register.js
import {
  auth,
  createUserWithEmailAndPassword,
  signInWithPopup,
  googleProvider,
  sendEmailVerification,
} from "./firebase.js";

const form = document.getElementById("register-form");
const email = document.getElementById("register-email");
const password = document.getElementById("register-password");
const submit = document.getElementById("register-submit");
const googleBtn = document.getElementById("google-register");
const message = document.getElementById("auth-message");

function showError(error) {
  const errors = {
    "auth/email-already-in-use":
      "البريد الإلكتروني مسجّل بالفعل. جرّب تسجيل الدخول.",
    "auth/invalid-email": "البريد الإلكتروني غير صحيح.",
    "auth/weak-password": "كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل.",
    "auth/popup-closed-by-user": "أغلقت نافذة Google قبل إكمال العملية.",
    "auth/popup-blocked":
      "المتصفح منع نافذة Google. اسمح بالنوافذ المنبثقة وحاول مجددًا.",
    "auth/network-request-failed":
      "تعذر الاتصال. تحقق من الإنترنت وحاول مرة أخرى.",
  };

  message.textContent =
    errors[error.code] || "تعذر إنشاء الحساب. حاول مرة أخرى.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  submit.disabled = true;
  message.textContent = "جاري إنشاء الحساب...";

  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email.value.trim(),
      password.value,
    );

    await sendEmailVerification(userCredential.user);

    message.textContent =
      "تم إنشاء حسابك وإرسال رسالة تأكيد إلى بريدك الإلكتروني. راجع صندوق الوارد والرسائل غير المرغوب فيها.";

    form.reset();
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
