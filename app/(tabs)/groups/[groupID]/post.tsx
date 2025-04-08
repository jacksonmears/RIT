import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {auth, db} from '@/firebase';
import React, {useEffect, useState} from "react";
import {useLocalSearchParams, useRouter, useNavigation} from "expo-router";
import { getDoc, doc } from "firebase/firestore";

const Page = () => {
    const user = auth.currentUser;
    const router = useRouter();
    const { idT, contentT, captionT, userNameT } = useLocalSearchParams();
    const id = String(idT); // Convert content to string
    const content = String(contentT); // Convert content to string
    const caption = String(captionT); // Convert content to string
    const userName = String(userNameT); // Convert content to string


    useEffect(() => {
        console.log(id, content, caption, userName);
    }, []);





    return (
        <View style={styles.container}>
            <Text style={styles.backText}>post page</Text>
            <Text style={styles.backText}>{id}</Text>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>back</Text>
            </TouchableOpacity>
            {/*<TouchableOpacity onPress={() => getPost()}>*/}
            {/*    <Text style={styles.backText}>see post</Text>*/}
            {/*</TouchableOpacity>*/}

            <View style={styles.postView}>
                <View style={styles.topBar}>
                    <Text>{userName}</Text>
                </View>
                <View style={styles.contentView}>
                    <Text>{content}</Text>
                </View>
                <View style={styles.bottomBar}>
                    <View>
                        <Text>like </Text>
                    </View>
                    <View>
                        <Text> comment</Text>
                    </View>
                </View>
                <View style={styles.captionBar}>
                    <Text style={styles.userNameCaption}>{userName} </Text>
                    <Text> {caption}</Text>
                </View>
            </View>

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
    },
    postView: {
        justifyContent: "center",
        top: 40
    },
    topBar: {
        backgroundColor: "white",
        padding: 20,
    },
    contentView: {
        backgroundColor: "grey",
        padding: 100
    },
    bottomBar: {
        backgroundColor: "white",
        padding: 20,
        flexDirection: "row",
    },
    captionBar: {
        backgroundColor: "grey",
        padding: 20,
        flexDirection: "row",
    },
    userNameCaption: {
        fontWeight: "bold",
    }

});


export default Page;
