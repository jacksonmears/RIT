import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    Modal,
    TouchableWithoutFeedback, Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState} from "react";
import {auth,db} from "@/firebase";
import {ResizeMode, Video as VideoAV} from "expo-av";
import storage from "@react-native-firebase/storage";

type Post = {
    id: string;
    content: string;
    mode: string;
    userID: string;
}

type PostCompProps = {
    post: Post;
    index: number;
}

const { width, height } = Dimensions.get("window");

const AccountPost: React.FC<PostCompProps> = ({ post, index }) => {
    const { width, height } = useWindowDimensions();
    const user = auth().currentUser;
    const router = useRouter();
    const [sheetVisible, setSheetVisible] = useState<boolean>(false);
    const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);




    useEffect(() => {
        const getSignedThumbnailUrl = async (postId: string): Promise<string | undefined> => {
            try {
                const path = encodeURIComponent(`${postId}/thumbnail.jpg`);
                const response = await fetch(`https://us-central1-recap-d22e0.cloudfunctions.net/getSignedDownloadUrl?filename=${path}`);
                if (!response.ok) {
                    const text = await response.text();
                    console.error(`Failed to get signed thumbnail URL: ${response.status} ${text}`);
                    return undefined;
                }
                const data = await response.json();
                setThumbnailUrl(data.url);
                return data.url;
            } catch (error) {
                console.error("Error fetching signed thumbnail URL:", error);
                return undefined;
            }
        };


        getSignedThumbnailUrl(post.id);
    }, [post.id]);


    const deleteCollection = async (collectionPath: string, batchSize: number) => {
        if (!collectionPath || !batchSize) return;

        const collectionRef = db().collection("posts").doc(post.id).collection(collectionPath);
        while (true) {
            try {

                const q = collectionRef.orderBy("timestamp").limit(batchSize);
                const snapshot = await q.get();

                if (snapshot.empty) {
                    break;
                }
                await Promise.all(snapshot.docs.map(doc => doc.ref.delete()));
            } catch (err) {
                console.error(err);
            }
        }
    }

    const handleDeletePost = async () => {
        if (!user) return;


        const dummyPostID = post.id
        const postRef = db().collection("posts").doc(dummyPostID);
        const userRef = db().collection("users").doc(user.uid).collection("posts").doc(dummyPostID);
        const snapshot = await postRef.collection("groups").get();
        const groupIDs = snapshot.docs.map(doc => doc.id);
        const videoRef = storage().ref(`uploads/${dummyPostID}.mov`);


        try {
            await Promise.all(groupIDs.map(async (groupID) => {
                await db().collection("groups").doc(groupID).collection("messages").doc(dummyPostID).delete();
            }))
            await Promise.all([
                await deleteCollection("likes", 50),
                await deleteCollection("comments", 50),
                await deleteCollection("groups", 50),
                await userRef.delete(),
                await postRef.delete(),
                await videoRef.delete(),
            ])
            setSheetVisible(false)
            router.push("/home");
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <View style={[styles.contentView,
            index%3 !== 0 && { marginLeft: width/200 },
        ]}>
            {user && post.userID===user.uid &&
                <>
                    <Modal
                        visible={sheetVisible}
                        animationType="slide"
                        transparent={true}
                    >
                        <TouchableWithoutFeedback onPress={() => setSheetVisible(false)}>
                            <View style={styles.overlay} />
                        </TouchableWithoutFeedback>

                        <View style={[styles.panel, { height: height * 0.8 }]}>
                            <TouchableOpacity onPress={() => handleDeletePost()}>
                                <Text style={styles.modalButtonText}>delete post</Text>
                            </TouchableOpacity>

                        </View>
                    </Modal>
                    <TouchableOpacity style={styles.postButtons} onPress={() => setSheetVisible(true)}>
                        <Text style={styles.deletePostText}>-</Text>
                    </TouchableOpacity>
                </>

            }

            {thumbnailUrl ? (
                <Image
                    source={{ uri: thumbnailUrl }}
                    style={styles.videoContent}
                    resizeMode="cover"
                />
            ) : (
                <View style={[styles.videoContent, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Text style={{ color: 'white' }}>Loading...</Text>
                </View>
            )}



        </View>
    );
};

const styles = StyleSheet.create({
    contentView: {
        backgroundColor: "grey",
        alignItems: "center",
        width: width*0.33,
        height: height*0.17,
        marginTop: width/200
    },
    contentText: {
        textAlign: "center",
    },
    deletePostText: {
        color: "black",
        fontSize: height/50,
        lineHeight: height/40
    },
    postButtons: {
        position: "absolute",
        top: height/100,
        right: width/50,
        backgroundColor: "white",
        opacity: 0.7,
        paddingHorizontal: width/50,
        borderRadius: width/100,
        zIndex: 10,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    panel: {
        width: width,
        backgroundColor: '#222',
        borderRadius: width/33,
        padding: height/50,
    },
    modalButtonText: {
        color: "white",
    },
    videoContent: {
        borderWidth: 0.25,
        width: '100%',
        height: '100%',
    },

});

export default AccountPost;
