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
    pfp: string;
    type: string;
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
        console.log(post.content)
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
        <View>

            {user?.displayName === post.userName ? (
                <View style={styles.postView}>
                    <View style={styles.nameContentContainer}>
                        <View style={styles.contentView}>
                            <TouchableOpacity onPress={() => router.push({
                                pathname: '/(tabs)/groups/[groupID]/post',
                                params: { groupID: post.groupID, idT: post.id, contentT: post.content, captionT: post.caption, userNameT: post.userName }
                            })}>
                                {post.type === "picture" ?
                                    <Image source={{ uri: post.content }} style={styles.pictureContent} />
                                    :
                                    <Text style={styles.contentText}>{post.content}</Text>
                                }
                            </TouchableOpacity>
                        </View>

                        <View style={styles.captionBar}>
                            <Text style={styles.userNameCaption}>{post.userName} </Text>
                            <Text> {post.caption}</Text>
                        </View>
                    </View>
                </View>
            ) : (
                <View style={styles.postView}>
                    <View style={styles.flexFixer}>
                        <View style={styles.sideSeparator}>
                            <View style={styles.pfpBoxPosition}>
                                <View style={styles.pfpBox}>
                                    <View style={styles.avatarContainer}>
                                        {post.pfp? (
                                            <Image source={{ uri: post.pfp }} style={styles.avatar} />
                                        ) : (
                                            <View style={[styles.avatar, styles.placeholder]}>
                                                <Text style={styles.placeholderText}>No Photo</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>

                            </View>
                        </View>
                        <View style={styles.nameContentContainer}>
                            <View style={styles.topBar}>
                                <Text>{post.userName}</Text>
                            </View>
                            <View style={styles.contentView}>
                                <TouchableOpacity onPress={() => router.push({
                                    pathname: '/(tabs)/groups/[groupID]/post',
                                    params: { groupID: post.groupID, idT: post.id, contentT: post.content, captionT: post.caption, userNameT: post.userName }
                                })}>
                                    {post.type === "picture" ?
                                        <Image source={{ uri: post.content }} style={styles.pictureContent} />
                                        :
                                        <Text style={styles.contentText}>{post.content}</Text>
                                    }
                                </TouchableOpacity>
                            </View>
                            <View style={styles.captionBar}>
                                <Text style={styles.userNameCaption}>{post.userName} </Text>
                                <Text> {post.caption}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            )}


        </View>

    );
};

const styles = StyleSheet.create({
    postView: {
        justifyContent: "center",
        paddingLeft: 10,
    },
    flexFixer: {
        flexDirection: "row",
    },
    sideSeparator: {
        padding: 0,
        alignItems: "center",
        justifyContent: "flex-end",
        paddingRight: 10
    },
    nameContentContainer: {
    },
    topBar: {
        backgroundColor: "grey",
        // padding: 20,
    },
    contentView: {
        // backgroundColor: "grey",
        // padding: 100,
        borderColor: "gold",
        borderWidth: 1
    },
    bottomBar: {
        backgroundColor: "white",
        padding: 20,
        flexDirection: "row",
    },
    captionBar: {
        alignItems: "center",
        backgroundColor: "grey",
        padding: 20,
        flexDirection: "row",
    },
    userNameCaption: {
        fontWeight: "bold",
    },
    contentText: {
        color: "white",
    },
    pfpBoxPosition: {
        // paddingBottom: 10,
    },
    pfpBox: {
        // backgroundColor: "white",
        // padding: 20,
        // borderRadius: 999
    },
    avatarContainer: {
        alignItems: 'center',
        // marginBottom: 20,
    },
    pictureContent: {
        width: 200,
        height: 200,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 60,
    },
    placeholder: {
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: 'white',
    },
});

export default GroupPost;
