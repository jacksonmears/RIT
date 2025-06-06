import React from 'react';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
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

        return {
            position: 'absolute',
            top: clamped,
            left: 0,
            right: 0,
            zIndex: index,
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
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    }
})
