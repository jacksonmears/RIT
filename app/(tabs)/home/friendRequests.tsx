import { Text, View, StyleSheet, FlatList, Pressable } from "react-native";
import React, { useState, useEffect } from "react";
import { auth, db } from '@/firebase';
import { doc, getDoc, updateDoc, arrayRemove, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { Link } from "expo-router";

const Page = () => {
    const [friendsUsername, setFriendsUsername] = useState<string[]>([]);
    const [friendsUID, setFriendsUID] = useState<string[]>([]);
    const user = auth.currentUser;


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
    }, []);

    useEffect(() => {
        console.log("UIDs:", friendsUID);
        console.log("Usernames:", friendsUsername);
    }, [friendsUsername]);


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
            <Link href="/(tabs)/home">
                <Text style={styles.text}>back to home page</Text>
            </Link>

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
            />

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    text: {
        fontSize: 18,
        color: "white",
    },
    button: {
        backgroundColor: "gold"
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
        gap: 10, // Optional if supported
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

});

export default Page;
