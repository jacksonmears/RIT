import {
    View,
    Text,
    Button,
    StyleSheet,
    FlatList,
    Touchable,
    TouchableOpacity,
    TextInput,
    Pressable
} from "react-native";
import {Link, useLocalSearchParams, useRouter} from "expo-router";
import React, { useEffect, useState } from "react";
import {doc, getDoc, getDocs, updateDoc, arrayUnion, collection, setDoc} from "firebase/firestore";
import { auth, db } from "@/firebase";
import GroupCard from "@/components/GroupCard";
import groupID from "@/app/(tabs)/groups/[groupID]/index";
import groups from "@/app/(tabs)/groups";

const Index = () => {
    const { groupID } = useLocalSearchParams();
    const router = useRouter();
    const user = auth.currentUser;
    const [search, setSearch] = useState('');
    const [found, setFound] = useState('');

    const handleSearch = async () => {
        setFound('');
        if (search == user?.displayName || !user) return;
        else {
            const docRef = doc(db, "displayName", search);
            const docSnap = await getDoc(docRef);
            docSnap.exists() ? setFound(docSnap.data().uid) : setFound('');
            const xxx = doc(db, "users", user.uid, "friends", found);
            const yyy = await getDoc(xxx);
            if (yyy.exists()) {
                console.log('friend found');
            } else {
                console.log('no friend found')
            }
        }
    }



    const sendRequest = async () => {
        if (user){
            console.log("attempting");
            const docRef = doc(db, "users", found);
            const docSnap = await getDoc(docRef);
            const groupRequests = docSnap.data()?.groupRequests || [];

            if (groupRequests.includes(groupID)){
                console.log("Group request already sent!");
                return;
            }

            if (docSnap.exists()) {
                await setDoc(docRef, { groupRequests: [...groupRequests, groupID] }, { merge: true });
                console.log("Group request sent!");
            } else {
                await setDoc(docRef, { groupRequests: [groupID] });
                console.log("Group request sent!");
            }
        }
    }


    return (
        <View style={styles.container}>
            <Text style={styles.text}>{groupID}</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.text}>go back</Text>
            </TouchableOpacity>

            <TextInput
                style={styles.input}
                placeholder="friends name"
                placeholderTextColor="#ccc"
                value={search}
                onChangeText={setSearch}
            />
            <Pressable onPress={handleSearch} style={styles.button}>
                <Text> Search for friends </Text>
            </Pressable>

            <Pressable onPress={sendRequest} style={styles.reqButton}>
                <Text> add {found} </Text>
            </Pressable>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
        padding: 20,
        alignItems: "center",
        justifyContent: "center",
    },
    button: {
        marginVertical: 4,
        marginHorizontal: 40,
        position: "absolute",
        backgroundColor: "white",
        borderRadius: 4,
        top: 50,
        left: 50,
    },
    reqButton: {
        marginVertical: 4,
        marginHorizontal: 40,
        position: "absolute",
        backgroundColor: "white",
        borderRadius: 4,
        top: 500,
        left: 50,
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
    text: {
        color: "white",
    },
    backButton: {
        position: "absolute",
        top: 0,
        right: 10,
        backgroundColor: "green",
    }
});

export default Index;
