import { StyleSheet, View, Text, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { useRouter } from "expo-router";
import React, { useState} from 'react';
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import auth from '@react-native-firebase/auth';

const { width, height } = Dimensions.get("window");

const Page = () => {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [isSent, setIsSent] = useState<boolean>(false);


    const sendResetPassword = async () => {
        try {
            await auth().sendPasswordResetEmail(email);
            setIsSent(true);
        } catch (error) {
            alert(error);
        }
    }


    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={() => router.push("/")} style={styles.topContainer}>
                <MaterialIcons name="arrow-back-ios-new" size={width*0.05} color="#D3D3FF" />
                <Text style={styles.backButtonText}>back</Text>
            </TouchableOpacity>
            <View style={styles.bottomContainer}>
                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText}>
                        Enter your email and we&apos;ll send you a link to get back into your account.
                    </Text>
                </View>
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Email"
                    maxLength={256}
                />
                <TouchableOpacity onPress={sendResetPassword} style={styles.sendButton}>
                    <Text style={styles.sendButtonText}>Send Link</Text>
                </TouchableOpacity>
                {isSent && (
                    <Text style={styles.linkSentText}>Email Sent to {email} !</Text>
                )}
            </View>

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
        alignItems: "center",
    },
    topContainer: {
      flexDirection: "row",
        position: "absolute",
        top: height*0.025,
        left: width*0.05,
        alignItems: "center",

    },
    backButtonText: {
        fontSize: width*0.05,
        color: "#D3D3FF",
    },
    bottomContainer: {
        top: height*0.3,
        alignItems: "center",
    },
    instructionsContainer: {
        width: width*0.55,
        alignItems: "center",
        marginBottom: height*0.01
    },
    instructionsText: {
      color: "grey",
      fontSize: width*0.035,
        textAlign: "center",
    },
    input: {
        marginHorizontal: width * 0.1,
        borderRadius: width * 0.03,
        padding: height * 0.02,
        backgroundColor: "white",
        width: width*0.75,
    },
    sendButton: {
        marginTop: height*0.035,
        alignItems: "center",
        paddingVertical: height*0.01,
        backgroundColor: "#D3D3FF",
        width: width*0.50,
    },
    sendButtonText: {
        fontSize: width*0.04,
        color: "black",
    },
    linkSentText: {
        fontSize: width*0.035,
        color: "grey"
    }
})

export default Page;
