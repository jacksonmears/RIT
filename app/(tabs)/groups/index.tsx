import {View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList} from 'react-native';
import { auth, db } from '@/firebase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Entypo from '@expo/vector-icons/Entypo';
import AnimatedGroupCard from '@/components/AnimatedGroupCard';
import SwipeableRow from "@/components/SwipeableRow";
const { width, height } = Dimensions.get("window");

type GroupType = {
    id: string;
    name: string;
    favorite: boolean;
};


const Page = () => {
    const user = auth().currentUser;
    const [userGroups, setUserGroups] = useState<GroupType[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchUserGroups().catch(console.error);
    }, []);

    const fetchUserGroups = async () => {
        if (!user) return;

        try {
            const querySnapshot = await db
                .collection("users")
                .doc(user.uid)
                .collection("groups")
                .get();

            const groupList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name,
                favorite: doc.data().favorite,
            }));

            groupList.sort((a, b) =>
                (b.favorite === a.favorite ? 0 : b.favorite ? 1 : -1)
            );

            setUserGroups(groupList);

        } catch (err) {
            console.error(err);
        }
    };

    const refresh = async () => {
        setUserGroups([]);
        await fetchUserGroups();
        setRefreshing(false);
    };

    const handleToggleFavorite = async (item: GroupType) => {
        setUserGroups(prevGroups =>
            prevGroups.map(group =>
                group.id === item.id ? { ...group, favorite: !group.favorite } : group
            )
        );

        try {
            await db
                .collection("users")
                .doc(user?.uid)
                .collection("groups")
                .doc(item.id)
                .update({ favorite: !item.favorite });

        } catch (error) {
            console.error("Error toggling favorite:", error);
            setUserGroups(prevGroups =>
                prevGroups.map(group =>
                    group.id === item.id ? { ...group, favorite: item.favorite } : group
                )
            );
        }
    };



    const handleDelete = async (item: GroupType) => {
        await db
            .collection("users")
            .doc(user?.uid)
            .collection("groups")
            .doc(item.id)
            .delete();

        setUserGroups(prev => prev.filter(group => group.id !== item.id));
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                {user && <Text style={styles.topBarText}>
                    {user.displayName}
                </Text>}

                <TouchableOpacity onPress={() => router.push('/groups/groupCreate')}>
                    <Entypo name="add-to-list" size={height/30} color="#D3D3FF" />
                </TouchableOpacity>
            </View>

            <FlatList
                data={userGroups}
                keyExtractor={(item) => item.id}
                refreshing={refreshing}
                onRefresh={refresh}
                contentContainerStyle={styles.groupContainer}
                renderItem={({ item, index }) => (
                    <SwipeableRow
                        item={item}
                        onFavorite={handleToggleFavorite}
                        onDelete={handleDelete}
                    >
                        <AnimatedGroupCard item={item} index={index} />
                    </SwipeableRow>
                )}
                ListEmptyComponent={
                    <Text style={styles.noResults}>
                        No groups found
                    </Text>
                }
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width / 20,
        borderBottomWidth: height / 1000,
        borderBottomColor: 'grey',
        alignItems: 'center',
        height: height / 18,
    },
    topBarText: {
        color: '#D3D3FF',
        fontSize: height / 50
    },
    noResults: {
        fontSize: height / 50,
        color: 'gray',
        textAlign: 'center',
    },
    groupContainer: {
      marginTop: height*0.02
    },
});

export default Page;
