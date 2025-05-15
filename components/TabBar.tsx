import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { Text, PlatformPressable } from '@react-navigation/elements';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import AntDesign from '@expo/vector-icons/AntDesign';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
const HIDDEN_ROUTES = ['create',];

function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { colors } = useTheme();
    const { buildHref } = useLinkBuilder();
    const primaryColor = '#D3D3FF';
    const secondaryColor = 'grey';
    const currentRoute = state.routes[state.index].name;

    if (HIDDEN_ROUTES.includes(currentRoute)) return null;


    // Define the icons with an explicit key union and a typed function.
    const icons: Record<
        'home' | 'search' | 'create' | 'groups' | 'account',
        (props: { color: string }) => JSX.Element
    > = {
        home: ({ color }) => <AntDesign name="home" size={24} color={color} />,
        search: ({ color }) => <AntDesign name="search1" size={24} color={color} />,
        create: ({ color }) => <AntDesign name="plussquareo" size={24} color={color} />,
        // groups: ({ color }) => <FontAwesome name="group" size={24} color={color} />,
        groups: ({ color }) => <AntDesign name="staro" size={24} color={color} />,
        account: ({ color }) => (<MaterialCommunityIcons name="account-circle-outline" size={24} color={color} />),
    };

    return (
        <View style={styles.tabbar}>
            {state.routes.map((route, index) => {
                const { options } = descriptors[route.key];
                const label =
                    options.tabBarLabel !== undefined
                        ? options.tabBarLabel
                        : options.title !== undefined
                            ? options.title
                            : route.name;

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

                let renderedLabel: React.ReactNode;
                if (typeof label === 'function') {
                    renderedLabel = label({
                        focused: isFocused,
                        color: isFocused ? colors.primary : colors.text,
                        position: 'below-icon', // adjust as needed
                        children: route.name,
                    });
                } else {
                    renderedLabel = label;
                }

                const iconKey = route.name as keyof typeof icons;
                const IconComponent = icons[iconKey];

                return (
                    <PlatformPressable
                        key={route.key}
                        style={styles.tabbarItem}
                        href={buildHref(route.name, route.params)}
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarButtonTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                    >
                        {IconComponent && IconComponent({ color: isFocused ? primaryColor: secondaryColor})}
                        {/*<Text style={{ color: isFocused ? primaryColor : secondaryColor, fontSize: 12}}>*/}
                        {/*    {renderedLabel}*/}
                        {/*</Text>*/}
                    </PlatformPressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    tabbar: {
        position: 'absolute',
        bottom: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'black',
        paddingVertical: 15,
    },
    tabbarItem: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 4
    },
});

export default TabBar;
