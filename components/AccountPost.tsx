import { View, Text, Image, StyleSheet, TouchableOpacity, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState} from "react";
import {doc, getDoc, deleteDoc, collection, getDocs, addDoc, setDoc, serverTimestamp} from "firebase/firestore";
import {auth,db} from "@/firebase";
import Video from "react-native-video";


interface Post {
    id: string;
    content: string;
    mode: string;
}

interface PostCompProps {
    post: Post;
}



const AccountPost: React.FC<PostCompProps> = ({ post }) => {
    const { width, height } = useWindowDimensions();
    const itemWidth = width*33 / 100;
    const itemHeight = height / 5;
    const content = decodeURIComponent(post.content);

    return (
        <View style={[styles.contentView, { width: itemWidth, height: itemHeight }]}>
            {post.mode==="photo" ?
                <Image
                    source={{ uri: content }}
                    style={{ width: itemWidth, height: itemHeight }}
                    resizeMode="cover"
                />
            :
                <Video
                    source={{ uri: content }}
                    style={{ width: itemWidth, height: itemHeight }}
                    resizeMode={'cover'}
                    paused={true}
                />
            }

        </View>
    );
};

const styles = StyleSheet.create({
    contentView: {
        backgroundColor: "grey",
        justifyContent: "center", // vertical centering
        alignItems: "center",     // horizontal centering
    },
    contentText: {
        textAlign: "center",
    },
    videoContent: {

    }

});

export default AccountPost;
