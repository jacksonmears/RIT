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
import { doc, getDoc } from 'firebase/firestore'
import { useRouter } from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {useIsFocused} from "@react-navigation/native";


export default function EditProfileScreen() {
    const user = auth.currentUser!;
    const router = useRouter();
    const screenHeight = Dimensions.get('window').height;
    const screenWidth = Dimensions.get('window').width;
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [bio, setBio] = useState<string>('');
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            getUserInfo()
        }
    }, [isFocused]);

    const getUserInfo = async () => {
        if (!user) return;
        const ref = await getDoc(doc(db, "users", user?.uid));
        if (ref.exists()){
            setFirstName(ref.data().firstName);
            setLastName(ref.data().lastName);
            setUsername(ref.data().displayName);
            setBio(ref.data().bio || "Empty Bio");
        }
    }
    //
    // useEffect(() => {
    //
    //     getUserInfo();
    // }, []);


    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.backArrowName}>
                    <TouchableOpacity onPress={() => router.push('/account')}>
                        <MaterialIcons name="arrow-back-ios-new" size={18} color="#D3D3FF" />
                    </TouchableOpacity>
                    <Text style={[styles.topBarText, {left: screenWidth/3}]}>Edit Profile</Text>
                </View>
            </View>
            <View style={styles.variablesToChange}>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/nameChange', params: {changingVisual: 'First Name', changingFirebase: 'firstName', inpuT: firstName}})}>
                    <Text style={styles.textTitle}>First Name</Text>

                    <Text style={styles.textVariable}>{firstName}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/nameChange', params: {changingVisual: 'Last Name', changingFirebase: 'lastName', inpuT: lastName}})}>
                    <Text style={styles.textTitle}>Last Name</Text>
                    <Text style={styles.textVariable}>{lastName}</Text>

                </TouchableOpacity>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/nameChange', params: {changingVisual: 'Username', changingFirebase: 'displayName', inpuT: username}})}>
                    <Text style={styles.textTitle}>Username</Text>
                    <Text style={styles.textVariable}>{username}</Text>

                </TouchableOpacity>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/bioChange', params: {changingVisual: 'Bio', changingFirebase: 'bio', inpuT: bio}})}>
                    <Text style={styles.textTitle}>Bio</Text>
                    <Text style={styles.textVariable}>{bio}</Text>

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
    test: {
        color: 'white',
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
    variablesToChange: {

    },
    textTitle: {
        color: 'white',
        width: 70,
        marginLeft: 20
    },
    textContainer: {
        paddingVertical: 15,
        flexDirection: 'row',
    },

    textVariable: {
        color: 'white',
        marginLeft: 50,
        borderBottomColor: "#D3D3FF",
        borderBottomWidth: 0.5,
        width: '60%',
        marginRight: 10
    }

});
