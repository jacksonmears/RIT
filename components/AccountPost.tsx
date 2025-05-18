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
import React, {useState} from "react";
import {
    doc,
    deleteDoc,
    collection,
    getDocs,
    query,
    orderBy, limit
} from "firebase/firestore";
import {auth,db} from "@/firebase";
import {ResizeMode, Video as VideoAV} from "expo-av";

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
    const content = decodeURIComponent(post.content);
    const user = auth().currentUser;
    const router = useRouter();
    const [sheetVisible, setSheetVisible] = useState<boolean>(false);

    const deleteCollection = async (collectionPath: string, batchSize: number) => {
        if (!collectionPath || !batchSize) return;

        const collectionRef = collection(db, "posts", post.id, collectionPath);
        while (true) {
            try {

                const q = query(collectionRef, orderBy("timestamp"), limit(batchSize));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    break;
                }

                await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
            } catch (err) {
                console.error(err);
            }
        }
    }

    const handleDeletePost = async () => {
        if (!user) return;


        const dummyPostID = post.id
        const postRef = doc(db, "posts", dummyPostID);
        const userRef = doc(db, "users", user.uid, "posts", dummyPostID);
        const snapshot = await getDocs(collection(postRef, "groups"));
        const groupIDs = snapshot.docs.map(doc => doc.id);

        try {
            await Promise.all(groupIDs.map(async (groupID) => {
                await deleteDoc(doc(db, "groups", groupID, "messages", dummyPostID));
            }))
            await Promise.all([
                await deleteCollection("likes", 50),
                await deleteCollection("comments", 50),
                await deleteCollection("groups", 50),
                await deleteDoc(userRef),
                await deleteDoc(postRef)
            ])
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

            {post.mode==="photo" ?
                <Image
                    source={{ uri: content }}
                    resizeMode="cover"
                />
            :
                <VideoAV
                    source={{ uri: content }}
                    style={[styles.videoContent]}
                    resizeMode={ResizeMode.COVER}
                />
            }


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
