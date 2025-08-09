import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState} from "react";
import {auth,db} from "@/firebase";
import type {FirebaseFirestoreTypes} from "@react-native-firebase/firestore";

interface Post {
    id: string;
    content: string;
    caption: string;
    mode: string;
    userID: string;
    displayName: string;
    pfp: string;
    timestamp: FirebaseFirestoreTypes.Timestamp;
}

type groupMemberInformation = {
    firstName: string;
    lastName: string;
    pfp: string;
    displayName: string;
}

interface PostCompProps {
    post: Post;
    groupMember: groupMemberInformation;
}

const {width, height} = Dimensions.get("window");

const GroupPost: React.FC<PostCompProps> = ({ post, groupMember }) => {
    const router = useRouter();
    const user = auth().currentUser;
    const [likeStatus, setLikeStatus] = useState<boolean | null>(null);
    const [thumbnail, setThumbnail] = useState<string | null>(null);

    useEffect(() => {
        const fetchThumbnail = async (postID: string): Promise<string | undefined> => {
            try {
                const thumbnailPath = encodeURIComponent(`${postID}/thumbnail.jpg`);
                const response = await fetch(
                    `https://us-central1-recap-d22e0.cloudfunctions.net/getSignedDownloadUrl?filename=${thumbnailPath}`,
                );
                if (!response.ok) {
                    const text = await response.text();
                    console.error(`Failed to get signed thumbnail URL: ${response.status} ${text}`);
                    return undefined;
                }
                const thumbnailData = await response.json();
                setThumbnail(thumbnailData.url);
                return thumbnailData.url;
            } catch (error) {
                console.error("Error fetching signed thumbnail URL:", error);
                return undefined;
            }
        };


        fetchThumbnail(post.id).catch((err) => console.error(err));
    }, [post.id]);

    useEffect(() => {
        const fetchLikeStatus = async () => {
            if (!user) return;

            try {
                const likeReference = await db
                    .collection("posts")
                    .doc(post.id)
                    .collection("likes")
                    .doc(user.uid)
                    .get();

                setLikeStatus(likeReference.exists());

            } catch (error) {
                console.error("Error checking like status:", error);
            }
        };

        fetchLikeStatus().catch((err) => {
            console.error("Error checking like status:", err);
        });
    }, [likeStatus]);



    return (
        <View>

            {user?.uid === post.userID ? (
                <View style={styles.postView}>
                        <View style={styles.imageWrapper}>
                            <TouchableOpacity onPress={() => router.push({
                                pathname: '../../post/post/',
                                params: {
                                    id: post.id,
                                    contend: post.content,
                                    caption: post.caption,
                                    mode: post.mode,
                                    userID: post.userID,
                                    displayName: post.displayName,
                                    pfp: encodeURIComponent(post.pfp)
                                }
                            })}>
                                {thumbnail ? (
                                    <Image
                                        source={{ uri: thumbnail }}
                                        style={styles.videoContent}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <View style={[styles.videoContent, { justifyContent: 'center', alignItems: 'center' }]}>
                                        <Text style={{ color: 'white' }}>Loading...</Text>
                                    </View>
                                )}
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
                                        {groupMember.pfp? (
                                            <Image source={{ uri: groupMember.pfp }} style={styles.avatar} />
                                        ) : (
                                        <View style={[styles.avatar, styles.placeholder]}>
                                        </View>
                                        )}
                                    </View>
                                </View>

                            </View>
                        </View>
                            <View style={styles.imageWrapper}>
                                <TouchableOpacity onPress={() => {
                                    router.push({
                                        pathname: '../../post/post',
                                        params: {
                                            id: post.id,
                                            contend: post.content,
                                            caption: post.caption,
                                            mode: post.mode,
                                            userID: post.userID,
                                            displayName: post.displayName,
                                            pfp: encodeURIComponent(post.pfp)
                                        }
                                    });
                                }}>
                                    {thumbnail ? (
                                        <Image
                                            source={{ uri: thumbnail }}
                                            style={styles.videoContent}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <View style={[styles.videoContent, { justifyContent: 'center', alignItems: 'center' }]}>
                                            <Text style={{ color: 'white' }}>Loading...</Text>
                                        </View>
                                    )}
                                    <View style={styles.overlay}>
                                        <Text style={styles.overlayText}>{groupMember.firstName} {groupMember.lastName}</Text>
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
