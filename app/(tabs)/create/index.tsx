import React, {useState, useRef, useEffect} from 'react';
import {Button, StyleSheet, Text, TouchableOpacity, View, Pressable, ActivityIndicator, Image} from 'react-native';
import { useRouter } from 'expo-router'
import Video from 'react-native-video';
import {
    Camera,
    CameraPermissionStatus,
    CameraRuntimeError,
    useCameraDevices,
    VideoFile,
    CameraCaptureError, PhotoFile
} from "react-native-vision-camera";
import { auth, db } from '@/firebase';
import {SafeAreaView} from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';

const Page = () => {
    const user = auth.currentUser;
    const router = useRouter();
    const cameraRef = useRef<Camera>(null);
    const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus | null>();
    const [micPermission, setMicPermission] = useState<CameraPermissionStatus | null>();
    // const [videoPath, setVideoPath] = useState<string | null>(null);
    const devices = useCameraDevices();
    const cameraDevice = devices.find(device => device.position === 'back');
    const [mode, setMode] = useState<"photo" | "video">("video");
    const [photo, setPhoto] = useState<PhotoFile | null>(null);
    const [video, setVideo] = useState<VideoFile | null>(null);
    const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
    const isFocused = useIsFocused();

    // useEffect(() => {
    //     if (isFocused) {
    //         refresh()
    //     }
    // }, [isFocused]);

    useEffect(() => {
        console.log(photo?.path)
    }, [photo]);

    useEffect(() => {
        console.log(video?.path)
    }, [video]);

    useEffect(() => {
        (async () => {
            const camResult = await Camera.requestCameraPermission();
            const micResult = await Camera.requestMicrophonePermission();

            setCameraPermission(
                typeof camResult === "object" ? camResult : camResult
            );
            setMicPermission(
                typeof micResult === "object" ? micResult : micResult
            );
        })();
    }, []);

    const handleTakePhoto = async () => {
        if (!cameraRef.current) return;
        try {
            const photo = await cameraRef.current.takePhoto();
            setPhoto(photo);
            setVideo(null);
            setIsCameraActive(false);
            router.push({pathname: '/create/editFile', params: {fillerUri: photo?.path, fillerMode: mode}})
        } catch (error) {
            console.error(error);
        }
    }


    const handleRecordVideo = async () => {
        if (!cameraRef.current) return;

        try {
            cameraRef.current.startRecording({
                onRecordingFinished: (videoFile: VideoFile) => {
                    // 1️⃣ We immediately have the real video path
                    console.log("✅ recorded:", videoFile.path);

                    // 2️⃣ Stop the camera preview
                    setIsCameraActive(false);

                    // 3️⃣ Navigate with a guaranteed non-undefined path
                    router.push({
                        pathname: '/create/editFile',
                        params: {
                            fillerUri: videoFile.path,
                            fillerMode: mode,
                        },
                    });
                },
                onRecordingError: (error: CameraCaptureError) => {
                    console.error('Recording error', error);
                },
            });
        } catch (e) {
            console.error(e);
        }
    };

    const handleStopVideo = async () => {
        await cameraRef.current?.stopRecording();
    };

    const switchMode = () => {
        (mode === "photo") ? setMode("video") : setMode("photo");

    }


    if (!cameraDevice) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="red" />
            </View>
        );
    }
    if (cameraPermission !== 'granted' || micPermission !== 'granted') {
        return (
            <View style={styles.container}>
                <Text style={styles.text}>
                    Camera and/or microphone permission not granted
                </Text>
            </View>
        );
    }

    // 8) Everything’s ready — render the live camera + controls + preview
    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>

                <Camera
                    key={mode}
                    ref={cameraRef}
                    style={styles.camera}
                    device={cameraDevice}
                    isActive={isCameraActive}
                    video={mode === "video"}
                    photo={mode === "photo"}
                />

                <TouchableOpacity style={styles.switchModeButton} onPress={() => switchMode()}>
                    <Text>switch mode</Text>
                </TouchableOpacity>

                {mode === 'photo' ?
                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
                            <Text style={styles.buttonText}>Snap Pic</Text>
                        </TouchableOpacity>
                    </View>
                    :
                    <View style={styles.controls}>
                        <TouchableOpacity style={styles.button} onPress={handleRecordVideo}>
                            <Text style={styles.buttonText}>Record</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={handleStopVideo}>
                            <Text style={styles.buttonText}>Stop</Text>
                        </TouchableOpacity>
                    </View>
                }



                {/*{photo && (*/}
                {/*    <Image*/}
                {/*        source={{ uri: photo.path }}*/}
                {/*        style={styles.preview}*/}
                {/*        resizeMode="cover"*/}
                {/*    />*/}
                {/*)}*/}
                {/*{video && (*/}
                {/*    <View style={styles.videoContainer}>*/}
                {/*        <Video*/}
                {/*            source={{ uri: video.path }}*/}
                {/*            style={styles.video}*/}
                {/*            controls*/}
                {/*            resizeMode="contain"*/}
                {/*        />*/}
                {/*    </View>*/}
                {/*)}*/}
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'black' },
    safeArea: { flex: 1 },
    title: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        marginVertical: 12,
    },
    camera: { flex: 1 },
    controls: {
        position: 'absolute',
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 16,
        bottom: 100,

    },
    button: {
        backgroundColor: '#444',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },
    buttonText: { color: 'white' },
    videoContainer: { flex: 1, padding: 16 },
    video: { flex: 1 },
    text: {
        color: 'white',
        textAlign: 'center',
        marginTop: 20,
    },
    preview: {
        position: "absolute",
        bottom: 100,
        left: 20,
        right: 20,
        height: 200,
        borderRadius: 8,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#D3D3FF",
    },
    switchModeButton: {
        position: "absolute",
        backgroundColor: 'red',
        top: 50,
        left: 50,
    }

});

export default Page;
