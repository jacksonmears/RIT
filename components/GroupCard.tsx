import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
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

const {width, height} = Dimensions.get("window");

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
                    <AntDesign name="videocamera" size={height/33} color="#D3D3FF" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: "row",
        alignItems: "center",
        padding: width/20,
        borderRadius: width/40,
        marginBottom: height/100,
        borderWidth: width/400,
        borderColor: "#D3D3FF",
    },
    info: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    name: {
        fontSize: height/50,
        fontWeight: "bold",
        color: "white",
    },
    description: {
        fontSize: height/55,
        color: "gray",
    },
});

export default GroupCard;
