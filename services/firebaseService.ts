import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// Optionally import analytics if you want to use it later
// import { getAnalytics } from "firebase/analytics"; 

const firebaseConfig = {
  apiKey: "AIzaSyAhWEOl42ZwfQvw6frmRIJ8L4N1LDshueM",
  authDomain: "agro-von.firebaseapp.com",
  databaseURL: "https://agro-von-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "agro-von",
  storageBucket: "agro-von.firebasestorage.app",
  messagingSenderId: "806841405171",
  appId: "1:806841405171:web:620fe3810a77080857b186",
  measurementId: "G-N0HDYGNEZE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Language set for OTP SMS (Optional but good for India)
auth.useDeviceLanguage();