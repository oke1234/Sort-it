// firebaseConfig.js
import { initializeApp } from "firebase/app";

import {
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";

import { getDatabase } from "firebase/database";

import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCySR4p9oeWBOFSVUBT8C0cIa4VbJsvTik",
  authDomain: "sortit-f8a73.firebaseapp.com",

  databaseURL:
    "https://sortit-f8a73-default-rtdb.europe-west1.firebasedatabase.app",

  projectId: "sortit-f8a73",
  storageBucket: "sortit-f8a73.firebasestorage.app",
  messagingSenderId: "446749168534",
  appId: "1:446749168534:web:1dfec32b89d907bfdc03b7",
  measurementId: "G-3EL6CB7ZM2",
};

const app = initializeApp(firebaseConfig);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

const db = getDatabase(app);

export { auth, db };
