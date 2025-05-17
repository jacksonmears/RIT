// pages/signUp.tsx
import React, { useState } from 'react';
import {
    Text,
    View,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '@/firebase';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function SignUpPage() {
    const router = useRouter();

    const [firstName, setFirstName] = useState<string>('');
    const [lastName, setLastName] = useState<string>('');
    const [username, setUsername] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [confirmPassword, setConfirmPassword] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);

    const signUp = async () => {
        if (password.length < 8) {
            Alert.alert('Error', 'Password must be at least 8 characters.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return;
        }
        if (!username.trim()) {
            Alert.alert('Error', 'Please choose a username.');
            return;
        }

        setLoading(true);
        try {
            const nameDoc = await db()
                .collection('displayName')
                .doc(username.toLowerCase())
                .get();
            if (nameDoc.exists()) {
                Alert.alert('Error', 'Username already taken.');
                return;
            }

            const cred: FirebaseAuthTypes.UserCredential =
                await auth().createUserWithEmailAndPassword(email.trim(), password);
            const user = cred.user;

            await user.updateProfile({ displayName: username });

            await db()
                .collection('users')
                .doc(user.uid)
                .set({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                    email: email.trim(),
                    displayName: username,
                    bio: '',
                    photoURL: null,
                    friendRequests: [],
                    groupRequests: [],
                    joined: db.FieldValue.serverTimestamp(),
                } as FirebaseFirestoreTypes.DocumentData);

            await db()
                .collection('displayName')
                .doc(username.toLowerCase())
                .set({
                    uid: user.uid,
                    displayName: username,
                } as FirebaseFirestoreTypes.DocumentData);

            await user.sendEmailVerification();
            Alert.alert(
                'Verify Your Email',
                'A verification link has been sent. Please check your inbox before logging in.'
            );

            router.replace('/');
        } catch (err: any) {
            console.error('Sign-up error:', err);
            Alert.alert('Sign-up failed', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.row}>
                <TextInput
                    style={[styles.input, styles.flex]}
                    placeholder="First Name"
                    value={firstName}
                    onChangeText={setFirstName}
                />
                <TextInput
                    style={[styles.input, styles.flex]}
                    placeholder="Last Name"
                    value={lastName}
                    onChangeText={setLastName}
                />
            </View>

            <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
            />

            <TextInput
                style={styles.input}
                placeholder="Email"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
            />

            <TextInput
                style={styles.input}
                placeholder="Password"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
            />
            <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
            />

            {loading ? (
                <ActivityIndicator style={styles.loader} />
            ) : (
                <>
                    <TouchableOpacity style={styles.button} onPress={signUp}>
                        <Text style={styles.buttonText}>Create Account</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={styles.linkText}>
                            Already have an account? Log in
                        </Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
        padding: width * 0.1,
        justifyContent: 'center',
    },
    row: {
        flexDirection: 'row',
        marginBottom: height * 0.02,
    },
    flex: {
        flex: 1,
        marginHorizontal: 4,
    },
    input: {
        backgroundColor: 'white',
        borderRadius: 6,
        padding: height * 0.02,
        marginBottom: height * 0.015,
    },
    button: {
        backgroundColor: '#D3D3FF',
        borderRadius: 6,
        alignItems: 'center',
        paddingVertical: height * 0.015,
        marginVertical: height * 0.02,
    },
    buttonText: {
        color: 'black',
        fontWeight: 'bold',
        fontSize: width * 0.045,
    },
    linkText: {
        color: '#D3D3FF',
        textAlign: 'center',
        marginTop: height * 0.01,
    },
    loader: {
        marginVertical: height * 0.02,
    },
});
