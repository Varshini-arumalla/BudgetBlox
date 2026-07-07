import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCZ6ye2PI-ck0G6nRF80N75ze6sJIUm888",
  authDomain: "budgetblox-398ad.firebaseapp.com",
  projectId: "budgetblox-398ad",
  storageBucket: "budgetblox-398ad.firebasestorage.app",
  messagingSenderId: "324237173374",
  appId: "1:324237173374:web:2428cafcaac373c70aae2f",
  measurementId: "G-365BWGNYR9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };
