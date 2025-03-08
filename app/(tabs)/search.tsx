import {View, Text, Button, Pressable, TextInput, StyleSheet} from 'react-native';
import { auth } from '@/firebase';
import { useState } from 'react';

const Page = () => {
    const user = auth.currentUser;
    const [search, setSearch] = useState('');

    const handleSearch = async () => {

    }

    return (
        <View style={styles.container}>
            <Text> Search Page ! </Text>
            <TextInput
                style={styles.input}
                placeholder="friends name"
                placeholderTextColor="#ccc"
                value={search}
                onChangeText={setSearch} // Updates state
            />
            <Pressable onPress={handleSearch} style={styles.button}>
                <Text> Search for friends </Text>
            </Pressable>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    t: {
        color: "white",
    },
    input: {
        marginVertical: 4,
        marginHorizontal: 40,
        borderWidth: 1,
        borderRadius: 4,
        padding: 20,
        backgroundColor: "white",
        fontSize: 30,
    },
    button: {
        marginVertical: 4,
        marginHorizontal: 40,
        position: "absolute",
        backgroundColor: "white",
        borderRadius: 4,
        top: 50,
        left: 50,
    }
})

export default Page;
