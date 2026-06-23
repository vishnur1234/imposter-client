
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAsQxOHBriDYNUBZWvoZ2YKCY7l-cvuUlM",
  authDomain: "imposter-4de97.firebaseapp.com",
  projectId: "imposter-4de97",
  storageBucket: "imposter-4de97.firebasestorage.app",
  messagingSenderId: "80464330823",
  appId: "1:80464330823:web:c90fa261a38c1f57607162"
};


const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);