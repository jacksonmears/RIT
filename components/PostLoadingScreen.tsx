import React, { useEffect, useRef } from "react";
import { StyleSheet, ActivityIndicator, Animated, Easing } from "react-native";
import { Dimensions } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const { width, height } = Dimensions.get("window");

const PostLoadingScreen = () => {
    const bounceAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

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

    const backgroundColor = fadeAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["#101010", "#202040"],
    });

    return (
        <Animated.View style={[styles.loadingContainer, { backgroundColor }]}>
            <ActivityIndicator size="large" color="#D3D3FF" style={{ marginBottom: 30 }} />
            <Animated.Text style={[styles.loadingText, { transform: [{ scale: pulseAnim }] }]}>
                Sending your post...
            </Animated.Text>

            <Animated.View style={{ transform: [{ translateY: bounceAnim }], marginTop: 30 }}>
                {/*<Ionicons name="rocket-outline" size={60} color="#D3D3FF" />*/}
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
