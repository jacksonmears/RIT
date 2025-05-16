import {
    View,
    Text,
    StyleSheet,
    TextInput,
    Pressable,
    TouchableOpacity,
    FlatList,
    Image,
    Dimensions,
} from 'react-native';
import React, { useEffect, useState } from "react";
import { db, auth } from "@/firebase"
import {useRouter} from 'expo-router';
import { collection, addDoc, getDoc, doc, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import {Checkbox} from "react-native-paper";

const {width, height} = Dimensions.get("window");

type FriendType = {
    id: string;
    displayName: string;
    photoURL: string;
}

const Page = () => {
    const user = auth.currentUser;
    const router = useRouter();
    const [groupName, setGroupName] = useState("");
    const [selectedGroups, setSelectedGroups] = useState<Map<string, boolean> | null>(new Map());
    const [friendsID, setFriendsID] = useState<string[]>([]);
    const [friends, setFriends] = useState<FriendType[] | []>([]);


    useEffect(() => {
        const fetchFriendIds = async () => {
            if (!user) return;

            try {
                const friendSnap = await getDocs(collection(db, "users", user.uid, "friends"));
                let friendIds: string[] = [];
                friendSnap.forEach((doc) => {
                    friendIds.push(doc.id);
                });
                setFriendsID(friendIds);
            } catch (err) {
                console.error(err);
            }
        }
        fetchFriendIds().catch((err) => {
            console.error(err);
        });
    }, []);

    useEffect(() => {
        fetchFriends().catch((err) => {
            console.error(err);
        });
    }, [friendsID]);

    const fetchFriends = async () => {
        if (!user || !friendsID || friendsID.length === 0) return;

        try {
            const raw = await Promise.all(
                friendsID.map(async (f) => {
                    const docSnap = await getDoc(doc(db, "users", f));
                    if (!docSnap.exists()) return;

                    return {id: f, displayName: docSnap.data().displayName, photoURL: docSnap.data().photoURL};
                })
            )
            const validPosts = raw.filter((f): f is FriendType => f !== null);
            setFriends(validPosts);

        } catch (error) {
            console.error("Error fetching friends' data:", error);
        }
    };



    const createGroup = async () => {
        if (!user || groupName) return;
        try {
            const docRef = await addDoc(collection(db, "groups"), {
                name: groupName,
                timestamp: serverTimestamp(),
                creator: user.uid
            });

            await addGroupUserSide(docRef.id);
            await addGroupCollectionSide(docRef.id);


            return docRef.id;
        } catch (error) {
            console.error("Error creating group:", error);
        }
    }

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

    const addGroupUserSide = async (groupID: string) => {
        if (!user || !groupName) return;

        try {
            const docRef = doc(db, "users", user.uid, "groups", groupID);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) return;

            await setDoc(docRef, {
                name: groupName,
                timestamp: serverTimestamp(),
            });
        } catch (err) {
            console.error(err);
        }
    };

    const sendRequest = async (friend: string, groupID: string | undefined) => {
        if (!user || !friend  || !groupID) return;
         try{
            const docRef = doc(db, "users", friend);
            const docSnap = await getDoc(docRef);
            if (!docSnap.exists()) return;

            const groupRequests = docSnap.data().groupRequests;

            if (groupRequests.includes(friend)) return;

            if (docSnap.exists()) await setDoc(docRef, { groupRequests: [...groupRequests, groupID] }, { merge: true });
            else await setDoc(docRef, { groupRequests: [groupID] });
        } catch (err) {
             console.error(err);
         }
    }

    const addGroupCollectionSide = async (groupID: string) => {
        if (!user || !groupID) return;

        try {
            const colRef = collection(db, "groups", groupID, "users");

            await setDoc(doc(colRef, user.uid), {
                name: user.displayName,
                timestamp: serverTimestamp(),
            });
        } catch(err) {
            console.error(err);
        }
    };

    const completeGroup = async () => {
        if (!selectedGroups) return;

        try {
            const groupID = await createGroup()
            const selectedIds = [...selectedGroups.keys()];

            await Promise.all(selectedIds.map(id => sendRequest(id, groupID)));

            setFriends((prev) => prev ? prev.filter(friend => !selectedIds.includes(friend.id)) : []);

            setSelectedGroups(null);
            router.back()
        } catch (err) {
            console.error(err);
        }
    }




    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.backArrowName}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="x" size={height/50} color="#D3D3FF" />
                    </TouchableOpacity>
                    {user && <Text style={styles.topBarText}>{user.displayName}</Text>}
                </View>
                {groupName.length === 0 ?
                    <Ionicons name="send-outline" size={height/50} color="#D3D3FF" />
                    :
                    <TouchableOpacity onPress={() => completeGroup()}>
                        <Ionicons name="send" size={height/50} color="#D3D3FF" />
                    </TouchableOpacity>
                }
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

                            {selectedGroups && <Checkbox
                                status={selectedGroups.get(item.id) ? "checked" : "unchecked"}
                                onPress={() => toggleSelection(item.id)}
                            />}
                        </Pressable>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
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
    input: {
        padding: height/100,
        backgroundColor: "white",
        marginTop: height/40,
        marginHorizontal: width/12,
    },
    searchBarContainer: {
        flexDirection: "row",
    },
    groups: {
        flex: 1,
        marginTop: height/40
    },
    groupContainer: {
        justifyContent: "center",
        marginHorizontal: width/12,
    },
    groupRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: height/100,
        justifyContent: "space-between",
    },
    noResults: {
        fontSize: height/50,
        color: 'gray',
        textAlign: 'center',
    },
    avatar: {
        width: width/15,
        height: width/15,
        borderRadius: 999,
        marginRight: width/40,
    },
    listContent: {
        paddingBottom: height/20,
    },
    text: {
        color: "white",
    },
})

export default Page;
