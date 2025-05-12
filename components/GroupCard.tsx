import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import AntDesign from '@expo/vector-icons/AntDesign';

// Define the shape of a Group object
interface Group {
    id: string;
    name: string;
}

// Define props for GroupCard
interface GroupCardProps {
    group: Group;
}

const GroupCard: React.FC<GroupCardProps> = ({ group }) => {
    const router = useRouter();

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => {
                if (group.id) {
                    router.push({ pathname: "/groups/[groupID]", params: { groupID: group.id, groupName: group.name } });
                }
            }}
        >
            <View style={styles.info}>
                <Text style={styles.name}>{group.name}</Text>
                <TouchableOpacity onPress={() => router.push('/create')}>
                    <AntDesign name="videocamera" size={24} color="#D3D3FF" />

                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        // backgroundColor: "#1c1c1c",
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: "#D3D3FF",
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    info: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    name: {
        fontSize: 18,
        fontWeight: "bold",
        color: "white",
    },
    description: {
        fontSize: 14,
        color: "gray",
    },
});

export default GroupCard;
