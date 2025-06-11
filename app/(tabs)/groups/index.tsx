import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { auth, db } from '@/firebase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Entypo from '@expo/vector-icons/Entypo';
import { SwipeListView } from 'react-native-swipe-list-view';
import AnimatedGroupCard from '@/components/AnimatedGroupCard';
import AntDesign from '@expo/vector-icons/AntDesign';
const { width, height } = Dimensions.get("window");

type GroupType = {
    id: string;
    name: string;
    favorite: boolean;
};


const Page = () => {
    const user = auth().currentUser;
    const [groups, setGroups] = useState<GroupType[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();
    const [openRowKey, setOpenRowKey] = useState<string | null>(null);

    useEffect(() => {
        getGroups().catch(console.error);
    }, []);

    const getGroups = async () => {
        if (!user) return;

        try {
            const querySnapshot = await db()
                .collection("users")
                .doc(user.uid)
                .collection("groups")
                .get();

            const groupList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                name: doc.data().name || "Unnamed Group",
                favorite: doc.data().favorite,
            }));

            groupList.sort((a, b) => (b.favorite === a.favorite ? 0 : b.favorite ? 1 : -1));

            setGroups(groupList);

        } catch (err) {
            console.error(err);
        }
    };

    const refresh = async () => {
        setOpenRowKey(null);
        setGroups([]);
        await getGroups();
        setRefreshing(false);
    };

    const handleFavorite = async (item: GroupType) => {
        setGroups(prevGroups =>
            prevGroups.map(group =>
                group.id === item.id ? { ...group, favorite: !group.favorite } : group
            )
        );

        try {
            await db()
                .collection("users")
                .doc(user?.uid)
                .collection("groups")
                .doc(item.id)
                .update({ favorite: !item.favorite });
        } catch (error) {
            console.error("Error toggling favorite:", error);
            setGroups(prevGroups =>
                prevGroups.map(group =>
                    group.id === item.id ? { ...group, favorite: item.favorite } : group
                )
            );
        }
    };



    const handleDelete = async (item: GroupType) => {
        await db()
            .collection("users")
            .doc(user?.uid)
            .collection("groups")
            .doc(item.id)
            .delete();
        setGroups(prev => prev.filter(group => group.id !== item.id));
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                {user && <Text style={styles.topBarText}>{user.displayName}</Text>}
                <TouchableOpacity onPress={() => router.push('/groups/groupCreate')}>
                    <Entypo name="add-to-list" size={24} color="#D3D3FF" />
                </TouchableOpacity>
            </View>

            <SwipeListView
                style={styles.groupContainer}
                data={groups}
                keyExtractor={(item) => item.id}
                refreshing={refreshing}
                onRefresh={refresh}
                onRowOpen={(rowKey) => setOpenRowKey(rowKey)}
                onRowClose={() => setOpenRowKey(null)}
                renderItem={({ item, index }) => (
                    <AnimatedGroupCard item={item} index={index} />
                )}
                renderHiddenItem={({ item }) => {
                    const isOpen = openRowKey === item.id;

                    return (
                        <View style={[styles.rowBack, { opacity: isOpen ? 1 : 0 }]}>
                            {/* your buttons */}
                            <TouchableOpacity
                                style={[styles.backRightBtn, styles.backRightBtnLeft]}
                                onPress={() => handleFavorite(item)}
                            >
                                <AntDesign
                                    name={item.favorite ? "star" : "staro"}
                                    size={24}
                                    color={item.favorite ? "yellow" : "white"}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.backRightBtn, styles.backRightBtnRight]}
                                onPress={() => handleDelete(item)}
                            >
                                <Text style={styles.backTextWhite}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}

                rightOpenValue={-130}
                disableRightSwipe
                ListEmptyComponent={
                    <Text style={styles.noResults}>No results found</Text>
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
        height: height / 20,
    },
    topBarText: {
        color: '#D3D3FF',
    },
    noResults: {
        fontSize: height / 50,
        color: 'gray',
        textAlign: 'center',
    },
    groupContainer: {
      marginTop: height*0.02
    },
    rowBack: {
        alignItems: 'center',
        backgroundColor: 'black',
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingRight: 15,
        marginVertical: 8,
        marginHorizontal: width / 50,
        borderRadius: 10,
    },
    backRightBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        width: width*0.12,
        height: '80%',
        marginLeft: 5,
        borderRadius: 10,
    },
    backRightBtnLeft: {
    },
    backRightBtnRight: {
        backgroundColor: 'red',
    },
    backTextWhite: {
        fontWeight: 'bold',
        fontSize: 18,
    },
});

export default Page;
