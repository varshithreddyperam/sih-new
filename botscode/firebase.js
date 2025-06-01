import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDAe-I8KvvvP7R4WmsYKxJkWBv-QwGDXH8",
  authDomain: "otscode-f74b2.firebaseapp.com",
  projectId: "otscode-f74b2",
  storageBucket: "otscode-f74b2.firebasestorage.app",
  messagingSenderId: "708337119100",
  appId: "1:708337119100:web:fb1a8f405bb57ca299bef9",
  measurementId: "G-Z9FTZTJPGX"
};

const app = initializeApp(firebaseConfig);
let analytics;
if (typeof window !== "undefined") {
  import("firebase/analytics").then(({ getAnalytics }) => {
    analytics = getAnalytics(app);
  });
}
const auth = getAuth(app);
const database = getDatabase(app);
const provider = new GoogleAuthProvider();

export { app, auth, database, provider };
