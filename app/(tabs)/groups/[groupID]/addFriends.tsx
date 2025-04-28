import {
    View,
    Text,
    Button,
    StyleSheet,
    FlatList,
    Touchable,
    TouchableOpacity,
    TextInput,
    Pressable, Image
} from "react-native";
import {Link, useLocalSearchParams, useRouter} from "expo-router";
import React, { useEffect, useState } from "react";
import {doc, getDoc, getDocs, updateDoc, arrayUnion, collection, setDoc} from "firebase/firestore";
import { auth, db } from "@/firebase";
import GroupCard from "@/components/GroupCard";
import groupID from "@/app/(tabs)/groups/[groupID]/index";
import groups from "@/app/(tabs)/groups";
import {Checkbox} from "react-native-paper";
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

const Index = () => {
    const { groupID, groupName } = useLocalSearchParams();
    const groupIDString = String(groupID);
    const groupNameString = String(groupName);
    const router = useRouter();
    const user = auth.currentUser;
    const [friendsID, setFriendsID] = useState<string[] | null>([]);
    const [friends, setFriends] = useState<{ id: string, displayName: string, photoURL: string }[] | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<Map<string, boolean> | null>(new Map());

    useEffect(() => {
        const fetchFriendIds = async () => {
            if (!user) return;

            const friendSnap = await getDocs(collection(db, "users", user.uid, "friends"));
            let friendIds: string[] = [];
            friendSnap.forEach((doc) => {
                friendIds.push(doc.id);
            });
            setFriendsID(friendIds);
        }
        fetchFriendIds();
    }, []);

    useEffect(() => {
        fetchFriends();
    }, [friendsID]);


    const fetchFriends = async () => {
        if (!user || !friendsID || friendsID.length === 0) return;

        try {
            const friendUsernames: { id: string, displayName: string, photoURL: string}[] = [];
            for (const id of friendsID) {
                const docSnap = await getDoc(doc(db, "users", id));
                const friendsRef = await getDoc(doc(db, "groups", groupIDString, "users", id));
                if (friendsRef.exists() || docSnap.exists() && docSnap.data().groupRequests.includes(groupIDString)){

                }
                else {
                    if (docSnap.exists()) friendUsernames.push({id: id, displayName: docSnap.data().displayName, photoURL: docSnap.data().photoURL});
                }
            }
            setFriends(friendUsernames);
        } catch (error) {
            console.error("Error fetching friends' data:", error);
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedGroups((prev) => {
            const next = new Map(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.set(id, true);
            }
            return next;
        });
    };

    const dealDone = async (selectedGroups: Map<string, boolean> | null) => {
        if (!selectedGroups) return;
        const selectedIds = [...selectedGroups.keys()];

        // Send requests in parallel
        await Promise.all(selectedIds.map(id => sendRequest(id)));

        setFriends((prev) => prev ? prev.filter(friend => !selectedIds.includes(friend.id)) : null);

        setSelectedGroups(null);
        router.back()
    };





    const sendRequest = async (friend: string) => {
        if (user){
            console.log("attempting");
            const docRef = doc(db, "users", friend);
            const docSnap = await getDoc(docRef);
            const groupRequests = docSnap.data()?.groupRequests || [];

            if (groupRequests.includes(friend)){
                console.log("Group request already sent!");
                return;
            }

            if (docSnap.exists()) {
                await setDoc(docRef, { groupRequests: [...groupRequests, groupIDString] }, { merge: true });
                console.log("friend request sent!");
            } else {
                await setDoc(docRef, { groupRequests: [groupIDString] });
                console.log("friend request sent!");
            }
        }
    }


    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.backArrowName}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="x" size={20} color="#D3D3FF" />
                    </TouchableOpacity>
                    <Text style={styles.topBarText}>{groupNameString}</Text>
                </View>
                    {(selectedGroups?.size)==0 ?
                        <Ionicons name="send-outline" size={20} color="#D3D3FF" />
                        :
                        <TouchableOpacity onPress={() => dealDone(selectedGroups)}>
                            <Ionicons name="send" size={20} color="#D3D3FF" />
                        </TouchableOpacity>
                    }

            </View>

            {/*<Text style={styles.text}>{groupIDString}</Text>*/}
            {/*<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>*/}
            {/*    <Text style={styles.text}>go back</Text>*/}
            {/*</TouchableOpacity>*/}


            <FlatList
                style={styles.groups}
                data={friends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.groupContainer}>
                        <Pressable onPress={() => toggleSelection(item.id)} style={styles.groupRow}>
                            <View style={styles.backArrowName}>
                                <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                                <Text style={styles.text}>{item.displayName}</Text>
                            </View>

                            <Checkbox
                                status={selectedGroups?.get(item.id) ? "checked" : "unchecked"}
                                onPress={() => toggleSelection(item.id)}
                            />
                        </Pressable>
                    </View>
                )}
                contentContainerStyle={styles.listContent} // Adds padding
                ListEmptyComponent={<Text style={styles.noResults}>You added all your friends!</Text>}

            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
        // alignItems: "center",
        // justifyContent: "center",
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
    },
    groups: {
        flex: 1, // Allows FlatList to take up remaining space
    },
    groupContainer: {
        // alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 40,

    },
    groupRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 1,
        justifyContent: "space-between",
    },
    listContent: {
        paddingBottom: 80, // Prevents overlap with "Create Group" button
    },
    doneButton: {
        position: "absolute",
        top: 0,
        left: 10,
        backgroundColor: "green",
    },
    noResults: {
        fontSize: 16,
        color: 'gray',
        textAlign: 'center',
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
    avatar: {
        width: 25,
        height: 25,
        borderRadius: 20,
        marginRight: 10,
        // backgroundColor: '#ccc',
    },
});

export default Index;
