// firebaseConfig.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Vervang dit met de config die je krijgt uit je Firebase Console (Project Settings)
const firebaseConfig = {
  apiKey: "AIzaSyCySR4p9oeWBOFSVUBT8C0cIa4VbJsvTik",
  authDomain: "sortit-f8a73.firebaseapp.com",
  projectId: "sortit-f8a73",
  storageBucket: "sortit-f8a73.firebasestorage.app",
  messagingSenderId: "446749168534",
  appId: "1:446749168534:web:1dfec32b89d907bfdc03b7",
  measurementId: "G-3EL6CB7ZM2"
};

// Initialiseer Firebase
const app = initializeApp(firebaseConfig);

// Initialiseer Auth met persistence zodat gebruikers ingelogd blijven
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

export { auth };