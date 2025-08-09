import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    Modal,
    TouchableWithoutFeedback,
    Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { auth, db } from "@/firebase";
import storage from "@react-native-firebase/storage";

type Post = {
    id: string;
    content: string;
    mode: string;
    userID: string;
};

type PostCompProps = {
    post: Post;
};

const { width, height } = Dimensions.get("window");
const gapSize = 3; // small gap between items

const AccountPost: React.FC<PostCompProps> = ({ post }) => {
    const user = auth().currentUser;
    const router = useRouter();
    const [sheetVisible, setSheetVisible] = useState<boolean>(false);
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

        fetchThumbnail(post.id).catch((error) => {
            console.error("Error fetching signed thumbnail URL:", error);
        })
    }, [post.id]);

    const deletePostCollection = async (collectionPath: string, batchSize: number) => {
        if (!collectionPath || !batchSize) return;

        const postCollectionReference = db
            .collection("posts")
            .doc(post.id)
            .collection(collectionPath);

        while (true) {
            try {
                const postCollectionQuery = await postCollectionReference
                    .orderBy("timestamp")
                    .limit(batchSize)
                    .get();

                if (postCollectionQuery.empty) {
                    break;
                }
                await Promise.all(postCollectionQuery.docs.map((doc) => doc.ref.delete()));
            } catch (err) {
                console.error(err);
                break;
            }
        }
    };

    const deletePost = async () => {
        if (!user) return;

        const postReference = db
            .collection("posts")
            .doc(post.id);

        const userPostReference = db
            .collection("users")
            .doc(user.uid)
            .collection("posts")
            .doc(post.id);

        const postData = await postReference
            .collection("groups")
            .get();

        const groupIDs = postData.docs.map((doc) => doc.id);

        const videoPath = storage().ref(`uploads/${post.id}.mov`);

        try {
            await Promise.all(
                groupIDs.map(async (groupID) => {
                    await db.collection("groups").doc(groupID).collection("messages").doc(post.id).delete();
                })
            );
            await Promise.all([
                deletePostCollection("likes", 50),
                deletePostCollection("comments", 50),
                deletePostCollection("groups", 50),
                userPostReference.delete(),
                postReference.delete(),
                videoPath.delete(),
            ]);
            setSheetVisible(false);
            router.push("/home");
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <View style={styles.contentView}>
            {user && post.userID === user.uid && (
                <>
                    <Modal visible={sheetVisible} animationType="slide" transparent={true}>
                        <TouchableWithoutFeedback onPress={() => setSheetVisible(false)}>
                            <View style={styles.overlay} />
                        </TouchableWithoutFeedback>

                        <View style={[styles.panel, { height: height * 0.8 }]}>
                            <TouchableOpacity onPress={() => deletePost()}>
                                <Text style={styles.modalButtonText}>
                                    delete post
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </Modal>
                    <TouchableOpacity style={styles.postButtons} onPress={() => setSheetVisible(true)}>
                        <Text style={styles.deletePostText}>-</Text>
                    </TouchableOpacity>
                </>
            )}

            {thumbnail ? (
                <Image source={{ uri: thumbnail }} style={styles.videoContent} resizeMode="cover" />
            ) : (
                <View style={[styles.videoContent, { justifyContent: "center", alignItems: "center" }]}>
                    <Text style={{ color: "white" }}>Loading...</Text>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    postsContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        backgroundColor: "black",
        paddingHorizontal: gapSize / 2,
    },
    contentView: {
        backgroundColor: "grey",
        alignItems: "center",
        width: (width - gapSize * 4) / 3, // 3 items per row with gaps
        height: height * 0.17,
        marginBottom: gapSize / 3,
        marginHorizontal: gapSize / 2,
    },
    contentText: {
        textAlign: "center",
    },
    deletePostText: {
        color: "black",
        fontSize: height / 50,
        lineHeight: height / 40,
    },
    postButtons: {
        position: "absolute",
        top: height / 100,
        right: width / 50,
        backgroundColor: "white",
        opacity: 0.7,
        paddingHorizontal: width / 50,
        borderRadius: width / 100,
        zIndex: 10,
    },
    overlay: {
        flex: 1,
        backgroundColor: "transparent",
    },
    panel: {
        width: width,
        backgroundColor: "#222",
        borderRadius: width / 33,
        padding: height / 50,
    },
    modalButtonText: {
        color: "white",
    },
    videoContent: {
        borderWidth: 0.25,
        width: "100%",
        height: "100%",
    },
});

export default AccountPost;
