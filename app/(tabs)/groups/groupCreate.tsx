import {
    View,
    Text,
    Button,
    StyleSheet,
    Animated,
    TextInput,
    Pressable,
    TouchableOpacity,
    FlatList,
    Image
} from 'react-native';
import React, { useEffect, useState } from "react";
import { db, auth } from "@/firebase"
import {Link, useRouter} from 'expo-router';
import { collection, addDoc, getDoc, doc, getDocs, orderBy, limit, setDoc, serverTimestamp } from 'firebase/firestore';
import {Integer} from "@firebase/webchannel-wrapper/bloom-blob";
import add = Animated.add;
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import {Checkbox} from "react-native-paper";

const Page = () => {
    const [userData, setUserData] = useState<Record<string, any> | null>(null);
    const [groupName, setGroupName] = useState("");
    const user = auth.currentUser;
    const router = useRouter();
    const [selectedGroups, setSelectedGroups] = useState<Map<string, boolean> | null>(new Map());
    const [friendsID, setFriendsID] = useState<string[] | null>([]);
    const [friends, setFriends] = useState<{ id: string, displayName: string, photoURL: string }[] | null>(null);

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
                if (docSnap.exists()) friendUsernames.push({id: id, displayName: docSnap.data().displayName, photoURL: docSnap.data().photoURL});

            }
            setFriends(friendUsernames);
        } catch (error) {
            console.error("Error fetching friends' data:", error);
        }
    };


    const createGroup = async () => {
        try {
            const docRef = await addDoc(collection(db, "groups"), {
                name: groupName,              // Store the group name
                timestamp: serverTimestamp(),        // Optional metadata
                creator: auth.currentUser?.uid // Track the creator if logged in
            });

            await addGroupUserSide(docRef.id);
            await addGroupCollectionSide(docRef.id);


            console.log("Group created with ID:", docRef.id);
            return docRef.id;
        } catch (error) {
            console.error("Error creating group:", error);
        }
    }

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

    const addGroupUserSide = async (groupID: string) => {
        if (!auth.currentUser) return;

        const docRef = doc(db, "users", auth.currentUser.uid, "groups", groupID);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
            await setDoc(docRef, {
                name: groupName,
                timestamp: serverTimestamp(),
            });

            console.log(`Group ${groupID} added to user ${auth.currentUser.uid}`);
        } else {
            console.log(`Group ${groupID} already exists.`);
        }
    };

    const sendRequest = async (friend: string, groupID: string | undefined) => {
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
                await setDoc(docRef, { groupRequests: [...groupRequests, groupID] }, { merge: true });
                console.log("group request sent!");
            } else {
                await setDoc(docRef, { groupRequests: [groupID] });
                console.log("group request sent!");
            }
        }
    }

    const addGroupCollectionSide = async (groupID: string) => {
        if (!user) return;

        const colRef = collection(db, "groups", groupID, "users");
        const docSnaps = await getDocs(colRef);

        await setDoc(doc(colRef, user.uid), {
            name: user.displayName,
            timestamp: serverTimestamp(),
        });

        console.log(`User ${user.uid} added to group ${groupID}`);


    };

    const completeGroup = async () => {
        if (!selectedGroups) return;
        const groupID = await createGroup()
        const selectedIds = [...selectedGroups.keys()];

        await Promise.all(selectedIds.map(id => sendRequest(id, groupID)));

        setFriends((prev) => prev ? prev.filter(friend => !selectedIds.includes(friend.id)) : null);

        setSelectedGroups(null);
        router.back()
    }




    return (
        // <View style={styles.container}>
        //     <TextInput
        //         style={styles.input}
        //         placeholder="group name"
        //         placeholderTextColor="#ccc"
        //         value={groupName}
        //         onChangeText={setGroupName}
        //     />
        //     <Pressable style={styles.button} onPress={() => createGroup(groupName)}>
        //         <Text style={styles.text}>create group</Text>
        //     </Pressable>
        //     <TouchableOpacity onPress={() => router.back()}>
        //         <Text style={styles.text}>cancel</Text>
        //     </TouchableOpacity>
        //
        // </View>
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.backArrowName}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="x" size={20} color="#D3D3FF" />
                    </TouchableOpacity>
                    <Text style={styles.topBarText}>{user?.displayName}</Text>
                </View>
                {(selectedGroups?.size)==0 ?
                    <Ionicons name="send-outline" size={20} color="#D3D3FF" />
                    :
                    <TouchableOpacity onPress={() => completeGroup()}>
                        <Ionicons name="send" size={20} color="#D3D3FF" />
                    </TouchableOpacity>
                }
                {/*<TouchableOpacity onPress={() => completeGroup()}>*/}
                {/*    <Ionicons name="send-outline" size={20} color="#D3D3FF" />*/}
                {/*</TouchableOpacity>*/}


            </View>
            <View style={styles.searchBarContainer}></View>
            <TextInput
                style={styles.input}
                placeholder="Create a Name for your Group"
                value={groupName}
                onChangeText={setGroupName}
            />


            <FlatList
                style={styles.groups}
                data={friends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.groupContainer}>
                        <Pressable onPress={() => toggleSelection(item.id)} style={styles.groupRow}>
                            <View style={styles.backArrowName}>
                                <Image   source={{ uri: item.photoURL || " "}} style={styles.avatar} />
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
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
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
    input: {
        padding: 10,
        backgroundColor: "white",
        marginTop: 20,
        marginHorizontal: 30,
    },
    searchBarContainer: {
        flexDirection: "row",

    },
    groups: {
        flex: 1, // Allows FlatList to take up remaining space
        marginTop: 20
    },
    groupContainer: {
        // alignItems: "center",
        justifyContent: "center",
        marginHorizontal: 40,

    },
    groupRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 1,
        justifyContent: "space-between",
    },
    noResults: {
        fontSize: 16,
        color: 'gray',
        textAlign: 'center',
    },
    avatar: {
        width: 25,
        height: 25,
        borderRadius: 20,
        marginRight: 10,
        // backgroundColor: '#ccc',
    },
    listContent: {
        paddingBottom: 80, // Prevents overlap with "Create Group" button
    },
    text: {
        color: "white",
    },
})

export default Page;
