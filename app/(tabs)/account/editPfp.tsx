import React, {useState} from 'react';
import {
    View,
    Text,
    Image,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Dimensions, TouchableOpacity,
} from 'react-native';
import {auth} from '@/firebase';
import {
    pickImageAsync,
    uploadProfileImageAsync,
    setAuthUserProfilePhoto,
    deleteProfileImageAsync,
    clearAuthUserProfilePhoto,
} from '@/firebaseUtils';
import Feather from "@expo/vector-icons/Feather";
import {useLocalSearchParams, useRouter} from "expo-router";
import firestore from "@react-native-firebase/firestore";

const {width, height} = Dimensions.get('window');

export default function Page() {
    const user = auth().currentUser!;
    const [localPfp, setLocalPfp] = useState<string | null>(null);
    const [pfpLoadingState, setPfpLoadingState] = useState(false);
    const { photoURL } = useLocalSearchParams()
    const router = useRouter();


    const handlePick = async () => {
        try {
            return await pickImageAsync();
        } catch (err: any) {
            Alert.alert('Error', err.message);
        }
    };

    const handleUpload = async (newPfp : string) => {
        setPfpLoadingState(true);
        try {
            setLocalPfp(newPfp);
            const downloadURL = await uploadProfileImageAsync(newPfp);
            await setAuthUserProfilePhoto(downloadURL);
            Alert.alert('Success', 'Your profile picture was updated.');
        } catch (err: any) {
            Alert.alert('Upload failed', err.message);
        } finally {
            setPfpLoadingState(false);
        }
    };

    const handleSave = async () => {
        try {
            const newPfp = await handlePick();
            if (!newPfp) return;
            await handleUpload(newPfp);
        } catch (error) {
            console.error(error);
        }

    }



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
                        setPfpLoadingState(true);
                        try {
                            await deleteProfileImageAsync();
                            await clearAuthUserProfilePhoto();
                            await firestore()
                                .collection("users")
                                .doc(user.uid)
                                .update({
                                    photoURL: "",
                                })

                            setLocalPfp(null);
                            Alert.alert('Deleted', 'Profile picture removed.');

                        } catch (err: any) {
                            Alert.alert('Delete failed', err.message);
                        } finally {
                            setPfpLoadingState(false);
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Feather name="x" size={height/40} color="#D3D3FF" />
                </TouchableOpacity>
                <Text style={styles.displayName}>
                    {user.displayName}
                </Text>
            </View>


        <View style={{alignItems: "center"}}>
            <View style={styles.avatarContainer}>
                {pfpLoadingState ? (
                    <ActivityIndicator size="large" color="gold" />
                ) : localPfp ? (
                    <Image source={{ uri: localPfp }} style={styles.avatar} />
                ) : photoURL ? (
                    <Image source={{uri: String(photoURL)}} style={styles.avatar}/>
                ) : (
                    <View style={[styles.avatar, styles.placeholder]}>
                        <Text style={styles.placeholderText}>No Photo</Text>
                    </View>
                )}

            </View>

            <TouchableOpacity onPress={handleSave} style={styles.newPicButton}>
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
        paddingHorizontal: width / 20,
        borderBottomWidth: height / 1000,
        borderBottomColor: 'grey',
        alignItems: 'center',
        height: height / 18,
    },
    displayName: {
        color: '#D3D3FF',
        fontSize: height / 50
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

