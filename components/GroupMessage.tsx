import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState} from "react";
import {doc, getDoc, deleteDoc, collection, getDocs, addDoc, setDoc, serverTimestamp} from "firebase/firestore";
import {auth,db} from "@/firebase";

interface Post {
    content: string;
    userName: string;
}

interface PostCompProps {
    post: Post;
}



const GroupMessage: React.FC<PostCompProps> = ({ post }) => {
    const router = useRouter();
    const user = auth.currentUser;



    return (

        <View>
            {user?.displayName === post.userName ?
                <View style={styles.container}>
                    <View>
                        <View style={styles.selfMessage}>
                            <Text style={styles.selfText}>{post.content}</Text>
                        </View>
                    </View>
                </View>
                :
                <View style={styles.container}>
                    <View style={styles.pfpContainer}>
                        <View style={styles.pfpBox}></View>
                    </View>
                    <View>
                        <View style={styles.messageView}>
                            <Text style={styles.messageText}>{post.content}</Text>
                        </View>
                    </View>
                </View>
            }
            {/*<View style={styles.pfpContainer}>*/}
            {/*    <View style={styles.pfpBox}></View>*/}
            {/*</View>*/}
            {/*<View>*/}
            {/*    <Text style={styles.nameText}>{post.userName}</Text>*/}
            {/*    <View style={styles.messageView}>*/}
            {/*        <Text style={styles.messageText}>{post.content}</Text>*/}
            {/*    </View>*/}
            {/*</View>*/}

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        paddingLeft: 10,
        // alignItems: "center",
    },
    pfpContainer: {
        paddingRight: 10,
        justifyContent: "flex-end",
    },
    messageView: {
        backgroundColor: "#36454F",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20
    },
    nameText: {
        color: "gold",
    },
    messageText: {
        color: "white",
    },
    pfpBox: {
        backgroundColor: "white",
        padding: 15,
        borderRadius: 999
    },
    selfMessage: {
        backgroundColor: "blue",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 20
    },
    selfText: {
        color: "white",
    }

});

export default GroupMessage;
