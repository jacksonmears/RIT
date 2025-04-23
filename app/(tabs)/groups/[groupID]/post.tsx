import {
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect } from 'react';

export default function Page() {
    const { contentT } = useLocalSearchParams();
    const content = String(contentT);
    const router = useRouter();

    useEffect(() => {
        console.log('Loading image URL:', content);
    }, []);


    return (
        <View style={styles.container}>
            <View style={styles.top70}>
                <Image
                    source={{ uri: content }}
                    style={styles.image}
                    resizeMode="contain"
                    onError={(e) => console.error('Image load error', e.nativeEvent.error)}
                />
            </View>

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
            >
                <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
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
});
