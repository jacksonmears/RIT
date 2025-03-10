import { Text, View, StyleSheet, FlatList, Pressable } from "react-native";
import React, { useState, useEffect } from "react";
import { auth, db } from '@/firebase';
import { doc, getDoc, updateDoc, arrayRemove, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { Link } from "expo-router";

const Page = () => {
    const [friendRequests, setFriendRequests] = useState([]);
    const user = auth.currentUser;

    // This function sets up the listener for changes in the user's friend requests
    useEffect(() => {
        if (user) {
            const docRef = doc(db, "users", user.uid);

            // Set up a real-time listener to the user's document
            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                const userData = docSnap.data();
                if (userData?.requests) {
                    setFriendRequests(userData.requests); // Update the state with the latest requests
                }
            });

            // Clean up the listener when the component unmounts or user changes
            return () => unsubscribe();
        }
    }, [user]); // This effect depends on the user, it will run when the user changes

    const acceptFriend = async (friend: string) => {
        if (user) {
            const userFriendDocRef = doc(db, "users", user.uid, "friends", friend);
            const friendFriendDocRef = doc(db, "users", friend, "friends", user.uid);

            try {
                const friendData = { dateAdded: serverTimestamp() };

                // Add the friend to both user's and friend's friends list
                await setDoc(userFriendDocRef, friendData);
                await setDoc(friendFriendDocRef, friendData);
                console.log("added friend!");

                // Now remove the friend request from the user's document
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
                // Remove the friend request from the user's requests array
                await updateDoc(docRef, {
                    requests: arrayRemove(friend)
                });

                console.log(`Removed friend request from ${friend}`);
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

            <Pressable onPress={() => console.log('Checking friend requests')} style={styles.button}>
                <Text> Search for friends </Text>
            </Pressable>

            <FlatList
                data={friendRequests}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                    <View style={styles.friendContainer}>
                        <View style={styles.friendComponent}>
                            <Text style={styles.text}>{item}</Text>

                            <Pressable onPress={() => acceptFriend(item)} style={styles.acceptButton}>
                                <Text>Accept</Text>
                            </Pressable>
                            <Pressable onPress={() => removeFriendRequest(item)} style={styles.declineButton}>
                                <Text>Decline</Text>
                            </Pressable>
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
        flexDirection: "row", // Places items in a row
        justifyContent: "space-between", // Pushes name left, button right
        alignItems: "center",
        padding: 10,
        width: "90%", // Adjust width as needed
        borderBottomWidth: 1,
    },
    acceptButton: {
        backgroundColor: "green",
        borderRadius: 7,
    },
    declineButton: {
        backgroundColor: "red",
        borderRadius: 7,
    }
});

export default Page;
