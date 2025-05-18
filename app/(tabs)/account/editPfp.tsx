import React, {useState, useEffect, use} from 'react';
import {
    View,
    Text,
    Image,
    Button,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Dimensions, TouchableOpacity,
} from 'react-native';
import {auth, db} from '@/firebase';
import {
    pickImageAsync,
    uploadProfileImageAsync,
    setAuthUserProfilePhoto,
    deleteProfileImageAsync,
    clearAuthUserProfilePhoto,
} from '@/firebaseUtils';
import Feather from "@expo/vector-icons/Feather";
import {useLocalSearchParams, useRouter} from "expo-router";

const {width, height} = Dimensions.get('window');

export default function Page() {
    const user = auth().currentUser!;
    const [localUri, setLocalUri] = useState<string | null>(null);
    const [photoURL, setPhotoURL] = useState<string | null>(user.photoURL);
    const [loading, setLoading] = useState(false);
    const { rawName, rawPhotoURL } = useLocalSearchParams()
    const name = String(rawName)
    const router = useRouter();


    const handlePick = async () => {
        try {
            const uri = await pickImageAsync();
            if (uri) setLocalUri(uri);
            handleUpload().catch(() => {
                // console.error(err);
            })
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
                            await db().collection("users").doc(user.uid).update({
                                photoURL: "",
                            })
                            // await storage.ref('photos').set(photoURL);
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
            <View style={styles.topBar}>
                <View style={{flexDirection: "row", alignItems: "center"}}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="x" size={height/50} color="#D3D3FF" />
                    </TouchableOpacity>
                    <Text style={{color: "#D3D3FF"}}>{user.displayName}</Text>
                </View>
            </View>


            {/*<Text style={styles.name}>{name}</Text>*/}
        <View style={{alignItems: "center"}}>
            <View style={styles.avatarContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="gold" />
                ) : localUri ? (
                    <Image source={{ uri: localUri }} style={styles.avatar} />
                ) : rawPhotoURL ? (
                    <Image source={{uri: String(rawPhotoURL)}} style={styles.avatar}/>
                ) : (
                    <View style={[styles.avatar, styles.placeholder]}>
                        <Text style={styles.placeholderText}>No Photo</Text>
                    </View>
                )}

            </View>

            <TouchableOpacity onPress={handlePick} style={styles.newPicButton}>
                <Text>Choose New Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
                <Text style={{color: "white"}}>Delete pfp</Text>
            </TouchableOpacity>

        </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width/20,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height/20
    },
    name: {
        color: 'gold',
        fontSize: height/33,
        marginBottom: height/25,
        marginTop: height/33,
        textAlign: 'center'
    },
    avatarContainer: {
        alignItems: 'center',
        marginBottom: height/20,
        marginTop: height/10
    },
    avatar: {
        width: width/2,
        height: width/2,
        borderRadius: 999,
    },
    placeholder: {
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: 'white',
    },
    newPicButton: {
        backgroundColor: "#D3D3FF",
        alignItems: 'center',
        height: height/25,
        width: width*0.66,
        marginBottom: height/25,
        justifyContent: 'center',
    },
    deleteButton: {
        borderColor: "#D3D3FF",
        alignItems: 'center',
        height: height/25,
        width: width*0.66,
        justifyContent: 'center',
        borderWidth: width/100,
    }

});

// export default Page;
