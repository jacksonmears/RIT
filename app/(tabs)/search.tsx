import {View, Text, Button, Pressable, TextInput, StyleSheet} from 'react-native';
import {auth, db} from '@/firebase';
import { useState, useEffect } from 'react';
import {doc, getDoc, setDoc } from "firebase/firestore";

const Page = () => {
    const user = auth.currentUser;
    const [search, setSearch] = useState('');
    const [found, setFound] = useState('');


    const handleSearch = async () => {
        setFound('');
        if (search == user?.displayName){
            return;
        } else {
            const docRef = doc(db, "displayName", search);
            const docSnap = await getDoc(docRef);
            docSnap.exists() ? setFound(docSnap.data().uid) : setFound('');
            console.log(docSnap.data());
        }
    }


    const sendRequest = async () => {
        if (user){
            const docRef = doc(db, "users", found);
            const docSnap = await getDoc(docRef);
            const requests = docSnap.data()?.requests || [];

            if (requests.includes(user.uid)){
                console.log("Friend request already sent!");
                return;
            }

            if (docSnap.exists()) {
                await setDoc(docRef, { requests: [...requests, user.uid] }, { merge: true });
            } else {
                await setDoc(docRef, { requests: [user.uid] });
            }
        }
    }



    return (
        <View style={styles.container}>
            <Text> Search Page ! </Text>
            <TextInput
                style={styles.input}
                placeholder="friends name"
                placeholderTextColor="#ccc"
                value={search}
                onChangeText={setSearch}
            />
            <Pressable onPress={handleSearch} style={styles.button}>
                <Text> Search for friends </Text>
            </Pressable>

            <Pressable onPress={sendRequest} style={styles.reqButton}>
                <Text> add {found} </Text>
            </Pressable>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    t: {
        color: "white",
    },
    input: {
        marginVertical: 4,
        marginHorizontal: 40,
        borderWidth: 1,
        borderRadius: 4,
        padding: 20,
        backgroundColor: "white",
        fontSize: 30,
    },
    button: {
        marginVertical: 4,
        marginHorizontal: 40,
        position: "absolute",
        backgroundColor: "white",
        borderRadius: 4,
        top: 50,
        left: 50,
    },
    reqButton: {
        marginVertical: 4,
        marginHorizontal: 40,
        position: "absolute",
        backgroundColor: "white",
        borderRadius: 4,
        top: 500,
        left: 50,
    }
})

export default Page;
