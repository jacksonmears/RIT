import { Text, View, StyleSheet, TouchableOpacity, Dimensions,TextInput, ActivityIndicator } from "react-native";
import {useState} from "react";
import {auth, db} from '@/firebase';
import {
    createUserWithEmailAndPassword,
    updateProfile,
    validatePassword,
    sendEmailVerification
} from "@firebase/auth";
import { FirebaseError } from "@firebase/util";
import { useRouter } from "expo-router";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

const Index = () => {
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();


    const signUp = async () => {
        setLoading(true);

        try {
            const status = await validatePassword(auth, password);

            if (!status.isValid) {
                let errorMessage = 'Password does not meet the required criteria: ';

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

            await createUserWithEmailAndPassword(auth, email, password);
            await auth.currentUser?.reload();
            const user = auth.currentUser;
            await handleUpdateProfile(user);

            if (user) {
                await sendEmailVerification(user);
                alert('Verification email sent. Please check your inbox and verify before logging in.');
            }


            router.push('/')
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

    const handleUpdateProfile = async (user: any) => {
        try {
            if (user) {
                const displayNameRef = doc(db, "displayName", username);
                await setDoc(doc(db, "users", user.uid), {
                    firstName: firstName,
                    lastName: lastName,
                    email: email,
                    displayName: username,
                    bio: "",
                    photoURL: null,
                    friendRequests: [],
                    groupRequests: [],
                    joined: serverTimestamp()
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
                <View style={styles.nameContainer}>
                    <TextInput
                        maxLength={30}
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
                        maxLength={30}
                    />
                </View>
            <View style={styles.separator}></View>
                <TextInput
                    style={styles.input}
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                    keyboardType="default"
                    placeholder="Username"
                    maxLength={30}
                />
            <View style={styles.separator}></View>

            <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholder="Email"
                    maxLength={256}
                />
            <View style={styles.separator}></View>

            <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={true}
                    autoComplete="password"
                    textContentType="password"
                    placeholder="Password"
                    maxLength={100}

                />
            <View style={styles.separator}></View>

            <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={true}
                    autoComplete="password"
                    textContentType="password"
                    placeholder="Confirm Password"
                    maxLength={100}

                />
                {loading ? (
                    <ActivityIndicator size='small' style={{ margin:height/100*3 }} />
                ) : (
                    <>
                        <TouchableOpacity style={styles.su} onPress={signUp}>
                            <Text style={styles.suText}>Create Account</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
                            <Text style={styles.backText}> Already Have an Account? </Text>
                        </TouchableOpacity>



                    </>
                )}
        </View>

    )
};


const styles = StyleSheet.create({
    container: {
        backgroundColor: "black",
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    nameContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    separator: {
        marginVertical: height/300,
    },
    firstName: {
        flex: 1,
        marginRight: width/100,
        marginLeft: width/10,
        borderRadius: width/100,
        padding: height/45,
        backgroundColor: "white",
    },
    lastName: {
        flex: 1,
        marginLeft: width/100,
        marginRight: width/10,
        borderRadius: 4,
        padding: height/45,
        backgroundColor: "white",
    },
    input: {
        marginHorizontal: width/10,
        borderRadius: width/100,
        padding: height/45,
        backgroundColor: "white",
        width: width*0.8
    },
    su: {
        marginVertical: height/100*1.5,
        borderRadius: width/50,
        alignItems: 'center',
    },
    suText: {
        fontSize: height/40,
        fontWeight: "bold",
        color: '#D3D3FF',
    },
    back: {
        borderRadius: width/50,
        alignItems: 'center',
    },
    backText: {
        color: "grey",
        fontSize: height/70,
    }
})

export default Index;
