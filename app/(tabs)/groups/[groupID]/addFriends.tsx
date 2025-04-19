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
import {Checkbox} from "react-native-paper";

const Index = () => {
    const { groupID } = useLocalSearchParams();
    const groupIDString = String(groupID);
    const router = useRouter();
    const user = auth.currentUser;
    const [friendsID, setFriendsID] = useState<string[] | null>([]);
    const [friends, setFriends] = useState<{ id: string, displayName: string }[] | null>(null);
    const [selectedGroups, setSelectedGroups] = useState<{ [key: string]: boolean }>({});

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
            const friendUsernames: { id: string, displayName: string }[] = [];
            for (const id of friendsID) {
                const docSnap = await getDoc(doc(db, "users", id));
                const friendsRef = await getDoc(doc(db, "groups", groupIDString, "users", id));
                if (friendsRef.exists() || docSnap.exists() && docSnap.data().groupRequests.includes(groupIDString)){

                }
                else {
                    if (docSnap.exists()) friendUsernames.push({id: id, displayName: docSnap.data().displayName});
                }
            }
            setFriends(friendUsernames);
        } catch (error) {
            console.error("Error fetching friends' data:", error);
        }
    };

    const toggleSelection = (friend: string) => {
        setSelectedGroups(prev => ({
            ...prev,
            [friend]: !prev[friend], // Toggle the selection
        }));
    };

    const dealDone = async (selectedGroups: { [key: string]: boolean }) => {
        const selectedIds = Object.keys(selectedGroups).filter(id => selectedGroups[id]);

        // Send requests in parallel
        await Promise.all(selectedIds.map(id => sendRequest(id)));

        setFriends((prev) => prev ? prev.filter(friend => !selectedIds.includes(friend.id)) : null);

        setSelectedGroups({});
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
            <Text style={styles.text}>{groupIDString}</Text>
            <TouchableOpacity style={styles.doneButton} onPress={() => dealDone(selectedGroups)}>
                <Text style={styles.text}>done</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.text}>go back</Text>
            </TouchableOpacity>

            {/*<TextInput*/}
            {/*    style={styles.input}*/}
            {/*    placeholder="friends name"*/}
            {/*    placeholderTextColor="#ccc"*/}
            {/*    value={search}*/}
            {/*    onChangeText={setSearch}*/}
            {/*/>*/}



            {/*<Pressable onPress={handleSearch} style={styles.button}>*/}
            {/*    <Text> Search for friends </Text>*/}
            {/*</Pressable>*/}

            {/*<Pressable onPress={sendRequest} style={styles.reqButton}>*/}
            {/*    <Text> add {found} </Text>*/}
            {/*</Pressable>*/}

            <FlatList
                style={styles.groups}
                data={friends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.groupContainer}>
                        <Pressable onPress={() => toggleSelection(item.id)} style={styles.groupRow}>
                            <Checkbox
                                status={selectedGroups[item.id] ? "checked" : "unchecked"}
                                onPress={() => toggleSelection(item.id)}
                            />
                            <Text style={styles.text}>{item.displayName}</Text>
                        </Pressable>
                    </View>
                )}
                contentContainerStyle={styles.listContent} // Adds padding
            />

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
    },
    groups: {
        flex: 1, // Allows FlatList to take up remaining space
    },
    groupContainer: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%", // Ensures it takes full width
    },
    groupRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 1,
    },
    listContent: {
        paddingBottom: 80, // Prevents overlap with "Create Group" button
    },
    doneButton: {
        position: "absolute",
        top: 0,
        left: 10,
        backgroundColor: "green",
    }

});

export default Index;
