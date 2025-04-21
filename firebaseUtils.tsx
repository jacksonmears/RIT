// src/firebase/firebaseUtils.ts
import { auth, storage, db } from './firebase';
import { updateProfile } from 'firebase/auth';
import {
    ref as storageRef,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import * as ImagePicker from 'expo-image-picker';
import {getDoc, doc, updateDoc} from "firebase/firestore";

// helper to build your storage path
const PROFILE_PIC_PATH = (uid: string): string => `profilePictures/${uid}.jpg`;

/**
 * Launches the image picker and returns the selected local URI (or null).
 */
export async function pickImageAsync(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Gallery permission denied');
    }

    const result: ImagePicker.ImagePickerResult =
        await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

    // new API uses `canceled` + `assets`
    if (result.canceled) {
        return null;
    }
    // safe because canceled===false means assets[0] exists
    return result.assets[0].uri;
}

/**
 * Uploads the local file URI to Cloud Storage and returns its download URL.
 */
export async function uploadProfileImageAsync(localUri: string): Promise<string> {
    if (!auth.currentUser) {
        throw new Error('No user logged in');
    }
    // fetch file, turn into blob
    const response = await fetch(localUri);
    const blob = await response.blob();

    const path = PROFILE_PIC_PATH(auth.currentUser.uid);
    const ref = storageRef(storage, path);

    await uploadBytes(ref, blob);
    return getDownloadURL(ref);
}

/**
 * Sets the Firebase Auth user's photoURL to the given URL.
 */
export async function setAuthUserProfilePhoto(downloadURL: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('No user logged in');
    }
    await updateProfile(user, { photoURL: downloadURL });
    const userRef = doc(db, "users", user.uid)
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        // Document doesn't exist, you can create or update with default values
        await updateDoc(userRef, { photoURL: downloadURL });
    }
}

/**
 * Deletes the user’s profile image from Cloud Storage.
 */
export async function deleteProfileImageAsync(): Promise<void> {
    if (!auth.currentUser) {
        throw new Error('No user logged in');
    }
    const path = PROFILE_PIC_PATH(auth.currentUser.uid);
    const ref = storageRef(storage, path);
    await deleteObject(ref);
}

/**
 * Clears the Auth user's photoURL (sets it to null).
 */
export async function clearAuthUserProfilePhoto(): Promise<void> {
    if (!auth.currentUser) {
        throw new Error('No user logged in');
    }
    await updateProfile(auth.currentUser, { photoURL: null });
    const userRef = doc(db, "users", auth.currentUser.uid)
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists) {
        await updateDoc(userRef, { photoURL: null });
    }
}
