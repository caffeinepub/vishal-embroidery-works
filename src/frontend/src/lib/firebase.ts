import { getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDFMXeYhqqwBSe7Ewnlb3zc6K_xXYBD4fc",
  authDomain: "vishal-embroidery-works-33693.firebaseapp.com",
  projectId: "vishal-embroidery-works-33693",
  storageBucket: "vishal-embroidery-works-33693.firebasestorage.app",
  messagingSenderId: "568134362574",
  appId: "1:568134362574:web:91b3053339ffd3f125779f",
};

const app =
  getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db = getFirestore(app);
