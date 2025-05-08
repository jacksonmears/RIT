import { Text, View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, TextInput, ActivityIndicator,Button } from "react-native";
import { useState } from "react";
import { auth } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, validatePassword } from "@firebase/auth";
import { FirebaseError } from "@firebase/util";
import { Link } from 'expo-router';

const Index = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);


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

            // Continue to your app’s home screen, etc.
        } catch (e: any) {
            const err = e as FirebaseError;
            alert('Sign in failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (

        <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">
                <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Email"
                    maxLength={256}
                />
                <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Password"
                maxLength={100}
                />
                {loading ? (
                    <ActivityIndicator size='small' style={{ margin:28 }} />
                ) : (
                    <>
                        <TouchableOpacity style={styles.si} onPress={signIn}>
                            <Text style={styles.siText}>Login</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.su}>
                            <Link href={"/signUp"}>
                                <Text style={styles.suText}>Create Account</Text>
                            </Link>
                        </TouchableOpacity>

                    </>
                )}
            </KeyboardAvoidingView>
        </View>

        )
};


const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        flex: 1,
        justifyContent: "center",
    },
    input: {
        marginVertical: 4,
        marginHorizontal: 40,
        borderWidth: 1,
        borderRadius: 4,
        padding: 20,
        backgroundColor: "white",
    },
    si: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    siText: {
        fontSize: 25,
        fontWeight: "bold",
        color: '#D3D3FF',
    },
    su: {
        alignSelf: "center",
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    suText: {
        fontSize: 15,
        fontWeight: "bold",
        color: "grey",
    }
})

export default Index;
