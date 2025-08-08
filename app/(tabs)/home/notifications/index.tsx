import { Text, View, StyleSheet, FlatList, Dimensions,TouchableOpacity, Image } from "react-native";
import React, { useState, useEffect } from "react";
import { auth, db } from '@/firebase';
import firestore from '@react-native-firebase/firestore';
import { useRouter } from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Entypo from '@expo/vector-icons/Entypo';
import Feather from '@expo/vector-icons/Feather';
import {raw} from "express";

const { width, height } = Dimensions.get("window");

type FriendRequestType = {
    id: string;
    displayName: string;
    photoURL: string;
}

type GroupRequestType = {
    id: string,
    name: string;
}

const Page = () => {
    const user = auth().currentUser;
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
            const userReference = await db
                .collection("users")
                .doc(user.uid)
                .get();

            const userData = userReference.data();
            if (!userReference.exists() || !userData) return;

            const incomingGroupRequests: string[] = userData.groupRequests;

            try {
                const rawGroupRequests = await Promise.all(
                    incomingGroupRequests.map(async (groupID) => {
                        const groupReference = await db
                            .collection("groups")
                            .doc(groupID)
                            .get();

                        const groupData = groupReference.data();
                        if (!groupData || !groupReference.exists()) return;
                        return {
                            id:   groupID,
                            name: groupReference.exists()
                                ? (groupData.name as string)
                                : "Unknown",
                        };
                    })
                );
                const validGroupRequests = rawGroupRequests.filter((p): p is GroupRequestType => p !== null);
                setGroupRequests(validGroupRequests);
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
            const userReference = await db
                .collection("users")
                .doc(user.uid)
                .get();

            const userData= userReference.data();
            if (!userReference.exists() || !userData) return;
            const friendRequests: string[] = userData.friendRequests;

            try {
                const rawFriendRequests = await Promise.all(
                    friendRequests.map(async (friendID) => {
                    const friendReference = await db
                        .collection("users")
                        .doc(friendID)
                        .get();

                    const friendData = friendReference.data();
                    if (!friendReference.exists() || !friendData) return;
                    return {id: friendID, displayName: friendData.displayName, photoURL: friendData.photoURL};
                }))
                const validFriendRequests = rawFriendRequests.filter((p): p is FriendRequestType => p !== null);

                setFriendRequests(validFriendRequests);
            } catch (err) {
                console.error(err);
            }
        } catch (err) {
            console.error(err);
        }
    };




    const acceptGroupInvite = async (groupID: string) => {
        if (!user) return;
        try {
            const groupReference =  db
                .collection("groups")
                .doc(groupID)

            const groupSnapshot = await groupReference.get();
            const groupData = groupSnapshot.data();

            if (!groupSnapshot.exists() || !groupData) return;

            try {
                const groupName = groupData.name;
                addGroupUserSide(groupID, groupName).catch((err) => {
                    console.error(err);
                });
                addGroupCollectionSide(groupID).catch((err) => {
                    console.error(err);
                });
                removeGroupInvite(groupID).catch((err) => {
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

        const userGroupReference = db
            .collection("users")
            .doc(user.uid)
            .collection("groups")
            .doc(groupID);

        try {
            await userGroupReference.set({
                name: groupName,
                timestamp: firestore.FieldValue.serverTimestamp(),
                favorite: false
            });

        } catch (error) {
            console.error(error);
        }
    };

    const addGroupCollectionSide = async (groupID: string) => {
        if (!user) return;

        const groupUserReference = db
            .collection("groups")
            .doc(groupID)
            .collection("users")
            .doc(user.uid);

        try {
            await groupUserReference.set({
                name: user.displayName,
                timestamp: firestore.FieldValue.serverTimestamp(),
            });
        } catch (err) {
            console.error(err);
        }
    };




    const acceptFriend = async (friendID: string) => {
        if (!user) return;

        try {


            const userUpdateReference = db.collection("users").doc(user.uid).collection("friends").doc();
            const friendUpdateReference = db.collection("users").doc(friendID).collection("friends").doc(user.uid);

            try {
                const friendData = { timestamp: firestore.FieldValue.serverTimestamp(),};
                await userUpdateReference.set(friendData);
                await friendUpdateReference.set(friendData);
                await removeFriendRequest(friendID);

            } catch (error) {
                console.error("Error accepting friend request: ", error);
            }
        }
        catch (error) {
            console.error(error);
        }
    };

    const removeFriendRequest = async (friendID: string) => {
        if (!user) return;

        const userReference = db
            .collection("users")
            .doc(user.uid);

        const userSnapshot = await userReference.get();
        const userData = userSnapshot.data();

        if (!userSnapshot.exists() || !userData) return;

        try {
            const currentRequests: string[] = userData.friendRequests || [];
            const updatedRequests = currentRequests.filter(id => id !== friendID);

            await userReference.update({
                friendRequests: updatedRequests
            });
            await fetchFriendRequestsAndUsernames();

        } catch (error) {
            console.error("Error removing friend request: ", error);
        }
    };

    const removeGroupInvite = async (groupID: string) => {
        if (!user) return;

        const userReference = db
            .collection("users")
            .doc(user.uid);

        const userSnapshot = await userReference.get();
        const userData = userSnapshot.data();
        if (!userSnapshot.exists() || !userData) return;

        try {
            const currentRequests: string[] = userData.groupRequests || [];
            const updatedRequests = currentRequests.filter(id => id !== groupID);

            await userReference.update({
                groupRequests: updatedRequests
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
                    <MaterialIcons name="arrow-back-ios-new" size={height/40} color="#D3D3FF" />
                </TouchableOpacity>
                {user &&
                    <View style={styles.titleCardView}>
                        <Text style={styles.topBarName}>
                            {user.displayName}
                        </Text>
                    </View>
                }

            </View>



            <FlatList
                data={friendRequests}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <View style={styles.listContainer}>
                        <TouchableOpacity style={styles.nameContainer} onPress={() => router.push({pathname: '/accountPage/account', params: {friendID: item.id}})}>
                            <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                            <Text style={styles.userName}>
                                {item.displayName}
                            </Text>
                            <Text style={styles.greyText}>
                                Friend
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.buttonGroup}>
                            <TouchableOpacity onPress={() => acceptFriend(item.id)} style={styles.acceptButton}>
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
                            <Text style={styles.userName}>
                                {item.name}
                            </Text>
                            <Text style={styles.greyText}>
                                Group
                            </Text>
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
        justifyContent: 'space-between',
        paddingHorizontal: width/20,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height/18
    },
    topBarName: {
        color: '#D3D3FF',
        fontSize: height/60
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
