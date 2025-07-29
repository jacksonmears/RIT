import React, {useState, useEffect, useCallback} from 'react';
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


    const fetchUserInfo = useCallback(async () => {
        if (!user) return;

        const documentReference = await db
            .collection('users')
            .doc(user.uid)
            .get();
        if (!documentReference.exists) return;

        const documentData = documentReference.data();
        if (!documentData) return;

        try {
            setFirstName(documentData.firstName);
            setLastName(documentData.lastName);
            setUsername(documentData.displayName);
            setBio(documentData.bio || "Empty Bio");
        } catch (e) {
            console.error(e);
        }
    }, [user]);

    useEffect(() => {
        if (isFocused) {
            fetchUserInfo().catch((err) => {
                console.error(err);
            })
        }
    }, [isFocused, fetchUserInfo]);

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.push('/account')}>
                    <MaterialIcons name="arrow-back-ios-new" size={height/40} color="#D3D3FF" />
                </TouchableOpacity>

                <View style={styles.editProfileTextContainer}>
                    <Text style={styles.editProfileText}>Edit Profile</Text>
                </View>
            </View>

            <View>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/profileChanges', params: {changeType: 'First Name', firebaseID: 'firstName', currentUserInformation: firstName}})}>
                    <Text style={styles.textTitle}>First Name</Text>
                    <Text style={styles.textVariable}>{firstName}</Text>

                </TouchableOpacity>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/profileChanges', params: {changeType: 'Last Name', firebaseID: 'lastName', currentUserInformation: lastName}})}>
                    <Text style={styles.textTitle}>Last Name</Text>
                    <Text style={styles.textVariable}>{lastName}</Text>

                </TouchableOpacity>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/profileChanges', params: {changeType: 'Username', firebaseID: 'displayName', currentUserInformation: username}})}>
                    <Text style={styles.textTitle}>Username</Text>
                    <Text style={styles.textVariable}>{username}</Text>

                </TouchableOpacity>
                <TouchableOpacity style={styles.textContainer} onPress={() => router.push({pathname: '/account/editProfile/profileChanges', params: {changeType: 'Bio', firebaseID: 'bio', currentUserInformation: bio}})}>
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
    topBar: {
        flexDirection: 'row',
        paddingHorizontal: width/20,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height/18
    },
    editProfileText: {
        color: "#D3D3FF",
        fontSize: height/50,
        position: 'absolute',
    },
    editProfileTextContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    backArrowName: {
        flexDirection: 'row',
        alignItems: "center",
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
