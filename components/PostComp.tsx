import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import React, {useState} from "react";
import {doc, getDoc} from "firebase/firestore";
import {auth,db} from "@/firebase";

interface Post {
    id: string;
    content: string;
    caption: string;
    userName: string;
}

interface PostCompProps {
    post: Post;
}



const PostComp: React.FC<PostCompProps> = ({ post }) => {
    const router = useRouter();

    return (
        <View style={styles.postView}>
            <View style={styles.topBar}>
                <Text>{post.userName}</Text>
            </View>
            <View style={styles.contentView}>
                <Text>{post.content}</Text>
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
                <Text style={styles.userNameCaption}>{post.userName} </Text>
                <Text> {post.caption}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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

export default PostComp;
