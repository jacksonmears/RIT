import { View, Text, Button } from 'react-native';
import { auth } from '@/firebase';

const Page = () => {
    const user = auth.currentUser;

    return (
        <View>
            <Text> Account Page ! </Text>
        </View>
    )
}

export default Page;
