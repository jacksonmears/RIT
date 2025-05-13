import {
    View,
    Text,
    Image,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    Modal,
    TouchableWithoutFeedback, Dimensions, StyleProp, ViewStyle
} from "react-native";
import { useRouter } from "expo-router";
import React, {useEffect, useState, useRef} from "react";
import {auth,db} from "@/firebase";
import AntDesign from "@expo/vector-icons/AntDesign";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";





interface TabCompProps {
    screen: string;
}



const newTabBar: React.FC<TabCompProps> = ({ screen }) => {
    const router = useRouter();
    const user = auth.currentUser;
    const {width, height} = Dimensions.get('window');
    const PRIMARY_COLOR = '#D3D3FF';
    const SECONDARY_COLOR = 'grey';

    console.log(screen)


    return (
        <View style={styles.tabBar}>
            <View style={styles.tabButton}>
                <AntDesign name="home" size={24} color={screen === "HOME" ? PRIMARY_COLOR : SECONDARY_COLOR} />

            </View>
            <View style={styles.tabButton}>
                <AntDesign name="search1" size={24} color={SECONDARY_COLOR} />

            </View>
            <View style={styles.tabButton}>
                <AntDesign name="plussquareo" size={24} color={SECONDARY_COLOR} />

            </View>
            <View style={styles.tabButton}>
                <AntDesign name="staro" size={24} color={SECONDARY_COLOR} />

            </View>
            <View style={styles.tabButton}>
                <MaterialCommunityIcons name="account-circle-outline" size={24} color={SECONDARY_COLOR} />

            </View>

        </View>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        flexDirection: "row",
        backgroundColor: "black",
        width: "100%",
        height: '8%',
        position: "absolute",
        bottom: 60,
        justifyContent: "space-between",
        alignItems: "center",
    },
    tabButton: {
        flex: 1,
        alignItems: "center",
        // borderRightWidth: 1,
        // borderColor: "#D3D3FF",
        height: '100%',
        justifyContent: "center",
    }

});

export default newTabBar;
