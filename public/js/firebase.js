import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js"; // 👈 ده الجديد

const firebaseConfig = {
    apiKey: "AIzaSyDLBYHAaebIAF0QSy_1cgBr43icGY5II8E",
    authDomain: "lolme-cc.firebaseapp.com",
    projectId: "lolme-cc",
    storageBucket: "lolme-cc.firebasestorage.app",
    messagingSenderId: "113741468899",
    appId: "1:113741468899:web:6ab8ae0720d0dad060a1d6"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);