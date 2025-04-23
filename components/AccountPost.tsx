import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState} from "react";
import {doc, getDoc, deleteDoc, collection, getDocs, addDoc, setDoc, serverTimestamp} from "firebase/firestore";
import {auth,db} from "@/firebase";

interface Post {
    id: string;
    content: string;
}

interface PostCompProps {
    post: Post;
}



const AccountPost: React.FC<PostCompProps> = ({ post }) => {

    return (
        <View style={styles.contentView}>
            <Image source={{ uri: post.content }} />

            {/*<Text style={styles.contentText}>{post.content}</Text>*/}
        </View>
    );
};

const styles = StyleSheet.create({
    contentView: {
        height: 150,             // fixed height
        width: 123,              // fixed width (adjust as needed)
        backgroundColor: "grey",
        justifyContent: "center", // vertical centering
        alignItems: "center",     // horizontal centering
    },
    contentText: {
        textAlign: "center",
    },

});

export default AccountPost;
