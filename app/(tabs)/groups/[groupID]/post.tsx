import { View, Text, Button, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import {auth, db} from '@/firebase';
import React, {useEffect, useState} from "react";
import {useLocalSearchParams, useRouter, useNavigation} from "expo-router";
import { getDoc, doc } from "firebase/firestore";

const Page = () => {
    const user = auth.currentUser;
    const router = useRouter();
    const { groupID, idT, contentT, captionT, userNameT } = useLocalSearchParams();
    const groupId = String(groupID);
    const id = String(idT); // Convert content to string
    const content = String(contentT); // Convert content to string
    const caption = String(captionT); // Convert content to string
    const userName = String(userNameT); // Convert content to string


    useEffect(() => {
        console.log(id, content, caption, userName);
    }, []);



    return (
        <View style={styles.container}>
            <View style={styles.contentView}>
                <Text style={styles.contentText}>{content}</Text>
            </View>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        position: 'relative',
    },
    contentView: {
        flex: 1,
        backgroundColor: "black",
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    contentText: {
        color: 'gold',
        fontSize: 18,
        textAlign: 'center',
    },
    backButton: {
        position: 'absolute',
        top: 20, // Adjust for status bar / notch
        left: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 8,
    },
    backText: {
        color: 'white',
        fontSize: 16,
    },
});

export default Page;
