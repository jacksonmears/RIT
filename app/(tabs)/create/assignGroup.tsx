import {View, Text, Button, StyleSheet, FlatList, Pressable, TouchableOpacity, Image} from 'react-native';
import {auth, db, storage} from '@/firebase';
import { Checkbox } from 'react-native-paper';
import React, {useEffect, useState} from "react";
import {doc, onSnapshot, getDocs, collection, getDoc, addDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import GroupCard from "@/components/GroupCard";
import {getDownloadURL, ref as storageRef, uploadBytes} from "firebase/storage"; // Import reusable component
import * as ImageManipulator from 'expo-image-manipulator';
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";

const Page = () => {
    const user = auth.currentUser;
    const {fillerURI, fillerMode, fillerCaption} = useLocalSearchParams();
    const caption = String(fillerCaption);
    const localUri = String(fillerURI);
    const mode = String(fillerMode);
    const [globalPath, setGlobalPath] = useState<string | null>(null);
    const [groups, setGroups] = useState<{ id: string, name: string}[] | null>(null);
    const router = useRouter();
    const [selectedGroups, setSelectedGroups] = useState<Map<string, boolean> | null>(new Map());
    const [selectAll, setSelectAll] = useState<boolean>(false);

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

    useEffect(() => {
        console.log(selectedGroups);
    }, [selectedGroups]);

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


    const createPost = async () => {
        if (!user || !selectedGroups) return;
        const parsedGroups = [...selectedGroups.keys()]
            .filter((groupId) => selectedGroups?.get(groupId)) // Only keep selected groups (true)
            .map((groupId) => ({ id: groupId }));
        const hasSelectedGroup = [...selectedGroups?.values()].some(value => value === true);

        if (!user || (!parsedGroups || parsedGroups.length === 0 || !hasSelectedGroup)) {
            console.log("not parsed groups")
            return;
        }
        try {



            const postRef = await addDoc(collection(db, "posts"), {
                sender_id: user.uid,
                mode: mode,
                caption: caption,
                timestamp: serverTimestamp(),
            });

            const postID = postRef.id

            const postURL = mode === "photo"
                ? await uploadPhoto(postID)
                : await uploadVideo(postID);

            await updateDoc(doc(db, "posts", postID), {
                content: encodeURIComponent(postURL),
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


        const response = await fetch(localUri);
        const blob     = await response.blob();

        const ref = storageRef(storage, `postPictures/${postID}.jpg`);
        await uploadBytes(ref, blob);

        return getDownloadURL(ref);
    };

    const uploadVideo = async (postID: string) => {
        if (!auth.currentUser) {
            throw new Error('No user logged in');
        }


        const response = await fetch(localUri);
        const blob     = await response.blob();

        const ref = storageRef(storage, `postVideos/${postID}.mov`);
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
                        mode: mode,
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

    const selectAllFunction = () => {
        const dummySelect = !selectAll
        if (!groups) return;
        if (dummySelect) {
            const next = new Map<string, boolean>();
            groups.forEach(g => next.set(g.id, true));
            setSelectedGroups(next);
        }else {
            const next = new Map<string, boolean>();
            setSelectedGroups(next);
        }
        setSelectAll(dummySelect);

    }

    return (
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
                    <TouchableOpacity onPress={() => doneButton()}>
                        <Ionicons name="send" size={20} color="#D3D3FF" />
                    </TouchableOpacity>
                }

            </View>

            {/*<FlatList*/}
            {/*    style={styles.groups}*/}
            {/*    data={groups}*/}
            {/*    keyExtractor={(item) => item.id}*/}
            {/*    renderItem={({ item }) => (*/}
            {/*        <View style={styles.groupContainer}>*/}
            {/*            <Pressable onPress={() => toggleSelection(item.id)} style={styles.groupRow}>*/}
            {/*                <Checkbox*/}
            {/*                    status={selectedGroups?.get(item.id) ? "checked" : "unchecked"}*/}
            {/*                    onPress={() => toggleSelection(item.id)}*/}
            {/*                />*/}
            {/*                <Text style={styles.text}>{item.name}</Text>*/}
            {/*            </Pressable>*/}
            {/*        </View>*/}
            {/*    )}*/}
            {/*    contentContainerStyle={styles.listContent} // Adds padding*/}
            {/*/>*/}
            <View style={styles.groupContainer}>
                <TouchableOpacity style={styles.groupRow}>
                    <View style={styles.backArrowName}>
                        <Text style={styles.text}>
                            {(selectAll ?
                                "unselect all"
                                :
                                "select all"
                            )}
                        </Text>
                    </View>

                    <Checkbox
                        status={selectAll ? "checked" : "unchecked"}
                        onPress={selectAllFunction}
                    />
                </TouchableOpacity>
            </View>

            <FlatList
                style={styles.groups}
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.groupContainer}>
                        <TouchableOpacity onPress={() => toggleSelection(item.id)} style={styles.groupRow}>
                            <View style={styles.backArrowName}>
                                <Text style={styles.text}>{item.name}</Text>
                            </View>

                            <Checkbox
                                status={selectedGroups?.get(item.id) ? "checked" : "unchecked"}
                                onPress={() => toggleSelection(item.id)}
                            />
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContent} // Adds padding
                ListEmptyComponent={<Text style={styles.noResults}>You added all your friends!</Text>}

            />

            {/*<TouchableOpacity style={styles.backButton} onPress={() => router.back()}>*/}
            {/*    <Text>back</Text>*/}
            {/*</TouchableOpacity>*/}


            {/*<TouchableOpacity style={styles.doneButton} onPress={() => printGroups()}>*/}
            {/*    <Text>done</Text>*/}
            {/*</TouchableOpacity>*/}

            {/*<TouchableOpacity style={styles.doneButton} onPress={() => doneButton()}>*/}
            {/*    <Text>done</Text>*/}
            {/*</TouchableOpacity>*/}

        </View>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    groups: {
        flex: 1,
    },
    listContent: {
        paddingBottom: 80,
    },
    text: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
    },
    groupContainer: {
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
    },
    groupRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderBottomWidth: 1,
        justifyContent: "space-between",
        width: "90%",
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
    noResults: {
        fontSize: 16,
        color: 'gray',
        textAlign: 'center',
    },

});


export default Page;
