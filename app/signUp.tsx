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
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { auth, db } from '@/firebase';
import type { FirebaseAuthTypes } from '@react-native-firebase/auth';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

const { width, height } = Dimensions.get('window');

export default function SignUpPage() {
    const router = useRouter();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

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
                });

            await db()
                .collection('displayName')
                .doc(username.toLowerCase())
                .set({
                    uid: user.uid,
                    displayName: username,
                    lowerDisplayName: username.toLowerCase(),
                });

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
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
        >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ScrollView
                    contentContainerStyle={styles.container}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.row}>
                        <TextInput
                            style={[styles.input, styles.flex]}
                            placeholder="First Name"
                            value={firstName}
                            onChangeText={setFirstName}
                            maxLength={30}
                            keyboardType="default"
                            placeholderTextColor={"grey"}

                        />
                        <TextInput
                            style={[styles.input, styles.flex]}
                            placeholder="Last Name"
                            value={lastName}
                            onChangeText={setLastName}
                            maxLength={30}
                            keyboardType="default"
                            placeholderTextColor={"grey"}

                        />
                    </View>

                    <TextInput
                        style={styles.input}
                        placeholder="Username"
                        keyboardType="default"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                        maxLength={30}
                        placeholderTextColor={"grey"}

                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                        maxLength={256}
                        placeholderTextColor={"grey"}

                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                        maxLength={100}
                        placeholderTextColor={"grey"}

                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Confirm Password"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        maxLength={100}
                        placeholderTextColor={"grey"}

                    />

                    {loading ? (
                        <ActivityIndicator style={styles.loader} />
                    ) : (
                        <>
                            <TouchableOpacity style={styles.button} onPress={signUp}>
                                <Text style={styles.buttonText}>Create Account</Text>
                            </TouchableOpacity>
                            <View style={styles.loginRow}>
                                <Text style={styles.secondaryText}>Already have an account?</Text>
                                <TouchableOpacity onPress={() => router.back()}>
                                    <Text style={styles.linkText}>Log in</Text>
                                </TouchableOpacity>
                            </View>
                        </>
                    )}

                    {/* Optional bottom spacing to prevent keyboard overlap */}
                    <View style={{ height: 80 }} />
                </ScrollView>
            </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: 'black',
        padding: width * 0.1,
        justifyContent: 'flex-start',
    },
    row: {
        flexDirection: 'row',
        marginTop: height * 0.125,
    },
    loginRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
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
        color: 'black',
        fontSize: height * 0.02,
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
        marginLeft: width * 0.015,
    },
    loader: {
        marginVertical: height * 0.02,
    },
    secondaryText: {
        textAlign: 'center',
        marginTop: height * 0.01,
        color: 'grey',
    },
});
