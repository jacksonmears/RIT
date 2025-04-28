import {View, Text, Button, StyleSheet, FlatList, Pressable, TouchableOpacity } from 'react-native';
import {auth, db, storage} from '@/firebase';
import { Checkbox } from 'react-native-paper';
import React, {useEffect, useState} from "react";
import {doc, onSnapshot, getDocs, collection, getDoc, addDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import GroupCard from "@/components/GroupCard";
import {getDownloadURL, ref as storageRef, uploadBytes} from "firebase/storage"; // Import reusable component
import * as ImageManipulator from 'expo-image-manipulator';

const Page = () => {
    const user = auth.currentUser;
    const {fillerURI, fillerMode, fillerCaption} = useLocalSearchParams();
    const caption = String(fillerCaption);
    const localUri = String(fillerURI);
    const mode = String(fillerMode);
    const [globalPath, setGlobalPath] = useState<string | null>(null);
    const [groups, setGroups] = useState<{ id: string, name: string}[] | null>(null);
    const router = useRouter();
    const [selectedGroups, setSelectedGroups] = useState<{ [key: string]: boolean }>({});

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
    }, [groups]);

    const toggleSelection = (groupId: string) => {
        setSelectedGroups(prev => ({
            ...prev,
            [groupId]: !prev[groupId], // Toggle the selection
        }));
    };

    useEffect(() => {
        const parsedGroups = Object.keys(selectedGroups)
            .filter((groupId) => selectedGroups[groupId]) // Only keep selected groups (true)
            .map((groupId) => ({ id: groupId })); // Convert to array format

        console.log(parsedGroups); // Logs: [{ id: "2rD2G7tJhcCWnUOyezRM" }, { id: "GUTD5bGSCCcJ5vwGlSjR" }]
    }, [selectedGroups]);


    const createPost = async () => {
        if (!user) return;
        const parsedGroups = Object.keys(selectedGroups)
            .filter((groupId) => selectedGroups[groupId]) // Only keep selected groups (true)
            .map((groupId) => ({ id: groupId }));
        const hasSelectedGroup = Object.values(selectedGroups).some(value => value === true);

        if (!user || (!parsedGroups || parsedGroups.length === 0 || !hasSelectedGroup)) {
            console.log("not parsed groups")
            return;
        }
        try {



            const postRef = await addDoc(collection(db, "posts"), {
                sender_id: user.uid,
                type: mode,
                caption: caption,
                timestamp: serverTimestamp(),
            });

            const postID = postRef.id

            const imageURL = await uploadPhoto(postID);

            await updateDoc(doc(db, "posts", postID), {
                content: encodeURIComponent(imageURL),
            });



            const userRef = await setDoc(doc(db, "users", user.uid, "posts", postID), {
                timestamp: serverTimestamp(),
            });


            await addPostToGroups(db, parsedGroups, postID);


        } catch (error) {
            console.error(error);
        }
    }


    const uploadPhoto = async (postID: string) => {
        if (!auth.currentUser) {
            throw new Error('No user logged in');
        }

        const uri =
            localUri.startsWith('file://')
                ? localUri
                : `file://${localUri}`;

        const response = await fetch(uri);
        const blob     = await response.blob();

        const ref = storageRef(storage, `postPictures/${postID}.jpg`);
        await uploadBytes(ref, blob);

        return getDownloadURL(ref);
    };


    // const uploadPhoto = async (postID: string) => {
    //     if (!auth.currentUser) {
    //         throw new Error('No user logged in');
    //     }
    //     const response = await fetch(localUri);
    //     const blob = await response.blob();
    //
    //     // const resizedImage = await ImageManipulator.manipulateAsync(
    //     //     localUri,
    //     //     [{ resize: { width: 1080, height: 1350 } }],
    //     //     { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    //     // );
    //
    //     // const resizedImage = await resize(localUri)
    //
    //     // const encodedPath = encodeURIComponent(`postPictures/${postID}.jpg`);
    //     const ref = storageRef(storage, `postPictures/${postID}.jpg`);
    //     // const resizedBlob = await fetch(resizedImage).then(res => res.blob());
    //
    //     await uploadBytes(ref, blob);
    //     return getDownloadURL(ref);
    // }


    const resize = async (uri: string) => {
        const targetWidth = 1080;
        const targetHeightPortrait = 1350;
        // const targetHeightLandscape = 566;

        // Get the image dimensions
        const { width, height } = await getImageDimensions(uri);
        console.log(width, height);

        // Calculate the aspect ratio
        const aspectRatio = width / height;

        let newWidth, newHeight;

        if (aspectRatio > targetWidth / targetHeightPortrait ) {
            newWidth = targetWidth;
            newHeight = Math.round(targetWidth / aspectRatio);
        } else {
            // Portrait image, adjust height
            newHeight = targetHeightPortrait;
            newWidth = Math.round(targetHeightPortrait * aspectRatio);
        }

        // Resize the image to fit the target dimensions while maintaining the aspect ratio
        const resizedImage = await ImageManipulator.manipulateAsync(uri, [
            { resize: { width: newWidth, height: newHeight } },
        ]);

        // Create a new blank image with the target size and a background color
        const paddedImage = await ImageManipulator.manipulateAsync(resizedImage.uri, [
            {
                resize: { width: targetWidth, height: targetHeightPortrait },
            },
            {
                crop: {
                    originX: (targetWidth - newWidth) / 2,
                    originY: (targetHeightPortrait - newHeight) / 2,
                    width: newWidth,
                    height: newHeight,
                },
            },
        ]);

        return paddedImage.uri; // Return the resized and padded image URI
    };

    const getImageDimensions = async (uri: string) => {
        const { width, height } = await ImageManipulator.manipulateAsync(uri, []);
        return { width, height };
    };

    const addPostToGroups = async (db: any, parsedGroups: { id: string }[], postID: string) => {
        try {
            await Promise.all(
                parsedGroups.map(async (group) => {
                    await setDoc(doc(db, "groups", group.id, "messages", postID), {
                        type: mode,
                        timestamp: serverTimestamp(),
                    });
                })
            );
            console.log("Post added to all selected groups");
        } catch (error) {
            console.error("Error adding post to groups:", error);
        }
    };

    const doneButton = async () => {
        createPost();
        router.push({
            pathname: "/create",
            params: { reset: "true" },
        });

        setTimeout(() => {
            router.push("../home");
        }, 0);
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>assign group Page!</Text>

            <FlatList
                style={styles.groups}
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.groupContainer}>
                        <Pressable onPress={() => toggleSelection(item.id)} style={styles.groupRow}>
                            <Checkbox
                                status={selectedGroups[item.id] ? "checked" : "unchecked"}
                                onPress={() => toggleSelection(item.id)}
                            />
                            <Text style={styles.text}>{item.name}</Text>
                        </Pressable>
                    </View>
                )}
                contentContainerStyle={styles.listContent} // Adds padding
            />

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text>back</Text>
            </TouchableOpacity>


            {/*<TouchableOpacity style={styles.doneButton} onPress={() => printGroups()}>*/}
            {/*    <Text>done</Text>*/}
            {/*</TouchableOpacity>*/}

            <TouchableOpacity style={styles.doneButton} onPress={() => doneButton()}>
                <Text>done</Text>
            </TouchableOpacity>

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
    },
    groupContainer: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%", // Ensures it takes full width
    },
    backButton: {
        position: "absolute",
        top: 0,
        right: 20,
        backgroundColor: "red",
    },
    doneButton: {
        position: "absolute",
        top: 0,
        left: 20,
        backgroundColor: "green",
    },
    groupRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 1,
    },

});


export default Page;
