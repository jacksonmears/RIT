import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router'

const Page = () => {
    return (
        <View style={styles.container}>
            <Link href="/(tabs)/account">
                <Text style={styles.text}>Change Account Name</Text>
            </Link>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        color: 'white',
    }
});

export default Page;
