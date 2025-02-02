import { Text, View, StyleSheet, KeyboardAvoidingView, TextInput, ActivityIndicator,Button } from "react-native";
import { useState } from "react";
import { auth } from '@/firebase';
import { createUserWithEmailAndPassword} from "@firebase/auth";
import { signInWithEmailAndPassword } from "@firebase/auth";
import { FirebaseError } from "@firebase/util";

const HomePage = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const signUp = async () => {
        setLoading(true);
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert ('Check your email');
        } catch (e: any) {
           const err = e as FirebaseError;
           alert('Registration Failed: ' + err.message);
        } finally {
            setLoading(false);
        }

    };

    const signIn = async () => {
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (e: any) {
            const err = e as FirebaseError;
            alert('Sign in failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    }

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
                <Text> Password </Text>
                <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="Password"
                />
                {loading ? (
                    <ActivityIndicator size='small' style={{ margin:28 }} />
                ) : (
                    <>
                        <Button onPress={signIn} title="Login"/>
                        <Button onPress={signUp} title="Create Account"/>
                    </>
                )}
            </KeyboardAvoidingView>
        </View>

        )
};


const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginHorizontal: 20,
        justifyContent: "center",
    },
    input: {
        marginVertical: 4,
        height: 50,
        borderWidth: 1,
        borderRadius: 4,
        padding: 20,
        backgroundColor: "white",

    }
})

export default HomePage;
