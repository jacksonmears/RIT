import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TouchableWithoutFeedback, Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState, useRef} from "react";
import {doc, getDoc, deleteDoc, collection, getDocs, addDoc, setDoc, serverTimestamp} from "firebase/firestore";
import {auth,db} from "@/firebase";
import AntDesign from '@expo/vector-icons/AntDesign';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Video from "react-native-video";


interface Post {
    id: string;
    mode: string;
    content: string;
    caption: string;
    userName: string;
    timestamp: string;
    pfp: string;
}

interface PostCompProps {
    post: Post;
}



const GroupPost: React.FC<PostCompProps> = ({ post }) => {
    const router = useRouter();
    const content = decodeURIComponent(post.content);
    const user = auth.currentUser;
    const [likeStatus, setLikeStatus] = useState<boolean | null>(null);
    const [likeText, setLikeText] = useState("like");
    const [numLikes, setNumLikes] = useState<number>(0);
    const [numComments, setNumComments] = useState<number>(0);
    const [sheetVisible, setSheetVisible] = useState(false);
    const screenHeight = Dimensions.get('window').height;

    useEffect(() => {
        console.log(content)
        const likeFunc = async () => {
            if (!user) return;

            try {
                const likeCount = await getDocs(collection(db, "posts", post.id, "likes"));
                setNumLikes(likeCount.size)
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

    useEffect(() => {
        const commentFunc = async () => {
            if (!user) return;
            try {
                const commentCount = await getDocs(collection(db, "posts", post.id, "comments"));
                setNumComments(commentCount.size)

            } catch (error) {
                console.error("Error checking like status:", error);
            }
        };

        commentFunc();
    }, []);

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

    const deletePostTesting = () => {
        console.log("deletePostTesting");
    }

    return (
        <View style={styles.postView}>
            <Modal
                visible={sheetVisible}
                animationType="slide"
                transparent={true}                   // <–– make the modal background transparent
                onRequestClose={() => setSheetVisible(false)}
            >
                {/* 1) overlay to catch taps outside the panel */}
                <TouchableWithoutFeedback onPress={() => setSheetVisible(false)}>
                    <View style={styles.overlay} />
                </TouchableWithoutFeedback>

                {/* 2) the actual panel */}
                <View style={[styles.panel, { height: screenHeight * 0.66 }]}>
                    <Text style={styles.panelTitle}>Your Options Here</Text>
                    {/* … your checkboxes, buttons, etc. … */}
                    <TouchableOpacity onPress={() => setSheetVisible(false)}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
                <View>
                    <View>
                        <View style={styles.topBar}>
                            <View style={styles.leftSideTopBar}>
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
                                <Text style={styles.username}>{post.userName}</Text>
                            </View>
                            <TouchableOpacity onPress={() => setSheetVisible(true)}>
                                <Text style={styles.username}>...</Text>
                            </TouchableOpacity>
                            {/*<View>*/}
                            {/*    <Text style={styles.username}>...</Text>*/}
                            {/*</View>*/}
                        </View>
                        <TouchableOpacity onPress={()=> router.push({pathname:"/home/post", params:{idT: post.id, contentT: encodeURIComponent(content), captionT: post.caption, userNameT: post.userName, mode: post.mode, photoURL: encodeURIComponent(post.pfp)}})}>
                            <View style={styles.contentViewPicture}>
                                {post.mode==="photo" ?
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
                                {/*<Text style={styles.username}>{post.content}</Text>*/}
                            </View>
                        </TouchableOpacity>
                        <View style={styles.bottomBar}>
                            <TouchableOpacity onPress={() => likeBeta()}>
                                <View style={styles.likeAssetContainer}>
                                    {likeStatus ?
                                        <AntDesign name="heart" size={24} color={"red"} />
                                        :
                                        <AntDesign name="hearto" size={24} color={"white"} />
                                    }

                                </View>
                            </TouchableOpacity>
                            <Text style={styles.numLikesText}>{numLikes}</Text>

                            <View>
                                <TouchableOpacity onPress={() => router.push({
                                    pathname: '/(tabs)/home/post',
                                    params: { idT: post.id, contentT: content, captionT: post.caption, userNameT: post.userName, mode: post.mode },
                                })}>
                                    <FontAwesome name="comment-o" size={22} color={"white"} />
                                </TouchableOpacity>
                            </View>
                            <Text style={styles.numLikesText}>{numComments}</Text>

                        </View>
                        <View style={styles.captionBar}>
                            <Text style={styles.userNameCaption}>{post.userName} </Text>
                            <Text style={styles.username}>{post.caption}</Text>
                        </View>
                        <Text style={styles.timeText}>{post.timestamp}</Text>
                    </View>
                </View>


        </View>
    );
};

const styles = StyleSheet.create({
    postView: {
        justifyContent: "center",
    },
    topBar: {
        padding: 5,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    avatarContainer: {
        alignItems: 'center',
        // marginBottom: 20,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 60,
    },
    pfpBox: {

    },
    username: {
        color: "#D3D3FF",
        paddingHorizontal: 10
    },
    contentViewText: {
        padding: 100,
        borderColor: "#D3D3FF",
        borderWidth: 1,
    },
    contentViewPicture: {
        width: "100%",
        height: 500,
        overflow: "hidden", // Hides top/bottom overflow
        borderColor: "#D3D3FF",
        borderWidth: 1,
    },
    pictureContent: {
        backgroundColor: "grey",
        width: "100%",
        resizeMode: "cover",
        height: '100%',
    },
    videoContent: {
        backgroundColor: "grey",
        width: "100%",
        resizeMode: "contain",
        height: '100%',
    },
    bottomBar: {
        flexDirection: "row",
        paddingTop: 10
    },
    likeAssetContainer: {
        paddingLeft: 5
    },
    numLikesText: {
        color: "white",
        paddingLeft: 5,
        paddingRight: 20
    },
    captionBar: {
        paddingTop: 10,
        flexDirection: "row",
    },
    userNameCaption: {
        fontWeight: "bold",
        color: "#D3D3FF"
    },
    likeText: {
        color: "red",
    },
    timeText: {
        color:"grey",
        fontSize: 12
    },


    placeholder: {
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        color: 'white',
    },
    leftSideTopBar: {
        flexDirection: "row",
        alignItems: "center",

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
    panelTitle: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 12,
    },
    closeText: {
        color: '#D3D3FF',
        marginTop: 20,
        textAlign: 'center',
    },
});

export default GroupPost;
