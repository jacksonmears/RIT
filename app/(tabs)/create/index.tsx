import React, {useState, useRef, useEffect} from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Animated,
    Dimensions
} from 'react-native';
import { useRouter } from 'expo-router'
import {
    Camera,
    CameraPermissionStatus,
    useCameraDevices,
    VideoFile,
    CameraCaptureError
} from "react-native-vision-camera";
import { useIsFocused } from '@react-navigation/native';
import Svg, {Circle} from "react-native-svg";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from "@expo/vector-icons/Feather";

const {width, height} = Dimensions.get('window');

const Page = () => {
    const router = useRouter();
    const cameraRef = useRef<Camera>(null);
    const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus | null>();
    const [micPermission, setMicPermission] = useState<CameraPermissionStatus | null>();
    const devices = useCameraDevices();
    const [cameraDevice, setCameraDevice] = useState(devices.find(device => device.position === 'back'));
    const [mode] = useState<"photo" | "video">("video");
    const isFocused = useIsFocused();
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [isRecording, setRecording] = useState<boolean>(false);


    useEffect(() => {
        if (!isFocused && isRecording && cameraRef.current) {
            cameraRef.current.stopRecording().catch((err) => {
                console.error(err);
            });
            setRecording(false);
            animatedValue.setValue(0);
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


    const handleRecordVideo = async () => {
        if (!cameraRef.current) return;

        try {
            cameraRef.current.startRecording({
                onRecordingFinished: (videoFile: VideoFile) => {

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
        if (!cameraRef.current) return;
        await cameraRef.current.stopRecording();
    };


    const switchCamera = () => {
        const newDevice = cameraDevice?.position === 'back'
            ? devices.find(device => device.position === 'front')
            : devices.find(device => device.position === 'back');

        if (newDevice) {
            setCameraDevice(newDevice);
        }
    };


    const handleRecordingPressed = async () => {
        if (isRecording) {
            await handleStopVideo();
            await endRecording();
            setRecording(false);
        } else {
            beginRecording();
            await handleRecordVideo();
            setRecording(true);
        }
    };


    const endRecording = async () => {
        if (!animatedValue) return;

        try {
            const animations = (val: any) => {
                Animated.timing(val, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: false,
                }).start();
            }
            animations(animatedValue);
        } catch (e) {
            console.error(e);
        }

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


    // const handleTakePhoto = async () => {
    //     if (!cameraRef.current) return;
    //     try {
    //         const photo = await cameraRef.current.takePhoto();
    //         router.push({pathname: '/create/editFile', params: {fillerUri: photo?.path, fillerMode: mode}})
    //     } catch (error) {
    //         console.error(error);
    //     }
    // }

    // const switchMode = () => {
    //     (mode === "photo") ? setMode("video") : setMode("photo");
    //
    // }

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


            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.push('/home')}>
                    <Feather name="x" size={height/30} color="#D3D3FF" style={styles.backButton}/>
                </TouchableOpacity>
            </View>


            {isFocused && (
                <View style={styles.cameraContainer}>
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





            <TouchableOpacity style={styles.switchModeButton} onPress={() => switchCamera()}>
                <MaterialIcons name="cameraswitch" size={height/25} color="white" />
            </TouchableOpacity>


            <View style={styles.recordingButton}>
                <TouchableOpacity onPress={handleRecordingPressed}>
                    <View style={[styles.centerWrapper]}>
                        <Svg
                            height={width/3}
                            width={width/3}
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
                            style={[{backgroundColor, borderRadius,}, {width: size, height: size,},]}
                        />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    topBar: {
        flexDirection: "row",
        paddingVertical: height/40,
    },
    backButton: {
        marginLeft: width/15
    },
    cameraContainer: {
        height: height/1.5,
        width: width
    },
    camera: {
        flex: 1,
    },
    text: {
        color: 'white',
        textAlign: 'center',
        marginTop: height/50,
    },
    switchModeButton: {
        position: "absolute",
        bottom: height/14,
        right: width/10,
    },
    recordingButton: {
        position: 'absolute',
        left: width/2,
        bottom: height/10
    },
    centerWrapper: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 1,
        height: 1,
    },
    circleWrapper: {
        position: 'absolute',
        zIndex: 0,
    },
    backText: {
        color: 'black'
    }

});

export default Page;
