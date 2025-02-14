import { View, Text, Button } from 'react-native';
import { auth } from '@/firebase';

const Page = () => {
    const user = auth.currentUser;

    return (
        <View>
            <Text> Group Page ! </Text>
        </View>
    )
}

export default Page;
