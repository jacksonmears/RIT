import React from 'react';
import { Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import MainPost from '@/components/MainPost';

const { height } = Dimensions.get('window');

interface AnimatedPostProps {
    post: any;
    index: number;
    scrollY: SharedValue<number>;
    boxHeight: number;
}

export function AnimatedPost({ post, index, scrollY, boxHeight }: AnimatedPostProps) {
    const style = useAnimatedStyle(() => {
        // calculate the top of this post
        const rawTop = index * boxHeight + scrollY.value;
        // clamp it so it never goes above y = 0
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
            <MainPost post={post} />
        </Animated.View>
    );
}
