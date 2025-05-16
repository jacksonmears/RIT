import {View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions} from 'react-native';
import {auth, db} from '@/firebase';
import {useRouter} from "expo-router";
import React, {useEffect, useState} from "react";
import { getDocs, collection } from "firebase/firestore";
import Entypo from '@expo/vector-icons/Entypo';
import AnimatedGroupCard from "@/components/AnimatedGroupCard";

const { width, height } = Dimensions.get("window");

type GroupType = {
    id: string;
    name: string;
}

const Page = () => {
    const user = auth.currentUser;
    const [groups, setGroups] = useState<GroupType[] | []>([]);
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);


    useEffect(() => {
        getGroups().catch((err) => {
            console.error(err);
        })
    }, []);


    const getGroups = async () => {
        if (!user) return

        try {
            const querySnapshot = await getDocs(collection(db, "users", user.uid, "groups"));
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


    const refresh = async () => {
        setGroups([]);
        await getGroups();
        setRefreshing(false)
    }


    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <View style={styles.backArrowName}>
                    {user && <Text style={styles.topBarText}>{user.displayName}</Text>}
                </View>
                <TouchableOpacity onPress={() => router.push('/groups/groupCreate')}>
                    <Entypo name="add-to-list" size={24} color="#D3D3FF" />
                </TouchableOpacity>
            </View>

            <FlatList
                style={styles.groups}
                data={groups}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <AnimatedGroupCard
                        item={item}
                        index={index}
                    />
                )}
                refreshing={refreshing}
                onRefresh={refresh}
                ListEmptyComponent={<Text style={styles.noResults}>No results found</Text>}
            />
        </View>
    );

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
    backArrowName: {
        flexDirection: 'row',
        alignItems: "center",
    },
    topBarText: {
        color: "#D3D3FF",
    },
    groups: {
        marginTop: height/20,
        flex: 1,
        marginHorizontal: width/50,
    },
    header: {
        fontSize: height/33,
        fontWeight: "bold",
        color: "#D3D3FF",
        textAlign: "center",
        marginBottom: height/100,
    },
    noResults: {
        fontSize: height/50,
        color: 'gray',
        textAlign: 'center',
    },
});


export default Page;
