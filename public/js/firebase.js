// public/js/firebase.js
// 🔥 Firebase Core
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

// Firebase Authentication
import {
  getAuth,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInAnonymously,
  sendEmailVerification
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// Firestore
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
  startAfter,
  getCountFromServer,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// Storage
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-storage.js";

// Cloud Functions
import {
  getFunctions,
  httpsCallable,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-functions.js";

// 🔥 CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyDLBYHAaebIAF0QSy_1cgBr43icGY5II8E",
  authDomain: "lolme-cc.firebaseapp.com",
  projectId: "lolme-cc",
  storageBucket: "lolme-cc.firebasestorage.app",
  messagingSenderId: "113741468899",
  appId: "1:113741468899:web:6ab8ae0720d0dad060a1d6",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Cloud Functions - نفس منطقة النشر
export const functions = getFunctions(app, "us-central1");
export { httpsCallable };

// Firestore exports
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
  serverTimestamp,
};

// Authentication exports
export {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signInAnonymously,
  sendEmailVerification
};

// Storage exports
export { ref, uploadBytes, getDownloadURL };
