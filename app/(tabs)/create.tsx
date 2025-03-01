import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import { auth } from '@/firebase';
import { Camera, getCameraDevice, useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

const Page = () => {
    const user = auth.currentUser;
    const cameraRef = useRef<Camera>(null);
    const [snapshotPath, setSnapshotPath] = useState<string | null>(null);
    const [device, setDevice] = useState<any>(null);
    const { hasPermission: cameraHasPermission, requestPermission: requestCameraPermission } = useCameraPermission();
    const { hasPermission: micHasPermission, requestPermission: requestMicPermission } = useMicrophonePermission();



    useEffect(() => {
        const fetchDevices = async () => {
            if (!cameraHasPermission || !micHasPermission) {
                const permission1 = await requestCameraPermission();
                const permission2 = await requestMicPermission();
                if (!permission1 || !permission2) {
                    console.error('Camera permission not granted.');
                    return;
                } else {
                    console.log('Camera permission granted.');
                }
            }
            const availableDevices = await Camera.getAvailableCameraDevices();
            const backDevice = getCameraDevice(availableDevices, 'back');
            if (!backDevice) {
                console.error('No back camera found.');
            }
            setDevice(backDevice);
        };

        fetchDevices();
    }, [cameraHasPermission, requestCameraPermission, micHasPermission, requestMicPermission]);


    const takePhoto = async () => {
        if (!cameraRef.current) {
            console.error('Camera ref is not available');
            return;
        }
        try {
            const photo = await cameraRef.current.takePhoto({});
            console.log('Snapshot saved to:', photo.path);
            setSnapshotPath(photo.path);
        } catch (error) {
            console.error('Error taking snapshot:', error);
        }
    };

    if (!device) {
        return (
            <View style={styles.container}>
                <Text>Loading camera device...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Camera
                ref={cameraRef}
                device={device}
                isActive={true}
                photo={true}
                style={StyleSheet.absoluteFill}
            />
            <Pressable style={styles.permissionButton} onPress={takePhoto}>
                <Text style={styles.text}>Take Image</Text>
            </Pressable>
            {snapshotPath && <Text>Photo saved at: {snapshotPath}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    permissionButton: {
        position: 'absolute',
        top: 50,
        left: 50,
        backgroundColor: 'black',
        padding: 10,
        borderRadius: 5,
    },
    text: {
        color: 'white',
    },
});

export default Page;
