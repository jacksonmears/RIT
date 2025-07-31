import React, {useState, useRef, useEffect} from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    Animated,
    Dimensions, SafeAreaView
} from 'react-native';
import { useRouter } from 'expo-router'
import {
    Camera,
    CameraPermissionStatus,
    useCameraDevice,
    VideoFile,
    CameraCaptureError
} from "react-native-vision-camera";
import { useIsFocused , useFocusEffect } from '@react-navigation/native';
import Svg, {Circle} from "react-native-svg";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from "@expo/vector-icons/Feather";
import { Video } from 'react-native-compressor';
import { createThumbnail } from 'react-native-create-thumbnail';


const {width, height} = Dimensions.get('window');
const MAX_RECORDING_TIME = 300;

const Page = () => {
    const router = useRouter();
    const cameraReference = useRef<Camera>(null);
    const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus | null>();
    const [micPermission, setMicPermission] = useState<CameraPermissionStatus | null>();
    const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
    const device = useCameraDevice(cameraPosition);
    const [mode] = useState<"photo" | "video">("video");
    const isFocused = useIsFocused();
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [isRecording, setRecording] = useState<boolean>(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerReference = useRef<number | null>(null);
    const [isTimeExpired, setTimeExpired] = useState(false);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);


    useEffect(() => {
        if (isTimeExpired) {
            const endVideo = async () => {
                await handleRecordingPressed();
            }
            endVideo().catch();
        }

    }, [isTimeExpired]);



    useFocusEffect(
        React.useCallback(() => {
            setRecording(false);
            setRecordingTime(0);
            animatedValue.setValue(0);
            setTimeExpired(false);
            setIsCameraReady(false);

            return () => {
                if (cameraReference.current && isRecording)
                    cameraReference
                        .current
                        .stopRecording()
                        .catch(console.error);
                stopTimer();
            };
        }, [])
    );

    // permissions check before rendering camera!
    useEffect(() => {
        if (device && cameraPermission === 'granted' && micPermission === 'granted') {
            const timeout = setTimeout(() => setIsCameraReady(true), 300);
            return () => clearTimeout(timeout);
        } else {
            setIsCameraReady(false);
        }
    }, [isFocused, device, cameraPermission, micPermission]);

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


    const handleRecordingPressed = async () => {
        if (isRecording) {
            if (cameraReference.current)
                await cameraReference
                    .current
                    .stopRecording();

            await endRecording();
            setRecording(false);
        } else {
            beginRecording().catch();
            setRecording(true);
        }
    };



    const startTimer = async () => {
        if (!timerReference) return;
        setRecordingTime(0);
        stopTimer()
        timerReference.current = setInterval(() => {
            setRecordingTime(prev => {
                if (prev > MAX_RECORDING_TIME - 1) {
                    setTimeExpired(true);
                    return prev;
                }
                return prev + 1;
            });
        }, 1000);
    };

    const stopTimer = () => {
        if (timerReference.current) {
            clearInterval(timerReference.current);
            timerReference.current = null;
        }
    };


    const beginRecording =  async () => {
        if (!animatedValue || !cameraReference.current) return;
        await startTimer();



        const animations = ({val}: { val: any }) => {
            Animated.timing(val, {
                toValue: 1,
                duration: 300,
                useNativeDriver: false,
            }).start();
        }
        animations({val: animatedValue});

        handleVideoFile().catch(console.error);
    }

    const convertToMp4 = async (movPath: string): Promise<string> => {
        try {
            return await Video.compress(movPath, {
                compressionMethod: 'auto',
                minimumFileSizeForCompress: 1,
            });

        } catch (error) {
            console.error("Compression failed:", error);
            return movPath;
        }
    };


    const handleVideoFile = async () => {
        if (!cameraReference.current) return;

        try {
            cameraReference.current.startRecording({
                onRecordingFinished: async (videoFile: VideoFile) => {
                    setIsProcessing(true);

                    const mp4Path = await convertToMp4(videoFile.path);

                    try {
                        const thumbnail = await createThumbnail({
                            url: mp4Path,
                            timeStamp: 0,
                        });

                        setIsProcessing(false);

                        router.push({
                            pathname: '/create/editFile',
                            params: {
                                recapURI: mp4Path,
                                mode: mode,
                                thumbnailURI: thumbnail.path,
                            },
                        });

                    } catch (err) {
                        setIsProcessing(false);
                        console.error('Error creating thumbnail:', err);
                    }
                },

                onRecordingError: (error: CameraCaptureError) => {
                    setIsProcessing(false);
                    console.error('Recording error', error);},
            });
        } catch (e) {
            setIsProcessing(false);
            console.error(e);
        }
    };



    const endRecording = async () => {
        if (!animatedValue || !cameraReference.current) return;
        stopTimer();

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





    const switchCamera = () => {
        setCameraPosition((prev) => (prev === 'back' ? 'front' : 'back'))
    };



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


    const timeLeft = MAX_RECORDING_TIME - recordingTime;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;


    if (!device) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="red" />
                <Text>
                    Failed to connect to device. Please restart app.
                </Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>

            {isProcessing && (
                <View style={styles.processingOverlay}>
                    <ActivityIndicator size="large" color="#D3D3FF" />
                    <Text style={styles.processingText}>
                        Compressing video...
                    </Text>
                </View>
            )}

            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.push('/home')}>
                    <Feather name="x" size={height/30} color="#D3D3FF"/>
                </TouchableOpacity>
                {isRecording && (
                    <Text style={styles.timerText}>
                        {`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`}
                    </Text>
                )}
            </View>


            {isFocused && isCameraReady ? (
                    <View style={styles.cameraContainer}>
                        <Camera
                            key={`${cameraPosition}-${isCameraReady}`}  // Force remount when camera changes or ready toggles
                            ref={cameraReference}
                            style={styles.camera}
                            device={device}
                            isActive={true}
                            video={mode === "video"}
                            photo={mode === "photo"}
                            audio={true}
                        />
                    </View>
                ) :
                <View style={[styles.camera, styles.loadingContainer]}>
                    <Text style={styles.text}>
                        Loading camera...
                    </Text>
                </View>
            }



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
        </SafeAreaView>
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
        justifyContent: "space-between",
        marginHorizontal: width/10,
    },
    cameraContainer: {
        height: height/1.5,
        width: width,
        marginTop: 0
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
        width: width/400,
        height: height/900,
    },
    circleWrapper: {
        position: 'absolute',
        zIndex: 0,
    },
    timerText: {
        color: 'white',
        fontSize: height/50,
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'black',
    },

    processingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    processingText: {
        marginTop: 15,
        color: '#D3D3FF',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default Page;
