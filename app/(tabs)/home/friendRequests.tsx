import { Text, View, StyleSheet, FlatList, Pressable, TouchableOpacity } from "react-native";
import React, { useState, useEffect } from "react";
import { auth, db } from '@/firebase';
import {doc, getDoc, updateDoc, arrayRemove, onSnapshot, serverTimestamp, setDoc, collection} from "firebase/firestore";
import { Link, useRouter } from "expo-router";


const Page = () => {
    const [friendsUsername, setFriendsUsername] = useState<string[]>([]);
    const [friendsUID, setFriendsUID] = useState<string[]>([]);
    const [groupsName, setGroupsName] = useState<string[]>([]);
    const user = auth.currentUser;
    const router = useRouter();
    const [groupRequests, setGroupRequests] = useState<{ id: string, name: string, }[] | null>(null);


    const fetchGroupRequests = async () => {
        if (!user) return;

        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (!userDoc.exists()) return;

        const incomingIds: string[] = userDoc.data().groupRequests || [];

        const detailed = await Promise.all(
            incomingIds.map(async (groupId) => {
                const groupDoc = await getDoc(doc(db, "groups", groupId));
                return {
                    id:   groupId,
                    name: groupDoc.exists()
                        ? (groupDoc.data().name as string)
                        : "Unknown",
                };
            })
        );

        setGroupRequests(detailed);
    };



    const fetchFriendRequestsAndUsernames = async () => {
        if (!user) return;
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const friendRequests: string[] = userDoc.data().friendRequests || [];
            setFriendsUID(friendRequests);

            const usernames: string[] = [];

            for (const uid of friendRequests) {
                const friendDoc = await getDoc(doc(db, "users", uid));
                if (friendDoc.exists()) {
                    usernames.push(friendDoc.data().displayName || "Unknown");
                }
            }

            setFriendsUsername(usernames);
        }
    };

    useEffect(() => {
        fetchFriendRequestsAndUsernames();
        fetchGroupRequests();
    }, []);

    // useEffect(() => {
    //     console.log("UIDs:", friendsUID);
    //     console.log("Usernames:", friendsUsername);
    // }, [friendsUsername]);

    const acceptGroupInvite = async (groupId: string) => {
        if (!user) return;
        console.log(groupId);
        try {
            const groupNameRef = doc(db, "groups", groupId);
            const docSnap = await getDoc(groupNameRef);
            if (docSnap.exists()) {
                const groupName = docSnap.data().name;
                addGroupUserSide(groupId, groupName);
                addGroupCollectionSide(groupId);
                removeGroupInvite(groupId);
                console.log("group added successfully.");
                fetchGroupRequests()
            }
            else {
                console.log("group adding failed.");
            }

        } catch (err) {
            console.error(err);
        }


    }



    const addGroupUserSide = async (groupID: string, groupName: string) => {
        if (!auth.currentUser) return;

        const docRef = doc(db, "users", auth.currentUser.uid, "groups", groupID);

        try {
            await setDoc(docRef, {
                name: groupName,
            });

            console.log(`Group ${groupID} added to user ${auth.currentUser.uid}`);
        } catch (error) {
            console.log(`Group ${groupID} already exists.`);
        }
    };

    const addGroupCollectionSide = async (groupID: string) => {
        if (!user) return;

        const colRef = collection(db, "groups", groupID, "users");
        try {
            await setDoc(doc(colRef, user.uid), {
                name: user.displayName,
            });
            console.log(`User ${user.uid} added to group ${groupID}`);
        } catch (error) {
            console.log(`user in ${groupID} already exists.`);

        }

    };


    const removeGroupInvite = async (groupID: string) => {
        if (user) {
            const docRef = doc(db, "users", user.uid);

            try {
                await updateDoc(docRef, {
                    groupRequests: arrayRemove(groupID)
                });

                console.log(`Removed group request from ${groupID}`);
            } catch (error) {
                console.error("Error removing group request: ", error);
            }
        }
    };

    const acceptFriend = async (displayName: string) => {
        if (user) {
            const friendRef = await getDoc(doc(db, "displayName", displayName));
            let friend = '';
            if (friendRef.exists()) friend = friendRef.data().uid;

            console.log(friend, displayName);

            const userFriendDocRef = doc(db, "users", user.uid, "friends", friend);
            const friendFriendDocRef = doc(db, "users", friend, "friends", user.uid);

            try {
                const friendData = { dateAdded: serverTimestamp() };

                await setDoc(userFriendDocRef, friendData);
                await setDoc(friendFriendDocRef, friendData);
                console.log("added friend!");

                await removeFriendRequest(friend);
            } catch (error) {
                console.error("Error accepting friend request: ", error);
            }
        }
    };

    const removeFriendRequest = async (friend: string) => {
        if (user) {
            const docRef = doc(db, "users", user.uid);

            try {
                await updateDoc(docRef, {
                    friendRequests: arrayRemove(friend)
                });



                console.log(`Removed friend request from ${friend}`);
                await fetchFriendRequestsAndUsernames();

            } catch (error) {
                console.error("Error removing friend request: ", error);
            }
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                <Text style={styles.backButtonText}>back</Text>
            </TouchableOpacity>

            {/*<Pressable onPress={() => console.log('Checking friend requests')} style={styles.button}>*/}
            {/*    <Text> Search for friends </Text>*/}
            {/*</Pressable>*/}

            <FlatList
                data={friendsUsername}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.friendContainer}>
                        <View style={styles.friendComponent}>
                            <Text style={styles.text}>{item}</Text>

                            <View style={styles.buttonGroup}>
                                <Pressable onPress={() => acceptFriend(item)} style={styles.acceptButton}>
                                    <Text>Accept</Text>
                                </Pressable>
                                <Pressable onPress={() => removeFriendRequest(item)} style={styles.declineButton}>
                                    <Text>Decline</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                )}
                style={{ flexGrow: 0 }}
            />

            <FlatList
                data={groupRequests}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.friendContainer}>
                        <View style={styles.friendComponent}>
                            <Text style={styles.text}>{item.name}</Text>

                            <View style={styles.buttonGroup}>
                                <Pressable onPress={() => acceptGroupInvite(item.id)} style={styles.acceptButton}>
                                    <Text>Accept</Text>
                                </Pressable>
                                <Pressable onPress={() => removeGroupInvite(item.id)} style={styles.declineButton}>
                                    <Text>Decline</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                )}

            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        flex: 1,
        justifyContent: "flex-start",
        alignItems: "flex-start"
    },
    text: {
        fontSize: 18,
        color: "white",
    },
    friendContainer: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%", // Ensures it takes full width
    },
    friendComponent: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: 10,
        width: "90%",
        borderBottomWidth: 1,
        borderBottomColor: "white", // Add for visibility if needed
    },

    buttonGroup: {
        flexDirection: "row",
    },

    acceptButton: {
        backgroundColor: "green",
        padding: 6,
        borderRadius: 7,
        marginLeft: 10,
    },

    declineButton: {
        backgroundColor: "red",
        padding: 6,
        borderRadius: 7,
        marginLeft: 10,
    },
    backButton: {
        paddingLeft: 10,
    },
    backButtonText: {
        color: "white",
    }
});

export default Page;
