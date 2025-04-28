import {View, Text, Image, StyleSheet, TouchableOpacity, Platform, TextInput} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import React, {useEffect, useState} from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';

const PreviewPage = () => {
    const router = useRouter();
    const { fillerUri, fillerMode } = useLocalSearchParams();
    const localUri = String(fillerUri);
    const mode = String(fillerMode);
    const [caption, setCaption] = useState<string>("");

    // const displayUri =
    //     Platform.OS === "android" && !localUri.startsWith("file://")
    //         ? `file://${localUri}`
    //         : localUri;



    const uri =
        localUri.startsWith('file://')
            ? localUri
            : `file://${localUri}`;

    useEffect(() => {
        console.log("showing:", uri, mode);
    }, []);

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton} onPress={() => router.push({pathname: "/create/assignGroup", params: {fillerURI: localUri, fillerMode: mode, fillerCaption: caption}})}>
                <FontAwesome name="share" size={24} color="#D3D3FF" />
            </TouchableOpacity>
            <View style={styles.imageWrapper}>
                <Image
                    source={{ uri: uri }}
                    style={styles.image}
                    resizeMode="contain"
                    onError={(e) => console.error("Image load error", e.nativeEvent.error)}
                />
            </View>

            <TextInput
                style={styles.captionText}
                value={caption}
                onChangeText={setCaption}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="Add a caption..."
                placeholderTextColor={"white"}
            />


        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black"
    },
    imageWrapper: {
        justifyContent: "center",
        alignItems: "center",
        position: "relative",
        marginVertical: 10,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#D3D3FF",
        width: "75%",
        height: "50%",
        marginHorizontal: 50
    },
    image: {
        width: 320,
        height: 520,
        resizeMode: "cover",
        backgroundColor: "#222",
        borderRadius: 8
    },
    backButton: {
        marginTop: 10,
        marginLeft: 10,
    },
    backText: {
        color: "white",
        fontSize: 16,
    },
    captionText: {
        marginHorizontal: 15,
        color: "white",
    },
    shareButton: {
        position: "absolute",
        top: 10,
        right: 10,

    }
});

export default PreviewPage;
