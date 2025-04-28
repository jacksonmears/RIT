import {View, Text, Button, StyleSheet, FlatList, TouchableOpacity} from 'react-native';
import {auth, db} from '@/firebase';
import {Link, useRouter} from "expo-router";
import React, {useEffect, useState} from "react";
import {doc, onSnapshot, getDocs, collection, getDoc } from "firebase/firestore";
import GroupCard from "@/components/GroupCard"; // Import reusable component
import Entypo from '@expo/vector-icons/Entypo';

const Page = () => {
    const user = auth.currentUser;
    const [groups, setGroups] = useState<{ id: string, name: string}[] | null>(null);
    const router = useRouter();


    useEffect(() => {
        getGroups()
    }, []);

    const getGroups = async () => {
        if (user) {
            const getGroups = async () => {
                const querySnapshot = await getDocs(collection(db, "users", user?.uid, "groups"));
                const groupList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id, // Firestore document ID
                        name: data.name || "Unnamed Group", // Ensure a default value
                    };
                });
                setGroups(groupList);
            };
            getGroups();
        }
    };

    const refresh = () => {
        setGroups([]);
        getGroups();
    }

    // useEffect(() => {
    //     console.log(groups);
    // }, [groups]);

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.backArrowName}>
                    {/*<TouchableOpacity onPress={() => router.back()}>*/}
                    {/*    <MaterialIcons name="arrow-back-ios-new" size={18} color="#D3D3FF" />*/}
                    {/*</TouchableOpacity>*/}
                    <Text style={styles.topBarText}>{user?.displayName}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/groups/groupCreate')}>
                    {/*<Text style={styles.topBarText}>Create</Text>*/}
                    <Entypo name="add-to-list" size={24} color="#D3D3FF" />
                </TouchableOpacity>
            </View>

            {/*<TouchableOpacity style={styles.refreshButton} onPress={refresh}>*/}
            {/*    <Text style={styles.text}>refresh</Text>*/}
            {/*</TouchableOpacity>*/}

            {/*<Text style={styles.header}>Group Page!</Text>*/}

            <FlatList
                style={styles.groups}
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <GroupCard group={item} />}

                contentContainerStyle={styles.listContent} // Adds padding
            />
        </View>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        color: "#D3D3FF",
        textAlign: "center",
        marginBottom: 10, // Space before FlatList
    },
    groups: {
        flex: 1, // Allows FlatList to take up remaining space
    },
    listContent: {
        paddingBottom: 80, // Prevents overlap with "Create Group" button
        paddingTop: 80,
        paddingHorizontal: 20,

    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#D3D3FF",
    },
    add: {
        position: "absolute",
        bottom: 70,
        right: 20,
        backgroundColor: "#444",
        padding: 10,
        borderRadius: 8,
    },
    join: {
        position: "absolute",
        bottom: 70,
        left: 20,
        backgroundColor: "#444",
        padding: 10,
        borderRadius: 8,
    },
    refreshButton: {
        position: "absolute",
        top: 0,
        left: 10,
        backgroundColor: "green",
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
    }
});


export default Page;
