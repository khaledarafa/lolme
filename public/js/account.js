
import {
  auth,
  onAuthStateChanged,
  signOut
} from "/js/firebase.js";

const status = document.getElementById("account-status");
const details = document.getElementById("account-details");
const email = document.getElementById("account-email");
const provider = document.getElementById("account-provider");
const logout = document.getElementById("logout-button");

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("/login");
    return;
  }

  status.textContent = "تم تسجيل الدخول بنجاح.";
  email.textContent = user.email || "غير متاح";

  const providers = user.providerData.map((item) => {
    return item.providerId === "google.com"
      ? "Google"
      : item.providerId === "password"
        ? "البريد الإلكتروني"
        : item.providerId;
  });

  provider.textContent = providers.join("، ") || "غير معروف";
  details.hidden = false;
});

logout?.addEventListener("click", async () => {
  logout.disabled = true;

  try {
    await signOut(auth);
    window.location.replace("/login");
  } catch (error) {
    console.error("Sign out error:", error);
    status.textContent = "تعذر تسجيل الخروج. حاول مرة أخرى.";
    logout.disabled = false;
  }
});
