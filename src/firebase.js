import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDTd488DwrhLEmLbgpgWig7XuRWhTbSg5U",
  authDomain: "mr-truck-385cf.firebaseapp.com",
  projectId: "mr-truck-385cf",
  storageBucket: "mr-truck-385cf.firebasestorage.app",
  messagingSenderId: "432887697169",
  appId: "1:432887697169:web:1c2a6e71c8c92e19bf06b0",
  measurementId: "G-1P1JVM7V8K"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 
