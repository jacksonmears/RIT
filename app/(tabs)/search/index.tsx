import {
    View,
    Text,
    TextInput,
    StyleSheet,
    FlatList,
    Dimensions,
} from 'react-native';
import {auth, db} from '@/firebase';
import React, { useState, useEffect } from 'react';
import AnimatedSearchCard from "@/components/AnimatedSearchCard";

const { width, height } = Dimensions.get("window");

type SearchType = {
    id: string,
    username: string,
    photoURL: string,
    firstName: string,
    lastName: string,
}

const Page = () => {
    const user = auth().currentUser;
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<SearchType[]>([]);



    useEffect(() => {
        searchUsers().catch((err) => {
            console.error(err);
        })
    }, [search]);


    const searchUsers = async () => {
        if (!user) return;

        try {
            const usersQuery = db
                .collection("displayName")
                .orderBy("lowerDisplayName")
                .startAt(search.toLowerCase())
                .endAt(search.toLowerCase()+'\uf8ff')
                .limit(10);


            const querySnapshot = await usersQuery.get();
            if (querySnapshot.empty) return;

            try {
                const rawFriendData = await Promise.all(
                    querySnapshot.docs.map(async (docSnapshot) => {
                        const friendID = docSnapshot.data().uid;
                        const friendReference = await db
                            .collection("users")
                            .doc(friendID)
                            .get();

                        const data = friendReference.data();
                        if (!friendReference.exists() || !data) return;

                        return {
                            id: friendID,
                            username: docSnapshot.data().displayName,
                            photoURL: data.photoURL,
                            firstName: data.firstName,
                            lastName: data.lastName,
                        };

                    })
                );
                const validFriendData = rawFriendData.filter((p): p is SearchType => p !== null);
                setSearchResults(validFriendData);

            } catch (err) {
                console.error(err);
            }
        } catch (error) {
            console.error("Error searching users:", error);
        }
    };








    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="search"
                    value={search}
                    onChangeText={setSearch}
                    placeholderTextColor={"grey"}

                />
            </View>



            <FlatList
                style={styles.resultsList}
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <AnimatedSearchCard
                        item={item}
                        index={index}
                    />
                )}
                ListEmptyComponent={
                    <Text style={styles.noResults}>
                        No results found
                    </Text>
                }
            />


        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        flex: 1,
    },
    searchContainer: {
        flexDirection: "row",
    },
    input: {
        flex: 1,
        marginTop: height/30,
        marginHorizontal: width/10,
        borderRadius: width/100,
        padding: height/75,
        backgroundColor: "white",
        fontSize: height*0.02,
        color: "black"
    },
    resultsList: {
        marginTop: height/30,
    },
    resultItem: {
        padding: height/40,
        borderBottomWidth: width/200,
        borderBottomColor: '#D3D3FF',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    resultText: {
        fontSize: width/25,
        color: 'white',
    },
    noResults: {
        fontSize: width/25,
        color: 'gray',
        textAlign: 'center',
    },
})

export default Page;
