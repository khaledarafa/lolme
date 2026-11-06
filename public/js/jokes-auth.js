// public/js/jokes-auth.js
import {
  auth,
  onAuthStateChanged,
  signInAnonymously,
} from "/js/firebase.js";

/**
 * تجهيز هوية الزائر للتفاعلات.
 * المستخدم المسجل يحتفظ بحسابه.
 * الزائر غير المسجل يحصل على حساب مجهول.
 */

export const jokesAuthReady = new Promise((resolve, reject) => {
  let unsubscribe = null;
  let isCreatingAnonymousUser = false;

  unsubscribe = onAuthStateChanged(
    auth,
    async (user) => {
      if (user) {
        unsubscribe?.();
        resolve(user);
        return;
      }

      if (isCreatingAnonymousUser) return;

      isCreatingAnonymousUser = true;

      try {
        const credential = await signInAnonymously(auth);

        unsubscribe?.();
        resolve(credential.user);
      } catch (error) {
        unsubscribe?.();
        console.error("[Jokes Auth] Anonymous sign-in failed:", error);
        reject(error);
      }
    },
    (error) => {
      unsubscribe?.();
      console.error("[Jokes Auth] Authentication error:", error);
      reject(error);
    },
  );
});
