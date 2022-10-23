import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/databasee";

const firebaseConfig = {
    apiKey: "AIzaSyBRPvcjYoM7nL7RHk-QdrsT3_yxQws_cNg",
    authDomain: "portfolio-c5bea.firebaseapp.com",
    projectId: "portfolio-c5bea",
    storageBucket: "portfolio-c5bea.appspot.com",
    messagingSenderId: "894003263508",
    appId: "1:894003263508:web:e0b32da0265ce7f0134f01",
    measurementId: "G-NFQYP1KP3S",
    databaseURL: "https://portfolio-c5bea-default-rtdb.firebaseio.com"
  };

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const analytics = getAnalytics(app);