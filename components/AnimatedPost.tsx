import React from 'react';
import Animated, {useAnimatedStyle, SharedValue, interpolate, Extrapolate} from 'react-native-reanimated';
import MainPost from '@/components/MainPost';
import {StyleSheet, View} from "react-native"
import {BannerAd, BannerAdSize, TestIds} from "react-native-google-mobile-ads";

interface AnimatedPostProps {
    post: any;
    index: number;
    scrollY: SharedValue<number>;
    postHeight: number;
    adHeight: number;
    personalizedAds: boolean;
}




export function AnimatedPost({ post, index, scrollY, postHeight, adHeight, personalizedAds }: AnimatedPostProps) {
    const style = useAnimatedStyle(() => {
        const chunksBefore = Math.floor(index / 2);
        const isAd        = index % 2 === 1;

        const rawTop =
            chunksBefore * (postHeight + adHeight)
            + (isAd ? postHeight : 0)
            + scrollY.value;
        const clamped = Math.max(rawTop, 0);

        const nextChunksBefore = Math.floor((index + 1) / 2);
        const isNextAd = (index + 1) % 2 === 1;

        const nextRawTop =
            nextChunksBefore * (postHeight + adHeight) +
            (isNextAd ? postHeight : 0) +
            scrollY.value;

        const nextClampedTop = Math.max(nextRawTop, 0);

        const fadeOpacity = interpolate(
            nextClampedTop,
            [0, 600],
            [0, 1],
            Extrapolate.CLAMP
        );

        return {
            position: 'absolute',
            top: clamped,
            left: 0,
            right: 0,
            zIndex: index,
            opacity: fadeOpacity,
        };
    });

    return (
        <Animated.View style={style}>
            {post ?
                <MainPost post={post} />
            :
                <View style={[styles.container, { height: adHeight}]}>
                    <BannerAd
                        unitId="ca-app-pub-8973563413624978/1838392908"
                        // unitId={TestIds.BANNER}
                        size={BannerAdSize.MEDIUM_RECTANGLE}
                        requestOptions={{ requestNonPersonalizedAdsOnly: !personalizedAds}}
                    />
                </View>
            }
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "rgb(211, 211, 255)",
        justifyContent: 'center',
        alignItems: 'center',
    }
})
