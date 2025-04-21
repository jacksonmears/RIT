// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getStorage } from 'firebase/storage';

// Your new Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyBl82zHQla3xSfooZ0cc49YfA5W4MdTTBQ",
  authDomain: "recap-d22e0.firebaseapp.com", // typically projectId.firebaseapp.com
  projectId: "recap-d22e0",
  storageBucket: "recap-d22e0.firebasestorage.app",
  messagingSenderId: "530663415978",
  appId: "1:530663415978:android:be4aedd13844ee9728b0d3",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
// const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);

const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});
const storage = getStorage(app);

export { auth, db, storage };
