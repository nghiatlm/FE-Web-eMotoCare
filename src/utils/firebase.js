// src/utils/firebase.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA1OWJ6UJJTaYw-6AEFUNOxN9W5jEu8DCw",
  authDomain: "pet-management-64c9e.firebaseapp.com",
  projectId: "pet-management-64c9e",
  storageBucket: "pet-management-64c9e.appspot.com",
  messagingSenderId: "294547736461",
  appId: "1:294547736461:web:f3f62b1055d7648fa45fc4",
  measurementId: "G-XRLN7L66HP",
};

// ✅ Initialize Firebase
const app = initializeApp(firebaseConfig);

// ✅ Initialize Storage
const storage = getStorage(app);

// ✅ Export
export { app, storage };
