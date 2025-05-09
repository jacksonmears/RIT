// src/screens/editPfp.tsx

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Image,
    Button,
    StyleSheet,
    Alert,
    ActivityIndicator,
    TouchableOpacity, Dimensions, TextInput,
} from 'react-native';
import { auth, db } from '@/firebase';
import { doc, getDoc, deleteDoc,setDoc, updateDoc } from 'firebase/firestore';
import {useLocalSearchParams, useRouter} from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {updateProfile} from "firebase/auth";


export default function EditProfileScreen() {
    const user = auth.currentUser!;
    const router = useRouter();
    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;
    const { changingVisual, changingFirebase, inpuT } = useLocalSearchParams()
    const input = String(inpuT)
    const [change, setChange] = useState<string>(input as string);

    const handleSubmit = async () => {
        if (change === input) {
            console.log("nothing changed");
            return;
        }
        else if (changingFirebase === "displayName"){
            const ref = await getDoc(doc(db, "displayName", change));
            if (!ref.exists()) {
                await deleteDoc(doc(db, "displayName", input));
                await setDoc(doc(db, "displayName", change), {
                    uid: user.uid,
                    displayName: change,
                    lowerDisplayName: change.toLowerCase()
                });
                await updateProfile(user, {displayName: change});
                await updateDoc(doc(db, "users", user.uid), {
                    [changingFirebase as string]: change
                })
            } else {
                console.log("username already exists");
                return;
            }
        }

        else {
            await updateDoc(doc(db, "users", user.uid), {
                [changingFirebase as string]: change
            })
        }

        console.log("done")
        router.back();
    }

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back-ios-new" size={18} color="#D3D3FF" />
                </TouchableOpacity>
                <Text style={styles.topBarText}>Edit {changingVisual}</Text>
                {change.length === 0 ?
                    <Text style={styles.doneTextBad}>Done</Text>
                    :
                    <TouchableOpacity onPress={() => handleSubmit()}>
                        <Text style={styles.doneTextGood}>Done</Text>
                    </TouchableOpacity>
                }

            </View>

            <View style={styles.inputBar}>
                <Text style={styles.test}>{changingVisual}</Text>
                <TextInput
                    maxLength={30}
                    style={styles.firstName}
                    value={change}
                    onChangeText={setChange}
                    autoCapitalize="none"
                    keyboardType="default"
                    placeholderTextColor="#D3D3FF"
                />
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    test: {
        color: 'white',
        marginLeft: 20,
        marginTop: 5,
        fontSize: 10
    },
    topBar: {
        flexDirection: 'row',
        paddingHorizontal: 15,
        padding: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "grey",
        justifyContent: 'space-between',
    },
    topBarText: {
        color: "#D3D3FF",
    },
    inputBar: {
        margin: 20,
        borderWidth: 2,
        borderColor: "#D3D3FF",
        borderRadius: 10,
    },
    firstName: {
        marginTop: 4,
        marginBottom: 10,
        marginLeft: 19,
        borderWidth: 1,
        borderRadius: 4,
        // backgroundColor: "white",
        color: "#D3D3FF",
    },
    doneTextGood: {
        color: "#D3D3FF",
    },
    doneTextBad: {
        color: "grey"
    }
    // firstName: {
    //     height: 40,
    //     paddingHorizontal: 10,
    //     color: "#D3D3FF",
    //     borderColor: "#D3D3FF",
    //     borderWidth: 1,
    //     borderRadius: 5,
    //     backgroundColor: "#1a1a1a",  // Dark background to contrast black
    //     margin: 10,
    // }
});
