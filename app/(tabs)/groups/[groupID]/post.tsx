import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';
import Video from "react-native-video";

export default function Page() {
    const { idT, contentT, captionT, userNameT, mode, photoURL } = useLocalSearchParams();
    const content = String(contentT);
    const router = useRouter();
    const photoURLString = String(photoURL)

    useEffect(() => {
        console.log(content);
    }, []);


    return (
        <View style={styles.container}>
            <View style={styles.top70}>
                {mode==="photo" ?
                    <Image
                        source={{ uri: content }}
                        style={styles.image}
                        resizeMode="cover"
                        onError={(e) => console.error('Image load error', e.nativeEvent.error)}
                    />
                    :
                    <Video
                        source={{ uri: content }}
                        style={styles.videoContent}
                        resizeMode={'cover'}
                        repeat={true}
                    />
                }


            </View>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <View style={styles.profileUser}>
                <View style={styles.upperProfile}>
                    <Image source={{ uri: photoURLString }} style={styles.avatar} />
                    <Text style={styles.profileText}>{userNameT}</Text>
                </View>
                <Text style={styles.profileCaption}>{captionT}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    top70: {
        height: '95%',      // exactly 7/10 of the screen
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    image: {
        width: '100%',      // fill the container
        height: '100%',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 15,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: 8,
        borderRadius: 8,
    },
    backText: {
        color: 'white',
        fontSize: 16,
    },
    videoContent: {
        backgroundColor: "grey",
        width: "100%",
        resizeMode: "contain",
        height: '100%',
    },
    profileUser: {
        position: 'absolute',
        bottom: 45,
        left: 20,
        height: 100,
    },
    avatar: {
        width: 30,
        height: 30,
        borderRadius: 60,
    },
    upperProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileText: {
        color: "#D3D3FF",
        fontWeight: "bold",
        marginLeft: 10,
    },
    profileCaption: {
        color: "#D3D3FF",
        marginTop: 10
    }
});
