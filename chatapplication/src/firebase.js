import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyB0l8LIbUJZ9ly1BJrw4gN7LKVKXj348YY",
  authDomain: "authtest-b3b63.firebaseapp.com",
  projectId: "authtest-b3b63",
  storageBucket: "authtest-b3b63.appspot.com",
  messagingSenderId: "732282629235",
  appId: "1:732282629235:web:d72ea2bdd3a4cbfa010e06"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
