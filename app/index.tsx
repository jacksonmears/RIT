import { Text, View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Dimensions, TextInput, ActivityIndicator } from "react-native";
import { useState, useEffect } from "react";
import { auth } from '@/firebase';
import { signInWithEmailAndPassword } from "@firebase/auth";
import { FirebaseError } from "@firebase/util";
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get("window");

const Index = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();


    const signIn = async () => {
        setLoading(true);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (!user.emailVerified) {
                alert("Please verify your email before signing in.");
                await auth.signOut();
                return;
            }

        } catch (e: any) {
            const err = e as FirebaseError;
            alert('Sign in failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const renderButtons = () => (
        <View style={styles.buttonContainer}>
            <TouchableOpacity
                style={styles.loginButton}
                onPress={signIn}
                disabled={loading}
            >
                <Text style={styles.loginText}>Login</Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => router.push("/forgotPassword")}
                disabled={loading}
            >
                <Text style={styles.secondaryText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
                <Text style={styles.secondaryText}>Don't have an account? </Text>
                <TouchableOpacity
                    onPress={() => router.push("/signUp")}
                    disabled={loading}
                >
                    <Text style={styles.signupText}>Create Account</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">
                <TextInput
                    style={styles.input}
                    editable={!loading}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Email"
                    maxLength={256}
                />
                <TextInput
                    style={styles.input}
                    editable={!loading}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="Password"
                    maxLength={100}
                />
                {loading ? (
                    <ActivityIndicator size="small" style={styles.loader} />
                ) : (
                    renderButtons()
                )}
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        flex: 1,
        justifyContent: "center",
    },
    input: {
        marginVertical: height * 0.002,
        marginHorizontal: width * 0.1,
        borderRadius: width * 0.03,
        padding: height * 0.02,
        backgroundColor: "white",
    },
    loader: {
        margin: height * 0.05,
    },
    buttonContainer: {
        alignSelf: "center",
        alignItems: "center",
    },
    loginButton: {
        marginVertical: height * 0.01,
    },
    loginText: {
        fontSize: width * 0.06,
        fontWeight: "bold",
        color: "#D3D3FF",
    },
    secondaryText: {
        fontSize: width * 0.035,
        fontWeight: "bold",
        color: "grey",
    },
    signupContainer: {
        marginTop: height * 0.05,
        flexDirection: "row",
    },
    signupText: {
        fontSize: width * 0.035,
        fontWeight: "bold",
        color: "#D3D3FF",
    },
});

export default Index;
