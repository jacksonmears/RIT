import { View, Text, Button } from 'react-native';
import { auth } from '@/firebase';

const Page = () => {
    const user = auth.currentUser;

    return (
        <View>
            <Text> Search Page ! </Text>
        </View>
    )
}

export default Page;
