import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {auth, db} from '@/firebase';
import React, {useEffect, useState} from "react";
import {useLocalSearchParams, useRouter, useNavigation} from "expo-router";
import { getDoc, doc } from "firebase/firestore";

const Page = () => {
    const user = auth.currentUser;
    const router = useRouter();
    const { postImported } = useLocalSearchParams();
    const post = String(postImported); // Convert content to string
    const [userName, setUsername] = useState('');
    const [caption, setCaption] = useState('');

    useEffect(() => {
        const getPost = async () => {
            if (!post || !user) return;
            const postInfo = await getDoc(doc(db, "posts", post));
            if (postInfo.exists()) {
                setCaption(postInfo.data().caption);
                const userInfo = await getDoc(doc(db, "users", postInfo.data().user));
                if (userInfo.exists()) setUsername(userInfo.data().displayName);
            }
        }

        getPost();
    }, []);




    return (
        <View style={styles.container}>
            <Text style={styles.backText}>{post}</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>back</Text>
            </TouchableOpacity>
            {/*<TouchableOpacity onPress={() => getPost()}>*/}
            {/*    <Text style={styles.backText}>see post</Text>*/}
            {/*</TouchableOpacity>*/}
        </View>
    );

}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    backText: {
        color: "white",
    },
    backButton: {
        color: "white",
        position: "absolute",
        top: 10,
        right: 20
    }

});


export default Page;
