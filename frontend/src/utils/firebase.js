// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey:import.meta.env.VITE_FIREBASE_API_KEY,
   authDomain: "vertex-150ad.firebaseapp.com",
  projectId: "vertex-150ad",
  storageBucket: "vertex-150ad.firebasestorage.app",
  messagingSenderId: "236463359766",
  appId: "1:236463359766:web:fdd4b1554348d37b28f237"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth=getAuth(app)
export const googleProvider=new GoogleAuthProvider()