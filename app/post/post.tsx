import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions,
    Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import Video from "react-native-video";

const { width, height } = Dimensions.get("window");


type PostParameters = {
    id: string;
    content: string;
    caption: string;
    mode: string;
    userID: string;
    displayName: string;
    pfp: string;
}

const Page = () => {
    const { id, content, caption, mode, userID, displayName, pfp } = useLocalSearchParams();
    const contentString = Array.isArray(content) ? content[0] : content || "";
    const displayNameString = String(displayName);
    const idString = String(id);
    const router = useRouter();
    const pfpString = String(pfp)
    const [videoUri, setVideoUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);



    const getSignedDownloadUrl = async (filename: string): Promise<string | undefined> => {
        try {
            const response = await fetch(`https://us-central1-recap-d22e0.cloudfunctions.net/getSignedDownloadUrl?filename=${filename}`);
            if (!response.ok) {
                const text = await response.text();
                console.error(`Failed to get signed download URL: ${response.status} ${text}`);
                return undefined;
            }
            const data = await response.json();
            return data.url;
        } catch (error) {
            console.error("Error fetching signed download URL:", error);
            return undefined;
        }
    };

    useEffect(() => {
        if (mode === "video" && idString) {
            const path = encodeURIComponent(`${idString}/content.mov`);
            getSignedDownloadUrl(path).then((url) => {
                if (url) {
                    setVideoUri(url);
                } else {
                    console.error("Failed to get signed URL, using fallback.");
                    setVideoUri(contentString); // fallback
                }
            });
        }
    }, [contentString, mode, idString]);

    return (
        <View style={styles.container}>
            <View style={styles.top70}>
                {mode === "photo" ? (
                    <Image
                        source={{ uri: contentString }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={(e) => console.error('Image load error', e.nativeEvent.error)}
                    />
                ) : videoUri ? (
                    <>
                        {loading && (
                            <Text style={{ color: 'white', position: 'absolute', top: 50 }}>Loading video...</Text>
                        )}
                        <Video
                            source={{ uri: videoUri }}
                            style={styles.videoContent}
                            resizeMode="cover"
                            repeat
                            controls
                            paused={false}
                            onLoadStart={() => setLoading(true)}
                            onLoad={() => setLoading(false)}
                            onError={(e) => {
                                console.error("Video failed to load", e);
                                setLoading(false);
                                Alert.alert("Error", "Video could not be loaded.");
                            }}
                        />
                    </>
                ) : (
                    <Text style={{ color: 'white' }}>Fetching video URL...</Text>
                )}
            </View>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.profileUser}>
                <View style={styles.upperProfile}>
                    <Image source={{ uri: pfpString }} style={styles.avatar} />
                    <Text style={styles.profileText}>{displayNameString}</Text>
                </View>
                <Text style={styles.profileCaption}>{caption}</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    top70: {
        height: height * 0.95,
        width: width,
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: width,
        height: height,
    },
    backButton: {
        position: 'absolute',
        top: height / 50,
        left: width / 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: width / 50,
        borderRadius: width / 50,
    },
    backText: {
        color: 'white',
        fontSize: height / 60,
    },
    videoContent: {
        backgroundColor: "grey",
        width: width,
        height: height,
    },
    profileUser: {
        position: 'absolute',
        bottom: height / 8,
        left: width / 20,
    },
    avatar: {
        width: width / 12,
        height: width / 12,
        borderRadius: 999,
    },
    upperProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileText: {
        color: "#D3D3FF",
        fontWeight: "bold",
        marginLeft: width / 50,
    },
    profileCaption: {
        color: "#D3D3FF",
        marginTop: height / 100
    }
});

export default Page;
