import {View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity, Alert} from 'react-native';
import { auth, db } from '@/firebase';
import firestore from '@react-native-firebase/firestore';
import { Checkbox } from 'react-native-paper';
import React, { useEffect, useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import * as FileSystem from 'expo-file-system';

const { width, height } = Dimensions.get("window");

type GroupType = {
    id: string,
    name: string,
};

const Page = () => {
    const user = auth().currentUser;
    const { recapURI, mode, caption, thumbnail } = useLocalSearchParams();
    const captionString = String(caption);
    const thumbnailString = String(thumbnail);
    const recapURIString = String(recapURI);
    const modeString = String(mode);
    const [userGroups, setUserGroups] = useState<GroupType[]>([]);
    const router = useRouter();
    const [selectedGroups, setSelectedGroups] = useState<Map<string, boolean>>(new Map());
    const [selectAll, setSelectAll] = useState<boolean>(false);

    useEffect(() => {
        if (!user) return;

        const fetchUserGroups = async () => {
            try {
                const queryUserGroups = await db
                    .collection("users")
                    .doc(user.uid)
                    .collection("groups")
                    .get();

                const groupList = queryUserGroups.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || "Unnamed Group",
                    };
                });
                setUserGroups(groupList);
            } catch (err) {
                console.error(err);
            }
        };

        fetchUserGroups().catch(console.error);
    }, [user]);

    const toggleSelection = (id: string) => {
        if (!id) return;

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

    const uploadThumbnail = async (postID: string, thumbnail: string): Promise<string | undefined> => {
        if (!thumbnail) return;

        try {
            const signedURLs = await getSignedUploadUrl(postID, "photo");
            if (!signedURLs) return;

            const uploadResult = await FileSystem.uploadAsync(signedURLs.uploadURL, thumbnail, {
                httpMethod: "PUT",
                headers: { "Content-Type": "image/jpeg" },
            });

            if (uploadResult.status !== 200) {
                throw new Error(`Thumbnail upload failed with status ${uploadResult.status}`);
            }

            return signedURLs.publicURL;
        } catch (error) {
            console.error('Thumbnail upload failed:', error);
        }
    };

    const doneButton = async () => {
        if (!user || !selectedGroups) return;

        const parsedGroups = [...selectedGroups.keys()]
            .filter((groupId) => selectedGroups.get(groupId))
            .map((groupId) => ({ id: groupId }));

        if (parsedGroups.length === 0) {
            Alert.alert("No groups selected");
            return;
        }

        try {
            const postReference = await db
                .collection("posts")
                .add({
                sender_id: user.uid,
                modeString,
                captionString,
                content: null,
                thumbnail: null,
                timestamp: firestore.FieldValue.serverTimestamp(),
            });

            const postID = postReference.id;

            await db
                .collection("users")
                .doc(user.uid)
                .collection("posts")
                .doc(postID)
                .set({
                timestamp: firestore.FieldValue.serverTimestamp(),
            });

            await addPostToGroups(parsedGroups, postID, null, null);

            const uploadFn = modeString === "photo" ? uploadPhoto : uploadVideo;


            Promise.all([
                uploadFn(postID, recapURIString),
                uploadThumbnail(postID, thumbnailString),
            ])
                .then(async ([postURL, thumbnailURL]) => {
                    if (!postURL || !thumbnailURL) {
                        console.error("Upload failed");
                        return;
                    }

                    await db
                        .collection("posts")
                        .doc(postID)
                        .update({
                        content: encodeURIComponent(postURL),
                        thumbnail: encodeURIComponent(thumbnailURL),
                    });

                    await Promise.all(parsedGroups.map(async (group) => {
                        await db
                            .collection("groups")
                            .doc(group.id)
                            .collection("messages")
                            .doc(postID).update({
                            content: encodeURIComponent(postURL),
                            thumbnail: encodeURIComponent(thumbnailURL),
                        });
                    }));
                })
                .catch((err) => {
                    console.error("Background upload failed:", err);
                });

            router.push("/create/postLoadingScreen");


        } catch (error) {
            console.error("Error in createPost:", error);
        }
    };


    const getSignedUploadUrl = async (postID: string, fileType: "photo" | "video"): Promise<{ uploadURL: string, publicURL: string } | undefined> => {
        const contentType = fileType === "photo" ? "image/jpeg" : "video/quicktime";

        try {
            const response = await fetch(
                `https://getsigneduploadurl-ondqjhe3ua-uc.a.run.app?filename=${postID}&contentType=${encodeURIComponent(contentType)}`,
                {
                    method: "GET",
                    headers: { "Content-Type": "application/json" },
                }
            );

            if (!response.ok) {
                const text = await response.text();
                console.error(`Failed to get signed URL: ${response.status} ${text}`);
                return;
            }

            const data = await response.json();

            const path = fileType === "photo"
                ? `uploads/${postID}/thumbnail.jpg`
                : `uploads/${postID}/content.mov`;

            const publicURL = `https://firebasestorage.googleapis.com/v0/b/recap-d22e0.appspot.com/o/${encodeURIComponent(path)}?alt=media`;

            return { uploadURL: data.url, publicURL };
        } catch (error) {
            console.error("Error getting signed upload URL:", error);
        }
    };

    const uploadPhoto = async (postID: string, recap: string): Promise<string | undefined> => {
        if (!recap) return;

        try {
            const signedURLs = await getSignedUploadUrl(postID, "photo");
            if (!signedURLs) return;

            const uploadResult = await FileSystem.uploadAsync(signedURLs.uploadURL, recap, {
                httpMethod: "PUT",
                headers: { "Content-Type": "image/jpeg" },
            });

            if (uploadResult.status !== 200) {
                throw new Error(`Upload failed with status ${uploadResult.status}`);
            }

            return signedURLs.publicURL;
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const uploadVideo = async (postID: string, recap: string): Promise<string | undefined> => {
        if (!recap) return;

        try {
            const signedURLs = await getSignedUploadUrl(postID, "video");
            if (!signedURLs) return;

            const uploadResult = await FileSystem.uploadAsync(signedURLs.uploadURL, recap, {
                httpMethod: "PUT",
                headers: { "Content-Type": "video/quicktime" },
            });

            if (uploadResult.status !== 200) {
                throw new Error(`Upload failed with status ${uploadResult.status}`);
            }

            return signedURLs.publicURL;
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };

    const addPostToGroups = async (parsedGroups: { id: string }[], postID: string, postURL: string | null, thumbnailURL: string | null) => {
        if (!user) return;
        try {
            await Promise.all(
                parsedGroups.map(async (group) => {
                    await db
                        .collection("groups")
                        .doc(group.id)
                        .collection("messages")
                        .doc(postID)
                        .set({
                        mode: modeString,
                        sender_id: user.uid,
                        caption: captionString,
                        timestamp: firestore.FieldValue.serverTimestamp(),
                        content: postURL ? encodeURIComponent(postURL) : null,
                        thumbnail: thumbnailURL ? encodeURIComponent(thumbnailURL) : null,
                    });
                    await db
                        .collection("posts")
                        .doc(postID)
                        .collection("groups")
                        .doc(group.id)
                        .set({
                        timestamp: firestore.FieldValue.serverTimestamp(),
                    });
                })
            );
        } catch (error) {
            console.error("Error adding post to groups:", error);
        }
    };

    const selectAllFunction = () => {
        const dummySelect = !selectAll;
        if (!userGroups) return;

        try {
            if (dummySelect) {
                const next = new Map<string, boolean>();
                userGroups.forEach(g => next.set(g.id, true));
                setSelectedGroups(next);
            } else {
                setSelectedGroups(new Map());
            }
            setSelectAll(dummySelect);
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.backArrowName}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="x" size={width / 17.5} color="#D3D3FF" />
                    </TouchableOpacity>
                    {user && <Text style={styles.topBarText}>
                        {user.displayName}
                    </Text>}
                </View>
                {selectedGroups && (selectedGroups.size) === 0 ? (
                    <Ionicons name="send-outline" size={width / 15} color="#D3D3FF" />
                ) : (
                    <TouchableOpacity onPress={() => doneButton()}>
                        <Ionicons name="send" size={width / 15} color="#D3D3FF" />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.groupContainer}>
                <TouchableOpacity style={styles.groupRow} onPress={selectAllFunction}>
                    <View style={styles.backArrowName}>
                        <Text style={styles.text}>
                            {selectAll ? "unselect all" : "select all"}
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
                data={userGroups}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.groupContainer}>
                        <TouchableOpacity onPress={() => toggleSelection(item.id)} style={styles.groupRow}>
                            <View style={styles.backArrowName}>
                                <Text style={styles.text}>
                                    {item.name}
                                </Text>
                            </View>
                            {selectedGroups && (
                                <Checkbox
                                    status={selectedGroups.get(item.id) ? "checked" : "unchecked"}
                                    onPress={() => toggleSelection(item.id)}
                                />
                            )}
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.noResults}>You added all your friends!</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    groups: {
        flex: 1,
    },
    listContent: {
        paddingBottom: height / 10,
    },
    text: {
        fontSize: height / 50,
        fontWeight: "bold",
        color: "white",
    },
    groupContainer: {
        alignItems: "center",
        justifyContent: "center",
        width: width,
    },
    groupRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: height / 100,
        justifyContent: "space-between",
        width: width * 0.9,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width / 20,
        borderBottomWidth: height / 1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height / 18
    },
    topBarText: {
        color: "#D3D3FF",
        fontSize: height / 50,
    },
    backArrowName: {
        flexDirection: 'row',
        alignItems: "center",
    },
    noResults: {
        fontSize: height / 50,
        color: 'gray',
        textAlign: 'center',
    },
});

export default Page;
