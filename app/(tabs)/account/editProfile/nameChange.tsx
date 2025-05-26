import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    TextInput,
} from 'react-native';
import { auth, db } from '@/firebase';
import { useLocalSearchParams, useRouter } from "expo-router";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width, height } = Dimensions.get('window');

export default function Page() {
    const user = auth().currentUser!;
    const router = useRouter();
    const { changingVisual, changingFirebase, rawInput } = useLocalSearchParams();
    const input = String(rawInput);
    const [change, setChange] = useState<string>(input);

    const handleSubmit = async () => {
        if (change === input) return;

        try {
            if (changingFirebase === "displayName") {
                const ref = db().collection("displayName").doc(change);
                const snapshot = await ref.get();

                if (!snapshot.exists) {
                    await db().collection("displayName").doc(input).delete();
                    await ref.set({
                        uid: user.uid,
                        displayName: change,
                        lowerDisplayName: change.toLowerCase(),
                    });
                    await user.updateProfile({
                        displayName: change,
                    })
                    await db().collection("users").doc(user.uid).update({
                        [changingFirebase as string]: change,
                    });
                } else {
                    alert("username already exists");
                    return;
                }
            } else {
                await db().collection("users").doc(user.uid).update({
                    [changingFirebase as string]: change,
                });
            }

            router.back();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back-ios-new" size={18} color="#D3D3FF" />
                </TouchableOpacity>
                <Text style={styles.topBarText}>Edit {changingVisual}</Text>
                {change.length === 0 ? (
                    <Text style={styles.doneTextBad}>Done</Text>
                ) : (
                    <TouchableOpacity onPress={handleSubmit}>
                        <Text style={styles.doneTextGood}>Done</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.inputBar}>
                <Text style={styles.test}>{changingVisual}</Text>
                <TextInput
                    maxLength={30}
                    style={styles.firstName}
                    value={change}
                    onChangeText={setChange}
                    autoCapitalize="none"
                    keyboardType="default"
                    placeholderTextColor="#D3D3FF"
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
    test: {
        color: 'white',
        marginLeft: width / 20,
        marginTop: height / 200,
        fontSize: height / 100,
    },
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: width/20,
        borderBottomWidth: height/1000,
        borderBottomColor: "grey",
        alignItems: 'center',
        height: height/20
    },
    topBarText: {
        color: "#D3D3FF",
    },
    inputBar: {
        margin: height / 50,
        borderWidth: width / 200,
        borderColor: "#D3D3FF",
        borderRadius: height / 100,
    },
    firstName: {
        marginTop: height / 200,
        marginBottom: height / 100,
        marginLeft: width / 20,
        borderWidth: height / 1000,
        borderRadius: width / 100,
        color: "#D3D3FF",
    },
    doneTextGood: {
        color: "#D3D3FF",
    },
    doneTextBad: {
        color: "grey",
    },
});
