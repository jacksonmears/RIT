import React, { useEffect, useRef } from "react";
import { StyleSheet, ActivityIndicator, Animated, Easing, Dimensions, View, Text } from "react-native";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from "expo-router";
const { width, height } = Dimensions.get("window");

const PostLoadingScreen = () => {
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const router = useRouter();

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(bounceAnim, {
                    toValue: -10,
                    duration: 500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.quad),
                }),
                Animated.timing(bounceAnim, {
                    toValue: 0,
                    duration: 500,
                    useNativeDriver: true,
                    easing: Easing.inOut(Easing.quad),
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.1,
                    duration: 700,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 700,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: false,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 2000,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        const timer1 = setTimeout(() => {
            router.replace("/create");
            const timer2 = setTimeout(() => {
                router.replace("/home");
            }, 10);
            return () => clearTimeout(timer2);
        }, 1500);

        return () => clearTimeout(timer1);
    }, []);


    const backgroundColor = fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#101010", "#202040"],
    });

    return (
        <Animated.View style={[styles.loadingContainer, { backgroundColor }]}>
            {/*<Animated.Text*/}
            {/*    style={{ color: "red", position: "absolute", top: height * 0.05, left: width * 0.1, fontSize: height / 50 }}*/}
            {/*    onPress={() => router.push("../home")}*/}
            {/*>*/}
            {/*    Back*/}
            {/*</Animated.Text>*/}

            <ActivityIndicator size="large" color="#D3D3FF" style={{ marginBottom: 30 }} />
            <Animated.Text style={[styles.loadingText, { transform: [{ scale: pulseAnim }] }]}>
                Sending your post...
            </Animated.Text>

            <Animated.View style={{ transform: [{ translateY: bounceAnim }], marginTop: 30 }}>
                <MaterialCommunityIcons name="rabbit" size={60} color="#D3D3FF" />
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        width,
        height,
    },
    loadingText: {
        color: "white",
        fontSize: 22,
        fontWeight: "600",
    },
});

export default PostLoadingScreen;
