// public/js/firebase.js
// 🔥 Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// 🔐 Firebase Authentication
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

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
  orderBy,
  limit,
  startAfter, getCountFromServer, serverTimestamp
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

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

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
  orderBy,
  limit,
  startAfter,
  getCountFromServer,
  serverTimestamp
};

export {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
};

// 🔥 EXPORT FUNCTIONS (Storage)
export {
  ref,
  uploadBytes,
  getDownloadURL
};
