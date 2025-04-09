import { View, Text, Button, StyleSheet, FlatList } from 'react-native';
import {auth, db} from '@/firebase';
import {Link} from "expo-router";
import React, {useEffect, useState} from "react";
import {doc, onSnapshot, getDocs, collection, getDoc } from "firebase/firestore";
import GroupCard from "@/components/GroupCard"; // Import reusable component

const Page = () => {
    const user = auth.currentUser;
    const [groups, setGroups] = useState<{ id: string, name: string}[] | null>(null);


    useEffect(() => {
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
        console.log(groups);
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Group Page!</Text>

            <FlatList
                style={styles.groups}
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <GroupCard group={item} />}

                contentContainerStyle={styles.listContent} // Adds padding
            />

            <Link href="/(tabs)/groups/groupCreate" style={styles.add}>
                <Text style={styles.text}>Create Group</Text>
            </Link>
            <Link href="/(tabs)/groups/groupJoin" style={styles.join}>
                <Text style={styles.text}>Join Group</Text>
            </Link>
        </View>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
        padding: 20, // Adds spacing around content
    },
    header: {
        fontSize: 24,
        fontWeight: "bold",
        color: "gold",
        textAlign: "center",
        marginBottom: 10, // Space before FlatList
    },
    groups: {
        flex: 1, // Allows FlatList to take up remaining space
    },
    listContent: {
        paddingBottom: 80, // Prevents overlap with "Create Group" button
    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
        color: "gold",
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
    }
});


export default Page;
