import { Text, View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, TextInput, ActivityIndicator,Button } from "react-native";
import { useState } from "react";
import { auth } from '@/firebase';
import { createUserWithEmailAndPassword, validatePassword } from "@firebase/auth";
import { FirebaseError } from "@firebase/util";
import { Link, useRouter } from "expo-router";

const Index = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const signUp = async () => {
        setLoading(true);

        // Password validation using Firebase's validatePassword method
        const status = await validatePassword(auth, password);

        if (!status.isValid) {
            let errorMessage = 'Password does not meet the required criteria: ';

            // Check each criterion and append a message if it's not fulfilled
            if (status.containsLowercaseLetter !== true) {
                errorMessage += 'at least one lowercase letter, ';
            }
            if (status.containsUppercaseLetter !== true) {
                errorMessage += 'at least one uppercase letter, ';
            }
            if (status.containsNumericCharacter !== true) {
                errorMessage += 'at least one digit, ';
            }
            if (status.containsNonAlphanumericCharacter !== true) {
                errorMessage += 'at least one special character, ';
            }
            if (status.meetsMinPasswordLength !== true) {
                errorMessage += 'at least 8 characters.';
            }
            if (status.meetsMaxPasswordLength !== true) {
                errorMessage += 'at most 4096 characters.';
            }


            alert(errorMessage);
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            alert('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert('Check your email');
            router.push('/');
        } catch (e: any) {
            const err = e as FirebaseError;
            alert('Registration Failed: ' + err.message);
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
                />
                <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholder="Password"
                />
                <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholder="Confirm Password"
                />
                {loading ? (
                    <ActivityIndicator size='small' style={{ margin:28 }} />
                ) : (
                    <>
                        <TouchableOpacity style={styles.su} onPress={signUp}>
                            <Text style={styles.suText}>Create Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.back}>
                            <Link href={"/"}>
                                <Text style={styles.backText}> Already Have an Account? </Text>
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
    su: {
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    suText: {
        fontSize: 25,
        fontWeight: "bold",
        color: "gold",
    },
    back: {
        borderRadius: 8,
        alignItems: 'center',
    },
    backText: {
        color: "grey",
    }
})

export default Index;
