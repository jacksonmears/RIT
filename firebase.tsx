// import { initializeApp, getApps, getApp } from 'firebase/app';
// import {
//     initializeAuth,
//     getReactNativePersistence,
//     getAuth,
//     Auth
// } from 'firebase/auth';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage';
//
// const firebaseConfig = {
//     apiKey: "AIzaSyBl82zHQla3xSfooZ0cc49YfA5W4MdTTBQ",
//     authDomain: "rit-d22e0.firebaseapp.com",
//     projectId: "rit-d22e0",
//     storageBucket: "rit-d22e0.firebasestorage.app",
//     messagingSenderId: "530663415978",
//     appId: "1:530663415978:android:be4aedd13844ee9728b0d3",
// };
//
// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
//
// let auth: Auth;
// try {
//     auth = getAuth(app);
// } catch (e) {
//     auth = initializeAuth(app, {
//         persistence: getReactNativePersistence(AsyncStorage),
//     });
// }
//
// const db = getFirestore(app);
// const storage = getStorage(app);
//
// export { app, auth, db, storage };




// firebase.ts
// import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getAuth, setPersistence, browserSessionPersistence, signInWithEmailAndPassword } from 'firebase/auth';  // ❗ No initializeAuth here
// import { getFirestore } from 'firebase/firestore';
// import { getStorage } from 'firebase/storage';
//
// const firebaseConfig = {
//     apiKey: "AIzaSyBl82zHQla3xSfooZ0cc49YfA5W4MdTTBQ",
//     authDomain: "rit-d22e0.firebaseapp.com",
//     projectId: "rit-d22e0",
//     storageBucket: "rit-d22e0.appspot.com",  // ❗ Fixed this too
//     messagingSenderId: "530663415978",
//     appId: "1:530663415978:android:be4aedd13844ee9728b0d3",
// };
//
// // Only initialize once
// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
//
// const auth = getAuth(app);
// const persist = async (email: string, password: string) => {
//     try {
//         await setPersistence(auth, browserSessionPersistence);
//         return await signInWithEmailAndPassword(auth, email, password);  // <-- return this so caller can get userCredential
//     } catch (error) {
//         console.error(error);
//         throw error;  // rethrow so caller can handle it
//     }
// };
//
// const db = getFirestore(app);
// const storage = getStorage(app);
//
// export { app, auth, db, storage, persist };



// firebase.js
// import { initializeApp } from 'firebase/app';
// import { getAuth } from 'firebase/auth';
// import { getFirestore } from 'firebase/firestore';
// import { initializeAuth, getReactNativePersistence } from "firebase/auth/react-native";
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { getStorage } from 'firebase/storage';
//
// // Your new Firebase project configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyBl82zHQla3xSfooZ0cc49YfA5W4MdTTBQ",
//     authDomain: "rit-d22e0.firebaseapp.com", // typically projectId.firebaseapp.com
//     projectId: "rit-d22e0",
//     storageBucket: "rit-d22e0.firebasestorage.app",
//     messagingSenderId: "530663415978",
//     appId: "1:530663415978:android:be4aedd13844ee9728b0d3",
// };
//
// // Initialize Firebase
// const app = initializeApp(firebaseConfig);
//
// // Initialize Firebase Authentication and get a reference to the service
// // const auth = getAuth(app);
//
// // Initialize Cloud Firestore and get a reference to the service
// const db = getFirestore(app);
//
// const auth = initializeAuth(app, {
//     persistence: getReactNativePersistence(AsyncStorage)
// });
// const storage = getStorage(app);
//
// export { auth, db, storage };


// // firebase.ts
// import { initializeApp, getApps, getApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// import { getStorage as getWebStorage } from 'firebase/storage';
// import auth from '@react-native-firebase/auth';
//
// // Your Firebase project configuration
// const firebaseConfig = {
//     apiKey: "AIzaSyBl82zHQla3xSfooZ0cc49YfA5W4MdTTBQ",
//     authDomain: "rit-d22e0.firebaseapp.com",
//     projectId: "rit-d22e0",
//     storageBucket: "rit-d22e0.firebasestorage.app",
//     messagingSenderId: "530663415978",
//     appId: "1:530663415978:android:be4aedd13844ee9728b0d3",
// };
//
// // Initialize the web SDK app once
// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
//
// // Firestore and (web) Storage
// const db = getFirestore(app);
// const storage = getWebStorage(app);
//
// // React Native Firebase Auth handles its own native persistence internally
// export { auth, db, storage };



// firebase.ts
import { getApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
export { auth, firestore as db, storage };


const firebaseConfig = {
    apiKey: "AIzaSyBl82zHQla3xSfooZ0cc49YfA5W4MdTTBQ",
    authDomain: "rit-d22e0.firebaseapp.com",
    projectId: "rit-d22e0",
    storageBucket: "rit-d22e0.firebasestorage.app",
    messagingSenderId: "530663415978",
    appId: "1:530663415978:android:be4aedd13844ee9728b0d3",
};

// const app = getApp();




