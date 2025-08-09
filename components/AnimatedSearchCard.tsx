import React, { useEffect } from 'react';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withTiming,
    withDelay,
} from 'react-native-reanimated';
import SearchCard from './SearchCard';

type Props = {
    item: any;
    index: number;
};

const AnimatedSearchCard: React.FC<Props> = ({ item, index }) => {
    const translateX = useSharedValue(-100);
    const opacity = useSharedValue(0);

    useEffect(() => {
        translateX.value = -100;
        opacity.value = 0;

        translateX.value = withDelay(index * 100, withTiming(0, { duration: 300 }));
        opacity.value = withDelay(index * 100, withTiming(1, { duration: 300 }));
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: translateX.value }],
        opacity: opacity.value,
    }));

    return (
        <Animated.View
            style={animatedStyle}
        >
            <SearchCard info={item} />
        </Animated.View>
    );
};

export default AnimatedSearchCard;
