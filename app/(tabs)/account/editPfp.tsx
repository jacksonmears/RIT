import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    Button,
    StyleSheet,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { auth } from '@/firebase';
import {
    pickImageAsync,
    uploadProfileImageAsync,
    setAuthUserProfilePhoto,
    deleteProfileImageAsync,
    clearAuthUserProfilePhoto,
} from '@/firebaseUtils';

export default function Page() {
    const user = auth().currentUser!;
    const [localUri, setLocalUri] = useState<string | null>(null);
    const [photoURL, setPhotoURL] = useState<string | null>(user.photoURL);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setPhotoURL(user.photoURL ?? null);
    }, [user.photoURL]);

    const handlePick = async () => {
        try {
            const uri = await pickImageAsync();
            if (uri) setLocalUri(uri);
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    const handleUpload = async () => {
        if (!localUri) return;
        setLoading(true);
        try {
            // upload to Storage → get download URL
            const downloadURL = await uploadProfileImageAsync(localUri);
            // set it on the Auth user
            await setAuthUserProfilePhoto(downloadURL);
            setPhotoURL(downloadURL);
            setLocalUri(null);
            Alert.alert('Success', 'Your profile picture was updated.');
        } catch (err: any) {
            Alert.alert('Upload failed', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Confirm delete',
            'Are you sure you want to remove your profile picture?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await deleteProfileImageAsync();
                            await clearAuthUserProfilePhoto();
                            setPhotoURL(null);
                            Alert.alert('Deleted', 'Profile picture removed.');
                        } catch (err: any) {
                            Alert.alert('Delete failed', err.message);
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Edit Profile</Text>

            <View style={styles.avatarContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="gold" />
                ) : localUri ? (
                    <Image source={{ uri: localUri }} style={styles.avatar} />
                ) : photoURL ? (
                    <Image source={{ uri: photoURL }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.placeholder]}>
                        <Text style={styles.placeholderText}>No Photo</Text>
                    </View>
                )}
            </View>

            <View style={styles.buttons}>
                <Button title="Choose New Photo" onPress={handlePick} />
                <Button
                    title="Save as Profile Photo"
                    onPress={handleUpload}
                    disabled={!localUri || loading}
                />
                <Button
                    title="Remove Photo"
                    onPress={handleDelete}
                    disabled={!photoURL || loading}
                    color="red"
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black', padding: 20 },
    header: { color: 'gold', fontSize: 24, marginBottom: 20, textAlign: 'center' },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    placeholder: {
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: 'white',
    },
    buttons: {
        height: 140,
        justifyContent: 'space-around',
    },
});

// export default Page;
