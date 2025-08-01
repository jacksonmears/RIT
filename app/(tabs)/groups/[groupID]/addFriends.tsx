import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Pressable,
    Image,
    Dimensions,
} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import React, {useCallback, useEffect, useState} from "react";
import { auth, db } from "@/firebase";
import {Checkbox} from "react-native-paper";
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

const {width, height} = Dimensions.get("window");

type FriendType = {
    id: string;
    displayName: string;
    photoURL: string;
}

const Page = () => {
    const router = useRouter();
    const user = auth().currentUser;
    const { groupID, groupName } = useLocalSearchParams();
    const groupIDString = String(groupID);
    const groupNameString = String(groupName);
    const [friendsID, setFriendsID] = useState<string[] | null>([]);
    const [friends, setFriends] = useState<FriendType[] | []>([]);
    const [selectedGroups, setSelectedGroups] = useState<Map<string, boolean> | null>(new Map());

    useEffect(() => {
        const fetchFriendIds = async () => {
            if (!user) return;

            try {
                const friendSnap = await db
                    .collection("users")
                    .doc(user.uid)
                    .collection("friends")
                    .get();

                if (friendSnap.empty) return;

                setFriendsID(friendSnap.docs.map((doc) => doc.id));
            } catch (err) {
                console.error(err);
            }
        }
        fetchFriendIds().catch((err) => {
            console.error(err);
        });
    }, []);




    const fetchFriends = useCallback(async () => {
        if (!user || !friendsID || friendsID.length === 0) return;

        try {
            const friendUsernames: FriendType[] = [];
            for (const friendID of friendsID) {
                const friendUserReference = await db
                    .collection("users")
                    .doc(friendID)
                    .get();

                const friendGroupReference = await db
                    .collection("groups")
                    .doc(groupIDString)
                    .collection("users")
                    .doc(friendID)
                    .get();

                const data = friendUserReference.data();
                if (!friendGroupReference.exists() && friendUserReference.exists() && data && !data.groupRequests.includes(groupIDString)) {
                    friendUsernames.push({id: friendID, displayName: data.displayName, photoURL: data.photoURL});
                }
            }
            setFriends(friendUsernames);
        } catch (error) {
            console.error("Error fetching friends' data:", error);
        }
    }, [user, friendsID]);

    useEffect(() => {
        fetchFriends().catch((err) => {
            console.error(err);
        });
    }, [friendsID]);

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

    const completedAddingFriends = async (selectedGroups: Map<string, boolean> | null) => {
        if (!selectedGroups) return;

        try {
            const selectedIds = [...selectedGroups.keys()];

            await Promise.all(selectedIds.map(id => sendRequest(id)));

            setFriends((prev) => prev ? prev.filter(friend => !selectedIds.includes(friend.id)) : []);

            setSelectedGroups(null);
            router.back()
        } catch (error) {
            console.error(error);
        }
    };





    const sendRequest = async (friend: string) => {
        if (!user || !friend) return;

        try {
            const friendReference = db
                .collection("users")
                .doc(friend);

            const friendSnapShot = await friendReference.get();
            const friendData = friendSnapShot.data();
            if (!friendSnapShot.exists() || !friendData) return;
            const groupRequests = friendData.groupRequests;

            if (groupRequests.includes(friend)) return;

            if (friendSnapShot.exists()) await friendReference.set({ groupRequests: [...groupRequests, groupIDString] }, { merge: true });
            else await friendReference.set({ groupRequests: [groupIDString] });
        } catch (error) {
            console.error(error);
        }
    }


    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.flexDirectionRow}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Feather name="x" size={height/50} color="#D3D3FF" />
                    </TouchableOpacity>
                    <Text style={styles.topBarText}>{groupNameString}</Text>
                </View>
                    {selectedGroups && selectedGroups.size===0 ?
                        <Ionicons name="send-outline" size={height/50} color="#D3D3FF" />
                        :
                        <TouchableOpacity onPress={() => completedAddingFriends(selectedGroups)}>
                            <Ionicons name="send" size={height/50} color="#D3D3FF" />
                        </TouchableOpacity>
                    }

            </View>


            <FlatList
                style={styles.groups}
                data={friends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.groupContainer}>
                        <Pressable onPress={() => toggleSelection(item.id)} style={styles.groupRow}>
                            <View style={styles.flexDirectionRow}>
                                <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                                <Text style={styles.username}>{item.displayName}</Text>
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
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
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
    flexDirectionRow: {
        flexDirection: 'row',
        alignItems: "center",
    },
    groups: {
        flex: 1,
    },
    groupContainer: {
        justifyContent: "center",
        marginHorizontal: width/10,
    },
    groupRow: {
        flexDirection: "row",
        alignItems: "center",
        padding: height/75,
        borderBottomWidth: 1,
        justifyContent: "space-between",
    },
    avatar: {
        width: width/15,
        height: width/15,
        borderRadius: 999,
        marginRight: width/40,
    },
    username: {
        color: "white",
    },
    listContent: {
        marginBottom: height/20,
    },
    noResults: {
        marginTop: height/50,
        fontSize: height/60,
        color: 'gray',
        textAlign: 'center',
    },
});

export default Page;
