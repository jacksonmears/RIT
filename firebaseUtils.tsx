// src/firebase/firebaseUtils.ts
import { auth, storage, db } from './firebase';
import * as ImagePicker from 'expo-image-picker';

const PROFILE_PIC_PATH = (uid: string): string => `profilePictures/${uid}.jpg`;

export async function pickImageAsync(): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
        throw new Error('Gallery permission denied');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
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
    const user = auth().currentUser;

    if (!user) {
        throw new Error('No user logged in');
    }

    const response = await fetch(localUri);
    const blob = await response.blob();

    const path = PROFILE_PIC_PATH(user.uid);
    const ref = storage().ref(path);

    await ref.put(blob);

    const downloadURL = await ref.getDownloadURL();
    return downloadURL;
}

export async function setAuthUserProfilePhoto(downloadURL: string): Promise<void> {
    const user = auth().currentUser;

    if (!user) {
        throw new Error('No user logged in');
    }

    const userRef = db().collection('users').doc(user.uid);
    const userSnap = await userRef.get();

    if (userSnap.exists()) {
        await userRef.update({ photoURL: downloadURL });
    }
}

export async function deleteProfileImageAsync(): Promise<void> {
    const user = auth().currentUser;
    if (!user) {
        throw new Error('No user logged in');
    }

    const path = PROFILE_PIC_PATH(user.uid);
    const ref = storage().ref(path);

    await ref.delete();
}

export async function clearAuthUserProfilePhoto(): Promise<void> {
    const user = auth().currentUser;
    if (!user) {
        throw new Error('No user logged in');
    }

    const userRef = db().collection('users').doc(user.uid);
    const userSnap = await userRef.get();

    if (userSnap.exists()) {
        await userRef.update({ photoURL: null });
    }
}
