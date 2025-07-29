import React, {useState} from 'react';
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
import {deleteDoc} from "@react-native-firebase/firestore";

const { width, height } = Dimensions.get('window');

export default function Page() {
    const user = auth().currentUser!;
    const router = useRouter();
    const { changeType, firebaseID, currentUserInformation } = useLocalSearchParams();
    const currentUserInformationString = String(currentUserInformation);
    const [userInput, setUserInput] = useState<string>(currentUserInformationString);
    const [inputHeight, setInputHeight] = useState(40);

    const handleTextChange = (inputText: string) => {
        if (inputText.endsWith('\n')) {
            setUserInput(inputText + '\u200B');
        } else {
            setUserInput(inputText.replace(/\u200B$/, ''));
        }
    };

    const handleSubmit = async () => {
        if (userInput === currentUserInformationString) return;

        try {
            if (firebaseID === "displayName") {
                const newDocumentReference = db
                    .collection("displayName")
                    .doc(userInput)

                const newDocumentReferenceSnapshot = await newDocumentReference.get();

                if (!newDocumentReferenceSnapshot.exists()) {
                    const oldDocumentReference = db
                        .collection("displayName")
                        .doc(currentUserInformationString);

                    await deleteDoc(oldDocumentReference);

                    await newDocumentReference.set({
                        uid: user.uid,
                        displayName: userInput,
                        lowerDisplayName: userInput.toLowerCase(),
                    });

                    await db.collection("users").doc(user.uid).update({
                        displayName: userInput,
                    })

                    await user.updateProfile({
                        displayName: userInput,
                    })
                }

                else {
                    alert("Username already exists!");
                    return;
                }

            }
            else {
                await db
                    .collection("users")
                    .doc(user.uid)
                    .update({
                    [firebaseID as string]: userInput,});
            }

            router.back();
        } catch (err) {
            console.error(err);
        }
        router.back();
    };

    return (
        <View style={styles.container}>
            <View style={styles.topBar}>
                <TouchableOpacity onPress={() => router.back()}>
                    <MaterialIcons name="arrow-back-ios-new" size={height/40} color="#D3D3FF" />
                </TouchableOpacity>

                <Text style={styles.topBarText}>
                    Edit {changeType}
                </Text>

                {userInput.length === 0 || userInput == currentUserInformationString ?
                    <Text style={styles.noUpdateToInput}>Save</Text>
                    :
                    <TouchableOpacity onPress={() => handleSubmit()}>
                        <Text style={styles.updateToInput}>Save</Text>
                    </TouchableOpacity>
                }

            </View>

            {changeType === "Bio" ? (
                <View style={styles.inputContainer}>
                    <Text style={styles.inputType}>
                        {changeType}
                    </Text>
                    <TextInput
                        maxLength={256}
                        style={[styles.inputText, { height: Math.max(40, inputHeight) }]}
                        value={userInput}
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
            ) :
                (
                <View style={styles.inputContainer}>
                    <Text style={styles.inputType}>
                        {changeType}
                    </Text>
                    <TextInput
                        maxLength={30}
                        style={styles.inputText}
                        value={userInput}
                        onChangeText={setUserInput}
                        autoCapitalize="none"
                        keyboardType="default"
                        placeholderTextColor="#D3D3FF"
                    />
                </View>
                )
            }

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    inputType: {
        color: 'white',
        marginLeft: width / 18,
        marginTop: height / 200,
        fontSize: height / 70,
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
        fontSize: height / 50
    },
    inputContainer: {
        margin: height / 50,
        borderWidth: width / 200,
        borderColor: "#D3D3FF",
        borderRadius: height / 100,
    },
    updateToInput: {
        color: "#D3D3FF",
        fontSize: height/60,
    },
    noUpdateToInput: {
        color: "grey",
        fontSize: height/60,
    },
    inputText: {
        marginTop: height/200,
        marginBottom: height/100,
        marginLeft: width/25,
        borderWidth: height/1000,
        borderRadius: width/100,
        color: "#D3D3FF",
        fontSize: height/50
    },
});
