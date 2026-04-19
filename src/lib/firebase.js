// 🔥 Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔥 Firestore
import {
  getFirestore,
  doc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  writeBatch,
  increment,
  orderBy,     // 🔥 ضيف ده
  limit,       // 🔥 وده
  startAfter   // 🔥 وده
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 🔥 Storage
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";


// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDLBYHAaebIAF0QSy_1cgBr43icGY5II8E",
  authDomain: "lolme-cc.firebaseapp.com",
  projectId: "lolme-cc",
  storageBucket: "lolme-cc.firebasestorage.app",
  messagingSenderId: "113741468899",
  appId: "1:113741468899:web:6ab8ae0720d0dad060a1d6"
};


// 🔥 INIT
const app = initializeApp(firebaseConfig);

// 🔥 EXPORT SERVICES
export const db = getFirestore(app);
export const storage = getStorage(app);


// 🔥 EXPORT FUNCTIONS (Firestore)
export {
  doc,
  collection,
  query,
  where,
  getDocs,
  setDoc,
  updateDoc,
  getDoc,
  deleteDoc,
  onSnapshot,
  addDoc,
  writeBatch,
  increment,
  orderBy,     // 🔥
  limit,       // 🔥
  startAfter   // 🔥
};


// 🔥 EXPORT FUNCTIONS (Storage)
export {
  ref,
  uploadBytes,
  getDownloadURL
};
