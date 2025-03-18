import { View, Text, Button, StyleSheet } from 'react-native';
import { auth } from '@/firebase';
import {Link} from "expo-router";
import React from "react";

const Page = () => {
    const user = auth.currentUser;

    return (
        <View>
            <Text> Group Page ! </Text>
            <Link href="/(tabs)/groups/groupCreate" style={styles.add}>
                <Text style={styles.text}>create group</Text>
            </Link>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
        alignItems: "center",
        justifyContent: "center",
    },
    text: {
        fontSize: 20,
        fontWeight: "bold",
        color: "gold",
    },
    add: {
        position: "absolute",
        top: 0,
        right: 0,
    }
})

export default Page;
