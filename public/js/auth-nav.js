
import {
  auth,
  onAuthStateChanged
} from "/js/firebase.js";

const link = document.getElementById("account-nav-link");

if (link) {
  onAuthStateChanged(auth, (user) => {
    if (user) {
      link.href = "/account";
      link.textContent = "👤 حسابي";
    } else {
      link.href = "/login";
      link.textContent = "👤 دخول";
    }
  });
}
