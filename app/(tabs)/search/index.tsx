import {
    View,
    Text,
    Button,
    Pressable,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    FlatList,
    TouchableOpacity, Image
} from 'react-native';
import {auth, db} from '@/firebase';
import React, { useState, useEffect } from 'react';
import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    orderBy,
    startAt,
    endAt,
    limit,
    getDocs,
    FieldPath,
    documentId
} from "firebase/firestore";
import Animated, {
    useSharedValue,
    withTiming,
    useAnimatedStyle,
    withDecay, runOnJS, withDelay
} from 'react-native-reanimated';
import {useRouter} from 'expo-router';
import GroupPost from "@/components/GroupPost";
import GroupMessage from "@/components/GroupMessage";
import AnimatedSearchCard from "@/components/AnimatedSearchCard";
import {useIsFocused} from "@react-navigation/native";


const Page = () => {
    const user = auth.currentUser;
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<{ id: string, username: string, photoURL:string, firstName: string, lastName: string}[]>([]);
    const router = useRouter();
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [searchVersion, setSearchVersion] = useState(0);
    const isFocused = useIsFocused();


    const searchUsers = async () => {

        try {
            const usersRef = collection(db, "displayName");
            const q = query(
                usersRef,
                orderBy("lowerDisplayName"),
                startAt(search.toLowerCase()),
                endAt(search.toLowerCase() + '\uf8ff'), // End just after the search query
                limit(10)
            );


            const querySnapshot = await getDocs(q);
            const searchResults = await Promise.all(
                querySnapshot.docs.map(async (docSnapshot) => {
                    const userId = docSnapshot.data().uid;
                    const friendDoc = await getDoc(doc(db, "users", userId));
                    if (friendDoc.exists()) {
                        return {
                            id: userId,
                            username: docSnapshot.data().displayName,
                            photoURL: friendDoc.data().photoURL,
                            firstName: friendDoc.data().firstName,
                            lastName: friendDoc.data().lastName,
                        };
                    } else {
                        return {
                            id: userId,
                            username: docSnapshot.data().displayName,
                            photoURL: null,
                            firstName: "failed",
                            lastName: "failed"
                        }
                    }

                })
            );

            setSearchResults(searchResults);
            // setSearchVersion(v => v+1);

        } catch (error) {
            console.error("Error searching users:", error);
            return [];
        }
    };

    // useEffect(() => {
    //     searchUsers();
    //
    // }, [search]);


    // useEffect(() => {
    //     if (isFocused) {
    //         setSearchResults([]);
    //         searchUsers();
    //
    //     } else {
    //         setSearchResults([]);
    //     }
    // }, [isFocused]);
    //
    // useEffect(() => {
    //     console.log(search)
    // }, [search]);

    useEffect(() => {
        searchUsers()
    }, [search]);


    // useEffect(() => {
    //     const handler = setTimeout(() => {
    //         setDebouncedSearch(search);
    //     }, 200);             // ← 300 ms buffer
    //     return () => clearTimeout(handler);
    // }, [search]);
    //
    // useEffect(() => {
    //     searchUsers();
    // }, [debouncedSearch]);



    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="search"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>



            <FlatList
                style={styles.resultsList}
                data={searchResults}
                extraData={searchVersion}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <AnimatedSearchCard
                        // key={`${search}-${item.id}`}
                        item={item}
                        index={index}
                        version={searchVersion}
                    />
                )}
                ListEmptyComponent={<Text style={styles.noResults}>No results found</Text>}
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
        marginTop: 20,
        marginHorizontal: 40,
        borderRadius: 4,
        padding: 10,
        backgroundColor: "white",
    },
    resultsList: {
        marginTop: 20,
    },
    resultItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#D3D3FF',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    resultText: {
        fontSize: 16,
        color: 'white',
    },
    noResults: {
        fontSize: 16,
        color: 'gray',
        textAlign: 'center',
    },
})

export default Page;
