// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "studio-6667769576-2f158",
  "appId": "1:925902748075:web:dbb1ff7cea55227b077aee",
  "apiKey": "AIzaSyBSc5SwYqo_Fubz_6giEouk537tdZfOSFg",
  "authDomain": "studio-6667769576-2f158.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "925902748075"
};


// Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
