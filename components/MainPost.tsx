import {Dimensions, Image, StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle} from "react-native";
import {useRouter} from "expo-router";
import React, {useEffect, useState} from "react";
import {auth, db} from "@/firebase";
import AntDesign from '@expo/vector-icons/AntDesign';
import {ResizeMode, Video as VideoAV} from 'expo-av';

const { width, height } = Dimensions.get('window');

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
    style?: StyleProp<ViewStyle>;
}



const MainPost: React.FC<PostCompProps> = ({ post, style }) => {
    const router = useRouter();
    const content = decodeURIComponent(post.content);
    const user = auth().currentUser;
    const [likeStatus, setLikeStatus] = useState<boolean | null>(null);
    const [numLikes, setNumLikes] = useState<number>(0);
    const {width, height} = Dimensions.get('window');
    const POST_WIDTH = width;
    const POST_HEIGHT = height*0.7;

    useEffect(() => {
        const likeFunc = async () => {
            if (!user) return;

            try {
                const likeCount = await db().collection("posts").doc(post.id).collection("likes").get();
                setNumLikes(likeCount.size)
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




    const likeBeta = async () => {
        if (!user) return;
        if (!likeStatus) try {
            await db().collection("posts").doc(post.id).collection("likes").doc(user.uid).set({
                likedAt: new Date().toISOString(),
            });
            setLikeStatus(true);
        } catch (error){
            console.error(error)
        }
        else try {
            await db().collection("posts").doc(post.id).collection("likes").doc(user.uid).delete();
            setLikeStatus(false);
        } catch (err) {
            console.error("Error checking like status:", err);
        }
    }



    return (
        <View style={[styles.postView, style]}>
            <View style={styles.header}>
                <View style={styles.nameAndPfP}>
                    <View style={styles.avatarContainer}>
                        {post.pfp? (
                            <Image source={{ uri: post.pfp }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatar, styles.placeholder]}>
                                <Text style={styles.noPhotoText}>No Photo</Text>
                            </View>
                        )}
                    </View>
                    <Text style={styles.username}>{post.userName}</Text>
                </View>
            </View>


            <TouchableOpacity onPress={()=> router.push({pathname:"/home/post", params:{rawId: post.id, rawContent: encodeURIComponent(content), rawCaption: post.caption, rawUserName: post.userName, rawMode: post.mode, rawPhotoURL: encodeURIComponent(post.pfp)}})}>
                <View style={styles.contentViewPicture}>
                    {post.mode==="photo" ?
                        <Image source={{ uri: content }} style={styles.pictureContent} />
                        :
                        <VideoAV
                            source={{ uri: content }}
                            style={{width: POST_WIDTH, height: POST_HEIGHT}}
                            resizeMode={ResizeMode.COVER}
                        />
                    }
                </View>
            </TouchableOpacity>


            <View style={styles.likeBar}>
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
            </View>

            <View style={styles.captionBar}>
                <Text style={styles.userNameCaption}>{post.userName}</Text>
                <Text style={styles.caption}>{post.caption}</Text>
            </View>
            <Text style={styles.timeText}>{post.timestamp}</Text>

        </View>
    );
};

const styles = StyleSheet.create({
    postView: {
        justifyContent: "center",
        backgroundColor: "black",
        overflow: "hidden",
    },
    header: {
        padding: height/100,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        borderTopWidth: 1,
        borderColor: "white"
    },
    nameAndPfP: {
        flexDirection: "row",
        alignItems: "center",
    },
    avatarContainer: {
        alignItems: 'center',
    },
    avatar: {
        width: width/15,
        height: width/15,
        borderRadius: 999,
    },
    contentViewPicture: {
        width: width,
        height: height/1.92,
        overflow: 'hidden',
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    pictureContent: {
        width: width,
        height: height,
        resizeMode: 'contain',
    },
    likeBar: {
        flexDirection: "row",
        marginTop: height/100,
    },
    likeAssetContainer: {
        marginLeft: width/60
    },
    numLikesText: {
        color: "white",
        paddingLeft: width/75,
    },
    captionBar: {
        marginTop: height/90,
        flexDirection: "row",
        paddingHorizontal: width/60,
        alignItems: "center",
    },
    userNameCaption: {
        fontWeight: "bold",
        color: "#D3D3FF"
    },
    username: {
        color: "#D3D3FF",
        marginLeft: width/40,
    },
    caption: {
        color: "#D3D3FF",
        marginLeft: width/40,
        fontSize: height/75
    },
    likeText: {
        color: "red",
    },
    timeText: {
        color:"grey",
        fontSize: height/85,
        paddingHorizontal: width/60,
    },
    placeholder: {
        backgroundColor: '#444',
        justifyContent: 'center',
        alignItems: 'center',
    },
    noPhotoText: {
        color: 'white',
    },
});

export default MainPost;
