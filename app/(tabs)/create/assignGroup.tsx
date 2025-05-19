import { View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity } from 'react-native';
import { auth, db, storage } from '@/firebase';
import { Checkbox } from 'react-native-paper';
import React, { useEffect, useState} from "react";
import { serverTimestamp } from "firebase/firestore"; // Keep for types, but use db methods directly
import { useRouter, useLocalSearchParams } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

type GroupType = {
    id: string,
    name: string,
}

const Page = () => {
    const user = auth().currentUser;
    const { fillerURI, fillerMode, fillerCaption } = useLocalSearchParams();
    const caption = String(fillerCaption);
    const localUri = String(fillerURI);
    const mode = String(fillerMode);
    const [groups, setGroups] = useState<GroupType[] | []>([]);
    const router = useRouter();
    const [selectedGroups, setSelectedGroups] = useState<Map<string, boolean> | null>(new Map());
    const [selectAll, setSelectAll] = useState<boolean>(false);


    useEffect(() => {
        if (!user) return;

        const getGroups = async () => {
            try {
                const querySnapshot = await db().collection("users").doc(user.uid).collection("groups").get();
                const groupList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || "Unnamed Group",
                    };
                });
                setGroups(groupList);
            } catch (err) {
                console.error(err);
            }
        };

        getGroups().catch((err) => {
            console.error(err);
        });
    }, [user]);

    const toggleSelection = (id: string) => {
        if (!id) return;

        try {
            setSelectedGroups((prev) => {
                const next = new Map(prev);
                if (next.has(id)) {
                    next.delete(id);
                } else {
                    next.set(id, true);
                }
                return next;
            });
        } catch (err) {
            console.error(err);
        }
    };

    const createPost = async () => {
        if (!user || !selectedGroups) return;

        const parsedGroups = [...selectedGroups.keys()]
            .filter((groupId) => selectedGroups.get(groupId)) // Only keep selected groups (true)
            .map((groupId) => ({ id: groupId }));
        const hasSelectedGroup = [...selectedGroups.values()].some(value => value);

        if (!hasSelectedGroup) return;
        try {
            const postRef = await db().collection("posts").add({
                sender_id: user.uid,
                mode: mode,
                caption: caption,
                timestamp: serverTimestamp(),
            });

            const postID = postRef.id;

            const postURL = mode === "photo"
                ? await uploadPhoto(postID)
                : await uploadVideo(postID, localUri);

            if (!postURL) return;

            await db().collection("posts").doc(postID).update({
                content: encodeURIComponent(postURL),
            });

            await db().collection("users").doc(user.uid).collection("posts").doc(postID).set({
                timestamp: serverTimestamp(),
            });

            await addPostToGroups(parsedGroups, postID);

        } catch (error) {
            console.error(error);
        }
    };

    const uploadPhoto = async (postID: string): Promise<string | undefined> => {
        if (!localUri) return;

        try {
            const ref = storage().ref(`postPictures/${postID}.jpg`);
            await ref.putFile(localUri);
            return await ref.getDownloadURL();
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };


    const uploadVideo = async (postID: string, localUri: string): Promise<string | undefined> => {
        if (!localUri) return;


        try {
            const ref = storage().ref(`postVideos/${postID}.mov`);
            await ref.putFile(localUri);
            return await ref.getDownloadURL();
        } catch (error) {
            console.error('Upload failed:', error);
        }
    };


    const addPostToGroups = async (parsedGroups: { id: string }[], postID: string) => {
        try {
            await Promise.all(
                parsedGroups.map(async (group) => {
                    await db().collection("groups").doc(group.id).collection("messages").doc(postID).set({
                        mode: mode,
                        timestamp: serverTimestamp(),
                    })
                    await db().collection("posts").doc(postID).collection("groups").doc(group.id).set({
                        timestamp: serverTimestamp(),
                    })
                })
            );
        } catch (error) {
            console.error("Error adding post to groups:", error);
        }
    };

    const doneButton = async () => {
        await createPost();
        router.push({
            pathname: "/create",
            params: { reset: "true" },
        });

        setTimeout(() => {
            router.push("../home");
        }, 0);
    };

    const selectAllFunction = () => {
        const dummySelect = !selectAll;
        if (!groups) return;

        try {
            if (dummySelect) {
                const next = new Map<string, boolean>();
                groups.forEach(g => next.set(g.id, true));
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
                        <Feather name="x" size={width / 20} color="#D3D3FF" />
                    </TouchableOpacity>
                    {user && <Text style={styles.topBarText}>{user.displayName}</Text>}
                </View>
                {selectedGroups && (selectedGroups.size) === 0 ?
                    <Ionicons name="send-outline" size={width / 20} color="#D3D3FF" />
                    :
                    <TouchableOpacity onPress={() => doneButton()}>
                        <Ionicons name="send" size={width / 20} color="#D3D3FF" />
                    </TouchableOpacity>
                }
            </View>

            <View style={styles.groupContainer}>
                <TouchableOpacity style={styles.groupRow} onPress={selectAllFunction}>
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
                            {selectedGroups &&
                                <Checkbox
                                    status={selectedGroups.get(item.id) ? "checked" : "unchecked"}
                                    onPress={() => toggleSelection(item.id)}
                                />
                            }

                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.noResults}>You added all your friends!</Text>}
            />

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
        paddingHorizontal: width/20,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height/20
    },

    topBarText: {
        color: "#D3D3FF",
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
