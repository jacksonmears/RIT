import { View, Text, Image, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import { auth } from "@/firebase";
import type { FirebaseFirestoreTypes } from "@react-native-firebase/firestore";

interface Post {
    groupID: string;
    postID: string;
    mode: string;
    content: string;
    caption: string;
    sender_id: string;
    timestamp: FirebaseFirestoreTypes.Timestamp;
}

type groupMemberInformation = {
    firstName: string;
    lastName: string;
    photoURL: string;
    displayName: string;
}

interface PostCompProps {
    post: Post;
    groupMember: groupMemberInformation;
    onDelete?: (id: string) => void; // optional callback if you want to pass delete up
}

const { width, height } = Dimensions.get("window");

const GroupMessage: React.FC<PostCompProps> = ({ post, groupMember, onDelete }) => {
    const user = auth().currentUser;

    // const confirmDelete = () => {
    //     Alert.alert(
    //         "Delete message?",
    //         "Are you sure you want to delete this message?",
    //         [
    //             { text: "Cancel", style: "cancel" },
    //             { text: "Delete", style: "destructive", onPress: handleDelete },
    //         ]
    //     );
    // };
    //
    // const handleDelete = async () => {
    //     try {
    //         // Delete the message from Firestore
    //         await db()
    //             .collection("groups")
    //             .doc(post.groupID)
    //             .collection("messages")
    //             .doc(post.id)
    //             .delete();
    //
    //         // Notify parent component without refetching everything
    //         if (onDelete) onDelete(post.id);
    //     } catch (error) {
    //         console.error("Failed to delete message:", error);
    //     }
    // };

    // Only allow sender to delete their own messages
    const isSender = user?.uid === post.sender_id;

    return (
        <View>
            {isSender ? (
                <View style={styles.container}>
                    <TouchableOpacity
                        // onLongPress={confirmDelete}
                        delayLongPress={500}
                        style={styles.selfMessage}
                    >
                        <Text style={styles.selfText}>{post.content}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={styles.container}>
                    <View style={styles.pfpContainer}>
                        <View style={styles.avatarContainer}>
                            {groupMember?.photoURL ? (
                                <Image source={{ uri: groupMember.photoURL }} style={styles.avatar} />
                            ) : (
                                <View style={[styles.avatar, styles.placeholder]} />
                            )}
                        </View>
                    </View>
                    <View>
                        <View style={styles.messageView}>
                            <Text>{post.content}</Text>
                        </View>
                    </View>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        marginLeft: width / 50,
    },
    pfpContainer: {
        marginRight: width / 50,
        justifyContent: "flex-end",
    },
    messageView: {
        backgroundColor: "#36454F",
        paddingVertical: height / 100,
        paddingHorizontal: width / 25,
        borderRadius: height / 50,
    },
    messageText: {
        color: "white",
    },
    selfMessage: {
        backgroundColor: "#3b82f6",
        paddingVertical: height / 100,
        paddingHorizontal: width / 25,
        borderRadius: height / 50,
    },
    selfText: {
        color: "white",
    },
    avatarContainer: {
        alignItems: "center",
    },
    avatar: {
        width: width / 12,
        height: width / 12,
        borderRadius: 999,
    },
    placeholder: {
        backgroundColor: "#444",
        justifyContent: "center",
        alignItems: "center",
    },
});

export default GroupMessage;
