import {View, Text, Image, StyleSheet, TouchableOpacity, Dimensions,TextInput, ActivityIndicator} from "react-native";
import {useLocalSearchParams, useRouter} from "expo-router";
import React, {useEffect, useState} from "react";
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Video from "react-native-video";

const { width, height } = Dimensions.get("window");

const Page = () => {
    const router = useRouter();
    const { fillerUri, fillerMode } = useLocalSearchParams();
    const localUri = String(fillerUri);
    const mode = String(fillerMode);
    const [caption, setCaption] = useState<string>("");
    const [remaingingCharacters, setRemaingingCharacters] = useState<number>(50);

    useEffect(() => {
        setRemaingingCharacters(50-caption.length);
    }, [caption])


    if (!fillerUri) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color="#D3D3FF" />
            </View>
        );
    }

    const uri = !localUri.startsWith("file://")
        ? `file://${localUri}`
        : localUri;



    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                <TouchableOpacity onPress={() => router.back()} >
                    <Text style={styles.backText}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => router.push({pathname: "/create/assignGroup", params: {fillerURI: uri, fillerMode: mode, fillerCaption: caption}})}>
                    <FontAwesome name="share" size={height/40} color="#D3D3FF" />
                </TouchableOpacity>
            </View>


            <View style={styles.imageWrapper}>
                {mode==="photo" ?
                    <Image
                        source={{ uri }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={(e) => console.error("Image load error", e.nativeEvent.error)}
                    />
                    :
                    <Video
                        source={{ uri }}
                        style={styles.video}
                        resizeMode="cover"
                        onError={(e) => console.error("Video load error", e)}
                    />
                }
            </View>

            <Text style={styles.remCharText}>{remaingingCharacters}</Text>

            <TextInput
                style={styles.captionText}
                value={caption}
                onChangeText={setCaption}
                autoCapitalize="none"
                keyboardType="default"
                placeholder="Add a caption..."
                placeholderTextColor={"white"}
                maxLength={50}
            />


        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width/20,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height/20
    },
    backText: {
        color: "white",
        fontSize: 16,
    },
    imageWrapper: {
        justifyContent: "center",
        alignItems: "center",
        marginVertical: height/100,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "#D3D3FF",
        width: width*0.8,
        height: height/1.7,
        marginLeft: width/9
    },
    image: {
        width: width*0.8,
        height: height/1.7,
        resizeMode: "cover",
        backgroundColor: "#222",
        borderRadius: height/100
    },
    video: {
        width: width*0.8,
        height: height/1.7,
        resizeMode: "cover",
        backgroundColor: "#222",
        borderRadius: height/100
    },
    captionText: {
        marginHorizontal: width/20,
        color: "white",
        paddingBottom: height/7
    },
    remCharText: {
        color: "grey",
        left: width*0.85,
    }

});

export default Page;
