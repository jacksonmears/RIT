import {View, Text, StyleSheet, FlatList, Dimensions, TouchableOpacity} from 'react-native';
import {auth, db, storage} from '@/firebase';
import { Checkbox } from 'react-native-paper';
import React, {useEffect, useState} from "react";
import {doc, getDocs, collection, addDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useRouter, useLocalSearchParams } from "expo-router";
import {getDownloadURL, ref as storageRef, uploadBytes} from "firebase/storage";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

type GroupType = {
    id: string,
    name: string,
}

const Page = () => {
    const user = auth.currentUser;
    const {fillerURI, fillerMode, fillerCaption} = useLocalSearchParams();
    const caption = String(fillerCaption);
    const localUri = String(fillerURI);
    const mode = String(fillerMode);
    const [groups, setGroups] = useState<GroupType[] | []>([]);
    const router = useRouter();
    const [selectedGroups, setSelectedGroups] = useState<Map<string, boolean> | null>(new Map());
    const [selectAll, setSelectAll] = useState<boolean>(false);

    useEffect(() => {
        if (!user) return;

        try {
            const getGroups = async () => {
                const querySnapshot = await getDocs(collection(db, "users", user.uid, "groups"));
                const groupList = querySnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: data.name || "Unnamed Group",
                    };
                });
                setGroups(groupList);
            };
            getGroups().catch((err) => {
                console.error(err);
            });
        } catch (err) {
            console.error(err);
        }
    }, [groups]);


    const toggleSelection = (id: string) => {
        if (id.length < 0) return;

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

        if (!user || (!parsedGroups || parsedGroups.length === 0 || !hasSelectedGroup)) return;

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

            if (!postURL) return;

            await updateDoc(doc(db, "posts", postID), {
                content: encodeURIComponent(postURL),
            });


            await setDoc(doc(db, "users", user.uid, "posts", postID), {
                timestamp: serverTimestamp(),
            });

            await addPostToGroups(db, parsedGroups, postID);


        } catch (error) {
            console.error(error);
        }
    }


    const uploadPhoto = async (postID: string) => {
        if (!user) return;

        try {
            const response = await fetch(localUri);
            const blob     = await response.blob();

            const ref = storageRef(storage, `postPictures/${postID}.jpg`);
            await uploadBytes(ref, blob);

            return getDownloadURL(ref);
        } catch (error) {
            console.error(error);
        }
    };

    const uploadVideo = async (postID: string) => {
        if (!user) return;

        try {
            const response = await fetch(localUri);
            const blob     = await response.blob();

            const ref = storageRef(storage, `postVideos/${postID}.mov`);
            await uploadBytes(ref, blob);

            return getDownloadURL(ref);
        } catch (error) {
            console.error(error);
        }
    };


    const addPostToGroups = async (db: any, parsedGroups: { id: string }[], postID: string) => {
        try {
            await Promise.all(
                parsedGroups.map(async (group) => {
                    await setDoc(doc(db, "groups", group.id, "messages", postID), {
                        mode: mode,
                        timestamp: serverTimestamp(),
                    });
                    await setDoc(doc(db, "posts", postID, "groups", group.id), {
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
    }


    const selectAllFunction = () => {
        const dummySelect = !selectAll
        if (!groups) return;

        try {
            if (dummySelect) {
                const next = new Map<string, boolean>();
                groups.forEach(g => next.set(g.id, true));
                setSelectedGroups(next);
            }else {
                const next = new Map<string, boolean>();
                setSelectedGroups(next);
            }
            setSelectAll(dummySelect);
        } catch (error) {
            console.error(error);
        }
    }


    return (
        <View style={styles.container}>

            <View style={styles.topBar}>
                <View style={styles.backArrowName}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="x" size={width/20} color="#D3D3FF" />
                    </TouchableOpacity>
                    {user && <Text style={styles.topBarText}>{user.displayName}</Text>}
                </View>
                {selectedGroups && (selectedGroups.size)==0 ?
                    <Ionicons name="send-outline" size={width/20} color="#D3D3FF" />
                    :
                    <TouchableOpacity onPress={() => doneButton()}>
                        <Ionicons name="send" size={width/20} color="#D3D3FF" />
                    </TouchableOpacity>
                }
            </View>


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
                            {selectedGroups &&
                                <Checkbox
                                    status={selectedGroups.get(item.id) ? "checked" : "unchecked"}
                                    onPress={() => toggleSelection(item.id)}
                                />
                            }

                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContent} // Adds padding
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
        paddingBottom: height/10,
    },
    text: {
        fontSize: height/50,
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
        padding: height/100,
        justifyContent: "space-between",
        width: width*0.9,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width/20,
        paddingVertical: height/90,
        borderBottomWidth: height/1000,
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
        fontSize: height/50,
        color: 'gray',
        textAlign: 'center',
    },

});


export default Page;
