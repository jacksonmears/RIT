import { View, Text, Image, StyleSheet, TouchableOpacity, Dimensions } from "react-native";
import { useRouter } from "expo-router";
import React from "react";

interface User {
    id: string;
    username: string,
    photoURL: string,
    firstName: string,
    lastName: string,
}

interface UserCompProps {
    info: User;
}

const { width, height } = Dimensions.get("window");

const SearchCard: React.FC<UserCompProps> = ({ info }) => {
    const router = useRouter();



    return (

        <TouchableOpacity style={styles.resultItem} onPress={() =>  router.push({ pathname: "/accountPage/account", params: { friendID: info.id }})}>
            <View style={styles.avatarView}>
                <Image source={{ uri: info.photoURL }} style={styles.avatar} />
                <View>
                    <Text style={styles.userNameText}>
                        {info.username}
                    </Text>
                    <Text style={styles.nameText}>
                        {info.firstName} {info.lastName}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    resultItem: {
        padding: height/75,
        flexDirection: 'row',
    },
    avatar: {
        marginLeft: width/15,
        width: width/10,
        height: width/10,
        borderRadius: 999,
        marginRight: width/40,
    },
    userNameText: {
        fontSize: height/55,
        color: 'white',
    },
    nameText: {
      color: 'grey',
      fontSize: height/75
    },
    avatarView: {
        flexDirection: 'row',
        alignItems: 'center',
    },

});

export default SearchCard;
