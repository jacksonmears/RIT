import React from 'react';
import { View } from 'react-native';
import { useLinkBuilder, useTheme } from '@react-navigation/native';
import { Text, PlatformPressable } from '@react-navigation/elements';
import { BottomTabBarProps, createBottomTabNavigator } from '@react-navigation/bottom-tabs';

function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
    const { colors } = useTheme();
    const { buildHref } = useLinkBuilder();

    return (
        <View style={{ flexDirection: 'row' }}>
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

                // Check if label is a function. If so, call it with the required props.
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

                return (
                    <PlatformPressable
                        key={route.key}
                        href={buildHref(route.name, route.params)}
                        accessibilityState={isFocused ? { selected: true } : {}}
                        accessibilityLabel={options.tabBarAccessibilityLabel}
                        testID={options.tabBarButtonTestID}
                        onPress={onPress}
                        onLongPress={onLongPress}
                        style={{ flex: 1 }}
                    >
                        <Text style={{ color: isFocused ? colors.primary : colors.text }}>
                            {renderedLabel}
                        </Text>
                    </PlatformPressable>
                );
            })}
        </View>
    );
}

export default TabBar;

// Example usage with createBottomTabNavigator:
// const MyTabs = createBottomTabNavigator();
// function MyTabsComponent() {
//   return (
//     <MyTabs.Navigator tabBar={(props) => <MyTabBar {...props} />}>
//       <MyTabs.Screen name="Home" component={HomeScreen} />
//       <MyTabs.Screen name="Profile" component={ProfileScreen} />
//     </MyTabs.Navigator>
//   );
// }
