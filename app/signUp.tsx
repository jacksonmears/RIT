import { Text, View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, TextInput, ActivityIndicator,Button } from "react-native";
import {useEffect, useState} from "react";
import {auth, db} from '@/firebase';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile,
    validatePassword
} from "@firebase/auth";
import { FirebaseError } from "@firebase/util";
import { Link, useRouter } from "expo-router";
import {deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const Index = () => {
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {

    }, [password]);

    const signUp = async () => {
        setLoading(true);

        try {
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

            const docRef = doc(db, "displayName", username);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                alert("Display name is already taken.");
                setLoading(false);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            await auth.currentUser?.reload(); // Reload user to ensure currentUser is updated
            const user = auth.currentUser;
            await handleUpdateProfile(user);



            // alert('Check your email');
            signIn()
            router.push('/');
        } catch (error: unknown) {
            if (error instanceof FirebaseError) {
                alert("Registration failed: " + error.message);
            } else {
                console.error("Unexpected error:", error);
            }
        }
        finally {
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

    const handleUpdateProfile = async (user: any) => {
        try {
            if (user) {
                const displayNameRef = doc(db, "displayName", username);
                const userRef = doc(db, "users", user.uid);
                await setDoc(doc(db, "users", user.uid), {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    displayName: username
                });
                await updateProfile(user, { displayName: username });
                await setDoc(displayNameRef, { uid: user.uid, displayName: username, lowerDisplayName: username.toLowerCase() });

                console.log('Profile updated successfully');
            } else {
                console.error('No user is logged in');
            }
        } catch (error) {
            console.error('Error updating profile', error);
        }
    };


    return (

        <View style={styles.container}>
            <KeyboardAvoidingView behavior="padding">
                <View style={styles.nameContainer}>
                    <TextInput
                        style={styles.firstName}
                        value={firstName}
                        onChangeText={setFirstName}
                        autoCapitalize="none"
                        keyboardType="default"
                        placeholder="First Name"
                    />
                    <TextInput
                        style={styles.lastName}
                        value={lastName}
                        onChangeText={setLastName}
                        autoCapitalize="none"
                        keyboardType="default"
                        placeholder="Last Name"
                    />
                </View>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    keyboardType="default"
                    placeholder="Username"
                />
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
                    secureTextEntry={true}
                    autoComplete="password"  // Add this for Android support
                    textContentType="password"  // Helps iOS recognize the field correctly
                    placeholder="Password"
                />
                <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={true}
                    autoComplete="password"  // Add this for Android support
                    textContentType="password"  // Helps iOS recognize the field correctly
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
    nameContainer: {
        flexDirection: "row",
        justifyContent: "space-between",

    },
    firstName: {
        flex: 1,
        marginVertical: 4,
        marginRight: 5,  // Add spacing between first and last name
        marginLeft: 40,
        borderWidth: 1,
        borderRadius: 4,
        padding: 20,
        backgroundColor: "white",
    },
    lastName: {
        flex: 1,
        marginVertical: 4,
        marginLeft: 5,  // Add spacing between first and last name
        marginRight: 40,
        borderWidth: 1,
        borderRadius: 4,
        padding: 20,
        backgroundColor: "white",
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
