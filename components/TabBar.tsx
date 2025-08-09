import React from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { useLinkBuilder} from '@react-navigation/native';
import { PlatformPressable } from '@react-navigation/elements';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
const HIDDEN_ROUTES = ['create',];

const { height, width } = Dimensions.get('window');

function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { buildHref } = useLinkBuilder();
    const primaryColor = '#D3D3FF';
    const secondaryColor = 'grey';
    const currentRoute = state.routes[state.index].name;

    if (HIDDEN_ROUTES.includes(currentRoute)) return null;


    const icons: Record<
        'home' | 'search' | 'create' | 'groups' | 'account',
        (props: { color: string }) => JSX.Element
    > = {
        home: ({ color }) => <AntDesign name="home" size={24} color={color} />,
        search: ({ color }) => <AntDesign name="search1" size={24} color={color} />,
        create: ({ color }) => <AntDesign name="plussquareo" size={24} color={color} />,
        groups: ({ color }) => <AntDesign name="staro" size={24} color={color} />,
        account: ({ color }) => (<MaterialCommunityIcons name="account-circle-outline" size={24} color={color} />),
    };

    return (
        <View style={styles.tabBar}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];

                const isFocused = state.index === index;

                const onPress = () => {
                    const event = navigation.emit({
                        type: 'tabPress',
                        target: route.key,
                        canPreventDefault: true,
                    });

                    if (!isFocused && !event.defaultPrevented) {
                        navigation.navigate(route.name, route.params);
                    }
                };

                const onLongPress = () => {
                    navigation.emit({
                        type: 'tabLongPress',
                        target: route.key,
                    });
                };


                const iconKey = route.name as keyof typeof icons;
                const IconComponent = icons[iconKey];

                return (
                    <PlatformPressable
                        key={route.key}
                        style={styles.tabBarItem}
                        href={buildHref(route.name, route.params)}
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarButtonTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                    >
                        {IconComponent && IconComponent({ color: isFocused ? primaryColor: secondaryColor})}
                    </PlatformPressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        position: 'absolute',
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'black',
        paddingVertical: height/60,
    },
    tabBarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: width/100
    },
});

export default TabBar;
