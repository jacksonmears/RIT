import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState} from "react";
import {doc, getDoc, deleteDoc, collection, getDocs, addDoc, setDoc, serverTimestamp} from "firebase/firestore";
import {auth,db} from "@/firebase";

interface Post {
    groupID: string;
    id: string;
    content: string;
    caption: string;
    userName: string;
}

interface PostCompProps {
    post: Post;
}



const GroupPost: React.FC<PostCompProps> = ({ post }) => {
    const router = useRouter();
    const user = auth.currentUser;
    const [likeStatus, setLikeStatus] = useState<boolean | null>(null);
    const [likeText, setLikeText] = useState("like");



    useEffect(() => {
        const likeFunc = async () => {
            if (!user) return;

            try {
                const likeCheck = await getDoc(doc(db, "posts", post.id, "likes", user.uid));
                const liked = likeCheck.exists();
                setLikeStatus(liked);
                setLikeText(liked ? "already liked" : "like");
            } catch (error) {
                console.error("Error checking like status:", error);
            }
        };

        likeFunc();
    }, [likeStatus]);

    const likeBeta = async () => {
        if (!user) return;
        if (!likeStatus) try {
            await setDoc(doc(db, "posts", post.id, "likes", user.uid), {
                likedAt: new Date().toISOString(),
            })
            console.log("post liked");
            setLikeStatus(true);
        } catch (error){
            console.error(error)
        }
        else {
            await deleteDoc(doc(db, "posts", post.id, "likes", user.uid))
            setLikeStatus(false);
        }
    }

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
                    <TouchableOpacity onPress={() => likeBeta()}>
                        <Text style={styles.likeText}>{likeText}</Text>
                    </TouchableOpacity>
                </View>
                <View>
                    <TouchableOpacity onPress={() => router.push({
                        pathname: '/(tabs)/groups/[groupID]/post',
                        params: { groupID: post.groupID, idT: post.id, contentT: post.content, captionT: post.caption, userNameT: post.userName }
                    })}>
                        <Text> comment</Text>
                    </TouchableOpacity>
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
    },
    likeText: {
        color: "red",
    }
});

export default GroupPost;
