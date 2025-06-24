import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    TextInput,
} from 'react-native';
import {auth, db} from '@/firebase';
import {useLocalSearchParams, useRouter} from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const {width, height} = Dimensions.get('window');

export default function Page() {
    const user = auth().currentUser!;
    const router = useRouter();
    const { changingVisual, changingFirebase, rawInput } = useLocalSearchParams()
    const input = String(rawInput)
    const [change, setChange] = useState<string>(input as string);
    const [inputHeight, setInputHeight] = useState(40);

    const handleTextChange = (text: string) => {
        if (text.endsWith('\n')) {
            setChange(text + '\u200B');
        } else {
            setChange(text.replace(/\u200B$/, ''));
        }
    };


    const handleSubmit = async () => {
        if (change === input) return;

        try {
            await db()
                .collection("users")
                .doc(user.uid)
                .update({
                    [changingFirebase as string]: change
                });

            router.back();
        } catch (error) {
            console.error(error)
        }
        router.back();
    }

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back-ios-new" size={height/40} color="#D3D3FF" />
                </TouchableOpacity>
                <Text style={styles.topBarText}>Edit {changingVisual}</Text>
                {change.length === 0 || change == rawInput ?
                    <Text style={styles.doneTextBad}>Save</Text>
                    :
                    <TouchableOpacity onPress={() => handleSubmit()}>
                        <Text style={styles.doneTextGood}>Save</Text>
                    </TouchableOpacity>
                }

            </View>

            <View style={styles.inputBar}>
                <Text style={styles.changingValue}>{changingVisual}</Text>
                <TextInput
                    maxLength={256}
                    style={[styles.firstName, { height: Math.max(40, inputHeight) }]}
                    value={change}
                    onChangeText={handleTextChange}
                    onContentSizeChange={(e) =>
                        setInputHeight(e.nativeEvent.contentSize.height)
                    }
                    autoCapitalize="none"
                    keyboardType="default"
                    placeholderTextColor="#D3D3FF"
                    multiline={true}
                    scrollEnabled={false}
                />

            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    changingValue: {
        color: 'white',
        marginLeft: width / 18,
        marginTop: height / 200,
        fontSize: height / 60,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width/20,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height/18
    },
    topBarText: {
        color: "#D3D3FF",
        fontSize: height/50
    },
    backArrowName: {
        flexDirection: 'row',
        alignItems: "center",
    },
    inputBar: {
        margin: height/40,
        borderWidth: width/200,
        borderColor: "#D3D3FF",
        borderRadius: height/100,
        height: height/3,
    },
    firstName: {
        marginTop: height/200,
        marginBottom: height/100,
        marginLeft: width/25,
        borderWidth: height/1000,
        borderRadius: width/100,
        color: "#D3D3FF",
        fontSize: height/50
    },
    doneTextGood: {
        color: "#D3D3FF",
    },
    doneTextBad: {
        color: "grey"
    }
});
