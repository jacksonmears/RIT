import { Text, View, StyleSheet, FlatList, Dimensions,TouchableOpacity, Image } from "react-native";
import React, { useState, useEffect } from "react";
import { auth, db } from '@/firebase';
import {doc, getDoc, updateDoc, arrayRemove, serverTimestamp, setDoc, collection} from "firebase/firestore";
import { useRouter } from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';

const { width, height } = Dimensions.get("window");

type FriendRequestType = {
    id: string;
    name: string;
    photoURL: string;
}

type GroupRequestType = {
    id: string,
    name: string;
}

const Page = () => {
    const user = auth.currentUser;
    const router = useRouter();
    const [groupRequests, setGroupRequests] = useState<GroupRequestType[] | []>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequestType[] | []>([]);

    useEffect(() => {
        fetchFriendRequestsAndUsernames().catch((err) => {
            console.error("Error fetching friendRequests for user", err);
        });
        fetchGroupRequests().catch((err) => {
            console.error("Error fetching groupRequests for user", err);
        });
    }, []);

    const fetchGroupRequests = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) return;

            const incomingIds: string[] = userDoc.data().groupRequests || [];

            try {
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
            } catch (err) {
                console.error("Error fetching groupRequests for user", err);
            }
        } catch (err) {
            console.error(err);
        }
    };



    const fetchFriendRequestsAndUsernames = async () => {
        if (!user) return;

        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (!userDoc.exists()) return;
            const friendRequests: string[] = userDoc.data().friendRequests || [];

            try {
                const raw = await Promise.all(friendRequests.map(async (friend) => {
                    const friendDoc = await getDoc(doc(db, "users", friend));
                    if (!friendDoc.exists()) return;
                    return {id: friend, name: friendDoc.data().displayName, photoURL: friendDoc.data().photoURL};
                }))
                const validPosts = raw.filter((p): p is FriendRequestType => p !== null);

                setFriendRequests(validPosts)
            } catch (err) {
                console.error(err);
            }
        } catch (err) {
            console.error(err);
        }
    };




    const acceptGroupInvite = async (groupId: string) => {
        if (!user) return;
        try {
            const groupNameRef = doc(db, "groups", groupId);
            const docSnap = await getDoc(groupNameRef);
            if (!docSnap.exists()) return;

            try {
                const groupName = docSnap.data().name;
                addGroupUserSide(groupId, groupName).catch((err) => {
                    console.error(err);
                });
                addGroupCollectionSide(groupId).catch((err) => {
                    console.error(err);
                });
                removeGroupInvite(groupId).catch((err) => {
                    console.error(err);
                });
                fetchGroupRequests().catch((err) => {
                    console.error(err);
                });
            } catch (err) {
                console.error(err);
            }
        } catch (err) {
            console.error(err);
        }

    }



    const addGroupUserSide = async (groupID: string, groupName: string) => {
        if (!user) return;

        const docRef = doc(db, "users", user.uid, "groups", groupID);

        try {
            await setDoc(docRef, {
                name: groupName,
                timestamp: serverTimestamp(),
            });

        } catch (error) {
            console.error(error);
        }
    };

    const addGroupCollectionSide = async (groupID: string) => {
        if (!user) return;

        const colRef = collection(db, "groups", groupID, "users");
        try {
            await setDoc(doc(colRef, user.uid), {
                name: user.displayName,
                timestamp: serverTimestamp(),
            });
        } catch (err) {
            console.error(err);
        }
    };




    const acceptFriend = async (displayName: string) => {
        if (user) {
            const friendRef = await getDoc(doc(db, "displayName", displayName));
            let friend = '';
            if (friendRef.exists()) friend = friendRef.data().uid;


            const userFriendDocRef = doc(db, "users", user.uid, "friends", friend);
            const friendFriendDocRef = doc(db, "users", friend, "friends", user.uid);

            try {
                const friendData = { timestamp: serverTimestamp() };
                await setDoc(userFriendDocRef, friendData);
                await setDoc(friendFriendDocRef, friendData);
                await removeFriendRequest(friend);

            } catch (error) {
                console.error("Error accepting friend request: ", error);
            }
        }
    };

    const removeFriendRequest = async (friend: string) => {
        if (!user) return;

        const docRef = doc(db, "users", user.uid);
        try {
            await updateDoc(docRef, {
                friendRequests: arrayRemove(friend)
            });
            await fetchFriendRequestsAndUsernames();

        } catch (error) {
            console.error("Error removing friend request: ", error);
        }
    };

    const removeGroupInvite = async (groupID: string) => {
        if (!user) return;

        const docRef = doc(db, "users", user.uid);
        try {
            await updateDoc(docRef, {
                groupRequests: arrayRemove(groupID)
            });
            await fetchGroupRequests();

        } catch (error) {
            console.error("Error removing group request: ", error);
        }

    };

    return (
        <View style={styles.container}>

            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back-ios-new" size={height/50} color="#D3D3FF" />
                </TouchableOpacity>
                {user &&
                    <View style={styles.titleCardView}>
                        <Text style={styles.topBarName}>{user.displayName}</Text>
                    </View>
                }

            </View>



            <FlatList
                data={friendRequests}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.listContainer}>
                        <TouchableOpacity style={styles.nameContainer} onPress={() => router.push({pathname: '/home/notifications/accountPage', params: {friendID: item.id}})}>
                            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                            <Text style={styles.userName}>{item.name}</Text>
                            <Text style={styles.greyText}>Friend</Text>
                        </TouchableOpacity>

                        <View style={styles.buttonGroup}>
                            <TouchableOpacity onPress={() => acceptFriend(item.name)} style={styles.acceptButton}>
                                <Entypo name="check" size={24} color="green" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeFriendRequest(item.id)} style={styles.declineButton}>
                                <Feather name="x" size={24} color="red" />
                            </TouchableOpacity>
                        </View>
                    </View>

                )}
                style={{ flexGrow: 0 }}
            />

            <FlatList
                data={groupRequests}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.listContainer}>
                        <View style={styles.nameContainer}>
                            <Text style={styles.userName}>{item.name}</Text>
                            <Text style={styles.greyText}>Group</Text>
                        </View>

                        <View style={styles.buttonGroup}>
                            <TouchableOpacity onPress={() => acceptGroupInvite(item.id)} style={styles.acceptButton}>
                                <Entypo name="check" size={24} color="green" />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => removeGroupInvite(item.id)} style={styles.declineButton}>
                                <Feather name="x" size={24} color="red" />
                            </TouchableOpacity>
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
    },
    topBar: {
        flexDirection: 'row',
        paddingVertical: height/90,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
        paddingHorizontal: width/50,
    },
    topBarName: {
        color: '#D3D3FF',
    },
    titleCardView: {
        flexDirection: 'row',
    },
    userName: {
        fontSize: height/50,
        color: '#D3D3FF',
    },
    listContainer: {
        alignSelf: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: width,
        paddingVertical: height/90,
        paddingHorizontal: width/12,
    },
    nameContainer: {
        flexDirection: 'row',
        alignItems: "center",
    },
    buttonGroup: {
        flexDirection: "row",
    },
    acceptButton: {
        padding: width/90,
        borderRadius: width/50,
    },
    declineButton: {
        padding: width/90,
        borderRadius: width/50,
        marginLeft: width/40,
    },
    greyText: {
        color: 'grey',
        fontSize: height/100,
        marginTop: height/75,
        marginLeft: width/150
    },
    avatar: {
        width: width/17,
        height: width/17,
        borderRadius: 999,
        marginRight: width/75,
    },
});

export default Page;
