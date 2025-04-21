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

const PROFILE_PIC_PATH = (uid: string): string => `profilePictures/${uid}.jpg`;


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

    if (result.canceled) {
        return null;
    }
    return result.assets[0].uri;
}


export async function uploadProfileImageAsync(localUri: string): Promise<string> {
    if (!auth.currentUser) {
        throw new Error('No user logged in');
    }
    const response = await fetch(localUri);
    const blob = await response.blob();

    const path = PROFILE_PIC_PATH(auth.currentUser.uid);
    const ref = storageRef(storage, path);

    await uploadBytes(ref, blob);
    return getDownloadURL(ref);
}


export async function setAuthUserProfilePhoto(downloadURL: string): Promise<void> {
    const user = auth.currentUser;
    if (!user) {
        throw new Error('No user logged in');
    }
    const userRef = doc(db, "users", user.uid)
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        await updateDoc(userRef, { photoURL: downloadURL });
    }
}


export async function deleteProfileImageAsync(): Promise<void> {
    if (!auth.currentUser) {
        throw new Error('No user logged in');
    }
    const path = PROFILE_PIC_PATH(auth.currentUser.uid);
    const ref = storageRef(storage, path);
    await deleteObject(ref);
}


export async function clearAuthUserProfilePhoto(): Promise<void> {
    if (!auth.currentUser) {
        throw new Error('No user logged in');
    }
    const userRef = doc(db, "users", auth.currentUser.uid)
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists) {
        await updateDoc(userRef, { photoURL: null });
    }
}
