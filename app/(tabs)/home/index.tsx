import { View, Text, Button } from 'react-native';
import { useEffect, useState } from "react";
import { db, auth } from "@/firebase"
import { useRouter } from 'expo-router';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';

const Page = () => {
    const [userData, setUserData] = useState<Record<string, any> | null>(null);
    const user = auth.currentUser;
    const router = useRouter();

    useEffect(() => {
        console.log(user?.displayName);
        const checking = async() => {
            if (!user?.displayName) return;
            try {
                const docRef = doc(db, "displayName", user?.displayName);
                const docSnap = await getDoc(docRef);
                if (!user?.displayName || !docSnap.exists() || docSnap.data()?.uid !== user.uid){
                    router.push('/(tabs)/home/createAccount');
                }
            }
            catch (error) {
                console.error('Error updating profile', error);
            }
        }
        checking();
    }, [user]);

    return (
        <View>
            <Text>Welcome back {userData?.displayName}</Text>
            <Text>Welcome back {user?.uid}</Text>
            {/*<Button title="Sign Out" onPress={() => auth.signOut()} />*/}
        </View>
    )




}

export default Page;
