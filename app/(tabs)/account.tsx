import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, TextInput } from 'react-native';
import { auth } from '@/firebase';
import { updateProfile } from '@firebase/auth';
import { Dimensions }  from 'react-native';
import {getDownloadURL, getStorage, ref, uploadBytes} from "@firebase/storage";
const {width, height} = Dimensions.get('window');
import * as ImagePicker from 'expo-image-picker';

const Page = () => {
    const [newDisplayName, setNewDisplayName] = useState('');
    const [newPhotoURL, setNewPhotoURL] = useState(''); // Added newPhotoURL state
    const [profilePic, setProfilePic] = useState(null);

    const uploadImageToStorage = async (imageFile: any, userId: string) => {
        const storage = getStorage();
        const storageRef = ref(storage, 'profilePics/' + userId); // Create a reference

        // Upload the file
        await uploadBytes(storageRef, imageFile);

        // Get download URL
        const url = await getDownloadURL(storageRef);

        return url;
    }

    const handleUpdateDisplayName = async () => {
        try {
            if (auth.currentUser) {
                await updateProfile(auth.currentUser, { displayName: newDisplayName });
                console.log('Profile updated successfully');
            } else {
                console.error('No user is logged in');
            }
        } catch (error) {
            console.error('Error updating profile', error);
        }
    };




    const handleUpdatePhotoURl = async () => {

        if (auth.currentUser) {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images', 'videos'],
                allowsEditing: true,
                aspect: [4, 3],
                quality: 1,
            })
            console.log(result);

        }


        // try {
        //     if (auth.currentUser) {
        //         const photoURL = await uploadImageToStorage(profilePic, auth.currentUser.uid);
        //         await updateProfile(auth.currentUser, { photoURL: photoURL });
        //         console.log('Profile URL updated successfully');
        //     } else {
        //         console.error('No user is logged in');
        //     }
        // } catch (error) {
        //     console.error('Error updating profile', error);
        // }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.t}>Account Page!</Text>
            <Text style={styles.t}>{auth.currentUser?.email}</Text>
            <Text style={styles.t}>{auth.currentUser?.phoneNumber}</Text>
            <Text style={styles.t}>{auth.currentUser?.displayName}</Text>
            <Text style={styles.t}>{auth.currentUser?.photoURL}</Text>

            <View style={styles.nameChange}>
                <TextInput
                    style={styles.t}
                    value={newDisplayName}
                    onChangeText={setNewDisplayName}
                    placeholder="New Username"
                    placeholderTextColor="gray"
                />
                <Button title="Update Display Name" onPress={handleUpdateDisplayName} />
            </View>

            <View style={styles.photoChange}>
                {/*<TextInput*/}
                {/*    style={styles.t}*/}
                {/*    value={profilePic}*/}
                {/*    onChangeText={setProfilePic}*/}
                {/*    placeholder="https://example.com/photo.jpg"*/}
                {/*    placeholderTextColor="gray"*/}
                {/*/>*/}
                <Button title="Update Photo" onPress={handleUpdatePhotoURl} />
            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'black',
        flex: 1,
        padding: 20,
    },
    t: {
        color: 'white',
        marginBottom: 10,
    },
    nameChange: {
        position: 'absolute',
        top: height/2.2,
        left: width/4,
    },
    photoChange: {
        position: 'absolute',
        top: height/1.5,
        left: width/4,
    }
});

export default Page;
