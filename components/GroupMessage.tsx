import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState} from "react";
import {doc, getDoc, deleteDoc, collection, getDocs, addDoc, setDoc, serverTimestamp} from "firebase/firestore";
import {auth,db} from "@/firebase";

interface Post {
    content: string;
    userName: string;
}

interface PostCompProps {
    post: Post;
}



const GroupMessage: React.FC<PostCompProps> = ({ post }) => {
    const router = useRouter();
    const user = auth.currentUser;



    return (
        <View style={styles.container}>
            <Text style={styles.nameText}>{post.userName}</Text>
            <View style={styles.messageView}>
                <Text style={styles.messageText}>{post.content}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {

    },
    messageView: {
        justifyContent: "center",
        backgroundColor: "grey",
    },
    nameText: {
        color: "gold",
    },
    messageText: {
        color: "black",
    }

});

export default GroupMessage;
