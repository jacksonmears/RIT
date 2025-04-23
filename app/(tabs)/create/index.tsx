import { CameraView, CameraType, useCameraPermissions, CameraMode } from 'expo-camera';
import { useState, useRef } from 'react';
import { Button, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { useRouter } from 'expo-router'
import { captureRef } from 'react-native-view-shot';

const Page = () => {
    const [permission, requestPermission] = useCameraPermissions();
    const ref = useRef<CameraView>(null);
    const [uri, setUri] = useState<string | undefined>(undefined);
    const [mode, setMode] = useState<CameraMode>("picture");
    const [facing, setFacing] = useState<CameraType>("front");
    const [recording, setRecording] = useState(false);
    const [cameraReady, setCameraReady] = useState(false);
    const router = useRouter();

    if (!permission) {
        return null;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={{ textAlign: "center" }}>
                    We need your permission to use the camera
                </Text>
                <Button onPress={requestPermission} title="Grant permission" />
            </View>
        );
    }

    const takePicture = async () => {
        if (!ref || !cameraReady) return;
        const photo = await ref.current?.takePictureAsync();
        setUri(photo?.uri);
        router.push({pathname: '/create/assignGroup', params: {fillerUri: photo?.uri, fillerMode: mode}})
    };

    const recordVideo = async () => {
        if (recording) {
            setRecording(false);
            ref.current?.stopRecording();
            return;
        }
        setRecording(true);
        const video = await ref.current?.recordAsync();
        console.log({ video });
    };

    const toggleMode = () => {
        setMode((prev) => (prev === "picture" ? "video" : "picture"));
    };

    const toggleFacing = () => {
        setFacing((prev) => (prev === "back" ? "front" : "back"));
    };


    const renderPicture = () => {
        return (
            <View>
            </View>
        );
    };

    const renderCamera = () => {
        return (
            <View style={{ flex: 1 }}>
                <CameraView
                    style={StyleSheet.absoluteFill}
                    ref={ref}
                    mode={mode}
                    facing={facing}
                    mute={false}
                    onCameraReady={() => setCameraReady(true)}
                    responsiveOrientationWhenOrientationLocked
                >
                    <View style={styles.shutterContainer}>
                        <Pressable onPress={toggleMode} />
                        <Pressable onPress={mode === "picture" ? takePicture : recordVideo}>
                            {({ pressed }) => (
                                <View
                                    style={[
                                        styles.shutterBtn,
                                        { opacity: pressed ? 0.5 : 1 },
                                    ]}
                                >
                                    <View
                                        style={[
                                            styles.shutterBtnInner,
                                            {
                                                backgroundColor:
                                                    mode === "picture" ? "white" : "red",
                                            },
                                        ]}
                                    />
                                </View>
                            )}
                        </Pressable>
                        <Pressable onPress={toggleFacing} />
                    </View>
                </CameraView>
            </View>
        );
    };


    return (
        <View style={styles.container}>
            {uri ? renderPicture() : renderCamera()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    camera: {
        flex: 1,
        width: "100%",
    },
    shutterContainer: {
        position: "absolute",
        bottom: 44,
        left: 0,
        width: "100%",
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 30,
    },
    shutterBtn: {
        backgroundColor: "transparent",
        borderWidth: 5,
        borderColor: "white",
        width: 85,
        height: 85,
        borderRadius: 45,
        alignItems: "center",
        justifyContent: "center",
    },
    shutterBtnInner: {
        width: 70,
        height: 70,
        borderRadius: 50,
    },
});

export default Page;

