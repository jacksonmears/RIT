import React, { useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
} from 'react-native-reanimated';
import GroupCard from './GroupCard';

type Props = {
    item: { id: string; name: string };
    index: number;
};

const AnimatedGroupCard: React.FC<Props> = ({ item, index }) => {
    const translateY = useSharedValue(-100);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateY.value = -100;
        opacity.value = 0;

        translateY.value = withDelay(index * 100, withTiming(0, { duration: 750 }));
        opacity.value = withDelay(index * 100, withTiming(1, { duration: 750 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={animatedStyle}
            // entering={SlideInLeft.delay(index * 100).duration(300)}
        >
            <GroupCard group={item} />
        </Animated.View>
    );
};

export default AnimatedGroupCard;
