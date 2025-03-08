import {Text, View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, TextInput, ActivityIndicator, Button, Pressable} from "react-native";
import { useState, useEffect } from "react";
import {auth, db} from '@/firebase';
import {createUserWithEmailAndPassword, updateProfile, validatePassword} from "@firebase/auth";
import { FirebaseError } from "@firebase/util";
import { Link, useRouter } from "expo-router";
import {doc, getDoc, deleteDoc, setDoc } from "firebase/firestore";

const Page = () => {
    const [newDisplayName, setNewDisplayName] = useState("");
    const user = auth.currentUser;
    const router = useRouter();


    useEffect(() => {
        console.log(user?.displayName);
        const checking = async() => {
            if (!user?.displayName) return;
            try {
                const docRef = doc(db, "displayName", user?.displayName);
                const docSnap = await getDoc(docRef);

                if (user?.displayName && docSnap.exists() && docSnap.data()?.uid === user.uid){
                    router.push('/home');
                }
            }
            catch (error) {
                console.error('Error updating profile', error);
            }
        }
        checking();

    }, [user])



    const handleUpdateDisplayName = async () => {
        try {
            if (user) {
                const docRef = doc(db, "displayName", newDisplayName);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    console.log("Display name is already taken.");
                    return;
                }
                if (user?.displayName) {
                    const oldDisplayNameRef = doc(db, "displayName", user?.displayName);
                    await deleteDoc(oldDisplayNameRef);
                }

                await updateProfile(user, { displayName: newDisplayName });
                await setDoc(docRef, { uid: user.uid });
                await user.reload()

                console.log('Profile updated successfully');
            } else {
                console.error('No user is logged in');
            }
        } catch (error) {
            console.error('Error updating profile', error);
        }
    };




    return (

        <View style={styles.container}>
            <Text style={styles.t}> Hello !</Text>

            {/*<TextInput*/}
            {/*    style={styles.input}*/}
            {/*    value={newDisplayName}*/}
            {/*    onChangeText={handleUpdateDisplayName}*/}
            {/*    autoCapitalize="none"*/}
            {/*    keyboardType="default"*/}
            {/*    placeholder="username"*/}
            {/*/>*/}
            <TextInput
                style={styles.input}
                placeholder="New Display Name"
                placeholderTextColor="#ccc"
                value={newDisplayName}
                onChangeText={setNewDisplayName} // Updates state
            />
            <Pressable onPress={handleUpdateDisplayName} style={styles.button}>
                <Text>Update Display Name</Text>
            </Pressable>

        </View>

    )
};


const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    t: {
        color: "white",
    },
    input: {
        marginVertical: 4,
        marginHorizontal: 40,
        borderWidth: 1,
        borderRadius: 4,
        padding: 20,
        backgroundColor: "white",
        fontSize: 30,
    },
    button: {
        marginVertical: 4,
        marginHorizontal: 40,
        position: "absolute",
        backgroundColor: "white",
        borderRadius: 4,
        top: 50,
        left: 50,
    }
})

export default Page;
