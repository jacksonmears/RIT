import { View, Text, Image, StyleSheet, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import React from "react";
import {auth} from "@/firebase";

interface Post {
    content: string;
    userName: string;
    pfp: string;
}

interface PostCompProps {
    post: Post;
}

const {width, height} = Dimensions.get("window");


const GroupMessage: React.FC<PostCompProps> = ({ post }) => {
    const user = auth().currentUser;



    return (

        <View>
            {user?.displayName === post.userName ?
                <View style={styles.container}>
                        <View style={styles.selfMessage}>
                            <Text style={styles.selfText}>{post.content}</Text>
                        </View>
                </View>
                :
                <View style={styles.container}>
                    <View style={styles.pfpContainer}>
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
                    <View>
                        <View style={styles.messageView}>
                            <Text style={styles.messageText}>{post.content}</Text>
                        </View>
                    </View>
                </View>
            }
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        marginLeft: width/50,
    },
    pfpContainer: {
        marginRight: width/50,
        justifyContent: "flex-end",
    },
    messageView: {
        backgroundColor: "#36454F",
        paddingVertical: height/100,
        paddingHorizontal: width/25,
        borderRadius: height/50
    },
    messageText: {
        color: "white",
    },
    selfMessage: {
        backgroundColor: "blue",
        paddingVertical: height/100,
        paddingHorizontal: width/25,
        borderRadius: height/50
    },
    selfText: {
        color: "white",
    },
    avatarContainer: {
        alignItems: 'center',
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

});

export default GroupMessage;
