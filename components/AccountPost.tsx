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
import {
    doc,
    getDoc,
    deleteDoc,
    collection,
    getDocs,
    addDoc,
    setDoc,
    serverTimestamp,
    query,
    orderBy, limit
} from "firebase/firestore";
import {auth,db} from "@/firebase";
import Video from "react-native-video";
import {ResizeMode, Video as VideoAV} from "expo-av";

interface Post {
    id: string;
    content: string;
    mode: string;
    userID: string;
}

interface PostCompProps {
    post: Post;
}



const AccountPost: React.FC<PostCompProps> = ({ post }) => {
    const { width, height } = useWindowDimensions();
    const POST_WIDTH = width*0.333333333333333333333333333333333;
    const POST_HEIGHT = height*0.17;
    const content = decodeURIComponent(post.content);
    const user = auth.currentUser;
    const router = useRouter();
    const [sheetVisible, setSheetVisible] = useState<boolean>(false);

    const deleteCollection = async (collectionPath: string, batchSize: number) => {
        const collectionRef = collection(db, "posts", post.id, collectionPath);
        while (true) {
            const q = query(collectionRef, orderBy("timestamp"), limit(batchSize));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                break;
            }

            await Promise.all(snapshot.docs.map(doc => deleteDoc(doc.ref)));
        }
    }

    const handleDeletePost = async () => {
        if (!user) return;
        const dummyPostID = post.id
        const postRef = doc(db, "posts", dummyPostID);
        const userRef = doc(db, "users", user.uid, "posts", dummyPostID);
        const snapshot = await getDocs(collection(postRef, "groups"));
        const groupIDs = snapshot.docs.map(doc => doc.id);

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
    }

    return (
        <View style={[styles.contentView, { width: POST_WIDTH, height: POST_HEIGHT }]}>
            {post.userID===user?.uid &&
                <>
                    <Modal
                        visible={sheetVisible}
                        animationType="slide"
                        transparent={true}                   // <–– make the modal background transparent
                    >
                        {/* 1) overlay to catch taps outside the panel */}
                        <TouchableWithoutFeedback onPress={() => setSheetVisible(false)}>
                            <View style={styles.overlay} />
                        </TouchableWithoutFeedback>

                        {/* 2) the actual panel */}
                        <View style={[styles.panel, { height: height * 0.8 }]}>
                            <TouchableOpacity onPress={() => handleDeletePost()}>
                                <Text style={styles.modalButtonText}>delete post</Text>
                            </TouchableOpacity>
                            {/* … your checkboxes, buttons, etc. … */}
                            {/*<TouchableOpacity onPress={() => setSheetVisible(false)}>*/}
                            {/*    <Text style={styles.closeText}>Close</Text>*/}
                            {/*</TouchableOpacity>*/}
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
                    style={{ width: POST_WIDTH, height: POST_HEIGHT }}
                    resizeMode="cover"
                />
            :
                <VideoAV
                    source={{ uri: content }}
                    style={[styles.videoContent, {width: POST_WIDTH, height: POST_HEIGHT}]}
                    // resizeMode={'cover'}
                    // repeat={true}
                    // paused={true}
                    resizeMode={ResizeMode.COVER}
                />
            }


        </View>
    );
};

const styles = StyleSheet.create({
    contentView: {
        backgroundColor: "grey",
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
    },
    contentText: {
        textAlign: "center",
    },
    deletePostText: {
        color: "black",
        fontSize: 15,
        lineHeight: 24
    },
    postButtons: {
        position: "absolute",
        top: 8,
        right: 8,
        backgroundColor: "rgba(255,255,255,0.8)",
        paddingHorizontal: 8,
        borderRadius: 4,
        zIndex: 10,

    },
    overlay: {
        flex: 1,
        backgroundColor: 'transparent',     // invisible—but catches taps
    },
    panel: {
        width: '100%',
        backgroundColor: '#222',
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        padding: 16,
    },
    modalButtonText: {
        color: "white",
    },
    videoContent: {
        borderWidth: 0.75,
        borderColor: "#D3D3FF"
        // width: '100%',
        // height: '100%',
        // resizeMode: 'contain',  // or 'cover' if you want to fill and crop
    },

});

export default AccountPost;
