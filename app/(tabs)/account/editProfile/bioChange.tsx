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
import {auth, db} from '@/firebase';
import {useLocalSearchParams, useRouter} from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {deleteDoc, doc, getDoc, setDoc, updateDoc} from "firebase/firestore";
import {updateProfile} from "firebase/auth";


export default function EditProfileScreen() {
    const user = auth.currentUser!;
    const router = useRouter();
    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;
    const { changingVisual, changingFirebase, inpuT } = useLocalSearchParams()
    const input = String(inpuT)
    const [change, setChange] = useState<string>(input as string);
    const [inputHeight, setInputHeight] = useState(40);

    const handleTextChange = (text: string) => {
        // If the last character is a newline, append a zero-width space
        if (text.endsWith('\n')) {
            setChange(text + '\u200B');
        } else {
            setChange(text.replace(/\u200B$/, '')); // clean up if not needed
        }
    };


    const handleSubmit = async () => {
        if (change === input) {
            console.log("nothing changed");
            return;
        }

        await updateDoc(doc(db, "users", user.uid), {
            [changingFirebase as string]: change
        })


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
                    maxLength={256}
                    style={[styles.firstName, { height: Math.max(40, inputHeight) }]}
                    value={change}
                    onChangeText={handleTextChange}
                    onContentSizeChange={(e) =>
                        setInputHeight(e.nativeEvent.contentSize.height)
                    }
                    autoCapitalize="none"
                    keyboardType="default"
                    placeholderTextColor="#D3D3FF"
                    multiline={true}
                    scrollEnabled={false}
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
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        padding: 10,
        borderBottomWidth: 0.5,
        borderBottomColor: "grey",
    },
    topBarText: {
        color: "#D3D3FF",
    },
    backArrowName: {
        flexDirection: 'row',
        alignItems: "center",
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
});
