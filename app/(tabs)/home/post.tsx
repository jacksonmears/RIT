import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import Video from "react-native-video";

const { width, height } = Dimensions.get("window");

const Page = () => {
    const { rawContent, rawCaption, rawUserName, rawMode, rawPhotoURL } = useLocalSearchParams();
    const content = String(rawContent);
    const userName = String(rawUserName);
    const caption = String(rawCaption);
    const router = useRouter();
    const photoURLString = String(rawPhotoURL)


    return (
        <View style={styles.container}>
            <View style={styles.top70}>
                {rawMode==="photo" ?
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
                    <Text style={styles.profileText}>{userName}</Text>
                </View>
                <Text style={styles.profileCaption}>{caption}</Text>
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
        height: height*0.95,
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
        top: height/50,
        left: width/20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: width/50,
        borderRadius: width/50,
    },
    backText: {
        color: 'white',
        fontSize: height/60,
    },
    videoContent: {
        backgroundColor: "grey",
        width: width,
        resizeMode: "contain",
        height: height,
    },
    profileUser: {
        position: 'absolute',
        bottom: height/8,
        left: width/20,
    },
    avatar: {
        width: width/12,
        height: width/12,
        borderRadius: 999,
    },
    upperProfile: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileText: {
        color: "#D3D3FF",
        fontWeight: "bold",
        marginLeft: width/50,
    },
    profileCaption: {
        color: "#D3D3FF",
        marginTop: height/100
    }
});

export default Page;
