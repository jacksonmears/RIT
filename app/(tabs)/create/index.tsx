import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
    Button,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Pressable,
    ActivityIndicator,
    Image,
    Animated, Dimensions
} from 'react-native';
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
import Svg, {Circle} from "react-native-svg";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
const {width, height} = Dimensions.get('window');

const Page = () => {
    const user = auth.currentUser;
    const router = useRouter();
    const cameraRef = useRef<Camera>(null);
    const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus | null>();
    const [micPermission, setMicPermission] = useState<CameraPermissionStatus | null>();
    // const [videoPath, setVideoPath] = useState<string | null>(null);
    const devices = useCameraDevices();
    const [cameraDevice, setCameraDevice] = useState(devices.find(device => device.position === 'back'));
    const [mode, setMode] = useState<"photo" | "video">("video");
    const [photo, setPhoto] = useState<PhotoFile | null>(null);
    const [video, setVideo] = useState<VideoFile | null>(null);
    const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
    const isFocused = useIsFocused();
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [isRecording, setRecording] = useState<boolean>(false);
    const TOP_OFFSET = height * 0.10;
    const BOTTOM_OFFSET = height * 0.20;

    useEffect(() => {
        if (!isFocused && isRecording) {
            cameraRef.current?.stopRecording();
            setRecording(false);
            animatedValue.setValue(0);
            setVideo(null);
        }
    }, [isFocused, isRecording]);




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

    const switchCamera = () => {
        const newDevice = cameraDevice?.position === 'back'
            ? devices.find(device => device.position === 'front')
            : devices.find(device => device.position === 'back');

        if (newDevice) {
            setCameraDevice(newDevice);
        }
    };

    const switchMode = () => {
        (mode === "photo") ? setMode("video") : setMode("photo");

    }

    const handleRecordingPressed = async () => {
        if (isRecording) {
            await handleStopVideo();
            endRecording();
            setRecording(false);
        } else {
            // START
            beginRecording();
            await handleRecordVideo();
            setRecording(true);
        }
    };




    const endRecording = async () => {
        if (!animatedValue) return;

        const animations = (val: any) => {
            Animated.timing(val, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
        animations(animatedValue);

    };

    const beginRecording =  () => {
        if (!animatedValue) return;

        const animations = ({val}: { val: any }) => {
            Animated.timing(val, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
        animations({val: animatedValue});

    }

    const backgroundColor = animatedValue?.interpolate({
        inputRange: [0, 1],
        outputRange: ['white', 'red'],
    });

    const borderRadius = animatedValue?.interpolate({
        inputRange: [0, 1],
        outputRange: [50, 10],
    });

    const size = animatedValue?.interpolate({
        inputRange: [0, 1],
        outputRange: [70, 35],
    });


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

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>

                {isFocused && (
                    <View style={[styles.cameraContainer, { top: TOP_OFFSET, bottom: BOTTOM_OFFSET}]}>
                        <Camera
                            key={mode}
                            ref={cameraRef}
                            style={styles.camera}
                            device={cameraDevice}
                            isActive={true}
                            video={mode === "video"}
                            photo={mode === "photo"}
                        />
                    </View>
                )}


                <TouchableOpacity style={styles.backButton} onPress={() => router.push("/home")}>
                    <Text style={styles.backText}>GO BACK</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.switchModeButton} onPress={() => switchCamera()}>
                    <MaterialIcons name="cameraswitch" size={36} color="white" />
                </TouchableOpacity>

                {/*{mode === 'photo' ?*/}
                {/*    <View style={styles.controls}>*/}
                {/*        <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>*/}
                {/*            <Text style={styles.buttonText}>Snap Pic</Text>*/}
                {/*        </TouchableOpacity>*/}
                {/*    </View>*/}
                {/*    :*/}
                {/*    <View style={styles.controls}>*/}
                {/*        <TouchableOpacity style={styles.button} onPress={handleRecordVideo}>*/}
                {/*            <Text style={styles.buttonText}>Record</Text>*/}
                {/*        </TouchableOpacity>*/}
                {/*        <TouchableOpacity style={styles.button} onPress={handleStopVideo}>*/}
                {/*            <Text style={styles.buttonText}>Stop</Text>*/}
                {/*        </TouchableOpacity>*/}
                {/*    </View>*/}
                {/*}*/}

                <View style={styles.recordingButton}>
                    <TouchableOpacity onPress={handleRecordingPressed}>
                        <View style={[styles.centerWrapper]}>

                            <Svg
                                height={width/3} // Adjust the size of the circle
                                width={width/3}  // Same size as the animated circle (you can modify it)
                                style={styles.circleWrapper}>
                                <Circle
                                    cx="50%"
                                    cy="50%"
                                    r={width/9}
                                    stroke="white"
                                    strokeWidth="5"
                                    fill="transparent"
                                />
                            </Svg>
                            <Animated.View
                                style={[
                                    {
                                        backgroundColor,
                                        borderRadius,
                                    },
                                    {
                                        width: size,
                                        height: size,
                                    },
                                ]}
                            />
                        </View>
                    </TouchableOpacity>
                </View>




            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    safeArea: {
        flex: 1,
    },
    camera: {
        flex: 1,
    },
    text: {
        color: 'white',
        textAlign: 'center',
        marginTop: 20,
    },
    switchModeButton: {
        position: "absolute",
        bottom: '8%',
        right: '10%',
    },
    recordingButton: {
        position: 'absolute',
        left: '50%',
        bottom: '10%'
    },
    centerWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 1, // max width of Animated.View
        height: 1, // max height of Animated.View
    },
    circleWrapper: {
        position: 'absolute',
        zIndex: 0, // Ensure the circle stays behind the animated button
    },
    cameraContainer: {
        position: 'absolute',
        top: '10%',
        height: '70%',
        width: '100%'

    },
    backButton: {
        position: 'absolute',
        left: '8%',
        top: '4%',
        backgroundColor: 'white'
    },
    backText: {
        color: 'black'
    }

});

export default Page;
