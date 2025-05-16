import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState} from "react";
import {doc, getDoc, deleteDoc, collection, getDocs, addDoc, setDoc, serverTimestamp} from "firebase/firestore";
import {auth,db} from "@/firebase";
import Video from "react-native-video";

interface Post {
    groupID: string;
    id: string;
    content: string;
    caption: string;
    userName: string;
    pfp: string;
    mode: string;
    firstName: string;
    lastName: string;
}

interface PostCompProps {
    post: Post;
}



const GroupPost: React.FC<PostCompProps> = ({ post }) => {
    const router = useRouter();
    const user = auth.currentUser;
    const [likeStatus, setLikeStatus] = useState<boolean | null>(null);
    const [likeText, setLikeText] = useState("like");
    const content = decodeURIComponent(post.content);




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
        <View>

            {user?.displayName === post.userName ? (
                <View style={styles.postView}>
                    <View style={styles.nameContentContainer}>
                        <View style={styles.imageWrapper}>
                            <TouchableOpacity onPress={() => router.push({
                                pathname: '/(tabs)/groups/[groupID]/post',
                                params: { groupID: post.groupID, rawID: post.id, rawContent: post.content, rawCaption: post.caption, rawUsername: post.userName, rawMode: post.mode, rawPhotoURL: encodeURIComponent(post.pfp) }
                            })}>
                                {post.mode === "photo" ?
                                    <Image source={{ uri: content }} style={styles.pictureContent} />
                                    :
                                    <Video
                                        source={{ uri: content }}
                                        style={styles.videoContent}
                                        resizeMode={'cover'}
                                        // repeat={true}
                                        paused={true}
                                    />
                                }
                            </TouchableOpacity>
                        </View>

                        {/*<View style={styles.captionBar}>*/}
                        {/*    <Text style={styles.userNameCaption}>{post.userName} </Text>*/}
                        {/*    <Text> {post.caption}</Text>*/}
                        {/*</View>*/}
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
                            <View style={styles.imageWrapper}>
                                <TouchableOpacity onPress={() => router.push({
                                    pathname: '/(tabs)/groups/[groupID]/post',
                                    params: { groupID: post.groupID, idT: post.id, contentT: post.content, captionT: post.caption, userNameT: post.userName, mode: post.mode, photoURL: encodeURIComponent(post.pfp) }
                                })}>
                                    {post.mode === "photo" ?
                                        <Image source={{ uri: content }} style={styles.pictureContent} />
                                        :
                                        <Video
                                            source={{ uri: content }}
                                            style={styles.videoContent}
                                            resizeMode={'cover'}
                                            // repeat={true}
                                            paused={true}
                                        />
                                    }
                                    <View style={styles.overlay}>
                                        <Text style={styles.overlayText}>{post.firstName} {post.lastName}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                            {/*<View style={styles.captionBar}>*/}
                            {/*    <Text style={styles.userNameCaption}>{post.userName} </Text>*/}
                            {/*    <Text> {post.caption}</Text>*/}
                            {/*</View>*/}
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
        marginLeft: 10,
    },
    flexFixer: {
        flexDirection: "row",
    },
    sideSeparator: {
        alignItems: "center",
        justifyContent: "flex-end",
        marginRight: 10
    },
    nameContentContainer: {
    },
    topBar: {
        backgroundColor: "grey",
    },
    contentView: {
        borderColor: "#D3D3FF",
        borderWidth: 1,
        borderRadius: 8
    },
    bottomBar: {
        backgroundColor: "white",
        padding: 10,
        flexDirection: "row",
    },
    captionBar: {
        alignItems: "center",
        backgroundColor: "grey",
        padding: 10,
        flexDirection: "row",
    },
    userNameCaption: {
        fontWeight: "bold",
    },
    contentText: {
        color: "white",
    },
    pfpBoxPosition: {
    },
    pfpBox: {

    },
    avatarContainer: {
        alignItems: 'center',
    },
    pictureContent: {
        width: 200,
        height: 300,
        resizeMode: "cover",
        backgroundColor: "#222",
        borderRadius: 8
    },
    videoContent: {
        width: 200,
        height: 300,
        backgroundColor: "#222",
        borderRadius: 8
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
    overlay: {
        position: "absolute",
        top: 8,
        left: 8,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    imageWrapper: {
        position: "relative",
        marginVertical: 10,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#D3D3FF",
    },
    overlayText: {
        color: "#D3D3FF",
        fontWeight: "bold"
    }
});

export default GroupPost;
