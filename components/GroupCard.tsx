import { View, Text, Image, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

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
                    router.push({ pathname: "/groups/[groupID]", params: { groupID: group.id } });
                }
            }}
        >
            <View style={styles.info}>
                <Text style={styles.name}>{group.name}</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#1c1c1c",
        padding: 10,
        borderRadius: 10,
        marginBottom: 10,
    },
    image: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 10,
    },
    info: {
        flex: 1,
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
