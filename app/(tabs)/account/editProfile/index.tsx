import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { auth, db } from '@/firebase';
import { useRouter } from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import {useIsFocused} from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

export default function Page(){
    const user = auth().currentUser!;
    const router = useRouter();
    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [bio, setBio] = useState<string>('');
    const isFocused = useIsFocused();

    useEffect(() => {
        if (isFocused) {
            getUserInfo().catch((err) => {
                console.error(err);
            })
        }
    }, [isFocused]);

    const getUserInfo = async () => {
        if (!user) return;
        const ref = await db().collection('users').doc(user.uid).get();
        if (!ref.exists) return;

        const data = ref.data();
        if (!data) return;
        try {
            setFirstName(data.firstName);
            setLastName(data.lastName);
            setUsername(data.displayName);
            setBio(data.bio || "Empty Bio");
        } catch (e) {
            console.error(e);
        }
    }



    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.backArrowName}>
                    <TouchableOpacity onPress={() => router.push('/account')}>
                        <MaterialIcons name="arrow-back-ios-new" size={18} color="#D3D3FF" />
                    </TouchableOpacity>
                    <Text style={[styles.topBarText, {left: width/3}]}>Edit Profile</Text>
                </View>
            </View>
            <View style={styles.variablesToChange}>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/nameChange', params: {changingVisual: 'First Name', changingFirebase: 'firstName', rawInput: firstName}})}>
                    <Text style={styles.textTitle}>First Name</Text>

                    <Text style={styles.textVariable}>{firstName}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/nameChange', params: {changingVisual: 'Last Name', changingFirebase: 'lastName', rawInput: lastName}})}>
                    <Text style={styles.textTitle}>Last Name</Text>
                    <Text style={styles.textVariable}>{lastName}</Text>

                </TouchableOpacity>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/nameChange', params: {changingVisual: 'Username', changingFirebase: 'displayName', rawInput: username}})}>
                    <Text style={styles.textTitle}>Username</Text>
                    <Text style={styles.textVariable}>{username}</Text>

                </TouchableOpacity>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/bioChange', params: {changingVisual: 'Bio', changingFirebase: 'bio', rawInput: bio}})}>
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
        paddingHorizontal: width/20,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height/20
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
        width: width/6,
        marginLeft: width/20
    },
    textContainer: {
        paddingVertical: height/75,
        flexDirection: 'row',
    },

    textVariable: {
        color: 'white',
        marginLeft: width/10,
        borderBottomColor: "#D3D3FF",
        borderBottomWidth: height/1000,
        width: width*0.6,
        marginRight: width/50
    }

});
