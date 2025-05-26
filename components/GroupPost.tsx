import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState} from "react";
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

const {width, height} = Dimensions.get("window");

const GroupPost: React.FC<PostCompProps> = ({ post }) => {
    const router = useRouter();
    const user = auth().currentUser;
    const [likeStatus, setLikeStatus] = useState<boolean | null>(null);
    const content = decodeURIComponent(post.content);




    useEffect(() => {
        const likeFunc = async () => {
            if (!user) return;

            try {
                const likeCheck = await db().collection("posts").doc(post.id).collection("likes").doc(user.uid).get();
                const liked = likeCheck.exists();
                setLikeStatus(liked);
            } catch (error) {
                console.error("Error checking like status:", error);
            }
        };

        likeFunc().catch((err) => {
            console.error("Error checking like status:", err);
        });
    }, [likeStatus]);

    // const likeBeta = async () => {
    //     if (!user) return;
    //     if (!likeStatus) try {
    //         await db().collection("posts").doc(post.id).collection("likes").doc(user.uid).set({
    //             likedAt: new Date().toISOString(),
    //         })
    //         setLikeStatus(true);
    //     } catch (error){
    //         console.error(error)
    //     }
    //     else {
    //         await db().collection("posts").doc(post.id).collection("likes").doc(user.uid).delete();
    //         setLikeStatus(false);
    //     }
    // }

    return (
        <View>

            {user?.displayName === post.userName ? (
                <View style={styles.postView}>
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
                                        paused={true}
                                    />
                                }
                            </TouchableOpacity>
                        </View>
                </View>
            ) : (
                <View style={styles.postView}>
                    <View style={styles.flexFixer}>
                        <View style={styles.sideSeparator}>
                            <View>
                                <View>
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
                            <View style={styles.imageWrapper}>
                                <TouchableOpacity onPress={() => router.push({
                                    pathname: '/(tabs)/groups/[groupID]/post',
                                    params: { groupID: post.groupID, rawId: post.id, rawContent: post.content, rawCaption: post.caption, rawUsername: post.userName, rawMode: post.mode, rawPhotoURL: encodeURIComponent(post.pfp) }
                                })}>
                                    {post.mode === "photo" ?
                                        <Image source={{ uri: content }} style={styles.pictureContent} />
                                        :
                                        <Video
                                            source={{ uri: content }}
                                            style={styles.videoContent}
                                            resizeMode={'cover'}
                                            paused={true}
                                        />
                                    }
                                    <View style={styles.overlay}>
                                        <Text style={styles.overlayText}>{post.firstName} {post.lastName}</Text>
                                    </View>
                                </TouchableOpacity>
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
        marginLeft: width/50,
    },
    flexFixer: {
        flexDirection: "row",
    },
    sideSeparator: {
        alignItems: "center",
        justifyContent: "flex-end",
        marginRight: width/50,
    },
    topBar: {
        backgroundColor: "grey",
    },
    contentView: {
        borderColor: "#D3D3FF",
        borderWidth: width/400,
        borderRadius: width/50
    },
    bottomBar: {
        backgroundColor: "white",
        padding: height/100,
        flexDirection: "row",
    },
    captionBar: {
        alignItems: "center",
        backgroundColor: "grey",
        padding: height/100,
        flexDirection: "row",
    },
    userNameCaption: {
        fontWeight: "bold",
    },
    contentText: {
        color: "white",
    },
    avatarContainer: {
        alignItems: 'center',
    },
    pictureContent: {
        width: width/2,
        height: height/3,
        resizeMode: "cover",
        backgroundColor: "#222",
        borderRadius: width/100
    },
    videoContent: {
        width: width/2,
        height: height/3,
        backgroundColor: "#222",
        borderRadius: width/100
    },
    avatar: {
        width: width/12,
        height: width/12,
        borderRadius: 999,
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
        top: height/75,
        left: width/40,
    },
    imageWrapper: {
        position: "relative",
        marginVertical: height/100,
        borderRadius: width/50,
        overflow: "hidden",
        borderWidth: width/200,
        borderColor: "#D3D3FF",
    },
    overlayText: {
        color: "#D3D3FF",
        fontWeight: "bold"
    }
});

export default GroupPost;
