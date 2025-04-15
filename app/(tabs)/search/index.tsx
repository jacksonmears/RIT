import {
    View,
    Text,
    Button,
    Pressable,
    TextInput,
    StyleSheet,
    KeyboardAvoidingView,
    FlatList,
    TouchableOpacity
} from 'react-native';
import {auth, db} from '@/firebase';
import { useState, useEffect } from 'react';
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
import {useRouter} from 'expo-router';

const Page = () => {
    const user = auth.currentUser;
    const [search, setSearch] = useState('');
    const [searchResults, setSearchResults] = useState<{ username: string, uid: string }[]>([]);
    const router = useRouter();


    // const handleSearch = async () => {
    //     setFound('');
    //     if (search == user?.displayName){
    //         return;
    //     } else {
    //         const docRef = doc(db, "displayName", search);
    //         const docSnap = await getDoc(docRef);
    //         docSnap.exists() ? setFound(docSnap.data().uid) : setFound('');
    //         console.log(docSnap.data());
    //     }
    // }




    const searchUsers = async () => {
        // if (!search) return [];

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
            const searchResults = querySnapshot.docs.map(doc => ({
                username: doc.data().displayName,
                uid: doc.data().uid
            }));

            setSearchResults(searchResults);
            console.log("Search Results:", searchResults);

        } catch (error) {
            console.error("Error searching users:", error);
            return [];
        }
    };

    useEffect(() => {
        searchUsers(); // Trigger the search whenever search state changes
    }, [search]); // This effect runs when 'search' state changes







    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="search"
                    value={search}
                    onChangeText={setSearch}
                />
                <Pressable onPress={() => searchUsers()} style={styles.searchButton}>
                    <Text> Search </Text>
                </Pressable>
            </View>

            <FlatList
                data={searchResults}
                keyExtractor={(item, index) => index.toString()} // Key for each item
                renderItem={({ item }) => (
                    <View style={styles.resultItem}>
                        {/*{*/}
                        {/*    !myFriendsUIDs.includes(item.uid) && (*/}
                        {/*        <TouchableOpacity style={styles.friendReqButton} onPress={() => sendRequest(item.username)}>*/}
                        {/*            <Text style={styles.resultText}>add friend</Text>*/}
                        {/*        </TouchableOpacity>*/}
                        {/*    )*/}
                        {/*}*/}

                        <TouchableOpacity style={styles.friendReqButton} onPress={() =>  router.push({ pathname: "/search/accountPage", params: { friendID: item.uid }})}>
                            {/*<Text style={styles.resultText}>see friend</Text>*/}
                            <Text style={styles.resultText}>{item.username}</Text>

                        </TouchableOpacity>

                    </View>
                )}
                style={styles.resultsList}
                ListEmptyComponent={
                    <Text style={styles.noResults}>No results found</Text>
                }
            />



            {/*<Pressable onPress={sendRequest} style={styles.reqButton}>*/}
            {/*    <Text> add {found} </Text>*/}
            {/*</Pressable>*/}

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        flex: 1,
        justifyContent: "flex-start",
    },
    searchContainer: {
        flexDirection: "row",
    },
    input: {
        flex: 1,
        marginTop: 20,
        marginRight: 5,
        marginLeft: 40,
        borderRadius: 4,
        padding: 10,
        backgroundColor: "white",
    },
    searchButton: {
        justifyContent: "center",
        backgroundColor: "white",
        borderRadius: 4,
        marginRight: 40,
        marginTop: 20
    },
    resultsList: {
        marginTop: 20,
    },
    resultItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'gold',
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
    friendReqButton: {
        borderRadius: 4,
        padding: 1,
    }
})

export default Page;
